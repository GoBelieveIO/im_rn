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
#import "RCCManager.h"
#import "RCCViewController.h"

@implementation NavigatorModule
RCT_EXPORT_MODULE();

+(BOOL)requiresMainQueueSetup {
    return YES;
}

- (NSArray<NSString *> *)supportedEvents {
  return @[@"NavBarButtonPress"];
}

- (dispatch_queue_t)methodQueue {
    return dispatch_get_main_queue();
}

RCT_EXPORT_METHOD(registerNavigatorButtons:(nonnull NSString*)component navigatorButtons:(NSDictionary*)buttons) {
    NSLog(@"registerNavigatorButtons:%@, %@", component, buttons);
    [[RCCManager sharedInstance] registerComponentNavigatorButtons:component navigatorButtons:buttons];
}

RCT_EXPORT_METHOD(push:(nonnull NSString*)navigatorId screen:(nonnull NSString*)screen props:(NSDictionary*)passProps) {
    UINavigationController *nav = [[RCCManager sharedInstance] getNavigationControllerWithId:navigatorId];

    RCCViewController *viewController = [[RCCViewController alloc] initWithComponent:screen
                                                                             navigatorId:navigatorId
                                                                               passProps:passProps
                                                                                  bridge:self.bridge
                                                                            eventEmitter:self];
    [nav pushViewController:viewController animated:YES];
}

RCT_EXPORT_METHOD(pop) {
    UINavigationController *nav = (UINavigationController*)(RCTKeyWindow().rootViewController);
    [nav popViewControllerAnimated:YES];
}

RCT_EXPORT_METHOD(setTitle:(NSString*)screenInstanceId title:(nonnull NSString*)title) {
    UIViewController *controller = [[RCCManager sharedInstance] getControllerWithId:screenInstanceId];
    controller.navigationItem.title = title;
}
@end
