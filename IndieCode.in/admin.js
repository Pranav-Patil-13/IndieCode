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

let catalogFetched = false;
let editingProductRecordId = null;

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

            // Lazy-load data on first visit
            if (tab === 'clients') fetchClients();
            if (tab === 'projects') fetchProjects();
            if (tab === 'products') fetchProducts();
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
                // Always auto-confirm the user when updating credentials
                authUpdate.email_confirm = true;

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

        // Use admin API (creates confirmed users that can log in immediately)
        if (window.supabaseAdmin) {
            const { data, error } = await window.supabaseAdmin.auth.admin.createUser({
                email,
                password,
                email_confirm: true,
                user_metadata: { full_name: name }
            });

            if (error) {
                if (error.message.toLowerCase().includes('already') || error.message.toLowerCase().includes('exists') || error.message.toLowerCase().includes('registered')) {
                    alreadyExists = true;
                    // Auto-confirm existing user in case they weren't confirmed
                    const { data: { users } } = await window.supabaseAdmin.auth.admin.listUsers();
                    const existingUser = users?.find(u => u.email === email);
                    if (existingUser) {
                        await window.supabaseAdmin.auth.admin.updateUserById(existingUser.id, { email_confirm: true });
                    }
                } else {
                    throw error;
                }
            }
        } else {
            // Fallback: use regular signUp (user may need email confirmation)
            const { data, error } = await window.supabaseClient.auth.signUp({
                email, password,
                options: { data: { full_name: name } }
            });
            if (error) {
                if (error.message.toLowerCase().includes('already registered') || error.message.toLowerCase().includes('already been registered')) {
                    alreadyExists = true;
                } else {
                    throw error;
                }
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

// =========================================================================
// PROJECT MANAGEMENT
// =========================================================================
let projectsFetched = false;
let editingProjectId = null;

async function fetchProjects() {
    if (projectsFetched) return;
    const container = document.getElementById('projects-list');
    const countEl = document.getElementById('project-count');

    try {
        const { data: projects, error } = await window.supabaseClient
            .from('projects')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        projectsFetched = true;

        if (!projects || projects.length === 0) {
            container.innerHTML = '<div style="padding: 32px; color: rgba(248,249,250,0.4); font-size: 0.9rem;">No projects yet. Click "+ New Project" to create one.</div>';
            if (countEl) countEl.textContent = '(0)';
            return;
        }

        if (countEl) countEl.textContent = `(${projects.length})`;
        renderProjects(projects, container);
    } catch (err) {
        container.innerHTML = `<div style="padding: 32px; color: #ff6b6b; font-size: 0.9rem;">Error: ${err.message}</div>`;
    }
}

function renderProjects(projects, container) {
    container.innerHTML = '';

    const statusColors = {
        planning: { bg: 'rgba(99, 102, 241, 0.1)', fg: '#818cf8', label: 'Planning' },
        in_progress: { bg: 'rgba(16, 185, 129, 0.1)', fg: '#34d399', label: 'In Progress' },
        completed: { bg: 'rgba(245, 158, 11, 0.1)', fg: '#fbbf24', label: 'Completed' },
        on_hold: { bg: 'rgba(248, 113, 113, 0.1)', fg: '#f87171', label: 'On Hold' }
    };

    const phases = ['strategy', 'design', 'development', 'launch'];
    const phaseLabels = { strategy: 'Strategy', design: 'Design', development: 'Development', launch: 'Launch' };

    projects.forEach(proj => {
        const sc = statusColors[proj.status] || statusColors.planning;
        const phaseIdx = phases.indexOf(proj.current_phase || 'strategy');
        const phasePercent = Math.round(((phaseIdx + 1) / phases.length) * 100);

        const card = document.createElement('div');
        card.className = 'payment-row';
        card.style.cssText = 'flex-direction: column; align-items: stretch; gap: 16px; padding: 24px; margin-bottom: 12px;';
        card.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                <div>
                    <h4 style="font-size: 1.05rem; font-weight: 600; margin-bottom: 4px;">${proj.name}</h4>
                    <span style="font-size: 0.8rem; color: rgba(248,249,250,0.35);">${proj.client_email}</span>
                </div>
                <div style="display: flex; gap: 8px; align-items: center;">
                    <span style="font-size: 0.72rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em; color: ${sc.fg}; background: ${sc.bg}; padding: 4px 10px; border-radius: 6px;">${sc.label}</span>
                    <button class="button button-secondary" style="padding: 6px 14px; font-size: 0.78rem;" data-edit-project="${proj.id}">Edit</button>
                </div>
            </div>
            <div style="display: flex; gap: 0; align-items: center;">
                ${phases.map((p, i) => `
                    <div style="flex: 1; display: flex; flex-direction: column; align-items: center; gap: 6px;">
                        <div style="width: 12px; height: 12px; border-radius: 50%; background: ${i <= phaseIdx ? sc.fg : 'rgba(248,249,250,0.08)'}; border: 2px solid ${i <= phaseIdx ? sc.fg : 'rgba(248,249,250,0.12)'}; transition: all 0.3s;"></div>
                        <span style="font-size: 0.7rem; color: ${i <= phaseIdx ? 'rgba(248,249,250,0.6)' : 'rgba(248,249,250,0.2)'};">${phaseLabels[p]}</span>
                    </div>
                `).join('<div style="flex: 0.5; height: 2px; background: rgba(248,249,250,0.08); margin-bottom: 18px;"></div>')}
            </div>
            <div style="display: flex; gap: 24px; flex-wrap: wrap;">
                ${proj.tech_stack ? `<div style="font-size: 0.8rem;"><span style="color: rgba(248,249,250,0.3);">Stack</span> <strong style="color: rgba(248,249,250,0.7); margin-left: 6px;">${proj.tech_stack}</strong></div>` : ''}
                ${proj.target_launch ? `<div style="font-size: 0.8rem;"><span style="color: rgba(248,249,250,0.3);">Launch</span> <strong style="color: rgba(248,249,250,0.7); margin-left: 6px;">${proj.target_launch}</strong></div>` : ''}
                ${proj.next_milestone ? `<div style="font-size: 0.8rem;"><span style="color: rgba(248,249,250,0.3);">Next</span> <strong style="color: rgba(248,249,250,0.7); margin-left: 6px;">${proj.next_milestone}</strong></div>` : ''}
            </div>
            ${proj.description ? `<p style="font-size: 0.82rem; color: rgba(248,249,250,0.3); line-height: 1.5; margin: 0;">${proj.description}</p>` : ''}
        `;
        container.appendChild(card);
    });

    // Store for editing
    window._projectsData = {};
    projects.forEach(p => { window._projectsData[p.id] = p; });

    // Event delegation for Edit buttons
    container.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-edit-project]');
        if (btn) {
            const proj = window._projectsData[btn.dataset.editProject];
            if (proj) openProjectModal(proj);
        }
    });
}

// Wire up the "New Project" button
document.addEventListener('DOMContentLoaded', () => {
    const projectBtn = document.getElementById('new-project-btn');
    if (projectBtn) projectBtn.addEventListener('click', () => openProjectModal());

    const productBtn = document.getElementById('new-product-btn');
    if (productBtn) productBtn.addEventListener('click', () => openProductModal());

    const productSubmit = document.getElementById('product-modal-submit');
    if (productSubmit) {
        productSubmit.addEventListener('click', (e) => {
            e.preventDefault();
            saveProduct();
        });
    }
});

function openProjectModal(project) {
    const modal = document.getElementById('project-modal');
    const title = document.getElementById('project-modal-title');
    const desc = document.getElementById('project-modal-desc');
    const submitBtn = document.getElementById('project-modal-submit');

    if (project) {
        editingProjectId = project.id;
        title.textContent = 'Edit Project';
        desc.textContent = 'Update project details.';
        submitBtn.textContent = 'Save Changes';
        document.getElementById('proj-client-email').value = project.client_email || '';
        document.getElementById('proj-name').value = project.name || '';
        document.getElementById('proj-status').value = project.status || 'planning';
        document.getElementById('proj-phase').value = project.current_phase || 'strategy';
        document.getElementById('proj-tech').value = project.tech_stack || '';
        document.getElementById('proj-launch').value = project.target_launch || '';
        document.getElementById('proj-milestone').value = project.next_milestone || '';
        document.getElementById('proj-desc').value = project.description || '';
    } else {
        editingProjectId = null;
        title.textContent = 'New Project';
        desc.textContent = 'Assign a project to a client.';
        submitBtn.textContent = 'Create Project';
        document.getElementById('proj-client-email').value = '';
        document.getElementById('proj-name').value = '';
        document.getElementById('proj-status').value = 'planning';
        document.getElementById('proj-phase').value = 'strategy';
        document.getElementById('proj-tech').value = '';
        document.getElementById('proj-launch').value = '';
        document.getElementById('proj-milestone').value = '';
        document.getElementById('proj-desc').value = '';
    }

    submitBtn.onclick = () => saveProject();
    modal.classList.add('is-active');
}

window.closeProjectModal = () => {
    document.getElementById('project-modal').classList.remove('is-active');
    editingProjectId = null;
};

async function saveProject() {
    const submitBtn = document.getElementById('project-modal-submit');
    const descEl = document.getElementById('project-modal-desc');
    const email = document.getElementById('proj-client-email').value.trim();
    const name = document.getElementById('proj-name').value.trim();

    if (!email || !name) {
        if (!email) document.getElementById('proj-client-email').style.borderColor = '#ef4444';
        if (!name) document.getElementById('proj-name').style.borderColor = '#ef4444';
        setTimeout(() => {
            document.getElementById('proj-client-email').style.borderColor = '';
            document.getElementById('proj-name').style.borderColor = '';
        }, 2000);
        return;
    }

    const projectData = {
        client_email: email,
        name: name,
        status: document.getElementById('proj-status').value,
        current_phase: document.getElementById('proj-phase').value,
        tech_stack: document.getElementById('proj-tech').value.trim() || null,
        target_launch: document.getElementById('proj-launch').value.trim() || null,
        next_milestone: document.getElementById('proj-milestone').value.trim() || null,
        description: document.getElementById('proj-desc').value.trim() || null,
    };

    submitBtn.textContent = 'Saving...';
    submitBtn.disabled = true;

    try {
        let error;
        if (editingProjectId) {
            ({ error } = await window.supabaseClient
                .from('projects')
                .update(projectData)
                .eq('id', editingProjectId));
        } else {
            ({ error } = await window.supabaseClient
                .from('projects')
                .insert([projectData]));
        }

        if (error) throw error;

        descEl.textContent = editingProjectId ? 'Project updated!' : 'Project created!';
        descEl.style.color = '#34d399';
        submitBtn.textContent = 'Done!';
        submitBtn.style.background = 'rgba(16, 185, 129, 0.15)';
        submitBtn.style.borderColor = '#10b981';
        submitBtn.style.color = '#10b981';

        projectsFetched = false;

        setTimeout(() => {
            closeProjectModal();
            submitBtn.textContent = editingProjectId ? 'Save Changes' : 'Create Project';
            submitBtn.style.background = '';
            submitBtn.style.borderColor = '';
            submitBtn.style.color = '';
            submitBtn.disabled = false;
            descEl.style.color = '';
            fetchProjects();
        }, 1200);
    } catch (err) {
        descEl.textContent = 'Error: ' + err.message;
        descEl.style.color = '#ef4444';
        submitBtn.textContent = 'Failed';
        submitBtn.disabled = false;
        setTimeout(() => {
            submitBtn.textContent = editingProjectId ? 'Save Changes' : 'Create Project';
            descEl.textContent = 'Assign a project to a client.';
            descEl.style.color = '';
        }, 3000);
    }
}

// =========================================================================
// PRODUCT CATALOG MANAGEMENT
// =========================================================================
function getBadgePalette(variant) {
    switch (variant) {
        case 'ready':
            return { bg: 'rgba(155, 81, 224, 0.15)', fg: '#c084fc', label: 'Ready Product' };
        case 'custom':
            return { bg: 'rgba(66, 133, 244, 0.15)', fg: '#7baaf7', label: 'Custom Build' };
        default:
            return { bg: 'rgba(248,249,250,0.08)', fg: '#f8f9fa', label: 'Product' };
    }
}

function parseDesktopImagesField(value) {
    if (!value) return [];
    if (Array.isArray(value)) return value.filter(Boolean);
    try {
        const parsed = JSON.parse(value);
        if (Array.isArray(parsed)) return parsed.filter(Boolean);
    } catch (err) {
        // ignore JSON parse issues
    }
    return String(value)
        .split(',')
        .map(s => s.trim())
        .filter(Boolean);
}

async function fetchProducts(force = false) {
    if (!window.supabaseClient) return;
    if (catalogFetched && !force) return;

    const container = document.getElementById('products-list');
    const countEl = document.getElementById('product-count');
    if (!container) return;

    container.innerHTML = '<div style="padding: 32px; color: rgba(248,249,250,0.5);">Loading products...</div>';

    try {
        const { data, error } = await window.supabaseClient
            .from('products')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        catalogFetched = true;
        if (!data || data.length === 0) {
            container.innerHTML = '<div style="padding: 32px; color: rgba(248,249,250,0.4); font-size: 0.9rem;">No products yet. Click "New Product" to publish your first listing.</div>';
            if (countEl) countEl.textContent = '(0)';
            return;
        }

        if (countEl) countEl.textContent = `(${data.length})`;
        renderProducts(data, container);
    } catch (err) {
        console.error('Products fetch failed:', err);
        const missingTable = err.code === '42P01' || (err.message && err.message.includes('does not exist'));
        if (missingTable) {
            container.innerHTML = `
                <div style="padding: 32px; color: rgba(248,249,250,0.75);">
                    <h4 style="margin-bottom: 8px;">Set up the <code>products</code> table</h4>
                    <p style="font-size: 0.85rem; color: rgba(248,249,250,0.55); line-height: 1.6;">
                        Create a table named <strong>products</strong> with columns such as <em>slug</em>, <em>title</em>,
                        <em>card_summary</em>, <em>badge_label</em>, <em>badge_variant</em>, <em>price_label</em>,
                        <em>description</em>, the 3 meta label/value pairs, <em>is_subscription</em>,
                        <em>subscription_price_text</em>, <em>checkout_amount</em>, <em>checkout_button_text</em>,
                        <em>checkout_link</em>, <em>glow_color</em>, <em>card_image</em>, <em>desktop_images</em>,
                        <em>tablet_image</em>, and <em>mobile_image</em>.
                    </p>
                    <p style="font-size: 0.82rem; color: rgba(248,249,250,0.45);">Grant CRUD access to admins via RLS or disable RLS for testing.</p>
                </div>`;
        } else {
            container.innerHTML = `<div style="padding: 32px; color: #ff6b6b; font-size: 0.9rem;">Error: ${err.message}</div>`;
        }
    }
}

function renderProducts(products, container) {
    container.innerHTML = '';
    window._productsCatalog = {};

    products.forEach(product => {
        window._productsCatalog[product.id] = product;
        const badge = getBadgePalette(product.badge_variant);
        const updatedAt = product.updated_at ? new Date(product.updated_at) : (product.created_at ? new Date(product.created_at) : null);
        const updatedText = updatedAt ? updatedAt.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Unknown';

        const card = document.createElement('div');
        card.className = 'payment-row';
        card.style.cssText = 'flex-direction: column; align-items: stretch; gap: 16px; padding: 24px; margin-bottom: 16px;';
        card.innerHTML = `
            <div style="display: flex; justify-content: space-between; gap: 16px; flex-wrap: wrap;">
                <div>
                    <span style="font-size: 0.72rem; color: rgba(248,249,250,0.35); text-transform: uppercase; letter-spacing: 0.12em;">/${product.slug || 'slug'}</span>
                    <h4 style="margin: 6px 0 8px; font-size: 1.1rem;">${product.title || 'Untitled Product'}</h4>
                    <p style="margin: 0; color: rgba(248,249,250,0.5); font-size: 0.9rem; max-width: 620px;">${product.card_summary || product.description || 'Add a summary to show on the homepage.'}</p>
                </div>
                <div style="display: flex; flex-direction: column; gap: 8px; align-items: flex-end; min-width: 150px;">
                    ${product.price_label ? `<span style="font-size: 0.78rem; font-weight: 600; color: rgba(248,249,250,0.9); background: rgba(248,249,250,0.1); padding: 4px 12px; border-radius: 999px;">${product.price_label}</span>` : ''}
                    <span style="font-size: 0.7rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; background: ${badge.bg}; color: ${badge.fg}; padding: 6px 14px; border-radius: 999px;">${product.badge_label || badge.label}</span>
                </div>
            </div>
            <div style="display: flex; justify-content: space-between; gap: 16px; flex-wrap: wrap; align-items: center;">
                <div style="font-size: 0.78rem; color: rgba(248,249,250,0.35);">${product.is_subscription ? 'Subscription' : 'One-time'} • Updated ${updatedText}</div>
                <div style="display: flex; gap: 10px;">
                    <button class="button button-secondary" style="padding: 6px 16px; font-size: 0.78rem;" data-edit-product="${product.id}">Edit</button>
                    <button class="button button-secondary" style="padding: 6px 16px; font-size: 0.78rem; border-color: rgba(248,113,113,0.4); color: #f87171;" data-delete-product="${product.id}">Delete</button>
                </div>
            </div>
        `;
        container.appendChild(card);
    });

    if (!container.dataset.bound) {
        container.addEventListener('click', handleProductListClick);
        container.dataset.bound = 'true';
    }
}

function handleProductListClick(e) {
    const editBtn = e.target.closest('[data-edit-product]');
    if (editBtn) {
        const product = window._productsCatalog?.[editBtn.dataset.editProduct];
        if (product) openProductModal(product);
        return;
    }

    const deleteBtn = e.target.closest('[data-delete-product]');
    if (deleteBtn) {
        const product = window._productsCatalog?.[deleteBtn.dataset.deleteProduct];
        if (product) deleteProduct(product);
    }
}

function openProductModal(product) {
    editingProductRecordId = product ? product.id : null;
    const modal = document.getElementById('product-modal');
    if (!modal) return;

    document.getElementById('product-modal-title').textContent = product ? 'Edit Product' : 'New Product';
    document.getElementById('product-modal-desc').textContent = product ? 'Update the live product listing.' : 'Publish a new build to the catalog.';

    document.getElementById('product-slug').value = product?.slug || '';
    document.getElementById('product-title').value = product?.title || '';
    document.getElementById('product-summary').value = product?.card_summary || '';
    document.getElementById('product-badge-text').value = product?.badge_label || '';
    document.getElementById('product-badge-variant').value = product?.badge_variant || 'ready';
    document.getElementById('product-price-label').value = product?.price_label || '';
    document.getElementById('product-description').value = product?.description || '';

    document.getElementById('product-meta1-label').value = product?.meta1_label || '';
    document.getElementById('product-meta1-value').value = product?.meta1_value || '';
    document.getElementById('product-meta2-label').value = product?.meta2_label || '';
    document.getElementById('product-meta2-value').value = product?.meta2_value || '';
    document.getElementById('product-meta3-label').value = product?.meta3_label || '';
    document.getElementById('product-meta3-value').value = product?.meta3_value || '';

    document.getElementById('product-is-subscription').checked = Boolean(product?.is_subscription);
    document.getElementById('product-subscription-text').value = product?.subscription_price_text || '';
    document.getElementById('product-checkout-btn').value = product?.checkout_button_text || '';
    document.getElementById('product-checkout-link').value = product?.checkout_link || '';
    document.getElementById('product-checkout-amount').value = product?.checkout_amount || '';
    document.getElementById('product-glow').value = product?.glow_color || '';
    document.getElementById('product-card-image').value = product?.card_image || '';

    const desktopImages = parseDesktopImagesField(product?.desktop_images);
    document.getElementById('product-desktop-images').value = desktopImages.join(', ');
    document.getElementById('product-tablet-image').value = product?.tablet_image || '';
    document.getElementById('product-mobile-image').value = product?.mobile_image || '';

    document.getElementById('product-modal-submit').textContent = product ? 'Save Changes' : 'Save Product';

    modal.classList.add('is-active');
    setTimeout(() => document.getElementById('product-title').focus(), 200);
}

window.closeProductModal = () => {
    const modal = document.getElementById('product-modal');
    if (modal) modal.classList.remove('is-active');
    editingProductRecordId = null;
};

async function saveProduct() {
    if (!window.supabaseClient) return;

    const slugInput = document.getElementById('product-slug');
    const titleInput = document.getElementById('product-title');
    const submitBtn = document.getElementById('product-modal-submit');

    const slug = slugInput.value.trim();
    const title = titleInput.value.trim();
    if (!slug || !title) {
        if (!slug) {
            slugInput.style.borderColor = '#ef4444';
            setTimeout(() => slugInput.style.borderColor = '', 2000);
        }
        if (!title) {
            titleInput.style.borderColor = '#ef4444';
            setTimeout(() => titleInput.style.borderColor = '', 2000);
        }
        return;
    }

    const payload = {
        slug,
        title,
        card_summary: document.getElementById('product-summary').value.trim() || null,
        badge_label: document.getElementById('product-badge-text').value.trim() || null,
        badge_variant: document.getElementById('product-badge-variant').value,
        price_label: document.getElementById('product-price-label').value.trim() || null,
        description: document.getElementById('product-description').value.trim() || null,
        meta1_label: document.getElementById('product-meta1-label').value.trim() || null,
        meta1_value: document.getElementById('product-meta1-value').value.trim() || null,
        meta2_label: document.getElementById('product-meta2-label').value.trim() || null,
        meta2_value: document.getElementById('product-meta2-value').value.trim() || null,
        meta3_label: document.getElementById('product-meta3-label').value.trim() || null,
        meta3_value: document.getElementById('product-meta3-value').value.trim() || null,
        is_subscription: document.getElementById('product-is-subscription').checked,
        subscription_price_text: document.getElementById('product-subscription-text').value.trim() || null,
        checkout_button_text: document.getElementById('product-checkout-btn').value.trim() || null,
        checkout_link: document.getElementById('product-checkout-link').value.trim() || null,
        glow_color: document.getElementById('product-glow').value.trim() || null,
        card_image: document.getElementById('product-card-image').value.trim() || null,
        tablet_image: document.getElementById('product-tablet-image').value.trim() || null,
        mobile_image: document.getElementById('product-mobile-image').value.trim() || null
    };

    const checkoutAmount = document.getElementById('product-checkout-amount').value.trim();
    payload.checkout_amount = checkoutAmount ? Number(checkoutAmount) : null;

    const desktopRaw = document.getElementById('product-desktop-images').value;
    const desktopArr = parseDesktopImagesField(desktopRaw);
    payload.desktop_images = desktopArr.length ? JSON.stringify(desktopArr) : null;

    submitBtn.textContent = editingProductRecordId ? 'Saving...' : 'Creating...';
    submitBtn.disabled = true;

    try {
        let error;
        if (editingProductRecordId) {
            ({ error } = await window.supabaseClient
                .from('products')
                .update(payload)
                .eq('id', editingProductRecordId));
        } else {
            ({ error } = await window.supabaseClient
                .from('products')
                .insert([payload]));
        }

        if (error) throw error;

        submitBtn.textContent = 'Saved!';
        submitBtn.style.background = 'rgba(16,185,129,0.15)';
        submitBtn.style.borderColor = '#10b981';
        submitBtn.style.color = '#10b981';
        catalogFetched = false;

        setTimeout(() => {
            closeProductModal();
            submitBtn.textContent = editingProductRecordId ? 'Save Changes' : 'Save Product';
            submitBtn.style.background = '';
            submitBtn.style.borderColor = '';
            submitBtn.style.color = '';
            submitBtn.disabled = false;
            fetchProducts(true);
        }, 1000);
    } catch (err) {
        console.error('Product save failed:', err);
        submitBtn.textContent = 'Failed';
        submitBtn.style.color = '#ef4444';
        setTimeout(() => {
            submitBtn.textContent = editingProductRecordId ? 'Save Changes' : 'Save Product';
            submitBtn.style.color = '';
            submitBtn.disabled = false;
        }, 2500);
    }
}

async function deleteProduct(product) {
    if (!window.supabaseClient || !product?.id) return;
    const confirmed = window.confirm(`Delete "${product.title || product.slug}"? This cannot be undone.`);
    if (!confirmed) return;

    try {
        const { error } = await window.supabaseClient
            .from('products')
            .delete()
            .eq('id', product.id);
        if (error) throw error;
        catalogFetched = false;
        fetchProducts(true);
    } catch (err) {
        alert('Deletion failed: ' + err.message);
    }
}
