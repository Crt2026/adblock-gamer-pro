package com.bloqueador.anuncios;

import java.nio.charset.StandardCharsets;
import java.util.Locale;

/** Extrae el SNI (hostname) de un ClientHello TLS sin descifrar nada. */
public final class SniParser {

    public static String extract(byte[] p, int off, int len) {
        try {
            if (len < 5 || (p[off] & 0xFF) != 0x16) return null; // TLS handshake
            int pos = off + 5; // type(1) + version(2) + length(2)
            if (pos - off >= len || (p[pos] & 0xFF) != 0x01) return null; // ClientHello
            pos += 4; // tipo(1) + longitud(3)
            if (pos + 2 > off + len) return null;
            pos += 2; // client version
            pos += 32; // random
            if (pos >= off + len) return null;
            int sidLen = p[pos++] & 0xFF;
            pos += sidLen;
            if (pos + 2 > off + len) return null;
            int cipherLen = u16(p, pos);
            pos += 2 + cipherLen;
            if (pos >= off + len) return null;
            int compLen = p[pos++] & 0xFF;
            pos += compLen;
            if (pos + 2 > off + len) return null;
            int extLen = u16(p, pos);
            pos += 2;
            int end = Math.min(off + len, pos + extLen);
            while (pos + 4 <= end) {
                int type = u16(p, pos);
                int dataLen = u16(p, pos + 2);
                pos += 4;
                if (pos + dataLen > end) return null;
                if (type == 0x0000) { // server_name
                    int q = pos;
                    if (q + 2 > pos + dataLen) return null;
                    q += 2; // server_name_list length
                    if (q + 1 > pos + dataLen) return null;
                    int nameType = p[q++] & 0xFF;
                    if (nameType != 0) return null; // host_name
                    if (q + 2 > pos + dataLen) return null;
                    int nameLen = u16(p, q);
                    q += 2;
                    if (nameLen <= 0 || q + nameLen > pos + dataLen) return null;
                    return new String(p, q, nameLen, StandardCharsets.US_ASCII)
                            .toLowerCase(Locale.ROOT);
                }
                pos += dataLen;
            }
        } catch (Exception ignored) {
        }
        return null;
    }

    private static int u16(byte[] b, int i) {
        return ((b[i] & 0xFF) << 8) | (b[i + 1] & 0xFF);
    }

    private SniParser() {}
}
