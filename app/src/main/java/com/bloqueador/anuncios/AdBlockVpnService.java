package com.bloqueador.anuncios;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.ServiceInfo;
import android.net.ConnectivityManager;
import android.net.Network;
import android.net.NetworkCapabilities;
import android.net.NetworkRequest;
import android.net.VpnService;
import android.os.Build;
import android.os.ParcelFileDescriptor;

import java.io.ByteArrayOutputStream;
import java.io.DataInputStream;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.DatagramPacket;
import java.net.DatagramSocket;
import java.net.InetAddress;
import java.net.InetSocketAddress;
import java.net.Socket;
import java.nio.charset.StandardCharsets;
import java.util.Arrays;
import java.util.HashSet;
import java.util.Iterator;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.atomic.AtomicInteger;

import javax.net.ssl.SSLSocket;
import javax.net.ssl.SSLSocketFactory;

/** Servicio VPN v5.0: WiFi + Datos Móviles, bloqueo DNS/SNI, sello IPv6 y DoT/DoH. */
public class AdBlockVpnService extends VpnService {

    public static final String ACTION_START = "com.bloqueador.anuncios.START";
    public static final String ACTION_STOP = "com.bloqueador.anuncios.STOP";
    public static final String ACTION_RELOAD = "com.bloqueador.anuncios.RELOAD";

    public static final AtomicInteger DNS_BLOCKED = new AtomicInteger();
    public static final AtomicInteger SNI_BLOCKED = new AtomicInteger();
    public static final AtomicInteger QUIC_DROPPED = new AtomicInteger();
    public static final AtomicInteger DOT_DROPPED = new AtomicInteger();
    public static final AtomicInteger PACKETS_READ = new AtomicInteger();
    public static final AtomicInteger ENCRYPTED_CUT = new AtomicInteger();
    public static final AtomicBoolean SERVICE_RUNNING = new AtomicBoolean(false);

    private static final String[] META_ROUTES = {
        "157.240.0.0", "31.13.0.0", "185.60.216.0",
        "129.134.0.0", "179.60.192.0"
    };
    private static final String[] META_APPS = {
        "com.facebook.katana", "com.facebook.orca", "com.facebook.lite",
        "com.instagram.android", "com.whatsapp", "com.whatsapp.w4b",
        "com.facebook.appmanager", "com.facebook.services", "com.facebook.system"
    };
    private static final java.util.List<String> RECENT =
            new java.util.concurrent.CopyOnWriteArrayList<>();

    private static final String[] RESOLVER_IPS = {
        "1.1.1.1", "1.0.0.1", "1.1.1.2", "1.0.0.2", "1.1.1.3", "1.0.0.3",
        "8.8.8.8", "8.8.4.4", "9.9.9.9", "149.112.112.112",
        "208.67.222.222", "208.67.220.220", "64.6.64.6", "64.6.65.6",
        "185.228.168.9", "185.228.169.9", "76.76.19.19", "95.85.95.85",
        "94.140.14.140", "94.140.14.141", "45.90.28.0", "45.90.30.0",
        "185.222.222.222", "194.242.2.2", "194.242.2.3"
    };
    private static final Set<Integer> RESOLVER_INT_SET = buildResolverSet();

    private static Set<Integer> buildResolverSet() {
        Set<Integer> s = new HashSet<>();
        for (String ip : RESOLVER_IPS) {
            try { s.add(PacketUtils.ipToInt(ip)); } catch (Exception ignored) {}
        }
        for (String ip : DnsProviders.allIps()) {
            try { s.add(PacketUtils.ipToInt(ip)); } catch (Exception ignored) {}
        }
        return s;
    }

    private static final String CHANNEL_ID = "bloqueo_anuncios_channel";
    private static final String CHANNEL_ALERTS_ID = "bloqueo_alertas_channel";
    private static final int NOTIF_ID = 1001;
    private static final String DNS_IP = "10.233.233.1";
    private static final String CLIENT_IP = "10.233.233.2";
    private static final String CLIENT_IP6 = "fd00:233::2";
    private static final int MSS = 1220;

