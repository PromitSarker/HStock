window.components.settings = {
    render(data) {
        const container = document.createElement('div');
        container.className = 'settings-container';

        const config = JSON.parse(localStorage.getItem('supabase_config') || '{"url":"","key":""}');

        const settingsHTML = `
            <div class="card">
                <h2>Cloud Database Settings (PostgreSQL)</h2>
                <p style="color: var(--text-secondary); margin-bottom: 24px;">
                    Enter your Supabase credentials to sync your data to the cloud. 
                    If left empty, the app will use local storage.
                </p>
                
                <div class="form-group">
                    <label>Supabase Project URL</label>
                    <input type="text" id="supabase-url" class="form-input" value="${config.url}" placeholder="https://your-project.supabase.co">
                </div>

                <div class="form-group">
                    <label>Supabase API Key (Anon/Public)</label>
                    <input type="password" id="supabase-key" class="form-input" value="${config.key}" placeholder="your-anon-key">
                </div>

                <div class="settings-actions">
                    <button class="btn btn-primary" onclick="components.settings.saveConfig()">
                        <i data-lucide="save"></i> Save Configuration
                    </button>
                    <button class="btn" onclick="components.settings.testConnection()" style="border: 1px solid var(--border-color);">
                        Test Connection
                    </button>
                </div>
            </div>

            <div class="card">
                <h2>Data Management</h2>
                <div style="display: flex; gap: 16px; margin-top: 16px;">
                    <button class="btn" style="background: #f1f3f4; color: var(--text-main);" onclick="components.settings.exportData()">
                        Export to JSON
                    </button>
                    <button class="btn text-danger" style="background: #fce8e6;" onclick="components.settings.resetData()">
                        Reset All Local Data
                    </button>
                </div>
            </div>
        `;

        container.innerHTML = settingsHTML;
        return container;
    },

    saveConfig() {
        const url = document.getElementById('supabase-url').value.trim();
        const key = document.getElementById('supabase-key').value.trim();
        
        localStorage.setItem('supabase_config', JSON.stringify({ url, key }));
        alert('Configuration saved! Please refresh the page to apply changes.');
        location.reload();
    },

    async testConnection() {
        const url = document.getElementById('supabase-url').value.trim();
        const key = document.getElementById('supabase-key').value.trim();

        if (!url || !key) {
            alert('Please provide both URL and Key');
            return;
        }

        try {
            const client = supabase.createClient(url, key);
            const { data, error } = await client.from('inventory').select('id').limit(1);
            
            if (error) throw error;
            alert('Connection successful! Database is accessible.');
        } catch (err) {
            console.error('Connection failed:', err);
            alert('Connection failed: ' + err.message + '\n\nMake sure you have created the "inventory" table in Supabase.');
        }
    },

    exportData() {
        const data = window.dataStore.load();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `homeostock_backup_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
    },

    resetData() {
        if (confirm('Are you sure you want to reset all local data? This cannot be undone.')) {
            localStorage.removeItem('homeo_stock_data');
            location.reload();
        }
    }
};
