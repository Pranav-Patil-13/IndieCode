/**
 * Admin Dashboard Logic
 * Features: Sorting, Grouping by person, Pagination, In-site modals.
 */

// =========================================================================
// STATE
// =========================================================================
let allLeads = [];
let currentSort = 'newest';
let currentView = 'grouped'; // 'grouped' or 'flat'
let currentPage = 1;
const LEADS_PER_PAGE = 6;

// =========================================================================
// INIT
// =========================================================================
document.addEventListener('DOMContentLoaded', async () => {
    await waitForSupabase();
    const isAdmin = await checkAdminAccess();
    if (!isAdmin) return;

    await fetchLeads();
    setupToolbar();
    setupTabNavigation();

    const newClientBtn = document.getElementById('new-client-btn');
    if (newClientBtn) {
        newClientBtn.addEventListener('click', () => {
            openAdminModal('New Client', 'Create a portal account for a new client.', null, null);
        });
    }

    const submitBtn = document.getElementById('admin-modal-submit');
    if (submitBtn) {
        submitBtn.addEventListener('click', handleModalSubmit);
    }
});

function waitForSupabase() {
    return new Promise((resolve) => {
        if (window.supabaseClient) return resolve();
        const check = setInterval(() => {
            if (window.supabaseClient) { clearInterval(check); resolve(); }
        }, 100);
        setTimeout(() => { clearInterval(check); resolve(); }, 5000);
    });
}

async function checkAdminAccess() {
    if (!window.supabaseClient) { window.location.href = 'login.html'; return false; }
    const { data: { session } } = await window.supabaseClient.auth.getSession();
    if (!session) { window.location.href = 'login.html'; return false; }
    const adminEmails = ['hello@indiecode.in', 'pranavpatil13.2004@gmail.com', 'admin@indiecode.in'];
    if (!adminEmails.includes(session.user.email)) { window.location.href = 'index.html'; return false; }
    document.body.style.opacity = '1';
    return true;
}

// =========================================================================
// TAB NAVIGATION
// =========================================================================
function setupTabNavigation() {
    const navLinks = document.querySelectorAll('.portal-nav a[data-tab]');
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const tab = link.dataset.tab;

            // Update active nav
            navLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');

            // Show/hide panels
            document.querySelectorAll('.admin-tab-panel').forEach(panel => {
                panel.style.display = 'none';
            });
            const target = document.getElementById('tab-' + tab);
            if (target) target.style.display = 'block';

            // Lazy-load clients on first visit
            if (tab === 'clients') fetchClients();
        });
    });
}

// =========================================================================
// FETCH CLIENTS
// =========================================================================
let clientsFetched = false;

async function fetchClients() {
    if (clientsFetched) return;
    const container = document.getElementById('clients-list');
    const countEl = document.getElementById('client-count');
    if (!container) return;

    container.innerHTML = '<div style="padding: 24px; color: rgba(248,249,250,0.4); font-size: 0.9rem;">Loading clients...</div>';

    try {
        const { data: clients, error } = await window.supabaseClient
            .from('clients')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error("Clients fetch error:", error);
            container.innerHTML = `
                <div style="padding: 32px; text-align: center;">
                    <h4 style="color: var(--bg-0); margin-bottom: 8px;">Clients Table Setup</h4>
                    <p style="color: rgba(248,249,250,0.4); font-size: 0.9rem; line-height: 1.6;">
                        Create a <code>clients</code> table in Supabase with columns:<br>
                        <code>id</code> (uuid), <code>name</code> (text), <code>email</code> (text), <code>created_at</code> (timestamptz).<br>
                        Then add a SELECT policy for authenticated users.
                    </p>
                </div>`;
            return;
        }

        clientsFetched = true;

        if (!clients || clients.length === 0) {
            container.innerHTML = '<div style="padding: 32px; color: rgba(248,249,250,0.4); font-size: 0.9rem;">No clients yet. Activate a lead from the Inquiries tab to see them here.</div>';
            if (countEl) countEl.textContent = '(0)';
            return;
        }

        if (countEl) countEl.textContent = `(${clients.length})`;
        renderClients(clients, container);
    } catch (err) {
        container.innerHTML = `<div style="padding: 32px; color: #ff6b6b; font-size: 0.9rem;">Error: ${err.message}</div>`;
    }
}