    private ParcelFileDescriptor vpnFd;
    private FileInputStream input;
    private FileOutputStream output;
    private final Object outLock = new Object();
    private volatile boolean running = false;
    private volatile long lastAlertAt = 0;
    private Thread readerThread;
    private ConnectivityManager cm;
    private ConnectivityManager.NetworkCallback netCallback;
    private volatile long activeNetHandle = -1;
    private final android.os.Handler notifHandler =
            new android.os.Handler(android.os.Looper.getMainLooper());
    private final Runnable notifTicker = new Runnable() {
        @Override public void run() {
            if (!running) return;
            try {
                NotificationManager nm =
                        (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
                if (nm != null) nm.notify(NOTIF_ID, notification(true));
            } catch (Exception ignored) {}
            notifHandler.postDelayed(this, 2000);
        }
    };

    private final ConcurrentHashMap<String, TcpConn> tcpMap = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<String, UdpFlow> udpFlows = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<Integer, ClientInfo> dnsClients = new ConcurrentHashMap<>();
    private final AtomicInteger nextDnsId = new AtomicInteger(100);
    private final AtomicInteger udpMisses = new AtomicInteger(0);
    private volatile DatagramSocket dnsUpstream;
    private Thread dnsReaderThread;
    private ExecutorService dnsExecutor;

    private Blocklist.RuleSet rules;
    private boolean sniMode;
    private boolean blockQuic;
    private boolean blockDot;
    private boolean metaBlock;
    private boolean notifyBlocks;
    private String upstreamPrimary = "76.76.2.32";
    private String upstreamSecondary = "76.76.10.32";
    private String upstreamDotHost = "x-oisd.freedns.controld.com";
    private volatile boolean useSecondary = false;
    private volatile boolean useEncryptedDns = false;

    private static final class ClientInfo {
        final int ip;
        final int port;
        final int dnsIp;
        final int origId;
        final long ts;

        ClientInfo(int ip, int port, int dnsIp, int origId) {
            this.ip = ip;
            this.port = port;
            this.dnsIp = dnsIp;
            this.origId = origId;
            this.ts = System.currentTimeMillis();
        }
    }

    @Override
    public void onCreate() {
        super.onCreate();
        createChannel();
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        String action = intent == null ? null : intent.getAction();
        if (ACTION_STOP.equals(action)) {
            stopVpn();
            return START_NOT_STICKY;
        }
        if (ACTION_RELOAD.equals(action)) {
            rules = Blocklist.load(this);
            SharedPreferences p = getSharedPreferences(Blocklist.PREFS, MODE_PRIVATE);
            notifyBlocks = p.getBoolean(Blocklist.KEY_NOTIFY_BLOCKS, true);
            return START_STICKY;
        }
        startVpn();
        return START_STICKY;
    }

    private void createChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationManager nm =
                    (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
            if (nm == null) return;
            NotificationChannel ch = new NotificationChannel(CHANNEL_ID,
                    getString(R.string.channel_name), NotificationManager.IMPORTANCE_LOW);
            ch.setDescription(getString(R.string.channel_desc));
            ch.setShowBadge(false);
            nm.createNotificationChannel(ch);

            NotificationChannel alerts = new NotificationChannel(CHANNEL_ALERTS_ID,
                    "Alertas de anuncios bloqueados", NotificationManager.IMPORTANCE_DEFAULT);
            alerts.setDescription("Muestra avisos cuando se bloquea un anuncio en juegos");
            alerts.setSound(null, null);
            alerts.enableVibration(false);
            nm.createNotificationChannel(alerts);
        }
    }

