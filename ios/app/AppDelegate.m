/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "AppDelegate.h"

#import <React/RCTBridge.h>
#import <React/RCTBundleURLProvider.h>
#import <React/RCTRootView.h>
#import <React/RCTDevLoadingView.h>
#import "RCCManager.h"
#import "RCCViewController.h"
#import "NavigatorModule.h"

#ifdef FB_SONARKIT_ENABLED
#import <FlipperKit/FlipperClient.h>
#import <FlipperKitLayoutPlugin/FlipperKitLayoutPlugin.h>
#import <FlipperKitUserDefaultsPlugin/FKUserDefaultsPlugin.h>
#import <FlipperKitNetworkPlugin/FlipperKitNetworkPlugin.h>
#import <SKIOSNetworkPlugin/SKIOSNetworkAdapter.h>
#import <FlipperKitReactPlugin/FlipperKitReactPlugin.h>

static void InitializeFlipper(UIApplication *application) {
    FlipperClient *client = [FlipperClient sharedClient];
    SKDescriptorMapper *layoutDescriptorMapper = [[SKDescriptorMapper alloc] initWithDefaults];
    [client addPlugin:[[FlipperKitLayoutPlugin alloc] initWithRootNode:application withDescriptorMapper:layoutDescriptorMapper]];
    [client addPlugin:[[FKUserDefaultsPlugin alloc] initWithSuiteName:nil]];
    [client addPlugin:[FlipperKitReactPlugin new]];
    [client addPlugin:[[FlipperKitNetworkPlugin alloc] initWithNetworkAdapter:[SKIOSNetworkAdapter new]]];
    [client start];
}
#endif

@implementation AppDelegate

- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions
{
  #ifdef FB_SONARKIT_ENABLED
    InitializeFlipper(application);
  #endif

    RCTBridge *bridge = [[RCTBridge alloc] initWithDelegate:self launchOptions:launchOptions];
    
  #if RCT_DEV
    //warning: RCTBridge required dispatch_sync to load RCTDevLoadingView. This may lead to deadlocks
    [bridge moduleForClass:[RCTDevLoadingView class]];
  #endif
    
    self.bridge = bridge;

    NSString *navId = [RCCViewController uniqueId:nil];

#if 0
    RCTRootView *rootView = [[RCTRootView alloc] initWithBridge:bridge
                                                     moduleName:@"app"
                                              initialProperties:nil];

    if (@available(iOS 13.0, *)) {
        rootView.backgroundColor = [UIColor systemBackgroundColor];
    } else {
        rootView.backgroundColor = [UIColor whiteColor];
    }
 
    UIViewController *rootViewController = [UIViewController new];
    rootViewController.view = rootView;
    
#else
    NavigatorModule *navigatorModule = [bridge moduleForClass:[NavigatorModule class]];
    RCCViewController *rootViewController = [[RCCViewController alloc] initWithComponent:@"app" navigatorId:navId passProps:@{} bridge:bridge eventEmitter:navigatorModule];
#endif
    
    UINavigationController *nav = [[UINavigationController alloc] initWithRootViewController:rootViewController];
    nav.navigationBar.translucent = NO;
    
    [[RCCManager sharedInstance] registerNavigationController:nav controllerId:navId];
    
    self.window = [[UIWindow alloc] initWithFrame:[UIScreen mainScreen].bounds];
    self.window.rootViewController = nav;
    [self.window makeKeyAndVisible];
    return YES;
}

- (NSURL *)sourceURLForBridge:(RCTBridge *)bridge
{
  #if DEBUG
    return [[RCTBundleURLProvider sharedSettings] jsBundleURLForBundleRoot:@"index" fallbackResource:nil];
  #else
    return [[NSBundle mainBundle] URLForResource:@"main" withExtension:@"jsbundle"];
  #endif
}

@end