function renderClients(clients, container) {
    container.innerHTML = '';

    clients.forEach((client, i) => {
        const date = new Date(client.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
        const initials = (client.name || 'U').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
        const colors = [
            { bg: 'rgba(99, 102, 241, 0.15)', fg: '#818cf8' },
            { bg: 'rgba(16, 185, 129, 0.15)', fg: '#34d399' },
            { bg: 'rgba(245, 158, 11, 0.15)', fg: '#fbbf24' },
            { bg: 'rgba(236, 72, 153, 0.15)', fg: '#f472b6' },
            { bg: 'rgba(155, 81, 224, 0.15)', fg: '#c084fc' },
        ];
        const color = colors[i % colors.length];
        const safeData = JSON.stringify(client).replace(/'/g, "\\'").replace(/"/g, '&quot;');

        const row = document.createElement('div');
        row.className = 'payment-row';
        row.style.alignItems = 'center';
        row.innerHTML = `
            <div style="display: flex; align-items: center; gap: 16px;">
                <div style="width: 40px; height: 40px; border-radius: 12px; background: ${color.bg}; color: ${color.fg}; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 0.8rem; flex-shrink: 0;">${initials}</div>
                <div class="payment-info" style="padding: 0;">
                    <strong>${client.name || 'Unknown'}</strong>
                    <span>${client.email} • Joined ${date}</span>
                </div>
            </div>
            <div class="payment-detail" style="flex-direction: row; align-items: center; gap: 10px; flex-shrink: 0;">
                <button class="button button-secondary" style="padding: 6px 14px; font-size: 0.78rem;" data-view-client-id="${client.id}">View Details</button>
                <span style="font-size: 0.72rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em; color: #34d399; background: rgba(16,185,129,0.1); padding: 4px 10px; border-radius: 6px;">Active</span>
            </div>
        `;
        container.appendChild(row);
    });

    // Store clients data for modal access
    window._clientsData = {};
    clients.forEach(c => { window._clientsData[c.id] = c; });

    // Event delegation for View Details
    container.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-view-client-id]');
        if (btn) {
            const client = window._clientsData[btn.dataset.viewClientId];
            if (client) openClientDetail(client);
        }
    });
}

// =========================================================================
// CLIENT DETAIL MODAL
// =========================================================================
let currentDetailClient = null;

