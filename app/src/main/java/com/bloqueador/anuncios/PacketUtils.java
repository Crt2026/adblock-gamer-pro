package com.bloqueador.anuncios;

/** Parseo y construcción de paquetes IPv4 / TCP / UDP. */
public final class PacketUtils {

    public static final int PROTO_TCP = 6;
    public static final int PROTO_UDP = 17;

    public static final int FLAG_FIN = 0x01;
    public static final int FLAG_SYN = 0x02;
    public static final int FLAG_RST = 0x04;
    public static final int FLAG_PSH = 0x08;
    public static final int FLAG_ACK = 0x10;

    public static final class Ip4 {
        public byte[] raw;
        public int length;
        public int src;
        public int dst;
        public int proto;
        public int srcPort;
        public int dstPort;
        public int seq;
        public int ack;
        public int flags;
        public int payloadOffset;
        public int payloadLength;
        public int ipHeaderLength;
    }

    public static Ip4 parse(byte[] p, int len) {
        if (len < 20 || (p[0] >> 4) != 4) return null;
        int ihl = (p[0] & 0x0F) * 4;
        if (ihl < 20 || ihl > len) return null;
        int total = u16(p, 2);
        if (total < ihl || total > len) total = len;
        Ip4 r = new Ip4();
        r.raw = p;
        r.length = total;
        r.ipHeaderLength = ihl;
        r.src = u32(p, 12);
        r.dst = u32(p, 16);
        r.proto = p[9] & 0xFF;
        if (r.proto == PROTO_TCP) {
            if (total < ihl + 20) return null;
            int o = ihl;
            r.srcPort = u16(p, o);
            r.dstPort = u16(p, o + 2);
            r.seq = u32(p, o + 4);
            r.ack = u32(p, o + 8);
            int doff = ((p[o + 12] >> 4) & 0x0F) * 4;
            if (doff < 20) doff = 20;
            r.flags = p[o + 13] & 0x3F;
            r.payloadOffset = o + doff;
            r.payloadLength = Math.max(0, total - r.payloadOffset);
        } else if (r.proto == PROTO_UDP) {
            if (total < ihl + 8) return null;
            int o = ihl;
            r.srcPort = u16(p, o);
            r.dstPort = u16(p, o + 2);
            int ulen = u16(p, o + 4);
            r.payloadOffset = o + 8;
            r.payloadLength = Math.max(0, Math.min(ulen - 8, total - r.payloadOffset));
        } else {
            r.payloadOffset = ihl;
            r.payloadLength = total - ihl;
        }
        return r;
    }

    /** Paquete TCP completo (IPv4 + TCP + payload) listo para escribir en el TUN. */
    public static byte[] tcp(int srcIp, int dstIp, int srcPort, int dstPort,
                             int seq, int ack, int flags, byte[] payload, int mss) {
        boolean withMss = (flags & FLAG_SYN) != 0 && mss > 0;
        int tcpLen = 20 + (withMss ? 4 : 0) + (payload == null ? 0 : payload.length);
        int total = 20 + tcpLen;
        byte[] p = new byte[total];

        p[0] = 0x45;
        put16(p, 2, total);
        put16(p, 4, 0x1234);
        put16(p, 6, 0x4000); // Don't Fragment
        p[8] = 64;
        p[9] = PROTO_TCP;
        put32(p, 12, srcIp);
        put32(p, 16, dstIp);

        int o = 20;
        put16(p, o, srcPort);
        put16(p, o + 2, dstPort);
        put32(p, o + 4, seq);
        put32(p, o + 8, ack);
        p[o + 12] = (byte) ((withMss ? 6 : 5) << 4);
        p[o + 13] = (byte) flags;
        put16(p, o + 14, 65535);
        if (withMss) {
            p[o + 20] = 2;
            p[o + 21] = 4;
            put16(p, o + 22, mss);
        }
        if (payload != null && payload.length > 0) {
            System.arraycopy(payload, 0, p, o + 20 + (withMss ? 4 : 0), payload.length);
        }
        put16(p, 10, checksum(p, 0, 20));
        int csum = transportChecksum(srcIp, dstIp, PROTO_TCP, p, o, tcpLen);
        put16(p, o + 16, csum);
        return p;
    }

    /** Paquete UDP completo (IPv4 + UDP + payload). */
    public static byte[] udp(int srcIp, int dstIp, int srcPort, int dstPort, byte[] payload) {
        int len = payload == null ? 0 : payload.length;
        int total = 20 + 8 + len;
        byte[] p = new byte[total];
        p[0] = 0x45;
        put16(p, 2, total);
        put16(p, 4, 0x4321);
        p[8] = 64;
        p[9] = PROTO_UDP;
        put32(p, 12, srcIp);
        put32(p, 16, dstIp);
        int o = 20;
        put16(p, o, srcPort);
        put16(p, o + 2, dstPort);
        put16(p, o + 4, 8 + len);
        if (len > 0) System.arraycopy(payload, 0, p, o + 8, len);
        put16(p, 10, checksum(p, 0, 20));
        put16(p, o + 6, transportChecksum(srcIp, dstIp, PROTO_UDP, p, o, 8 + len));
        return p;
    }

    public static int transportChecksum(int srcIp, int dstIp, int proto, byte[] buf, int off, int len) {
        byte[] pseudo = new byte[12 + len + (len % 2)];
        put32(pseudo, 0, srcIp);
        put32(pseudo, 4, dstIp);
        pseudo[8] = 0;
        pseudo[9] = (byte) proto;
        put16(pseudo, 10, len);
        System.arraycopy(buf, off, pseudo, 12, len);
        return checksum(pseudo, 0, pseudo.length);
    }

    public static int checksum(byte[] b, int off, int len) {
        long sum = 0;
        int i = off;
        while (len > 1) {
            sum += ((b[i] & 0xFF) << 8) | (b[i + 1] & 0xFF);
            i += 2;
            len -= 2;
        }
        if (len == 1) sum += (b[i] & 0xFF) << 8;
        while ((sum >> 16) != 0) sum = (sum & 0xFFFF) + (sum >> 16);
        return (int) ((~sum) & 0xFFFFL);
    }

    public static void put16(byte[] b, int i, int v) {
        b[i] = (byte) (v >> 8);
        b[i + 1] = (byte) v;
    }

    public static void put32(byte[] b, int i, int v) {
        b[i] = (byte) (v >> 24);
        b[i + 1] = (byte) (v >> 16);
        b[i + 2] = (byte) (v >> 8);
        b[i + 3] = (byte) v;
    }

    public static int u16(byte[] b, int i) {
        return ((b[i] & 0xFF) << 8) | (b[i + 1] & 0xFF);
    }

    public static int u32(byte[] b, int i) {
        return ((b[i] & 0xFF) << 24) | ((b[i + 1] & 0xFF) << 16)
                | ((b[i + 2] & 0xFF) << 8) | (b[i + 3] & 0xFF);
    }

    public static String ipToString(int ip) {
        return (ip >>> 24) + "." + ((ip >>> 16) & 0xFF) + "."
                + ((ip >>> 8) & 0xFF) + "." + (ip & 0xFF);
    }

    public static int ipToInt(String s) {
        String[] a = s.split("\\.");
        return (Integer.parseInt(a[0]) << 24) | (Integer.parseInt(a[1]) << 16)
                | (Integer.parseInt(a[2]) << 8) | Integer.parseInt(a[3]);
    }

    private PacketUtils() {}
}
