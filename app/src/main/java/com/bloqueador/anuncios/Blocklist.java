package com.bloqueador.anuncios;

import android.content.Context;
import android.content.SharedPreferences;
import android.text.TextUtils;

import java.io.BufferedReader;
import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.OutputStreamWriter;
import java.io.Writer;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.util.Collections;
import java.util.HashSet;
import java.util.Locale;
import java.util.Set;

/**
 * Lista de dominios publicitarios. Carga una lista publica grande (76.000+
 * dominios) desde assets y la combina con las reglas propias y las del usuario.
 */
public final class Blocklist {

    public static final String PREFS = "bloqueo_prefs";
    public static final String KEY_CUSTOM_BLOCK = "custom_block";
    public static final String KEY_CUSTOM_ALLOW = "custom_allow";
    public static final String KEY_SNI_MODE = "sni_mode";
    public static final String KEY_BLOCK_QUIC = "block_quic";
    public static final String KEY_BLOCK_DOT = "block_dot";
    public static final String KEY_ENABLED = "enabled";
    public static final String KEY_AUTO_START = "auto_start";
    public static final String KEY_DNS_PROVIDER = "dns_provider";
    public static final String KEY_DNS_MIGRATED_32 = "dns_migrated_32";
    public static final String KEY_META_BLOCK = "meta_block";
    public static final String KEY_NOTIFY_BLOCKS = "notify_blocks";
    public static final String KEY_BLOCKLIST_VERSION = "blocklist_version";

    private static final String[] BUILTIN = {
        // Google / AdMob / DoubleClick
        "googleadservices.com", "doubleclick.net", "googlesyndication.com",
        "googleadapis.com", "googleads.com", "adservice.google.com",
        "ads.google.com", "pagead2.googlesyndication.com",
        "securepubads.g.doubleclick.net", "googletagservices.com",
        // Meta Audience Network (se conservan dominios.publicitarios)
        "facebook.net", "facebookads.com", "audiencenetwork.com",
        "an.facebook.com", "ads.facebook.com", "fbads.com",
        // AppLovin / MAX
        "applovin.com", "app-lovin.com", "rt.applovin.com",
        // Unity Ads
        "unityads.unity3d.com", "unityads.com", "config.unityads.unity3d.com",
        // ironSource
        "ironsource.com", "ironsrc.com", "supersonicads.com", "isnssdk.com",
        // Vungle / Liftoff
        "vungle.com", "vungleads.com", "liftoff.io",
        // Pangle / ByteDance
        "pangle.io", "pangolin.com", "panglesdk.com", "byteadx.com",
        "pglstatp.com", "byteadserving.com",
        // Mintegral
        "mintegral.com", "mintegrals.com", "mtgads.com", "rayjump.com",
        // Moloco
        "moloco.com", "molocoads.com",
        // Otros
        "adcolony.com", "chartboost.com", "inmobi.com", "fyber.com",
        "inner-active.com", "pubmatic.com", "rubiconproject.com", "openx.net",
        "criteo.com", "casalemedia.com", "bidswitch.net", "smartadserver.com",
        "adform.net", "somoaudience.com", "yieldmo.com", "triplelift.com",
        "mobfox.com", "tapdaq.com", "admost.com", "mopub.com",
        "startapp.com", "tapjoy.com", "vpon.com", "adnxs.com", "adsrvr.org",
        // DoH / DoT (evitan que el DNS se salte el filtro)
        "dns.google", "cloudflare-dns.com", "dns.quad9.net", "doh.opendns.com",
        "dns.adguard.com", "dns.adguard-dns.com", "doh.libredns.gr",
        "mozilla.cloudflare-dns.com", "dns11.quad9.net",
        // Hosts DoT/DoH de los proveedores: se bloquean al resto de apps para
        // que no esquiven el filtro (nuestro tunel usa las IPs directamente).
        "family.adguard-dns.com", "p2.freedns.controld.com",
        "freedns.controld.com", "dot.nl.ahadns.net", "zero.dns0.eu",
        "family-filter-dns.cleanbrowsing.org",
        "x-oisd.freedns.controld.com", "x-hagezi-tif.freedns.controld.com",
        "x-adguard.freedns.controld.com", "x-stevenblack.freedns.controld.com",
        "base.dns.mullvad.net"
    };

    private static volatile Set<String> ASSET_SET;

    private static Set<String> assetSet(Context c) {
        if (ASSET_SET != null) return ASSET_SET;
        synchronized (Blocklist.class) {
            if (ASSET_SET != null) return ASSET_SET;
            Set<String> set = new HashSet<>(90000);
            for (String b : BUILTIN) set.add(norm(b));
            try {
                File downloaded = new File(c.getFilesDir(), "ad_domains.txt");
                InputStream in = downloaded.exists()
                        ? new java.io.FileInputStream(downloaded)
                        : c.getAssets().open("ad_domains.txt");
                try (BufferedReader br = new BufferedReader(
                        new InputStreamReader(in, StandardCharsets.UTF_8), 65536)) {
                    String line;
                    while ((line = br.readLine()) != null) {
                        String n = norm(line);
                        if (!TextUtils.isEmpty(n)) set.add(n);
                    }
                }
            } catch (Exception ignored) {
            }
            ASSET_SET = Collections.unmodifiableSet(set);
            return ASSET_SET;
        }
    }

