// ── Auth guard ──
const _token = localStorage.getItem('token');
const _user  = JSON.parse(localStorage.getItem('user') || 'null');
if (!_token || !_user) {
    window.location.href = './login.html';
}

const authHeaders = { 'Authorization': `Bearer ${localStorage.getItem('token')}` };

async function loadWallet() {
    try {
        const res     = await fetch(`${API_BASE_URL}/api/wallet/balance`, { headers: authHeaders });
        const wallet  = await res.json();
        const balance = Number(wallet.balance) || 0;
        document.getElementById('walletBalance').textContent = `$${balance.toFixed(2)}`;
    } catch (err) {
        document.getElementById('walletBalance').textContent = '$0.00';
    }
}

async function loadTransactions() {
    const container = document.getElementById('transactionsContainer');
    try {
        const res  = await fetch(`${API_BASE_URL}/api/wallet/history`, { headers: authHeaders });
        const txns = await res.json();

        if (!txns.length) {
            container.innerHTML = '<p class="empty-text">No transactions yet.</p>';
            return;
        }

        container.innerHTML = txns.map(txn => `
            <div class="transaction-item">
                <div class="txn-left">
                    <div class="txn-desc">${txn.description || (txn.type === 'credit' ? 'Credit' : 'Debit')}</div>
                    <div class="txn-date">${new Date(txn.created_at).toLocaleString()}</div>
                </div>
                <div class="txn-amount ${txn.type}">
                    ${txn.type === 'credit' ? '+' : '-'}$${Number(txn.amount).toFixed(2)}
                </div>
            </div>
        `).join('');
    } catch (err) {
        container.innerHTML = `<p class="empty-text" style="color:#f44336">${err.message}</p>`;
    }
}

loadWallet();
loadTransactions();
