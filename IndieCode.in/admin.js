/**
 * Admin Dashboard Logic
 * Handles lead fetching, status updates, and security.
 */

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Initial Security Check
    const isAdmin = await checkAdminAccess();
    if (!isAdmin) return; // checkAdminAccess handles the redirect

    // 2. Fetch and Render Leads
    fetchLeads();

    // 3. Setup UI Listeners
    setupAdminListeners();
});

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
 */
async function fetchLeads() {
    const leadsContainer = document.getElementById('leads-list');
    if (!leadsContainer) return;

    leadsContainer.innerHTML = '<div class="loading-state">Loading leads...</div>';

    try {
        const { data: leads, error } = await window.supabaseClient
            .from('inquiries')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        if (!leads || leads.length === 0) {
            leadsContainer.innerHTML = '<div class="empty-state">No inquiries yet. When someone fills the contact form, they will appear here.</div>';
            return;
        }

        renderLeads(leads);
    } catch (err) {
        console.error("Error fetching leads:", err);
        leadsContainer.innerHTML = '<div class="error-state">Failed to load leads. Table "inquiries" might not exist yet.</div>';
    }
}

/**
 * Dynamically builds the leads table.
 */
function renderLeads(leads) {
    const leadsContainer = document.getElementById('leads-list');
    leadsContainer.innerHTML = '';

    leads.forEach(lead => {
        const date = new Date(lead.created_at).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short'
        });

        const row = document.createElement('div');
        row.className = 'payment-row reveal-visible';
        row.innerHTML = `
            <div class="payment-info">
                <strong>${lead.name} • ${lead.email}</strong>
                <span>Interest: ${lead.interest.toUpperCase()} • Received: ${date}</span>
                <p style="margin: 8px 0 0; color: rgba(248, 249, 250, 0.4); font-size: 0.85rem;">"${lead.message}"</p>
                <span style="display: block; margin-top: 4px; font-size: 0.8rem; color: var(--bg-5)">Phone: ${lead.phone || 'N/A'}</span>
            </div>
            <div class="payment-detail" style="flex-direction: row; align-items: center; gap: 16px;">
                <button class="button button-secondary" style="padding: 8px 16px; font-size: 0.85rem;" onclick="copyLeadDetails('${lead.email}')">Copy Email</button>
                <button class="button button-primary" style="padding: 8px 16px; font-size: 0.85rem;" onclick="initializeAccount('${lead.email}', '${lead.name}')">Activate Portal</button>
            </div>
        `;
        leadsContainer.appendChild(row);
    });
}

/**
 * Utility: Copy email to clipboard
 */
window.copyLeadDetails = (email) => {
    navigator.clipboard.writeText(email);
    alert("Lead email copied to clipboard!");
};

/**
 * Manual Account Creation (The plan we discussed)
 */
window.initializeAccount = async (email, name) => {
    const confirmActivation = confirm(`Are you sure you want to create a portal account for ${name} (${email})?`);
    if (!confirmActivation) return;

    try {
        // Step 1: Generate a password
        const password = Math.random().toString(36).slice(-10) + "Indie!";
        
        // Step 2: Sign up user
        const { data, error } = await window.supabaseClient.auth.signUp({
            email,
            password,
            options: { data: { full_name: name } }
        });

        if (error) throw error;

        alert(`✅ Portal account successfully created for ${name}.\n\nThe temporary password is: ${password}\n\nPlease share these credentials manually.`);
    } catch (err) {
        alert("Activation failed: " + err.message);
    }
};

function setupAdminListeners() {
    // Add any future admin listeners here
}
