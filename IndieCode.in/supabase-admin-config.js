// Admin-only Supabase client with service_role key
// This key has full admin access — it's only loaded on admin.html which is behind auth.

const SUPABASE_ADMIN_URL = 'https://rfkupajvsrbzhjcylwzn.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJma3VwYWp2c3JiemhqY3lsd3puIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDYyNjIwNCwiZXhwIjoyMDkwMjAyMjA0fQ.aPv34cnMGxEwH60KUAmYN1VtgpnotHddbYfZ6Kg7ztI';

// Create admin client using the same global supabase library
if (window.supabase) {
    window.supabaseAdmin = window.supabase.createClient(SUPABASE_ADMIN_URL, SUPABASE_SERVICE_KEY);
    console.log("Admin Supabase Client Initialized (service_role).");
} else {
    console.error("Admin config: Supabase library not loaded yet.");
}
