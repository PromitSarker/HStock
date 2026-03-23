window.components.inventory = {
  state: {
    filterLowStock: false,
  },

  render(data) {
    const container = document.createElement("div");
    container.className = "inventory-container";

    const lowStockCount = data.inventory.filter((i) => i.stock <= 5).length;

    const inventoryHTML = `
            <div class="action-bar card">
                <div class="justify-between">
                    <button class="btn btn-primary" onclick="components.inventory.showModal()">
                        <i data-lucide="plus"></i> ${app.t('addMedicine')}
                    </button>
                    ${
                      lowStockCount > 0
                        ? `<span class="badge badge-warning clickable ${this.state.filterLowStock ? "active" : ""}" 
                             onclick="components.inventory.toggleLowStockFilter()" 
                             title="${app.t('lowStockItems')}">
                             ${lowStockCount} ${lowStockCount > 1 ? app.t('lowStockItems') : app.t('lowStockItem')}
                           </span>`
                        : ""
                    }
                </div>
            </div>
            
            <div class="card">
                <div class="table-container">
                    <table class="table">
                        <thead>
                            <tr>
                                <th>${app.t('medicine')}</th>
                                <th>${app.t('potencyBatch')}</th>
                                <th>${app.t('stockUom')}</th>
                                <th>${app.t('unitCost')}</th>
                                <th>${app.t('valuation')}</th>
                                <th>${app.t('actions')}</th>
                            </tr>
                        </thead>
                        <tbody id="inventory-list">
                            ${this.renderTableBody(data)}
                        </tbody>
                    </table>
                </div>
            </div>
            <div id="modal-container"></div>
        `;

    container.innerHTML = inventoryHTML;
    return container;
  },

  renderTableBody(data) {
    let items = [...data.inventory];

    if (this.state.filterLowStock) {
      items = items
        .filter((i) => i.stock <= 5)
        .sort((a, b) => a.stock - b.stock);
    }

    const getUnitCost = (itemId) => {
      const procs = (data.procurements || [])
        .filter((p) => p.productId === itemId)
        .sort((a, b) => b.id - a.id);
      return procs.length ? procs[0].unitCost : 0;
    };

    if (items.length === 0) {
      return `<tr><td colspan="6" style="text-align: center; padding: 40px; color: var(--text-secondary);">No items found.</td></tr>`;
    }

    return items
      .map((item) => {
        const unitCost = getUnitCost(item.id);
        const valuation = item.stock * unitCost;
        const isLowStock = item.stock <= 5;
        return `
                <tr class="${isLowStock ? "low-stock-row" : ""}">
                    <td>
                        <div style="font-weight: 600;">${item.name}</div>
                    </td>
                    <td>
                        <div>${item.potency}</div>
                        <div style="font-size: 12px; color: var(--text-secondary);"><code>${item.batch}</code></div>
                    </td>
                    <td class="${item.stock <= 5 ? "text-danger font-700" : ""}">
                        ${item.stock} ${item.uom || "pcs"}
                        ${item.stock <= 5 ? '<i data-lucide="alert-triangle" class="icon-inline text-danger"></i>' : ""}
                    </td>
                    <td>${app.state.currency}${unitCost.toFixed(2)}</td>
                    <td style="font-weight: 600;">${app.state.currency}${valuation.toFixed(2)}</td>
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
      })
      .join("");
  },

  async toggleLowStockFilter() {
    this.state.filterLowStock = !this.state.filterLowStock;
    const data = await window.dataStore.load();
    const listContainer = document.getElementById("inventory-list");
    if (listContainer) {
      listContainer.innerHTML = this.renderTableBody(data);
      if (window.lucide) window.lucide.createIcons();
    }

    // Also update the badge visual state
    const badge = document.querySelector(".badge-warning.clickable");
    if (badge) {
      badge.classList.toggle("active", this.state.filterLowStock);
    }
  },

  async showModal(id = null) {
    const data = await window.dataStore.load();
    const item = id
      ? data.inventory.find((i) => i.id === id)
      : {
          name: "",
          potency: "",
          batch: "",
          stock: 0,
          uom: "pcs",
          minAlert: 5,
          expiry: "",
        };

    const modalContainer = document.getElementById("modal-container");
    modalContainer.innerHTML = `
            <div class="modal-overlay">
                <div class="modal-content fade-in" style="max-width: 600px;">
                    <div class="modal-header">
                        <h2>${id ? app.t('editMedicine') : app.t('addMedicine')}</h2>
                        <button class="icon-btn" onclick="components.inventory.closeModal()">
                            <i data-lucide="x"></i>
                        </button>
                    </div>
                    <form id="medicine-form" onsubmit="components.inventory.handleSubmit(event, ${id})">
                        <div class="form-group">
                            <label>${app.t('medicineName')}</label>
                            <input type="text" name="name" class="form-input" value="${item.name}" required>
                        </div>
                        <div class="form-grid form-grid-2">
                            <div class="form-group">
                                <label>${app.t('potency')}</label>
                                <input type="text" name="potency" class="form-input" value="${item.potency}" placeholder="e.g. 30C" required>
                            </div>
                            <div class="form-group">
                                <label>${app.t('batchNumber')}</label>
                                <input type="text" name="batch" class="form-input" value="${item.batch}" required>
                            </div>
                        </div>
                        <div class="form-grid form-grid-3">
                            <div class="form-group">
                                <label>${app.t('currentStock')}</label>
                                <input type="number" name="stock" class="form-input" value="${item.stock}" required>
                            </div>
                            <div class="form-group">
                                <label>${app.t('uom')}</label>
                                <input type="text" name="uom" class="form-input" value="${item.uom || "pcs"}" required>
                            </div>
                            <div class="form-group">
                                <label>${app.t('minAlert')}</label>
                                <input type="number" name="minAlert" class="form-input" value="${item.minAlert || 5}" required>
                            </div>
                        </div>
                        <div class="form-group">
                            <label>${app.t('expiryDate')}</label>
                            <input type="date" name="expiry" class="form-input" value="${item.expiry}" required>
                        </div>
                        <div class="settings-actions">
                            <button type="submit" class="btn btn-primary" style="width: 100%; justify-content: center;">
                                ${id ? app.t('updateMedicine') : app.t('saveMedicine')}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        `;

    if (window.lucide) window.lucide.createIcons();
  },

  closeModal() {
    document.getElementById("modal-container").innerHTML = "";
  },

  async handleSubmit(event, id) {
    event.preventDefault();
    const formData = new FormData(event.target);
    const data = await window.dataStore.load();

    let oldStock = 0;
    if (id) {
      const existing = data.inventory.find((i) => i.id === id);
      oldStock = existing ? existing.stock : 0;
    }

    const newStock = parseInt(formData.get("stock"));

    const newData = {
      name: formData.get("name"),
      potency: formData.get("potency"),
      batch: formData.get("batch"),
      stock: newStock,
      uom: formData.get("uom"),
      minAlert: parseInt(formData.get("minAlert")),
      expiry: formData.get("expiry"),
    };

    if (id) {
      await window.dataStore.updateItem("inventory", id, newData);
      if (oldStock !== newStock) {
        await window.dataStore.createItem("audit-logs", {
          date: new Date().toISOString(),
          action: "Manual Stock Edit",
          details: `Edited ${newData.name} stock from ${oldStock} to ${newStock}`,
          user: "Admin",
        });
      }
    } else {
      await window.dataStore.createItem("inventory", newData);
    }

    const freshData = await window.dataStore.load();
    app.state.data = freshData;
    app.render();
    this.closeModal();
  },

  async adjustStock(id) {
    const data = await window.dataStore.load();
    const item = data.inventory.find((i) => i.id === id);
    if (!item) return;

    const newStockRaw = prompt(
      `Adjust stock for ${item.name} (Current: ${item.stock}${item.uom}):`,
      item.stock,
    );
    if (newStockRaw === null) return;

    const newStock = parseInt(newStockRaw);
    if (isNaN(newStock) || newStock < 0) {
      alert("Please enter a valid positive number.");
      return;
    }

    if (newStock !== item.stock) {
      await window.dataStore.createItem("audit-logs", {
        date: new Date().toISOString(),
        action: "Direct Stock Adjustment",
        details: `Adjusted ${item.name} stock from ${item.stock} to ${newStock}`,
        user: "Admin",
      });

      const updateData = { ...item };
      delete updateData.id;
      updateData.stock = newStock;
      await window.dataStore.updateItem("inventory", id, updateData);

      const freshData = await window.dataStore.load();
      app.state.data = freshData;
      app.render();
    }
  },

  async deleteItem(id) {
    if (confirm("Are you sure you want to delete this medicine?")) {
      const data = await window.dataStore.load();
      const item = data.inventory.find((i) => i.id === id);

      await window.dataStore.createItem("audit-logs", {
        date: new Date().toISOString(),
        action: "Item Deleted",
        details: `Deleted ${item ? item.name : "Unknown Item"}`,
        user: "Admin",
      });

      await window.dataStore.deleteItem("inventory", id);

      const freshData = await window.dataStore.load();
      app.state.data = freshData;
      app.render();
    }
  },

  handleSearch(query) {
    const data = app.state.data;
    const items = data.inventory;
    const filtered = items.filter(
      (item) =>
        item.name.toLowerCase().includes(query.toLowerCase()) ||
        item.batch.toLowerCase().includes(query.toLowerCase()),
    );

    const listContainer = document.getElementById("inventory-list");
    if (listContainer) {
      listContainer.innerHTML = this.renderTableBody({ ...data, inventory: filtered });
      if (window.lucide) window.lucide.createIcons();
    }
  },
};
