#import <React/RCTEventEmitter.h>
#import <React/RCTBridgeModule.h>
#import <UIKit/UIKit.h>

@interface ScreenshotDetector : RCTEventEmitter <RCTBridgeModule>
@end

@implementation ScreenshotDetector
{
  bool _hasListeners;
}

RCT_EXPORT_MODULE();

- (NSArray<NSString *> *)supportedEvents {
  return @[@"onScreenshot"];
}

- (void)startObserving {
  _hasListeners = YES;
  [[NSNotificationCenter defaultCenter] addObserver:self
                                           selector:@selector(handleScreenshot:)
                                               name:UIApplicationUserDidTakeScreenshotNotification
                                             object:nil];
}

- (void)stopObserving {
  _hasListeners = NO;
  [[NSNotificationCenter defaultCenter] removeObserver:self
                                                  name:UIApplicationUserDidTakeScreenshotNotification
                                                object:nil];
}

- (void)handleScreenshot:(NSNotification *)notification {
  if (_hasListeners) {
    [self sendEventWithName:@"onScreenshot" body:@{}];
  }
}

+ (BOOL)requiresMainQueueSetup {
  return NO;
}

@end
