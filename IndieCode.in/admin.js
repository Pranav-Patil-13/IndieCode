/**
 * Admin Dashboard Logic
 * Uses in-site modals instead of browser popups.
 */

document.addEventListener('DOMContentLoaded', async () => {
    await waitForSupabase();

    const isAdmin = await checkAdminAccess();
    if (!isAdmin) return;

    fetchLeads();

    // Wire up "+ New Client" button
    const newClientBtn = document.getElementById('new-client-btn');
    if (newClientBtn) {
        newClientBtn.addEventListener('click', () => {
            openAdminModal('New Client', 'Create a portal account for a new client.', null, null);
        });
    }

    // Wire up the modal submit button
    const submitBtn = document.getElementById('admin-modal-submit');
    if (submitBtn) {
        submitBtn.addEventListener('click', handleModalSubmit);
    }
});

// =========================================================================
// SUPABASE READINESS
// =========================================================================

function waitForSupabase() {
    return new Promise((resolve) => {
        if (window.supabaseClient) return resolve();
        const check = setInterval(() => {
            if (window.supabaseClient) { clearInterval(check); resolve(); }
        }, 100);
        setTimeout(() => { clearInterval(check); resolve(); }, 5000);
    });
}

// =========================================================================
// ADMIN ACCESS CONTROL
// =========================================================================

async function checkAdminAccess() {
    if (!window.supabaseClient) {
        window.location.href = 'login.html';
        return false;
    }

    const { data: { session } } = await window.supabaseClient.auth.getSession();
    if (!session) {
        window.location.href = 'login.html';
        return false;
    }

    const adminEmails = ['hello@indiecode.in', 'pranavpatil13.2004@gmail.com', 'admin@indiecode.in'];
    if (!adminEmails.includes(session.user.email)) {
        window.location.href = 'index.html';
        return false;
    }

    document.body.style.opacity = '1';
    return true;
}

// =========================================================================
// LEAD FETCHING
// =========================================================================

async function fetchLeads() {
    const leadsContainer = document.getElementById('leads-list');
    const leadCountEl = document.getElementById('lead-count');
    if (!leadsContainer) return;

    leadsContainer.innerHTML = '<div style="padding: 24px; color: rgba(248,249,250,0.4); font-size: 0.9rem;">Loading leads...</div>';

    try {
        const { data: leads, error } = await window.supabaseClient
            .from('inquiries')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error("Supabase fetch error:", error);
            if (error.code === '42P01' || error.message.includes('does not exist')) {
                leadsContainer.innerHTML = `
                    <div style="padding: 32px; text-align: center;">
                        <h4 style="color: var(--bg-0); margin-bottom: 8px;">Table Setup Required</h4>
                        <p style="color: rgba(248,249,250,0.4); font-size: 0.9rem; line-height: 1.6;">
                            Create an <code>inquiries</code> table in Supabase with columns:<br>
                            <code>id, name, email, phone, interest, message, created_at</code>
                        </p>
                    </div>`;
            } else {
                leadsContainer.innerHTML = `
                    <div style="padding: 32px; text-align: center;">
                        <h4 style="color: var(--bg-0); margin-bottom: 8px;">Permission Issue (RLS)</h4>
                        <p style="color: rgba(248,249,250,0.4); font-size: 0.9rem; line-height: 1.6;">
                            Add a SELECT policy for authenticated users on the <code>inquiries</code> table.
                        </p>
                    </div>`;
            }
            return;
        }

        if (!leads || leads.length === 0) {
            leadsContainer.innerHTML = '<div style="padding: 32px; color: rgba(248,249,250,0.4); font-size: 0.9rem;">No inquiries yet. When someone fills the contact form, they will appear here.</div>';
            if (leadCountEl) leadCountEl.textContent = '(0)';
            return;
        }

        if (leadCountEl) leadCountEl.textContent = `(${leads.length})`;
        renderLeads(leads);
    } catch (err) {
        console.error("Error fetching leads:", err);
        leadsContainer.innerHTML = `<div style="padding: 32px; color: #ff6b6b; font-size: 0.9rem;">Error: ${err.message}</div>`;
    }
}

