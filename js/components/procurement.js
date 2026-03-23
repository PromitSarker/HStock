window.components.procurement = {
  render(data) {
    const container = document.createElement("div");
    container.className = "procurement-container";

    const html = `
            <div class="action-bar card">
                <button class="btn btn-primary" onclick="components.procurement.showAddModal()">
                    <i data-lucide="plus"></i> ${app.t('logNewStock')}
                </button>
            </div>
            
            <div class="card">
                <div class="table-container">
                    <table class="table">
                        <thead>
                            <tr>
                                <th>${app.t('transId')}</th>
                                <th>${app.t('date')}</th>
                                <th>${app.t('product')}</th>
                                <th>${app.t('qty')}</th>
                                <th>${app.t('unitCost')}</th>
                                <th>${app.t('supplier')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${
                              (data.procurements || [])
                                .map((p) => {
                                  const product = data.inventory.find(
                                    (i) => i.id === p.productId,
                                  );
                                  return `
                                    <tr>
                                        <td>#${p.id}</td>
                                        <td>${this.formatDate(p.date)}</td>
                                        <td class="font-600">${product ? product.name + " (" + product.potency + ")" : "Unknown"}</td>
                                        <td class="text-success font-700">+${p.quantity}</td>
                                        <td>${app.state.currency}${p.unitCost.toFixed(2)}</td>
                                        <td>${p.supplier}</td>
                                    </tr>
                                `;
                                })
                                .join("") ||
                              '<tr><td colspan="6" style="text-align:center; padding: 20px;">No procurements logged yet.</td></tr>'
                            }
                        </tbody>
                    </table>
                </div>
            </div>
            <div id="modal-container-procurement"></div>
        `;

    container.innerHTML = html;
    return container;
  },

  formatDate(dateStr) {
    if (!dateStr) return "N/A";
    return new Date(dateStr).toLocaleDateString();
  },

  async showAddModal() {
    const data = await window.dataStore.load();
    const modalContainer = document.getElementById(
      "modal-container-procurement",
    );
    modalContainer.innerHTML = `
            <div class="modal-overlay">
                <div class="modal-content fade-in" style="max-width: 500px;">
                    <div class="modal-header">
                        <h2>${app.t('logNewStock')}</h2>
                        <button class="icon-btn" onclick="document.getElementById('modal-container-procurement').innerHTML=''">
                            <i data-lucide="x"></i>
                        </button>
                    </div>
                    <form id="procurement-form" onsubmit="components.procurement.handleSubmit(event)">
                        <div class="form-group">
                            <label>Select Product</label>
                            <select name="productId" class="form-input" required>
                                <option value="">-- Choose Medicine --</option>
                                ${data.inventory.map((i) => `<option value="${i.id}">${i.name} - ${i.potency} (Stock: ${i.stock})</option>`).join("")}
                            </select>
                        </div>
                        <div class="form-grid form-grid-2">
                            <div class="form-group">
                                <label>Quantity Received</label>
                                <input type="number" name="quantity" class="form-input" min="1" required>
                            </div>
                            <div class="form-group">
                                <label>Unit Cost ($)</label>
                                <input type="number" name="unitCost" class="form-input" step="0.01" min="0" required>
                            </div>
                        </div>
                        <div class="form-group">
                            <label>Supplier Name</label>
                            <input type="text" name="supplier" class="form-input" required>
                        </div>
                        <div class="form-group">
                            <label>Purchase Date</label>
                            <input type="date" name="date" class="form-input" value="${new Date().toISOString().split("T")[0]}" required>
                        </div>
                        <div class="settings-actions">
                            <button type="submit" class="btn btn-primary" style="width: 100%; justify-content: center;">Save Procurement</button>
                        </div>
                    </form>
                </div>
            </div>
        `;

    if (window.lucide) window.lucide.createIcons();
  },

  async handleSubmit(event) {
    event.preventDefault();
    const formData = new FormData(event.target);
    const productId = parseInt(formData.get("productId"));
    const quantity = parseInt(formData.get("quantity"));
    const unitCost = parseFloat(formData.get("unitCost"));
    const supplier = formData.get("supplier");
    const date = formData.get("date");

    const newProcurement = {
      productId,
      quantity,
      unitCost,
      supplier,
      date,
    };

    await window.dataStore.createItem("procurements", newProcurement);

    // Notify app to refresh everything
    const freshData = await window.dataStore.load();
    app.state.data = freshData;
    app.render();
    document.getElementById("modal-container-procurement").innerHTML = "";
  },
};
