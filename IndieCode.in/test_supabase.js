const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://rfkupajvsrbzhjcylwzn.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJma3VwYWp2c3JiemhqY3lsd3puIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ2MjYyMDQsImV4cCI6MjA5MDIwMjIwNH0.COgc2eXyh_GJW558t0sO11zNkvAYhtehHVmKsh8i9IU');

async function test() {
  try {
    const { data, error } = await supabase.from('products').select('*');
    console.log('Result:', { data, error });
  } catch (e) {
    console.error('Fatal Error:', e);
  }
}
test();
