window.components.employees = {
  render(data) {
    const container = document.createElement("div");
    container.className = "employees-container";

    const activeEmployees = data.employees.filter(
      (e) => e.status === "Active",
    ).length;
    const totalSalary = data.employees.reduce(
      (sum, e) => sum + (e.salary || 0),
      0,
    );

    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const salariesThisMonth = (data.salaries || []).filter(
      (s) => new Date(s.date) >= firstDay,
    );

    let pendingSalariesCount = 0;
    data.employees
      .filter((e) => e.status === "Active")
      .forEach((emp) => {
        if (!salariesThisMonth.some((s) => s.employeeId === emp.id)) {
          pendingSalariesCount++;
        }
      });

    const employeesHTML = `
            <div class="card-header">
                <div>
                    <h2>Tax & Compliance</h2>
                    <p class="text-secondary">Manage employee compliance and salaries.</p>
                </div>
                <div class="actions">
                    <button class="btn btn-primary" onclick="components.employees.showEmployeeModal()">
                        <i data-lucide="user-plus"></i>
                        ${app.t('addEmployee')}
                    </button>
                </div>
            </div>

            <div class="stats-grid">
                <div class="card stat-card">
                    <div class="stat-icon" style="background: #d1fae5; color: #10b981;">
                        <i data-lucide="check-circle"></i>
                    </div>
                    <div class="stat-info">
                        <h3>${data.employees.length}</h3>
                        <p>${app.t('totalEmployees')}</p>
                    </div>
                </div>

                <div class="card stat-card">
                    <div class="stat-icon" style="background: #fef3c7; color: #f59e0b;">
                        <i data-lucide="clock"></i>
                    </div>
                    <div class="stat-info">
                        <h3>${activeEmployees}</h3>
                        <p>Active Staff</p>
                    </div>
                </div>

                <div class="card stat-card">
                    <div class="stat-icon" style="background: #fee2e2; color: #ef4444;">
                        <i data-lucide="x-circle"></i>
                    </div>
                    <div class="stat-info">
                        <h3>${pendingSalariesCount}</h3>
                        <p>${app.t('pendingPayments')}</p>
                    </div>
                </div>

                <div class="card stat-card">
                    <div class="stat-icon" style="background: #e0e7ff; color: #6366f1;">
                        <i data-lucide="wallet"></i>
                    </div>
                    <div class="stat-info">
                        <h3>${app.state.currency}${totalSalary.toLocaleString()}</h3>
                        <p>${app.t('monthlyPayroll')}</p>
                    </div>
                </div>
            </div>

            <div class="card">
                <div class="card-header">
                    <div>
                        <h2>Employee Compliance List</h2>
                        <p class="text-secondary">Here are employee details and payment status for this month.</p>
                    </div>
                </div>

                <div class="table-container">
                    <table class="table">
                        <thead>
                            <tr>
                                <th>${app.t('employee')}</th>
                                <th>${app.t('salary')}</th>
                                <th>${app.t('role')}</th>
                                <th>${app.t('status')}</th>
                                <th>${app.t('payment')}</th>
                                <th class="text-right">${app.t('actions')}</th>
                            </tr>
                        </thead>
                        <tbody id="employees-table-body">
                        ${data.employees
                          .map((emp, index) => {
                            const isPaid = salariesThisMonth.some(
                              (s) => s.employeeId === emp.id,
                            );
                            return `
                            <tr>
                                <td style="padding-left: 24px;">
                                    <div class="flex-center">
                                        <div class="avatar" style="background: ${this.getRandomColor(emp.name)};">
                                            ${emp.name.charAt(0)}
                                        </div>
                                        <span class="font-500">${emp.name}</span>
                                    </div>
                                </td>
                                <td style="color: var(--text-secondary);">${app.state.currency}${(emp.salary || 0).toLocaleString()}</td>
                                <td style="color: var(--text-secondary);">${emp.role}</td>
                                <td>
                                    <span class="badge ${emp.status === "Active" ? "badge-success" : "badge-warning"}">${emp.status}</span>
                                </td>
                                <td>
                                    ${
                                      isPaid
                                        ? '<span class="badge badge-success">Paid</span>'
                                        : '<span class="badge badge-warning">Pending</span>'
                                    }
                                </td>
                                <td style="text-align: right; padding-right: 24px;">
                                    <button class="btn-icon" style="color: var(--text-secondary);" onclick="components.employees.showRowActionModal(${emp.id})">
                                        <i data-lucide="more-horizontal"></i>
                                    </button>
                                </td>
                            </tr>
                        `;
                          })
                          .join("")}
                    </tbody>
                </table>
            </div>
        </div>
            <div id="modal-container"></div>
        `;

    container.innerHTML = employeesHTML;
    return container;
  },

  async showRowActionModal(id) {
    const data = await window.dataStore.load();
    const emp = data.employees.find((e) => e.id === id);

    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const salariesThisMonth = (data.salaries || []).filter(
      (s) => new Date(s.date) >= firstDay,
    );
    const isPaid = salariesThisMonth.some((s) => s.employeeId === emp.id);

    const modalContainer = document.getElementById("modal-container");
    modalContainer.innerHTML = `
            <div class="modal-overlay">
                <div class="modal-content fade-in" style="max-width: 400px; padding: 24px;">
                    <div class="modal-header" style="margin-bottom: 24px;">
                        <h3 style="font-size: 18px; margin: 0;">Actions for ${emp.name}</h3>
                        <button class="btn-icon" onclick="components.employees.closeModal()">
                            <i data-lucide="x"></i>
                        </button>
                    </div>
                    <div style="display: flex; flex-direction: column; gap: 12px;">
                        ${
                          !isPaid
                            ? `
                            <button class="btn btn-primary" style="width: 100%; justify-content: center;" onclick="components.employees.showPaymentModal(${emp.id})">
                                <i data-lucide="banknote" style="width: 18px; height: 18px;"></i>
                                ${app.t('markAsPaid')}
                            </button>
                        `
                            : `
                            <button class="btn" style="width: 100%; justify-content: center; background: #f1f3f4; color: var(--text-secondary);" disabled>
                                Already Paid This Month
                            </button>
                        `
                        }
                        <button class="btn btn-secondary" style="width: 100%; justify-content: center; background: #e0e7ff; color: var(--primary-color);" onclick="components.employees.showEmployeeModal(${emp.id})">
                            <i data-lucide="edit" style="width: 18px; height: 18px;"></i>
                            Edit Employee Details
                        </button>
                        <button class="btn btn-secondary" style="width: 100%; justify-content: center; background: #f1f3f4; color: var(--text-main);" onclick="components.employees.showSalaryModal(${emp.id})">
                            <i data-lucide="history" style="width: 18px; height: 18px;"></i>
                            ${app.t('viewHistory')}
                        </button>
                        <button class="btn btn-secondary" style="width: 100%; justify-content: center; background: #fff3e0; color: var(--warning-color); border: none;" onclick="components.employees.toggleStatus(${emp.id})">
                            <i data-lucide="refresh-cw" style="width: 18px; height: 18px;"></i>
                            Toggle Status (${emp.status})
                        </button>
                    </div>
                </div>
            </div>
        `;
    if (window.lucide) window.lucide.createIcons();
  },

  closeModal() {
    document.getElementById("modal-container").innerHTML = "";
  },

  async toggleStatus(id) {
    const data = await window.dataStore.load();
    const employee = data.employees.find((e) => e.id === id);
    if (employee) {
      const newStatus = employee.status === "Active" ? "On Leave" : "Active";
      const updated = { ...employee, status: newStatus };
      delete updated.id;

      await window.dataStore.updateItem("employees", id, updated);
      const freshData = await window.dataStore.load();
      app.state.data = freshData;
      app.render();
    }
  },

  getRandomColor(name) {
    const colors = ["#7240f2", "#0b9e59", "#e0284f", "#e67700", "#2196f3"];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  },

  async showEmployeeModal(id = null) {
    const data = await window.dataStore.load();
    const emp = id ? data.employees.find((e) => e.id === id) : {
      name: "",
      role: "Staff",
      contact: "",
      salary: 0
    };

    const modalContainer = document.getElementById("modal-container");
    modalContainer.innerHTML = `
            <div class="modal-overlay">
                <div class="modal-content fade-in">
                    <div class="modal-header">
                        <h2>${id ? "Edit Employee" : "Add New Employee"}</h2>
                        <button class="btn-icon" onclick="components.employees.closeModal()">
                            <i data-lucide="x"></i>
                        </button>
                    </div>
                    <form id="employee-form">
                        <div class="form-group">
                            <label>${app.t('employee')}</label>
                            <input type="text" class="form-input" name="name" value="${emp.name}" required>
                        </div>
                        <div class="form-group">
                            <label>Role</label>
                            <select class="form-input" name="role" required>
                                <option value="Staff" ${emp.role === "Staff" ? "selected" : ""}>Staff</option>
                                <option value="Manager" ${emp.role === "Manager" ? "selected" : ""}>Manager</option>
                                <option value="Pharmacist" ${emp.role === "Pharmacist" ? "selected" : ""}>Pharmacist</option>
                                <option value="Delivery Driver" ${emp.role === "Delivery Driver" ? "selected" : ""}>Delivery Driver</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Contact Number</label>
                            <input type="text" class="form-input" name="contact" value="${emp.contact}" required>
                        </div>
                        <div class="form-group">
                            <label>Monthly Salary ($)</label>
                            <input type="number" class="form-input" name="salary" value="${emp.salary}" required>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" style="background: #f1f3f4; color: var(--text-main);" onclick="components.employees.closeModal()">Cancel</button>
                            <button type="submit" class="btn btn-primary">${id ? "Update Employee" : "Save Employee"}</button>
                        </div>
                    </form>
                </div>
            </div>
        `;
    if (window.lucide) window.lucide.createIcons();

    document.getElementById("employee-form").onsubmit = async (e) => {
      e.preventDefault();
      const formData = new FormData(e.target);

      const employeeData = {
        name: formData.get("name"),
        role: formData.get("role"),
        contact: formData.get("contact"),
        salary: parseFloat(formData.get("salary")),
      };

      if (id) {
        const existing = data.employees.find(e => e.id === id);
        const updated = { ...existing, ...employeeData };
        delete updated.id;
        await window.dataStore.updateItem("employees", id, updated);
      } else {
        const newEmployee = {
          ...employeeData,
          status: "Active",
          joinedDate: new Date().toISOString().split("T")[0],
        };
        await window.dataStore.createItem("employees", newEmployee);
      }

      const freshData = await window.dataStore.load();
      app.state.data = freshData;
      this.closeModal();
      app.render();
    };
  },

  async showPaymentModal(employeeId) {
    const existingModal = document.querySelector(".modal-overlay");
    if (existingModal) existingModal.remove();

    const data = await window.dataStore.load();
    const emp = data.employees.find((e) => e.id === employeeId);
    if (!emp) return;

    const modal = document.createElement("div");
    modal.className = "modal-overlay";
    modal.innerHTML = `
            <div class="modal-content fade-in" style="max-width: 500px;">
                <div class="modal-header">
                    <h2>Record Payment for ${emp.name}</h2>
                    <button class="btn-icon" onclick="this.closest('.modal-overlay').remove()">
                        <i data-lucide="x"></i>
                    </button>
                </div>
                <form id="payment-form">
                    <input type="hidden" name="employeeId" value="${emp.id}">
                    <div class="form-group">
                        <label>Payment Amount ($)</label>
                        <input type="number" class="form-input" name="amount" value="${emp.salary || 0}" required>
                    </div>
                    <div class="form-group">
                        <label>Payment Date</label>
                        <input type="date" class="form-input" name="date" value="${new Date().toISOString().split("T")[0]}" required>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" style="background: #f1f3f4; color: var(--text-main);" onclick="this.closest('.modal-overlay').remove()">Cancel</button>
                        <button type="submit" class="btn btn-primary">Record Payment</button>
                    </div>
                </form>
            </div>
        `;
    document.body.appendChild(modal);
    if (window.lucide) window.lucide.createIcons();

    document.getElementById("payment-form").onsubmit = async (e) => {
      e.preventDefault();
      const formData = new FormData(e.target);

      const newPayment = {
        employeeId: parseInt(formData.get("employeeId")),
        amount: parseFloat(formData.get("amount")),
        date: formData.get("date"),
        status: "Paid",
      };

      await window.dataStore.createItem("salaries", newPayment);
      const freshData = await window.dataStore.load();
      app.state.data = freshData;
      modal.remove();
      app.render();
    };
  },

  formatDate(dateStr) {
    if (!dateStr) return "N/A";
    return new Date(dateStr).toLocaleDateString();
  },

  async showSalaryModal(employeeId) {
    const existingModal = document.querySelector(".modal-overlay");
    if (existingModal) existingModal.remove();

    const data = await window.dataStore.load();
    const employee = data.employees.find((e) => e.id === employeeId);
    const history = (data.salaries || []).filter(
      (s) => s.employeeId === employeeId,
    );

    const modal = document.createElement("div");
    modal.className = "modal-overlay";
    modal.innerHTML = `
            <div class="modal-content fade-in" style="max-width: 600px;">
                <div class="modal-header">
                    <h2>History: ${employee.name}</h2>
                    <button class="btn-icon" onclick="this.closest('.modal-overlay').remove()">
                        <i data-lucide="x"></i>
                    </button>
                </div>

                <div class="table-container">
                    <table class="table" style="font-size: 14px;">
                        <thead>
                            <tr>
                                <th style="padding-left: 20px;">Date</th>
                                <th>Amount</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${
                              history.length
                                ? history
                                    .map(
                                      (h) => `
                                <tr>
                                    <td style="padding-left: 20px;">${this.formatDate(h.date)}</td>
                                    <td>$${h.amount.toLocaleString()}</td>
                                    <td><span class="badge badge-success">Paid</span></td>
                                </tr>
                            `,
                                    )
                                    .join("")
                                : '<tr><td colspan="3" style="text-align:center; padding: 32px; color: var(--text-secondary);">No records found.</td></tr>'
                            }
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    document.body.appendChild(modal);
    if (window.lucide) window.lucide.createIcons();
  },
};
