window.components.deliveries = {
    render(data) {
        const container = document.createElement('div');
        container.className = 'deliveries-container';

        const deliveriesHTML = `
            <div class="action-bar card">
                <button class="btn btn-primary" onclick="components.deliveries.showModal()">
                    <i data-lucide="plus"></i> Add New Order
                </button>
            </div>
            
            <div class="card">
                <table class="table">
                    <thead>
                        <tr>
                            <th>Order ID</th>
                            <th>Date</th>
                            <th>Recipient</th>
                            <th>Products</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${data.deliveries.map(delivery => `
                            <tr>
                                <td>#${delivery.id}</td>
                                <td>${delivery.date}</td>
                                <td style="font-weight: 600;">${delivery.recipient}</td>
                                <td style="font-size: 14px; color: var(--text-secondary);">${delivery.products}</td>
                                <td><span class="badge ${this.getStatusBadgeClass(delivery.status)}">${delivery.status}</span></td>
                                <td>
                                    <div class="actions">
                                        <button class="btn-text" onclick="components.deliveries.updateStatus(${delivery.id})">
                                            Update Status
                                        </button>
                                        <button class="btn-icon" title="Download Invoice" onclick="components.deliveries.downloadInvoice(${delivery.id})">
                                            <i data-lucide="download"></i>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
            <div id="modal-container-deliveries"></div>
        `;

        container.innerHTML = deliveriesHTML;
        return container;
    },

    showModal() {
        const modalContainer = document.getElementById('modal-container-deliveries');
        modalContainer.innerHTML = `
            <div class="modal-overlay">
                <div class="modal-content fade-in">
                    <div class="modal-header">
                        <h2>Add New Order</h2>
                        <button class="btn-icon" onclick="components.deliveries.closeModal()">
                            <i data-lucide="x"></i>
                        </button>
                    </div>
                    <form id="delivery-form" onsubmit="components.deliveries.handleSubmit(event)">
                        <div class="form-group">
                            <label>Recipient Name</label>
                            <input type="text" name="recipient" class="form-input" placeholder="e.g. John Doe" required>
                        </div>
                        <div class="form-group">
                            <label>Products</label>
                            <textarea name="products" class="form-input" style="height: 80px;" placeholder="e.g. Arnica (x2), Rhus Tox (x1)" required></textarea>
                        </div>
                        <div class="form-group">
                            <label>Date & Time</label>
                            <input type="datetime-local" name="date" class="form-input" required>
                        </div>
                        <div class="settings-actions">
                            <button type="submit" class="btn btn-primary">Save Order</button>
                            <button type="button" class="btn" onclick="components.deliveries.closeModal()">Cancel</button>
                        </div>
                    </form>
                </div>
            </div>
        `;
        
        if (window.lucide) window.lucide.createIcons();
    },

    closeModal() {
        document.getElementById('modal-container-deliveries').innerHTML = '';
    },

    handleSubmit(event) {
        event.preventDefault();
        const formData = new FormData(event.target);
        
        // Format date for display
        const rawDate = formData.get('date');
        const formattedDate = new Date(rawDate).toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        const newOrder = {
            id: Math.floor(1000 + Math.random() * 9000),
            date: formattedDate,
            recipient: formData.get('recipient'),
            products: formData.get('products'),
            status: 'Pending'
        };

        const data = window.dataStore.load();
        data.deliveries.unshift(newOrder);
        window.dataStore.save(data);
        app.state.data = data;
        app.render();
        this.closeModal();
    },

    getStatusBadgeClass(status) {
        switch (status.toLowerCase()) {
            case 'delivered': return 'badge-success';
            case 'pending': return 'badge-warning';
            default: return '';
        }
    },

    updateStatus(id) {
        const data = window.dataStore.load();
        const delivery = data.deliveries.find(d => d.id === id);
        if (delivery) {
            delivery.status = delivery.status === 'Pending' ? 'Delivered' : 'Pending';
            window.dataStore.update('deliveries', data.deliveries); // Sync update
            app.state.data = data;
            app.render();
        }
    },

    downloadInvoice(id) {
        const data = window.dataStore.load();
        const order = data.deliveries.find(d => d.id === id);
        if (!order) return;

        const invoiceWindow = window.open('', '_blank');
        const invoiceHTML = `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <title>Invoice - Order #${order.id}</title>
                <style>
                    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; color: #333; }
                    .header { display: flex; justify-content: space-between; border-bottom: 2px solid #eee; padding-bottom: 20px; margin-bottom: 40px; }
                    .company-info h1 { margin: 0; color: #1a73e8; }
                    .invoice-details { text-align: right; }
                    .bill-to { margin-bottom: 40px; }
                    .products-table { width: 100%; border-collapse: collapse; margin-bottom: 40px; }
                    .products-table th, .products-table td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
                    .products-table th { background-color: #f8f9fa; }
                    .footer { text-align: center; color: #666; font-size: 14px; margin-top: 60px; border-top: 1px solid #eee; padding-top: 20px; }
                </style>
            </head>
            <body>
                <div class="header">
                    <div class="company-info">
                        <h1>HomeoStock</h1>
                        <p>123 Healing Way<br>Wellness City, HC 12345</p>
                    </div>
                    <div class="invoice-details">
                        <h2>INVOICE</h2>
                        <p><strong>Order ID:</strong> #${order.id}</p>
                        <p><strong>Date:</strong> ${order.date}</p>
                        <p><strong>Status:</strong> ${order.status}</p>
                    </div>
                </div>

                <div class="bill-to">
                    <h3>Bill To:</h3>
                    <p><strong>${order.recipient}</strong></p>
                </div>

                <table class="products-table">
                    <thead>
                        <tr>
                            <th>Description / Products</th>
                            <th style="text-align: right;">Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>${order.products.split(',').join('<br>')}</td>
                            <td style="text-align: right;">Calculated at checkout</td>
                        </tr>
                    </tbody>
                </table>

                <div class="footer">
                    <p>Thank you for your business. For any questions regarding this invoice, please contact support@homeostock.com.</p>
                </div>
                
                <script>
                    window.onload = function() { window.print(); }
                </script>
            </body>
            </html>
        `;

        invoiceWindow.document.write(invoiceHTML);
        invoiceWindow.document.close();
    }
};
