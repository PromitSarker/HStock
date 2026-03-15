const app = {
    state: {
        currentView: 'dashboard',
        data: null
    },

    init() {
        if (!this.checkAuth()) return;
        this.state.data = window.dataStore.load();
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
                pageTitle.textContent = 'Dashboard Overview';
                mainContent.appendChild(components.dashboard.render(this.state.data));
                break;
            case 'inventory':
                pageTitle.textContent = 'Medicine Inventory';
                mainContent.appendChild(components.inventory.render(this.state.data));
                break;
            case 'procurement':
                pageTitle.textContent = 'Procurement (Stock In)';
                mainContent.appendChild(components.procurement.render(this.state.data));
                break;
            case 'deliveries':
                pageTitle.textContent = 'Distribution (Stock Out)';
                mainContent.appendChild(components.deliveries.render(this.state.data));
                break;
            case 'employees':
                pageTitle.textContent = 'Employee Management';
                mainContent.appendChild(components.employees.render(this.state.data));
                break;
            case 'audit':
                pageTitle.textContent = 'System Audit Logs';
                mainContent.appendChild(components.audit.render(this.state.data));
                break;
            case 'settings':
                pageTitle.textContent = 'System Settings';
                mainContent.appendChild(components.settings.render(this.state.data));
                break;
            default:
                mainContent.innerHTML = '<h2>404 - Page Not Found</h2>';
        }

        // Re-initialize icons for dynamic content
        if (window.lucide) {
            window.lucide.createIcons();
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
