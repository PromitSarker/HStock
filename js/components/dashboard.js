window.components.dashboard = {
  render(data) {
    const container = document.createElement("div");
    container.className = "dashboard-container";

    // Summary Stats
    const stats = this.calculateStats(data);
    const statsHTML = `
            <div class="stats-grid">
                <div class="card stat-card">
                    <div class="stat-icon" style="background: #e0e7ff; color: #6366f1;">
                        <i data-lucide="package"></i>
                    </div>
                    <div class="stat-info">
                        <h3>${stats.totalStock}</h3>
                        <p>${app.t('inventory')}</p>
                    </div>
                </div>
                <div class="card stat-card">
                    <div class="stat-icon" style="background: #fef3c7; color: #f59e0b;">
                        <i data-lucide="truck"></i>
                    </div>
                    <div class="stat-info">
                        <h3>${stats.pendingDeliveries}</h3>
                        <p>${app.t('deliveries')}</p>
                    </div>
                </div>
                <div class="card stat-card">
                    <div class="stat-icon" style="background: #d1fae5; color: #10b981;">
                        <i data-lucide="circle-dollar-sign"></i>
                    </div>
                    <div class="stat-info">
                        <h3>${app.state.currency}${stats.totalValuation.toFixed(2)}</h3>
                        <p>${app.t('totalInventoryValue')}</p>
                    </div>
                </div>
                <div class="card stat-card">
                    <div class="stat-icon" style="background: #fee2e2; color: #ef4444;">
                        <i data-lucide="alert-circle"></i>
                    </div>
                    <div class="stat-info">
                        <h3>${stats.lowStockItems}</h3>
                        <p>${app.t('lowStockAlerts')}</p>
                    </div>
                </div>
            </div>

            <div class="dashboard-sections">
                <div class="card recent-deliveries">
                    <div class="card-header">
                        <h2>${app.t('deliveries')}</h2>
                        <button class="btn-text" onclick="app.navigate('deliveries')">${app.t('viewAll') || 'View All'}</button>
                    </div>
                    <div class="table-container">
                        <table class="table">
                            <thead>
                                <tr>
                                    <th>${app.t('recipient')}</th>
                                    <th>${app.t('status')}</th>
                                    <th>${app.t('date')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${data.deliveries
                                  .slice(0, 5)
                                  .map(
                                    (delivery) => `
                                    <tr>
                                        <td>${delivery.recipient}</td>
                                        <td><span class="badge ${this.getStatusBadgeClass(delivery.status)}">${delivery.status}</span></td>
                                        <td>${delivery.date}</td>
                                    </tr>
                                `,
                                  )
                                  .join("")}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;

    container.innerHTML = statsHTML;
    return container;
  },

  calculateStats(data) {
    let valuation = 0;
    data.inventory.forEach((i) => {
      // Find latest unit cost from procurements
      const procs = (data.procurements || [])
        .filter((p) => p.productId === i.id)
        .sort((a, b) => b.id - a.id);
      const unitCost = procs.length ? procs[0].unitCost : 0;
      valuation += i.stock * unitCost;
    });

    return {
      totalStock: data.inventory.reduce((acc, item) => acc + item.stock, 0),
      pendingDeliveries: data.deliveries.filter((d) => d.status === "Pending")
        .length,
      totalValuation: valuation,
      lowStockItems: data.inventory.filter((i) => i.stock <= (i.minAlert || 5))
        .length,
    };
  },

  getStatusBadgeClass(status) {
    switch (status.toLowerCase()) {
      case "delivered":
        return "badge-success";
      case "pending":
        return "badge-warning";
      case "active":
        return "badge-success";
      case "on leave":
        return "badge-warning";
      default:
        return "";
    }
  },
};
