package com.bloqueador.anuncios;

import android.Manifest;
import android.animation.ObjectAnimator;
import android.animation.ValueAnimator;
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
import android.content.res.ColorStateList;
import android.graphics.Color;
import android.graphics.PorterDuff;
import android.graphics.Typeface;
import android.graphics.drawable.GradientDrawable;
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
import android.text.Editable;
import android.text.TextUtils;
import android.text.TextWatcher;
import android.view.Gravity;
import android.view.View;
import android.view.ViewGroup;
import android.widget.AdapterView;
import android.widget.ArrayAdapter;
import android.widget.EditText;
import android.widget.FrameLayout;
import android.widget.ImageView;
import android.widget.LinearLayout;
import android.widget.ScrollView;
import android.widget.Spinner;
import android.widget.Switch;
import android.widget.TextView;
import android.widget.Toast;

import java.util.ArrayList;
import java.util.List;

public class MainActivity extends Activity {

    private static final int REQ_VPN = 42;
    private static final int REQ_NOTIF = 43;

    private static final int BG_DARK = Color.parseColor("#080D17");
    private static final int BG_BAR = Color.parseColor("#0C1322");
    private static final int BG_SURFACE = Color.parseColor("#111A2D");
    private static final int BG_SURFACE_2 = Color.parseColor("#18243E");
    private static final int BORDER_SUBTLE = Color.parseColor("#213254");
    private static final int CYAN = Color.parseColor("#00E5FF");
    private static final int EMERALD = Color.parseColor("#00E68A");
    private static final int ROSE = Color.parseColor("#FF4D6D");
    private static final int AMBER = Color.parseColor("#FFC247");
    private static final int INDIGO = Color.parseColor("#93C5FD");
    private static final int TEXT_PRIMARY = Color.parseColor("#F1F5FF");
    private static final int TEXT_MUTED = Color.parseColor("#879BC0");

    private final ScrollView[] tabViews = new ScrollView[4];
    private final LinearLayout[] navItems = new LinearLayout[4];
    private final View[] navBars = new View[4];
    private final ImageView[] navIcons = new ImageView[4];
    private final TextView[] navLabels = new TextView[4];
    private int activeTab = 0;

    // Header & Protection tab
    private TextView tvTopNet, tvTopKey;
    private LinearLayout topKeyBox, btnPower, powerInnerPlate, alertBanner;
    private View vPulseRing;
    private ObjectAnimator pulseAnim;
    private ImageView ivTopKey, ivKey;
    private TextView tvKeyLabel, tvState, tvSubState, tvAlertText;
    private TextView tvHeroNet, tvHeroQuic, tvHeroSni;
    private TextView tvAds, tvQueries, tvListCount, tvLast;
    private TextView tvRowPackets, tvRowDoh, tvRowQuic, tvRowDns;

    // Activity tab
    private final TextView[] filterPills = new TextView[3];
    private int activityFilter = 0; // 0 = todos, 1 = bloqueados, 2 = permitidos
    private String activityQuery = "";
    private EditText etSearch;
    private LinearLayout boxHistory;
    private TextView tvManual;

    // Filters tab
    private Switch swSni, swQuic, swDot, swMeta, swNotify;
    private Spinner spProvider;
    private EditText etBlock, etAllow;
    private TextView tvRules, tvUpdateStatus, tvDnsNote;

