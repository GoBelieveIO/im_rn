package com.app;

import android.os.Bundle;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.ReadableMapKeySetIterator;
//import com.reactnativenavigation.controllers.NavigationCommandsHandler;
//import com.reactnativenavigation.params.TitleBarButtonParams;
//import com.reactnativenavigation.params.TitleBarLeftButtonParams;
//import com.reactnativenavigation.params.parsers.TitleBarButtonParamsParser;
//import com.reactnativenavigation.params.parsers.TitleBarLeftButtonParamsParser;

import java.util.List;

/**
 * The basic abstract components we will expose:
 * BottomTabs (app) - boolean
 * TopBar (per screen)
 * - TitleBar
 * - - RightButtons
 * - - LeftButton
 * - TopTabs (segmented control / view pager tabs)
 * DeviceStatusBar (app) (colors are per screen)
 * AndroidNavigationBar (app) (colors are per screen)
 * SideMenu (app) - boolean, (menu icon is screen-based)
 */
public class NavigationReactModule extends ReactContextBaseJavaModule {
    public static final String NAME = "NavigatorModule";

    public NavigationReactModule(ReactApplicationContext reactContext) {
        super(reactContext);
    }

    @Override
    public String getName() {
        return NAME;
    }


    @ReactMethod
    public void registerNavigatorButtons(String screenId, ReadableMap buttons) {
        ReadableArray leftButtons = buttons.getArray("leftButtons");
        ReadableArray rightButtons = buttons.getArray("rightButtons");

        //Bundle rightButtons = null;
        //if (rightButtonsParams != null) {
            //rightButtons = BundleConverter.toBundle(rightButtonsParams);
        //}
        //Bundle leftButton = null;
        //if (leftButtonParams != null) {
            //leftButton = BundleConverter.toBundle(leftButtonParams);
        //}
        NavigationCommandsHandler.registerNavigatorButtons(screenId, buttons);
    }

    @ReactMethod
    public void push(final String navigatorId, final String screen, final ReadableMap passProps) {
        final Bundle bundle = passPropsToBundle(passProps);
        getReactApplicationContext().runOnUiQueueThread(new Runnable() {
            @Override
            public void run() {
                NavigationCommandsHandler.push(navigatorId, screen, bundle);
            }
        });
    }

    @ReactMethod
    public void pop(final ReadableMap params) {
        getReactApplicationContext().runOnUiQueueThread(new Runnable() {
            @Override
            public void run() {
                NavigationCommandsHandler.pop(getReactApplicationContext().getCurrentActivity());
            }
        });
    }

    @ReactMethod
    public void setTitle(final String screenInstanceId, final String title) {
        getReactApplicationContext().runOnUiQueueThread(new Runnable() {
            @Override
            public void run() {
                NavigationCommandsHandler.setTitle(screenInstanceId, title);
            }
        });
    }

    public static Bundle passPropsToBundle(ReadableMap map) {
        Bundle bundle = new Bundle();
        ReadableMapKeySetIterator it = map.keySetIterator();
        while (it.hasNextKey()) {
            String key = it.nextKey();
            switch (map.getType(key)) {
                case Null:
                    break;
                case Boolean:
                    bundle.putBoolean(key, map.getBoolean(key));
                    break;
                case Number:
                    putNumber(bundle, map, key);
                    break;
                case String:
                    bundle.putString(key, map.getString(key));
                    break;
                default:
                    break;
            }
        }
        return bundle;
    }

    private static void putNumber(Bundle bundle, ReadableMap map, String key) {
        try {
            bundle.putInt(key, map.getInt(key));
        } catch (Exception e) {
            bundle.putDouble(key, map.getDouble(key));
        }
    }


}
