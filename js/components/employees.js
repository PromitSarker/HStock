window.components.employees = {
    render(data) {
        const container = document.createElement('div');
        container.className = 'employees-container';

        const employeesHTML = `
            <div class="employees-grid">
                ${data.employees.map(employee => `
                    <div class="card employee-card">
                        <div class="employee-header">
                            <div class="avatar" style="background: ${this.getRandomColor()};">
                                ${employee.name.charAt(0)}
                            </div>
                            <div class="employee-info">
                                <h3>${employee.name}</h3>
                                <p>${employee.role}</p>
                            </div>
                        </div>
                        <div class="employee-body">
                            <div class="contact">
                                <i data-lucide="phone"></i>
                                <span>${employee.contact}</span>
                            </div>
                            <div class="status-row">
                                <span class="badge ${this.getStatusBadgeClass(employee.status)}">${employee.status}</span>
                                <button class="btn-text" onclick="components.employees.toggleStatus(${employee.id})">Change</button>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;

        container.innerHTML = employeesHTML;
        return container;
    },

    getStatusBadgeClass(status) {
        switch (status.toLowerCase()) {
            case 'active': return 'badge-success';
            case 'on leave': return 'badge-warning';
            default: return '';
        }
    },

    toggleStatus(id) {
        const data = window.dataStore.load();
        const employee = data.employees.find(e => e.id === id);
        if (employee) {
            employee.status = employee.status === 'Active' ? 'On Leave' : 'Active';
            window.dataStore.save(data);
            app.state.data = data;
            app.render();
        }
    },

    getRandomColor() {
        const colors = ['#4285f4', '#34a853', '#fbbc05', '#ea4335', '#673ab7', '#3f51b5', '#2196f3'];
        return colors[Math.floor(Math.random() * colors.length)];
    }
};