    // Permissions tab
    private LinearLayout boxPerms;
    private TextView tvPermsSummary, btnGrantPerms;

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
            selectTab(0);
            refresh();
            requestNotifications();
            autoUpdateListIfNeeded();
            handler.post(ticker);
        } catch (Throwable t) {
            CrashLogger.log(this, t);
            showErrorScreen(t);
        }
    }

    private void autoUpdateListIfNeeded() {
        int before = Blocklist.count(this);
        if (before >= 140000) return;
        new Thread(() -> {
            int n = Blocklist.download(getApplicationContext());
            if (n > 0) {
                handler.post(() -> {
                    reloadRules();
                    refresh();
                    int after = Blocklist.count(MainActivity.this);
                    if (tvRules != null) tvRules.setText(Blocklist.stats(MainActivity.this));
                    if (tvUpdateStatus != null) {
                        tvUpdateStatus.setText("Base activa: " + String.format("%,d", after) + " dominios");
                    }
                    if (after > before + 1000) {
                        toast("Lista ampliada: " + String.format("%,d", after) + " dominios");
                    }
                });
            }
        }, "AutoUpdateList").start();
    }

    private void showErrorScreen(Throwable t) {
        LinearLayout box = new LinearLayout(this);
        box.setOrientation(LinearLayout.VERTICAL);
        box.setBackgroundColor(BG_DARK);
        box.setPadding(dp(20), dp(28), dp(20), dp(28));
        TextView t1 = new TextView(this);
        t1.setText("Error al iniciar la aplicación");
        t1.setTextSize(18);
        t1.setTypeface(null, Typeface.BOLD);
        t1.setTextColor(ROSE);
        box.addView(t1);
        TextView t2 = new TextView(this);
        t2.setText(String.valueOf(t));
        t2.setTextSize(12);
        t2.setTextColor(TEXT_PRIMARY);
        t2.setPadding(0, dp(12), 0, dp(18));
        box.addView(t2);
        box.addView(pillButton("Reintentar", CYAN, BG_DARK, v -> recreate()));
        box.addView(spaceV(8));
        box.addView(pillButton("Ver registro de errores", BG_SURFACE_2, TEXT_PRIMARY, v -> showDiagnostic()));
        box.addView(spaceV(8));
        box.addView(pillButton("Restablecer configuración", ROSE, Color.WHITE, v -> {
            try {
                getSharedPreferences(Blocklist.PREFS, MODE_PRIVATE).edit().clear().apply();
                CrashLogger.clear(this);
                recreate();
            } catch (Exception ignored) {}
        }));
        setContentView(box);
    }

    private void showDiagnostic() {
        try {
            new AlertDialog.Builder(this)
                    .setTitle("Registro de errores")
                    .setMessage(CrashLogger.read(this))
                    .setPositiveButton("Limpiar", (d, w) -> CrashLogger.clear(this))
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
        if (pulseAnim != null) pulseAnim.cancel();
        super.onDestroy();
    }

    // ---------------------------------------------------------------- UI ROOT

    private ViewGroup buildUi() {
        LinearLayout shell = new LinearLayout(this);
        shell.setOrientation(LinearLayout.VERTICAL);
        shell.setBackgroundColor(BG_DARK);

        shell.addView(buildTopHeader());

        View headerLine = new View(this);
        headerLine.setBackgroundColor(Color.parseColor("#162138"));
        headerLine.setLayoutParams(new LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, dp(1)));
        shell.addView(headerLine);

        FrameLayout content = new FrameLayout(this);
        content.setLayoutParams(new LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, 0, 1f));

        tabViews[0] = wrapScroll(buildProtectionTab());
        tabViews[1] = wrapScroll(buildActivityTab());
        tabViews[2] = wrapScroll(buildFiltersTab());
        tabViews[3] = wrapScroll(buildPermissionsTab());

        for (ScrollView sv : tabViews) {
            content.addView(sv, new FrameLayout.LayoutParams(
                    ViewGroup.LayoutParams.MATCH_PARENT,
                    ViewGroup.LayoutParams.MATCH_PARENT));
        }
        shell.addView(content);

        View navLine = new View(this);
        navLine.setBackgroundColor(Color.parseColor("#162138"));
        navLine.setLayoutParams(new LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, dp(1)));
        shell.addView(navLine);

        shell.addView(buildBottomNav());
        return shell;
    }

    private LinearLayout buildTopHeader() {
        LinearLayout bar = new LinearLayout(this);
        bar.setOrientation(LinearLayout.HORIZONTAL);
        bar.setGravity(Gravity.CENTER_VERTICAL);
        bar.setBackgroundColor(BG_BAR);
        bar.setPadding(dp(14), dp(11), dp(14), dp(11));

        LinearLayout logoWrap = new LinearLayout(this);
        logoWrap.setGravity(Gravity.CENTER);
        logoWrap.setBackground(roundedBg(Color.parseColor("#0F233C"), Color.parseColor("#21577A"), 12));
        LinearLayout.LayoutParams llp = new LinearLayout.LayoutParams(dp(38), dp(38));
        llp.setMargins(0, 0, dp(10), 0);
        logoWrap.setLayoutParams(llp);

        ImageView logo = new ImageView(this);
        logo.setImageResource(R.drawable.ic_power_shield);
        logo.setColorFilter(CYAN, PorterDuff.Mode.SRC_IN);
        logo.setLayoutParams(new LinearLayout.LayoutParams(dp(22), dp(22)));
        logoWrap.addView(logo);
        bar.addView(logoWrap);

        LinearLayout left = new LinearLayout(this);
        left.setOrientation(LinearLayout.VERTICAL);
        left.setLayoutParams(new LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f));

        LinearLayout titleRow = new LinearLayout(this);
        titleRow.setOrientation(LinearLayout.HORIZONTAL);
        titleRow.setGravity(Gravity.CENTER_VERTICAL);

        TextView brand = new TextView(this);
        brand.setText("Adblock Gamer Pro");
        brand.setTextSize(15);
        brand.setTypeface(null, Typeface.BOLD);
        brand.setTextColor(TEXT_PRIMARY);
        titleRow.addView(brand);

        TextView ver = new TextView(this);
        ver.setText("v5.4");
        ver.setTextSize(10);
        ver.setTypeface(null, Typeface.BOLD);
        ver.setTextColor(CYAN);
        ver.setBackground(roundedBg(Color.parseColor("#11233A"), Color.parseColor("#1D4E6E"), 999));
        ver.setPadding(dp(6), dp(2), dp(6), dp(2));
        LinearLayout.LayoutParams vlp = new LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.WRAP_CONTENT, ViewGroup.LayoutParams.WRAP_CONTENT);
        vlp.setMargins(dp(7), 0, 0, 0);
        ver.setLayoutParams(vlp);
        titleRow.addView(ver);

        left.addView(titleRow);

        tvTopNet = new TextView(this);
        tvTopNet.setText("Comprobando red...");
        tvTopNet.setTextSize(11);
        tvTopNet.setTextColor(TEXT_MUTED);
        tvTopNet.setSingleLine(true);
        tvTopNet.setEllipsize(TextUtils.TruncateAt.END);
        tvTopNet.setPadding(0, dp(1), 0, 0);
        left.addView(tvTopNet);

        bar.addView(left);

        topKeyBox = new LinearLayout(this);
        topKeyBox.setOrientation(LinearLayout.HORIZONTAL);
        topKeyBox.setGravity(Gravity.CENTER_VERTICAL);
        topKeyBox.setBackground(roundedBg(Color.parseColor("#24111B"), Color.parseColor("#5C2032"), 999));
        topKeyBox.setPadding(dp(9), dp(5), dp(10), dp(5));

        ivTopKey = new ImageView(this);
        ivTopKey.setImageResource(R.drawable.ic_key_gamer);
        ivTopKey.setColorFilter(ROSE, PorterDuff.Mode.SRC_IN);
        LinearLayout.LayoutParams iklp = new LinearLayout.LayoutParams(dp(13), dp(13));
        iklp.setMargins(0, 0, dp(5), 0);
        ivTopKey.setLayoutParams(iklp);
        topKeyBox.addView(ivTopKey);

        tvTopKey = new TextView(this);
        tvTopKey.setText("SIN LLAVE");
        tvTopKey.setTextSize(10);
        tvTopKey.setTypeface(null, Typeface.BOLD);
        tvTopKey.setTextColor(ROSE);
        tvTopKey.setIncludeFontPadding(false);
        topKeyBox.addView(tvTopKey);

        bar.addView(topKeyBox);
        return bar;
    }

    // --------------------------------------------------------- TAB 1: PROTECCIÓN

    private LinearLayout buildProtectionTab() {
        LinearLayout root = tabContainer();

        LinearLayout hero = cardBox(16, 15);
        hero.setGravity(Gravity.CENTER_HORIZONTAL);

        FrameLayout powerStage = new FrameLayout(this);
        int stageSize = dp(176);
        LinearLayout.LayoutParams stageLp = new LinearLayout.LayoutParams(stageSize, stageSize);
        stageLp.gravity = Gravity.CENTER_HORIZONTAL;
        powerStage.setLayoutParams(stageLp);

        vPulseRing = new View(this);
        vPulseRing.setBackground(roundedBg(Color.TRANSPARENT, Color.parseColor("#33FF4D6D"), 999));
        FrameLayout.LayoutParams pulseLp = new FrameLayout.LayoutParams(dp(172), dp(172), Gravity.CENTER);
        vPulseRing.setLayoutParams(pulseLp);
        vPulseRing.setAlpha(0.35f);
        powerStage.addView(vPulseRing);

        btnPower = new LinearLayout(this);
        btnPower.setOrientation(LinearLayout.VERTICAL);
        btnPower.setGravity(Gravity.CENTER);
        btnPower.setPadding(0, 0, 0, 0);
        int pSize = dp(158);
        FrameLayout.LayoutParams pLp = new FrameLayout.LayoutParams(pSize, pSize, Gravity.CENTER);
        btnPower.setLayoutParams(pLp);
        btnPower.setBackgroundResource(R.drawable.bg_gamer_off);

        powerInnerPlate = new LinearLayout(this);
        powerInnerPlate.setGravity(Gravity.CENTER);
        powerInnerPlate.setBackground(roundedBg(Color.parseColor("#2A1524"), Color.parseColor("#6E2842"), 999));
        LinearLayout.LayoutParams plateLp = new LinearLayout.LayoutParams(dp(64), dp(64));
        plateLp.gravity = Gravity.CENTER_HORIZONTAL;
        powerInnerPlate.setLayoutParams(plateLp);

        ivKey = new ImageView(this);
        ivKey.setImageResource(R.drawable.ic_key_gamer);
        ivKey.setScaleType(ImageView.ScaleType.FIT_CENTER);
        ivKey.setColorFilter(ROSE, PorterDuff.Mode.SRC_IN);
        ivKey.setLayoutParams(new LinearLayout.LayoutParams(dp(34), dp(34)));
        powerInnerPlate.addView(ivKey);
        btnPower.addView(powerInnerPlate);

        tvKeyLabel = new TextView(this);
        tvKeyLabel.setText("ACTIVAR");
        tvKeyLabel.setTextSize(10);
        tvKeyLabel.setTypeface(null, Typeface.BOLD);
        tvKeyLabel.setLetterSpacing(0.11f);
        tvKeyLabel.setTextColor(TEXT_PRIMARY);
        tvKeyLabel.setIncludeFontPadding(false);
        tvKeyLabel.setGravity(Gravity.CENTER);
        tvKeyLabel.setTextAlignment(View.TEXT_ALIGNMENT_CENTER);
        tvKeyLabel.setBackground(roundedBg(Color.parseColor("#1A1328"), Color.parseColor("#54243B"), 999));
        tvKeyLabel.setPadding(dp(11), dp(4), dp(11), dp(4));
        LinearLayout.LayoutParams tLp = new LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.WRAP_CONTENT, ViewGroup.LayoutParams.WRAP_CONTENT);
        tLp.gravity = Gravity.CENTER_HORIZONTAL;
        tLp.setMargins(0, dp(8), 0, 0);
        tvKeyLabel.setLayoutParams(tLp);
        btnPower.addView(tvKeyLabel);

        btnPower.setOnClickListener(v -> {
            btnPower.animate().scaleX(0.92f).scaleY(0.92f).setDuration(80)
                    .withEndAction(() -> btnPower.animate().scaleX(1f).scaleY(1f).setDuration(130).start())
                    .start();
            boolean enabled = prefs.getBoolean(Blocklist.KEY_ENABLED, false);
            boolean real = AdBlockVpnService.SERVICE_RUNNING.get();
            if (enabled && !real && enabledAt > 0 && System.currentTimeMillis() - enabledAt > 4500) {
                startProtection();
            } else {
                toggleProtection();
            }
        });
        powerStage.addView(btnPower);
        hero.addView(powerStage);

        tvState = new TextView(this);
        tvState.setText("Protección desactivada");
        tvState.setTextSize(17);
        tvState.setTypeface(null, Typeface.BOLD);
        tvState.setTextColor(ROSE);
        tvState.setGravity(Gravity.CENTER);
        tvState.setPadding(0, dp(10), 0, dp(2));
        hero.addView(tvState);

        tvSubState = new TextView(this);
        tvSubState.setText("Pulsa la llave para proteger WiFi y Datos 4G/5G");
        tvSubState.setTextSize(12);
        tvSubState.setTextColor(TEXT_MUTED);
        tvSubState.setGravity(Gravity.CENTER);
        tvSubState.setPadding(0, 0, 0, dp(10));
        hero.addView(tvSubState);

        hero.addView(divider());

        LinearLayout heroStrip = new LinearLayout(this);
        heroStrip.setOrientation(LinearLayout.HORIZONTAL);
        heroStrip.setWeightSum(3);
        heroStrip.setPadding(0, dp(9), 0, 0);
        heroStrip.setLayoutParams(new LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT));
        tvHeroNet = miniTag(heroStrip, "WiFi + 4G/5G");
        tvHeroQuic = miniTag(heroStrip, "QUIC / DoH");
        tvHeroSni = miniTag(heroStrip, "Filtro SNI");
        hero.addView(heroStrip);

        root.addView(hero);

        alertBanner = new LinearLayout(this);
        alertBanner.setOrientation(LinearLayout.HORIZONTAL);
        alertBanner.setGravity(Gravity.CENTER_VERTICAL);
        alertBanner.setBackground(roundedBg(Color.parseColor("#241B0E"), Color.parseColor("#664818"), 14));
        alertBanner.setPadding(dp(12), dp(10), dp(12), dp(10));
        LinearLayout.LayoutParams abLp = new LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT);
        abLp.setMargins(0, dp(10), 0, 0);
        alertBanner.setLayoutParams(abLp);

        ImageView alertIc = new ImageView(this);
        alertIc.setImageResource(R.drawable.ic_alert_small);
        alertIc.setColorFilter(AMBER, PorterDuff.Mode.SRC_IN);
        LinearLayout.LayoutParams aicLp = new LinearLayout.LayoutParams(dp(16), dp(16));
        aicLp.setMargins(0, 0, dp(8), 0);
        alertIc.setLayoutParams(aicLp);
        alertBanner.addView(alertIc);

        tvAlertText = new TextView(this);
        tvAlertText.setText("Faltan permisos recomendados");
        tvAlertText.setTextSize(12);
        tvAlertText.setTextColor(AMBER);
        tvAlertText.setLayoutParams(new LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f));
        alertBanner.addView(tvAlertText);

        TextView fixBtn = new TextView(this);
        fixBtn.setText("Revisar");
        fixBtn.setTextSize(11);
        fixBtn.setTypeface(null, Typeface.BOLD);
        fixBtn.setTextColor(BG_DARK);
        fixBtn.setBackground(roundedBg(AMBER, AMBER, 999));
        fixBtn.setPadding(dp(11), dp(4), dp(11), dp(4));
        alertBanner.addView(fixBtn);
        alertBanner.setOnClickListener(v -> selectTab(3));
        root.addView(alertBanner);

        LinearLayout metrics = new LinearLayout(this);
        metrics.setOrientation(LinearLayout.HORIZONTAL);
        metrics.setWeightSum(3);
        LinearLayout.LayoutParams mlp = new LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT);
        mlp.setMargins(0, dp(10), 0, 0);
        metrics.setLayoutParams(mlp);

        tvAds = metricCard(metrics, R.drawable.ic_nav_shield, "0", "Bloqueados", EMERALD, true);
        tvQueries = metricCard(metrics, R.drawable.ic_nav_activity, "0", "Consultas", CYAN, true);
        tvListCount = metricCard(metrics, R.drawable.ic_perm_data, "76k", "Dominios", INDIGO, false);
        root.addView(metrics);

        LinearLayout lastCard = cardBox(15, 11);
        lastCard.addView(cardTitle("ÚLTIMO ANUNCIO CORTADO"));
        tvLast = new TextView(this);
        tvLast.setText("Ninguno aún — abre un juego o app");
        tvLast.setTextSize(12);
        tvLast.setTypeface(Typeface.MONOSPACE, Typeface.BOLD);
        tvLast.setTextColor(TEXT_PRIMARY);
        tvLast.setSingleLine(true);
        tvLast.setEllipsize(TextUtils.TruncateAt.MIDDLE);
        tvLast.setPadding(0, dp(2), 0, 0);
        lastCard.addView(tvLast);
        root.addView(lastCard);

        LinearLayout tunnelCard = cardBox(15, 11);
        tunnelCard.addView(cardTitle("ESTADO DEL TÚNEL (tun0)"));
        tvRowPackets = kvRowIcon(tunnelCard, R.drawable.ic_row_packets, CYAN, "Paquetes filtrados", "0");
        tunnelCard.addView(divider());
        tvRowDoh = kvRowIcon(tunnelCard, R.drawable.ic_row_doh, EMERALD, "DoT / DoH bloqueados", "0");
        tunnelCard.addView(divider());
        tvRowQuic = kvRowIcon(tunnelCard, R.drawable.ic_row_quic, AMBER, "QUIC cortados (443/8443)", "0");
        tunnelCard.addView(divider());
        tvRowDns = kvRowIcon(tunnelCard, R.drawable.ic_row_dns, INDIGO, "Servidor DNS", "Control D + OISD");
        root.addView(tunnelCard);

        LinearLayout quick = new LinearLayout(this);
        quick.setOrientation(LinearLayout.HORIZONTAL);
        quick.setWeightSum(2);
        LinearLayout.LayoutParams qlp = new LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT);
        qlp.setMargins(0, dp(10), 0, 0);
        quick.setLayoutParams(qlp);

        LinearLayout b1 = pillIconButton(R.drawable.ic_btn_download, "Actualizar listas",
                EMERALD, Color.parseColor("#041A11"), v -> downloadBlocklistNow());
        LinearLayout.LayoutParams b1lp = new LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f);
        b1lp.setMargins(0, 0, dp(5), 0);
        b1.setLayoutParams(b1lp);
        quick.addView(b1);

        LinearLayout b2 = pillIconButton(R.drawable.ic_btn_radar, "Ver actividad",
                BG_SURFACE_2, TEXT_PRIMARY, v -> selectTab(1));
        LinearLayout.LayoutParams b2lp = new LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f);
        b2lp.setMargins(dp(5), 0, 0, 0);
        b2.setLayoutParams(b2lp);
        quick.addView(b2);

        root.addView(quick);
        return root;
    }

    // --------------------------------------------------------- TAB 2: ACTIVIDAD

    private LinearLayout buildActivityTab() {
        LinearLayout root = tabContainer();

        LinearLayout headerCard = cardBox(15, 13);
        headerCard.addView(cardTitle("TRÁFICO EN TIEMPO REAL"));
        TextView desc = new TextView(this);
        desc.setText("Pulsa Bloquear en cualquier dominio verde si ves publicidad en un juego o app.");
        desc.setTextSize(12);
        desc.setTextColor(TEXT_MUTED);
        desc.setPadding(0, dp(2), 0, dp(10));
        headerCard.addView(desc);

        LinearLayout chips = new LinearLayout(this);
        chips.setOrientation(LinearLayout.HORIZONTAL);
        String[] names = { "Todos", "Bloqueados", "Permitidos" };
        for (int i = 0; i < 3; i++) {
            final int idx = i;
            TextView chip = new TextView(this);
            chip.setText(names[i]);
            chip.setTextSize(11);
            chip.setTypeface(null, Typeface.BOLD);
            chip.setGravity(Gravity.CENTER);
            chip.setPadding(dp(10), dp(7), dp(10), dp(7));
            LinearLayout.LayoutParams clp = new LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f);
            if (i < 2) clp.setMargins(0, 0, dp(6), 0);
            chip.setLayoutParams(clp);
            chip.setOnClickListener(v -> {
                activityFilter = idx;
                styleFilterChips();
                renderHistory();
            });
            filterPills[i] = chip;
            chips.addView(chip);
        }
        styleFilterChips();
        headerCard.addView(chips);

        LinearLayout searchBox = new LinearLayout(this);
        searchBox.setOrientation(LinearLayout.HORIZONTAL);
        searchBox.setGravity(Gravity.CENTER_VERTICAL);
        searchBox.setBackground(roundedBg(BG_DARK, BORDER_SUBTLE, 11));
        searchBox.setPadding(dp(10), dp(2), dp(8), dp(2));
        LinearLayout.LayoutParams slp = new LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT);
        slp.setMargins(0, dp(9), 0, 0);
        searchBox.setLayoutParams(slp);

        ImageView sIc = new ImageView(this);
        sIc.setImageResource(R.drawable.ic_search_small);
        sIc.setColorFilter(TEXT_MUTED, PorterDuff.Mode.SRC_IN);
        LinearLayout.LayoutParams silp = new LinearLayout.LayoutParams(dp(15), dp(15));
        silp.setMargins(0, 0, dp(8), 0);
        sIc.setLayoutParams(silp);
        searchBox.addView(sIc);

        etSearch = new EditText(this);
        etSearch.setHint("Buscar dominio (ej: mollyflow, emochi)...");
        etSearch.setTextSize(12);
        etSearch.setSingleLine(true);
        etSearch.setBackground(null);
        etSearch.setTextColor(TEXT_PRIMARY);
        etSearch.setHintTextColor(Color.parseColor("#52668A"));
        etSearch.setPadding(0, dp(7), 0, dp(7));
        etSearch.setLayoutParams(new LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f));
        etSearch.addTextChangedListener(new TextWatcher() {
            @Override public void beforeTextChanged(CharSequence s, int start, int count, int after) {}
            @Override public void onTextChanged(CharSequence s, int start, int before, int count) {}
            @Override public void afterTextChanged(Editable s) {
                activityQuery = s == null ? "" : s.toString().trim().toLowerCase();
                renderHistory();
            }
        });
        searchBox.addView(etSearch);

        TextView clearBtn = new TextView(this);
        clearBtn.setText("Limpiar");
        clearBtn.setTextSize(10);
        clearBtn.setTypeface(null, Typeface.BOLD);
        clearBtn.setTextColor(TEXT_MUTED);
        clearBtn.setPadding(dp(8), dp(5), dp(6), dp(5));
        clearBtn.setOnClickListener(v -> etSearch.setText(""));
        searchBox.addView(clearBtn);

        headerCard.addView(searchBox);
        root.addView(headerCard);

        LinearLayout listCard = cardBox(12, 8);
        boxHistory = new LinearLayout(this);
        boxHistory.setOrientation(LinearLayout.VERTICAL);
        listCard.addView(boxHistory);
        root.addView(listCard);

        LinearLayout foot = new LinearLayout(this);
        foot.setOrientation(LinearLayout.HORIZONTAL);
        foot.setGravity(Gravity.CENTER_VERTICAL);
        LinearLayout.LayoutParams flp = new LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT);
        flp.setMargins(0, dp(10), 0, 0);
        foot.setLayoutParams(flp);

        tvManual = new TextView(this);
        tvManual.setText("Bloqueados a mano: 0 | Permitidos: 0");
        tvManual.setTextSize(11);
        tvManual.setTextColor(TEXT_MUTED);
        tvManual.setLayoutParams(new LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f));
        foot.addView(tvManual);

        foot.addView(pillButton("Limpiar lista", BG_SURFACE_2, TEXT_PRIMARY, v -> {
            TrafficLog.clear();
            renderHistory();
            toast("Historial limpio");
        }));

        root.addView(foot);
        return root;
    }

    // --------------------------------------------------------- TAB 3: FILTROS

    private LinearLayout buildFiltersTab() {
        LinearLayout root = tabContainer();

        LinearLayout dnsCard = cardBox(15, 13);
        dnsCard.addView(cardTitle("SERVIDOR DNS (WIFI Y DATOS 4G/5G)"));

        LinearLayout spBox = new LinearLayout(this);
        spBox.setOrientation(LinearLayout.HORIZONTAL);
        spBox.setGravity(Gravity.CENTER_VERTICAL);
        spBox.setBackground(roundedBg(BG_DARK, BORDER_SUBTLE, 12));
        spBox.setPadding(dp(10), dp(4), dp(12), dp(4));

        spProvider = new Spinner(this);
        spProvider.setBackground(null);
        spProvider.setLayoutParams(new LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f));
        String[] items = new String[DnsProviders.ALL.length];
        for (int i = 0; i < DnsProviders.ALL.length; i++) {
            items[i] = DnsProviders.ALL[i].name + " (" + DnsProviders.ALL[i].primary + ")";
        }
        ArrayAdapter<String> ad = new ArrayAdapter<String>(this,
                android.R.layout.simple_spinner_item, items) {
            @Override public View getView(int pos, View cv, ViewGroup p) {
                TextView v = (TextView) super.getView(pos, cv, p);
                v.setTextColor(TEXT_PRIMARY);
                v.setTextSize(13);
                v.setSingleLine(true);
                v.setEllipsize(TextUtils.TruncateAt.END);
                v.setPadding(dp(4), dp(8), dp(4), dp(8));
                return v;
            }
            @Override public View getDropDownView(int pos, View cv, ViewGroup p) {
                TextView v = (TextView) super.getDropDownView(pos, cv, p);
                v.setBackgroundColor(BG_SURFACE);
                v.setTextColor(TEXT_PRIMARY);
                v.setTextSize(13);
                v.setPadding(dp(14), dp(12), dp(14), dp(12));
                return v;
            }
        };
        spProvider.setAdapter(ad);
        spBox.addView(spProvider);

        ImageView chevron = new ImageView(this);
        chevron.setImageResource(R.drawable.ic_chevron_down);
        chevron.setColorFilter(CYAN, PorterDuff.Mode.SRC_IN);
        chevron.setLayoutParams(new LinearLayout.LayoutParams(dp(18), dp(18)));
        spBox.addView(chevron);
        dnsCard.addView(spBox);

        tvDnsNote = new TextView(this);
        tvDnsNote.setText("Lista OISD Full: bloquea anuncios sin frenar juegos");
        tvDnsNote.setTextSize(11);
        tvDnsNote.setTextColor(TEXT_MUTED);
        tvDnsNote.setPadding(0, dp(7), 0, 0);
        dnsCard.addView(tvDnsNote);

        root.addView(dnsCard);

        LinearLayout swCard = cardBox(15, 10);
        swCard.addView(cardTitle("CAPAS DE BLOQUEO AVANZADO"));
        swCard.addView(switchRow(R.drawable.ic_nav_shield, "Inspección SNI + HTTP", "Analiza conexiones de juegos sin descifrar datos privados", 0));
        swCard.addView(divider());
        swCard.addView(switchRow(R.drawable.ic_nav_filters, "Bloquear red publicitaria de Meta", "Filtra anuncios sin afectar WhatsApp ni Instagram", 1));
        swCard.addView(divider());
        swCard.addView(switchRow(R.drawable.ic_nav_activity, "Cortar QUIC (UDP 443 y 8443)", "Evita que Chrome/WebView/ads esquiven el filtro TCP", 2));
        swCard.addView(divider());
        swCard.addView(switchRow(R.drawable.ic_perm_vpn, "Cortar DoT / DoH evasivo", "Impide que los SDKs usen DNS privado 1.1.1.1 / 8.8.8.8", 3));
        swCard.addView(divider());
        swCard.addView(switchRow(R.drawable.ic_perm_notif, "Notificar anuncios bloqueados", "Muestra aviso en Android al cortar publicidad", 4));
        root.addView(swCard);

        LinearLayout listCard = cardBox(15, 13);
        listCard.addView(cardTitle("BASE DE DOMINIOS PUBLICITARIOS"));
        tvUpdateStatus = new TextView(this);
        tvUpdateStatus.setText("HaGeZi Pro + StevenBlack (+200.000 dominios)");
        tvUpdateStatus.setTextSize(12);
        tvUpdateStatus.setTextColor(TEXT_PRIMARY);
        tvUpdateStatus.setPadding(0, dp(2), 0, dp(10));
        listCard.addView(tvUpdateStatus);
        listCard.addView(pillButton("Actualizar listas ahora", EMERALD, Color.parseColor("#041A11"), v -> downloadBlocklistNow()));
        root.addView(listCard);

        LinearLayout manualCard = cardBox(15, 13);
        manualCard.addView(cardTitle("REGLAS MANUALES"));
        manualCard.addView(fieldLabel("Dominios extra a bloquear (uno por línea)"));
        etBlock = editor("ej: mollyflow.com");
        manualCard.addView(etBlock);
        manualCard.addView(spaceV(10));
        manualCard.addView(fieldLabel("Excepciones (no bloquear)"));
        etAllow = editor("ej: ads.mijuego.com");
        manualCard.addView(etAllow);
        manualCard.addView(spaceV(12));
        manualCard.addView(pillButton("Guardar y aplicar reglas", CYAN, BG_DARK, v -> saveAndApply()));

        tvRules = new TextView(this);
        tvRules.setTextSize(11);
        tvRules.setTextColor(TEXT_MUTED);
        tvRules.setGravity(Gravity.CENTER);
        tvRules.setPadding(0, dp(8), 0, 0);
        manualCard.addView(tvRules);
        root.addView(manualCard);

        return root;
    }

    // --------------------------------------------------------- TAB 4: PERMISOS

    private LinearLayout buildPermissionsTab() {
        LinearLayout root = tabContainer();

        LinearLayout topCard = cardBox(15, 13);
        topCard.addView(cardTitle("PERMISOS DEL SISTEMA ANDROID"));
        tvPermsSummary = new TextView(this);
        tvPermsSummary.setText("Comprobando estado...");
        tvPermsSummary.setTextSize(12);
        tvPermsSummary.setTextColor(TEXT_MUTED);
        tvPermsSummary.setPadding(0, dp(2), 0, dp(10));
        topCard.addView(tvPermsSummary);

        btnGrantPerms = pillButton("Conceder permisos pendientes", EMERALD, Color.parseColor("#041A11"),
                v -> grantNextMissingPermission());
        topCard.addView(btnGrantPerms);
        topCard.addView(spaceV(8));
        topCard.addView(pillButton("Enviar notificación de prueba", BG_SURFACE_2, TEXT_PRIMARY,
                v -> sendTestNotification()));
        root.addView(topCard);

        LinearLayout listCard = cardBox(15, 12);
        listCard.addView(cardTitle("ESTADO DETALLADO"));
        boxPerms = new LinearLayout(this);
        boxPerms.setOrientation(LinearLayout.VERTICAL);
        listCard.addView(boxPerms);
        root.addView(listCard);

        LinearLayout cacheCard = cardBox(15, 13);
        cacheCard.addView(cardTitle("LIMPIAR CACHÉ DE ANUNCIOS EN JUEGOS"));
        TextView info = new TextView(this);
        info.setText("Si un juego o app ya había descargado publicidad antes de activar el filtro, fuérzale el cierre y borra su caché.");
        info.setTextSize(12);
        info.setTextColor(TEXT_MUTED);
        info.setPadding(0, dp(2), 0, dp(10));
        cacheCard.addView(info);

        cacheCard.addView(pillButton("Abrir aplicaciones (forzar cierre / caché)", CYAN, BG_DARK, v -> {
            try {
                startActivity(new Intent(Settings.ACTION_APPLICATION_SETTINGS));
            } catch (Exception e) { toast("No se pudo abrir"); }
        }));
        cacheCard.addView(spaceV(8));
        cacheCard.addView(pillButton("Abrir Google Play Services", BG_SURFACE_2, TEXT_PRIMARY,
                v -> openPackage("com.google.android.gms")));
        cacheCard.addView(spaceV(8));
        cacheCard.addView(pillButton("Ajustes avanzados de esta app", BG_SURFACE_2, TEXT_PRIMARY,
                v -> openPackage(getPackageName())));
        cacheCard.addView(spaceV(8));
        cacheCard.addView(pillButton("Registro de errores (diagnóstico)", Color.parseColor("#26121C"), ROSE,
                v -> showDiagnostic()));
        root.addView(cacheCard);

        return root;
    }

    // --------------------------------------------------------- BOTTOM NAV

    private LinearLayout buildBottomNav() {
        LinearLayout nav = new LinearLayout(this);
        nav.setOrientation(LinearLayout.HORIZONTAL);
        nav.setWeightSum(4);
        nav.setBackgroundColor(BG_BAR);
        nav.setPadding(dp(8), dp(6), dp(8), dp(8));

        int[] iconRes = {
                R.drawable.ic_nav_shield,
                R.drawable.ic_nav_activity,
                R.drawable.ic_nav_filters,
                R.drawable.ic_nav_perms
        };
        String[] labels = { "Protección", "Actividad", "Filtros", "Permisos" };

        for (int i = 0; i < 4; i++) {
            final int idx = i;
            LinearLayout item = new LinearLayout(this);
            item.setOrientation(LinearLayout.VERTICAL);
            item.setGravity(Gravity.CENTER);
            item.setPadding(dp(4), dp(4), dp(4), dp(6));
            LinearLayout.LayoutParams lp = new LinearLayout.LayoutParams(
                    0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f);
            item.setLayoutParams(lp);

            View bar = new View(this);
            bar.setBackground(roundedBg(CYAN, CYAN, 999));
            LinearLayout.LayoutParams blp = new LinearLayout.LayoutParams(dp(26), dp(3));
            blp.gravity = Gravity.CENTER_HORIZONTAL;
            blp.setMargins(0, 0, 0, dp(4));
            bar.setLayoutParams(blp);
            item.addView(bar);

            ImageView ic = new ImageView(this);
            ic.setImageResource(iconRes[i]);
            ic.setScaleType(ImageView.ScaleType.FIT_CENTER);
            LinearLayout.LayoutParams ilp = new LinearLayout.LayoutParams(dp(21), dp(21));
            ilp.gravity = Gravity.CENTER_HORIZONTAL;
            ic.setLayoutParams(ilp);
            item.addView(ic);

            TextView lb = new TextView(this);
            lb.setText(labels[i]);
            lb.setTextSize(11);
            lb.setTypeface(null, Typeface.BOLD);
            lb.setGravity(Gravity.CENTER);
            lb.setIncludeFontPadding(false);
            LinearLayout.LayoutParams lblp = new LinearLayout.LayoutParams(
                    ViewGroup.LayoutParams.WRAP_CONTENT, ViewGroup.LayoutParams.WRAP_CONTENT);
            lblp.gravity = Gravity.CENTER_HORIZONTAL;
            lblp.setMargins(0, dp(4), 0, 0);
            lb.setLayoutParams(lblp);
            item.addView(lb);

            item.setOnClickListener(v -> selectTab(idx));
            navItems[i] = item;
            navBars[i] = bar;
            navIcons[i] = ic;
            navLabels[i] = lb;
            nav.addView(item);
        }
        return nav;
    }

    private void selectTab(int index) {
        activeTab = index;
        for (int i = 0; i < 4; i++) {
            boolean sel = (i == index);
            tabViews[i].setVisibility(sel ? View.VISIBLE : View.GONE);
            navItems[i].setBackground(sel
                    ? roundedBg(Color.parseColor("#12233C"), Color.parseColor("#1D4E6E"), 12)
                    : null);
            navBars[i].setVisibility(sel ? View.VISIBLE : View.INVISIBLE);
            int tint = sel ? CYAN : TEXT_MUTED;
            navIcons[i].setColorFilter(tint, PorterDuff.Mode.SRC_IN);
            navLabels[i].setTextColor(tint);
        }
    }

    // --------------------------------------------------------- UI HELPERS

    private ScrollView wrapScroll(LinearLayout child) {
        ScrollView sv = new ScrollView(this);
        sv.setBackgroundColor(BG_DARK);
        sv.setFillViewport(true);
        sv.addView(child);
        return sv;
    }

    private LinearLayout tabContainer() {
        LinearLayout l = new LinearLayout(this);
        l.setOrientation(LinearLayout.VERTICAL);
        l.setPadding(dp(12), dp(8), dp(12), dp(18));
        return l;
    }

    private LinearLayout cardBox(int padH, int padV) {
        LinearLayout c = new LinearLayout(this);
        c.setOrientation(LinearLayout.VERTICAL);
        c.setBackground(roundedBg(BG_SURFACE, BORDER_SUBTLE, 16));
        c.setPadding(dp(padH), dp(padV), dp(padH), dp(padV));
        LinearLayout.LayoutParams lp = new LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT);
        lp.setMargins(0, dp(10), 0, 0);
        c.setLayoutParams(lp);
        return c;
    }

    private TextView cardTitle(String text) {
        TextView t = new TextView(this);
        t.setText(text);
        t.setTextSize(10);
        t.setTypeface(null, Typeface.BOLD);
        t.setLetterSpacing(0.08f);
        t.setTextColor(CYAN);
        t.setPadding(0, 0, 0, dp(5));
        return t;
    }

    private TextView fieldLabel(String text) {
        TextView t = new TextView(this);
        t.setText(text);
        t.setTextSize(11);
        t.setTextColor(TEXT_MUTED);
        t.setPadding(0, 0, 0, dp(5));
        return t;
    }

    private TextView miniTag(LinearLayout parent, String text) {
        TextView t = new TextView(this);
        t.setText(text);
        t.setTextSize(10);
        t.setTypeface(null, Typeface.BOLD);
        t.setTextColor(TEXT_MUTED);
        t.setGravity(Gravity.CENTER);
        t.setLayoutParams(new LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f));
        parent.addView(t);
        return t;
    }

    private TextView metricCard(LinearLayout parent, int iconRes, String val, String label, int color, boolean gapRight) {
        LinearLayout c = new LinearLayout(this);
        c.setOrientation(LinearLayout.VERTICAL);
        c.setGravity(Gravity.CENTER);
        c.setBackground(roundedBg(BG_SURFACE, BORDER_SUBTLE, 14));
        c.setPadding(dp(8), dp(10), dp(8), dp(10));
        LinearLayout.LayoutParams lp = new LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f);
        if (gapRight) lp.setMargins(0, 0, dp(8), 0);
        c.setLayoutParams(lp);

        LinearLayout iconWrap = new LinearLayout(this);
        iconWrap.setGravity(Gravity.CENTER);
        int softBg = Color.argb(30, Color.red(color), Color.green(color), Color.blue(color));
        int softBd = Color.argb(80, Color.red(color), Color.green(color), Color.blue(color));
        iconWrap.setBackground(roundedBg(softBg, softBd, 8));
        LinearLayout.LayoutParams iwp = new LinearLayout.LayoutParams(dp(26), dp(26));
        iwp.setMargins(0, 0, 0, dp(6));
        iconWrap.setLayoutParams(iwp);

        ImageView ic = new ImageView(this);
        ic.setImageResource(iconRes);
        ic.setColorFilter(color, PorterDuff.Mode.SRC_IN);
        ic.setLayoutParams(new LinearLayout.LayoutParams(dp(15), dp(15)));
        iconWrap.addView(ic);
        c.addView(iconWrap);

        TextView v = new TextView(this);
        v.setText(val);
        v.setTextSize(19);
        v.setTypeface(null, Typeface.BOLD);
        v.setTextColor(TEXT_PRIMARY);
        v.setGravity(Gravity.CENTER);
        c.addView(v);

        TextView l = new TextView(this);
        l.setText(label);
        l.setTextSize(11);
        l.setTextColor(TEXT_MUTED);
        l.setGravity(Gravity.CENTER);
        l.setIncludeFontPadding(false);
        l.setPadding(0, dp(2), 0, 0);
        c.addView(l);

        parent.addView(c);
        return v;
    }

    private TextView kvRowIcon(LinearLayout parent, int iconRes, int iconTint, String label, String value) {
        LinearLayout row = new LinearLayout(this);
        row.setOrientation(LinearLayout.HORIZONTAL);
        row.setGravity(Gravity.CENTER_VERTICAL);
        row.setPadding(0, dp(7), 0, dp(7));

        LinearLayout iconWrap = new LinearLayout(this);
        iconWrap.setGravity(Gravity.CENTER);
        iconWrap.setBackground(roundedBg(Color.parseColor("#0D192E"), BORDER_SUBTLE, 8));
        LinearLayout.LayoutParams wlp = new LinearLayout.LayoutParams(dp(26), dp(26));
        wlp.setMargins(0, 0, dp(9), 0);
        iconWrap.setLayoutParams(wlp);

        ImageView ic = new ImageView(this);
        ic.setImageResource(iconRes);
        ic.setColorFilter(iconTint, PorterDuff.Mode.SRC_IN);
        ic.setLayoutParams(new LinearLayout.LayoutParams(dp(15), dp(15)));
        iconWrap.addView(ic);
        row.addView(iconWrap);

        TextView k = new TextView(this);
        k.setText(label);
        k.setTextSize(12);
        k.setTextColor(TEXT_MUTED);
        k.setSingleLine(true);
        k.setEllipsize(TextUtils.TruncateAt.END);
        k.setLayoutParams(new LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f));
        k.setPadding(0, 0, dp(8), 0);
        row.addView(k);

        TextView v = new TextView(this);
        v.setText(value);
        v.setTextSize(12);
        v.setTypeface(Typeface.MONOSPACE, Typeface.BOLD);
        v.setTextColor(TEXT_PRIMARY);
        v.setSingleLine(true);
        v.setEllipsize(TextUtils.TruncateAt.END);
        v.setGravity(Gravity.END);
        row.addView(v);

        parent.addView(row);
        return v;
    }

    private View divider() {
        View v = new View(this);
        v.setBackgroundColor(Color.parseColor("#18243E"));
        v.setLayoutParams(new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, dp(1)));
        return v;
    }

    private View spaceV(int heightDp) {
        View v = new View(this);
        v.setLayoutParams(new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, dp(heightDp)));
        return v;
    }

    private TextView pillButton(String text, int bgColor, int textColor, View.OnClickListener click) {
        TextView b = new TextView(this);
        b.setText(text);
        b.setTextSize(13);
        b.setTypeface(null, Typeface.BOLD);
        b.setTextColor(textColor);
        b.setGravity(Gravity.CENTER);
        b.setBackground(roundedBg(bgColor, bgColor, 12));
        b.setPadding(dp(14), dp(11), dp(14), dp(11));
        b.setOnClickListener(click);
        return b;
    }

    private LinearLayout pillIconButton(int iconRes, String text, int bgColor, int textColor, View.OnClickListener click) {
        LinearLayout box = new LinearLayout(this);
        box.setOrientation(LinearLayout.HORIZONTAL);
        box.setGravity(Gravity.CENTER);
        box.setBackground(roundedBg(bgColor, bgColor, 12));
        box.setPadding(dp(12), dp(11), dp(12), dp(11));

        ImageView ic = new ImageView(this);
        ic.setImageResource(iconRes);
        ic.setColorFilter(textColor, PorterDuff.Mode.SRC_IN);
        LinearLayout.LayoutParams ilp = new LinearLayout.LayoutParams(dp(16), dp(16));
        ilp.setMargins(0, 0, dp(7), 0);
        ic.setLayoutParams(ilp);
        box.addView(ic);

        TextView b = new TextView(this);
        b.setText(text);
        b.setTextSize(12);
        b.setTypeface(null, Typeface.BOLD);
        b.setTextColor(textColor);
        b.setSingleLine(true);
        b.setIncludeFontPadding(false);
        box.addView(b);

        box.setOnClickListener(click);
        return box;
    }

    private LinearLayout switchRow(int iconRes, String title, String desc, int which) {
        LinearLayout row = new LinearLayout(this);
        row.setOrientation(LinearLayout.HORIZONTAL);
        row.setGravity(Gravity.CENTER_VERTICAL);
        row.setPadding(0, dp(10), 0, dp(10));

        LinearLayout iconWrap = new LinearLayout(this);
        iconWrap.setGravity(Gravity.CENTER);
        iconWrap.setBackground(roundedBg(Color.parseColor("#0D192E"), BORDER_SUBTLE, 9));
        LinearLayout.LayoutParams wlp = new LinearLayout.LayoutParams(dp(30), dp(30));
        wlp.setMargins(0, 0, dp(10), 0);
        iconWrap.setLayoutParams(wlp);

        ImageView ic = new ImageView(this);
        ic.setImageResource(iconRes);
        ic.setColorFilter(CYAN, PorterDuff.Mode.SRC_IN);
        ic.setLayoutParams(new LinearLayout.LayoutParams(dp(16), dp(16)));
        iconWrap.addView(ic);
        row.addView(iconWrap);

        LinearLayout left = new LinearLayout(this);
        left.setOrientation(LinearLayout.VERTICAL);
        left.setLayoutParams(new LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f));
        left.setPadding(0, 0, dp(10), 0);

        TextView t = new TextView(this);
        t.setText(title);
        t.setTextSize(13);
        t.setTypeface(null, Typeface.BOLD);
        t.setTextColor(TEXT_PRIMARY);
        left.addView(t);

        TextView d = new TextView(this);
        d.setText(desc);
        d.setTextSize(11);
        d.setTextColor(TEXT_MUTED);
        d.setPadding(0, dp(2), 0, 0);
        left.addView(d);

        row.addView(left);

        Switch s = new Switch(this);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            int[][] states = { { android.R.attr.state_checked }, {} };
            s.setThumbTintList(new ColorStateList(states, new int[] { EMERALD, Color.parseColor("#879BC0") }));
            s.setTrackTintList(new ColorStateList(states, new int[] { Color.parseColor("#0D4A36"), Color.parseColor("#1D2B48") }));
        }
        row.addView(s);

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
        return row;
    }

    private EditText editor(String hint) {
        EditText e = new EditText(this);
        e.setHint(hint);
        e.setTextSize(12);
        e.setMinLines(2);
        e.setBackground(roundedBg(BG_DARK, BORDER_SUBTLE, 12));
        e.setTextColor(TEXT_PRIMARY);
        e.setHintTextColor(Color.parseColor("#52668A"));
        e.setPadding(dp(12), dp(10), dp(12), dp(10));
        e.setLayoutParams(new LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT));
        return e;
    }

    private GradientDrawable roundedBg(int fill, int stroke, int radiusDp) {
        GradientDrawable gd = new GradientDrawable();
        gd.setColor(fill);
        gd.setCornerRadius(dp(radiusDp));
        if (stroke != fill) gd.setStroke(dp(1), stroke);
        return gd;
    }

    private void styleFilterChips() {
        for (int i = 0; i < 3; i++) {
            boolean sel = (i == activityFilter);
            filterPills[i].setBackground(roundedBg(
                    sel ? Color.parseColor("#132642") : BG_DARK,
                    sel ? CYAN : BORDER_SUBTLE, 999));
            filterPills[i].setTextColor(sel ? CYAN : TEXT_MUTED);
        }
    }

    private int dp(int v) { return Math.round(v * getResources().getDisplayMetrics().density); }

    private void toast(String s) { Toast.makeText(this, s, Toast.LENGTH_SHORT).show(); }

    // -------------------------------------------------------------- LÓGICA

    private void downloadBlocklistNow() {
        toast("Descargando HaGeZi Pro + StevenBlack...");
        new Thread(() -> {
            int n = Blocklist.download(this);
            handler.post(() -> {
                if (n > 0) {
                    reloadRules();
                    refresh();
                    if (tvRules != null) tvRules.setText(Blocklist.stats(this));
                    if (tvUpdateStatus != null) {
                        tvUpdateStatus.setText("Actualizada: " + String.format("%,d", Blocklist.count(this)) + " dominios");
                    }
                    toast("Lista actualizada: " + String.format("%,d", n) + " dominios");
                } else {
                    toast("No se pudo descargar. Revisa tu internet.");
                }
            });
        }, "UpdateList").start();
    }

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
        if (tvDnsNote != null) tvDnsNote.setText(DnsProviders.get(prov).note);
        loadingPrefs = false;

        spProvider.setOnItemSelectedListener(new AdapterView.OnItemSelectedListener() {
            @Override public void onItemSelected(AdapterView<?> par, View v, int pos, long id) {
                if (tvDnsNote != null) tvDnsNote.setText(DnsProviders.get(pos).note);
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

    private void setPulseActive(boolean active, int strokeColor) {
        if (vPulseRing == null) return;
        vPulseRing.setBackground(roundedBg(Color.TRANSPARENT, strokeColor, 999));
        if (active) {
            if (pulseAnim == null) {
                pulseAnim = ObjectAnimator.ofFloat(vPulseRing, "alpha", 0.20f, 0.88f);
                pulseAnim.setDuration(1050);
                pulseAnim.setRepeatMode(ValueAnimator.REVERSE);
                pulseAnim.setRepeatCount(ValueAnimator.INFINITE);
            }
            if (!pulseAnim.isRunning()) pulseAnim.start();
        } else {
            if (pulseAnim != null && pulseAnim.isRunning()) pulseAnim.cancel();
            vPulseRing.setAlpha(0.32f);
        }
    }

    private String shortDnsName(String raw) {
        if (raw == null) return "Control D";
        int idx = raw.indexOf(" (");
        return idx > 0 ? raw.substring(0, idx) : raw;
    }

    private void refresh() {
        boolean enabled = prefs.getBoolean(Blocklist.KEY_ENABLED, false);
        boolean real = AdBlockVpnService.SERVICE_RUNNING.get();

        if (!enabled) {
            tvState.setText("Protección desactivada");
            tvState.setTextColor(ROSE);
            tvSubState.setText("Pulsa la llave para proteger WiFi y Datos 4G/5G");
            btnPower.setBackgroundResource(R.drawable.bg_gamer_off);
            powerInnerPlate.setBackground(roundedBg(Color.parseColor("#2A1524"), Color.parseColor("#6E2842"), 999));
            ivKey.setColorFilter(ROSE, PorterDuff.Mode.SRC_IN);
            tvKeyLabel.setText("ACTIVAR");
            tvKeyLabel.setTextColor(TEXT_PRIMARY);
            tvKeyLabel.setBackground(roundedBg(Color.parseColor("#241222"), Color.parseColor("#61253B"), 999));
            setPulseActive(false, Color.parseColor("#38FF4D6D"));
            ivTopKey.setColorFilter(ROSE, PorterDuff.Mode.SRC_IN);
            tvTopKey.setText("SIN LLAVE");
            tvTopKey.setTextColor(ROSE);
            topKeyBox.setBackground(roundedBg(Color.parseColor("#24111B"), Color.parseColor("#5C2032"), 999));
        } else if (!real) {
            boolean timedOut = enabledAt > 0 && System.currentTimeMillis() - enabledAt > 6000;
            tvState.setText(timedOut ? "Toca para reintentar VPN" : "Activando llave VPN...");
            tvState.setTextColor(AMBER);
            tvSubState.setText("Acepta el permiso VPN de Android si aparece en pantalla");
            btnPower.setBackgroundResource(R.drawable.bg_gamer_wait);
            powerInnerPlate.setBackground(roundedBg(Color.parseColor("#2B2111"), Color.parseColor("#73531C"), 999));
            ivKey.setColorFilter(AMBER, PorterDuff.Mode.SRC_IN);
            tvKeyLabel.setText(timedOut ? "REINTENTAR" : "CONECTANDO");
            tvKeyLabel.setTextColor(AMBER);
            tvKeyLabel.setBackground(roundedBg(Color.parseColor("#241B0E"), Color.parseColor("#664818"), 999));
            setPulseActive(!timedOut, Color.parseColor("#55FFC247"));
            ivTopKey.setColorFilter(AMBER, PorterDuff.Mode.SRC_IN);
            tvTopKey.setText("INICIANDO");
            tvTopKey.setTextColor(AMBER);
            topKeyBox.setBackground(roundedBg(Color.parseColor("#241B0E"), Color.parseColor("#664818"), 999));
        } else {
            tvState.setText("Protegido · Llave VPN activa");
            tvState.setTextColor(EMERALD);
            tvSubState.setText("Bloqueando publicidad en juegos y apps (WiFi + 4G/5G)");
            btnPower.setBackgroundResource(R.drawable.bg_gamer_on);
            powerInnerPlate.setBackground(roundedBg(Color.parseColor("#0D3329"), Color.parseColor("#20785B"), 999));
            ivKey.setColorFilter(EMERALD, PorterDuff.Mode.SRC_IN);
            tvKeyLabel.setText("ACTIVA");
            tvKeyLabel.setTextColor(EMERALD);
            tvKeyLabel.setBackground(roundedBg(Color.parseColor("#0C2B21"), Color.parseColor("#1D6B4B"), 999));
            setPulseActive(true, Color.parseColor("#6600E68A"));
            ivTopKey.setColorFilter(EMERALD, PorterDuff.Mode.SRC_IN);
            tvTopKey.setText("LLAVE ACTIVA");
            tvTopKey.setTextColor(EMERALD);
            topKeyBox.setBackground(roundedBg(Color.parseColor("#0D291E"), Color.parseColor("#1D6B4B"), 999));
        }

        tvTopNet.setText(networkName());

        if (tvHeroNet != null) {
            tvHeroNet.setText(real ? "● Túnel activo" : "○ En espera");
            tvHeroNet.setTextColor(real ? EMERALD : TEXT_MUTED);
        }
        if (tvHeroQuic != null) {
            boolean q = prefs.getBoolean(Blocklist.KEY_BLOCK_QUIC, true);
            tvHeroQuic.setText(q ? "QUIC cortado" : "QUIC libre");
            tvHeroQuic.setTextColor(q && real ? CYAN : TEXT_MUTED);
        }
        if (tvHeroSni != null) {
            boolean s = prefs.getBoolean(Blocklist.KEY_SNI_MODE, true);
            tvHeroSni.setText(s ? "SNI activo" : "Solo DNS");
            tvHeroSni.setTextColor(s && real ? CYAN : TEXT_MUTED);
        }

        int blocked = AdBlockVpnService.DNS_BLOCKED.get() + AdBlockVpnService.SNI_BLOCKED.get();
        int queries = blocked + AdBlockVpnService.QUIC_DROPPED.get();
        int domains = Blocklist.count(this);

        tvAds.setText(String.format("%,d", blocked));
        tvQueries.setText(String.format("%,d", queries));
        tvListCount.setText(domains >= 1000 ? (domains / 1000) + "k" : String.valueOf(domains));

        List<String> rec = AdBlockVpnService.recentBlocks();
        tvLast.setText(rec.isEmpty() ? "Ninguno aún — abre un juego o app" : rec.get(rec.size() - 1));

        tvRowPackets.setText(String.format("%,d", AdBlockVpnService.PACKETS_READ.get()));
        tvRowDoh.setText(String.valueOf(AdBlockVpnService.ENCRYPTED_CUT.get()));
        tvRowQuic.setText(String.valueOf(AdBlockVpnService.QUIC_DROPPED.get()));

        int prov = prefs.getInt(Blocklist.KEY_DNS_PROVIDER, DnsProviders.DEFAULT);
        tvRowDns.setText(shortDnsName(DnsProviders.get(prov).name));
        if (tvUpdateStatus != null) {
            tvUpdateStatus.setText("Dominios activos: " + String.format("%,d", domains)
                    + (domains >= 120000 ? " (HaGeZi Pro + StevenBlack)" : " (lista base, pulsa para ampliar)"));
        }

        renderHistory();
        updatePermissions();
    }

    private String networkName() {
        try {
            ConnectivityManager cm = (ConnectivityManager) getSystemService(Context.CONNECTIVITY_SERVICE);
            if (cm == null) return "Sin conexión";
            NetworkInfo n = cm.getActiveNetworkInfo();
            if (n == null || !n.isConnected()) return "Sin conexión a internet";
            if (n.getType() == ConnectivityManager.TYPE_WIFI) return "WiFi conectado · Túnel listo";
            return "Datos móviles 4G/5G · Túnel listo";
        } catch (Exception e) { return "Red activa"; }
    }

    private void renderHistory() {
        List<TrafficLog.Entry> all = TrafficLog.recent(50);
        int cAll = 0, cBlk = 0, cAllow = 0;
        List<TrafficLog.Entry> list = new ArrayList<>();
        for (TrafficLog.Entry e : all) {
            if (!activityQuery.isEmpty() && !e.domain.toLowerCase().contains(activityQuery)) continue;
            cAll++;
            if (e.blocked) cBlk++; else cAllow++;
            if (activityFilter == 1 && !e.blocked) continue;
            if (activityFilter == 2 && e.blocked) continue;
            if (list.size() < 25) list.add(e);
        }

        if (filterPills[0] != null) filterPills[0].setText("Todos (" + cAll + ")");
        if (filterPills[1] != null) filterPills[1].setText("Bloqueados (" + cBlk + ")");
        if (filterPills[2] != null) filterPills[2].setText("Permitidos (" + cAllow + ")");

        boxHistory.removeAllViews();
        if (list.isEmpty()) {
            TextView t = new TextView(this);
            t.setText("Sin actividad reciente en esta categoría.");
            t.setTextSize(12);
            t.setTextColor(TEXT_MUTED);
            t.setPadding(dp(8), dp(14), dp(8), dp(14));
            t.setGravity(Gravity.CENTER);
            boxHistory.addView(t);
        } else {
            for (int idx = 0; idx < list.size(); idx++) {
                TrafficLog.Entry e = list.get(idx);
                LinearLayout row = new LinearLayout(this);
                row.setOrientation(LinearLayout.HORIZONTAL);
                row.setGravity(Gravity.CENTER_VERTICAL);
                row.setPadding(dp(4), dp(8), dp(4), dp(8));

                View dot = new View(this);
                dot.setBackground(roundedBg(e.blocked ? ROSE : EMERALD, e.blocked ? ROSE : EMERALD, 999));
                LinearLayout.LayoutParams dlp = new LinearLayout.LayoutParams(dp(8), dp(8));
                dlp.setMargins(0, 0, dp(9), 0);
                dot.setLayoutParams(dlp);
                row.addView(dot);

                LinearLayout mid = new LinearLayout(this);
                mid.setOrientation(LinearLayout.VERTICAL);
                mid.setLayoutParams(new LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f));
                mid.setPadding(0, 0, dp(8), 0);

                TextView dom = new TextView(this);
                dom.setText(e.domain);
                dom.setTextSize(12);
                dom.setTypeface(Typeface.MONOSPACE, Typeface.NORMAL);
                dom.setTextColor(e.blocked ? Color.parseColor("#FFB3C1") : TEXT_PRIMARY);
                dom.setSingleLine(true);
                dom.setEllipsize(TextUtils.TruncateAt.MIDDLE);
                mid.addView(dom);

                TextView meta = new TextView(this);
                meta.setText((e.blocked ? "Bloqueado" : "Permitido") + " · " + e.time);
                meta.setTextSize(10);
                meta.setTextColor(TEXT_MUTED);
                mid.addView(meta);

                row.addView(mid);

                TextView btn = new TextView(this);
                btn.setText(e.blocked ? "Permitir" : "Bloquear");
                btn.setTextSize(10);
                btn.setTypeface(null, Typeface.BOLD);
                btn.setTextColor(e.blocked ? TEXT_MUTED : ROSE);
                btn.setBackground(roundedBg(
                        e.blocked ? BG_DARK : Color.parseColor("#24111B"),
                        e.blocked ? BORDER_SUBTLE : Color.parseColor("#5C2032"), 999));
                btn.setPadding(dp(10), dp(5), dp(10), dp(5));
                final String d = e.domain;
                final boolean was = e.blocked;
                btn.setOnClickListener(v -> manualRule(d, !was));
                row.addView(btn);

                boxHistory.addView(row);
                if (idx < list.size() - 1) boxHistory.addView(divider());
            }
        }
        String cb = prefs.getString(Blocklist.KEY_CUSTOM_BLOCK, "");
        String ca = prefs.getString(Blocklist.KEY_CUSTOM_ALLOW, "");
        tvManual.setText("Bloqueados a mano: " + countLines(cb) + " | Permitidos: " + countLines(ca));
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
        toast("Reglas guardadas y aplicadas");
    }

    private void updatePermissions() {
        boolean vpn = VpnService.prepare(this) == null;
        boolean notif = areNotificationsReallyEnabled();
        boolean batt = isBatteryExempt();
        boolean dataOk = isBackgroundDataAllowed();

        int missing = (vpn ? 0 : 1) + (notif ? 0 : 1) + (batt ? 0 : 1) + (dataOk ? 0 : 1);
        if (alertBanner != null) {
            alertBanner.setVisibility(missing > 0 ? View.VISIBLE : View.GONE);
            tvAlertText.setText(missing == 1
                    ? "Falta 1 permiso para no cortar la VPN"
                    : "Faltan " + missing + " permisos recomendados");
        }

        if (missing == 0) {
            tvPermsSummary.setText("Todos los permisos de Android están concedidos y activos.");
            btnGrantPerms.setText("Todos los permisos están activos");
            btnGrantPerms.setTextColor(EMERALD);
            btnGrantPerms.setBackground(roundedBg(Color.parseColor("#0D291E"), Color.parseColor("#1D6B4B"), 12));
        } else {
            tvPermsSummary.setText("Pulsa Activar en los permisos pendientes para evitar cortes.");
            btnGrantPerms.setText("Conceder " + missing + (missing == 1 ? " permiso pendiente" : " permisos pendientes"));
            btnGrantPerms.setTextColor(Color.parseColor("#041A11"));
            btnGrantPerms.setBackground(roundedBg(EMERALD, EMERALD, 12));
        }

        boxPerms.removeAllViews();
        addPermRow(R.drawable.ic_perm_vpn, "VPN del sistema", "Muestra la llave superior y filtra WiFi + 4G/5G", vpn, v -> startProtection());
        boxPerms.addView(divider());
        addPermRow(R.drawable.ic_perm_notif, "Notificaciones Android", "Avisos en vivo al bloquear publicidad", notif, v -> activateNotificationsFromAndroid());
        boxPerms.addView(divider());
        addPermRow(R.drawable.ic_perm_battery, "Batería sin restricciones", "Evita que Android cierre el bloqueo en juegos", batt, v -> requestBattery());
        boxPerms.addView(divider());
        addPermRow(R.drawable.ic_perm_data, "Datos 4G/5G sin restricción", "Mantiene el filtro activo en datos móviles", dataOk, v -> requestUnrestrictedData());
        boxPerms.addView(divider());
        addPermRow(R.drawable.ic_perm_boot, "Arranque automático", "Activa la protección al reiniciar el teléfono", true, null);
    }

    private void addPermRow(int iconRes, String title, String sub, boolean ok, View.OnClickListener onFix) {
        LinearLayout row = new LinearLayout(this);
        row.setOrientation(LinearLayout.HORIZONTAL);
        row.setGravity(Gravity.CENTER_VERTICAL);
        row.setPadding(0, dp(10), 0, dp(10));

        LinearLayout iconWrap = new LinearLayout(this);
        iconWrap.setGravity(Gravity.CENTER);
        iconWrap.setBackground(roundedBg(
                ok ? Color.parseColor("#0D291E") : Color.parseColor("#24111B"),
                ok ? Color.parseColor("#1D6B4B") : Color.parseColor("#5C2032"), 10));
        LinearLayout.LayoutParams wlp = new LinearLayout.LayoutParams(dp(34), dp(34));
        wlp.setMargins(0, 0, dp(10), 0);
        iconWrap.setLayoutParams(wlp);

        ImageView ic = new ImageView(this);
        ic.setImageResource(iconRes);
        ic.setColorFilter(ok ? EMERALD : ROSE, PorterDuff.Mode.SRC_IN);
        ic.setLayoutParams(new LinearLayout.LayoutParams(dp(18), dp(18)));
        iconWrap.addView(ic);
        row.addView(iconWrap);

        LinearLayout mid = new LinearLayout(this);
        mid.setOrientation(LinearLayout.VERTICAL);
        mid.setLayoutParams(new LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f));
        mid.setPadding(0, 0, dp(8), 0);

        TextView t = new TextView(this);
        t.setText(title);
        t.setTextSize(13);
        t.setTypeface(null, Typeface.BOLD);
        t.setTextColor(TEXT_PRIMARY);
        mid.addView(t);

        TextView s = new TextView(this);
        s.setText(sub);
        s.setTextSize(11);
        s.setTextColor(TEXT_MUTED);
        mid.addView(s);
        row.addView(mid);

        TextView action = new TextView(this);
        action.setText(ok ? "Listo" : "Activar");
        action.setTextSize(11);
        action.setTypeface(null, Typeface.BOLD);
        action.setTextColor(ok ? EMERALD : BG_DARK);
        action.setBackground(roundedBg(
                ok ? Color.parseColor("#0D291E") : CYAN,
                ok ? Color.parseColor("#1D6B4B") : CYAN, 999));
        action.setPadding(dp(11), dp(5), dp(11), dp(5));
        if (!ok && onFix != null) action.setOnClickListener(onFix);
        row.addView(action);

        boxPerms.addView(row);
    }

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
            toast("Todos los permisos ya están concedidos");
        }
    }

    private void activateNotificationsFromAndroid() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU
                && checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS)
                != PackageManager.PERMISSION_GRANTED) {
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
                    .setContentTitle("Adblock Gamer Pro v5.4")
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
