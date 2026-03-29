import { createClient, SupabaseClient } from "@supabase/supabase-js";

// Prefer NEXT_PUBLIC_* (Next.js exposes these to the client). Fall back to EXPO_PUBLIC_* if present.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  // Runtime friendly warning for developers — avoid throwing so app can still boot for pages that don't use Supabase.
  // In production builds this should be set to NEXT_PUBLIC_SUPABASE_*.
  // eslint-disable-next-line no-console
  console.warn('[supabase] NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY are not set. Client operations will fail until these are configured.');
}

// Custom fetch with error handling
const customFetch: typeof fetch = async (input, init) => {
  try {
    const response = await fetch(input, init);
    return response;
  } catch (error: any) {
    console.error('[Supabase fetch error]:', error?.message || error);
    // Re-throw to let Supabase handle it
    throw error;
  }
};

export const supabase: SupabaseClient = (supabaseUrl && supabaseAnonKey)
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
        // Reduce retry attempts to avoid long waits on network errors
        flowType: 'pkce',
      },
      global: {
        fetch: customFetch,
      },
    })
  : // create a minimal stub to avoid runtime crashes when reading properties
    // (most methods will throw if called without proper keys)
    // @ts-ignore
    createClient(supabaseUrl || '', supabaseAnonKey || '');

export default supabase;