function openClientDetail(client) {
    currentDetailClient = client;
    const modal = document.getElementById('client-detail-modal');
    const nameInput = document.getElementById('detail-client-name');
    const emailInput = document.getElementById('detail-client-email');
    const passwordInput = document.getElementById('detail-client-password');
    const dateInput = document.getElementById('detail-client-date');
    const toggleBtn = document.getElementById('toggle-password-btn');
    const currentPwHint = document.getElementById('detail-current-password');

    nameInput.value = client.name || '';
    emailInput.value = client.email || '';
    passwordInput.value = '';
    passwordInput.type = 'password';
    toggleBtn.textContent = 'Show';
    dateInput.value = new Date(client.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

    // Show current stored password as hint
    if (client.password) {
        currentPwHint.textContent = `Current: ${client.password}`;
    } else {
        currentPwHint.textContent = 'No password on file (old account).';
    }

    // Password toggle
    toggleBtn.onclick = () => {
        if (passwordInput.type === 'password') {
            passwordInput.type = 'text';
            toggleBtn.textContent = 'Hide';
        } else {
            passwordInput.type = 'password';
            toggleBtn.textContent = 'Show';
        }
    };

    // Copy credentials
    const copyBtn = document.getElementById('detail-copy-creds-btn');
    copyBtn.onclick = () => {
        const pw = passwordInput.value || client.password || 'N/A';
        const creds = `Email: ${emailInput.value}\nPassword: ${pw}`;
        navigator.clipboard.writeText(creds);
        copyBtn.textContent = 'Copied!';
        copyBtn.style.color = '#10b981';
        setTimeout(() => { copyBtn.textContent = 'Copy Credentials'; copyBtn.style.color = ''; }, 1500);
    };

    // Save changes
    const saveBtn = document.getElementById('detail-save-btn');
    saveBtn.onclick = () => saveClientChanges();

    modal.classList.add('is-active');
    setTimeout(() => nameInput.focus(), 300);
}

window.closeClientDetail = () => {
    document.getElementById('client-detail-modal').classList.remove('is-active');
    currentDetailClient = null;
};

async function saveClientChanges() {
    if (!currentDetailClient) return;

    const nameInput = document.getElementById('detail-client-name');
    const emailInput = document.getElementById('detail-client-email');
    const passwordInput = document.getElementById('detail-client-password');
    const saveBtn = document.getElementById('detail-save-btn');

    const newName = nameInput.value.trim();
    const newEmail = emailInput.value.trim();
    const newPassword = passwordInput.value.trim();

    if (!newName || !newEmail) {
        if (!newName) { nameInput.style.borderColor = '#ef4444'; setTimeout(() => nameInput.style.borderColor = '', 2000); }
        if (!newEmail) { emailInput.style.borderColor = '#ef4444'; setTimeout(() => emailInput.style.borderColor = '', 2000); }
        return;
    }

    // Password must be at least 6 characters (Supabase requirement)
    if (newPassword && newPassword.length < 6) {
        passwordInput.style.borderColor = '#ef4444';
        const hint = document.getElementById('detail-current-password');
        hint.textContent = '⚠️ Password must be at least 6 characters.';
        hint.style.color = '#ef4444';
        setTimeout(() => {
            passwordInput.style.borderColor = '';
            hint.style.color = 'rgba(248,249,250,0.25)';
        }, 3000);
        return;
    }

    saveBtn.textContent = 'Saving...';
    saveBtn.disabled = true;

    try {
        // 1. Update the clients table
        const updateData = { name: newName, email: newEmail };
        if (newPassword) updateData.password = newPassword;

        const { error: dbError } = await window.supabaseClient
            .from('clients')
            .update(updateData)
            .eq('id', currentDetailClient.id);

        if (dbError) throw dbError;

        // 2. Update Supabase Auth (requires service_role admin client)
        let authMsg = '';
        if (window.supabaseAdmin) {
            const authUpdate = {};
            if (newEmail !== currentDetailClient.email) authUpdate.email = newEmail;
            if (newPassword) authUpdate.password = newPassword;

            if (Object.keys(authUpdate).length > 0) {
                // Find the user by email
                const { data: { users }, error: listErr } = await window.supabaseAdmin.auth.admin.listUsers();
                if (listErr) {
                    authMsg = 'Warning: Could not list users — ' + listErr.message;
                } else if (users) {
                    const authUser = users.find(u => u.email === currentDetailClient.email);
                    if (authUser) {
                        const { error: updateErr } = await window.supabaseAdmin.auth.admin.updateUserById(authUser.id, authUpdate);
                        if (updateErr) {
                            throw new Error('Auth update failed: ' + updateErr.message);
                        }
                        authMsg = 'Login credentials updated.';
                    } else {
                        authMsg = 'Warning: No matching Auth user found. Record saved but login not updated.';
                    }
                }
            }
        } else {
            if (newPassword || newEmail !== currentDetailClient.email) {
                authMsg = 'Note: service_role key not configured. Saved to table only, login not changed.';
            }
        }

        // 3. Update local data
        currentDetailClient.name = newName;
        currentDetailClient.email = newEmail;
        if (newPassword) currentDetailClient.password = newPassword;

        saveBtn.textContent = 'Saved!';
        saveBtn.style.background = 'rgba(16, 185, 129, 0.15)';
        saveBtn.style.borderColor = '#10b981';
        saveBtn.style.color = '#10b981';

        // Show auth status
        const subtitle = document.getElementById('client-detail-subtitle');
        if (authMsg) {
            subtitle.textContent = authMsg;
            subtitle.style.color = authMsg.includes('Warning') ? '#fbbf24' : '#34d399';
        } else {
            subtitle.textContent = 'Changes saved successfully.';
            subtitle.style.color = '#34d399';
        }

        clientsFetched = false;

        setTimeout(() => {
            closeClientDetail();
            saveBtn.textContent = 'Save Changes';
            saveBtn.style.background = '';
            saveBtn.style.borderColor = '';
            saveBtn.style.color = '';
            saveBtn.disabled = false;
            subtitle.textContent = "View and edit this client's information.";
            subtitle.style.color = '';
            fetchClients();
        }, 2500);
    } catch (err) {
        saveBtn.textContent = 'Failed';
        saveBtn.style.color = '#ef4444';
        const subtitle = document.getElementById('client-detail-subtitle');
        subtitle.textContent = err.message;
        subtitle.style.color = '#ef4444';
        console.error("Save failed:", err);
        setTimeout(() => {
            saveBtn.textContent = 'Save Changes';
            saveBtn.style.color = '';
            saveBtn.disabled = false;
            subtitle.textContent = "View and edit this client's information.";
            subtitle.style.color = '';
        }, 4000);
    }
}

// =========================================================================
// FETCH LEADS
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
                leadsContainer.innerHTML = '<div style="padding: 32px; text-align: center; color: rgba(248,249,250,0.4); font-size: 0.9rem;">Table "inquiries" not found. Create it in Supabase.</div>';
            } else {
                leadsContainer.innerHTML = '<div style="padding: 32px; text-align: center; color: rgba(248,249,250,0.4); font-size: 0.9rem;">Permission issue (RLS). Add a SELECT policy for authenticated users.</div>';
            }
            return;
        }

        allLeads = leads || [];
        if (leadCountEl) leadCountEl.textContent = `(${allLeads.length})`;

        if (allLeads.length === 0) {
            leadsContainer.innerHTML = '<div style="padding: 32px; color: rgba(248,249,250,0.4); font-size: 0.9rem;">No inquiries yet. When someone fills the contact form, they will appear here.</div>';
            return;
        }

        renderCurrentView();
    } catch (err) {
        console.error("Error fetching leads:", err);
        leadsContainer.innerHTML = `<div style="padding: 32px; color: #ff6b6b; font-size: 0.9rem;">Error: ${err.message}</div>`;
    }
}

