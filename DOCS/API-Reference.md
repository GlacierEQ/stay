# Stay API Reference

**Version:** 1.0.0  
**Compatibility:** Stay Extension v2.0+

---

## Overview

Stay implements the Greasemonkey 4.0 API with extensions for iOS Safari. All APIs are accessed through the `GM` namespace or legacy `GM_*` functions.

---

## Storage API

### `GM.setValue(key, value)` / `GM_setValue(key, value)`

Store persistent data across script executions.

**Parameters:**
- `key` (string) - Storage key
- `value` (any) - Value to store (strings, numbers, booleans, objects)

**Returns:** `Promise<void>` (GM.setValue) or `void` (GM_setValue)

**Example:**
```javascript
// Async version
await GM.setValue('username', 'john_doe');
await GM.setValue('preferences', {theme: 'dark', lang: 'en'});

// Sync version
GM_setValue('count', 42);
```

---

### `GM.getValue(key, defaultValue)` / `GM_getValue(key, defaultValue)`

Retrieve stored data.

**Parameters:**
- `key` (string) - Storage key
- `defaultValue` (any) - Value to return if key doesn't exist

**Returns:** `Promise<any>` (GM.getValue) or `any` (GM_getValue)

**Example:**
```javascript
// Async version
const username = await GM.getValue('username', 'guest');
const prefs = await GM.getValue('preferences', {});

// Sync version
const count = GM_getValue('count', 0);
```

---

### `GM.deleteValue(key)` / `GM_deleteValue(key)`

Delete stored data.

**Parameters:**
- `key` (string) - Storage key to delete

**Returns:** `Promise<void>` (GM.deleteValue) or `void` (GM_deleteValue)

---

### `GM.listValues()` / `GM_listValues()`

List all storage keys.

**Returns:** `Promise<string[]>` (GM.listValues) or `string[]` (GM_listValues)

**Example:**
```javascript
const keys = await GM.listValues();
console.log('Stored keys:', keys);
```

---

## Network API

### `GM.xmlHttpRequest(details)` / `GM_xmlhttpRequest(details)`

Make cross-origin HTTP requests.

**Parameters:**
- `details` (object):
  - `method` (string) - HTTP method (GET, POST, etc.)
  - `url` (string) - Request URL
  - `headers` (object) - Request headers
  - `data` (string) - Request body
  - `onload` (function) - Success callback
  - `onerror` (function) - Error callback
  - `ontimeout` (function) - Timeout callback
  - `timeout` (number) - Timeout in ms

**Example:**
```javascript
GM_xmlhttpRequest({
    method: 'POST',
    url: 'https://api.example.com/data',
    headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer token'
    },
    data: JSON.stringify({key: 'value'}),
    timeout: 5000,
    onload: function(response) {
        console.log('Status:', response.status);
        console.log('Response:', response.responseText);
    },
    onerror: function(error) {
        console.error('Request failed');
    },
    ontimeout: function() {
        console.error('Request timed out');
    }
});
```

---

## UI API

### `GM_addStyle(css)`

Inject CSS into the page.

**Parameters:**
- `css` (string) - CSS rules to inject

**Returns:** `HTMLStyleElement`

**Example:**
```javascript
GM_addStyle(`
    .custom-button {
        background: #007bff;
        color: white;
        padding: 10px 20px;
        border-radius: 5px;
    }
`);
```

---

### `GM.registerMenuCommand(name, callback)` / `GM_registerMenuCommand(name, callback)`

Add command to Stay extension menu.

**Parameters:**
- `name` (string) - Menu item label
- `callback` (function) - Function to execute

**Returns:** Command ID (for unregistering)

---

### `GM.unregisterMenuCommand(id)` / `GM_unregisterMenuCommand(id)`

Remove menu command.

**Parameters:**
- `id` - Command ID returned by registerMenuCommand

---

## Resource API

### `GM.getResourceUrl(name)` / `GM_getResourceURL(name)`

Get data URL for resource.

**Parameters:**
- `name` (string) - Resource name from `@resource`

**Returns:** `Promise<string>` (GM) or `string` (GM_)

---

### `GM.getResourceText(name)` / `GM_getResourceText(name)`

Get resource as text.

**Parameters:**
- `name` (string) - Resource name from `@resource`

**Returns:** `Promise<string>` (GM) or `string` (GM_)

---

## Tab API

### `GM.openInTab(url, options)` / `GM_openInTab(url, options)`

Open URL in new tab.

**Parameters:**
- `url` (string) - URL to open
- `options` (object):
  - `active` (boolean) - Open in foreground (default: true)

**Example:**
```javascript
// Open in background
GM_openInTab('https://example.com', {active: false});
```

---

## Info API

### `GM.info` / `GM_info`

Get script and runtime information.

**Returns:** Object with:
```javascript
{
    script: {
        name: 'Script Name',
        version: '1.0.0',
        description: 'Script description',
        namespace: 'namespace',
        matches: ['*://example.com/*'],
        resources: {...}
    },
    scriptHandler: 'stay',
    version: '1.0.0'
}
```

---

## Window API

### `unsafeWindow`

Access page's window object.

**Warning:** Use with caution. May expose script to page scripts.

**Example:**
```javascript
unsafeWindow.myGlobalFunction();
console.log(unsafeWindow.someVariable);
```

---

## Logging API

### `GM_log(message, ...args)`

Log to Stay console.

**Parameters:**
- `message` - Message to log
- `...args` - Additional arguments

---

## Event API (Stay Extension)

### `window.onurlchange`

Detect URL changes (SPA support).

**Example:**
```javascript
window.addEventListener('urlchange', function(info) {
    console.log('URL changed:', location.href);
});
```

---

## Browser Compatibility

| API | Stay | Tampermonkey | Greasemonkey |
|-----|------|--------------|-------------|
| GM_setValue | ✅ | ✅ | ✅ |
| GM_getValue | ✅ | ✅ | ✅ |
| GM_xmlhttpRequest | ✅ | ✅ | ✅ |
| GM_addStyle | ✅ | ✅ | ✅ |
| GM_getResourceURL | ✅ | ✅ | ✅ |
| GM_notification | ⚠️ | ✅ | ✅ |
| window.onurlchange | ✅ | ✅ | ❌ |

*Legend: ✅ Supported | ⚠️ Partial | ❌ Not supported*

---

**For complete documentation, visit:** [Stay Wiki](https://github.com/shenruisi/Stay/wiki)
