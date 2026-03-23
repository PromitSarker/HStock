const app = {
    state: {
        currentView: 'dashboard',
        data: null,
        language: 'en',
        currency: '৳'
    },

    async init() {
        if (!this.checkAuth()) return;
        this.state.data = await window.dataStore.load();
        this.navigate(this.state.currentView);
        this.setupEventListeners();
        console.log('App initialized');
    },

    checkAuth() {
        const isAuthenticated = sessionStorage.getItem('homeostock_admin_auth');
        if (!isAuthenticated) {
            document.getElementById('login-overlay').style.display = 'flex';
            document.getElementById('login-form').onsubmit = (e) => {
                e.preventDefault();
                const pwd = document.getElementById('admin-password').value;
                if (pwd === 'admin123') { // Default password
                    sessionStorage.setItem('homeostock_admin_auth', 'true');
                    document.getElementById('login-overlay').style.display = 'none';
                    this.init();
                } else {
                    document.getElementById('login-error').textContent = this.t('loginError');
                    document.getElementById('login-error').style.display = 'block';
                }
            };
            return false;
        }
        return true;
    },

    navigate(view) {
        this.state.currentView = view;
        this.updateActiveNavLink();
        this.render();
        
        // Auto-close sidebar on mobile after navigation
        const sidebar = document.querySelector('.sidebar');
        if (sidebar && sidebar.classList.contains('active')) {
            this.toggleSidebar();
        }
    },

    toggleSidebar() {
        const sidebar = document.querySelector('.sidebar');
        if (sidebar) {
            sidebar.classList.toggle('active');
            // Overlay is handled by CSS (display: block when sidebar is active)
        }
    },

    updateActiveNavLink() {
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('onclick').includes(`'${this.state.currentView}'`)) {
                link.classList.add('active');
            }
        });
    },

    render() {
        const mainContent = document.getElementById('main-content');
        const pageTitle = document.getElementById('page-title');
        
        mainContent.innerHTML = ''; // Clear current content
        mainContent.className = 'content-area fade-in';

        switch (this.state.currentView) {
            case 'dashboard':
                pageTitle.textContent = this.t('dashboard');
                mainContent.appendChild(components.dashboard.render(this.state.data));
                break;
            case 'inventory':
                pageTitle.textContent = this.t('inventory');
                mainContent.appendChild(components.inventory.render(this.state.data));
                break;
            case 'procurement':
                pageTitle.textContent = this.t('procurement');
                mainContent.appendChild(components.procurement.render(this.state.data));
                break;
            case 'deliveries':
                pageTitle.textContent = this.t('deliveries');
                mainContent.appendChild(components.deliveries.render(this.state.data));
                break;
            case 'employees':
                pageTitle.textContent = this.t('employees');
                mainContent.appendChild(components.employees.render(this.state.data));
                break;
            case 'audit':
                pageTitle.textContent = this.t('audit');
                mainContent.appendChild(components.audit.render(this.state.data));
                break;
            case 'settings':
                pageTitle.textContent = this.t('settings');
                mainContent.appendChild(components.settings.render(this.state.data));
                break;
            default:
                mainContent.innerHTML = '<h2>404 - Page Not Found</h2>';
        }

        // Re-initialize icons for dynamic content
        if (window.lucide) {
            window.lucide.createIcons();
        }

        this.updateLanguageUI();
        this.updateSidebarLabels();
    },

    t(key) {
        const lang = this.state.language;
        return window.translations[lang][key] || key;
    },

    toggleLanguage() {
        this.state.language = this.state.language === 'en' ? 'bn' : 'en';
        this.render();
        this.updateSidebarLabels();
    },

    updateLanguageUI() {
        if (this.state.language === 'bn') {
            document.body.classList.add('lang-bn');
        } else {
            document.body.classList.remove('lang-bn');
        }

        const toggleBtn = document.getElementById('lang-toggle');
        if (toggleBtn) {
            const span = toggleBtn.querySelector('span');
            if (span) {
                span.textContent = this.state.language === 'en' ? 'Bengali' : 'English';
            }
        }

        const searchInput = document.querySelector('.search-bar');
        if (searchInput) {
            searchInput.placeholder = this.t('searchPlaceholder');
        }
    },

    updateSidebarLabels() {
        const navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            const span = link.querySelector('span');
            if (!span) return;
            
            const onclick = link.getAttribute('onclick');
            if (onclick.includes('dashboard')) span.textContent = this.t('dashboard');
            else if (onclick.includes('inventory')) span.textContent = this.t('inventory');
            else if (onclick.includes('procurement')) span.textContent = this.t('procurement');
            else if (onclick.includes('deliveries')) span.textContent = this.t('deliveries');
            else if (onclick.includes('employees')) span.textContent = this.t('employees');
            else if (onclick.includes('audit')) span.textContent = this.t('audit');
            else if (onclick.includes('settings')) span.textContent = this.t('settings');
        });

        const logoText = document.querySelector('.logo h1');
        if (logoText && this.state.language === 'bn') {
            logoText.textContent = 'রাইম ম্যানেজমেন্ট';
        } else if (logoText) {
            logoText.textContent = 'Raim Management';
        }
    },

    setupEventListeners() {
        const searchBar = document.querySelector('.search-bar');
        if (searchBar) {
            searchBar.addEventListener('input', (e) => {
                this.handleSearch(e.target.value);
            });
        }
    },

    handleSearch(query) {
        console.log('Searching for:', query);
        // Search logic will be component-specific or global
        if (this.state.currentView === 'inventory' && components.inventory.handleSearch) {
            components.inventory.handleSearch(query);
        }
    }
};

// Global components registry (initialized in data.js)

document.addEventListener('DOMContentLoaded', () => {
    window.app = app;
    app.init();
});
