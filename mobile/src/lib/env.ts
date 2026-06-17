import Constants from 'expo-constants';

// Environment configuration for mobile app
// Values are loaded from app.json "extra" field or environment variables

const supabaseUrl = Constants.expoConfig?.extra?.supabaseUrl || 
                    process.env.EXPO_PUBLIC_SUPABASE_URL || 
                    'https://your-project.supabase.co';

const supabaseAnonKey = Constants.expoConfig?.extra?.supabaseAnonKey || 
                        process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 
                        'your-anon-key';

const apiUrl = Constants.expoConfig?.extra?.apiUrl ||
               process.env.EXPO_PUBLIC_API_URL ||
               'https://localhost:3000';

export const ENV = {
  SUPABASE_URL: supabaseUrl,
  SUPABASE_ANON_KEY: supabaseAnonKey,
  API_URL: apiUrl,
};

// Validate configuration
if (ENV.SUPABASE_URL.includes('your-project') || !ENV.SUPABASE_URL) {
  console.warn('⚠️ Supabase URL not configured. Please update app.json or set EXPO_PUBLIC_SUPABASE_URL');
}

if (ENV.SUPABASE_ANON_KEY.includes('your-anon-key') || !ENV.SUPABASE_ANON_KEY) {
  console.warn('⚠️ Supabase ANON KEY not configured. Please update app.json or set EXPO_PUBLIC_SUPABASE_ANON_KEY');
}