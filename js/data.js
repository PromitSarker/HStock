window.components = {};
const STORAGE_KEY = 'homeo_stock_data';

const initialData = {
    inventory: [
        { id: 1, name: 'Arnica Montana', potency: '30C', batch: 'BN-9021-X', stock: 45, expiry: '2025-12-12' },
        { id: 2, name: 'Belladonna', potency: '200C', batch: 'BN-4432-A', stock: 2, expiry: '2024-08-15' },
        { id: 3, name: 'Nux Vomica', potency: '30C', batch: 'BN-1109-M', stock: 22, expiry: '2026-03-20' },
        { id: 4, name: 'Bryonia Alba', potency: '1M', batch: 'BN-8872-B', stock: 1, expiry: '2024-11-10' },
        { id: 5, name: 'Rhus Tox', potency: '200C', batch: 'BN-5561-R', stock: 15, expiry: '2025-05-05' },
        { id: 6, name: 'Aconite Napellus', potency: '30C', batch: 'BN-2231-N', stock: 50, expiry: '2026-01-10' },
        { id: 7, name: 'Apis Mellifica', potency: '30C', batch: 'BN-3342-P', stock: 3, expiry: '2025-09-15' },
        { id: 8, name: 'Calcarea Carb', potency: '200C', batch: 'BN-4453-C', stock: 12, expiry: '2026-06-20' },
        { id: 9, name: 'Gelsemium', potency: '30C', batch: 'BN-5564-G', stock: 30, expiry: '2025-03-30' },
        { id: 10, name: 'Ignatia Amara', potency: '200C', batch: 'BN-6675-I', stock: 8, expiry: '2025-07-12' }
    ],
    deliveries: [
        { id: 8921, date: '2024-03-10 09:15 AM', recipient: 'John Doe', products: 'Arnica (x2), Rhus Tox (x1)', status: 'Delivered' },
        { id: 8922, date: '2024-03-12 11:30 AM', recipient: 'Jane Smith', products: 'Belladonna (x5)', status: 'Pending' },
        { id: 8923, date: '2024-03-12 01:45 PM', recipient: 'Robert Wilson', products: 'Nux Vomica (x3)', status: 'Pending' },
        { id: 8924, date: '2024-03-11 04:20 PM', recipient: 'Mary Johnson', products: 'Bryonia (x2)', status: 'Delivered' }
    ],
    employees: [
        { id: 1, name: 'Johnathan Doe', role: 'Staff', contact: '+1 (555) 010-8899', status: 'Active' },
        { id: 2, name: 'Jane Smith', role: 'Manager', contact: '+1 (555) 012-3456', status: 'On Leave' },
        { id: 3, name: 'David Miller', role: 'Delivery Driver', contact: '+1 (555) 013-5566', status: 'Active' },
        { id: 4, name: 'Sarah Wilson', role: 'Pharmacist', contact: '+1 (555) 014-7788', status: 'Active' }
    ]
};

const dataStore = {
    supabaseClient: null,
    isInitialized: false,

    async init() {
        if (this.isInitialized) return;
        const config = JSON.parse(localStorage.getItem('supabase_config') || '{"url":"","key":""}');
        if (config.url && config.key && window.supabase) {
            this.supabaseClient = window.supabase.createClient(config.url, config.key);
            console.log('Supabase initialised. Fetching data...');
            await this.fetchFromCloud();
        }
        this.isInitialized = true;
        
        // Re-render app with new context if needed and app is already loaded
        if (window.app && window.app.state) {
            window.app.state.data = this.load();
            window.app.render();
        }
    },
    
    async fetchFromCloud() {
        try {
            const keys = ['inventory', 'deliveries', 'employees'];
            const localData = this.load();
            let dataChanged = false;

            for (const key of keys) {
                const { data, error } = await this.supabaseClient.from(key).select('*');
                if (!error && data && data.length > 0) {
                    localData[key] = data;
                    dataChanged = true;
                }
            }

            if (dataChanged) {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(localData));
                console.log('Local storage synced with cloud data.');
            }
        } catch (err) {
            console.error('Fetch from cloud failed:', err);
        }
    },

    save(data) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        // Async cloud sync could be triggered here
        if (this.supabaseClient) {
            this.syncToCloud(data);
        }
    },

    load() {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (!stored) {
            this.save(initialData);
            return initialData;
        }
        return JSON.parse(stored);
    },

    async syncToCloud(key, newData) {
        if (!this.supabaseClient) return;
        
        console.log(`Syncing ${key} to cloud...`);
        try {
            // This is a simplified sync that replaces the entire array in a single JSON column 
            // OR maps to actual tables if they exist. 
            // For this implementation, we assume a 'store' table with a 'data' JSONB column for simplicity,
            // or we try to upsert into a table named after the key.
            
            const { error } = await this.supabaseClient
                .from(key)
                .upsert(newData, { onConflict: 'id' });

            if (error) throw error;
            console.log(`${key} synced successfully`);
        } catch (err) {
            console.error(`Cloud sync failed for ${key}:`, err);
        }
    },

    update(key, newData) {
        const data = this.load();
        data[key] = newData;
        this.save(data);
        
        if (this.supabaseClient) {
            this.syncToCloud(key, newData);
        }
    }
};

dataStore.init();
window.dataStore = dataStore;
