# Stay Userscript Authoring Guide

**Version:** 1.0.0  
**Last Updated:** November 9, 2025  
**Author:** GlacierEQ Community

---

## Welcome to Stay Userscript Development!

Stay is a powerful local iOS Safari extension that brings userscript management to iOS/iPadOS with full Greasemonkey API compatibility. This guide covers everything you need to create, test, and deploy powerful userscripts.

---

## Table of Contents

1. [Getting Started](#getting-started)
2. [Metadata Directives](#metadata-directives)
3. [Stay API Reference](#stay-api-reference)
4. [Common Patterns](#common-patterns)
5. [Development Workflow](#development-workflow)
6. [Best Practices](#best-practices)
7. [Debugging](#debugging)
8. [Publishing](#publishing)
9. [Examples](#examples)

---

## Getting Started

### Basic Script Structure

```javascript
// ==UserScript==
// @name         My First Stay Script
// @namespace    https://yourdomain.com
// @version      1.0.0
// @description  Does something awesome
// @author       Your Name
// @match        *://*.example.com/*
// @grant        GM_setValue
// @grant        GM_getValue
// @run-at       document-end
// ==/UserScript==

(function() {
    'use strict';
    
    // Your code here
    console.log('Stay script loaded!');
})();
```

---

## Metadata Directives

### Required Tags

- **`@name`** - Script display name (supports multiple languages)
  ```javascript
  // @name         My Script
  // @name:zh-CN   我的脚本
  ```

- **`@version`** - SemVer version (e.g., `1.2.3`)

- **`@description`** - Brief description (supports multiple languages)
  ```javascript
  // @description    Enhances the website
  // @description:es Mejora el sitio web
  ```

### URL Matching

- **`@match`** - URL pattern for script injection
  ```javascript
  // @match *://*.example.com/*
  // @match https://specific.site.com/path/*
  ```

- **`@include`** - Alternative URL pattern (supports regex)
  ```javascript
  // @include /^https?://.*\.example\.com/.*/
  ```

- **`@exclude`** - Exclude specific URLs
  ```javascript
  // @exclude *://example.com/admin/*
  ```

### Permissions

- **`@grant`** - Request specific GM API permissions
  ```javascript
  // @grant GM_xmlhttpRequest
  // @grant GM_setValue
  // @grant GM_getValue
  // @grant GM_addStyle
  // @grant unsafeWindow
  ```

### Advanced Tags

- **`@run-at`** - Script execution timing
  - `document-start` - Before DOM loads
  - `document-end` - After DOM loads (default)
  - `document-idle` - After page fully loaded

- **`@require`** - External library dependencies
  ```javascript
  // @require https://code.jquery.com/jquery-3.6.0.min.js
  ```

- **`@resource`** - External resources (CSS, images, etc.)
  ```javascript
  // @resource customCSS https://example.com/styles.css
  ```

- **`@noframes`** - Don't run in iframes
  ```javascript
  // @noframes
  ```

---

## Stay API Reference

### Storage APIs

```javascript
// Store persistent data
GM_setValue('key', 'value');
GM_setValue('count', 42);
GM_setValue('config', {theme: 'dark', enabled: true});

// Retrieve stored data
const value = GM_getValue('key', 'defaultValue');
const count = GM_getValue('count', 0);
const config = GM_getValue('config', {});

// Delete stored data
GM_deleteValue('key');

// List all keys
const keys = GM_listValues();
```

### Style Injection

```javascript
// Add custom CSS
GM_addStyle(`
    .my-custom-class {
        color: #ff0000;
        font-weight: bold;
    }
    
    body {
        background: #f0f0f0;
    }
`);
```

### Network Requests

```javascript
// Cross-origin HTTP requests (bypasses CORS)
GM_xmlhttpRequest({
    method: 'GET',
    url: 'https://api.example.com/data',
    headers: {
        'Authorization': 'Bearer token123'
    },
    onload: function(response) {
        const data = JSON.parse(response.responseText);
        console.log('Data:', data);
    },
    onerror: function(error) {
        console.error('Request failed:', error);
    }
});

// POST request example
GM_xmlhttpRequest({
    method: 'POST',
    url: 'https://api.example.com/submit',
    data: JSON.stringify({key: 'value'}),
    headers: {
        'Content-Type': 'application/json'
    },
    onload: function(response) {
        console.log('Response:', response.responseText);
    }
});
```

### Menu Commands

```javascript
// Register menu command
const menuId = GM_registerMenuCommand('Toggle Feature', function() {
    const enabled = GM_getValue('featureEnabled', false);
    GM_setValue('featureEnabled', !enabled);
    alert('Feature ' + (!enabled ? 'enabled' : 'disabled'));
});

// Unregister menu command
GM_unregisterMenuCommand(menuId);
```

### Resource Access

```javascript
// Get resource URL
const cssUrl = GM_getResourceURL('customCSS');
const link = document.createElement('link');
link.rel = 'stylesheet';
link.href = cssUrl;
document.head.appendChild(link);

// Get resource as text
const cssText = GM_getResourceText('customCSS');
GM_addStyle(cssText);
```

### Tab Management

```javascript
// Open new tab
GM_openInTab('https://example.com');

// Open in background
GM_openInTab('https://example.com', {active: false});
```

### Logging

```javascript
// Log to Stay console
GM_log('Debug message');
GM_log('Data:', {key: 'value'});
```

### Script Info

```javascript
// Get script metadata
const info = GM_info;
console.log('Script name:', info.script.name);
console.log('Version:', info.script.version);
console.log('Handler:', info.scriptHandler); // 'stay'
```

### Window Access

```javascript
// Access page's window object
unsafeWindow.myFunction();
unsafeWindow.globalVariable = 'value';
```

### URL Change Detection (SPA Support)

```javascript
// Detect URL changes in Single Page Applications
if (typeof GM_addValueChangeListener !== 'undefined') {
    window.addEventListener('urlchange', function(e) {
        console.log('URL changed to:', location.href);
        // Re-run your script logic
    });
}
```

---

## Common Patterns

### Wait for Element

```javascript
function waitForElement(selector, callback) {
    const element = document.querySelector(selector);
    if (element) {
        callback(element);
        return;
    }
    
    const observer = new MutationObserver(function() {
        const el = document.querySelector(selector);
        if (el) {
            observer.disconnect();
            callback(el);
        }
    });
    
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
}

// Usage
waitForElement('.dynamic-content', function(element) {
    element.style.color = 'red';
});
```

### Debounce Function

```javascript
function debounce(func, wait) {
    let timeout;
    return function() {
        const context = this;
        const args = arguments;
        clearTimeout(timeout);
        timeout = setTimeout(function() {
            func.apply(context, args);
        }, wait);
    };
}

// Usage
const handleScroll = debounce(function() {
    console.log('Scrolled!');
}, 250);

window.addEventListener('scroll', handleScroll);
```

### Configuration Panel

```javascript
const config = {
    enabled: GM_getValue('enabled', true),
    theme: GM_getValue('theme', 'dark'),
    
    save: function() {
        GM_setValue('enabled', this.enabled);
        GM_setValue('theme', this.theme);
    }
};

GM_registerMenuCommand('Toggle Script', function() {
    config.enabled = !config.enabled;
    config.save();
    location.reload();
});
```

---

## Development Workflow

1. **Write Script** - Develop locally with your preferred editor
2. **Import to Stay** - Use Stay's "Import Script" feature or sync API
3. **Test** - Navigate to matching URLs and verify functionality
4. **Debug** - Use Stay console and browser DevTools
5. **Iterate** - Make changes and reload
6. **Publish** - Share with community or deploy to private backend

---

## Best Practices

### Performance

- Use `@run-at document-start` sparingly (blocks page load)
- Minimize DOM queries, cache selectors
- Use event delegation for dynamic content
- Debounce/throttle scroll and resize handlers

### Security

- Validate and sanitize user input
- Be cautious with `unsafeWindow`
- Use HTTPS for all external resources
- Don't store sensitive data in `GM_setValue`

### Compatibility

- Test on different iOS versions
- Handle missing APIs gracefully
- Use feature detection, not browser detection
- Provide fallbacks for critical functionality

### Code Quality

- Use strict mode: `'use strict';`
- Wrap code in IIFE to avoid global scope pollution
- Comment complex logic
- Follow consistent naming conventions

---

## Debugging

### Console Logging

```javascript
GM_log('Script started');
console.log('Debug info:', variable);
```

### Error Handling

```javascript
try {
    // Your code
} catch (error) {
    GM_log('Error:', error.message);
    console.error(error);
}
```

### Testing Match Patterns

```javascript
// Test if script matches current URL
if (window.location.href.match(/example\.com/)) {
    console.log('Script should run here');
}
```

---

## Publishing

### GreasyFork

1. Visit [GreasyFork.org](https://greasyfork.org)
2. Create account
3. Submit script with proper metadata
4. Add update URL for auto-updates

### Private Backend

Use Stay's backend sync API for private script distribution and cross-device sync.

---

## Examples

### Example 1: Dark Mode Toggle

```javascript
// ==UserScript==
// @name         Dark Mode Toggle
// @version      1.0.0
// @description  Add dark mode to any website
// @match        *://*/*
// @grant        GM_addStyle
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_registerMenuCommand
// ==/UserScript==

(function() {
    'use strict';
    
    const darkModeEnabled = GM_getValue('darkMode', false);
    
    function toggleDarkMode() {
        const enabled = GM_getValue('darkMode', false);
        GM_setValue('darkMode', !enabled);
        location.reload();
    }
    
    if (darkModeEnabled) {
        GM_addStyle(`
            html {
                filter: invert(1) hue-rotate(180deg);
            }
            img, video {
                filter: invert(1) hue-rotate(180deg);
            }
        `);
    }
    
    GM_registerMenuCommand('Toggle Dark Mode', toggleDarkMode);
})();
```

### Example 2: Auto-Fill Forms

```javascript
// ==UserScript==
// @name         Auto-Fill Helper
// @version      1.0.0
// @match        *://example.com/form
// @grant        GM_getValue
// @grant        GM_setValue
// ==/UserScript==

(function() {
    'use strict';
    
    const savedData = GM_getValue('formData', {});
    
    // Auto-fill on page load
    document.querySelectorAll('input[name]').forEach(input => {
        const name = input.name;
        if (savedData[name]) {
            input.value = savedData[name];
        }
    });
    
    // Save on form submit
    document.querySelector('form').addEventListener('submit', function() {
        const data = {};
        document.querySelectorAll('input[name]').forEach(input => {
            data[input.name] = input.value;
        });
        GM_setValue('formData', data);
    });
})();
```

---

## Support & Community

- **GitHub Issues:** [GlacierEQ/stay](https://github.com/GlacierEQ/stay/issues)
- **Discussions:** [GitHub Discussions](https://github.com/GlacierEQ/stay/discussions)
- **Wiki:** [Stay Wiki](https://github.com/shenruisi/Stay/wiki)

---

## Contributing

We welcome contributions! Please:

1. Fork the repository
2. Create a feature branch
3. Submit a pull request with clear description
4. Follow existing code style

---

**Happy Scripting!** 🚀

*Last updated: November 9, 2025*
