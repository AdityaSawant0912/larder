package dev.adityasawant.larder;

import android.content.Context;
import android.content.SharedPreferences;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

// Debug-only escape hatch from capacitor.config.ts's baked-in server.url
// (docs/04-architecture.md: "the app shell has no logic of its own" — this
// is the one deliberate exception). No gate here: the web UI only exposes
// this to one debug account, and a Capacitor plugin isn't a public API
// surface a random installed app could reach.
@CapacitorPlugin(name = "DebugServer")
public class DebugServerPlugin extends Plugin {
    private static final String PREFS = "debug_server";
    private static final String KEY_URL = "override_url";

    @Override
    public void load() {
        String saved = prefs().getString(KEY_URL, null);
        if (saved != null && !saved.isEmpty()) {
            getBridge().getWebView().post(() -> getBridge().getWebView().loadUrl(saved));
        }
    }

    @PluginMethod
    public void getServerUrl(PluginCall call) {
        JSObject ret = new JSObject();
        ret.put("url", prefs().getString(KEY_URL, ""));
        call.resolve(ret);
    }

    @PluginMethod
    public void setServerUrl(PluginCall call) {
        String url = call.getString("url");
        if (url == null || url.isEmpty()) {
            call.reject("url is required");
            return;
        }
        prefs().edit().putString(KEY_URL, url).apply();
        getBridge().getWebView().loadUrl(url);
        call.resolve();
    }

    private SharedPreferences prefs() {
        return getContext().getSharedPreferences(PREFS, Context.MODE_PRIVATE);
    }
}
