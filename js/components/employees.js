window.components.employees = {
    render(data) {
        const container = document.createElement('div');
        container.className = 'employees-container';

        const activeEmployees = data.employees.filter(e => e.status === 'Active').length;
        const totalSalary = data.employees.reduce((sum, e) => sum + (e.salary || 0), 0);
        
        const now = new Date();
        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
        const salariesThisMonth = (data.salaries || []).filter(s => new Date(s.date) >= firstDay);
        
        let pendingSalariesCount = 0;
        data.employees.filter(e => e.status === 'Active').forEach(emp => {
            if (!salariesThisMonth.some(s => s.employeeId === emp.id)) {
                pendingSalariesCount++;
            }
        });

        const employeesHTML = `
            <div class="employees-list-header" style="margin-bottom: 32px;">
                <div>
                    <h2 style="font-size: 24px; font-weight: 700;">Tax & Compliance</h2>
                    <p style="color: var(--text-secondary); font-size: 15px;">Manage employee compliance and salaries.</p>
                </div>
                <div class="actions">
                    <button class="btn btn-primary" onclick="components.employees.showAddModal()">
                        <i data-lucide="user-plus" style="width: 18px; height: 18px;"></i>
                        Add Employee
                    </button>
                </div>
            </div>

            <div class="stats-grid">
                <div class="card bg-pastel-green">
                    <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 16px;">
                        <div style="background: var(--success-color); color: white; width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                            <i data-lucide="check-circle"></i>
                        </div>
                        <span style="font-weight: 600; font-size: 15px;">Total Employees</span>
                    </div>
                    <div style="font-size: 32px; font-weight: 700;">${data.employees.length}</div>
                    <p style="font-size: 13px; color: var(--text-secondary); margin-top: 8px;">Total registered staff.</p>
                </div>

                <div class="card bg-pastel-yellow">
                    <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 16px;">
                        <div style="background: var(--warning-color); color: white; width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                            <i data-lucide="clock"></i>
                        </div>
                        <span style="font-weight: 600; font-size: 15px;">Active Staff</span>
                    </div>
                    <div style="font-size: 32px; font-weight: 700;">${activeEmployees}</div>
                    <p style="font-size: 13px; color: var(--text-secondary); margin-top: 8px;">Currently active employees.</p>
                </div>

                <div class="card bg-pastel-red">
                    <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 16px;">
                        <div style="background: var(--danger-color); color: white; width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                            <i data-lucide="x-circle"></i>
                        </div>
                        <span style="font-weight: 600; font-size: 15px;">Pending Payments</span>
                    </div>
                    <div style="font-size: 32px; font-weight: 700;">${pendingSalariesCount}</div>
                    <p style="font-size: 13px; color: var(--text-secondary); margin-top: 8px;">Salaries yet to be paid.</p>
                </div>

                <div class="card bg-pastel-blue">
                    <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 16px;">
                        <div style="background: var(--primary-color); color: white; width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                            <i data-lucide="wallet"></i>
                        </div>
                        <span style="font-weight: 600; font-size: 15px;">Monthly Payroll</span>
                    </div>
                    <div style="font-size: 32px; font-weight: 700;">$${totalSalary.toLocaleString()}</div>
                    <p style="font-size: 13px; color: var(--text-secondary); margin-top: 8px;">Total salary obligation.</p>
                </div>
            </div>

            <div class="card" style="padding: 32px; border-radius: 20px;">
                <div class="table-filter-bar" style="margin-bottom: 32px;">
                    <div>
                        <div class="title">Employee Compliance List</div>
                        <p>Here are employee details and payment status for this month.</p>
                    </div>
                </div>

                <table class="table">
                    <thead>
                        <tr>
                            <th style="padding-left: 24px;">Employee</th>
                            <th>Salary</th>
                            <th>Role</th>
                            <th>Status</th>
                            <th>Payment</th>
                            <th style="text-align: right; padding-right: 24px;">Action</th>
                        </tr>
                    </thead>
                    <tbody id="employees-table-body">
                        ${data.employees.map((emp, index) => {
                            const isPaid = salariesThisMonth.some(s => s.employeeId === emp.id);
                            return `
                            <tr>
                                <td style="padding-left: 24px;">
                                    <div style="display: flex; align-items: center; gap: 12px;">
                                        <div class="avatar" style="width: 32px; height: 32px; font-size: 14px; background: ${this.getRandomColor(emp.name)};">
                                            ${emp.name.charAt(0)}
                                        </div>
                                        <span style="font-weight: 500;">${emp.name}</span>
                                    </div>
                                </td>
                                <td style="color: var(--text-secondary);">$${(emp.salary || 0).toLocaleString()}</td>
                                <td style="color: var(--text-secondary);">${emp.role}</td>
                                <td>
                                    <span class="badge ${emp.status === 'Active' ? 'badge-success' : 'badge-warning'}">${emp.status}</span>
                                </td>
                                <td>
                                    ${isPaid 
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
                        `}).join('')}
                    </tbody>
                </table>
            </div>
            <div id="modal-container"></div>
        `;

        container.innerHTML = employeesHTML;
        return container;
    },

    async showRowActionModal(id) {
        const data = await window.dataStore.load();
        const emp = data.employees.find(e => e.id === id);
        
        const now = new Date();
        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
        const salariesThisMonth = (data.salaries || []).filter(s => new Date(s.date) >= firstDay);
        const isPaid = salariesThisMonth.some(s => s.employeeId === emp.id);

        const modalContainer = document.getElementById('modal-container');
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
                        ${!isPaid ? `
                            <button class="btn btn-primary" style="width: 100%; justify-content: center;" onclick="components.employees.showPaymentModal(${emp.id})">
                                <i data-lucide="banknote" style="width: 18px; height: 18px;"></i>
                                Mark as Paid
                            </button>
                        ` : `
                            <button class="btn" style="width: 100%; justify-content: center; background: #f1f3f4; color: var(--text-secondary);" disabled>
                                Already Paid This Month
                            </button>
                        `}
                        <button class="btn btn-secondary" style="width: 100%; justify-content: center; background: #f1f3f4; color: var(--text-main);" onclick="components.employees.showSalaryModal(${emp.id})">
                            <i data-lucide="history" style="width: 18px; height: 18px;"></i>
                            View Payment History
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
        document.getElementById('modal-container').innerHTML = '';
    },

    async toggleStatus(id) {
        const data = await window.dataStore.load();
        const employee = data.employees.find(e => e.id === id);
        if (employee) {
            const newStatus = employee.status === 'Active' ? 'On Leave' : 'Active';
            const updated = { ...employee, status: newStatus };
            delete updated.id;
            
            await window.dataStore.updateItem('employees', id, updated);
            const freshData = await window.dataStore.load();
            app.state.data = freshData;
            app.render();
        }
    },

    getRandomColor(name) {
        const colors = ['#7240f2', '#0b9e59', '#e0284f', '#e67700', '#2196f3'];
        let hash = 0;
        for (let i = 0; i < name.length; i++) {
            hash = name.charCodeAt(i) + ((hash << 5) - hash);
        }
        return colors[Math.abs(hash) % colors.length];
    },

    async showAddModal() {
        const modalContainer = document.getElementById('modal-container') || document.body;
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content fade-in">
                <div class="modal-header">
                    <h2>Add New Employee</h2>
                    <button class="btn-icon" onclick="this.closest('.modal-overlay').remove()">
                        <i data-lucide="x"></i>
                    </button>
                </div>
                <form id="add-employee-form">
                    <div class="form-group">
                        <label>Full Name</label>
                        <input type="text" class="form-input" name="name" required>
                    </div>
                    <div class="form-group">
                        <label>Role</label>
                        <select class="form-input" name="role" required>
                            <option value="Staff">Staff</option>
                            <option value="Manager">Manager</option>
                            <option value="Pharmacist">Pharmacist</option>
                            <option value="Delivery Driver">Delivery Driver</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Contact Number</label>
                        <input type="text" class="form-input" name="contact" required>
                    </div>
                    <div class="form-group">
                        <label>Monthly Salary ($)</label>
                        <input type="number" class="form-input" name="salary" required>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" style="background: #f1f3f4; color: var(--text-main);" onclick="this.closest('.modal-overlay').remove()">Cancel</button>
                        <button type="submit" class="btn btn-primary">Save Employee</button>
                    </div>
                </form>
            </div>
        `;
        document.body.appendChild(modal);
        if (window.lucide) window.lucide.createIcons();

        document.getElementById('add-employee-form').onsubmit = async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            
            const newEmployee = {
                name: formData.get('name'),
                role: formData.get('role'),
                contact: formData.get('contact'),
                salary: parseFloat(formData.get('salary')),
                status: 'Active',
                joinedDate: new Date().toISOString().split('T')[0]
            };

            await window.dataStore.createItem('employees', newEmployee);
            const freshData = await window.dataStore.load();
            app.state.data = freshData;
            modal.remove();
            app.render();
        };
    },

    async showPaymentModal(employeeId) {
        const existingModal = document.querySelector('.modal-overlay');
        if(existingModal) existingModal.remove();

        const data = await window.dataStore.load();
        const emp = data.employees.find(e => e.id === employeeId);
        if(!emp) return;

        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
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
                        <input type="date" class="form-input" name="date" value="${new Date().toISOString().split('T')[0]}" required>
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

        document.getElementById('payment-form').onsubmit = async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            
            const newPayment = {
                employeeId: parseInt(formData.get('employeeId')),
                amount: parseFloat(formData.get('amount')),
                date: formData.get('date'),
                status: 'Paid'
            };

            await window.dataStore.createItem('salaries', newPayment);
            const freshData = await window.dataStore.load();
            app.state.data = freshData;
            modal.remove();
            app.render();
        };
    },

    formatDate(dateStr) {
        if (!dateStr) return 'N/A';
        return new Date(dateStr).toLocaleDateString();
    },

    async showSalaryModal(employeeId) {
        const existingModal = document.querySelector('.modal-overlay');
        if(existingModal) existingModal.remove();

        const data = await window.dataStore.load();
        const employee = data.employees.find(e => e.id === employeeId);
        const history = (data.salaries || []).filter(s => s.employeeId === employeeId);

        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content fade-in" style="max-width: 600px;">
                <div class="modal-header">
                    <h2>History: ${employee.name}</h2>
                    <button class="btn-icon" onclick="this.closest('.modal-overlay').remove()">
                        <i data-lucide="x"></i>
                    </button>
                </div>
                
                <table class="table" style="font-size: 14px;">
                    <thead>
                        <tr>
                            <th style="padding-left: 20px;">Date</th>
                            <th>Amount</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${history.length ? history.map(h => `
                            <tr>
                                <td style="padding-left: 20px;">${this.formatDate(h.date)}</td>
                                <td>$${h.amount.toLocaleString()}</td>
                                <td><span class="badge badge-success">Paid</span></td>
                            </tr>
                        `).join('') : '<tr><td colspan="3" style="text-align:center; padding: 32px; color: var(--text-secondary);">No records found.</td></tr>'}
                    </tbody>
                </table>
            </div>
        `;
        document.body.appendChild(modal);
        if (window.lucide) window.lucide.createIcons();
    }
};
