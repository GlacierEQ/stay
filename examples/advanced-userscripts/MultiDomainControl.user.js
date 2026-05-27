// ==UserScript==
// @name         Advanced Multi-Domain Controller
// @namespace    https://stay.glaciereq.com
// @version      1.0.0
// @description  Demonstrates multi-domain injection, persistent storage, and cross-origin requests
// @author       GlacierEQ
// @match        *://*.example.com/*
// @match        *://*.github.com/*
// @match        *://*.stackoverflow.com/*
// @grant        GM_addStyle
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_xmlhttpRequest
// @grant        GM_registerMenuCommand
// @grant        GM_log
// @connect      api.github.com
// @run-at       document-idle
// @license      MIT
// ==/UserScript==

(function() {
    'use strict';

    // Configuration
    const CONFIG = {
        enabled: GM_getValue('enabled', true),
        theme: GM_getValue('theme', 'blue'),
        showStats: GM_getValue('showStats', true)
    };

    // Domain-specific styling
    const DOMAIN_THEMES = {
        'example.com': '#ff6b6b',
        'github.com': '#24292e',
        'stackoverflow.com': '#f48024'
    };

    // Get current domain theme
    function getDomainColor() {
        for (const [domain, color] of Object.entries(DOMAIN_THEMES)) {
            if (location.hostname.includes(domain)) {
                return color;
            }
        }
        return '#0066cc';
    }

    // Inject custom styles
    GM_addStyle(`
        .stay-banner {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            background: linear-gradient(135deg, ${getDomainColor()} 0%, ${getDomainColor()}dd 100%);
            color: white;
            padding: 12px 20px;
            text-align: center;
            z-index: 999999;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            font-size: 14px;
            font-weight: 500;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            animation: slideDown 0.3s ease-out;
        }
        
        @keyframes slideDown {
            from {
                transform: translateY(-100%);
                opacity: 0;
            }
            to {
                transform: translateY(0);
                opacity: 1;
            }
        }
        
        .stay-stats {
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: rgba(0, 0, 0, 0.85);
            color: white;
            padding: 15px;
            border-radius: 8px;
            font-family: monospace;
            font-size: 12px;
            z-index: 999998;
            backdrop-filter: blur(10px);
        }
        
        .stay-stats-title {
            font-weight: bold;
            margin-bottom: 8px;
            color: ${getDomainColor()};
        }
        
        .stay-stats-item {
            margin: 4px 0;
        }
    `);

    // Visit tracking
    const visitKey = `visits_${location.hostname}`;
    let visitCount = GM_getValue(visitKey, 0);
    visitCount++;
    GM_setValue(visitKey, visitCount);

    // Time tracking
    const startTime = Date.now();

    // Create banner
    function createBanner() {
        const banner = document.createElement('div');
        banner.className = 'stay-banner';
        banner.innerHTML = `
            🚀 Stay Script Active on ${location.hostname} | 
            Visit #${visitCount} | 
            <span id="stay-timer">0s</span>
        `;
        document.body.prepend(banner);

        // Update timer
        setInterval(() => {
            const elapsed = Math.floor((Date.now() - startTime) / 1000);
            const timer = document.getElementById('stay-timer');
            if (timer) {
                timer.textContent = `${elapsed}s`;
            }
        }, 1000);

        // Auto-hide after 5 seconds
        setTimeout(() => {
            banner.style.transition = 'all 0.3s ease-out';
            banner.style.transform = 'translateY(-100%)';
            banner.style.opacity = '0';
        }, 5000);
    }

    // Create stats panel
    function createStatsPanel() {
        if (!CONFIG.showStats) return;

        const stats = document.createElement('div');
        stats.className = 'stay-stats';
        stats.innerHTML = `
            <div class="stay-stats-title">📊 Stay Statistics</div>
            <div class="stay-stats-item">Domain: ${location.hostname}</div>
            <div class="stay-stats-item">Visits: ${visitCount}</div>
            <div class="stay-stats-item">Scripts: <span id="script-count">1</span></div>
            <div class="stay-stats-item">Status: <span style="color: #4caf50">• Active</span></div>
        `;
        document.body.appendChild(stats);
    }

    // Fetch GitHub stats (example cross-origin request)
    function fetchGitHubStats() {
        if (!location.hostname.includes('github.com')) return;

        GM_xmlhttpRequest({
            method: 'GET',
            url: 'https://api.github.com/repos/GlacierEQ/stay',
            onload: function(response) {
                try {
                    const data = JSON.parse(response.responseText);
                    GM_log('GitHub Repo Stats:', {
                        stars: data.stargazers_count,
                        forks: data.forks_count,
                        watchers: data.watchers_count,
                        issues: data.open_issues_count
                    });
                } catch (e) {
                    GM_log('Error parsing GitHub response:', e);
                }
            },
            onerror: function(error) {
                GM_log('GitHub API request failed:', error);
            }
        });
    }

    // Menu commands
    GM_registerMenuCommand('⚙️ Toggle Script', function() {
        CONFIG.enabled = !CONFIG.enabled;
        GM_setValue('enabled', CONFIG.enabled);
        alert(`Stay Script ${CONFIG.enabled ? 'Enabled' : 'Disabled'}`);
        location.reload();
    });

    GM_registerMenuCommand('📊 Toggle Stats', function() {
        CONFIG.showStats = !CONFIG.showStats;
        GM_setValue('showStats', CONFIG.showStats);
        location.reload();
    });

    GM_registerMenuCommand('🗑️ Clear Visit Data', function() {
        if (confirm('Clear all visit data?')) {
            GM_setValue(visitKey, 0);
            alert('Visit data cleared!');
            location.reload();
        }
    });

    // Initialize
    if (CONFIG.enabled) {
        createBanner();
        createStatsPanel();
        fetchGitHubStats();

        GM_log(`Stay script initialized on ${location.hostname}`);
        GM_log('Configuration:', CONFIG);
    }

})();
