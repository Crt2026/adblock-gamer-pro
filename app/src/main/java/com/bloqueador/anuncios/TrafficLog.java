package com.bloqueador.anuncios;

import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.Locale;
import java.util.concurrent.CopyOnWriteArrayList;

/** Historial en vivo de dominios que pasan por el filtro. */
public final class TrafficLog {

    public static final class Entry {
        public final String domain;
        public final String time;
        public final boolean blocked;

        Entry(String domain, String time, boolean blocked) {
            this.domain = domain;
            this.time = time;
            this.blocked = blocked;
        }
    }

    private static final int MAX = 60;
    private static final CopyOnWriteArrayList<Entry> ENTRIES = new CopyOnWriteArrayList<>();
    private static final SimpleDateFormat FMT =
            new SimpleDateFormat("HH:mm:ss", Locale.getDefault());

    public static void add(String domain, boolean blocked) {
        if (domain == null || domain.isEmpty()) return;
        String time;
        synchronized (FMT) {
            time = FMT.format(new Date());
        }
        // Si el mismo dominio ya esta, lo movemos arriba con el nuevo estado.
        for (Entry e : ENTRIES) {
            if (e.domain.equals(domain)) {
                ENTRIES.remove(e);
                break;
            }
        }
        ENTRIES.add(0, new Entry(domain, time, blocked));
        while (ENTRIES.size() > MAX) {
            ENTRIES.remove(ENTRIES.size() - 1);
        }
    }

    public static List<Entry> recent(int n) {
        List<Entry> out = new ArrayList<>();
        for (int i = 0; i < Math.min(n, ENTRIES.size()); i++) out.add(ENTRIES.get(i));
        return out;
    }

    public static void clear() { ENTRIES.clear(); }

    private TrafficLog() {}
}
