#import <Foundation/Foundation.h>
#import <React/RCTBridgeModule.h>
#import <UIKit/UIKit.h>

@interface RCCManager : NSObject

+ (instancetype)sharedInstance;
-(void)registerNavigationController:(UIViewController*)controller controllerId:(NSString*)componentId;
-(void)unregisterNavigationController:(UIViewController*)controller;
-(id)getNavigationControllerWithId:(NSString*)componentId;

-(void)registerController:(UIViewController*)controller controllerId:(NSString*)componentId;
-(id)getControllerWithId:(NSString*)componentId;
-(void)unregisterController:(UIViewController*)vc;

-(void)clearModuleRegistry;


-(void)registerComponent:(NSString*)component class:(Class)cls;
-(Class)getComponent:(NSString*)component;

-(void)registerComponentNavigatorButtons:(NSString*)component navigatorButtons:(NSDictionary*)buttons;
-(NSDictionary*)getComponentNavigatorButtons:(NSString*)component;
@end
