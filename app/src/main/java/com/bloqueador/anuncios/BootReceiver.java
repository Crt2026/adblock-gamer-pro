package com.bloqueador.anuncios;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;

public class BootReceiver extends BroadcastReceiver {
    @Override
    public void onReceive(Context context, Intent intent) {
        SharedPreferences p = context.getSharedPreferences(Blocklist.PREFS, Context.MODE_PRIVATE);
        if (p.getBoolean(Blocklist.KEY_ENABLED, false)) {
            Intent i = new Intent(context, AdBlockVpnService.class);
            i.setAction(AdBlockVpnService.ACTION_START);
            context.startForegroundService(i);
        }
    }
}