    public static final class RuleSet {
        private final Set<String> base;
        private final Set<String> customBlock;
        private final Set<String> customAllow;

        RuleSet(Set<String> base, Set<String> cb, Set<String> ca) {
            this.base = base;
            this.customBlock = cb;
            this.customAllow = ca;
        }

        public boolean isBlocked(String host) {
            String h = norm(host);
            if (TextUtils.isEmpty(h)) return false;
            int i = -1;
            while (true) {
                String part = h.substring(i + 1);
                if (customAllow.contains(part)) return false;
                if (base.contains(part) || customBlock.contains(part)) return true;
                i = h.indexOf('.', i + 1);
                if (i < 0 || i == h.length() - 1) break;
            }
            return false;
        }

        public int size() { return base.size() + customBlock.size(); }
        public int allowedSize() { return customAllow.size(); }
    }

    public static RuleSet load(Context c) {
        SharedPreferences p = c.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
        return new RuleSet(assetSet(c), parse(p.getString(KEY_CUSTOM_BLOCK, "")),
                parse(p.getString(KEY_CUSTOM_ALLOW, "")));
    }

    private static Set<String> parse(String raw) {
        Set<String> out = new HashSet<>();
        if (raw == null) return out;
        for (String s : raw.split("[\n,; ]+")) {
            String n = norm(s);
            if (!TextUtils.isEmpty(n)) out.add(n);
        }
        return out;
    }

    private static String norm(String s) {
        if (s == null) return "";
        String v = s.trim().toLowerCase(Locale.ROOT);
        while (v.endsWith(".")) v = v.substring(0, v.length() - 1);
        if (v.startsWith("*.")) v = v.substring(2);
        if (v.startsWith(".")) v = v.substring(1);
        return v;
    }

    public static String stats(Context c) {
        RuleSet r = load(c);
        return "Dominios bloqueados: " + r.size() + " | Excepciones: " + r.allowedSize();
    }

    public static SharedPreferences prefs(Context c) {
        return c.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
    }

    /** Numero de dominios cargados actualmente. */
    public static int count(Context c) { return load(c).size(); }

    /** Fuerza una recarga desde el archivo (util tras actualizar). */
    public static void refresh() { ASSET_SET = null; }

    /**
     * Descarga la lista publica de StevenBlack y la guarda en el almacenamiento
     * de la app. Devuelve el numero de dominios o -1 si falla. Llamar siempre
     * desde un hilo secundario.
     */
    public static int download(Context c) {
        HttpURLConnection conn = null;
        try {
            URL url = new URL("https://raw.githubusercontent.com/StevenBlack/hosts/master/hosts");
            conn = (HttpURLConnection) url.openConnection();
            conn.setConnectTimeout(12000);
            conn.setReadTimeout(20000);
            conn.setRequestMethod("GET");
            int code = conn.getResponseCode();
            if (code != HttpURLConnection.HTTP_OK) return -1;

            File tmp = new File(c.getFilesDir(), "ad_domains_new.txt");
            int n = 0;
            try (InputStream in = conn.getInputStream();
                 BufferedReader br = new BufferedReader(
                         new InputStreamReader(in, StandardCharsets.UTF_8), 65536);
                 Writer w = new OutputStreamWriter(
                         new FileOutputStream(tmp), StandardCharsets.UTF_8)) {
                String line;
                while ((line = br.readLine()) != null) {
                    String host = extractHost(line);
                    if (host != null && !host.startsWith("localhost")) {
                        w.write(host);
                        w.write('\n');
                        n++;
                    }
                }
            }
            if (n < 10000) { tmp.delete(); return -1; }
            File finalFile = new File(c.getFilesDir(), "ad_domains.txt");
            if (finalFile.exists()) finalFile.delete();
            if (!tmp.renameTo(finalFile)) return -1;
            refresh();
            prefs(c).edit().putInt(KEY_BLOCKLIST_VERSION, n).apply();
            return n;
        } catch (Exception e) {
            return -1;
        } finally {
            if (conn != null) conn.disconnect();
        }
    }

    /** Extrae el dominio de una linea formato hosts: "0.0.0.0 ejemplo.com". */
    private static String extractHost(String line) {
        if (line == null) return null;
        String s = line.trim();
        if (s.isEmpty() || s.startsWith("#")) return null;
        int i = s.indexOf('#');
        if (i >= 0) s = s.substring(0, i).trim();
        String[] parts = s.split("\\s+");
        if (parts.length < 2) return null;
        if (!parts[0].equals("0.0.0.0") && !parts[0].equals("::")) return null;
        String host = norm(parts[1]);
        return host.isEmpty() ? null : host;
    }

    private Blocklist() {}
}
