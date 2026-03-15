window.components.inventory = {
    render(data) {
        const container = document.createElement('div');
        container.className = 'inventory-container';

        // Helper to get latest unit cost for an item
        const getUnitCost = (itemId) => {
            const procs = (data.procurements || []).filter(p => p.productId === itemId).sort((a,b) => b.id - a.id);
            return procs.length ? procs[0].unitCost : 0;
        };

        const lowStockCount = data.inventory.filter(i => i.stock <= (i.minAlert || 5)).length;

        const inventoryHTML = `
            <div class="action-bar card" style="display: flex; justify-content: space-between; align-items: center;">
                <button class="btn btn-primary" onclick="components.inventory.showModal()">
                    <i data-lucide="plus"></i> Add New Medicine
                </button>
                <div class="stats-mini">
                    <span class="badge badge-warning">${lowStockCount} Low Stock</span>
                </div>
            </div>
            
            <div class="card">
                <table class="table">
                    <thead>
                        <tr>
                            <th>Medicine & Cat</th>
                            <th>Potency/Batch</th>
                            <th>Stock & UoM</th>
                            <th>Unit Cost</th>
                            <th>Valuation</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody id="inventory-list">
                        ${data.inventory.map(item => {
                            const unitCost = getUnitCost(item.id);
                            const valuation = item.stock * unitCost;
                            const isLowStock = item.stock <= (item.minAlert || 5);
                            return `
                                <tr class="${isLowStock ? 'low-stock-row' : ''}">
                                    <td>
                                        <div style="font-weight: 600;">${item.name}</div>
                                        <div style="font-size: 12px; color: var(--text-secondary);">${item.category || 'N/A'}</div>
                                    </td>
                                    <td>
                                        <div>${item.potency}</div>
                                        <div style="font-size: 12px; color: var(--text-secondary);"><code>${item.batch}</code></div>
                                    </td>
                                    <td>
                                        <span class="${isLowStock ? 'text-danger' : ''}" style="font-weight: 700;">
                                            ${item.stock} ${item.uom || 'pcs'}
                                        </span>
                                    </td>
                                    <td>$${unitCost.toFixed(2)}</td>
                                    <td style="font-weight: 600;">$${valuation.toFixed(2)}</td>
                                    <td>
                                        <div class="actions">
                                            <button class="btn-icon" title="Edit Medicine" onclick="components.inventory.showModal(${item.id})">
                                                <i data-lucide="edit-2"></i>
                                            </button>
                                            <button class="btn-icon text-warning" title="Adjust Stock (Audit)" onclick="components.inventory.adjustStock(${item.id})">
                                                <i data-lucide="sliders-horizontal"></i>
                                            </button>
                                            <button class="btn-icon text-danger" title="Delete" onclick="components.inventory.deleteItem(${item.id})">
                                                <i data-lucide="trash-2"></i>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            </div>
            <div id="modal-container"></div>
        `;

        container.innerHTML = inventoryHTML;
        return container;
    },

    async showModal(id = null) {
        const data = await window.dataStore.load();
        const item = id ? data.inventory.find(i => i.id === id) : { 
            name: '', category: 'Dilution', potency: '', batch: '', stock: 0, uom: 'pcs', minAlert: 5, expiry: '' 
        };
        
        const modalContainer = document.getElementById('modal-container');
        modalContainer.innerHTML = `
            <div class="modal-overlay">
                <div class="modal-content fade-in" style="max-width: 600px;">
                    <div class="modal-header">
                        <h2>${id ? 'Edit Medicine' : 'Add New Medicine'}</h2>
                        <button class="btn-icon" onclick="components.inventory.closeModal()">
                            <i data-lucide="x"></i>
                        </button>
                    </div>
                    <form id="medicine-form" onsubmit="components.inventory.handleSubmit(event, ${id})">
                        <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 16px;">
                            <div class="form-group">
                                <label>Medicine Name</label>
                                <input type="text" name="name" class="form-input" value="${item.name}" required>
                            </div>
                            <div class="form-group">
                                <label>Category</label>
                                <select name="category" class="form-input" required>
                                    <option value="Dilution" ${item.category === 'Dilution' ? 'selected' : ''}>Dilution</option>
                                    <option value="Mother Tincture" ${item.category === 'Mother Tincture' ? 'selected' : ''}>Mother Tincture</option>
                                    <option value="Trituration" ${item.category === 'Trituration' ? 'selected' : ''}>Trituration</option>
                                    <option value="Biochemic" ${item.category === 'Biochemic' ? 'selected' : ''}>Biochemic</option>
                                    <option value="Patent" ${item.category === 'Patent' ? 'selected' : ''}>Patent</option>
                                </select>
                            </div>
                        </div>
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
                            <div class="form-group">
                                <label>Potency</label>
                                <input type="text" name="potency" class="form-input" value="${item.potency}" placeholder="e.g. 30C" required>
                            </div>
                            <div class="form-group">
                                <label>Batch Number</label>
                                <input type="text" name="batch" class="form-input" value="${item.batch}" required>
                            </div>
                        </div>
                        <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px;">
                            <div class="form-group">
                                <label>Current Stock</label>
                                <input type="number" name="stock" class="form-input" value="${item.stock}" required>
                            </div>
                            <div class="form-group">
                                <label>Unit of Measure</label>
                                <input type="text" name="uom" class="form-input" value="${item.uom || 'pcs'}" required>
                            </div>
                            <div class="form-group">
                                <label>Min Alert Level</label>
                                <input type="number" name="minAlert" class="form-input" value="${item.minAlert || 5}" required>
                            </div>
                        </div>
                        <div class="form-group">
                            <label>Expiry Date</label>
                            <input type="date" name="expiry" class="form-input" value="${item.expiry}" required>
                        </div>
                        <div class="settings-actions">
                            <button type="submit" class="btn btn-primary" style="width: 100%; justify-content: center;">
                                ${id ? 'Update Medicine' : 'Save Medicine'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        `;
        
        if (window.lucide) window.lucide.createIcons();
    },

    closeModal() {
        document.getElementById('modal-container').innerHTML = '';
    },

    async handleSubmit(event, id) {
        event.preventDefault();
        const formData = new FormData(event.target);
        const data = await window.dataStore.load();
        
        let oldStock = 0;
        if (id) {
            const existing = data.inventory.find(i => i.id === id);
            oldStock = existing ? existing.stock : 0;
        }

        const newStock = parseInt(formData.get('stock'));

        const newData = {
            name: formData.get('name'),
            category: formData.get('category'),
            potency: formData.get('potency'),
            batch: formData.get('batch'),
            stock: newStock,
            uom: formData.get('uom'),
            minAlert: parseInt(formData.get('minAlert')),
            expiry: formData.get('expiry')
        };

        if (id) {
            await window.dataStore.updateItem('inventory', id, newData);
            if(oldStock !== newStock) {
                await window.dataStore.createItem('audit-logs', {
                    date: new Date().toISOString(),
                    action: 'Manual Stock Edit',
                    details: `Edited ${newData.name} stock from ${oldStock} to ${newStock}`,
                    user: 'Admin'
                });
            }
        } else {
            await window.dataStore.createItem('inventory', newData);
        }

        const freshData = await window.dataStore.load();
        app.state.data = freshData;
        app.render();
        this.closeModal();
    },

    async adjustStock(id) {
        const data = await window.dataStore.load();
        const item = data.inventory.find(i => i.id === id);
        if(!item) return;

        const newStockRaw = prompt(`Adjust stock for ${item.name} (Current: ${item.stock}${item.uom}):`, item.stock);
        if (newStockRaw === null) return;

        const newStock = parseInt(newStockRaw);
        if (isNaN(newStock) || newStock < 0) {
            alert('Please enter a valid positive number.');
            return;
        }

        if (newStock !== item.stock) {
            await window.dataStore.createItem('audit-logs', {
                date: new Date().toISOString(),
                action: 'Direct Stock Adjustment',
                details: `Adjusted ${item.name} stock from ${item.stock} to ${newStock}`,
                user: 'Admin'
            });

            const updateData = { ...item };
            delete updateData.id;
            updateData.stock = newStock;
            await window.dataStore.updateItem('inventory', id, updateData);

            const freshData = await window.dataStore.load();
            app.state.data = freshData;
            app.render();
        }
    },

    async deleteItem(id) {
        if (confirm('Are you sure you want to delete this medicine?')) {
            const data = await window.dataStore.load();
            const item = data.inventory.find(i => i.id === id);
            
            await window.dataStore.createItem('audit-logs', {
                date: new Date().toISOString(),
                action: 'Item Deleted',
                details: `Deleted ${item ? item.name : 'Unknown Item'}`,
                user: 'Admin'
            });

            await window.dataStore.deleteItem('inventory', id);

            const freshData = await window.dataStore.load();
            app.state.data = freshData;
            app.render();
        }
    },

    handleSearch(query) {
        const listContainer = document.getElementById('inventory-list');
        if (!listContainer) return;

        const data = app.state.data;
        const items = data.inventory;
        const filtered = items.filter(item => 
            item.name.toLowerCase().includes(query.toLowerCase()) || 
            item.batch.toLowerCase().includes(query.toLowerCase()) ||
            (item.category || '').toLowerCase().includes(query.toLowerCase())
        );

        const getUnitCost = (itemId) => {
            const procs = (data.procurements || []).filter(p => p.productId === itemId).sort((a,b) => b.id - a.id);
            return procs.length ? procs[0].unitCost : 0;
        };

        listContainer.innerHTML = filtered.map(item => {
            const unitCost = getUnitCost(item.id);
            const valuation = item.stock * unitCost;
            const isLowStock = item.stock <= (item.minAlert || 5);
            return `
                <tr class="${isLowStock ? 'low-stock-row' : ''}">
                    <td>
                        <div style="font-weight: 600;">${item.name}</div>
                        <div style="font-size: 12px; color: var(--text-secondary);">${item.category || 'N/A'}</div>
                    </td>
                    <td>
                        <div>${item.potency}</div>
                        <div style="font-size: 12px; color: var(--text-secondary);"><code>${item.batch}</code></div>
                    </td>
                    <td>
                        <span class="${isLowStock ? 'text-danger' : ''}" style="font-weight: 700;">
                            ${item.stock} ${item.uom || 'pcs'}
                        </span>
                    </td>
                    <td>$${unitCost.toFixed(2)}</td>
                    <td style="font-weight: 600;">$${valuation.toFixed(2)}</td>
                    <td>
                        <div class="actions">
                            <button class="btn-icon" title="Edit Medicine" onclick="components.inventory.showModal(${item.id})">
                                <i data-lucide="edit-2"></i>
                            </button>
                            <button class="btn-icon text-warning" title="Adjust Stock (Audit)" onclick="components.inventory.adjustStock(${item.id})">
                                <i data-lucide="sliders-horizontal"></i>
                            </button>
                            <button class="btn-icon text-danger" title="Delete" onclick="components.inventory.deleteItem(${item.id})">
                                <i data-lucide="trash-2"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
        
        if (window.lucide) window.lucide.createIcons();
    }
};
