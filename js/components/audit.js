window.components.audit = {
    render(data) {
        const container = document.createElement('div');
        container.className = 'audit-container';

        const logs = data.auditLogs || [];

        const html = `
            <div class="card">
                <div class="card-header" style="margin-bottom: 24px;">
                    <h2>${app.t('auditLogs')}</h2>
                    <p style="color: var(--text-secondary); font-size: 14px;">${app.t('auditDesc')}</p>
                </div>
                
                <div class="table-container">
                    <table class="table">
                        <thead>
                            <tr>
                                <th>${app.t('dateTime')}</th>
                                <th>${app.t('actionType')}</th>
                                <th>${app.t('details')}</th>
                                <th>${app.t('user')}</th>
                            </tr>
                        </thead>
                        <tbody>
                        ${logs.length > 0 ? logs.map(log => `
                            <tr>
                                <td style="white-space: nowrap;">${new Date(log.date).toLocaleString()}</td>
                                <td><span class="badge" style="background: var(--bg-color); color: var(--text-main); border: 1px solid var(--border-color);">${log.action}</span></td>
                                <td class="text-secondary">${log.details}</td>
                                <td class="font-500">${log.user}</td>
                            </tr>
                        `).join('') : `
                            <tr>
                                <td colspan="4" class="text-center" style="padding: 32px;">${app.t('noAuditLogs')}</td>
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
