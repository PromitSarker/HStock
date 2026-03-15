window.components.deliveries = {
    state: {
        draftItems: []
    },

    render(data) {
        const container = document.createElement('div');
        container.className = 'deliveries-container';

        const deliveriesHTML = `
            <div class="action-bar card">
                <button class="btn btn-primary" onclick="components.deliveries.showModal()">
                    <i data-lucide="package-minus"></i> New Distribution
                </button>
            </div>
            
            <div class="card">
                <div class="table-container">
                    <table class="table">
                        <thead>
                            <tr>
                                <th>Transaction ID</th>
                                <th>Date</th>
                                <th>Recipient</th>
                                <th>Items</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                        ${data.deliveries.map(delivery => {
                            const items = typeof delivery.items === 'string' ? JSON.parse(delivery.items) : (delivery.items || []);
                            const itemsText = items.map(item => {
                                const prod = data.inventory.find(i => i.id === item.productId);
                                return prod ? `${prod.name} (x${item.quantity})` : 'Unknown Item';
                            }).join(', ');

                            return `
                                <tr>
                                    <td>#${delivery.id}</td>
                                    <td>${delivery.date}</td>
                                    <td style="font-weight: 600;">${delivery.recipient}</td>
                                    <td style="font-size: 14px; color: var(--text-secondary);">${itemsText || delivery.products || 'No items'}</td>
                                    <td><span class="badge ${this.getStatusBadgeClass(delivery.status)}">${delivery.status}</span></td>
                                    <td>
                                        <div class="actions">
                                            <button class="btn-icon" title="Print Slip" onclick="components.deliveries.printSlip(${delivery.id})">
                                                <i data-lucide="printer"></i>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            </div>
        </div>
            <div id="modal-container-deliveries"></div>
        `;

        container.innerHTML = deliveriesHTML;
        return container;
    },

    async showModal() {
        this.state.draftItems = [];
        await this.renderModal();
    },

    async renderModal() {
        const data = await window.dataStore.load();
        const modalContainer = document.getElementById('modal-container-deliveries');
        
        let totalVal = 0;
        const draftItemsHTML = this.state.draftItems.map((item, index) => {
            const prod = data.inventory.find(i => i.id === item.productId);
            const lineTotal = item.quantity * item.distributionPrice;
            totalVal += lineTotal;
            return `
                <div style="display: flex; justify-content: space-between; padding: 8px; border-bottom: 1px solid var(--border-color); align-items: center;">
                    <div>
                        <strong>${prod ? prod.name : 'Item'}</strong> <br>
                        <small class="text-secondary">${item.quantity} x $${item.distributionPrice.toFixed(2)}</small>
                    </div>
                    <div style="display: flex; align-items: center; gap: 12px;">
                        <span style="font-weight: 600;">$${lineTotal.toFixed(2)}</span>
                        <button type="button" class="btn-icon text-danger" onclick="components.deliveries.removeDraftItem(${index})"><i data-lucide="trash-2" style="width: 16px; height: 16px;"></i></button>
                    </div>
                </div>
            `;
        }).join('') || '<div style="padding: 12px; text-align: center; color: var(--text-secondary);">No items added yet.</div>';

        modalContainer.innerHTML = `
            <div class="modal-overlay">
                <div class="modal-content fade-in" style="max-width: 600px; max-height: 90vh; overflow-y: auto;">
                    <div class="modal-header">
                        <h2>New Distribution (Stock Out)</h2>
                        <button class="btn-icon" onclick="components.deliveries.closeModal()">
                            <i data-lucide="x"></i>
                        </button>
                    </div>
                    
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 24px;">
                        <div class="form-group">
                            <label>Recipient Name</label>
                            <input type="text" id="dist-recipient" class="form-input" placeholder="e.g. John Doe">
                        </div>
                        <div class="form-group">
                            <label>Date & Time</label>
                            <input type="datetime-local" id="dist-date" class="form-input" value="${new Date().toISOString().slice(0,16)}">
                        </div>
                    </div>

                    <div style="border: 1px solid var(--border-color); padding: 16px; border-radius: 8px; margin-bottom: 24px; background: #f8f9fa;">
                        <h3 style="font-size: 16px; margin-bottom: 12px;">Add Item</h3>
                        <div style="display: grid; grid-template-columns: 2fr 1fr 1fr; gap: 12px;">
                            <select id="dist-product" class="form-input">
                                <option value="">-- Select Product --</option>
                                ${data.inventory.filter(i => i.stock > 0).map(i => `<option value="${i.id}">${i.name} (${i.stock} in stock)</option>`).join('')}
                            </select>
                            <input type="number" id="dist-qty" class="form-input" placeholder="Qty" min="1">
                            <input type="number" id="dist-price" class="form-input" placeholder="Price ($)" step="0.01">
                        </div>
                        <button type="button" class="btn btn-secondary" style="margin-top: 12px; font-size: 14px; padding: 8px 16px; background: white; border: 1px solid var(--border-color);" onclick="components.deliveries.addDraftItem()">
                            Add to List
                        </button>
                    </div>

                    <div style="margin-bottom: 24px;">
                        <h3 style="font-size: 16px; margin-bottom: 12px; border-bottom: 2px solid var(--border-color); padding-bottom: 8px;">Items List</h3>
                        ${draftItemsHTML}
                        <div style="text-align: right; margin-top: 12px; font-weight: 700; font-size: 18px;">
                            Total: $${totalVal.toFixed(2)}
                        </div>
                    </div>

                    <div class="settings-actions">
                        <button type="button" class="btn btn-primary" style="width: 100%; justify-content: center;" onclick="components.deliveries.handleSubmit()">Complete Distribution</button>
                    </div>
                </div>
            </div>
        `;
        
        if (window.lucide) window.lucide.createIcons();
    },

    async addDraftItem() {
        const prodId = document.getElementById('dist-product').value;
        const qty = parseInt(document.getElementById('dist-qty').value);
        const price = parseFloat(document.getElementById('dist-price').value);

        if(!prodId || !qty || isNaN(price)) {
            alert('Please select a product and fill valid quantity/price.');
            return;
        }

        const data = await window.dataStore.load();
        const prod = data.inventory.find(i => i.id == prodId);
        if(qty > prod.stock) {
            alert(`Cannot distribute more than available stock (${prod.stock}).`);
            return;
        }

        this.state.draftItems.push({
            productId: parseInt(prodId),
            quantity: qty,
            distributionPrice: price
        });
        
        await this.renderModal();
    },

    async removeDraftItem(index) {
        this.state.draftItems.splice(index, 1);
        await this.renderModal();
    },

    closeModal() {
        document.getElementById('modal-container-deliveries').innerHTML = '';
    },

    async handleSubmit() {
        const recipient = document.getElementById('dist-recipient').value;
        const rawDate = document.getElementById('dist-date').value;

        if(!recipient || !rawDate) {
            alert('Please fill recipient and date.');
            return;
        }

        if(this.state.draftItems.length === 0) {
            alert('Please add at least one item.');
            return;
        }

        const formattedDate = new Date(rawDate).toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        const newDistribution = {
            date: formattedDate,
            recipient: recipient,
            items: [...this.state.draftItems]
        };

        await window.dataStore.createItem('deliveries', newDistribution);

        const freshData = await window.dataStore.load();
        app.state.data = freshData;
        app.render();
        this.closeModal();
    },

    getStatusBadgeClass(status) {
        if (!status) return 'badge-success';
        switch (status.toLowerCase()) {
            case 'completed':
            case 'delivered': return 'badge-success';
            case 'pending': return 'badge-warning';
            default: return 'badge-success';
        }
    },

    async printSlip(id) {
        const data = await window.dataStore.load();
        const order = data.deliveries.find(d => d.id === id);
        if (!order) return;

        let itemsRows = '';
        let totalVal = 0;

        const items = Array.isArray(order.items) ? order.items : [];

        if (items.length > 0) {
            itemsRows = items.map(item => {
                const prod = data.inventory.find(i => i.id === item.productId);
                const lineTotal = item.quantity * item.distributionPrice;
                totalVal += lineTotal;
                return `
                    <tr>
                        <td>${prod ? prod.name : 'Unknown Product'}</td>
                        <td>${item.quantity}</td>
                        <td style="text-align: right;">$${item.distributionPrice.toFixed(2)}</td>
                        <td style="text-align: right;">$${lineTotal.toFixed(2)}</td>
                    </tr>
                `;
            }).join('');
        } else {
            itemsRows = `
                <tr>
                    <td colspan="4">${order.products || 'No items listed'}</td>
                </tr>
            `;
        }

        const invoiceWindow = window.open('', '_blank', 'width=800,height=600');
        const invoiceHTML = `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <title>Slip - #${order.id}</title>
                <style>
                    body { font-family: 'Inter', sans-serif; padding: 20px; color: #000; max-width: 400px; margin: 0 auto; }
                    .header { text-align: center; border-bottom: 2px dashed #000; padding-bottom: 10px; margin-bottom: 20px; }
                    .header h1 { margin: 0; font-size: 24px; }
                    .header p { margin: 4px 0; font-size: 14px; }
                    .details { font-size: 14px; margin-bottom: 20px; }
                    .details p { margin: 4px 0; }
                    .products-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 14px; }
                    .products-table th, .products-table td { padding: 8px 0; text-align: left; }
                    .products-table th { border-bottom: 1px solid #000; }
                    .total-row { border-top: 2px dashed #000; font-weight: bold; font-size: 18px; }
                    .footer { text-align: center; font-size: 12px; margin-top: 30px; }
                    @media print {
                        body { padding: 0; }
                    }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>HomeoStock</h1>
                    <p>Transaction Receipt</p>
                </div>

                <div class="details">
                    <p><strong>Recpt ID:</strong> #${order.id}</p>
                    <p><strong>Date:</strong> ${order.date}</p>
                    <p><strong>To:</strong> ${order.recipient}</p>
                </div>

                <table class="products-table">
                    <thead>
                        <tr>
                            <th>Item</th>
                            <th>Qty</th>
                            <th style="text-align: right;">Price</th>
                            <th style="text-align: right;">Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${itemsRows}
                        <tr class="total-row">
                            <td colspan="3" style="padding-top: 12px;">Total:</td>
                            <td style="text-align: right; padding-top: 12px;">$${totalVal > 0 ? totalVal.toFixed(2) : '---'}</td>
                        </tr>
                    </tbody>
                </table>

                <div class="footer">
                    <p>Thank You</p>
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
