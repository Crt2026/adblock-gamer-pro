package com.bloqueador.anuncios;

import android.Manifest;
import android.app.Activity;
import android.app.AlertDialog;
import android.app.NotificationManager;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.graphics.Color;
import android.graphics.Typeface;
import android.net.ConnectivityManager;
import android.net.NetworkInfo;
import android.net.Uri;
import android.net.VpnService;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.os.PowerManager;
import android.provider.Settings;
import android.view.Gravity;
import android.view.View;
import android.view.ViewGroup;
import android.widget.AdapterView;
import android.widget.ArrayAdapter;
import android.widget.Button;
import android.widget.EditText;
import android.widget.ImageView;
import android.widget.LinearLayout;
import android.widget.ScrollView;
import android.widget.Spinner;
import android.widget.Switch;
import android.widget.TextView;
import android.widget.Toast;

import java.util.List;

public class MainActivity extends Activity {

    private static final int REQ_VPN = 42;
    private static final int REQ_NOTIF = 43;

    private LinearLayout btnPower, boxHistory, boxPerms;
    private ImageView ivKey;
    private TextView tvState, tvSub, tvNetwork, tvKeyLabel;
    private TextView tvAds, tvQueries, tvLast, tvStats, tvRules, tvManual, tvPerms;
    private Switch swSni, swQuic, swDot, swMeta, swNotify;
    private Spinner spProvider;
    private EditText etBlock, etAllow;
    private SharedPreferences prefs;
    private final Handler handler = new Handler(Looper.getMainLooper());
    private boolean loadingPrefs = false;
    private long enabledAt = 0;

