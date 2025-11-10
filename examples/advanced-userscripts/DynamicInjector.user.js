// ==UserScript==
// @name         Dynamic Content Injector
// @namespace    https://stay.glaciereq.com
// @version      1.0.0
// @description  Advanced DOM manipulation with MutationObserver and event delegation
// @author       GlacierEQ
// @match        *://*/*
// @grant        GM_addStyle
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_registerMenuCommand
// @grant        unsafeWindow
// @run-at       document-start
// @license      MIT
// ==/UserScript==

(function() {
    'use strict';

    // Performance monitoring
    const perf = {
        start: performance.now(),
        marks: {},
        
        mark(name) {
            this.marks[name] = performance.now() - this.start;
            console.log(`⏱️ ${name}: ${this.marks[name].toFixed(2)}ms`);
        }
    };

    // Enhanced DOM utilities
    const DOM = {
        // Wait for element with timeout
        waitFor(selector, timeout = 5000) {
            return new Promise((resolve, reject) => {
                const element = document.querySelector(selector);
                if (element) return resolve(element);
                
                const observer = new MutationObserver(() => {
                    const el = document.querySelector(selector);
                    if (el) {
                        observer.disconnect();
                        resolve(el);
                    }
                });
                
                observer.observe(document.documentElement, {
                    childList: true,
                    subtree: true
                });
                
                setTimeout(() => {
                    observer.disconnect();
                    reject(new Error(`Element ${selector} not found within ${timeout}ms`));
                }, timeout);
            });
        },
        
        // Create element with attributes
        create(tag, attrs = {}, children = []) {
            const el = document.createElement(tag);
            
            Object.entries(attrs).forEach(([key, value]) => {
                if (key === 'style' && typeof value === 'object') {
                    Object.assign(el.style, value);
                } else if (key === 'dataset' && typeof value === 'object') {
                    Object.assign(el.dataset, value);
                } else if (key === 'class') {
                    el.className = value;
                } else {
                    el.setAttribute(key, value);
                }
            });
            
            children.forEach(child => {
                if (typeof child === 'string') {
                    el.appendChild(document.createTextNode(child));
                } else {
                    el.appendChild(child);
                }
            });
            
            return el;
        },
        
        // Observe URL changes (SPA support)
        onURLChange(callback) {
            let lastUrl = location.href;
            
            new MutationObserver(() => {
                const url = location.href;
                if (url !== lastUrl) {
                    lastUrl = url;
                    callback(url);
                }
            }).observe(document, {subtree: true, childList: true});
            
            // Also listen to popstate
            window.addEventListener('popstate', () => callback(location.href));
        }
    };

    // Add custom styles
    GM_addStyle(`
        .stay-injected {
            border: 2px solid #00ff88 !important;
            box-shadow: 0 0 10px rgba(0, 255, 136, 0.3) !important;
            transition: all 0.3s ease !important;
        }
        
        .stay-injected:hover {
            transform: scale(1.02) !important;
            box-shadow: 0 0 20px rgba(0, 255, 136, 0.5) !important;
        }
        
        .stay-toolbar {
            position: fixed;
            top: 50%;
            right: 0;
            transform: translateY(-50%);
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 10px;
            border-radius: 8px 0 0 8px;
            box-shadow: -2px 0 10px rgba(0,0,0,0.2);
            z-index: 999999;
            display: flex;
            flex-direction: column;
            gap: 8px;
        }
        
        .stay-toolbar-btn {
            background: rgba(255, 255, 255, 0.9);
            border: none;
            padding: 8px 12px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 12px;
            font-weight: 600;
            transition: all 0.2s;
        }
        
        .stay-toolbar-btn:hover {
            background: white;
            transform: scale(1.05);
        }
    `);

    // Main functionality
    async function initialize() {
        perf.mark('init-start');
        
        try {
            // Wait for body
            await DOM.waitFor('body');
            perf.mark('body-ready');
            
            // Create toolbar
            const toolbar = DOM.create('div', {class: 'stay-toolbar'}, [
                DOM.create('button', {
                    class: 'stay-toolbar-btn',
                    textContent: '🔧 Enhance'
                }),
                DOM.create('button', {
                    class: 'stay-toolbar-btn',
                    textContent: '🎨 Theme'
                }),
                DOM.create('button', {
                    class: 'stay-toolbar-btn',
                    textContent: '📊 Stats'
                })
            ]);
            
            // Event delegation for buttons
            toolbar.addEventListener('click', function(e) {
                if (e.target.classList.contains('stay-toolbar-btn')) {
                    const action = e.target.textContent.trim();
                    
                    if (action.includes('Enhance')) {
                        enhanceElements();
                    } else if (action.includes('Theme')) {
                        toggleTheme();
                    } else if (action.includes('Stats')) {
                        showStats();
                    }
                }
            });
            
            document.body.appendChild(toolbar);
            perf.mark('toolbar-created');
            
            // Watch for URL changes
            DOM.onURLChange((url) => {
                console.log('🔗 URL changed:', url);
                // Re-run enhancements if needed
            });
            
            perf.mark('init-complete');
            console.log('🎯 Performance Marks:', perf.marks);
            
        } catch (error) {
            console.error('❌ Initialization error:', error);
        }
    }

    function enhanceElements() {
        const selectors = ['article', 'section', 'main', '.content', '#content'];
        let count = 0;
        
        selectors.forEach(selector => {
            document.querySelectorAll(selector).forEach(el => {
                if (!el.classList.contains('stay-injected')) {
                    el.classList.add('stay-injected');
                    count++;
                }
            });
        });
        
        console.log(`✨ Enhanced ${count} elements`);
    }

    function toggleTheme() {
        const isDark = document.body.style.filter === 'invert(1) hue-rotate(180deg)';
        
        if (isDark) {
            document.body.style.filter = '';
            console.log('🌞 Light theme enabled');
        } else {
            document.body.style.filter = 'invert(1) hue-rotate(180deg)';
            console.log('🌙 Dark theme enabled');
        }
    }

    function showStats() {
        const stats = {
            url: location.href,
            domain: location.hostname,
            elements: document.querySelectorAll('*').length,
            scripts: document.querySelectorAll('script').length,
            styles: document.querySelectorAll('style, link[rel="stylesheet"]').length,
            images: document.querySelectorAll('img').length,
            performance: perf.marks
        };
        
        console.table(stats);
        alert(JSON.stringify(stats, null, 2));
    }

    // Register menu commands
    GM_registerMenuCommand('✨ Enhance Page', enhanceElements);
    GM_registerMenuCommand('🎨 Toggle Theme', toggleTheme);
    GM_registerMenuCommand('📊 Show Stats', showStats);

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initialize);
    } else {
        initialize();
    }

    console.log('🚀 Dynamic Injector loaded');

})();
