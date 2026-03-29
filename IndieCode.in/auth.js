// Authentication Logic

document.addEventListener('DOMContentLoaded', () => {
    
    // ----------- LOGIN LOGIC -----------
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        // Change the dummy "Access Portal" button back to submit type
        const submitBtn = loginForm.querySelector('.submit-btn');
        submitBtn.type = 'submit';
        submitBtn.removeAttribute('onclick'); // Remove the pending alert
        
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const statusDiv = document.getElementById('auth-status');
            const submitBtnText = submitBtn.querySelector('span');
            
            // UI Loading state
            submitBtn.classList.add('is-loading');
            submitBtnText.innerText = 'Authenticating...';
            statusDiv.className = 'form-status';
            statusDiv.innerText = '';
            
            try {
                // Supabase Auth SignIn
                const { data, error } = await supabaseClient.auth.signInWithPassword({
                    email: email,
                    password: password,
                });
                
                if (error) throw error;
                
                // Success: Redirect to Dashboard based on user role or simply to portal
                statusDiv.className = 'form-status success';
                statusDiv.style.color = '#34d399';
                statusDiv.innerText = 'Login successful! Redirecting...';
                
                // In a real app we'd fetch the user profile here to check if Admin or Client.
                // For now, let's look at the email to decide routing.
                // Pranav is the admin, everyone else goes to client portal.
                const adminEmails = ['admin@indiecode.in', 'hello@indiecode.in', 'pranavpatil13.2004@gmail.com'];
                if (adminEmails.includes(email)) {
                    window.location.href = 'admin.html';
                } else {
                    window.location.href = 'portal.html';
                }
                
            } catch (error) {
                // UI Error state
                statusDiv.className = 'form-status error';
                statusDiv.innerText = error.message;
            } finally {
                submitBtn.classList.remove('is-loading');
                submitBtnText.innerText = 'Access Portal';
            }
        });
    }

    // ----------- ROUTE PROTECTION -----------
    // Add logic to protect dashboard pages
    const isProtectedPage = window.location.pathname.includes('portal.html') || window.location.pathname.includes('admin.html');
    
    if (isProtectedPage) {
        checkSession();
    }
});

// Function to enforce login on protected pages
async function checkSession() {
    const { data: { session }, error } = await supabaseClient.auth.getSession();
    
    if (!session) {
        console.log("No valid session found. Redirecting to login...");
        // If not logged in, boot them to the login screen
        window.location.href = 'login.html';
    } else {
        // Load the accurate user info into the sidebar
        const userEmail = session.user.email;
        const userInfoDisplay = document.querySelector('.portal-user-info span');
        if(userInfoDisplay) {
            userInfoDisplay.innerText = userEmail;
        }
    }
}

// Function to allow sign out
window.signOutUser = async function() {
    const { error } = await supabaseClient.auth.signOut();
    if (!error) {
        window.location.href = 'login.html';
    }
}
