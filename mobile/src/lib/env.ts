// Environment configuration for mobile app
// Hardcoded values from app.json extra field

// Valores do app.json "extra"
export const ENV = {
  SUPABASE_URL: 'https://amybrdlkfocmiolcnybl.supabase.co',
  SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFteWJyZGxrZm9jbWlvbGNueWJsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg0MDQ3ODYsImV4cCI6MjA4Mzk4MDc4Nn0.B4R_9h58oSeC56l_eLafQk1fJpI29cM8T5rzqM5s2lg',
  API_URL: 'https://kanux-mobile-web.onrender.com',
};

// Validate configuration
if (!ENV.SUPABASE_URL) {
  console.error('❌ Supabase URL is not configured.');
}

if (!ENV.SUPABASE_ANON_KEY) {
  console.error('❌ Supabase ANON KEY is not configured.');
}