// =========================================================================
// RENDER LEADS
// =========================================================================

function renderLeads(leads) {
    const leadsContainer = document.getElementById('leads-list');
    leadsContainer.innerHTML = '';

    leads.forEach(lead => {
        const date = new Date(lead.created_at).toLocaleDateString('en-IN', {
            day: '2-digit', month: 'short', year: 'numeric'
        });

        const safeName = (lead.name || 'Unknown').replace(/"/g, '&quot;');
        const safeEmail = (lead.email || '').replace(/"/g, '&quot;');

        const row = document.createElement('div');
        row.className = 'payment-row';
        row.innerHTML = `
            <div class="payment-info">
                <strong>${lead.name || 'Unknown'}</strong>
                <span>${lead.email} • ${lead.interest ? lead.interest.toUpperCase() : 'GENERAL'} • ${date}</span>
                <p style="margin: 8px 0 0; color: rgba(248, 249, 250, 0.35); font-size: 0.85rem; font-style: italic;">"${lead.message || 'No message'}"</p>
                ${lead.phone ? `<span style="display: block; margin-top: 4px; font-size: 0.8rem; color: rgba(248,249,250,0.3);">📞 ${lead.phone}</span>` : ''}
            </div>
            <div class="payment-detail" style="flex-direction: row; align-items: center; gap: 12px; flex-shrink: 0;">
                <button class="button button-secondary" style="padding: 8px 16px; font-size: 0.8rem; white-space: nowrap;" data-copy="${safeEmail}">Copy Email</button>
                <button class="button button-primary" style="padding: 8px 16px; font-size: 0.8rem; white-space: nowrap;" data-activate-email="${safeEmail}" data-activate-name="${safeName}">Activate Portal</button>
            </div>
        `;
        leadsContainer.appendChild(row);
    });

    // Use event delegation for button clicks
    leadsContainer.addEventListener('click', (e) => {
        const copyBtn = e.target.closest('[data-copy]');
        if (copyBtn) {
            const email = copyBtn.dataset.copy;
            navigator.clipboard.writeText(email);
            const original = copyBtn.textContent;
            copyBtn.textContent = 'Copied!';
            copyBtn.style.color = '#10b981';
            setTimeout(() => { copyBtn.textContent = original; copyBtn.style.color = ''; }, 1500);
            return;
        }

        const activateBtn = e.target.closest('[data-activate-email]');
        if (activateBtn) {
            const email = activateBtn.dataset.activateEmail;
            const name = activateBtn.dataset.activateName;
            openAdminModal('Activate Portal', `Create a portal account for this client.`, name, email);
        }
    });
}

// =========================================================================
// IN-SITE MODAL SYSTEM (replaces all browser popups)
// =========================================================================

/**
 * Opens the admin modal. If name/email are provided, pre-fills the form.
 */
function openAdminModal(title, desc, name, email) {
    const modal = document.getElementById('admin-modal');
    const formView = document.getElementById('admin-modal-form');
    const resultView = document.getElementById('admin-modal-result');
    const titleEl = document.getElementById('admin-modal-title');
    const descEl = document.getElementById('admin-modal-desc');
    const nameInput = document.getElementById('modal-client-name');
    const emailInput = document.getElementById('modal-client-email');

    // Reset to form view
    formView.style.display = 'block';
    resultView.style.display = 'none';

    titleEl.textContent = title;
    descEl.textContent = desc;
    nameInput.value = name || '';
    emailInput.value = email || '';

    modal.classList.add('is-active');

    // Focus the first empty field
    setTimeout(() => {
        if (!nameInput.value) nameInput.focus();
        else if (!emailInput.value) emailInput.focus();
    }, 300);
}

window.closeAdminModal = () => {
    const modal = document.getElementById('admin-modal');
    modal.classList.remove('is-active');
};

/**
 * Handles the "Create Account" button inside the modal.
 */
async function handleModalSubmit() {
    const nameInput = document.getElementById('modal-client-name');
    const emailInput = document.getElementById('modal-client-email');
    const submitBtn = document.getElementById('admin-modal-submit');
    const formView = document.getElementById('admin-modal-form');
    const resultView = document.getElementById('admin-modal-result');
    const resultContent = document.getElementById('admin-modal-result-content');
    const copyBtn = document.getElementById('admin-modal-copy-btn');

    const name = nameInput.value.trim();
    const email = emailInput.value.trim();

    if (!name || !email) {
        // Highlight empty fields
        if (!name) nameInput.style.borderColor = '#ef4444';
        if (!email) emailInput.style.borderColor = '#ef4444';
        setTimeout(() => {
            nameInput.style.borderColor = '';
            emailInput.style.borderColor = '';
        }, 2000);
        return;
    }

    // Loading state
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Creating...';
    submitBtn.disabled = true;

    try {
        // Generate a secure password
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
        let password = '';
        for (let i = 0; i < 10; i++) password += chars.charAt(Math.floor(Math.random() * chars.length));
        password += '@Indie';

        const { data, error } = await window.supabaseClient.auth.signUp({
            email,
            password,
            options: { data: { full_name: name } }
        });

        if (error) throw error;

        // Switch to success result view
        formView.style.display = 'none';
        resultView.style.display = 'block';

        document.getElementById('admin-modal-title').textContent = 'Account Created';
        document.getElementById('admin-modal-desc').textContent = `Portal access is now ready for ${name}.`;

        resultContent.innerHTML = `
            <div class="admin-modal-success-icon">✓</div>
            <div class="admin-modal-result-card">
                <div class="result-row">
                    <span class="result-label">Client</span>
                    <span class="result-value">${name}</span>
                </div>
                <div class="result-row">
                    <span class="result-label">Email</span>
                    <span class="result-value">${email}</span>
                </div>
                <div class="result-row">
                    <span class="result-label">Password</span>
                    <span class="result-value">${password}</span>
                </div>
            </div>
        `;

        // Show and wire up the copy button
        copyBtn.style.display = 'flex';
        copyBtn.onclick = () => {
            const creds = `Email: ${email}\nPassword: ${password}`;
            navigator.clipboard.writeText(creds);
            copyBtn.textContent = 'Copied!';
            copyBtn.style.background = 'rgba(16, 185, 129, 0.15)';
            copyBtn.style.borderColor = '#10b981';
            copyBtn.style.color = '#10b981';
            setTimeout(() => {
                copyBtn.textContent = 'Copy Credentials';
                copyBtn.style.background = '';
                copyBtn.style.borderColor = '';
                copyBtn.style.color = '';
            }, 2000);
        };

    } catch (err) {
        formView.style.display = 'none';
        resultView.style.display = 'block';
        copyBtn.style.display = 'none';

        document.getElementById('admin-modal-title').textContent = 'Activation Failed';
        document.getElementById('admin-modal-desc').textContent = '';

        resultContent.innerHTML = `
            <div class="admin-modal-error-icon">✕</div>
            <p style="color: rgba(248,249,250,0.5); font-size: 0.9rem; line-height: 1.6;">${err.message}</p>
        `;
    } finally {
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    }
}

// =========================================================================
// CONFIRM MODAL (replaces browser confirm())
// =========================================================================

let confirmResolve = null;

function showConfirm(title, desc) {
    return new Promise((resolve) => {
        confirmResolve = resolve;
        document.getElementById('confirm-modal-title').textContent = title;
        document.getElementById('confirm-modal-desc').textContent = desc;
        document.getElementById('confirm-modal').classList.add('is-active');
    });
}

window.closeConfirmModal = (result) => {
    document.getElementById('confirm-modal').classList.remove('is-active');
    if (confirmResolve) {
        confirmResolve(result);
        confirmResolve = null;
    }
};