    private Notification notification(boolean active) {
        Intent i = new Intent(this, MainActivity.class);
        int fl = PendingIntent.FLAG_UPDATE_CURRENT;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) fl |= PendingIntent.FLAG_IMMUTABLE;
        PendingIntent pi = PendingIntent.getActivity(this, 0, i, fl);
        Notification.Builder b;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            b = new Notification.Builder(this, CHANNEL_ID);
        } else {
            b = new Notification.Builder(this);
        }
        String txt = active
                ? "LLAVE VPN ACTIVA · " + (DNS_BLOCKED.get() + SNI_BLOCKED.get())
                        + " bloqueados | " + PACKETS_READ.get() + " paquetes"
                : "Protección detenida";
        b.setSmallIcon(R.drawable.ic_stat_shield)
                .setContentTitle("Adblock Gamer Pro v5.0")
                .setContentText(txt)
                .setContentIntent(pi)
                .setOngoing(active)
                .setOnlyAlertOnce(true);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            b.setCategory(Notification.CATEGORY_SERVICE)
                    .setVisibility(Notification.VISIBILITY_PUBLIC);
        }
        return b.build();
    }

    private void startVpn() {
        if (running) return;
        SharedPreferences p = getSharedPreferences(Blocklist.PREFS, MODE_PRIVATE);
        rules = Blocklist.load(this);
        sniMode = p.getBoolean(Blocklist.KEY_SNI_MODE, true);
        blockQuic = p.getBoolean(Blocklist.KEY_BLOCK_QUIC, true);
        blockDot = p.getBoolean(Blocklist.KEY_BLOCK_DOT, true);
        metaBlock = p.getBoolean(Blocklist.KEY_META_BLOCK, true);
        notifyBlocks = p.getBoolean(Blocklist.KEY_NOTIFY_BLOCKS, true);
        DnsProviders.Provider prov = DnsProviders.get(
                p.getInt(Blocklist.KEY_DNS_PROVIDER, DnsProviders.DEFAULT));
        upstreamPrimary = prov.primary;
        upstreamSecondary = prov.secondary.isEmpty() ? prov.primary : prov.secondary;
        upstreamDotHost = prov.dotHost == null ? "" : prov.dotHost;
        useSecondary = false;
        useEncryptedDns = false;
        udpMisses.set(0);

        try {
            VpnService.Builder builder = new VpnService.Builder()
                    .setSession(getString(R.string.app_name))
                    .addAddress(CLIENT_IP, 24)
                    .addAddress(CLIENT_IP6, 64)
                    .setMtu(1280)
                    .addDnsServer(DNS_IP);

            // Sella fugas IPv6 capturando todo ::/0 dentro de tun0.
            builder.addRoute("::", 0);

            if (sniMode) {
                builder.addRoute("0.0.0.0", 0);
            } else {
                builder.addRoute(DNS_IP, 32);
                for (String rip : RESOLVER_IPS) builder.addRoute(rip, 32);
                for (String rip : DnsProviders.allIps()) builder.addRoute(rip, 32);
            }

            if (metaBlock) {
                for (String ip : META_ROUTES) {
                    try { builder.addRoute(ip, 16); } catch (Exception ignored) {}
                }
                for (String pkg : META_APPS) {
                    try { builder.addDisallowedApplication(pkg); } catch (Exception ignored) {}
                }
            }

            builder.addDisallowedApplication(getPackageName());
            vpnFd = builder.establish();
            if (vpnFd == null) throw new IOException("No se pudo crear la VPN");

            input = new FileInputStream(vpnFd.getFileDescriptor());
            output = new FileOutputStream(vpnFd.getFileDescriptor());
            running = true;
            SERVICE_RUNNING.set(true);

            if (Build.VERSION.SDK_INT >= 34) {
                startForeground(NOTIF_ID, notification(true),
                        ServiceInfo.FOREGROUND_SERVICE_TYPE_SPECIAL_USE);
            } else {
                startForeground(NOTIF_ID, notification(true));
            }

            dnsExecutor = Executors.newFixedThreadPool(6);
            initDnsUpstream();
            registerNetworkWatcher();
            notifHandler.post(notifTicker);
            readerThread = new Thread(this::readLoop, "VpnReader");
            readerThread.start();
        } catch (Exception e) {
            CrashLogger.log(this, e);
            running = false;
            SERVICE_RUNNING.set(false);
            stopForeground(true);
            stopSelf();
        }
    }

    private void registerNetworkWatcher() {
        try {
            cm = (ConnectivityManager) getSystemService(Context.CONNECTIVITY_SERVICE);
            if (cm == null) return;
            netCallback = new ConnectivityManager.NetworkCallback() {
                @Override public void onAvailable(Network network) {
                    onPhysicalNetworkChanged(network);
                }
                @Override public void onCapabilitiesChanged(Network network, NetworkCapabilities caps) {
                    onPhysicalNetworkChanged(network);
                }
                @Override public void onLost(Network network) {
                    onPhysicalNetworkChanged(null);
                }
            };
            NetworkRequest req = new NetworkRequest.Builder()
                    .addCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET)
                    .addCapability(NetworkCapabilities.NET_CAPABILITY_NOT_VPN)
                    .build();
            cm.registerNetworkCallback(req, netCallback);
        } catch (Exception ignored) {}
    }

    private void onPhysicalNetworkChanged(Network network) {
        if (!running) return;
        long h = network != null ? network.getNetworkHandle() : -1L;
        if (h != -1L && h == activeNetHandle) return;
        activeNetHandle = h;
        try { setUnderlyingNetworks(null); } catch (Exception ignored) {}
        rebindDnsUpstream();
        for (TcpConn c : tcpMap.values()) c.close();
        tcpMap.clear();
        for (UdpFlow u : udpFlows.values()) u.close();
        udpFlows.clear();
        useSecondary = false;
        useEncryptedDns = false;
        udpMisses.set(0);
    }

    private void stopVpn() {
        running = false;
        SERVICE_RUNNING.set(false);
        notifHandler.removeCallbacks(notifTicker);
        if (cm != null && netCallback != null) {
            try { cm.unregisterNetworkCallback(netCallback); } catch (Exception ignored) {}
            netCallback = null;
        }
        try { if (input != null) input.close(); } catch (Exception ignored) {}
        try { if (output != null) output.close(); } catch (Exception ignored) {}
        for (TcpConn c : tcpMap.values()) c.close();
        tcpMap.clear();
        for (UdpFlow u : udpFlows.values()) u.close();
        udpFlows.clear();
        if (dnsUpstream != null) try { dnsUpstream.close(); } catch (Exception ignored) {}
        dnsUpstream = null;
        dnsClients.clear();
        if (dnsExecutor != null) {
            dnsExecutor.shutdownNow();
            dnsExecutor = null;
        }
        try { if (vpnFd != null) vpnFd.close(); } catch (Exception ignored) {}
        vpnFd = null;
        stopForeground(true);
        stopSelf();
    }

    @Override
    public void onDestroy() {
        running = false;
        SERVICE_RUNNING.set(false);
        super.onDestroy();
    }

    public static java.util.List<String> recentBlocks() { return RECENT; }

    private static void logBlock(String host) {
        if (host == null || host.isEmpty()) return;
        if (RECENT.size() >= 30) RECENT.remove(0);
        RECENT.add(host);
    }

    private void notifyBlocked(String host) {
        long now = System.currentTimeMillis();
        if (now - lastAlertAt < 2500) return;
        lastAlertAt = now;
        try {
            NotificationManager nm =
                    (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
            if (nm == null) return;
            Intent i = new Intent(this, MainActivity.class);
            int fl = PendingIntent.FLAG_UPDATE_CURRENT;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) fl |= PendingIntent.FLAG_IMMUTABLE;
            PendingIntent pi = PendingIntent.getActivity(this, 1, i, fl);
            Notification.Builder b;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                b = new Notification.Builder(this, CHANNEL_ALERTS_ID);
            } else {
                b = new Notification.Builder(this);
            }
            b.setSmallIcon(R.drawable.ic_stat_shield)
                    .setContentTitle("Anuncio bloqueado (" + (DNS_BLOCKED.get() + SNI_BLOCKED.get()) + ")")
                    .setContentText(host)
                    .setContentIntent(pi)
                    .setOnlyAlertOnce(true)
                    .setAutoCancel(true);
            nm.notify(NOTIF_ID + 1, b.build());
        } catch (Exception ignored) {}
    }

    private void writeOut(byte[] packet) {
        if (packet == null) return;
        synchronized (outLock) {
            try { if (output != null) output.write(packet); } catch (Exception ignored) {}
        }
    }

    private void readLoop() {
        byte[] buf = new byte[8192];
        while (running) {
            try {
                int n = input.read(buf);
                if (n < 0) break;
                if (n < 20) continue;
                PACKETS_READ.incrementAndGet();
                int ver = (buf[0] >> 4) & 0x0F;
                if (ver == 6) {
                    // Descartar IPv6 obliga a usar IPv4 dentro del tunel filtrado.
                    continue;
                }
                if (ver != 4) continue;
                byte[] p = Arrays.copyOf(buf, n);
                PacketUtils.Ip4 ip = PacketUtils.parse(p, n);
                if (ip == null) continue;
                if (ip.proto == PacketUtils.PROTO_UDP) handleUdp(ip, p);
                else if (ip.proto == PacketUtils.PROTO_TCP) handleTcp(ip, p);
            } catch (Exception e) {
                if (!running) break;
            }
        }
        if (running) stopVpn();
    }

    // ---------------- DNS ----------------

    private synchronized void rebindDnsUpstream() {
        DatagramSocket old = dnsUpstream;
        dnsUpstream = null;
        if (old != null) try { old.close(); } catch (Exception ignored) {}
        dnsClients.clear();
        if (running) initDnsUpstream();
    }

    private synchronized void initDnsUpstream() {
        if (dnsUpstream != null) return;
        try {
            DatagramSocket ds = new DatagramSocket(0);
            protect(ds);
            dnsUpstream = ds;
            dnsReaderThread = new Thread(() -> {
                byte[] b = new byte[2048];
                while (running && dnsUpstream == ds) {
                    try {
                        DatagramPacket dp = new DatagramPacket(b, b.length);
                        ds.receive(dp);
                        udpMisses.set(0);
                        int mappedId = DnsUtils.u16(dp.getData(), dp.getOffset());
                        ClientInfo ci = dnsClients.remove(mappedId);
                        if (ci == null) continue;
                        byte[] payload = Arrays.copyOfRange(dp.getData(), dp.getOffset(),
                                dp.getOffset() + dp.getLength());
                        DnsUtils.setId(payload, ci.origId);
                        writeOut(PacketUtils.udp(ci.dnsIp, ci.ip, 53, ci.port, payload));
                    } catch (Exception e) {
                        if (!running || dnsUpstream != ds) break;
                    }
                }
            }, "DnsReader");
            dnsReaderThread.start();
        } catch (Exception e) {
            dnsUpstream = null;
        }
    }

    private void pruneOldDns() {
        if (dnsClients.isEmpty()) return;
        long now = System.currentTimeMillis();
        int expired = 0;
        Iterator<Map.Entry<Integer, ClientInfo>> it = dnsClients.entrySet().iterator();
        while (it.hasNext()) {
            Map.Entry<Integer, ClientInfo> e = it.next();
            if (now - e.getValue().ts > 1800) {
                it.remove();
                expired++;
            }
        }
        if (expired > 0) {
            if (udpMisses.addAndGet(expired) >= 3) {
                // La red movil puede estar bloqueando UDP:53; cambiamos a DoT/DoH (853/443).
                useEncryptedDns = true;
            }
            useSecondary = !useSecondary;
        }
    }

    private void handleDns(PacketUtils.Ip4 ip, byte[] p) {
        int off = ip.payloadOffset;
        int len = ip.payloadLength;
        if (len < 12) return;
        byte[] query = Arrays.copyOfRange(p, off, off + len);
        String host = DnsUtils.questionName(query, query.length);
        int qt = DnsUtils.qtype(query, query.length);
        boolean blocked = host != null && rules != null && rules.isBlocked(host);

        if (blocked) {
            logBlock(host);
            TrafficLog.add(host, true);
            if (notifyBlocks) notifyBlocked(host);
            byte[] resp;
            if (qt == 1) {
                resp = DnsUtils.zeroA(query, query.length);
            } else if (qt == 28) {
                resp = DnsUtils.zeroAAAA(query, query.length);
            } else if (qt == 64 || qt == 65) {
                resp = DnsUtils.nodata(query, query.length);
            } else {
                resp = DnsUtils.nxdomain(query, query.length);
            }
            if (resp == null) resp = DnsUtils.nxdomain(query, query.length);
            if (resp != null) {
                writeOut(PacketUtils.udp(ip.dst, ip.src, 53, ip.srcPort, resp));
                DNS_BLOCKED.incrementAndGet();
            }
            return;
        }

        // Para consultas AAAA permitidas, respondemos NODATA para evitar demoras IPv6.
        if (qt == 28) {
            byte[] emptyV6 = DnsUtils.nodata(query, query.length);
            if (emptyV6 != null) {
                writeOut(PacketUtils.udp(ip.dst, ip.src, 53, ip.srcPort, emptyV6));
                return;
            }
        }

        if (host != null && qt == 1) TrafficLog.add(host, false);
        int origId = DnsUtils.u16(query, 0);

        if (useEncryptedDns && dnsExecutor != null) {
            dnsExecutor.execute(() -> sendEncryptedDns(query, ip.src, ip.srcPort, ip.dst, origId));
            return;
        }

        if (dnsUpstream == null) initDnsUpstream();
        if (dnsUpstream == null) {
            if (dnsExecutor != null) {
                useEncryptedDns = true;
                dnsExecutor.execute(() -> sendEncryptedDns(query, ip.src, ip.srcPort, ip.dst, origId));
            }
            return;
        }

        pruneOldDns();
        int mappedId = nextDnsId.getAndIncrement() & 0xFFFF;
        if (mappedId == 0) mappedId = nextDnsId.getAndIncrement() & 0xFFFF;
        dnsClients.put(mappedId, new ClientInfo(ip.src, ip.srcPort, ip.dst, origId));
        DnsUtils.setId(query, mappedId);

        String target = useSecondary ? upstreamSecondary : upstreamPrimary;
        try {
            InetAddress dest = InetAddress.getByName(target);
            dnsUpstream.send(new DatagramPacket(query, query.length, dest, 53));
        } catch (Exception e) {
            useSecondary = !useSecondary;
            try {
                InetAddress dest = InetAddress.getByName(upstreamSecondary);
                dnsUpstream.send(new DatagramPacket(query, query.length, dest, 53));
            } catch (Exception ignored) {
                dnsClients.remove(mappedId);
                if (dnsExecutor != null) {
                    DnsUtils.setId(query, origId);
                    useEncryptedDns = true;
                    dnsExecutor.execute(() -> sendEncryptedDns(query, ip.src, ip.srcPort, ip.dst, origId));
                }
            }
        }
    }

    private void sendEncryptedDns(byte[] query, int clientIp, int clientPort, int dnsIp, int origId) {
        String sni = upstreamDotHost.isEmpty() ? "dns.adguard-dns.com" : upstreamDotHost;
        String ip = upstreamDotHost.isEmpty() ? "94.140.14.14" : upstreamPrimary;
        byte[] resp = queryDot(ip, sni, query);
        if (resp == null) resp = queryDoh(ip, sni, dohPathFor(sni), query);
        if (resp == null && !"94.140.14.14".equals(ip)) {
            resp = queryDot("94.140.14.14", "dns.adguard-dns.com", query);
        }
        if (resp == null) {
            resp = queryDoh("94.140.14.14", "dns.adguard-dns.com", "/dns-query", query);
        }
        if (resp != null && resp.length >= 12) {
            DnsUtils.setId(resp, origId);
            writeOut(PacketUtils.udp(dnsIp, clientIp, 53, clientPort, resp));
        }
    }

    private static String dohPathFor(String host) {
        if (host != null && host.endsWith(".freedns.controld.com")) {
            int dot = host.indexOf('.');
            if (dot > 0) return "/" + host.substring(0, dot);
        }
        return "/dns-query";
    }

    private byte[] queryDot(String ip, String sniHost, byte[] query) {
        Socket raw = null;
        SSLSocket ssl = null;
        try {
            raw = new Socket();
            protect(raw);
            raw.connect(new InetSocketAddress(ip, 853), 3500);
            raw.setSoTimeout(3500);
            ssl = (SSLSocket) ((SSLSocketFactory) SSLSocketFactory.getDefault())
                    .createSocket(raw, sniHost, 853, true);
            ssl.startHandshake();
            OutputStream os = ssl.getOutputStream();
            byte[] framed = new byte[2 + query.length];
            framed[0] = (byte) ((query.length >> 8) & 0xFF);
            framed[1] = (byte) (query.length & 0xFF);
            System.arraycopy(query, 0, framed, 2, query.length);
            os.write(framed);
            os.flush();
            DataInputStream dis = new DataInputStream(ssl.getInputStream());
            int rlen = dis.readUnsignedShort();
            if (rlen < 12 || rlen > 4096) return null;
            byte[] resp = new byte[rlen];
            dis.readFully(resp);
            return resp;
        } catch (Exception ignored) {
            return null;
        } finally {
            if (ssl != null) try { ssl.close(); } catch (Exception ignored) {}
            if (raw != null) try { raw.close(); } catch (Exception ignored) {}
        }
    }

    private byte[] queryDoh(String ip, String host, String path, byte[] query) {
        Socket raw = null;
        SSLSocket ssl = null;
        try {
            raw = new Socket();
            protect(raw);
            raw.connect(new InetSocketAddress(ip, 443), 4000);
            raw.setSoTimeout(4000);
            String sni = host.endsWith(".freedns.controld.com") ? "freedns.controld.com" : host;
            ssl = (SSLSocket) ((SSLSocketFactory) SSLSocketFactory.getDefault())
                    .createSocket(raw, sni, 443, true);
            ssl.startHandshake();
            String hdr = "POST " + path + " HTTP/1.1\r\n"
                    + "Host: " + sni + "\r\n"
                    + "Accept: application/dns-message\r\n"
                    + "Content-Type: application/dns-message\r\n"
                    + "Content-Length: " + query.length + "\r\n"
                    + "Connection: close\r\n\r\n";
            OutputStream os = ssl.getOutputStream();
            os.write(hdr.getBytes(StandardCharsets.US_ASCII));
            os.write(query);
            os.flush();

            InputStream is = ssl.getInputStream();
            ByteArrayOutputStream hbuf = new ByteArrayOutputStream(512);
            int prev3 = 0, prev2 = 0, prev1 = 0, cur;
            while ((cur = is.read()) != -1) {
                hbuf.write(cur);
                if (prev3 == '\r' && prev2 == '\n' && prev1 == '\r' && cur == '\n') break;
                prev3 = prev2; prev2 = prev1; prev1 = cur;
                if (hbuf.size() > 8192) return null;
            }
            String headers = hbuf.toString(StandardCharsets.US_ASCII.name());
            if (!headers.contains("200")) return null;
            String lowerH = headers.toLowerCase(Locale.ROOT);
            int contentLen = -1;
            boolean chunked = lowerH.contains("transfer-encoding: chunked");
            for (String line : lowerH.split("\r\n")) {
                if (line.startsWith("content-length:")) {
                    try { contentLen = Integer.parseInt(line.substring(15).trim()); } catch (Exception ignored) {}
                }
            }
            if (chunked) {
                ByteArrayOutputStream body = new ByteArrayOutputStream();
                while (true) {
                    StringBuilder sz = new StringBuilder();
                    int c;
                    while ((c = is.read()) != -1) {
                        if (c == '\n') break;
                        if (c != '\r') sz.append((char) c);
                    }
                    String hex = sz.toString().trim();
                    int semi = hex.indexOf(';');
                    if (semi >= 0) hex = hex.substring(0, semi);
                    if (hex.isEmpty()) break;
                    int clen = Integer.parseInt(hex, 16);
                    if (clen <= 0) break;
                    byte[] chunk = new byte[clen];
                    new DataInputStream(is).readFully(chunk);
                    body.write(chunk);
                    is.read(); is.read(); // \r\n
                }
                return body.toByteArray();
            } else if (contentLen > 0 && contentLen <= 4096) {
                byte[] resp = new byte[contentLen];
                new DataInputStream(is).readFully(resp);
                return resp;
            } else {
                ByteArrayOutputStream body = new ByteArrayOutputStream();
                byte[] tmp = new byte[1024];
                int r;
                while ((r = is.read(tmp)) != -1) {
                    body.write(tmp, 0, r);
                    if (body.size() > 4096) break;
                }
                return body.toByteArray();
            }
        } catch (Exception ignored) {
            return null;
        } finally {
            if (ssl != null) try { ssl.close(); } catch (Exception ignored) {}
            if (raw != null) try { raw.close(); } catch (Exception ignored) {}
        }
    }

    // ---------------- UDP ----------------

    private void handleUdp(PacketUtils.Ip4 ip, byte[] p) {
        if (ip.dstPort == 53) {
            handleDns(ip, p);
            return;
        }
        if (blockDot && (ip.dstPort == 853
                || (ip.dstPort == 443 && RESOLVER_INT_SET.contains(ip.dst)))) {
            DOT_DROPPED.incrementAndGet();
            ENCRYPTED_CUT.incrementAndGet();
            return;
        }
        if (blockQuic && ip.dstPort == 443) {
            QUIC_DROPPED.incrementAndGet();
            return;
        }
        if (!sniMode || ip.payloadLength <= 0) return;

        String flowKey = ip.src + ":" + ip.srcPort;
        UdpFlow flow = udpFlows.get(flowKey);
        if (flow == null || !flow.alive) {
            flow = new UdpFlow(flowKey, ip.src, ip.srcPort);
            if (!flow.open()) return;
            udpFlows.put(flowKey, flow);
        }
        byte[] payload = Arrays.copyOfRange(p, ip.payloadOffset, ip.payloadOffset + ip.payloadLength);
        flow.send(ip.dst, ip.dstPort, payload);
    }

    private final class UdpFlow {
        final String key;
        final int clientIp;
        final int clientPort;
        DatagramSocket socket;
        volatile boolean alive = true;

        UdpFlow(String key, int clientIp, int clientPort) {
            this.key = key;
            this.clientIp = clientIp;
            this.clientPort = clientPort;
        }

        boolean open() {
            try {
                socket = new DatagramSocket(0);
                socket.setSoTimeout(30000);
                protect(socket);
                new Thread(() -> {
                    byte[] buf = new byte[4096];
                    while (alive && running && socket != null) {
                        try {
                            DatagramPacket dp = new DatagramPacket(buf, buf.length);
                            socket.receive(dp);
                            int remoteIp = PacketUtils.ipToInt(dp.getAddress().getHostAddress());
                            byte[] data = Arrays.copyOfRange(dp.getData(), dp.getOffset(),
                                    dp.getOffset() + dp.getLength());
                            writeOut(PacketUtils.udp(remoteIp, clientIp, dp.getPort(),
                                    clientPort, data));
                        } catch (Exception e) {
                            break;
                        }
                    }
                    close();
                    udpFlows.remove(key);
                }, "UdpFlow").start();
                return true;
            } catch (Exception e) {
                close();
                return false;
            }
        }

        void send(int remoteIp, int remotePort, byte[] data) {
            try {
                byte[] addr = new byte[] {
                        (byte) (remoteIp >>> 24), (byte) (remoteIp >>> 16),
                        (byte) (remoteIp >>> 8), (byte) remoteIp };
                socket.send(new DatagramPacket(data, data.length,
                        InetAddress.getByAddress(addr), remotePort));
            } catch (Exception e) {
                close();
                udpFlows.remove(key);
            }
        }

        void close() {
            alive = false;
            if (socket != null) try { socket.close(); } catch (Exception ignored) {}
        }
    }

    // ---------------- TCP ----------------

    private void handleTcp(PacketUtils.Ip4 ip, byte[] p) {
        if (blockDot && (ip.dstPort == 853 || ip.dstPort == 53)) {
            sendRst(ip);
            DOT_DROPPED.incrementAndGet();
            ENCRYPTED_CUT.incrementAndGet();
            return;
        }
        // Cortamos siempre DoH por IP directa (1.1.1.1:443, 8.8.8.8:443, etc.) incluso en modo SNI.
        if (blockDot && ip.dstPort == 443 && RESOLVER_INT_SET.contains(ip.dst)) {
            sendRst(ip);
            DOT_DROPPED.incrementAndGet();
            ENCRYPTED_CUT.incrementAndGet();
            return;
        }
        if (!sniMode) return;

        String key = key(ip);
        if ((ip.flags & PacketUtils.FLAG_SYN) != 0 && (ip.flags & PacketUtils.FLAG_ACK) == 0) {
            TcpConn old = tcpMap.remove(key);
            if (old != null) old.close();
            TcpConn c = new TcpConn(ip, key);
            tcpMap.put(key, c);
            c.sendSynAck();
            return;
        }
        TcpConn c = tcpMap.get(key);
        if (c == null) {
            if ((ip.flags & PacketUtils.FLAG_RST) == 0) sendRst(ip);
            return;
        }
        c.handle(ip, p);
    }

    private String key(PacketUtils.Ip4 ip) {
        return ip.src + ":" + ip.srcPort + ">" + ip.dst + ":" + ip.dstPort;
    }

    private void sendRst(PacketUtils.Ip4 ip) {
        int seq = PacketUtils.u32(ip.raw, ip.ipHeaderLength + 4);
        int ack = ((ip.flags & PacketUtils.FLAG_ACK) != 0)
                ? PacketUtils.u32(ip.raw, ip.ipHeaderLength + 8) : 0;
        writeOut(PacketUtils.tcp(ip.dst, ip.src, ip.dstPort, ip.srcPort,
                ack, seq + 1, PacketUtils.FLAG_RST | PacketUtils.FLAG_ACK, null, 0));
    }

    private static String extractHttpHost(byte[] buf) {
        try {
            int max = Math.min(buf.length, 2048);
            String s = new String(buf, 0, max, StandardCharsets.US_ASCII);
            if (!s.startsWith("GET ") && !s.startsWith("POST ")
                    && !s.startsWith("HEAD ") && !s.startsWith("CONNECT ")) {
                return null;
            }
            String lower = s.toLowerCase(Locale.ROOT);
            int idx = lower.indexOf("\nhost:");
            if (idx < 0) return null;
            int start = idx + 7;
            int end = lower.indexOf('\n', start);
            String host = (end < 0 ? lower.substring(start) : lower.substring(start, end)).trim();
            int colon = host.indexOf(':');
            if (colon > 0) host = host.substring(0, colon);
            return host.isEmpty() ? null : host;
        } catch (Exception ignored) {
            return null;
        }
    }

    private final class TcpConn {
        final String key;
        final int clientIp, serverIp, clientPort, serverPort;
        final long clientIsn, serverIsn;
        long expectedClientSeq;
        long serverSent = 0;
        volatile int state = 0; // 0 = esperando ClientHello completo, 1 = conectado
        volatile boolean alive = true;
        Socket socket;
        ByteArrayOutputStream helloBuf = new ByteArrayOutputStream(2048);

        TcpConn(PacketUtils.Ip4 ip, String key) {
            this.key = key;
            this.clientIp = ip.src;
            this.serverIp = ip.dst;
            this.clientPort = ip.srcPort;
            this.serverPort = ip.dstPort;
            this.clientIsn = PacketUtils.u32(ip.raw, ip.ipHeaderLength + 4) & 0xFFFFFFFFL;
            this.serverIsn = (long) (Math.random() * 0xFFFFFFFFL) & 0xFFFFFFFFL;
            this.expectedClientSeq = (clientIsn + 1) & 0xFFFFFFFFL;
        }

        void sendSynAck() {
            writeOut(PacketUtils.tcp(serverIp, clientIp, serverPort, clientPort,
                    (int) serverIsn, (int) expectedClientSeq,
                    PacketUtils.FLAG_SYN | PacketUtils.FLAG_ACK, null, MSS));
        }

        void sendAck() {
            writeOut(PacketUtils.tcp(serverIp, clientIp, serverPort, clientPort,
                    (int) ((serverIsn + 1 + serverSent) & 0xFFFFFFFFL),
                    (int) expectedClientSeq, PacketUtils.FLAG_ACK, null, 0));
        }

        synchronized void handle(PacketUtils.Ip4 ip, byte[] p) {
            if ((ip.flags & PacketUtils.FLAG_RST) != 0) {
                close();
                tcpMap.remove(key);
                return;
            }
            long seq = PacketUtils.u32(ip.raw, ip.ipHeaderLength + 4) & 0xFFFFFFFFL;
            int len = ip.payloadLength;

            if (state == 0) {
                if (len <= 0) return;
                if (seq != expectedClientSeq) {
                    sendAck();
                    return;
                }
                expectedClientSeq = (seq + len) & 0xFFFFFFFFL;
                sendAck();

                if (helloBuf.size() < 8192) {
                    int take = Math.min(len, 8192 - helloBuf.size());
                    helloBuf.write(p, ip.payloadOffset, take);
                }
                byte[] hb = helloBuf.toByteArray();

                // Si es handshake TLS fragmentado, esperamos hasta completar el registro.
                if (hb.length >= 5 && (hb[0] & 0xFF) == 0x16) {
                    int recLen = 5 + (((hb[3] & 0xFF) << 8) | (hb[4] & 0xFF));
                    if (hb.length < recLen && hb.length < 8192) {
                        return;
                    }
                }

                String host = SniParser.extract(hb, 0, hb.length);
                if (host == null) host = extractHttpHost(hb);

                if (host != null) {
                    boolean isBlk = rules != null && rules.isBlocked(host);
                    TrafficLog.add(host, isBlk);
                    if (isBlk) {
                        logBlock(host);
                        if (notifyBlocks) notifyBlocked(host);
                        SNI_BLOCKED.incrementAndGet();
                        writeOut(PacketUtils.tcp(serverIp, clientIp, serverPort, clientPort,
                                (int) ((serverIsn + 1) & 0xFFFFFFFFL), (int) expectedClientSeq,
                                PacketUtils.FLAG_RST | PacketUtils.FLAG_ACK, null, 0));
                        close();
                        tcpMap.remove(key);
                        return;
                    }
                }

                try {
                    socket = new Socket();
                    protect(socket);
                    socket.connect(new InetSocketAddress(
                            PacketUtils.ipToString(serverIp), serverPort), 8000);
                    socket.setTcpNoDelay(true);
                    state = 1;
                    socket.getOutputStream().write(hb);
                    helloBuf = null;
                    startReader();
                } catch (Exception e) {
                    writeOut(PacketUtils.tcp(serverIp, clientIp, serverPort, clientPort,
                            (int) ((serverIsn + 1) & 0xFFFFFFFFL), (int) expectedClientSeq,
                            PacketUtils.FLAG_RST | PacketUtils.FLAG_ACK, null, 0));
                    close();
                    tcpMap.remove(key);
                }
                return;
            }

            if (state == 1) {
                if (len > 0) {
                    long end = (seq + len) & 0xFFFFFFFFL;
                    if (seq == expectedClientSeq) {
                        try {
                            if (socket != null) {
                                socket.getOutputStream().write(p, ip.payloadOffset, len);
                            }
                            expectedClientSeq = end;
                            sendAck();
                        } catch (Exception e) {
                            close();
                            tcpMap.remove(key);
                            return;
                        }
                    } else {
                        // Retransmision o paquete repetido: re-ACKeamos esperado.
                        sendAck();
                        return;
                    }
                }
                if ((ip.flags & PacketUtils.FLAG_FIN) != 0) {
                    expectedClientSeq = (expectedClientSeq + 1) & 0xFFFFFFFFL;
                    try { if (socket != null) socket.shutdownOutput(); } catch (Exception ignored) {}
                    sendAck();
                }
            }
        }

        private void startReader() {
            new Thread(() -> {
                byte[] b = new byte[8192];
                while (alive && running && socket != null) {
                    try {
                        int n = socket.getInputStream().read(b);
                        if (n < 0) {
                            int sq = (int) ((serverIsn + 1 + serverSent) & 0xFFFFFFFFL);
                            writeOut(PacketUtils.tcp(serverIp, clientIp, serverPort, clientPort,
                                    sq, (int) expectedClientSeq,
                                    PacketUtils.FLAG_FIN | PacketUtils.FLAG_ACK, null, 0));
                            serverSent = (serverSent + 1) & 0xFFFFFFFFL;
                            break;
                        }
                        int offset = 0;
                        while (offset < n) {
                            int chunk = Math.min(MSS, n - offset);
                            byte[] data = Arrays.copyOfRange(b, offset, offset + chunk);
                            int sq = (int) ((serverIsn + 1 + serverSent) & 0xFFFFFFFFL);
                            writeOut(PacketUtils.tcp(serverIp, clientIp, serverPort, clientPort,
                                    sq, (int) expectedClientSeq,
                                    PacketUtils.FLAG_PSH | PacketUtils.FLAG_ACK, data, 0));
                            serverSent = (serverSent + chunk) & 0xFFFFFFFFL;
                            offset += chunk;
                        }
                    } catch (Exception e) {
                        if (!alive) break;
                        writeOut(PacketUtils.tcp(serverIp, clientIp, serverPort, clientPort,
                                (int) ((serverIsn + 1 + serverSent) & 0xFFFFFFFFL),
                                (int) expectedClientSeq,
                                PacketUtils.FLAG_RST | PacketUtils.FLAG_ACK, null, 0));
                        break;
                    }
                }
                close();
                tcpMap.remove(key);
            }, "TcpRelay").start();
        }

        void close() {
            alive = false;
            if (socket != null) try { socket.close(); } catch (Exception ignored) {}
        }
    }

    public static boolean isRunning(Context c) {
        SharedPreferences p = c.getSharedPreferences(Blocklist.PREFS, MODE_PRIVATE);
        return p.getBoolean(Blocklist.KEY_ENABLED, false);
    }
}
