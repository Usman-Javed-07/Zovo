// ── Admin guard ──
const _token = localStorage.getItem('token');
const _user  = JSON.parse(localStorage.getItem('user') || 'null');
if (!_token || !_user || _user.role !== 'admin') {
    window.location.href = './index.html';
}

const authHeaders = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${_token}`
});

let allUsers = [];

// ── Load all users ────────────────────────────────────────────────────────────
async function loadUsers() {
    const container = document.getElementById('adminUsersContainer');
    try {
        const res  = await fetch(`${API_BASE_URL}/api/admin/users`, { headers: authHeaders() });
        const data = await res.json();

        if (!data.success || !data.data.length) {
            container.innerHTML = '<p class="loading-text">No users found.</p>';
            return;
        }

        allUsers = data.data;
        renderUsers(allUsers);

    } catch (err) {
        container.innerHTML = `<p class="loading-text" style="color:#f44336">${err.message}</p>`;
    }
}

function renderUsers(users) {
    const container = document.getElementById('adminUsersContainer');

    container.innerHTML = `
        <table>
            <thead>
                <tr>
                    <th>#</th>
                    <th>User</th>
                    <th>Email</th>
                    <th>Orders</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Joined</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                ${users.map(u => {
                    const avatar = u.image
                        ? `<img src="${API_BASE_URL}${u.image}" class="au-avatar-img" alt="${u.name}">`
                        : `<div class="au-avatar">${u.name ? u.name.charAt(0).toUpperCase() : '?'}</div>`;

                    const statusBadge = u.is_banned
                        ? `<span class="badge badge-cancelled">Banned</span>`
                        : u.is_verified
                            ? `<span class="badge badge-active">Active</span>`
                            : `<span class="badge badge-pending">Unverified</span>`;

                    return `
                        <tr class="${u.is_banned ? 'au-row-banned' : ''}">
                            <td>#${u.id}</td>
                            <td class="au-user-cell">
                                ${avatar}
                                <span>${u.name}</span>
                            </td>
                            <td>${u.email}</td>
                            <td>${u.order_count}</td>
                            <td><span class="badge ${u.role === 'admin' ? 'badge-active' : 'badge-pending'}">${u.role}</span></td>
                            <td>${statusBadge}</td>
                            <td>${new Date(u.created_at).toLocaleDateString('en-US', { year:'numeric', month:'short', day:'numeric' })}</td>
                            <td class="au-actions">
                                ${u.role !== 'admin' ? `
                                    ${u.is_banned
                                        ? `<button class="btn-sm btn-approve unban-btn" data-id="${u.id}">Unban</button>`
                                        : `<button class="btn-sm btn-reject ban-btn" data-id="${u.id}">Ban</button>`
                                    }
                                    <button class="btn-sm btn-delete delete-user-btn" data-id="${u.id}" data-name="${u.name}">Delete</button>
                                ` : '<span style="color:#555">—</span>'}
                            </td>
                        </tr>
                        ${u.is_banned ? `
                        <tr class="au-ban-reason-row">
                            <td colspan="8">
                                <span style="color:#e8445a;font-size:13px">Ban reason: ${u.ban_reason || 'No reason given'}</span>
                            </td>
                        </tr>` : ''}
                    `;
                }).join('')}
            </tbody>
        </table>
    `;

    // Ban user
    container.querySelectorAll('.ban-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
            const reason = prompt('Enter ban reason (will be shown to user):');
            if (!reason || !reason.trim()) return;

            const res  = await fetch(`${API_BASE_URL}/api/admin/users/${btn.dataset.id}/ban`, {
                method:  'PATCH',
                headers: authHeaders(),
                body:    JSON.stringify({ reason: reason.trim() })
            });
            const data = await res.json();
            if (data.success) loadUsers();
            else alert(data.message);
        });
    });

    // Unban user
    container.querySelectorAll('.unban-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
            const res  = await fetch(`${API_BASE_URL}/api/admin/users/${btn.dataset.id}/unban`, {
                method:  'PATCH',
                headers: authHeaders()
            });
            const data = await res.json();
            if (data.success) loadUsers();
            else alert(data.message);
        });
    });

    // Delete user
    container.querySelectorAll('.delete-user-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
            if (!confirm(`Permanently delete user "${btn.dataset.name}"? This cannot be undone.`)) return;

            const res  = await fetch(`${API_BASE_URL}/api/admin/users/${btn.dataset.id}`, {
                method:  'DELETE',
                headers: authHeaders()
            });
            const data = await res.json();
            if (data.success) loadUsers();
            else alert(data.message);
        });
    });
}

// ── Search filter ─────────────────────────────────────────────────────────────
document.getElementById('userSearch').addEventListener('input', function () {
    const q = this.value.toLowerCase();
    const filtered = allUsers.filter(u =>
        u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
    );
    renderUsers(filtered);
});

loadUsers();
