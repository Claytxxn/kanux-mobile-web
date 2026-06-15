import Constants from 'expo-constants';

// Environment configuration for mobile app
//
// IMPORTANTE: O Expo Go não lê `Constants.expoConfig.extra` de forma confiável
// em todos os cenários (ex.: tunnel/dev client). Por isso, mantemos como
// fallback as mesmas credenciais públicas já presentes em app.json > extra.
// São chaves "anon" (somente leitura/RLS), portanto seguras para ficarem no app.

const FALLBACK_SUPABASE_URL = 'https://amybrdlkfocmiolcnybl.supabase.co';
const FALLBACK_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFteWJyZGxrZm9jbWlvbGNueWJsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg0MDQ3ODYsImV4cCI6MjA4Mzk4MDc4Nn0.B4R_9h58oSeC56l_eLafQk1fJpI29cM8T5rzqM5s2lg';

const supabaseUrl = Constants.expoConfig?.extra?.supabaseUrl ||
                    process.env.EXPO_PUBLIC_SUPABASE_URL ||
                    FALLBACK_SUPABASE_URL;

const supabaseAnonKey = Constants.expoConfig?.extra?.supabaseAnonKey ||
                        process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
                        FALLBACK_SUPABASE_ANON_KEY;

export const ENV = {
  SUPABASE_URL: supabaseUrl,
  SUPABASE_ANON_KEY: supabaseAnonKey,
};

// Validate configuration
if (ENV.SUPABASE_URL.includes('your-project') || !ENV.SUPABASE_URL) {
  console.warn('⚠️ Supabase URL not configured. Please update src/lib/env.ts or app.json');
}

if (ENV.SUPABASE_ANON_KEY.includes('your-anon-key') || !ENV.SUPABASE_ANON_KEY) {
  console.warn('⚠️ Supabase ANON KEY not configured. Please update src/lib/env.ts or app.json');
}