    private final Runnable ticker = new Runnable() {
        @Override public void run() {
            try {
                refresh();
            } catch (Throwable t) {
                CrashLogger.log(MainActivity.this, t);
            }
            handler.postDelayed(this, 1000);
        }
    };

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        CrashLogger.install(getApplicationContext());
        try {
            prefs = Blocklist.prefs(this);

            if (!prefs.getBoolean(Blocklist.KEY_DNS_MIGRATED_32, false)) {
                prefs.edit()
                        .putInt(Blocklist.KEY_DNS_PROVIDER, DnsProviders.DEFAULT)
                        .putBoolean(Blocklist.KEY_DNS_MIGRATED_32, true)
                        .apply();
            }

            setContentView(buildUi());
            loadPrefs();
            refresh();
            requestNotifications();
            handler.post(ticker);
        } catch (Throwable t) {
            CrashLogger.log(this, t);
            showErrorScreen(t);
        }
    }

    /** Pantalla de emergencia: nunca cerramos la app sin explicar el motivo. */
    private void showErrorScreen(Throwable t) {
        LinearLayout box = new LinearLayout(this);
        box.setOrientation(LinearLayout.VERTICAL);
        box.setBackgroundColor(Color.parseColor("#080B14"));
        box.setPadding(dp(18), dp(24), dp(18), dp(24));
        TextView t1 = new TextView(this);
        t1.setText("HUBO UN ERROR AL ABRIR");
        t1.setTextSize(18);
        t1.setTypeface(null, Typeface.BOLD);
        t1.setTextColor(Color.parseColor("#FF3B5C"));
        box.addView(t1);
        TextView t2 = new TextView(this);
        t2.setText(String.valueOf(t));
        t2.setTextSize(11);
        t2.setTextColor(Color.parseColor("#E8F0FF"));
        t2.setPadding(0, dp(12), 0, dp(12));
        box.addView(t2);
        Button retry = new Button(this);
        retry.setText("Reintentar");
        retry.setOnClickListener(v -> recreate());
        box.addView(retry);
        Button diag = new Button(this);
        diag.setText("Ver registro de errores");
        diag.setOnClickListener(v -> showDiagnostic());
        box.addView(diag);
        Button reset = new Button(this);
        reset.setText("Borrar datos y volver al inicio");
        reset.setOnClickListener(v -> {
            try {
                getSharedPreferences(Blocklist.PREFS, MODE_PRIVATE).edit().clear().apply();
                CrashLogger.clear(this);
                recreate();
            } catch (Exception ignored) {}
        });
        box.addView(reset);
        setContentView(box);
    }

    private void showDiagnostic() {
        try {
            new AlertDialog.Builder(this)
                    .setTitle("Registro de errores")
                    .setMessage(CrashLogger.read(this))
                    .setPositiveButton("Borrar", (d, w) -> CrashLogger.clear(this))
                    .setNeutralButton("Cerrar", null)
                    .show();
        } catch (Exception ignored) {}
    }

    @Override protected void onResume() {
        super.onResume();
        refresh();
    }

    @Override protected void onDestroy() {
        handler.removeCallbacks(ticker);
        super.onDestroy();
    }

    // ---------------------------------------------------------------- UI

    private ViewGroup buildUi() {
        int p = dp(16);
        LinearLayout root = new LinearLayout(this);
        root.setOrientation(LinearLayout.VERTICAL);
        root.setBackgroundColor(Color.parseColor("#080B14"));
        root.setPadding(p, dp(18), p, dp(30));

        // --- Cabecera ---
        TextView title = new TextView(this);
        title.setText("ADBLOCK GAMER PRO");
        title.setTextSize(19);
        title.setTypeface(null, Typeface.BOLD);
        title.setTextColor(Color.parseColor("#00E5FF"));
        title.setGravity(Gravity.CENTER);
        root.addView(title);

        tvSub = new TextView(this);
        tvSub.setText("Bloqueador para juegos y apps");
        tvSub.setTextSize(12);
        tvSub.setTextColor(Color.parseColor("#8FA3C8"));
        tvSub.setGravity(Gravity.CENTER);
        root.addView(tvSub);

        tvNetwork = new TextView(this);
        tvNetwork.setTextSize(11);
        tvNetwork.setTextColor(Color.parseColor("#00FF9D"));
        tvNetwork.setGravity(Gravity.CENTER);
        tvNetwork.setPadding(0, dp(4), 0, dp(12));
        root.addView(tvNetwork);

        // --- Boton central ---
        btnPower = new LinearLayout(this);
        btnPower.setOrientation(LinearLayout.VERTICAL);
        btnPower.setGravity(Gravity.CENTER);
        int size = dp(150);
        btnPower.setLayoutParams(new LinearLayout.LayoutParams(size, size));
        btnPower.setBackgroundResource(R.drawable.bg_gamer_off);
        ivKey = new ImageView(this);
        ivKey.setImageResource(R.drawable.ic_key_gamer);
        ivKey.setLayoutParams(new LinearLayout.LayoutParams(dp(62), dp(62)));
        btnPower.addView(ivKey);
        tvKeyLabel = new TextView(this);
        tvKeyLabel.setText("ACTIVAR");
        tvKeyLabel.setTextSize(13);
        tvKeyLabel.setTypeface(null, Typeface.BOLD);
        tvKeyLabel.setTextColor(Color.WHITE);
        tvKeyLabel.setPadding(0, dp(6), 0, 0);
        btnPower.addView(tvKeyLabel);
        LinearLayout powerWrap = new LinearLayout(this);
        powerWrap.setGravity(Gravity.CENTER);
        powerWrap.addView(btnPower);
        root.addView(powerWrap);
        btnPower.setOnClickListener(v -> toggleProtection());

        tvState = new TextView(this);
        tvState.setText("DESPROTEGIDO");
        tvState.setTextSize(20);
        tvState.setTypeface(null, Typeface.BOLD);
        tvState.setGravity(Gravity.CENTER);
        tvState.setTextColor(Color.parseColor("#FF3B5C"));
        tvState.setPadding(0, dp(12), 0, dp(2));
        root.addView(tvState);

        TextView hint = new TextView(this);
        hint.setText("Los anuncios de tus juegos se están bloqueando");
        hint.setTextSize(11);
        hint.setTextColor(Color.parseColor("#8FA3C8"));
        hint.setGravity(Gravity.CENTER);
        root.addView(hint);

        // --- Contadores ---
        LinearLayout counters = new LinearLayout(this);
        counters.setOrientation(LinearLayout.HORIZONTAL);
        counters.setWeightSum(2);
        counters.setPadding(0, dp(14), 0, dp(6));
        tvAds = counterCard(counters, "0", "Anuncios\nbloqueados", "#00FF9D");
        tvQueries = counterCard(counters, "0", "Consultas\nanalyzadas", "#00E5FF");
        root.addView(counters);

        // --- Ultimo dominio ---
        LinearLayout lastCard = card();
        TextView l1 = small("ÚLTIMO DOMINIO BLOQUEADO", "#B026FF");
        lastCard.addView(l1);
        tvLast = new TextView(this);
        tvLast.setText("—");
        tvLast.setTextSize(13);
        tvLast.setTypeface(Typeface.MONOSPACE, Typeface.BOLD);
        tvLast.setTextColor(Color.parseColor("#E8F0FF"));
        lastCard.addView(tvLast);
        root.addView(lastCard);

        // --- Estadisticas ---
        LinearLayout statsCard = card();
        statsCard.addView(small("ESTADÍSTICAS DEL TÚNEL", "#00E5FF"));
        tvStats = new TextView(this);
        tvStats.setTextSize(11);
        tvStats.setTextColor(Color.parseColor("#E8F0FF"));
        tvStats.setLineSpacing(0, 1.35f);
        statsCard.addView(tvStats);
        root.addView(statsCard);

        // --- Opciones ---
        root.addView(sectionTitle("PROTECCIÓN AVANZADA"));
        root.addView(gamerSwitch("Bloquear anuncios por IP fija",
                "Corta anuncios que llegan por IP sin usar DNS. Vigila 73 direcciones.", 0));
        root.addView(gamerSwitch("Anuncios de Meta bloqueados",
                "Corta 'Ads served by Meta' (Facebook, Instagram). Las apps de Meta quedan fuera de la VPN para no romper chats.", 1));
        root.addView(gamerSwitch("Bloquear QUIC (UDP 443)",
                "Impide que los anuncios esquiven el filtro con HTTP/3.", 2));
        root.addView(gamerSwitch("Bloquear DNS cifrado (853 / DoH)",
                "Corta DoT y DoH en IPv4 e IPv6 para que ninguna app resuelva nombres fuera del filtro.", 3));
        root.addView(gamerSwitch("Notificar cada anuncio bloqueado",
                "Aviso silencioso por cada dominio publicitario cortado.", 4));

        // --- Servidor DNS ---
        LinearLayout dnsCard = card();
        dnsCard.addView(small("SERVIDOR DNS (SE APLICA EN WI-FI Y DATOS)", "#00E5FF"));
        spProvider = new Spinner(this);
        String[] names = new String[DnsProviders.ALL.length];
        for (int i = 0; i < names.length; i++) names[i] = DnsProviders.ALL[i].name;
        ArrayAdapter<String> ad = new ArrayAdapter<>(this,
                android.R.layout.simple_spinner_dropdown_item, names);
        spProvider.setAdapter(ad);
        dnsCard.addView(spProvider);
        // El listener se coloca en loadPrefs(), despues de fijar la seleccion,
        // para que el evento inicial NO cambie el proveedor guardado.
        root.addView(dnsCard);

        // --- Historial en vivo ---
        root.addView(sectionTitle("HISTORIAL DE TRÁFICO EN VIVO"));
        TextView histInfo = new TextView(this);
        histInfo.setText("Dominios que pasan por el filtro. Rojo = bloqueado, verde = permitido."
                + " Toca Permitir o Bloquear para cambiar uno.");
        histInfo.setTextSize(11);
        histInfo.setTextColor(Color.parseColor("#8FA3C8"));
        root.addView(histInfo);
        boxHistory = new LinearLayout(this);
        boxHistory.setOrientation(LinearLayout.VERTICAL);
        root.addView(boxHistory);
        tvManual = new TextView(this);
        tvManual.setTextSize(11);
        tvManual.setTextColor(Color.parseColor("#8FA3C8"));
        tvManual.setPadding(dp(4), dp(6), dp(4), dp(4));
        root.addView(tvManual);
        Button reset = gamerButton("Restablecer reglas manuales", "#B026FF");
        reset.setOnClickListener(v -> {
            prefs.edit().putString(Blocklist.KEY_CUSTOM_BLOCK, "")
                    .putString(Blocklist.KEY_CUSTOM_ALLOW, "").apply();
            reloadRules();
            toast("Reglas manuales borradas");
        });
        root.addView(reset);

        // --- Anuncios en cache ---
        root.addView(sectionTitle("ANUNCIOS YA GUARDADOS EN CACHE"));
        TextView cacheInfo = new TextView(this);
        cacheInfo.setText("Si un anuncio se descargó antes de activar, puede salir una vez más."
                + " Para quitarlo, vacía la caché de Google Play Services y del juego.");
        cacheInfo.setTextSize(11);
        cacheInfo.setTextColor(Color.parseColor("#8FA3C8"));
        root.addView(cacheInfo);
        Button play = gamerButton("Abrir Google Play Services", "#00E5FF");
        play.setOnClickListener(v -> openPackage("com.google.android.gms"));
        root.addView(play);
        Button allApps = gamerButton("Ver todas las apps", "#00E5FF");
        allApps.setOnClickListener(v -> {
            Intent i = new Intent(Settings.ACTION_APPLICATION_SETTINGS);
            try { startActivity(i); } catch (Exception e) { toast("No se pudo abrir"); }
        });
        root.addView(allApps);
        Button update = gamerButton("Actualizar lista de bloqueo (descargar)", "#00FF9D");
        update.setOnClickListener(v -> {
            toast("Descargando lista desde Internet...");
            new Thread(() -> {
                int n = Blocklist.download(this);
                handler.post(() -> {
                    if (n > 0) {
                        reloadRules();
                        tvRules.setText(Blocklist.stats(this));
                        toast("Lista actualizada: " + String.format("%,d", n) + " dominios");
                    } else {
                        toast("No se pudo descargar. Se mantiene la lista incluida.");
                    }
                });
            }, "UpdateList").start();
        });
        root.addView(update);

        // --- Permisos ---
        root.addView(sectionTitle("PERMISOS DESDE ANDROID"));
        boxPerms = new LinearLayout(this);
        boxPerms.setOrientation(LinearLayout.VERTICAL);
        root.addView(boxPerms);
        tvPerms = new TextView(this);
        tvPerms.setTextSize(11);
        tvPerms.setTextColor(Color.parseColor("#8FA3C8"));
        root.addView(tvPerms);
        Button vpnBtn = gamerButton("Dar permiso VPN", "#00E5FF");
        vpnBtn.setOnClickListener(v -> startProtection());
        root.addView(vpnBtn);
        Button notifBtn = gamerButton("Activar notificaciones", "#00E5FF");
        notifBtn.setOnClickListener(v -> openNotificationSettings());
        root.addView(notifBtn);
        Button battBtn = gamerButton("No apagar la app con la batería", "#00E5FF");
        battBtn.setOnClickListener(v -> requestBattery());
        root.addView(battBtn);
        Button bootBtn = gamerButton("Arranque automático (info)", "#B026FF");
        bootBtn.setOnClickListener(v -> toast("La app se inicia sola al encender el móvil si el interruptor está activo."));
        root.addView(bootBtn);
        Button diag = gamerButton("Ver registro de errores (diagnóstico)", "#FF3B5C");
        diag.setOnClickListener(v -> showDiagnostic());
        root.addView(diag);

        // --- Reglas manuales ---
        root.addView(sectionTitle("REGLAS MANUALES"));
        root.addView(small("Dominios extra a bloquear (uno por línea)", "#8FA3C8"));
        etBlock = editor("ej: pub.ejemplo.com");
        root.addView(etBlock);
        root.addView(small("Excepciones (NO bloquear)", "#8FA3C8"));
        etAllow = editor("ej: ads.mijuego.com");
        root.addView(etAllow);
        Button save = gamerButton("Guardar y aplicar", "#00FF9D");
        save.setOnClickListener(v -> saveAndApply());
        root.addView(save);
        tvRules = new TextView(this);
        tvRules.setTextSize(11);
        tvRules.setTextColor(Color.parseColor("#8FA3C8"));
        tvRules.setGravity(Gravity.CENTER);
        root.addView(tvRules);

        TextView note = new TextView(this);
        note.setText("\nSin wakelocks: no enciende la pantalla ni calienta el móvil."
                + " Los anuncios con recompensa pueden no dar premio si se bloquean:"
                + " añade su dominio a Excepciones.");
        note.setTextSize(10);
        note.setTextColor(Color.parseColor("#5D7296"));
        note.setPadding(dp(4), dp(14), dp(4), dp(4));
        root.addView(note);

        ScrollView sv = new ScrollView(this);
        sv.setBackgroundColor(Color.parseColor("#080B14"));
        sv.addView(root);
        return sv;
    }

    // ------------------------------------------------------------ helpers UI

    private TextView counterCard(LinearLayout parent, String value, String label, String color) {
        LinearLayout c = new LinearLayout(this);
        c.setOrientation(LinearLayout.VERTICAL);
        c.setGravity(Gravity.CENTER);
        c.setBackgroundResource(R.drawable.bg_gamer_card);
        c.setLayoutParams(new LinearLayout.LayoutParams(0, dp(86), 1f));
        TextView v = new TextView(this);
        v.setText(value);
        v.setTextSize(22);
        v.setTypeface(null, Typeface.BOLD);
        v.setTextColor(Color.parseColor(color));
        v.setGravity(Gravity.CENTER);
        c.addView(v);
        TextView l = new TextView(this);
        l.setText(label);
        l.setTextSize(10);
        l.setTextColor(Color.parseColor("#8FA3C8"));
        l.setGravity(Gravity.CENTER);
        c.addView(l);
        parent.addView(c);
        return v;
    }

    private LinearLayout card() {
        LinearLayout c = new LinearLayout(this);
        c.setOrientation(LinearLayout.VERTICAL);
        c.setBackgroundResource(R.drawable.bg_gamer_card);
        c.setPadding(dp(14), dp(12), dp(14), dp(12));
        c.setLayoutParams(new LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT));
        ((LinearLayout.LayoutParams) c.getLayoutParams()).setMargins(0, dp(6), 0, dp(6));
        return c;
    }

    private TextView sectionTitle(String s) {
        TextView t = new TextView(this);
        t.setText(s);
        t.setTextSize(12);
        t.setTypeface(null, Typeface.BOLD);
        t.setTextColor(Color.parseColor("#00E5FF"));
        t.setPadding(dp(4), dp(16), dp(4), dp(6));
        return t;
    }

    private TextView small(String s, String color) {
        TextView t = new TextView(this);
        t.setText(s);
        t.setTextSize(10);
        t.setTextColor(Color.parseColor(color));
        t.setPadding(0, 0, 0, dp(4));
        return t;
    }

    private LinearLayout gamerSwitch(String title, String desc, int which) {
        LinearLayout c = card();
        TextView t = new TextView(this);
        t.setText(title);
        t.setTextSize(13);
        t.setTypeface(null, Typeface.BOLD);
        t.setTextColor(Color.parseColor("#E8F0FF"));
        c.addView(t);
        TextView d = new TextView(this);
        d.setText(desc);
        d.setTextSize(10);
        d.setTextColor(Color.parseColor("#8FA3C8"));
        c.addView(d);
        Switch s = new Switch(this);
        s.setTextColor(Color.parseColor("#00FF9D"));
        s.setPadding(0, dp(4), 0, 0);
        c.addView(s);

        if (which == 0) swSni = s;
        else if (which == 1) swMeta = s;
        else if (which == 2) swQuic = s;
        else if (which == 3) swDot = s;
        else swNotify = s;

        final int w = which;
        s.setOnCheckedChangeListener((b, v) -> {
            if (loadingPrefs) return;
            SharedPreferences.Editor e = prefs.edit();
            if (w == 0) e.putBoolean(Blocklist.KEY_SNI_MODE, v);
            else if (w == 1) e.putBoolean(Blocklist.KEY_META_BLOCK, v);
            else if (w == 2) e.putBoolean(Blocklist.KEY_BLOCK_QUIC, v);
            else if (w == 3) e.putBoolean(Blocklist.KEY_BLOCK_DOT, v);
            else e.putBoolean(Blocklist.KEY_NOTIFY_BLOCKS, v);
            e.apply();
            if (AdBlockVpnService.SERVICE_RUNNING.get()) restartVpn();
        });
        return c;
    }

    private Button gamerButton(String text, String color) {
        Button b = new Button(this);
        b.setText(text);
        b.setAllCaps(false);
        b.setTextSize(12);
        b.setTextColor(Color.WHITE);
        b.setBackgroundColor(Color.parseColor("#1B2A4A"));
        b.setLayoutParams(new LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT));
        return b;
    }

    private EditText editor(String hint) {
        EditText e = new EditText(this);
        e.setHint(hint);
        e.setTextSize(12);
        e.setMinLines(2);
        e.setBackgroundColor(Color.parseColor("#0E1526"));
        e.setTextColor(Color.parseColor("#E8F0FF"));
        e.setHintTextColor(Color.parseColor("#5D7296"));
        e.setPadding(dp(10), dp(10), dp(10), dp(10));
        e.setLayoutParams(new LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT));
        return e;
    }

    private int dp(int v) { return Math.round(v * getResources().getDisplayMetrics().density); }

    private void toast(String s) { Toast.makeText(this, s, Toast.LENGTH_SHORT).show(); }

    // -------------------------------------------------------------- logica

    private void loadPrefs() {
        loadingPrefs = true;
        swSni.setChecked(prefs.getBoolean(Blocklist.KEY_SNI_MODE, true));
        swMeta.setChecked(prefs.getBoolean(Blocklist.KEY_META_BLOCK, false));
        swQuic.setChecked(prefs.getBoolean(Blocklist.KEY_BLOCK_QUIC, true));
        swDot.setChecked(prefs.getBoolean(Blocklist.KEY_BLOCK_DOT, true));
        swNotify.setChecked(prefs.getBoolean(Blocklist.KEY_NOTIFY_BLOCKS, true));
        etBlock.setText(prefs.getString(Blocklist.KEY_CUSTOM_BLOCK, ""));
        etAllow.setText(prefs.getString(Blocklist.KEY_CUSTOM_ALLOW, ""));
        int prov = prefs.getInt(Blocklist.KEY_DNS_PROVIDER, DnsProviders.DEFAULT);
        if (prov < 0 || prov >= DnsProviders.ALL.length) prov = DnsProviders.DEFAULT;
        spProvider.setSelection(prov);
        loadingPrefs = false;
        spProvider.setOnItemSelectedListener(new AdapterView.OnItemSelectedListener() {
            @Override public void onItemSelected(AdapterView<?> par, View v, int pos, long id) {
                if (loadingPrefs) return;
                int cur = prefs.getInt(Blocklist.KEY_DNS_PROVIDER, DnsProviders.DEFAULT);
                if (pos != cur) {
                    prefs.edit().putInt(Blocklist.KEY_DNS_PROVIDER, pos).apply();
                    if (AdBlockVpnService.SERVICE_RUNNING.get()) restartVpn();
                    toast("DNS: " + DnsProviders.get(pos).name);
                }
            }
            @Override public void onNothingSelected(AdapterView<?> par) {}
        });
        tvRules.setText(Blocklist.stats(this));
    }

    private void refresh() {
        boolean enabled = prefs.getBoolean(Blocklist.KEY_ENABLED, false);
        boolean real = AdBlockVpnService.SERVICE_RUNNING.get();
        if (!enabled) {
            tvState.setText("DESPROTEGIDO");
            tvState.setTextColor(Color.parseColor("#FF3B5C"));
            btnPower.setBackgroundResource(R.drawable.bg_gamer_off);
            tvKeyLabel.setText("ACTIVAR");
        } else if (!real) {
            if (enabledAt > 0 && System.currentTimeMillis() - enabledAt > 8000) {
                tvState.setText("NO SE PUDO ACTIVAR");
                tvKeyLabel.setText("REINTENTAR");
            } else {
                tvState.setText("ACTIVANDO...");
                tvKeyLabel.setText("ACEPTA VPN");
            }
            tvState.setTextColor(Color.parseColor("#FFC73D"));
            btnPower.setBackgroundResource(R.drawable.bg_gamer_off);
        } else {
            tvState.setText("PROTEGIDO");
            tvState.setTextColor(Color.parseColor("#00FF9D"));
            btnPower.setBackgroundResource(R.drawable.bg_gamer_on);
            tvKeyLabel.setText("DESACTIVAR");
        }
        tvNetwork.setText(networkName());

        int blocked = AdBlockVpnService.DNS_BLOCKED.get() + AdBlockVpnService.SNI_BLOCKED.get();
        int queries = blocked + AdBlockVpnService.QUIC_DROPPED.get();
        tvAds.setText(String.valueOf(blocked));
        tvQueries.setText(String.valueOf(queries));

        List<String> rec = AdBlockVpnService.recentBlocks();
        tvLast.setText(rec.isEmpty() ? "—" : rec.get(rec.size() - 1));

        int domains = Blocklist.count(this);
        tvStats.setText("✓ " + String.format("%,d", domains) + " dominios en la lista de bloqueo\n"
                + "✓ " + String.format("%,d", AdBlockVpnService.PACKETS_READ.get())
                + " paquetes leídos del túnel (tun0)\n"
                + "✓ " + AdBlockVpnService.ENCRYPTED_CUT.get()
                + " conexiones cifradas cortadas (DoT/DoH)\n"
                + "✓ " + AdBlockVpnService.DOT_DROPPED.get()
                + " conexiones DoT 853 cortadas\n"
                + "✓ " + AdBlockVpnService.QUIC_DROPPED.get() + " QUIC cortados");

        renderHistory();
        updatePermissions();
    }

    private String networkName() {
        try {
            ConnectivityManager cm = (ConnectivityManager) getSystemService(Context.CONNECTIVITY_SERVICE);
            if (cm == null) return "SIN RED";
            NetworkInfo n = cm.getActiveNetworkInfo();
            if (n == null || !n.isConnected()) return "SIN RED";
            if (n.getType() == ConnectivityManager.TYPE_WIFI) return "◉ WiFi conectado";
            return "◉ Datos móviles conectados";
        } catch (Exception e) { return "RED ACTIVA"; }
    }

    private void renderHistory() {
        List<TrafficLog.Entry> list = TrafficLog.recent(12);
        boxHistory.removeAllViews();
        if (list.isEmpty()) {
            TextView t = new TextView(this);
            t.setText("(esperando tráfico...)");
            t.setTextSize(11);
            t.setTextColor(Color.parseColor("#5D7296"));
            boxHistory.addView(t);
        } else {
            for (TrafficLog.Entry e : list) {
                LinearLayout row = new LinearLayout(this);
                row.setOrientation(LinearLayout.HORIZONTAL);
                row.setPadding(dp(4), dp(3), dp(4), dp(3));
                TextView dot = new TextView(this);
                dot.setText(e.blocked ? "● " : "● ");
                dot.setTextColor(Color.parseColor(e.blocked ? "#FF3B5C" : "#00FF9D"));
                dot.setTextSize(13);
                row.addView(dot);
                TextView dom = new TextView(this);
                dom.setText(e.domain);
                dom.setTextSize(10);
                dom.setTypeface(Typeface.MONOSPACE, Typeface.NORMAL);
                dom.setTextColor(Color.parseColor(e.blocked ? "#FF8FA3" : "#8FFFD0"));
                dom.setSingleLine(true);
                dom.setLayoutParams(new LinearLayout.LayoutParams(0,
                        ViewGroup.LayoutParams.WRAP_CONTENT, 1f));
                row.addView(dom);
                TextView time = new TextView(this);
                time.setText(e.time);
                time.setTextSize(9);
                time.setTextColor(Color.parseColor("#5D7296"));
                row.addView(time);
                TextView btn = new TextView(this);
                btn.setText(e.blocked ? "PERMITIR" : "BLOQUEAR");
                btn.setTextSize(9);
                btn.setTypeface(null, Typeface.BOLD);
                btn.setTextColor(Color.parseColor("#00E5FF"));
                btn.setPadding(dp(6), 0, 0, 0);
                final String d = e.domain;
                final boolean was = e.blocked;
                btn.setOnClickListener(v -> manualRule(d, !was));
                row.addView(btn);
                boxHistory.addView(row);
            }
        }
        String cb = prefs.getString(Blocklist.KEY_CUSTOM_BLOCK, "");
        String ca = prefs.getString(Blocklist.KEY_CUSTOM_ALLOW, "");
        tvManual.setText("Bloqueados a mano: " + countLines(cb)
                + " | Permitidos a mano: " + countLines(ca));
    }

    private int countLines(String s) {
        if (s == null || s.trim().isEmpty()) return 0;
        int n = 0;
        for (String x : s.split("[\n,; ]+")) if (!x.trim().isEmpty()) n++;
        return n;
    }

    private void manualRule(String domain, boolean block) {
        String key = block ? Blocklist.KEY_CUSTOM_BLOCK : Blocklist.KEY_CUSTOM_ALLOW;
        String other = block ? Blocklist.KEY_CUSTOM_ALLOW : Blocklist.KEY_CUSTOM_BLOCK;
        String cur = prefs.getString(key, "");
        if (!cur.contains(domain)) cur = (cur.isEmpty() ? "" : cur + "\n") + domain;
        String o = prefs.getString(other, "").replace(domain, "").replace("\n\n", "\n").trim();
        prefs.edit().putString(key, cur).putString(other, o).apply();
        etBlock.setText(prefs.getString(Blocklist.KEY_CUSTOM_BLOCK, ""));
        etAllow.setText(prefs.getString(Blocklist.KEY_CUSTOM_ALLOW, ""));
        TrafficLog.add(domain, block);
        reloadRules();
        toast(block ? "Bloqueado: " + domain : "Permitido: " + domain);
    }

    private void toggleProtection() {
        boolean on = !prefs.getBoolean(Blocklist.KEY_ENABLED, false);
        prefs.edit().putBoolean(Blocklist.KEY_ENABLED, on).apply();
        enabledAt = on ? System.currentTimeMillis() : 0;
        refresh();
        if (on) startProtection(); else stopProtection();
    }

    private void startProtection() {
        Intent prepare = VpnService.prepare(this);
        if (prepare != null) {
            startActivityForResult(prepare, REQ_VPN);
            return;
        }
        startService(new Intent(this, AdBlockVpnService.class)
                .setAction(AdBlockVpnService.ACTION_START));
    }

    private void stopProtection() {
        startService(new Intent(this, AdBlockVpnService.class)
                .setAction(AdBlockVpnService.ACTION_STOP));
    }

    private void restartVpn() {
        stopProtection();
        handler.postDelayed(this::startProtection, 600);
    }

    private void reloadRules() {
        startService(new Intent(this, AdBlockVpnService.class)
                .setAction(AdBlockVpnService.ACTION_RELOAD));
    }

    private void saveAndApply() {
        prefs.edit()
                .putString(Blocklist.KEY_CUSTOM_BLOCK, etBlock.getText().toString())
                .putString(Blocklist.KEY_CUSTOM_ALLOW, etAllow.getText().toString())
                .apply();
        tvRules.setText(Blocklist.stats(this));
        reloadRules();
        toast("Guardado y aplicado");
    }

    private void updatePermissions() {
        boolean vpn = VpnService.prepare(this) == null;
        boolean notif = Build.VERSION.SDK_INT < Build.VERSION_CODES.TIRAMISU
                || checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS)
                == PackageManager.PERMISSION_GRANTED;
        boolean batt = isBatteryExempt();
        tvPerms.setText("VPN " + mark(vpn) + " | Notificaciones " + mark(notif)
                + " | Batería " + mark(batt) + " | Arranque " + mark(true));

        boxPerms.removeAllViews();
        addPermRow("VPN (bloquear tráfico)", vpn);
        addPermRow("Notificaciones", notif);
        addPermRow("Sin optimización de batería", batt);
        addPermRow("Arranque automático", true);
    }

    private void addPermRow(String name, boolean ok) {
        TextView t = new TextView(this);
        t.setText((ok ? "✓  " : "✗  ") + name);
        t.setTextSize(11);
        t.setTextColor(Color.parseColor(ok ? "#00FF9D" : "#FF3B5C"));
        t.setPadding(dp(4), dp(2), dp(4), dp(2));
        boxPerms.addView(t);
    }

    private String mark(boolean ok) { return ok ? "✓" : "✗"; }

    private boolean isBatteryExempt() {
        try {
            PowerManager pm = (PowerManager) getSystemService(Context.POWER_SERVICE);
            return pm != null && pm.isIgnoringBatteryOptimizations(getPackageName());
        } catch (Exception e) { return false; }
    }

    private void requestBattery() {
        try {
            Intent i = new Intent(Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS);
            i.setData(Uri.parse("package:" + getPackageName()));
            startActivity(i);
        } catch (Exception e) { toast("No se pudo abrir el ajuste de batería"); }
    }

    private void openNotificationSettings() {
        try {
            Intent i;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                i = new Intent(Settings.ACTION_APP_NOTIFICATION_SETTINGS);
                i.putExtra(Settings.EXTRA_APP_PACKAGE, getPackageName());
            } else {
                i = new Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS);
                i.setData(Uri.parse("package:" + getPackageName()));
            }
            startActivity(i);
        } catch (Exception e) { toast("No se pudo abrir"); }
    }

    private void openPackage(String pkg) {
        try {
            Intent i = new Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS);
            i.setData(Uri.parse("package:" + pkg));
            startActivity(i);
        } catch (Exception e) { toast("Google Play Services no está instalado"); }
    }

    private void requestNotifications() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            if (checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS)
                    != PackageManager.PERMISSION_GRANTED) {
                requestPermissions(new String[] { Manifest.permission.POST_NOTIFICATIONS }, REQ_NOTIF);
            }
        }
    }

    @Override public void onRequestPermissionsResult(int req, String[] p, int[] r) {
        super.onRequestPermissionsResult(req, p, r);
        refresh();
    }

    @Override protected void onActivityResult(int req, int res, Intent data) {
        super.onActivityResult(req, res, data);
        if (req == REQ_VPN) {
            if (res == RESULT_OK) {
                startService(new Intent(this, AdBlockVpnService.class)
                        .setAction(AdBlockVpnService.ACTION_START));
            } else {
                prefs.edit().putBoolean(Blocklist.KEY_ENABLED, false).apply();
                toast("Permiso VPN denegado");
            }
            refresh();
        }
    }
}
