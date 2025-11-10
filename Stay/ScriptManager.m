//
//  ScriptManager.m
//  Stay
//
//  Advanced userscript management implementation
//  Created by GlacierEQ Hyper-Powered Scripts Initiative
//

#import "ScriptManager.h"

@interface ScriptManager ()

@property (nonatomic, strong) NSMutableDictionary<NSString *, NSDictionary *> *scripts;
@property (nonatomic, strong) NSMutableDictionary<NSString *, NSString *> *scriptSources;
@property (nonatomic, strong) NSUserDefaults *storage;

@end

@implementation ScriptManager

#pragma mark - Singleton

+ (instancetype)sharedManager {
    static ScriptManager *sharedInstance = nil;
    static dispatch_once_t onceToken;
    dispatch_once(&onceToken, ^{
        sharedInstance = [[ScriptManager alloc] init];
        [sharedInstance loadScripts];
    });
    return sharedInstance;
}

- (instancetype)init {
    self = [super init];
    if (self) {
        _storage = [NSUserDefaults standardUserDefaults];
        _scripts = [NSMutableDictionary dictionary];
        _scriptSources = [NSMutableDictionary dictionary];
    }
    return self;
}

#pragma mark - Persistence

- (void)loadScripts {
    NSDictionary *savedMetadata = [self.storage dictionaryForKey:@"StayScriptsMetadata"];
    NSDictionary *savedSources = [self.storage dictionaryForKey:@"StayScriptsSources"];
    
    self.scripts = savedMetadata ? [savedMetadata mutableCopy] : [NSMutableDictionary dictionary];
    self.scriptSources = savedSources ? [savedSources mutableCopy] : [NSMutableDictionary dictionary];
    
    NSLog(@"[ScriptManager] Loaded %lu scripts", (unsigned long)self.scripts.count);
}

- (void)saveScriptsToStorage {
    [self.storage setObject:self.scripts forKey:@"StayScriptsMetadata"];
    [self.storage setObject:self.scriptSources forKey:@"StayScriptsSources"];
    [self.storage synchronize];
    
    NSLog(@"[ScriptManager] Saved %lu scripts to storage", (unsigned long)self.scripts.count);
}

#pragma mark - Script Management

- (void)saveScriptWithId:(NSString *)scriptId
                   name:(NSString *)name
            description:(NSString *)description
             sourceCode:(NSString *)sourceCode
                version:(NSString *)version
                 domain:(NSString *)domainPattern {
    
    NSDictionary *metadata = @{
        @"id": scriptId,
        @"name": name,
        @"description": description,
        @"version": version,
        @"domain": domainPattern,
        @"updatedAt": [NSDate date]
    };
    
    self.scripts[scriptId] = metadata;
    self.scriptSources[scriptId] = sourceCode;
    [self saveScriptsToStorage];
    
    NSLog(@"[ScriptManager] Saved script: %@ (v%@)", name, version);
}

- (void)removeScriptById:(NSString *)scriptId {
    NSString *scriptName = self.scripts[scriptId][@"name"];
    
    [self.scripts removeObjectForKey:scriptId];
    [self.scriptSources removeObjectForKey:scriptId];
    [self saveScriptsToStorage];
    
    NSLog(@"[ScriptManager] Removed script: %@", scriptName ?: scriptId);
}

- (void)clearAllScripts {
    [self.scripts removeAllObjects];
    [self.scriptSources removeAllObjects];
    [self saveScriptsToStorage];
    
    NSLog(@"[ScriptManager] Cleared all scripts");
}

#pragma mark - URL Matching

- (NSArray<NSString *> *)scriptsForURL:(NSURL *)url {
    NSMutableArray<NSString *> *matchingScripts = [NSMutableArray array];
    NSString *urlString = url.absoluteString.lowercaseString;
    
    [self.scripts enumerateKeysAndObjectsUsingBlock:^(NSString * _Nonnull key, NSDictionary * _Nonnull obj, BOOL * _Nonnull stop) {
        NSString *pattern = obj[@"domain"];
        if ([self url:urlString matchesPattern:pattern]) {
            NSString *src = self.scriptSources[key];
            if (src) {
                [matchingScripts addObject:src];
                NSLog(@"[ScriptManager] Script '%@' matches URL: %@", obj[@"name"], url);
            }
        }
    }];
    
    return matchingScripts;
}

- (BOOL)url:(NSString *)urlString matchesPattern:(NSString *)pattern {
    // Convert wildcard pattern to regex
    // Support: *://*.example.com/* format
    NSString *regexPattern = [NSRegularExpression escapedPatternForString:pattern];
    regexPattern = [regexPattern stringByReplacingOccurrencesOfString:@"\\*" withString:@".*"];
    
    NSError *error = nil;
    NSRegularExpression *regex = [NSRegularExpression regularExpressionWithPattern:regexPattern
                                                                           options:NSRegularExpressionCaseInsensitive
                                                                             error:&error];
    if (error) {
        NSLog(@"[ScriptManager] Regex error: %@", error.localizedDescription);
        return NO;
    }
    
    NSRange range = NSMakeRange(0, urlString.length);
    NSUInteger matches = [regex numberOfMatchesInString:urlString options:0 range:range];
    return matches > 0;
}

#pragma mark - Metadata Access

- (NSArray<NSDictionary *> *)listAllScriptsMetadata {
    return [self.scripts allValues];
}

#pragma mark - Import/Export

- (NSString *)exportScriptsAsJSON {
    NSDictionary *exportData = @{
        @"metadata": self.scripts,
        @"sources": self.scriptSources,
        @"exportDate": [NSDate date],
        @"version": @"1.0"
    };
    
    NSError *error = nil;
    NSData *jsonData = [NSJSONSerialization dataWithJSONObject:exportData
                                                       options:NSJSONWritingPrettyPrinted
                                                         error:&error];
    if (error) {
        NSLog(@"[ScriptManager] Export error: %@", error.localizedDescription);
        return nil;
    }
    
    return [[NSString alloc] initWithData:jsonData encoding:NSUTF8StringEncoding];
}

- (BOOL)importScriptsFromJSON:(NSString *)jsonString {
    NSData *jsonData = [jsonString dataUsingEncoding:NSUTF8StringEncoding];
    NSError *error = nil;
    
    NSDictionary *importData = [NSJSONSerialization JSONObjectWithData:jsonData
                                                              options:0
                                                                error:&error];
    if (error) {
        NSLog(@"[ScriptManager] Import error: %@", error.localizedDescription);
        return NO;
    }
    
    NSDictionary *metadata = importData[@"metadata"];
    NSDictionary *sources = importData[@"sources"];
    
    if (metadata && sources) {
        self.scripts = [metadata mutableCopy];
        self.scriptSources = [sources mutableCopy];
        [self saveScriptsToStorage];
        
        NSLog(@"[ScriptManager] Imported %lu scripts", (unsigned long)self.scripts.count);
        return YES;
    }
    
    return NO;
}

@end
