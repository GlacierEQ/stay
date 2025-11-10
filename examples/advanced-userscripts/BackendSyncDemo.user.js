// ==UserScript==
// @name         Stay Backend Sync Demo
// @namespace    https://stay.glaciereq.com
// @version      1.0.0
// @description  Demonstrates backend API integration for cloud sync
// @author       GlacierEQ
// @match        *://*/*
// @grant        GM_xmlhttpRequest
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_registerMenuCommand
// @grant        GM_log
// @connect      localhost
// @connect      api.stay.glaciereq.com
// @run-at       document-idle
// @license      MIT
// ==/UserScript==

(function() {
    'use strict';

    // API Configuration
    const API_BASE_URL = GM_getValue('api_url', 'http://localhost:4000/api');
    const API_TOKEN = GM_getValue('api_token', null);

    // API Client
    class StayAPI {
        constructor(baseURL, token) {
            this.baseURL = baseURL;
            this.token = token;
        }

        async request(endpoint, options = {}) {
            return new Promise((resolve, reject) => {
                GM_xmlhttpRequest({
                    method: options.method || 'GET',
                    url: `${this.baseURL}${endpoint}`,
                    headers: {
                        'Content-Type': 'application/json',
                        ...(this.token && {'Authorization': `Bearer ${this.token}`}),
                        ...options.headers
                    },
                    data: options.data ? JSON.stringify(options.data) : undefined,
                    onload: (response) => {
                        try {
                            const data = JSON.parse(response.responseText);
                            if (response.status >= 200 && response.status < 300) {
                                resolve(data);
                            } else {
                                reject(new Error(data.error || 'Request failed'));
                            }
                        } catch (error) {
                            reject(error);
                        }
                    },
                    onerror: (error) => reject(error),
                    ontimeout: () => reject(new Error('Request timeout'))
                });
            });
        }

        // Authentication
        async login(email, password) {
            try {
                const data = await this.request('/auth/login', {
                    method: 'POST',
                    data: {email, password}
                });
                
                this.token = data.token;
                GM_setValue('api_token', data.token);
                GM_setValue('user', data.user);
                
                GM_log('✅ Login successful');
                return data;
            } catch (error) {
                GM_log('❌ Login failed:', error.message);
                throw error;
            }
        }

        async register(email, password) {
            try {
                const data = await this.request('/auth/register', {
                    method: 'POST',
                    data: {email, password}
                });
                
                GM_log('✅ Registration successful');
                return data;
            } catch (error) {
                GM_log('❌ Registration failed:', error.message);
                throw error;
            }
        }

        // Script Management
        async getScripts() {
            return await this.request('/scripts');
        }

        async createScript(scriptData) {
            return await this.request('/scripts', {
                method: 'POST',
                data: scriptData
            });
        }

        async updateScript(scriptId, updates) {
            return await this.request('/scripts', {
                method: 'POST',
                data: {id: scriptId, ...updates}
            });
        }

        async deleteScript(scriptId) {
            return await this.request(`/scripts/${scriptId}`, {
                method: 'DELETE'
            });
        }
    }

    // Initialize API client
    const api = new StayAPI(API_BASE_URL, API_TOKEN);

    // Sync Manager
    const SyncManager = {
        lastSync: GM_getValue('last_sync', null),
        syncInterval: 3600000, // 1 hour

        async sync() {
            if (!API_TOKEN) {
                GM_log('⚠️ Not logged in, skipping sync');
                return;
            }

            try {
                GM_log('🔄 Starting sync...');
                
                const scripts = await api.getScripts();
                
                GM_setValue('synced_scripts', scripts);
                GM_setValue('last_sync', Date.now());
                
                GM_log(`✅ Synced ${scripts.length} scripts`);
                
                this.showNotification(`Synced ${scripts.length} scripts successfully`);
                
            } catch (error) {
                GM_log('❌ Sync failed:', error.message);
                this.showNotification('Sync failed: ' + error.message);
            }
        },

        async autoSync() {
            await this.sync();
            setInterval(() => this.sync(), this.syncInterval);
        },

        showNotification(message) {
            const notif = document.createElement('div');
            notif.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                background: #4caf50;
                color: white;
                padding: 15px 20px;
                border-radius: 8px;
                box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                z-index: 999999;
                font-family: -apple-system, sans-serif;
                font-size: 14px;
                animation: slideIn 0.3s ease-out;
            `;
            notif.textContent = message;
            document.body.appendChild(notif);

            setTimeout(() => {
                notif.style.transition = 'all 0.3s ease-out';
                notif.style.opacity = '0';
                notif.style.transform = 'translateX(100%)';
                setTimeout(() => notif.remove(), 300);
            }, 3000);
        }
    };

    // Menu Commands
    GM_registerMenuCommand('🔑 Login', async () => {
        const email = prompt('Enter email:');
        const password = prompt('Enter password:');
        
        if (email && password) {
            try {
                await api.login(email, password);
                alert('Login successful!');
                location.reload();
            } catch (error) {
                alert('Login failed: ' + error.message);
            }
        }
    });

    GM_registerMenuCommand('📝 Register', async () => {
        const email = prompt('Enter email:');
        const password = prompt('Enter password:');
        
        if (email && password) {
            try {
                await api.register(email, password);
                alert('Registration successful! Please login.');
            } catch (error) {
                alert('Registration failed: ' + error.message);
            }
        }
    });

    GM_registerMenuCommand('🔄 Sync Now', async () => {
        await SyncManager.sync();
    });

    GM_registerMenuCommand('📋 View Scripts', async () => {
        try {
            const scripts = await api.getScripts();
            console.table(scripts);
            alert(`You have ${scripts.length} scripts in cloud storage`);
        } catch (error) {
            alert('Failed to fetch scripts: ' + error.message);
        }
    });

    GM_registerMenuCommand('🚪 Logout', () => {
        GM_setValue('api_token', null);
        GM_setValue('user', null);
        alert('Logged out successfully');
        location.reload();
    });

    // Auto-sync if logged in
    if (API_TOKEN) {
        SyncManager.autoSync();
        GM_log('🔄 Auto-sync enabled');
    } else {
        GM_log('⚠️ Not logged in. Use menu to login.');
    }

    GM_log('🚀 Backend Sync Demo loaded');
    GM_log('API URL:', API_BASE_URL);
    GM_log('Logged in:', !!API_TOKEN);

})();
