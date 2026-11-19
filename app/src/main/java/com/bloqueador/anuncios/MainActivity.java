package com.bloqueador.anuncios;

import android.Manifest;
import android.app.Activity;
import android.app.AlertDialog;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
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

        TextView title = new TextView(this);
        title.setText("ADBLOCK GAMER PRO v5.0");
        title.setTextSize(19);
        title.setTypeface(null, Typeface.BOLD);
        title.setTextColor(Color.parseColor("#00E5FF"));
        title.setGravity(Gravity.CENTER);
        root.addView(title);

        tvSub = new TextView(this);
        tvSub.setText("WiFi + Datos Móviles · Bloqueo para juegos y apps");
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

        btnPower = new LinearLayout(this);
        btnPower.setOrientation(LinearLayout.VERTICAL);
        btnPower.setGravity(Gravity.CENTER);
        int size = dp(154);
        btnPower.setLayoutParams(new LinearLayout.LayoutParams(size, size));
        btnPower.setBackgroundResource(R.drawable.bg_gamer_off);
        ivKey = new ImageView(this);
        ivKey.setImageResource(R.drawable.ic_key_gamer);
        ivKey.setLayoutParams(new LinearLayout.LayoutParams(dp(64), dp(64)));
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
        tvState.setTextSize(19);
        tvState.setTypeface(null, Typeface.BOLD);
        tvState.setGravity(Gravity.CENTER);
        tvState.setTextColor(Color.parseColor("#FF3B5C"));
        tvState.setPadding(0, dp(12), 0, dp(2));
        root.addView(tvState);

        TextView hint = new TextView(this);
        hint.setText("Cuando está activo verás la llave VPN en la barra superior de Android");
        hint.setTextSize(11);
        hint.setTextColor(Color.parseColor("#8FA3C8"));
        hint.setGravity(Gravity.CENTER);
        root.addView(hint);

        LinearLayout counters = new LinearLayout(this);
        counters.setOrientation(LinearLayout.HORIZONTAL);
        counters.setWeightSum(2);
        counters.setPadding(0, dp(14), 0, dp(6));
        tvAds = counterCard(counters, "0", "Anuncios\nbloqueados", "#00FF9D");
        tvQueries = counterCard(counters, "0", "Consultas\nanalizadas", "#00E5FF");
        root.addView(counters);

        LinearLayout lastCard = card();
        lastCard.addView(small("ÚLTIMO DOMINIO BLOQUEADO", "#B026FF"));
        tvLast = new TextView(this);
        tvLast.setText("—");
        tvLast.setTextSize(13);
        tvLast.setTypeface(Typeface.MONOSPACE, Typeface.BOLD);
        tvLast.setTextColor(Color.parseColor("#E8F0FF"));
        lastCard.addView(tvLast);
        root.addView(lastCard);

        LinearLayout statsCard = card();
        statsCard.addView(small("ESTADÍSTICAS DEL TÚNEL", "#00E5FF"));
        tvStats = new TextView(this);
        tvStats.setTextSize(11);
        tvStats.setTextColor(Color.parseColor("#E8F0FF"));
        tvStats.setLineSpacing(0, 1.35f);
        statsCard.addView(tvStats);
        root.addView(statsCard);

        root.addView(sectionTitle("PROTECCIÓN AVANZADA"));
        root.addView(gamerSwitch("Bloquear anuncios por IP fija",
                "Inspecciona SNI/HTTP en juegos y corta anuncios sin DNS.", 0));
        root.addView(gamerSwitch("Anuncios de Meta bloqueados",
                "Corta 'Ads served by Meta' en juegos. WhatsApp, Instagram y Facebook quedan fuera para no romper chats.", 1));
        root.addView(gamerSwitch("Bloquear QUIC (UDP 443)",
                "Impide que los anuncios esquiven el filtro con HTTP/3.", 2));
        root.addView(gamerSwitch("Bloquear DNS cifrado (853 / DoH)",
                "Corta DoT y DoH directo en IPv4 e IPv6 para forzar el filtro.", 3));
        root.addView(gamerSwitch("Notificar anuncios bloqueados",
                "Muestra aviso en Android cuando se corta un anuncio.", 4));

        LinearLayout dnsCard = card();
        dnsCard.addView(small("SERVIDOR DNS (WIFI Y DATOS MÓVILES)", "#00E5FF"));
        spProvider = new Spinner(this);
        String[] names = new String[DnsProviders.ALL.length];
        for (int i = 0; i < names.length; i++) names[i] = DnsProviders.ALL[i].name;
        ArrayAdapter<String> ad = new ArrayAdapter<>(this,
                android.R.layout.simple_spinner_dropdown_item, names);
        spProvider.setAdapter(ad);
        dnsCard.addView(spProvider);
        root.addView(dnsCard);

        root.addView(sectionTitle("HISTORIAL DE TRÁFICO EN VIVO"));
        TextView histInfo = new TextView(this);
        histInfo.setText("Dominios que pasan por el filtro. Rojo = bloqueado, verde = permitido.");
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

        root.addView(sectionTitle("ANUNCIOS YA GUARDADOS EN CACHÉ"));
        TextView cacheInfo = new TextView(this);
        cacheInfo.setText("Si un juego ya descargó anuncios antes de activar la llave, cierra el juego o limpia su caché.");
        cacheInfo.setTextSize(11);
        cacheInfo.setTextColor(Color.parseColor("#8FA3C8"));
        root.addView(cacheInfo);
        Button play = gamerButton("Abrir Google Play Services", "#00E5FF");
        play.setOnClickListener(v -> openPackage("com.google.android.gms"));
        root.addView(play);
        Button allApps = gamerButton("Ver todas las apps (limpiar caché)", "#00E5FF");
        allApps.setOnClickListener(v -> {
            Intent i = new Intent(Settings.ACTION_APPLICATION_SETTINGS);
            try { startActivity(i); } catch (Exception e) { toast("No se pudo abrir"); }
        });
        root.addView(allApps);
        Button update = gamerButton("Actualizar lista de bloqueo (descargar)", "#00FF9D");
        update.setOnClickListener(v -> {
            toast("Descargando HaGeZi Pro + StevenBlack...");
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

        root.addView(sectionTitle("TODOS LOS PERMISOS DE ANDROID"));
        boxPerms = new LinearLayout(this);
        boxPerms.setOrientation(LinearLayout.VERTICAL);
        root.addView(boxPerms);
        tvPerms = new TextView(this);
        tvPerms.setTextSize(11);
        tvPerms.setTextColor(Color.parseColor("#8FA3C8"));
        root.addView(tvPerms);

        Button grantAllBtn = gamerButton("Conceder todos los permisos pendientes", "#00FF9D");
        grantAllBtn.setOnClickListener(v -> grantNextMissingPermission());
        root.addView(grantAllBtn);
        Button vpnBtn = gamerButton("1. Dar permiso VPN (activar llave)", "#00E5FF");
        vpnBtn.setOnClickListener(v -> startProtection());
        root.addView(vpnBtn);
        Button notifBtn = gamerButton("2. Activar notificaciones desde Android", "#00E5FF");
        notifBtn.setOnClickListener(v -> activateNotificationsFromAndroid());
        root.addView(notifBtn);
        Button testNotifBtn = gamerButton("Probar notificación ahora", "#00FF9D");
        testNotifBtn.setOnClickListener(v -> sendTestNotification());
        root.addView(testNotifBtn);
        Button battBtn = gamerButton("3. No apagar con la batería", "#00E5FF");
        battBtn.setOnClickListener(v -> requestBattery());
        root.addView(battBtn);
        Button dataBtn = gamerButton("4. Permitir datos 4G/5G sin restricción", "#00E5FF");
        dataBtn.setOnClickListener(v -> requestUnrestrictedData());
        root.addView(dataBtn);
        Button appInfoBtn = gamerButton("Abrir ajustes completos de la app", "#B026FF");
        appInfoBtn.setOnClickListener(v -> openPackage(getPackageName()));
        root.addView(appInfoBtn);
        Button diag = gamerButton("Ver registro de errores (diagnóstico)", "#FF3B5C");
        diag.setOnClickListener(v -> showDiagnostic());
        root.addView(diag);

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
            else {
                e.putBoolean(Blocklist.KEY_NOTIFY_BLOCKS, v);
                if (v && !areNotificationsReallyEnabled()) activateNotificationsFromAndroid();
            }
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
        LinearLayout.LayoutParams lp = new LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT);
        lp.setMargins(0, dp(4), 0, dp(4));
        b.setLayoutParams(lp);
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
        swMeta.setChecked(prefs.getBoolean(Blocklist.KEY_META_BLOCK, true));
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
            tvKeyLabel.setText("ACTIVAR LLAVE");
        } else if (!real) {
            if (enabledAt > 0 && System.currentTimeMillis() - enabledAt > 6000) {
                tvState.setText("NO SE PUDO ACTIVAR (TOCA REINTENTAR)");
                tvKeyLabel.setText("REINTENTAR");
            } else {
                tvState.setText("ACTIVANDO LLAVE VPN...");
                tvKeyLabel.setText("ACEPTA VPN");
            }
            tvState.setTextColor(Color.parseColor("#FFC73D"));
            btnPower.setBackgroundResource(R.drawable.bg_gamer_off);
        } else {
            tvState.setText("PROTEGIDO · LLAVE ACTIVA");
            tvState.setTextColor(Color.parseColor("#00FF9D"));
            btnPower.setBackgroundResource(R.drawable.bg_gamer_on);
            tvKeyLabel.setText("LLAVE ACTIVA");
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
            if (n.getType() == ConnectivityManager.TYPE_WIFI) return "◉ WiFi conectado (VPN lista)";
            return "◉ Datos móviles 4G/5G conectados (VPN lista)";
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
                dot.setText("● ");
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

    private void sendServiceAction(String action) {
        Intent i = new Intent(this, AdBlockVpnService.class).setAction(action);
        try {
            if (AdBlockVpnService.ACTION_START.equals(action)
                    && Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                startForegroundService(i);
            } else {
                startService(i);
            }
        } catch (Exception e) {
            CrashLogger.log(this, e);
            toast("Error al iniciar servicio VPN");
        }
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
        prefs.edit().putBoolean(Blocklist.KEY_ENABLED, true).apply();
        enabledAt = System.currentTimeMillis();
        sendServiceAction(AdBlockVpnService.ACTION_START);
        refresh();
    }

    private void stopProtection() {
        sendServiceAction(AdBlockVpnService.ACTION_STOP);
    }

    private void restartVpn() {
        stopProtection();
        handler.postDelayed(this::startProtection, 600);
    }

    private void reloadRules() {
        sendServiceAction(AdBlockVpnService.ACTION_RELOAD);
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
        boolean notif = areNotificationsReallyEnabled();
        boolean batt = isBatteryExempt();
        boolean dataOk = isBackgroundDataAllowed();
        tvPerms.setText("VPN " + mark(vpn) + " | Notif " + mark(notif)
                + " | Batería " + mark(batt) + " | Datos 4G/5G " + mark(dataOk));

        boxPerms.removeAllViews();
        addPermRow("VPN del sistema (llave activa)", vpn);
        addPermRow("Notificaciones de Android activadas", notif);
        addPermRow("Batería sin restricciones", batt);
        addPermRow("Datos móviles sin restricción (4G/5G)", dataOk);
        addPermRow("Arranque automático al encender", true);
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

    private boolean areNotificationsReallyEnabled() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            if (checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS)
                    != PackageManager.PERMISSION_GRANTED) {
                return false;
            }
        }
        NotificationManager nm = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
        return nm == null || nm.areNotificationsEnabled();
    }

    private boolean isBatteryExempt() {
        try {
            PowerManager pm = (PowerManager) getSystemService(Context.POWER_SERVICE);
            return pm != null && pm.isIgnoringBatteryOptimizations(getPackageName());
        } catch (Exception e) { return false; }
    }

    private boolean isBackgroundDataAllowed() {
        try {
            ConnectivityManager cm = (ConnectivityManager) getSystemService(Context.CONNECTIVITY_SERVICE);
            if (cm == null) return true;
            return cm.getRestrictBackgroundStatus()
                    != ConnectivityManager.RESTRICT_BACKGROUND_STATUS_ENABLED;
        } catch (Exception e) { return true; }
    }

    private void grantNextMissingPermission() {
        if (VpnService.prepare(this) != null) {
            startProtection();
        } else if (!areNotificationsReallyEnabled()) {
            activateNotificationsFromAndroid();
        } else if (!isBatteryExempt()) {
            requestBattery();
        } else if (!isBackgroundDataAllowed()) {
            requestUnrestrictedData();
        } else {
            toast("¡Todos los permisos ya están concedidos!");
        }
    }

    private void activateNotificationsFromAndroid() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU
                && checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS)
                != PackageManager.PERMISSION_GRANTED) {
            if (shouldShowRequestPermissionRationale(Manifest.permission.POST_NOTIFICATIONS)) {
                requestPermissions(new String[] { Manifest.permission.POST_NOTIFICATIONS }, REQ_NOTIF);
                return;
            }
            requestPermissions(new String[] { Manifest.permission.POST_NOTIFICATIONS }, REQ_NOTIF);
            return;
        }
        openNotificationSettings();
    }

    private void sendTestNotification() {
        if (!areNotificationsReallyEnabled()) {
            toast("Primero activa el permiso de notificaciones");
            activateNotificationsFromAndroid();
            return;
        }
        try {
            NotificationManager nm = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
            if (nm == null) return;
            String chId = "bloqueo_alertas_channel";
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                NotificationChannel ch = new NotificationChannel(chId,
                        "Alertas de anuncios bloqueados", NotificationManager.IMPORTANCE_DEFAULT);
                nm.createNotificationChannel(ch);
            }
            Intent i = new Intent(this, MainActivity.class);
            int fl = PendingIntent.FLAG_UPDATE_CURRENT;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) fl |= PendingIntent.FLAG_IMMUTABLE;
            PendingIntent pi = PendingIntent.getActivity(this, 2, i, fl);
            Notification.Builder b = (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O)
                    ? new Notification.Builder(this, chId)
                    : new Notification.Builder(this);
            b.setSmallIcon(R.drawable.ic_stat_shield)
                    .setContentTitle("Adblock Gamer Pro v5.0")
                    .setContentText("Notificaciones funcionando correctamente")
                    .setContentIntent(pi)
                    .setAutoCancel(true);
            nm.notify(2002, b.build());
            toast("Notificación de prueba enviada");
        } catch (Exception e) {
            toast("No se pudo enviar notificación");
        }
    }

    private void requestBattery() {
        try {
            Intent i = new Intent(Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS);
            i.setData(Uri.parse("package:" + getPackageName()));
            startActivity(i);
        } catch (Exception e) { toast("No se pudo abrir el ajuste de batería"); }
    }

    private void requestUnrestrictedData() {
        try {
            Intent i = new Intent(Settings.ACTION_IGNORE_BACKGROUND_DATA_RESTRICTIONS_SETTINGS);
            i.setData(Uri.parse("package:" + getPackageName()));
            startActivity(i);
        } catch (Exception e) {
            openPackage(getPackageName());
        }
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
        } catch (Exception e) { toast("No se pudo abrir los ajustes"); }
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
        if (req == REQ_NOTIF && r.length > 0 && r[0] != PackageManager.PERMISSION_GRANTED) {
            toast("Actívalas en Ajustes > Notificaciones");
            openNotificationSettings();
        }
        refresh();
    }

    @Override protected void onActivityResult(int req, int res, Intent data) {
        super.onActivityResult(req, res, data);
        if (req == REQ_VPN) {
            if (res == RESULT_OK) {
                prefs.edit().putBoolean(Blocklist.KEY_ENABLED, true).apply();
                enabledAt = System.currentTimeMillis();
                sendServiceAction(AdBlockVpnService.ACTION_START);
            } else {
                prefs.edit().putBoolean(Blocklist.KEY_ENABLED, false).apply();
                toast("Permiso VPN denegado");
            }
            refresh();
        }
    }
}
