package com.bloqueador.anuncios;

import java.nio.ByteBuffer;
import java.util.Locale;

/** Utilidades mínimas para leer la pregunta DNS y responder NXDOMAIN. */
public final class DnsUtils {

    /** Devuelve el nombre consultado (sin el punto final) o null si no se puede leer. */
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
            if ((labelLen & 0xC0) != 0) return null; // compresión: unsupported en pregunta
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

    /** Construye una respuesta NXDOMAIN para la consulta recibida. */
    public static byte[] nxdomain(byte[] query, int len) {
        if (len < 12 || len > 1500) return null;
        // La pregunta completa: cabecera + QNAME + QTYPE/QCLASS.
        int qEnd = findQuestionEnd(query, len);
        if (qEnd < 0 || qEnd > len) return null;
        byte[] out = new byte[qEnd];
        System.arraycopy(query, 0, out, 0, qEnd);

        // flags: QR=1, AA=1, RA=1, RCODE=3 (NXDOMAIN)
        int flags = 0x8183;
        out[2] = (byte) (flags >> 8);
        out[3] = (byte) flags;

        // QDCOUNT se mantiene; ANCOUNT/NSCOUNT/ARCOUNT a 0
        put16(out, 6, 0);
        put16(out, 8, 0);
        put16(out, 10, 0);
        return out;
    }

    /** Construye una respuesta A=0.0.0.0 (útil para algunos juegos que ignoran NXDOMAIN). */
    public static byte[] zeroA(byte[] query, int len) {
        byte[] base = nxdomain(query, len);
        if (base == null) return null;
        int qEnd = base.length;

        byte[] answer = new byte[] {
            0, 0, 0, 1,       // NAME: puntero al offset 12
            0, 1,             // TYPE A
            0, 1,             // CLASS IN
            0, 0, 0, 60,      // TTL
            0, 4,             // RDLENGTH
            0, 0, 0, 0        // 0.0.0.0
        };
        answer[0] = (byte) 0xC0;
        answer[1] = 12;

        byte[] out = new byte[qEnd + answer.length];
        System.arraycopy(base, 0, out, 0, qEnd);
        System.arraycopy(answer, 0, out, qEnd, answer.length);
        put16(out, 2, 0x8180); // QR|AA|RA, RCODE=0
        put16(out, 6, 1);      // una respuesta
        return out;
    }

    /** Tipo de la pregunta (1 = A, 28 = AAAA). */
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
        return pos + 4; // + QTYPE + QCLASS
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
