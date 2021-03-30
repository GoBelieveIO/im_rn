#import <UIKit/UIKit.h>
#import <React/RCTBridge.h>
#import <React/RCTEventEmitter.h>


@protocol RCCViewControllerDelegate <NSObject>
-(void)onResult:(NSDictionary*)result;
@end

@interface RCCViewController : UIViewController

+(NSString*)uniqueId:(NSString*)prefix;

@property (nonatomic, weak) id<RCCViewControllerDelegate> delegate;

- (instancetype)initWithComponent:(NSString *)component
                      navigatorId:(NSString*)navigatorId
                        passProps:(NSDictionary *)passProps
                           bridge:(RCTBridge *)bridge
                     eventEmitter:(RCTEventEmitter*)emitter;

@end


