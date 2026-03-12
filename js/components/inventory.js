window.components.inventory = {
    render(data) {
        const container = document.createElement('div');
        container.className = 'inventory-container';

        const inventoryHTML = `
            <div class="action-bar card" style="display: flex; justify-content: space-between; align-items: center;">
                <button class="btn btn-primary" onclick="components.inventory.showModal()">
                    <i data-lucide="plus"></i> Add New Medicine
                </button>
                <div class="stats-mini">
                    <span class="badge badge-warning">${data.inventory.filter(i => i.stock < 5).length} Low Stock</span>
                </div>
            </div>
            
            <div class="card">
                <table class="table">
                    <thead>
                        <tr>
                            <th>Medicine Name</th>
                            <th>Potency</th>
                            <th>Batch</th>
                            <th>Stock</th>
                            <th>Expiry</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody id="inventory-list">
                        ${data.inventory.map(item => `
                            <tr class="${item.stock < 5 ? 'low-stock-row' : ''}">
                                <td style="font-weight: 600;">${item.name}</td>
                                <td>${item.potency}</td>
                                <td><code>${item.batch}</code></td>
                                <td>
                                    <span class="${item.stock < 5 ? 'text-danger' : ''}" style="font-weight: 700;">
                                        ${item.stock}
                                    </span>
                                </td>
                                <td>${item.expiry}</td>
                                <td>
                                    <div class="actions">
                                        <button class="btn-icon" onclick="components.inventory.showModal(${item.id})">
                                            <i data-lucide="edit-2"></i>
                                        </button>
                                        <button class="btn-icon text-danger" onclick="components.inventory.deleteItem(${item.id})">
                                            <i data-lucide="trash-2"></i>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
            <div id="modal-container"></div>
        `;

        container.innerHTML = inventoryHTML;
        return container;
    },

    showModal(id = null) {
        const data = window.dataStore.load();
        const item = id ? data.inventory.find(i => i.id === id) : { name: '', potency: '', batch: '', stock: 0, expiry: '' };
        
        const modalContainer = document.getElementById('modal-container');
        modalContainer.innerHTML = `
            <div class="modal-overlay">
                <div class="modal-content fade-in">
                    <div class="modal-header">
                        <h2>${id ? 'Edit Medicine' : 'Add New Medicine'}</h2>
                        <button class="btn-icon" onclick="components.inventory.closeModal()">
                            <i data-lucide="x"></i>
                        </button>
                    </div>
                    <form id="medicine-form" onsubmit="components.inventory.handleSubmit(event, ${id})">
                        <div class="form-group">
                            <label>Medicine Name</label>
                            <input type="text" name="name" class="form-input" value="${item.name}" required>
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
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
                            <div class="form-group">
                                <label>Current Stock</label>
                                <input type="number" name="stock" class="form-input" value="${item.stock}" required>
                            </div>
                            <div class="form-group">
                                <label>Expiry Date</label>
                                <input type="date" name="expiry" class="form-input" value="${item.expiry}" required>
                            </div>
                        </div>
                        <div class="settings-actions">
                            <button type="submit" class="btn btn-primary">
                                ${id ? 'Update Medicine' : 'Save Medicine'}
                            </button>
                            <button type="button" class="btn" onclick="components.inventory.closeModal()">Cancel</button>
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

    handleSubmit(event, id) {
        event.preventDefault();
        const formData = new FormData(event.target);
        const newData = {
            id: id || Date.now(),
            name: formData.get('name'),
            potency: formData.get('potency'),
            batch: formData.get('batch'),
            stock: parseInt(formData.get('stock')),
            expiry: formData.get('expiry')
        };

        const data = window.dataStore.load();
        if (id) {
            const index = data.inventory.findIndex(i => i.id === id);
            data.inventory[index] = newData;
        } else {
            data.inventory.unshift(newData);
        }

        window.dataStore.save(data);
        app.state.data = data;
        app.render();
        this.closeModal();
    },

    deleteItem(id) {
        if (confirm('Are you sure you want to delete this medicine?')) {
            const data = window.dataStore.load();
            data.inventory = data.inventory.filter(i => i.id !== id);
            window.dataStore.save(data);
            app.state.data = data;
            app.render();
        }
    },

    handleSearch(query) {
        const listContainer = document.getElementById('inventory-list');
        if (!listContainer) return;

        const items = app.state.data.inventory;
        const filtered = items.filter(item => 
            item.name.toLowerCase().includes(query.toLowerCase()) || 
            item.batch.toLowerCase().includes(query.toLowerCase())
        );

        listContainer.innerHTML = filtered.map(item => `
            <tr class="${item.stock < 5 ? 'low-stock-row' : ''}">
                <td style="font-weight: 600;">${item.name}</td>
                <td>${item.potency}</td>
                <td><code>${item.batch}</code></td>
                <td>
                    <span class="${item.stock < 5 ? 'text-danger' : ''}" style="font-weight: 700;">
                        ${item.stock}
                    </span>
                </td>
                <td>${item.expiry}</td>
                <td>
                    <div class="actions">
                        <button class="btn-icon" onclick="components.inventory.showModal(${item.id})">
                            <i data-lucide="edit-2"></i>
                        </button>
                        <button class="btn-icon text-danger" onclick="components.inventory.deleteItem(${item.id})">
                            <i data-lucide="trash-2"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
        
        if (window.lucide) window.lucide.createIcons();
    }
};
