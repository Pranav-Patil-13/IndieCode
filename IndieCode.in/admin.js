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

        const { data, error } = await window.supabaseClient.auth.signUp({
            email, password,
            options: { data: { full_name: name } }
        });
        if (error) throw error;

        formView.style.display = 'none';
        resultView.style.display = 'block';
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
