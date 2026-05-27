//
//  ScriptManager.h
//  Stay
//
//  Advanced userscript management with pattern matching and persistent storage
//  Created by GlacierEQ Hyper-Powered Scripts Initiative
//

#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN

/**
 * ScriptManager handles userscript storage, retrieval, and URL pattern matching
 * for the Stay Safari extension. Provides persistent storage via NSUserDefaults
 * and advanced wildcard pattern matching for conditional script injection.
 */
@interface ScriptManager : NSObject

/**
 * Shared singleton instance
 */
+ (instancetype)sharedManager;

/**
 * Load scripts metadata and source code from persistent storage
 */
- (void)loadScripts;

/**
 * Save or update a script persistently
 * @param scriptId Unique identifier for the script
 * @param name Display name of the script
 * @param description Brief description of script functionality
 * @param sourceCode JavaScript source code to execute
 * @param version SemVer version string (e.g., "1.0.0")
 * @param domainPattern URL pattern with wildcards (e.g., "*://*.example.com/*")
 */
- (void)saveScriptWithId:(NSString *)scriptId
                   name:(NSString *)name
            description:(NSString *)description
             sourceCode:(NSString *)sourceCode
                version:(NSString *)version
                 domain:(NSString *)domainPattern;

/**
 * Remove script by ID
 * @param scriptId Unique identifier of script to remove
 */
- (void)removeScriptById:(NSString *)scriptId;

/**
 * Query applicable scripts for URL
 * @param url The URL to match against stored script patterns
 * @return Array of script sourceCode strings that match the URL
 */
- (NSArray<NSString *> *)scriptsForURL:(NSURL *)url;

/**
 * List all stored scripts metadata for debugging and UI display
 * @return Array of dictionaries containing script metadata
 */
- (NSArray<NSDictionary *> *)listAllScriptsMetadata;

/**
 * Clear all stored scripts (useful for reset/debugging)
 */
- (void)clearAllScripts;

/**
 * Export all scripts as JSON string
 * @return JSON string representation of all scripts
 */
- (NSString *)exportScriptsAsJSON;

/**
 * Import scripts from JSON string
 * @param jsonString JSON representation of scripts to import
 * @return YES if successful, NO otherwise
 */
- (BOOL)importScriptsFromJSON:(NSString *)jsonString;

@end

NS_ASSUME_NONNULL_END
