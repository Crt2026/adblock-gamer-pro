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

/** Lista de dominios publicitarios orientada a juegos móviles y apps Android. */
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
        // Google / AdMob / DoubleClick / IMA / Medición
        "googleadservices.com", "doubleclick.net", "googlesyndication.com",
        "googleadapis.com", "googleads.com", "adservice.google.com",
        "ads.google.com", "pagead2.googlesyndication.com",
        "securepubads.g.doubleclick.net", "googletagservices.com",
        "imasdk.googleapis.com", "fundingchoicesmessages.google.com",
        "adtrafficquality.google", "ep1.adtrafficquality.google",
        "ep2.adtrafficquality.google", "csi.gstatic.com", "app-measurement.com",
        "adservice.google.cl", "adservice.google.es", "adservice.google.com.mx",
        "adservice.google.com.ar", "adservice.google.com.co", "adservice.google.com.pe",
        // Meta Audience Network
        "facebook.net", "facebookads.com", "audiencenetwork.com",
        "an.facebook.com", "ads.facebook.com", "fbads.com",
        // AppLovin / MAX / SafeDK
        "applovin.com", "app-lovin.com", "applvn.com", "al-cdn.com",
        "safedk.com", "rt.applovin.com",
        // Unity Ads (sin bloquear unity3d.com completo para no romper multijugador)
        "unityads.unity3d.com", "unityads.com", "config.unityads.unity3d.com",
        "unity3dusercontent.com", "config.uca.cloud.unity3d.com",
        "cdp.cloud.unity3d.com", "ads-privacy-api.prd.mz.internal.unity3d.com",
        "ads-game-configuration-master.ads.prd.ie.internal.unity3d.com",
        "thind-gke-usea.prd.data.corp.unity3d.com", "httpkafka.unityads.unity3d.com",
        // ironSource / LevelPlay / Supersonic
        "ironsource.com", "ironsrc.com", "ironsrc.mobi",
        "supersonicads.com", "supersonic.com", "isnssdk.com", "atom-data.io",
        // Vungle / Liftoff
        "vungle.com", "vungleads.com", "liftoff.io", "liftoff-creatives.io",
        // Pangle / ByteDance / TikTok Ads
        "pangle.io", "pangle-ads.com", "pangolin.com", "panglesdk.com",
        "pangolin-sdk-toutiao.com", "pangolin-sdk-toutiao-b.com", "pangolin-sdk-toutiao1.com",
        "pangolin16.sgsnssdk.com", "byteadx.com", "pglstatp.com", "byteadserving.com",
        "byteoversea.com", "ibytedtos.com", "tiktokads.com", "ads.tiktok.com",
        // Mintegral / Mobvista / Rayjump / Mollyflow / TopOn / TradPlus
        "mintegral.com", "mintegral.net", "mintegrals.com", "mtgads.com",
        "rayjump.com", "analytics-ios.rayjump.com", "mobvista.com",
        "mollyflow.com", "mmtk.mollyflow.com", "mmds.mollyflow.com",
        "anythinktech.com", "toponad.com", "tradplusad.com", "tradplus.com",
        "adtiming.com", "openmediation.com", "tappx.com",
        // Dominios camuflados / rotativos vistos en Emochi y SDKs móviles
        "thecatmachine.com", "x.thecatmachine.com",
        "blueduckredapple.com", "x.blueduckredapple.com",
        "appsflyersdk.com", "launches.appsflyersdk.com", "inapps.appsflyersdk.com",
        "attr.appsflyersdk.com", "cdn-settings.appsflyersdk.com",
        // Bigo / BidMachine / Appodeal / HyprMX / Ogury / Start.io / Digital Turbine
        "bigo.sg", "bigoad.com", "bidmachine.io", "bm-cdn.com",
        "appodeal.com", "appodealx.com", "ogury.com", "ogury.co", "presage.io",
        "hyprmx.com", "digitalturbine.com", "dtignite.com",
        "fyber.com", "inner-active.com", "inner-active.mobi",
        "startapp.com", "startappservice.com", "startappexchange.com", "start.io",
        "smaato.net", "smaato.com", "verve.com", "pubnative.net",
        "kidoz.net", "superawesome.tv", "yodo1.com", "yodo1api.com",
        // Moloco / AdColony / Chartboost / InMobi / Tapjoy / Yandex / VK / Medición
        "moloco.com", "molocoads.com", "adsmoloco.com", "moloco-ads.com",
        "dsp-api.moloco.com", "sdkopmetrics-us.dsp-api.moloco.com",
        "adcolony.com", "chartboost.com",
        "inmobi.com", "inmobicdn.net", "tapjoy.com",
        "doubleverify.com", "adsafeprotected.com", "moatads.com", "omid.io",
        "adx.ads.oppomobile.com", "ads.heytapmobile.com", "ads.xiaomi.com",
        "ad.xiaomi.com", "sdkconfig.ad.xiaomi.com",
        "yandexadexchange.net", "ads.vk.com", "mytarget.ru", "ad.mail.ru",
        // Exchanges, SSP y atribución publicitaria
        "pubmatic.com", "rubiconproject.com", "openx.net",
        "criteo.com", "criteo.net", "casalemedia.com", "bidswitch.net",
        "smartadserver.com", "adform.net", "somoaudience.com", "yieldmo.com",
        "triplelift.com", "3lift.com", "indexww.com", "sharethrough.com",
        "mobfox.com", "tapdaq.com", "admost.com", "mopub.com",
        "vpon.com", "adnxs.com", "adsrvr.org", "spotxchange.com", "spotx.tv",
        "tremorhub.com", "teads.tv", "taboola.com", "outbrain.com",
        "revcontent.com", "mgid.com", "propellerads.com", "kargo.com",
        "flurry.com", "adjust.com", "kochava.com", "singular.net", "tenjin.io", "branch.io",
        // DoH / DoT (impide que apps o WebView salten el filtro DNS)
        "dns.google", "dns.google.com", "dns64.dns.google",
        "cloudflare-dns.com", "chrome.cloudflare-dns.com",
        "1dot1dot1dot1.cloudflare-dns.com", "security.cloudflare-dns.com",
        "family.cloudflare-dns.com", "mozilla.cloudflare-dns.com",
        "dns.quad9.net", "dns9.quad9.net", "dns10.quad9.net", "dns11.quad9.net",
        "doh.opendns.com", "dns.adguard.com", "dns.adguard-dns.com",
        "family.adguard-dns.com", "doh.libredns.gr", "doh.cleanbrowsing.org",
        "dns.nextdns.io", "dns1.nextdns.io", "dns2.nextdns.io",
        "dns.switch.ch", "dns.mullvad.net", "adblock.dns.mullvad.net",
        "all.dns.mullvad.net", "extended.dns.mullvad.net", "base.dns.mullvad.net",
        "p2.freedns.controld.com", "freedns.controld.com", "dns.controld.com",
        "dot.nl.ahadns.net", "zero.dns0.eu", "family-filter-dns.cleanbrowsing.org",
        "x-oisd.freedns.controld.com", "x-hagezi-tif.freedns.controld.com",
        "x-adguard.freedns.controld.com", "x-stevenblack.freedns.controld.com"
    };

    private static volatile Set<String> ASSET_SET;

    private static Set<String> assetSet(Context c) {
        if (ASSET_SET != null) return ASSET_SET;
        synchronized (Blocklist.class) {
            if (ASSET_SET != null) return ASSET_SET;
            Set<String> set = new HashSet<>(180000);
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
                i = h.indexOf('.', i + 1);
                if (i < 0 || i == h.length() - 1) break;
            }
            i = -1;
            while (true) {
                String part = h.substring(i + 1);
                if (base.contains(part) || customBlock.contains(part)) return true;
                i = h.indexOf('.', i + 1);
                if (i < 0 || i == h.length() - 1) break;
            }
            return matchesAdPattern(h);
        }

        private static boolean matchesAdPattern(String h) {
            if (h.startsWith("adservice.google.")) return true;
            return h.contains(".moloco.") || h.contains(".adsmoloco.")
                    || h.contains(".rayjump.") || h.contains(".mintegral.")
                    || h.contains(".mollyflow.") || h.contains(".thecatmachine.")
                    || h.contains(".blueduckredapple.") || h.contains(".applovin.")
                    || h.contains(".applvn.") || h.contains(".pangle.")
                    || h.contains(".bidmachine.") || h.contains(".unityads.")
                    || h.contains(".ironsrc.") || h.contains(".ironsource.")
                    || h.contains(".vungle.") || h.contains(".doubleclick.")
                    || h.contains(".googlesyndication.") || h.contains(".googleadservices.")
                    || h.contains(".adtrafficquality.") || h.contains(".appsflyersdk.");
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

    public static int count(Context c) { return load(c).size(); }

    public static void refresh() { ASSET_SET = null; }

    /** Descarga y combina HaGeZi Multi Pro (muy potente en juegos) + StevenBlack. */
    public static int download(Context c) {
        Set<String> merged = new HashSet<>(260000);
        fetchInto("https://raw.githubusercontent.com/hagezi/dns-blocklists/main/domains/pro.txt", merged);
        if (merged.size() < 120000) {
            fetchInto("https://cdn.jsdelivr.net/gh/hagezi/dns-blocklists@latest/domains/pro.txt", merged);
        }
        fetchInto("https://raw.githubusercontent.com/StevenBlack/hosts/master/hosts", merged);
        if (merged.size() < 20000) return -1;

        File tmp = new File(c.getFilesDir(), "ad_domains_new.txt");
        try (Writer w = new OutputStreamWriter(
                new FileOutputStream(tmp), StandardCharsets.UTF_8)) {
            for (String host : merged) {
                w.write(host);
                w.write('\n');
            }
        } catch (Exception e) {
            tmp.delete();
            return -1;
        }
        File finalFile = new File(c.getFilesDir(), "ad_domains.txt");
        if (finalFile.exists()) finalFile.delete();
        if (!tmp.renameTo(finalFile)) return -1;
        refresh();
        prefs(c).edit().putInt(KEY_BLOCKLIST_VERSION, merged.size()).apply();
        return merged.size();
    }

    private static void fetchInto(String urlStr, Set<String> out) {
        HttpURLConnection conn = null;
        try {
            URL url = new URL(urlStr);
            conn = (HttpURLConnection) url.openConnection();
            conn.setInstanceFollowRedirects(true);
            conn.setConnectTimeout(15000);
            conn.setReadTimeout(45000);
            conn.setRequestMethod("GET");
            conn.setRequestProperty("User-Agent", "AdblockGamerPro/6.0");
            if (conn.getResponseCode() != HttpURLConnection.HTTP_OK) return;
            try (InputStream in = conn.getInputStream();
                 BufferedReader br = new BufferedReader(
                         new InputStreamReader(in, StandardCharsets.UTF_8), 65536)) {
                String line;
                while ((line = br.readLine()) != null) {
                    String host = extractHost(line);
                    if (host != null && !host.startsWith("localhost")) {
                        out.add(host);
                    }
                }
            }
        } catch (Exception ignored) {
        } finally {
            if (conn != null) conn.disconnect();
        }
    }

    private static String extractHost(String line) {
        if (line == null) return null;
        String s = line.trim();
        if (s.isEmpty() || s.startsWith("#") || s.startsWith("!")) return null;
        int i = s.indexOf('#');
        if (i >= 0) s = s.substring(0, i).trim();
        if (s.isEmpty()) return null;
        if (s.startsWith("||") && s.endsWith("^")) {
            s = s.substring(2, s.length() - 1);
        }
        String[] parts = s.split("\\s+");
        String raw = parts.length >= 2 && (parts[0].equals("0.0.0.0") || parts[0].equals("127.0.0.1") || parts[0].equals("::"))
                ? parts[1]
                : (parts.length == 1 ? parts[0] : null);
        if (raw == null) return null;
        String host = norm(raw);
        return host.contains(".") ? host : null;
    }

    private Blocklist() {}
}