// =========================================================================
// TOOLBAR: Sorting & View Toggle
// =========================================================================
function setupToolbar() {
    // Sort buttons
    document.querySelectorAll('.leads-sort-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.leads-sort-btn').forEach(b => b.classList.remove('is-active'));
            btn.classList.add('is-active');
            currentSort = btn.dataset.sort;
            currentPage = 1;
            renderCurrentView();
        });
    });

    // View toggle
    document.querySelectorAll('.leads-view-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.leads-view-btn').forEach(b => b.classList.remove('is-active'));
            btn.classList.add('is-active');
            currentView = btn.dataset.view;
            currentPage = 1;
            renderCurrentView();
        });
    });
}

// =========================================================================
// SORTING
// =========================================================================
function getSortedLeads() {
    const sorted = [...allLeads];
    switch (currentSort) {
        case 'newest':
            sorted.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
            break;
        case 'oldest':
            sorted.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
            break;
        case 'name':
            sorted.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
            break;
        case 'interest':
            sorted.sort((a, b) => (a.interest || '').localeCompare(b.interest || ''));
            break;
    }
    return sorted;
}

// =========================================================================
// RENDER: Decides grouped vs flat
// =========================================================================
function renderCurrentView() {
    if (currentView === 'grouped') {
        renderGroupedView();
    } else {
        renderFlatView();
    }
}

// =========================================================================
// FLAT VIEW (with pagination)
// =========================================================================
function renderFlatView() {
    const leadsContainer = document.getElementById('leads-list');
    const paginationContainer = document.getElementById('leads-pagination');
    leadsContainer.innerHTML = '';

    const sorted = getSortedLeads();
    const totalPages = Math.ceil(sorted.length / LEADS_PER_PAGE);
    if (currentPage > totalPages) currentPage = totalPages;

    const start = (currentPage - 1) * LEADS_PER_PAGE;
    const pageLeads = sorted.slice(start, start + LEADS_PER_PAGE);

    pageLeads.forEach((lead, i) => {
        const globalIndex = start + i + 1;
        const row = createLeadRow(lead, globalIndex);
        leadsContainer.appendChild(row);
    });

    renderPagination(totalPages, paginationContainer);
    attachLeadListeners(leadsContainer);
}

