import { createClient, SupabaseClient } from "@supabase/supabase-js";

export const serverSupabase = (): SupabaseClient => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  // Always use service role key for server-side operations (bypasses RLS)
  if (!url || !serviceKey) {
    console.error('Missing environment variables:', { 
      url: !!url, 
      serviceKey: !!serviceKey,
      anonKey: !!anonKey
    });
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in env');
  }
  
  console.log('[serverSupabase] Using service role key, URL:', url.substring(0, 30) + '...');
  
  return createClient(url, serviceKey, { 
    auth: { persistSession: false },
    // Force service role mode - bypasses RLS completely
    db: { schema: 'public' },
    // Add custom header to indicate service role usage
    global: {
      headers: {
        'x-service-role': 'true'
      }
    }
  });
};

export default serverSupabase;

