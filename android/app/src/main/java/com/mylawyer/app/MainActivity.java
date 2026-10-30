package com.mylawyer.app;

import android.os.Bundle;
import android.webkit.WebSettings;
import android.webkit.WebView;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        configureWebViewSettings();
    }

    @Override
    public void onStart() {
        super.onStart();
        configureWebViewSettings();
    }

    @Override
    public void onResume() {
        super.onResume();
        configureWebViewSettings();
    }

    private void configureWebViewSettings() {
        if (this.bridge != null && this.bridge.getWebView() != null) {
            WebView webView = this.bridge.getWebView();
            WebSettings settings = webView.getSettings();
            // Allow videos to autoplay immediately without requiring a user gesture
            // and without displaying the default Android media playback icon overlay
            settings.setMediaPlaybackRequiresUserGesture(false);

            // Disable WebView overscroll bounce effect to guarantee solid, bounce-free header & bottom nav
            webView.setOverScrollMode(WebView.OVER_SCROLL_NEVER);
        }
    }
}
