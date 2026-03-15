window.components.dashboard = {
    render(data) {
        const container = document.createElement('div');
        container.className = 'dashboard-container';

        // Summary Stats
        const stats = this.calculateStats(data);
        const statsHTML = `
            <div class="stats-grid">
                <div class="card stat-card">
                    <div class="stat-icon" style="background: #e8f0fe; color: #1a73e8;">
                        <i data-lucide="package"></i>
                    </div>
                    <div class="stat-info">
                        <h3>${stats.totalStock}</h3>
                        <p>Total Stock</p>
                    </div>
                </div>
                <div class="card stat-card">
                    <div class="stat-icon" style="background: #fef7e0; color: #f9ab00;">
                        <i data-lucide="truck"></i>
                    </div>
                    <div class="stat-info">
                        <h3>${stats.pendingDeliveries}</h3>
                        <p>Pending Deliveries</p>
                    </div>
                </div>
                <div class="card stat-card">
                    <div class="stat-icon" style="background: #e6f4ea; color: #1e8e3e;">
                        <i data-lucide="circle-dollar-sign"></i>
                    </div>
                    <div class="stat-info">
                        <h3>$${stats.totalValuation.toFixed(2)}</h3>
                        <p>Total Stock Valuation</p>
                    </div>
                </div>
                <div class="card stat-card">
                    <div class="stat-icon" style="background: #fce8e6; color: #d93025;">
                        <i data-lucide="alert-circle"></i>
                    </div>
                    <div class="stat-info">
                        <h3>${stats.lowStockItems}</h3>
                        <p>Low Stock Alerts</p>
                    </div>
                </div>
            </div>

            <div class="dashboard-sections">
                <div class="card recent-deliveries">
                    <div class="card-header">
                        <h2>Recent Deliveries</h2>
                        <button class="btn-text" onclick="app.navigate('deliveries')">View All</button>
                    </div>
                    <table class="table">
                        <thead>
                            <tr>
                                <th>Recipient</th>
                                <th>Status</th>
                                <th>Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${data.deliveries.slice(0, 5).map(delivery => `
                                <tr>
                                    <td>${delivery.recipient}</td>
                                    <td><span class="badge ${this.getStatusBadgeClass(delivery.status)}">${delivery.status}</span></td>
                                    <td>${delivery.date}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;

        container.innerHTML = statsHTML;
        return container;
    },

    calculateStats(data) {
        let valuation = 0;
        data.inventory.forEach(i => {
            // Find latest unit cost from procurements
            const procs = (data.procurements || []).filter(p => p.productId === i.id).sort((a,b) => b.id - a.id);
            const unitCost = procs.length ? procs[0].unitCost : 0;
            valuation += (i.stock * unitCost);
        });

        return {
            totalStock: data.inventory.reduce((acc, item) => acc + item.stock, 0),
            pendingDeliveries: data.deliveries.filter(d => d.status === 'Pending').length,
            totalValuation: valuation,
            lowStockItems: data.inventory.filter(i => i.stock <= (i.minAlert || 5)).length
        };
    },

    getStatusBadgeClass(status) {
        switch (status.toLowerCase()) {
            case 'delivered': return 'badge-success';
            case 'pending': return 'badge-warning';
            case 'active': return 'badge-success';
            case 'on leave': return 'badge-warning';
            default: return '';
        }
    }
};
