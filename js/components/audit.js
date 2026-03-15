window.components.audit = {
    render(data) {
        const container = document.createElement('div');
        container.className = 'audit-container';

        const logs = data.auditLogs || [];

        const html = `
            <div class="card">
                <div class="card-header" style="margin-bottom: 24px;">
                    <h2>System Audit Logs</h2>
                    <p style="color: var(--text-secondary); font-size: 14px;">Records of manual stock adjustments and deletions.</p>
                </div>
                
                <div class="table-container">
                    <table class="table">
                        <thead>
                            <tr>
                                <th>Date & Time</th>
                                <th>Action Type</th>
                                <th>Details</th>
                                <th>User</th>
                            </tr>
                        </thead>
                        <tbody>
                        ${logs.length > 0 ? logs.map(log => `
                            <tr>
                                <td style="white-space: nowrap;">${new Date(log.date).toLocaleString()}</td>
                                <td><span class="badge" style="background: var(--bg-hover); color: var(--text-main); border: 1px solid var(--border-color);">${log.action}</span></td>
                                <td style="color: var(--text-secondary);">${log.details}</td>
                                <td style="font-weight: 500;">${log.user}</td>
                            </tr>
                        `).join('') : `
                            <tr>
                                <td colspan="4" style="text-align: center; padding: 32px; color: var(--text-secondary);">No audit logs found.</td>
                            </tr>
                        `}
                    </tbody>
                </table>
            </div>
        </div>
        `;

        container.innerHTML = html;
        return container;
    }
};
