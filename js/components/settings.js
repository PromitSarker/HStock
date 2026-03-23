window.components.settings = {
    render(data) {
        const container = document.createElement('div');
        container.className = 'settings-container';

        const config = JSON.parse(localStorage.getItem('supabase_config') || '{"url":"","key":""}');

        const settingsHTML = `
            <div class="card">
                <h2>${app.t('cloudSettings')}</h2>
                <p style="color: var(--text-secondary); margin-bottom: 24px;">
                    ${app.t('cloudDesc')}
                </p>
                
                <div class="form-group">
                    <label>${app.t('supabaseUrl')}</label>
                    <input type="text" id="supabase-url" class="form-input" value="${config.url}" placeholder="https://your-project.supabase.co">
                </div>

                <div class="form-group">
                    <label>${app.t('supabaseKey')}</label>
                    <input type="password" id="supabase-key" class="form-input" value="${config.key}" placeholder="your-anon-key">
                </div>

                <div class="settings-actions">
                    <button class="btn btn-primary" onclick="components.settings.saveConfig()">
                        <i data-lucide="save"></i> ${app.t('saveConfig')}
                    </button>
                    <button class="btn" onclick="components.settings.testConnection()" style="border: 1px solid var(--border-color);">
                        ${app.t('testConnection')}
                    </button>
                </div>
            </div>

            <div class="card">
                <h2>${app.t('dataManagement')}</h2>
                <div class="flex-center" style="margin-top: 16px;">
                    <button class="btn" style="background: #f1f3f4; color: var(--text-main);" onclick="components.settings.exportData()">
                        ${app.t('exportJson')}
                    </button>
                    <button class="btn text-danger" style="background: #fee2e2;" onclick="components.settings.resetData()">
                        ${app.t('resetData')}
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
        alert(app.t('configSaved'));
        location.reload();
    },

    async testConnection() {
        const url = document.getElementById('supabase-url').value.trim();
        const key = document.getElementById('supabase-key').value.trim();

        if (!url || !key) {
            alert(app.t('provideBoth'));
            return;
        }

        try {
            const client = supabase.createClient(url, key);
            const { data, error } = await client.from('inventory').select('id').limit(1);
            
            if (error) throw error;
            alert(app.t('connSuccess'));
        } catch (err) {
            console.error('Connection failed:', err);
            alert(app.t('connFailed') + err.message + '\n\n' + app.t('supabaseTableHint'));
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
        if (confirm(app.t('resetConfirm'))) {
            localStorage.removeItem('homeo_stock_data');
            location.reload();
        }
    }
};
