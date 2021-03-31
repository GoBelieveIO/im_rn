package com.app;


import android.annotation.TargetApi;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import androidx.annotation.Nullable;
import androidx.appcompat.app.ActionBar;
import androidx.appcompat.app.AppCompatActivity;

import android.provider.Settings;
import android.text.TextUtils;
import android.util.Log;
import android.view.KeyEvent;
import android.view.Menu;
import android.view.MenuItem;

import com.facebook.react.ReactApplication;
import com.facebook.react.ReactDelegate;
import com.facebook.react.ReactNativeHost;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.Callback;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.modules.core.DefaultHardwareBackBtnHandler;
import com.facebook.react.modules.core.DeviceEventManagerModule;
import com.facebook.react.modules.core.PermissionAwareActivity;
import com.facebook.react.modules.core.PermissionListener;


public class NavigationActivity extends AppCompatActivity implements DefaultHardwareBackBtnHandler,
        PermissionAwareActivity {

    private final static int OVERLAY_PERMISSION_REQ_CODE = 1;
    private final static String TAG = "react-native-navigation";
    public static long _id = 0;


    public static String uniqueId(String prefix) {
        synchronized (NavigationActivity.class) {
            long newId = ++_id;
            return String.format("%s%d", (prefix != null ? prefix : ""), newId);
        }
    }

    boolean mBackButtonEnabled;
    String mNavigatorId;
    String mScreenInstanceId;
    String mMainComponentName;

    private ReactDelegate mReactDelegate;

    @Nullable protected PermissionListener mPermissionListener;
    private @Nullable Callback mPermissionsCallback;


    public void setTitle(String title) {
        ActionBar actionBar = getSupportActionBar();
        if (actionBar != null) {
            actionBar.setTitle(title);
        }
    }

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        Intent intent = getIntent();
        mBackButtonEnabled = intent.getBooleanExtra("back", true);

        String component = intent.getStringExtra("component");
        if (TextUtils.isEmpty(component)) {
            Log.e(TAG, "empty component");
            return;
        }

        String navigatorId = intent.getStringExtra("navigatorId");
        Bundle props = intent.getBundleExtra(NavigationCommandsHandler.ACTIVITY_PARAMS_BUNDLE);
        if (props == null) {
            props = new Bundle();
        }

        mMainComponentName = component;
        mNavigatorId = navigatorId != null ? navigatorId : "";
        mScreenInstanceId = uniqueId(null);

        props.putString("navigatorId", mNavigatorId);
        props.putString("screenInstanceId", mScreenInstanceId);


//todo check if neccesary
//        if (shouldAskPermission()) {
//            askPermission();
//        }


        Bundle launchOptions = props;
        mReactDelegate = new ReactDelegate(
                        this, getReactNativeHost(), mMainComponentName, launchOptions);

        mReactDelegate.loadApp();
        setContentView(mReactDelegate.getReactRootView());

        if (!TextUtils.isEmpty(mNavigatorId)) {
            NavigationCommandsHandler.registerNavigationActivity(this, mNavigatorId);
        }
        NavigationCommandsHandler.registerActivity(this, mScreenInstanceId);
    }

    @Override
    public boolean onCreateOptionsMenu(Menu menu) {
        ReadableMap buttons = NavigationCommandsHandler.getNavigatorButtons(mMainComponentName);
        if (buttons != null) {
            ReadableArray rightButtons = buttons.getArray("rightButtons");
            if (rightButtons != null) {
                for (int i = 0; i < rightButtons.size(); i++) {
                    ReadableMap button = rightButtons.getMap(i);
                    String title = button.getString("title");
                    String buttonId = button.getString("id");
                    String showAsAction = button.getString("showAsAction");
                    if (!TextUtils.isEmpty(buttonId)) {
                        MenuItem item = menu.add(Menu.NONE, Menu.NONE, i, title);
                        if ("ifRoom".equals(showAsAction)) {
                            item.setShowAsAction(MenuItem.SHOW_AS_ACTION_IF_ROOM);
                        } else if ("always".equals(showAsAction)) {
                            item.setShowAsAction(MenuItem.SHOW_AS_ACTION_ALWAYS);
                        }
                    }
                }
            }
        }
        return true;
    }

    @Override
    public boolean onOptionsItemSelected(MenuItem item) {
        Log.i(TAG, "menu item:" + item.getItemId() + " order:" + item.getOrder());
        if (item.getItemId() == android.R.id.home) {
            if (mBackButtonEnabled) {
                onBackPressed();
                return true;
            }
            return super.onOptionsItemSelected(item);
        } else if (item.getItemId() == Menu.NONE) {
            int order = item.getOrder();
            ReadableMap buttons = NavigationCommandsHandler.getNavigatorButtons(mMainComponentName);
            if (buttons != null) {
                ReadableArray rightButtons = buttons.getArray("rightButtons");
                if (order < rightButtons.size()) {
                    ReadableMap button = rightButtons.getMap(order);
                    String buttonId = button.getString("id");
                    WritableMap map = Arguments.createMap();
                    map.putString("screenInstanceId", mScreenInstanceId);
                    map.putString("buttonId", buttonId);
                    ReactContext reactContext = getReactNativeHost().getReactInstanceManager().getCurrentReactContext();
                    this.sendEvent(reactContext, "NavBarButtonPress", map);
                }
            }
            return true;
        }
        return super.onOptionsItemSelected(item);
    }

    private void sendEvent(ReactContext reactContext,
                           String eventName,
                           @Nullable WritableMap params) {
        reactContext
                .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                .emit(eventName, params);
    }


    protected boolean shouldAskPermission() {
        if (BuildConfig.DEBUG) {
            return Build.VERSION.SDK_INT >= Build.VERSION_CODES.M &&
                    !Settings.canDrawOverlays(this);
        } else {
            return false;
        }
    }


    @TargetApi(23)
    protected void askPermission() {
        if (shouldAskPermission()) {
            Intent intent = new Intent(Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
                    Uri.parse("package:" + getPackageName()));
            startActivityForResult(intent, OVERLAY_PERMISSION_REQ_CODE);
        }
    }



    protected ReactNativeHost getReactNativeHost() {
        return ((ReactApplication) getApplication()).getReactNativeHost();
    }


    @Override
    protected void onResume() {
        super.onResume();
        mReactDelegate.onHostResume();

        if (mPermissionsCallback != null) {
            mPermissionsCallback.invoke();
            mPermissionsCallback = null;
        }

        ActionBar actionBar = getSupportActionBar();
        if (actionBar != null) {
            if (mBackButtonEnabled) {
                actionBar.setDisplayHomeAsUpEnabled(true);
            } else {
                actionBar.setDisplayHomeAsUpEnabled(false);
            }
            actionBar.show();
        }
    }

    @Override
    protected void onPause() {
        super.onPause();
        mReactDelegate.onHostPause();
    }

    @Override
    protected void onDestroy() {
        super.onDestroy();
        if (!TextUtils.isEmpty(mNavigatorId)) {
            NavigationCommandsHandler.unregisterNavigationActivity(this, mNavigatorId);
        }
        NavigationCommandsHandler.unregisterActivity(mScreenInstanceId);
        mReactDelegate.onHostDestroy();
    }


    @Override
    public void invokeDefaultOnBackPressed() {
        super.onBackPressed();
    }

    @Override
    public void onBackPressed() {
        if (!mReactDelegate.onBackPressed()) {
            super.onBackPressed();
        }
    }

    @Override
    public void onNewIntent(Intent intent) {
        if (getReactNativeHost().hasInstance()) {
            getReactNativeHost().getReactInstanceManager().onNewIntent(intent);
            return;
        }
        super.onNewIntent(intent);
    }


    @Override
    public void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);

        if (requestCode == OVERLAY_PERMISSION_REQ_CODE) {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                if (!Settings.canDrawOverlays(this)) {
                    // SYSTEM_ALERT_WINDOW permission not granted
                    Log.i(TAG, "SYSTEM_ALERT_WINDOW permission not granted");
                }
            }
        }
        getReactNativeHost()
                .getReactInstanceManager()
                .onActivityResult(this, requestCode, resultCode, data);
    }

    @Override
    public boolean onKeyDown(int keyCode, KeyEvent event) {
        if (getReactNativeHost().hasInstance()
                && getReactNativeHost().getUseDeveloperSupport()
                && keyCode == KeyEvent.KEYCODE_MEDIA_FAST_FORWARD) {
            event.startTracking();
            return true;
        }

        return super.onKeyDown(keyCode, event);
    }

    @Override
    public boolean onKeyUp(int keyCode, KeyEvent event) {
        if (mReactDelegate.shouldShowDevMenuOrReload(keyCode, event)) {
           return true;
        }
        return super.onKeyUp(keyCode, event);
    }

    @Override
    public boolean onKeyLongPress(int keyCode, KeyEvent event) {
        if (getReactNativeHost().hasInstance()
                && getReactNativeHost().getUseDeveloperSupport()
                && keyCode == KeyEvent.KEYCODE_MEDIA_FAST_FORWARD) {
            getReactNativeHost().getReactInstanceManager().showDevOptionsDialog();
            return true;
        }

        return super.onKeyLongPress(keyCode, event);
    }

    @TargetApi(Build.VERSION_CODES.M)
    public void requestPermissions(String[] permissions, int requestCode, PermissionListener listener) {
        mPermissionListener = listener;
        requestPermissions(permissions, requestCode);
    }

    public void onRequestPermissionsResult(final int requestCode, final String[] permissions, final int[] grantResults) {
        mPermissionsCallback =
                new Callback() {
                    @Override
                    public void invoke(Object... args) {
                        if (mPermissionListener != null
                                && mPermissionListener.onRequestPermissionsResult(
                                requestCode, permissions, grantResults)) {
                            mPermissionListener = null;
                        }
                    }
                };
    }
}
