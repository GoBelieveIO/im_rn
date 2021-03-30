#import "RCCManager.h"
#import <React/RCTBridge.h>
#import <React/RCTRedBox.h>
#import <Foundation/Foundation.h>

//componentType
#define NavigationController @"NavigationControllerIOS"
#define ViewController @"ViewControllerIOS"

@interface RCCManager()
@property (nonatomic, strong) NSMutableDictionary *modulesRegistry;
@property (nonatomic, strong) RCTBridge *sharedBridge;
@property (nonatomic, strong) NSMutableDictionary *components;
@property (nonatomic, strong) NSMutableDictionary *componensNavigatorButton;
@end

@implementation RCCManager

+ (instancetype)sharedInstance {
    static RCCManager *sharedInstance = nil;
    static dispatch_once_t onceToken = 0;
    
    dispatch_once(&onceToken,^{
        if (sharedInstance == nil)
        {
            sharedInstance = [[RCCManager alloc] init];
        }
    });
    
    return sharedInstance;
}


- (instancetype)init {
    self = [super init];
    if (self) {
        self.modulesRegistry = [NSMutableDictionary dictionary];
        self.components = [NSMutableDictionary dictionary];
        self.componensNavigatorButton = [NSMutableDictionary dictionary];
    }
    return self;
}

-(void)registerComponent:(NSString*)component class:(Class)cls {
    [self.components setObject:cls forKey:component];
}

-(Class)getComponent:(NSString*)component {
    return [self.components objectForKey:component];
}

-(void)registerComponentNavigatorButtons:(NSString*)component navigatorButtons:(NSDictionary*)buttons {
    [self.componensNavigatorButton setObject:buttons forKey:component];
}

-(NSDictionary*)getComponentNavigatorButtons:(NSString*)component {
    return [self.componensNavigatorButton objectForKey:component];
}


-(void)clearModuleRegistry {
    [self.modulesRegistry removeAllObjects];
}

-(void)registerNavigationController:(UIViewController*)controller controllerId:(NSString*)componentId {
  [self _registerController:controller controllerId:componentId componentType:NavigationController];
}

-(void)unregisterNavigationController:(UIViewController*)controller {
  [self unregisterController:controller];
}

-(id)getNavigationControllerWithId:(NSString*)componentId {
  return [self _getControllerWithId:componentId componentType:NavigationController];
}

-(void)registerController:(UIViewController*)controller controllerId:(NSString*)componentId {
  [self _registerController:controller controllerId:componentId componentType:ViewController];
}

-(void)unregisterController:(UIViewController*)vc {
    if (vc == nil) return;
    
    for (NSString *key in [self.modulesRegistry allKeys])
    {
        NSMutableDictionary *componentsDic = self.modulesRegistry[key];
        for (NSString *componentID in [componentsDic allKeys])
        {
            NSValue *value = componentsDic[componentID];
            if ([value nonretainedObjectValue] == vc) {
                [componentsDic removeObjectForKey:componentID];
            }
        }
    }
}

-(id)getControllerWithId:(NSString*)componentId {
  return [self _getControllerWithId:componentId componentType:ViewController];
}


-(void)_registerController:(UIViewController*)controller
              controllerId:(NSString*)componentId
             componentType:(NSString*)componentType {
    if (controller == nil || componentId == nil) {
        return;
    }
    

    NSMutableDictionary *componentsDic = self.modulesRegistry[componentType];
    if (componentsDic == nil) {
        componentsDic = [NSMutableDictionary dictionary];
        self.modulesRegistry[componentType] = componentsDic;
    }
    
    NSValue *value = [NSValue valueWithNonretainedObject:controller];
    componentsDic[componentId] = value;
}

-(id)_getControllerWithId:(NSString*)componentId componentType:(NSString*)componentType
{
    if (componentId == nil)
    {
        return nil;
    }
    
    id component = nil;
    
    NSMutableDictionary *componentsDic = self.modulesRegistry[componentType];
    if (componentsDic != nil)
    {
        component = componentsDic[componentId];
    }
    
    return [component nonretainedObjectValue];
}




@end
