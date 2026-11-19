package com.bloqueador.anuncios;

import java.util.Locale;

/** Utilidades DNS: lectura de QNAME/QTYPE y respuestas 0.0.0.0, ::, NODATA y NXDOMAIN. */
public final class DnsUtils {

    public static String questionName(byte[] p, int len) {
        if (len < 12) return null;
        int qd = ((p[4] & 0xFF) << 8) | (p[5] & 0xFF);
        if (qd < 1) return null;
        int pos = 12;
        StringBuilder sb = new StringBuilder();
        int jumps = 0;
        while (pos < len && jumps++ < 128) {
            int labelLen = p[pos] & 0xFF;
            if (labelLen == 0) {
                pos++;
                break;
            }
            if ((labelLen & 0xC0) != 0) return null;
            pos++;
            if (pos + labelLen > len) return null;
            for (int i = 0; i < labelLen; i++) {
                int ch = p[pos + i] & 0xFF;
                sb.append((char) (ch >= 32 && ch < 127 ? ch : '?'));
            }
            sb.append('.');
            pos += labelLen;
        }
        if (sb.length() == 0) return null;
        String host = sb.toString();
        if (host.endsWith(".")) host = host.substring(0, host.length() - 1);
        return host.toLowerCase(Locale.ROOT);
    }

    /** Respuesta NXDOMAIN (RCODE=3). */
    public static byte[] nxdomain(byte[] query, int len) {
        if (len < 12 || len > 1500) return null;
        int qEnd = findQuestionEnd(query, len);
        if (qEnd < 0 || qEnd > len) return null;
        byte[] out = new byte[qEnd];
        System.arraycopy(query, 0, out, 0, qEnd);
        put16(out, 2, 0x8183);
        put16(out, 6, 0);
        put16(out, 8, 0);
        put16(out, 10, 0);
        return out;
    }

    /** Respuesta NODATA (RCODE=0, ANCOUNT=0) para AAAA / HTTPS / SVCB. */
    public static byte[] nodata(byte[] query, int len) {
        byte[] out = nxdomain(query, len);
        if (out == null) return null;
        put16(out, 2, 0x8180);
        return out;
    }

    /** Respuesta A=0.0.0.0. */
    public static byte[] zeroA(byte[] query, int len) {
        byte[] base = nodata(query, len);
        if (base == null) return null;
        int qEnd = base.length;
        byte[] answer = new byte[] {
            (byte) 0xC0, 12,
            0, 1,             // TYPE A
            0, 1,             // CLASS IN
            0, 0, 0, 60,      // TTL 60s
            0, 4,             // RDLENGTH 4
            0, 0, 0, 0        // 0.0.0.0
        };
        byte[] out = new byte[qEnd + answer.length];
        System.arraycopy(base, 0, out, 0, qEnd);
        System.arraycopy(answer, 0, out, qEnd, answer.length);
        put16(out, 6, 1);
        return out;
    }

    /** Respuesta AAAA=:: (16 bytes en cero). */
    public static byte[] zeroAAAA(byte[] query, int len) {
        byte[] base = nodata(query, len);
        if (base == null) return null;
        int qEnd = base.length;
        byte[] answer = new byte[] {
            (byte) 0xC0, 12,
            0, 28,            // TYPE AAAA
            0, 1,             // CLASS IN
            0, 0, 0, 60,      // TTL 60s
            0, 16,            // RDLENGTH 16
            0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0
        };
        byte[] out = new byte[qEnd + answer.length];
        System.arraycopy(base, 0, out, 0, qEnd);
        System.arraycopy(answer, 0, out, qEnd, answer.length);
        put16(out, 6, 1);
        return out;
    }

    public static void setId(byte[] dns, int id) {
        if (dns != null && dns.length >= 2) put16(dns, 0, id);
    }

    public static int qtype(byte[] p, int len) {
        int pos = 12;
        int jumps = 0;
        while (pos < len && jumps++ < 128) {
            int l = p[pos] & 0xFF;
            if (l == 0) { pos++; break; }
            if ((l & 0xC0) != 0) return -1;
            pos += 1 + l;
        }
        if (pos + 2 > len) return -1;
        return u16(p, pos);
    }

    private static int findQuestionEnd(byte[] p, int len) {
        int pos = 12;
        int jumps = 0;
        while (pos < len && jumps++ < 128) {
            int l = p[pos] & 0xFF;
            if (l == 0) {
                pos++;
                break;
            }
            if ((l & 0xC0) != 0) return -1;
            pos += 1 + l;
        }
        if (pos + 4 > len) return -1;
        return pos + 4;
    }

    private static void put16(byte[] b, int i, int v) {
        b[i] = (byte) (v >> 8);
        b[i + 1] = (byte) v;
    }

    public static int u16(byte[] b, int i) {
        return ((b[i] & 0xFF) << 8) | (b[i + 1] & 0xFF);
    }

    private DnsUtils() {}
}
