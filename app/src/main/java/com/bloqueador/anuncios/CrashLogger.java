package com.bloqueador.anuncios;

import android.content.Context;

import java.io.File;
import java.io.FileWriter;
import java.io.PrintWriter;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;

/** Guarda cualquier error de la app en un archivo para poder diagnosticarlo. */
public final class CrashLogger {

    private static final String FILE = "crash_log.txt";

    public static void install(final Context app) {
        final Thread.UncaughtExceptionHandler original =
                Thread.getDefaultUncaughtExceptionHandler();
        Thread.setDefaultUncaughtExceptionHandler((thread, error) -> {
            try {
                File f = new File(app.getFilesDir(), FILE);
                PrintWriter w = new PrintWriter(new FileWriter(f, false));
                w.println("FECHA: " + new SimpleDateFormat("yyyy-MM-dd HH:mm:ss",
                        Locale.getDefault()).format(new Date()));
                w.println("Hilo: " + thread.getName());
                w.println("Error: " + error);
                w.println();
                error.printStackTrace(w);
                w.close();
            } catch (Throwable ignored) {
            }
            if (original != null) original.uncaughtException(thread, error);
            else System.exit(1);
        });
    }

    /** Devuelve el ultimo error guardado, o un mensaje si no hay ninguno. */
    public static String read(Context c) {
        try {
            File f = new File(c.getFilesDir(), FILE);
            if (!f.exists()) return "No hay errores registrados.";
            StringBuilder sb = new StringBuilder();
            java.io.BufferedReader br = new java.io.BufferedReader(new java.io.FileReader(f));
            String line;
            while ((line = br.readLine()) != null) sb.append(line).append('\n');
            br.close();
            return sb.length() == 0 ? "No hay errores registrados." : sb.toString();
        } catch (Exception e) {
            return "No se pudo leer el registro: " + e.getMessage();
        }
    }

    public static void clear(Context c) {
        try { new File(c.getFilesDir(), FILE).delete(); } catch (Exception ignored) {}
    }

    /** Guarda un error sin cerrar la app (se usa cuando se captura a tiempo). */
    public static void log(Context c, Throwable t) {
        try {
            File f = new File(c.getFilesDir(), FILE);
            PrintWriter w = new PrintWriter(new FileWriter(f, true));
            w.println("FECHA: " + new SimpleDateFormat("yyyy-MM-dd HH:mm:ss",
                    Locale.getDefault()).format(new Date()));
            t.printStackTrace(w);
            w.close();
        } catch (Throwable ignored) {}
    }

    private CrashLogger() {}
}
