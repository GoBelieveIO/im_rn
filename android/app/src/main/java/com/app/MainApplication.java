package com.app;

import android.app.Application;
import android.support.annotation.NonNull;
import android.util.Log;

import com.facebook.react.ReactApplication;
import com.airbnb.android.react.maps.MapsPackage;
import com.rnfs.RNFSPackage;
import com.zmxv.RNSound.RNSoundPackage;
import com.remobile.toast.RCTToastPackage;
import com.rnim.rn.audio.ReactNativeAudioPackage;
import com.imagepicker.ImagePickerPackage;

import com.facebook.react.ReactPackage;
import com.facebook.react.shell.MainReactPackage;
import com.reactnativenavigation.NavigationApplication;

import org.pgsqlite.SQLitePluginPackage;

import java.util.Arrays;
import java.util.List;

public class MainApplication extends NavigationApplication {

  @Override
  public boolean isDebug() {
    // Make sure you are using BuildConfig from your own application
    return BuildConfig.DEBUG;
  }

  @NonNull
  @Override
  public List<ReactPackage> createAdditionalReactPackages() {
    // Add the packages you require here.
    // No need to add RnnPackage and MainReactPackage
    return Arrays.<ReactPackage>asList(
            new MapsPackage(),
            new RNFSPackage(),
            new RNSoundPackage(),
            new RCTToastPackage(),
            new ReactNativeAudioPackage(),
            new ImagePickerPackage(),
            new SQLitePluginPackage()
    );
  }
}
