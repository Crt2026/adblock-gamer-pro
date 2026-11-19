package com.bloqueador.anuncios;

/** Proveedores DNS con filtro de anuncios utilizables como upstream del tunel. */
public final class DnsProviders {

    public static final class Provider {
        public final String name;
        public final String primary;
        public final String secondary;
        public final String dotHost;
        public final String note;

        Provider(String name, String primary, String secondary, String dotHost, String note) {
            this.name = name;
            this.primary = primary;
            this.secondary = secondary;
            this.dotHost = dotHost;
            this.note = note;
        }
    }

    public static final Provider[] ALL = {
        new Provider("AdGuard DNS", "94.140.14.14", "94.140.15.15",
                "dns.adguard-dns.com", "Anuncios, rastreadores y malware"),
        new Provider("AdGuard Familiar", "94.140.14.15", "94.140.15.16",
                "family.adguard-dns.com", "Ademas bloquea contenido adulto"),
        new Provider("Control D (Ads)", "76.76.2.2", "76.76.10.2",
                "p2.freedns.controld.com", "Anuncios, rastreo y malware"),
        new Provider("Control D + OISD (recomendado)", "76.76.2.32", "76.76.10.32",
                "x-oisd.freedns.controld.com", "Lista OISD Full: muy fuerte en anuncios"),
        new Provider("Control D + Hagezi", "76.76.2.46", "76.76.10.46",
                "x-hagezi-tif.freedns.controld.com", "Hagezi TIF: ideal para juegos y móvil"),
        new Provider("Control D + AdGuard", "76.76.2.44", "76.76.10.44",
                "x-adguard.freedns.controld.com", "Filtro AdGuard sobre Control D"),
        new Provider("Control D + StevenBlack", "76.76.2.35", "76.76.10.35",
                "x-stevenblack.freedns.controld.com", "Misma lista base de esta app"),
        new Provider("AhaDNS", "5.2.75.75", "185.213.26.187",
                "dot.nl.ahadns.net", "Anuncios y rastreo general"),
        new Provider("DNS0.eu", "193.110.81.1", "185.253.5.1",
                "zero.dns0.eu", "Proteccion europea"),
        new Provider("CleanBrowsing Family", "185.228.168.168", "185.228.169.168",
                "family-filter-dns.cleanbrowsing.org", "Familiar + publicidad maliciosa"),
        new Provider("Alternate DNS", "76.76.19.19", "76.223.122.150",
                "", "Filtro basico de banners"),
        new Provider("Cloudflare (sin filtro)", "1.1.1.1", "1.0.0.1",
                "cloudflare-dns.com", "Solo filtra la app, no el proveedor")
    };

    /** Proveedor que se activa de fabrica (Control D + OISD). */
    public static final int DEFAULT = 3;

    public static Provider get(int index) {
        if (index < 0 || index >= ALL.length) return ALL[0];
        return ALL[index];
    }

    /** IPs que deben enrutarse al tunel para cortar DoT/DoH del propio proveedor. */
    public static String[] allIps() {
        String[] out = new String[ALL.length * 2];
        int i = 0;
        for (Provider p : ALL) {
            out[i++] = p.primary;
            out[i++] = p.secondary;
        }
        return out;
    }

    private DnsProviders() {}
}
