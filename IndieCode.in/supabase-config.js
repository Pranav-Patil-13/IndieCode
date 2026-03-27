// Initialize Supabase Client
const SUPABASE_URL = 'https://rfkupajvsrbzhjcylwzn.supabase.co';

// Note: Supabase anon keys usually start with 'eyJhb...' 
// If authentication fails, ensure this is the exact "anon public" API key from your Project Settings -> API.
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJma3VwYWp2c3JiemhqY3lsd3puIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ2MjYyMDQsImV4cCI6MjA5MDIwMjIwNH0.COgc2eXyh_GJW558t0sO11zNkvAYhtehHVmKsh8i9IU';

// Create a global available supabase client (Requires the Supabase CDN script to be loaded first)
if (window.supabase) {
    window.supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    console.log("Supabase Client Initialized.");
} else {
    console.error("Supabase library not found. Ensure the script tag is correctly placed in your HTML.");
}
