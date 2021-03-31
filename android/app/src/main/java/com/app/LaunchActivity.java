package com.app;

import androidx.appcompat.app.AppCompatActivity;

import android.content.Intent;
import android.os.Bundle;

public class LaunchActivity extends AppCompatActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        finish();

        Intent intent = new Intent(this, NavigationActivity.class);
        String navId = NavigationActivity.uniqueId(null);
        intent.putExtra("navigatorId", navId);
        intent.putExtra("component", "app");
        intent.putExtra("back", false);
        startActivity(intent);
    }
}