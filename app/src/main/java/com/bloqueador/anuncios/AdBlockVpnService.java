package com.bloqueador.anuncios;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.net.VpnService;
import android.os.Build;
import android.os.ParcelFileDescriptor;

import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.net.DatagramPacket;
import java.net.DatagramSocket;
import java.net.InetAddress;
import java.net.InetSocketAddress;
import java.net.Socket;
import java.util.Arrays;
import java.util.List;
import java.util.Locale;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.atomic.AtomicInteger;

/** Servicio VPN que bloquea anuncios por DNS y, opcionalmente, por SNI. */
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

    /** Rangos IP de Meta para atrapar su SDK con IP fija (sin DNS). */
    private static final String[] META_ROUTES = {
        "157.240.0.0", "31.13.0.0", "185.60.216.0",
        "129.134.0.0", "179.60.192.0"
    };
    /** Apps de Meta que se dejan fuera de la VPN para no romper chats. */
    private static final String[] META_APPS = {
        "com.facebook.katana", "com.facebook.orca", "com.facebook.lite",
        "com.instagram.android", "com.whatsapp", "com.whatsapp.w4b",
        "com.facebook.appmanager", "com.facebook.services", "com.facebook.system"
    };
    private static final java.util.List<String> RECENT =
            new java.util.concurrent.CopyOnWriteArrayList<>();

    private static final String[] RESOLVER_IPS = {
        "1.1.1.1", "1.0.0.1", "8.8.8.8", "8.8.4.4", "9.9.9.9",
        "149.112.112.112", "208.67.222.222", "208.67.220.220",
        "64.6.64.6", "64.6.65.6", "185.228.168.9", "185.228.169.9",
        "76.76.19.19", "95.85.95.85"
    };

    private static final String CHANNEL_ID = "bloqueo_anuncios_channel";
    private static final int NOTIF_ID = 1001;
    private static final String DNS_IP = "10.233.233.1";
    private static final String CLIENT_IP = "10.233.233.2";
    private static final int MSS = 1360;

    private ParcelFileDescriptor vpnFd;
    private FileInputStream input;
    private FileOutputStream output;
    private final Object outLock = new Object();
    private volatile boolean running = false;
    private Thread readerThread;
    private final android.os.Handler notifHandler = new android.os.Handler(android.os.Looper.getMainLooper());
    private final Runnable notifTicker = new Runnable() {
        @Override public void run() {
            if (!running) return;
            try {
                NotificationManager nm = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
                if (nm != null) nm.notify(NOTIF_ID, notification(true));
            } catch (Exception ignored) {}
            notifHandler.postDelayed(this, 2000);
        }
    };

    private final ConcurrentHashMap<String, TcpConn> tcpMap = new ConcurrentHashMap<>();
    // Un solo socket UDP y un solo hilo para todo el trafico UDP (bajo consumo).
    private final ConcurrentHashMap<String, int[]> udpClients = new ConcurrentHashMap<>();
    private DatagramSocket udpSocket;
    private Thread udpReaderThread;
    private final ConcurrentHashMap<String, ClientInfo> dnsClients = new ConcurrentHashMap<>();
    private DatagramSocket dnsUpstream;
    private Thread dnsReaderThread;

    private Blocklist.RuleSet rules;
    private boolean sniMode;
    private boolean blockQuic;
    private boolean blockDot;
    private boolean metaBlock;
    private boolean notifyBlocks;
    private String upstreamPrimary = "1.1.1.1";
    private String upstreamSecondary = "1.0.0.1";
    private volatile boolean useSecondary = false;

    private static final class ClientInfo {
        final int ip;
        final int port;
        final int dnsIp;
        ClientInfo(int ip, int port, int dnsIp) { this.ip = ip; this.port = port; this.dnsIp = dnsIp; }
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
            notifyBlocks = p.getBoolean(Blocklist.KEY_NOTIFY_BLOCKS, false);
            return START_STICKY;
        }
        startVpn();
        return START_STICKY;
    }

    private void createChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel ch = new NotificationChannel(CHANNEL_ID,
                    getString(R.string.channel_name), NotificationManager.IMPORTANCE_LOW);
            ch.setDescription(getString(R.string.channel_desc));
            NotificationManager nm = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
            if (nm != null) nm.createNotificationChannel(ch);
        }
    }

    private Notification notification(boolean active) {
        Intent i = new Intent(this, MainActivity.class);
        int fl = PendingIntent.FLAG_UPDATE_CURRENT;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) fl |= PendingIntent.FLAG_IMMUTABLE;
        PendingIntent pi = PendingIntent.getActivity(this, 0, i, fl);
        Notification.Builder b;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) b = new Notification.Builder(this, CHANNEL_ID);
        else b = new Notification.Builder(this);
        String txt = active
                ? "PROTEGIDO - " + (DNS_BLOCKED.get() + SNI_BLOCKED.get())
                        + " anuncios bloqueados | " + PACKETS_READ.get() + " paquetes"
                : "Protección detenida";
        return b.setSmallIcon(R.drawable.ic_stat_shield)
                .setContentTitle("Adblock Gamer Pro")
                .setContentText(txt)
                .setContentIntent(pi)
                .setOngoing(active)
                .build();
    }

    private void startVpn() {
        if (running) return;
        SharedPreferences p = getSharedPreferences(Blocklist.PREFS, MODE_PRIVATE);
        rules = Blocklist.load(this);
        sniMode = p.getBoolean(Blocklist.KEY_SNI_MODE, true);
        blockQuic = p.getBoolean(Blocklist.KEY_BLOCK_QUIC, true);
        blockDot = p.getBoolean(Blocklist.KEY_BLOCK_DOT, true);
        metaBlock = p.getBoolean(Blocklist.KEY_META_BLOCK, false);
        notifyBlocks = p.getBoolean(Blocklist.KEY_NOTIFY_BLOCKS, true);
        DnsProviders.Provider prov = DnsProviders.get(
                p.getInt(Blocklist.KEY_DNS_PROVIDER, DnsProviders.DEFAULT));
        upstreamPrimary = prov.primary;
        upstreamSecondary = prov.secondary.isEmpty() ? prov.primary : prov.secondary;
        useSecondary = false;

        try {
            VpnService.Builder builder = new VpnService.Builder()
                    .setSession(getString(R.string.app_name))
                    .addAddress(CLIENT_IP, 24)
                    .setMtu(1400)
                    .addDnsServer(DNS_IP);

            if (sniMode) {
                builder.addRoute("0.0.0.0", 0);
            } else {
                builder.addRoute(DNS_IP, 32);
                // El DNS privado de Android sale por 853/443 hacia estos IPs.
                for (String rip : RESOLVER_IPS) builder.addRoute(rip, 32);
                // Tambien enrutamos las IPs del proveedor elegido para que
                // sus consultas DoT/DoH pasen por el tunel y se corten.
                for (String rip : DnsProviders.allIps()) builder.addRoute(rip, 32);
            }

            if (metaBlock) {
                // Enrutamos las IPs de Meta para que su SDK con IP fija
                // entre al tunel y se corte por SNI.
                for (String ip : META_ROUTES) {
                    try { builder.addRoute(ip, 16); } catch (Exception ignored) {}
                }
                // Las apps de Meta quedan fuera para no romper chats.
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
                        android.content.pm.ServiceInfo.FOREGROUND_SERVICE_TYPE_CONNECTED_DEVICE);
            } else {
                startForeground(NOTIF_ID, notification(true));
            }

            initDnsUpstream();
            if (sniMode) initUdpRelay();
            notifHandler.post(notifTicker);
            readerThread = new Thread(this::readLoop, "VpnReader");
            readerThread.start();
        } catch (Exception e) {
            running = false;
            stopForeground(true);
            stopSelf();
        }
    }

    private void stopVpn() {
        running = false;
        SERVICE_RUNNING.set(false);
        notifHandler.removeCallbacks(notifTicker);
        try { if (input != null) input.close(); } catch (Exception ignored) {}
        try { if (output != null) output.close(); } catch (Exception ignored) {}
        for (TcpConn c : tcpMap.values()) c.close();
        tcpMap.clear();
        udpClients.clear();
        if (udpSocket != null) try { udpSocket.close(); } catch (Exception ignored) {}
        udpSocket = null;
        if (dnsUpstream != null) try { dnsUpstream.close(); } catch (Exception ignored) {}
        dnsClients.clear();
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

    /** Aviso silencioso cada vez que se corta un dominio publicitario. */
    private void notifyBlocked(String host) {
        try {
            NotificationManager nm = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
            if (nm == null) return;
            Intent i = new Intent(this, MainActivity.class);
            int fl = PendingIntent.FLAG_UPDATE_CURRENT;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) fl |= PendingIntent.FLAG_IMMUTABLE;
            PendingIntent pi = PendingIntent.getActivity(this, 1, i, fl);
            Notification.Builder b;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) b = new Notification.Builder(this, CHANNEL_ID);
            else b = new Notification.Builder(this);
            b.setSmallIcon(R.drawable.ic_stat_shield)
                    .setContentTitle("Anuncio bloqueado")
                    .setContentText(host)
                    .setContentIntent(pi)
                    .setAutoCancel(true)
                    .setPriority(Notification.PRIORITY_LOW);
            nm.notify(NOTIF_ID + 1, b.build());
        } catch (Exception ignored) {}
    }

    private void writeOut(byte[] packet) {
        synchronized (outLock) {
            try { if (output != null) output.write(packet); } catch (Exception ignored) {}
        }
    }

    private void readLoop() {
        byte[] buf = new byte[4096];
        while (running) {
            try {
                int n = input.read(buf);
                if (n < 0) break;
                PACKETS_READ.incrementAndGet();
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

    private void initDnsUpstream() {
        try {
            dnsUpstream = new DatagramSocket(0);
            protect(dnsUpstream);
            dnsReaderThread = new Thread(() -> {
                byte[] b = new byte[2048];
                while (running && dnsUpstream != null) {
                    try {
                        DatagramPacket dp = new DatagramPacket(b, b.length);
                        dnsUpstream.receive(dp);
                        // La respuesta DNS repite el ID de la pregunta. El puerto
                        // de dp es el del servidor (53), no el del cliente.
                        String key = String.valueOf(DnsUtils.u16(dp.getData(), 0));
                        ClientInfo ci = dnsClients.remove(key);
                        if (ci == null) continue;
                        byte[] payload = Arrays.copyOfRange(dp.getData(), dp.getOffset(),
                                dp.getOffset() + dp.getLength());
                        writeOut(PacketUtils.udp(ci.dnsIp, ci.ip, 53,
                                ci.port, payload));
                    } catch (Exception e) {
                        if (!running) break;
                    }
                }
            }, "DnsReader");
            dnsReaderThread.start();
        } catch (Exception e) {
            dnsUpstream = null;
        }
    }

    private void handleDns(PacketUtils.Ip4 ip, byte[] p) {
        int off = ip.payloadOffset;
        int len = ip.payloadLength;
        if (len < 12) return;
        byte[] query = Arrays.copyOfRange(p, off, off + len);
        String host = DnsUtils.questionName(query, query.length);
        boolean blocked = host != null && rules != null && rules.isBlocked(host);
        if (blocked) {
            logBlock(host);
            TrafficLog.add(host, true);
            if (notifyBlocks) notifyBlocked(host);
            int qt = DnsUtils.qtype(query, query.length);
            byte[] resp = (qt == 1) ? DnsUtils.zeroA(query, query.length)
                    : DnsUtils.nxdomain(query, query.length);
            if (resp == null) resp = DnsUtils.nxdomain(query, query.length);
            if (resp != null) {
                writeOut(PacketUtils.udp(ip.dst, ip.src, 53, ip.srcPort, resp));
                DNS_BLOCKED.incrementAndGet();
            }
            return;
        }
        if (host != null) TrafficLog.add(host, false);
        if (dnsUpstream == null) initDnsUpstream();
        if (dnsUpstream == null) return;
        int id = DnsUtils.u16(query, 0);
        String key = String.valueOf(id);
        dnsClients.put(key, new ClientInfo(ip.src, ip.srcPort, ip.dst));
        String target = useSecondary ? upstreamSecondary : upstreamPrimary;
        try {
            InetAddress dest = InetAddress.getByName(target);
            dnsUpstream.send(new DatagramPacket(query, query.length, dest, 53));
        } catch (Exception e) {
            // Si el servidor primario falla, cambiamos al secundario.
            useSecondary = true;
            try {
                InetAddress dest = InetAddress.getByName(upstreamSecondary);
                dnsUpstream.send(new DatagramPacket(query, query.length, dest, 53));
            } catch (Exception ignored) {
                dnsClients.remove(key);
            }
        }
    }

    // ---------------- UDP ----------------

    private void handleUdp(PacketUtils.Ip4 ip, byte[] p) {
        if (ip.dstPort == 53) { handleDns(ip, p); return; }
        if (!sniMode) {
            // Solo vemos trafico hacia resolvers (rutas anadidas arriba).
            if (blockQuic && ip.dstPort == 443) QUIC_DROPPED.incrementAndGet();
            return;
        }
        if (blockQuic && ip.dstPort == 443) { QUIC_DROPPED.incrementAndGet(); return; }
        if (ip.payloadLength <= 0) return;
        byte[] payload = Arrays.copyOfRange(p, ip.payloadOffset, ip.payloadOffset + ip.payloadLength);
        sendUdpShared(ip.dst, ip.dstPort, ip.src, ip.srcPort, payload);
    }

    private void initUdpRelay() {
        try {
            udpSocket = new DatagramSocket(0);
            protect(udpSocket);
            udpReaderThread = new Thread(() -> {
                byte[] b = new byte[2048];
                while (running && udpSocket != null) {
                    try {
                        DatagramPacket dp = new DatagramPacket(b, b.length);
                        udpSocket.receive(dp);
                        int remoteIp = PacketUtils.ipToInt(dp.getAddress().getHostAddress());
                        String key = remoteIp + ":" + dp.getPort();
                        int[] client = udpClients.get(key);
                        if (client == null) continue;
                        byte[] data = Arrays.copyOfRange(dp.getData(), dp.getOffset(),
                                dp.getOffset() + dp.getLength());
                        writeOut(PacketUtils.udp(remoteIp, client[0], dp.getPort(), client[1], data));
                    } catch (Exception e) {
                        if (!running) break;
                    }
                }
            }, "UdpRelay");
            udpReaderThread.start();
        } catch (Exception e) {
            udpSocket = null;
        }
    }

    private void sendUdpShared(int remoteIp, int remotePort, int clientIp, int clientPort, byte[] data) {
        if (udpSocket == null) initUdpRelay();
        if (udpSocket == null) return;
        try {
            udpClients.put(remoteIp + ":" + remotePort, new int[] { clientIp, clientPort });
            byte[] addr = new byte[] {
                    (byte) (remoteIp >>> 24), (byte) (remoteIp >>> 16),
                    (byte) (remoteIp >>> 8), (byte) remoteIp };
            udpSocket.send(new DatagramPacket(data, data.length,
                    InetAddress.getByAddress(addr), remotePort));
        } catch (Exception ignored) {}
    }

    // ---------------- TCP ----------------

    private void handleTcp(PacketUtils.Ip4 ip, byte[] p) {
        if (blockDot && ip.dstPort == 853) {
            sendRst(ip);
            DOT_DROPPED.incrementAndGet();
            ENCRYPTED_CUT.incrementAndGet();
            return;
        }
        if (!sniMode) {
            // DoH (443) y DNS-over-TCP hacia resolvers: los cortamos para
            // obligar al sistema a volver al DNS normal del tunel.
            if (ip.dstPort == 443 || ip.dstPort == 53) {
                sendRst(ip);
                DOT_DROPPED.incrementAndGet();
                ENCRYPTED_CUT.incrementAndGet();
            }
            return;
        }
        if (ip.dstPort == 53) { sendRst(ip); return; }
        String key = key(ip);
        if ((ip.flags & PacketUtils.FLAG_SYN) != 0 && (ip.flags & PacketUtils.FLAG_ACK) == 0) {
            TcpConn old = tcpMap.get(key);
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

    private final class TcpConn {
        final PacketUtils.Ip4 first;
        final String key;
        final int clientIp, serverIp, clientPort, serverPort;
        final long clientIsn, serverIsn;
        long expectedClientSeq;
        long serverSent = 0;
        volatile int state = 0; // 0 = esperando ClientHello, 1 = conectado
        volatile boolean alive = true;
        Socket socket;

        TcpConn(PacketUtils.Ip4 ip, String key) {
            this.first = ip;
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

        void handle(PacketUtils.Ip4 ip, byte[] p) {
            if ((ip.flags & PacketUtils.FLAG_RST) != 0) { close(); tcpMap.remove(key); return; }
            long seq = PacketUtils.u32(ip.raw, ip.ipHeaderLength + 4) & 0xFFFFFFFFL;
            int len = ip.payloadLength;

            if (state == 0) {
                if (len <= 0) return; // ACK del handshake
                String host = SniParser.extract(p, ip.payloadOffset, len);
                if (host != null) TrafficLog.add(host, rules != null && rules.isBlocked(host));
                if (host != null && rules != null && rules.isBlocked(host)) {
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
                try {
                    socket = new Socket();
                    protect(socket);
                    socket.connect(new InetSocketAddress(PacketUtils.ipToString(serverIp), serverPort), 8000);
                    socket.setTcpNoDelay(true);
                    state = 1;
                    expectedClientSeq = (seq + len) & 0xFFFFFFFFL;
                    socket.getOutputStream().write(p, ip.payloadOffset, len);
                    startReader();
                } catch (Exception e) {
                    writeOut(PacketUtils.tcp(serverIp, clientIp, serverPort, clientPort,
                            0, (int) expectedClientSeq,
                            PacketUtils.FLAG_RST | PacketUtils.FLAG_ACK, null, 0));
                    close();
                    tcpMap.remove(key);
                }
                return;
            }

            if (state == 1) {
                if (len > 0) {
                    long end = (seq + len) & 0xFFFFFFFFL;
                    if (end != expectedClientSeq && seq != expectedClientSeq) {
                        // retransmisión o desorden: re-ACKeamos lo que ya tenemos
                        if (end == expectedClientSeq) { sendAck(); return; }
                    }
                    try {
                        if (socket != null) socket.getOutputStream().write(p, ip.payloadOffset, len);
                        expectedClientSeq = end;
                    } catch (Exception e) { close(); tcpMap.remove(key); return; }
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
                        byte[] data = Arrays.copyOf(b, n);
                        int sq = (int) ((serverIsn + 1 + serverSent) & 0xFFFFFFFFL);
                        writeOut(PacketUtils.tcp(serverIp, clientIp, serverPort, clientPort,
                                sq, (int) expectedClientSeq,
                                PacketUtils.FLAG_PSH | PacketUtils.FLAG_ACK, data, 0));
                        serverSent = (serverSent + n) & 0xFFFFFFFFL;
                    } catch (Exception e) {
                        if (!alive) break;
                        writeOut(PacketUtils.tcp(serverIp, clientIp, serverPort, clientPort,
                                0, (int) expectedClientSeq,
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

    private String lower(String s) { return s == null ? "" : s.toLowerCase(Locale.ROOT); }
}