// =========================================================================
// GROUPED VIEW (by email, with pagination on groups)
// =========================================================================
function renderGroupedView() {
    const leadsContainer = document.getElementById('leads-list');
    const paginationContainer = document.getElementById('leads-pagination');
    leadsContainer.innerHTML = '';

    const sorted = getSortedLeads();

    // Group by email
    const groups = {};
    sorted.forEach(lead => {
        const key = (lead.email || 'unknown').toLowerCase();
        if (!groups[key]) {
            groups[key] = {
                name: lead.name || 'Unknown',
                email: lead.email || 'unknown',
                leads: [],
                latestDate: lead.created_at
            };
        }
        groups[key].leads.push(lead);
    });

    const groupArray = Object.values(groups);

    // Sort groups by latest inquiry
    if (currentSort === 'newest') {
        groupArray.sort((a, b) => new Date(b.latestDate) - new Date(a.latestDate));
    } else if (currentSort === 'oldest') {
        groupArray.sort((a, b) => new Date(a.latestDate) - new Date(b.latestDate));
    } else if (currentSort === 'name') {
        groupArray.sort((a, b) => a.name.localeCompare(b.name));
    }

    const totalPages = Math.ceil(groupArray.length / LEADS_PER_PAGE);
    if (currentPage > totalPages) currentPage = totalPages;

    const start = (currentPage - 1) * LEADS_PER_PAGE;
    const pageGroups = groupArray.slice(start, start + LEADS_PER_PAGE);

    pageGroups.forEach((group, gi) => {
        const safeName = (group.name).replace(/"/g, '&quot;');
        const safeEmail = (group.email).replace(/"/g, '&quot;');

        const groupEl = document.createElement('div');
        groupEl.className = 'lead-group';
        if (group.leads.length === 1) groupEl.classList.add('is-open'); // auto-expand singles

        const interestsSet = new Set(group.leads.map(l => l.interest ? l.interest.toUpperCase() : 'GENERAL'));
        const interests = [...interestsSet].join(', ');

        groupEl.innerHTML = `
            <div class="lead-group-header">
                <div class="lead-group-info">
                    <strong>${group.name}</strong>
                    <span>${group.email} • ${interests}</span>
                </div>
                <div class="lead-group-right">
                    <span class="lead-group-count">${group.leads.length} ${group.leads.length === 1 ? 'inquiry' : 'inquiries'}</span>
                    <button class="button button-secondary" style="padding: 6px 14px; font-size: 0.78rem;" data-copy="${safeEmail}">Copy Email</button>
                    <button class="button button-primary" style="padding: 6px 14px; font-size: 0.78rem;" data-activate-email="${safeEmail}" data-activate-name="${safeName}">Activate</button>
                    <div class="lead-group-chevron">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
                    </div>
                </div>
            </div>
            <div class="lead-group-body">
                ${group.leads.map((lead, li) => {
                    const date = new Date(lead.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
                    return `
                        <div class="payment-row">
                            <div class="payment-info">
                                <span style="font-size: 0.82rem; color: rgba(248,249,250,0.5);">${lead.interest ? lead.interest.toUpperCase() : 'GENERAL'} • ${date}</span>
                                <p style="margin: 6px 0 0; color: rgba(248, 249, 250, 0.35); font-size: 0.85rem; font-style: italic;">"${lead.message || 'No message'}"</p>
                                ${lead.phone ? `<span style="display: block; margin-top: 4px; font-size: 0.78rem; color: rgba(248,249,250,0.25);">📞 ${lead.phone}</span>` : ''}
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;

        // Toggle group open/close
        const header = groupEl.querySelector('.lead-group-header');
        header.addEventListener('click', (e) => {
            // Don't toggle when clicking buttons
            if (e.target.closest('button')) return;
            groupEl.classList.toggle('is-open');
        });

        leadsContainer.appendChild(groupEl);
    });

    renderPagination(totalPages, paginationContainer);
    attachLeadListeners(leadsContainer);
}

// =========================================================================
// LEAD ROW (flat view)
// =========================================================================
function createLeadRow(lead, index) {
    const date = new Date(lead.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    const safeName = (lead.name || 'Unknown').replace(/"/g, '&quot;');
    const safeEmail = (lead.email || '').replace(/"/g, '&quot;');

    const row = document.createElement('div');
    row.className = 'payment-row';
    row.innerHTML = `
        <div class="payment-info">
            <strong><span style="color: rgba(248,249,250,0.25); font-weight: 400; margin-right: 8px;">${index}.</span>${lead.name || 'Unknown'}</strong>
            <span>${lead.email} • ${lead.interest ? lead.interest.toUpperCase() : 'GENERAL'} • ${date}</span>
            <p style="margin: 6px 0 0; color: rgba(248, 249, 250, 0.35); font-size: 0.85rem; font-style: italic;">"${lead.message || 'No message'}"</p>
            ${lead.phone ? `<span style="display: block; margin-top: 4px; font-size: 0.78rem; color: rgba(248,249,250,0.25);">📞 ${lead.phone}</span>` : ''}
        </div>
        <div class="payment-detail" style="flex-direction: row; align-items: center; gap: 10px; flex-shrink: 0;">
            <button class="button button-secondary" style="padding: 6px 14px; font-size: 0.78rem; white-space: nowrap;" data-copy="${safeEmail}">Copy Email</button>
            <button class="button button-primary" style="padding: 6px 14px; font-size: 0.78rem; white-space: nowrap;" data-activate-email="${safeEmail}" data-activate-name="${safeName}">Activate</button>
        </div>
    `;
    return row;
}

// =========================================================================
// PAGINATION
// =========================================================================
function renderPagination(totalPages, container) {
    container.innerHTML = '';
    if (totalPages <= 1) return;

    // Prev
    const prevBtn = document.createElement('button');
    prevBtn.innerHTML = '‹';
    prevBtn.disabled = currentPage === 1;
    prevBtn.addEventListener('click', () => { currentPage--; renderCurrentView(); });
    container.appendChild(prevBtn);

    // Page numbers
    for (let i = 1; i <= totalPages; i++) {
        const btn = document.createElement('button');
        btn.textContent = i;
        if (i === currentPage) btn.classList.add('is-active');
        btn.addEventListener('click', () => { currentPage = i; renderCurrentView(); });
        container.appendChild(btn);
    }

    // Next
    const nextBtn = document.createElement('button');
    nextBtn.innerHTML = '›';
    nextBtn.disabled = currentPage === totalPages;
    nextBtn.addEventListener('click', () => { currentPage++; renderCurrentView(); });
    container.appendChild(nextBtn);
}

// =========================================================================
// EVENT DELEGATION (Copy + Activate buttons)
// =========================================================================
function attachLeadListeners(container) {
    container.addEventListener('click', (e) => {
        const copyBtn = e.target.closest('[data-copy]');
        if (copyBtn) {
            e.stopPropagation();
            navigator.clipboard.writeText(copyBtn.dataset.copy);
            const original = copyBtn.textContent;
            copyBtn.textContent = 'Copied!';
            copyBtn.style.color = '#10b981';
            setTimeout(() => { copyBtn.textContent = original; copyBtn.style.color = ''; }, 1500);
            return;
        }

        const activateBtn = e.target.closest('[data-activate-email]');
        if (activateBtn) {
            e.stopPropagation();
            openAdminModal('Activate Portal', 'Create a portal account for this client.', activateBtn.dataset.activateName, activateBtn.dataset.activateEmail);
        }
    });
}

// =========================================================================
// IN-SITE MODAL SYSTEM
// =========================================================================
function openAdminModal(title, desc, name, email) {
    const modal = document.getElementById('admin-modal');
    const formView = document.getElementById('admin-modal-form');
    const resultView = document.getElementById('admin-modal-result');
    const titleEl = document.getElementById('admin-modal-title');
    const descEl = document.getElementById('admin-modal-desc');
    const nameInput = document.getElementById('modal-client-name');
    const emailInput = document.getElementById('modal-client-email');

    formView.style.display = 'block';
    resultView.style.display = 'none';
    titleEl.textContent = title;
    descEl.textContent = desc;
    nameInput.value = name || '';
    emailInput.value = email || '';
    modal.classList.add('is-active');

    setTimeout(() => {
        if (!nameInput.value) nameInput.focus();
        else if (!emailInput.value) emailInput.focus();
    }, 300);
}

window.closeAdminModal = () => {
    document.getElementById('admin-modal').classList.remove('is-active');
};

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
        if (!name) { nameInput.style.borderColor = '#ef4444'; setTimeout(() => nameInput.style.borderColor = '', 2000); }
        if (!email) { emailInput.style.borderColor = '#ef4444'; setTimeout(() => emailInput.style.borderColor = '', 2000); }
        return;
    }

    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Creating...';
    submitBtn.disabled = true;

    try {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
        let password = '';
        for (let i = 0; i < 10; i++) password += chars.charAt(Math.floor(Math.random() * chars.length));
        password += '@Indie';

        let alreadyExists = false;

        const { data, error } = await window.supabaseClient.auth.signUp({
            email, password,
            options: { data: { full_name: name } }
        });

        if (error) {
            // If the user already exists in Auth, that's fine — just add them to clients table
            if (error.message.toLowerCase().includes('already registered') || error.message.toLowerCase().includes('already been registered')) {
                alreadyExists = true;
            } else {
                throw error;
            }
        }

        // Save to clients table with password (upsert to handle duplicates)
        try {
            await window.supabaseClient.from('clients').upsert(
                [{ name, email, password: alreadyExists ? undefined : password }],
                { onConflict: 'email' }
            );
            clientsFetched = false;
        } catch (dbErr) {
            console.warn("Could not save to clients table:", dbErr);
        }

        formView.style.display = 'none';
        resultView.style.display = 'block';

        if (alreadyExists) {
            document.getElementById('admin-modal-title').textContent = 'Client Added';
            document.getElementById('admin-modal-desc').textContent = `${name} already had an account and has been added to your Clients list.`;

            resultContent.innerHTML = `
                <div class="admin-modal-success-icon">✓</div>
                <div class="admin-modal-result-card">
                    <div class="result-row"><span class="result-label">Client</span><span class="result-value">${name}</span></div>
                    <div class="result-row"><span class="result-label">Email</span><span class="result-value">${email}</span></div>
                    <div class="result-row"><span class="result-label">Account</span><span class="result-value" style="color: #fbbf24;">Already Existed</span></div>
                </div>
                <p style="margin-top: 16px; color: rgba(248,249,250,0.35); font-size: 0.82rem;">The client can log in with their existing credentials. If they forgot their password, reset it via Supabase.</p>
            `;
            copyBtn.style.display = 'none';
        } else {
            document.getElementById('admin-modal-title').textContent = 'Account Created';
            document.getElementById('admin-modal-desc').textContent = `Portal access is now ready for ${name}.`;

            resultContent.innerHTML = `
                <div class="admin-modal-success-icon">✓</div>
                <div class="admin-modal-result-card">
                    <div class="result-row"><span class="result-label">Client</span><span class="result-value">${name}</span></div>
                    <div class="result-row"><span class="result-label">Email</span><span class="result-value">${email}</span></div>
                    <div class="result-row"><span class="result-label">Password</span><span class="result-value">${password}</span></div>
                </div>
            `;

            copyBtn.style.display = 'flex';
            copyBtn.textContent = 'Copy Credentials';
            copyBtn.onclick = () => {
                navigator.clipboard.writeText(`Email: ${email}\nPassword: ${password}`);
                copyBtn.textContent = 'Copied!';
                copyBtn.style.color = '#10b981';
                setTimeout(() => { copyBtn.textContent = 'Copy Credentials'; copyBtn.style.color = ''; }, 2000);
            };
        }
    } catch (err) {
        formView.style.display = 'none';
        resultView.style.display = 'block';
        copyBtn.style.display = 'none';
        document.getElementById('admin-modal-title').textContent = 'Failed';
        document.getElementById('admin-modal-desc').textContent = '';
        resultContent.innerHTML = `<div class="admin-modal-error-icon">✕</div><p style="color: rgba(248,249,250,0.5); font-size: 0.9rem;">${err.message}</p>`;
    } finally {
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    }
}

window.closeConfirmModal = (result) => {
    document.getElementById('confirm-modal').classList.remove('is-active');
};
