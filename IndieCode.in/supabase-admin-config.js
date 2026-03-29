// Admin-only Supabase client with service_role key
// This key has full admin access — it's only loaded on admin.html which is behind auth.
// IMPORTANT: Never expose this on any public-facing page.

const SUPABASE_URL = 'https://rfkupajvsrbzhjcylwzn.supabase.co';

// Paste your service_role key from: Supabase Dashboard → Settings → API → service_role (secret)
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJma3VwYWp2c3JiemhqY3lsd3puIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDYyNjIwNCwiZXhwIjoyMDkwMjAyMjA0fQ.aPv34cnMGxEwH60KUAmYN1VtgpnotHddbYfZ6Kg7ztI';

// Create admin client (only if key is configured)
if (SUPABASE_SERVICE_KEY !== 'YOUR_SERVICE_ROLE_KEY_HERE' && window.supabase) {
    window.supabaseAdmin = window.supabase.createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
    console.log("Admin Supabase Client Initialized (service_role).");
} else {
    console.warn("Admin service_role key not configured. User credential updates will only save to the clients table.");
}
