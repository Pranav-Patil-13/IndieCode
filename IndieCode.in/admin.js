/**
 * Admin Dashboard Logic
 * Handles lead fetching, status updates, manual account creation, and security.
 */

document.addEventListener('DOMContentLoaded', async () => {
    // Wait a beat for supabase-config.js to initialize the client
    await waitForSupabase();

    // 1. Security: Only allow authorized admins
    const isAdmin = await checkAdminAccess();
    if (!isAdmin) return;

    // 2. Fetch and render real leads
    fetchLeads();

    // 3. Wire up the "+ New Client" button
    const newClientBtn = document.getElementById('new-client-btn');
    if (newClientBtn) {
        newClientBtn.addEventListener('click', showNewClientModal);
    }
});

/**
 * Waits for supabaseClient to be ready (handles script load order).
 */
function waitForSupabase() {
    return new Promise((resolve) => {
        if (window.supabaseClient) return resolve();
        const check = setInterval(() => {
            if (window.supabaseClient) {
                clearInterval(check);
                resolve();
            }
        }, 100);
        // Timeout after 5s
        setTimeout(() => { clearInterval(check); resolve(); }, 5000);
    });
}

/**
 * Ensures ONLY the authorized admin can view this page.
 */
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
        console.warn("Unauthorized access attempt by:", session.user.email);
        window.location.href = 'index.html';
        return false;
    }

    // Show body now that we're authorized
    document.body.style.opacity = '1';
    return true;
}

/**
 * Fetches real leads from Supabase 'inquiries' table.
 * If RLS blocks read, we show a helpful setup message.
 */
async function fetchLeads() {
    const leadsContainer = document.getElementById('leads-list');
    const leadCountEl = document.getElementById('lead-count');
    if (!leadsContainer) return;

    leadsContainer.innerHTML = '<div class="loading-state" style="padding: 24px; color: rgba(248,249,250,0.4); font-size: 0.9rem;">Loading leads...</div>';

    try {
        const { data: leads, error } = await window.supabaseClient
            .from('inquiries')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error("Supabase fetch error:", error);
            // Distinguish between 'table does not exist' and 'permission denied'
            if (error.code === '42P01' || error.message.includes('does not exist')) {
                leadsContainer.innerHTML = `
                    <div class="admin-notice" style="padding: 32px; text-align: center;">
                        <h4 style="color: var(--bg-0); margin-bottom: 8px;">Table Setup Required</h4>
                        <p style="color: rgba(248,249,250,0.4); font-size: 0.9rem; line-height: 1.6;">
                            The <code>inquiries</code> table doesn't exist in your Supabase project yet.<br>
                            Go to <strong>Supabase → Table Editor → New Table</strong> and create a table called <code>inquiries</code> with columns:<br>
                            <code>id</code> (uuid, primary key), <code>name</code> (text), <code>email</code> (text), <code>phone</code> (text), 
                            <code>interest</code> (text), <code>message</code> (text), <code>created_at</code> (timestamptz, default now()).
                        </p>
                    </div>`;
            } else {
                leadsContainer.innerHTML = `
                    <div class="admin-notice" style="padding: 32px; text-align: center;">
                        <h4 style="color: var(--bg-0); margin-bottom: 8px;">Permission Denied (RLS)</h4>
                        <p style="color: rgba(248,249,250,0.4); font-size: 0.9rem; line-height: 1.6;">
                            The <code>inquiries</code> table has Row Level Security enabled but no <strong>SELECT</strong> policy for authenticated users.<br>
                            Go to <strong>Supabase → Authentication → Policies</strong> for the <code>inquiries</code> table and add:<br>
                            <code>CREATE POLICY "Admin can read all" ON inquiries FOR SELECT TO authenticated USING (true);</code>
                        </p>
                    </div>`;
            }
            return;
        }

        if (!leads || leads.length === 0) {
            leadsContainer.innerHTML = '<div class="empty-state" style="padding: 32px; color: rgba(248,249,250,0.4); font-size: 0.9rem;">No inquiries yet. When someone fills the contact form, they will appear here.</div>';
            if (leadCountEl) leadCountEl.textContent = '0';
            return;
        }

        if (leadCountEl) leadCountEl.textContent = leads.length;
        renderLeads(leads);
    } catch (err) {
        console.error("Error fetching leads:", err);
        leadsContainer.innerHTML = `<div class="error-state" style="padding: 32px; color: #ff6b6b; font-size: 0.9rem;">Error: ${err.message}</div>`;
    }
}

/**
 * Dynamically builds the leads list.
 */
function renderLeads(leads) {
    const leadsContainer = document.getElementById('leads-list');
    leadsContainer.innerHTML = '';

    leads.forEach(lead => {
        const date = new Date(lead.created_at).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });

        const escapedName = (lead.name || '').replace(/'/g, "\\'");
        const escapedEmail = (lead.email || '').replace(/'/g, "\\'");
        const escapedMessage = (lead.message || 'No message provided').replace(/'/g, "\\'");

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
                <button class="button button-secondary" style="padding: 8px 16px; font-size: 0.8rem; white-space: nowrap;" onclick="copyLeadDetails('${escapedEmail}')">Copy Email</button>
                <button class="button button-primary" style="padding: 8px 16px; font-size: 0.8rem; white-space: nowrap;" onclick="initializeAccount('${escapedEmail}', '${escapedName}')">Activate Portal</button>
            </div>
        `;
        leadsContainer.appendChild(row);
    });
}

/**
 * Copy email to clipboard
 */
window.copyLeadDetails = (email) => {
    navigator.clipboard.writeText(email).then(() => {
        // Brief visual feedback instead of alert
        const btn = event.target;
        const original = btn.textContent;
        btn.textContent = 'Copied!';
        btn.style.color = '#10b981';
        setTimeout(() => { btn.textContent = original; btn.style.color = ''; }, 1500);
    });
};

/**
 * Manual Account Creation — only when you're ready to onboard a client.
 */
window.initializeAccount = async (email, name) => {
    const confirmActivation = confirm(`Create a portal account for ${name} (${email})?`);
    if (!confirmActivation) return;

    try {
        // Generate a secure random password
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

        // Copy credentials to clipboard automatically
        const credentials = `Email: ${email}\nPassword: ${password}`;
        await navigator.clipboard.writeText(credentials);

        alert(`✅ Portal account created for ${name}!\n\nCredentials copied to clipboard:\nEmail: ${email}\nPassword: ${password}\n\nShare these with the client securely.`);
    } catch (err) {
        alert("Activation failed: " + err.message);
    }
};

/**
 * "+ New Client" Modal — creates a client account directly.
 */
function showNewClientModal() {
    const name = prompt("Enter client's full name:");
    if (!name) return;
    
    const email = prompt("Enter client's email address:");
    if (!email) return;

    initializeAccount(email, name);
}
