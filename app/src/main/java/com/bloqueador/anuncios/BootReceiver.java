package com.bloqueador.anuncios;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.net.VpnService;
import android.os.Build;

public class BootReceiver extends BroadcastReceiver {
    @Override
    public void onReceive(Context context, Intent intent) {
        SharedPreferences p = context.getSharedPreferences(Blocklist.PREFS, Context.MODE_PRIVATE);
        if (!p.getBoolean(Blocklist.KEY_ENABLED, false)) return;
        if (VpnService.prepare(context) != null) return;

        Intent i = new Intent(context, AdBlockVpnService.class);
        i.setAction(AdBlockVpnService.ACTION_START);
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                context.startForegroundService(i);
            } else {
                context.startService(i);
            }
        } catch (Exception ignored) {
        }
    }
}
