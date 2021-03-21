//
//  NavigatorModule.m
//  app
//
//  Created by houxh on 2021/3/20.
//  Copyright © 2021 Facebook. All rights reserved.
//

#import "NavigatorModule.h"
#import <React/RCTUtils.h>
#import <React/RCTRootView.h>
#import "AppDelegate.h"

@implementation NavigatorModule
RCT_EXPORT_MODULE();
- (dispatch_queue_t)methodQueue {
    return dispatch_get_main_queue();
}

RCT_EXPORT_METHOD(push:(nonnull NSString*)screen notice:(NSDictionary*)passProps) {
  UINavigationController *nav = (UINavigationController*)(RCTKeyWindow().rootViewController);
  
  AppDelegate *app = (AppDelegate*)(RCTSharedApplication().delegate);
  
  RCTRootView *rootView = [[RCTRootView alloc] initWithBridge:app.bridge
                                                   moduleName:screen
                                            initialProperties:passProps];

  if (@available(iOS 13.0, *)) {
      rootView.backgroundColor = [UIColor systemBackgroundColor];
  } else {
      rootView.backgroundColor = [UIColor whiteColor];
  }


  UIViewController *rootViewController = [UIViewController new];
  rootViewController.view = rootView;
  
  [nav pushViewController:rootViewController animated:YES];

}

RCT_EXPORT_METHOD(pop) {
  UINavigationController *nav = (UINavigationController*)(RCTKeyWindow().rootViewController);
  [nav popViewControllerAnimated:YES];
}

RCT_EXPORT_METHOD(setTitle:(nonnull NSString*)title) {
  UINavigationController *nav = (UINavigationController*)(RCTKeyWindow().rootViewController);
  if (nav.viewControllers.count) {
    UIViewController *ctrl = nav.viewControllers.lastObject;
    ctrl.navigationItem.title = title;
  }
}
@end
