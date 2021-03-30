#import "RCCViewController.h"
//#import "RCCNavigationController.h"
#import <React/RCTRootView.h>
#import <React/RCTConvert.h>
#import <React/RCTBridge.h>
#import <React/RCTEventDispatcher.h>
#import <objc/runtime.h>
#import "RCCManager.h"

NSString const *CALLBACK_ASSOCIATED_ID = @"RCCNavigationController.CALLBACK_ASSOCIATED_ID";

static volatile int64_t _id = 0;

@interface RCCViewController()

@property(nonatomic) RCTEventEmitter *emitter;
@property(nonatomic) NSDictionary *props;
@property(nonatomic) RCTBridge *bridge;

@property(nonatomic, copy) NSString *component;

@property(nonatomic, copy) NSString *componentId;

@property(nonatomic, copy) NSString *navigatorId;

@property(nonatomic) NSArray *leftButtons;
@property(nonatomic) NSArray *rightButtons;
@property(nonatomic, copy) NSString *barTitle;

@end

@implementation RCCViewController

+(NSString*)uniqueId:(NSString*)prefix {
    //todo atomic int
    @synchronized(self) {
        int64_t newId = ++_id;
        return [NSString stringWithFormat:@"%@%lld", prefix ? prefix : @"", newId];
    }
}

- (instancetype)initWithComponent:(NSString *)component
                      navigatorId:(NSString*)navigatorId
                        passProps:(NSDictionary *)passProps
                           bridge:(RCTBridge *)bridge
                     eventEmitter:(RCTEventEmitter*)emitter {
    self = [super init];
    if (self) {
        if (passProps) {
            self.props = [NSDictionary dictionaryWithDictionary:passProps];
        } else {
            self.props = @{};
        }
        self.bridge = bridge;
        self.emitter = emitter;
        self.component = component;
        self.componentId = [[self class] uniqueId:nil];
        self.navigatorId = navigatorId;
        
        [[RCCManager sharedInstance] registerController:self controllerId:self.componentId];
    }
    return self;
}

- (void)dealloc {
    self.view = nil;
    if (self.componentId.length > 0) {
        [[RCCManager sharedInstance] unregisterController:self];
    }
}


- (void)loadView {
    NSMutableDictionary *props = [NSMutableDictionary dictionaryWithDictionary:self.props];
    if (self.navigatorId.length > 0) {
        [props setObject:self.navigatorId forKey:@"navigatorId"];
    }
    [props setObject:self.componentId forKey:@"screenInstanceId"];
    
    RCTRootView *reactView = [[RCTRootView alloc] initWithBridge:self.bridge moduleName:self.component initialProperties:props];
    self.view = reactView;
}

- (void)viewDidLoad {
    [super viewDidLoad];
    
    NSDictionary *navigatorButtons = [[RCCManager sharedInstance] getComponentNavigatorButtons:self.component];
    
    NSArray *leftButtons = [navigatorButtons objectForKey:@"leftButtons"];
    NSArray *rightButtons = [navigatorButtons objectForKey:@"rightButtons"];
    
    [self setButtons:leftButtons side:@"left"];
    [self setButtons:rightButtons side:@"right"];
    
    if (@available(iOS 13.0,*)) {
        self.view.backgroundColor = [UIColor systemBackgroundColor];
    }
    self.edgesForExtendedLayout = UIRectEdgeNone; // default
    self.automaticallyAdjustsScrollViewInsets = NO; // default
}

-(void)onButtonPress:(UIBarButtonItem*)barButtonItem {
    NSString *buttonId = objc_getAssociatedObject(barButtonItem, &CALLBACK_ASSOCIATED_ID);
  
    if (!buttonId) {
        return;
    }
    
    NSDictionary *body = @{
        @"screenInstanceId":self.componentId,
        @"buttonId": buttonId ? buttonId : [NSNull null]
    };

    [self.emitter sendEventWithName:@"NavBarButtonPress" body:body];
}


-(void)setButtons:(NSArray*)buttons side:(NSString*)side {
    NSMutableArray *barButtonItems = [NSMutableArray new];
    for (NSDictionary *button in buttons) {
        NSString *title = button[@"title"];
        UIImage *iconImage = nil;
        id icon = button[@"icon"];
        if (icon) iconImage = [RCTConvert UIImage:icon];
        
        UIBarButtonItem *barButtonItem;
        if (iconImage) {
            barButtonItem = [[UIBarButtonItem alloc] initWithImage:iconImage style:UIBarButtonItemStylePlain target:self action:@selector(onButtonPress:)];
        } else if (title) {
            barButtonItem = [[UIBarButtonItem alloc] initWithTitle:title style:UIBarButtonItemStylePlain target:self action:@selector(onButtonPress:)];
        } else continue;
        
        NSString *buttonId = button[@"id"];
        if (!buttonId) {
            continue;
        }
        objc_setAssociatedObject(barButtonItem, &CALLBACK_ASSOCIATED_ID, buttonId, OBJC_ASSOCIATION_RETAIN_NONATOMIC);
        
        NSNumber *disabled = button[@"disabled"];
        BOOL disabledBool = disabled ? [disabled boolValue] : NO;
        if (disabledBool) {
            [barButtonItem setEnabled:NO];
        }
        
        NSNumber *disableIconTintString = button[@"disableIconTint"];
        BOOL disableIconTint = disableIconTintString ? [disableIconTintString boolValue] : NO;
        if (disableIconTint) {
            [barButtonItem setImage:[barButtonItem.image imageWithRenderingMode:UIImageRenderingModeAlwaysOriginal]];
        }
        
        [barButtonItems addObject:barButtonItem];
    }
    
    if ([side isEqualToString:@"left"]) {
      self.navigationItem.leftBarButtonItems = barButtonItems;
    } else if ([side isEqualToString:@"right"]) {
      self.navigationItem.rightBarButtonItems = barButtonItems;
    }
}

@end

