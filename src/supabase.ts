/// <reference types="vite/client" />
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim();
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();

// Debugging (Safe)
if (process.env.NODE_ENV !== 'production') {
  console.log('[Supabase] URL detected:', supabaseUrl ? `Yes (${supabaseUrl.substring(0, 10)}...)` : 'No');
  console.log('[Supabase] Key detected:', supabaseAnonKey ? 'Yes' : 'No');
}

const isPlaceholder = !supabaseUrl || supabaseUrl.includes('placeholder') || !supabaseAnonKey || supabaseAnonKey === 'placeholder';

if (isPlaceholder) {
  console.error(
    'CRITICAL: Supabase configuration is missing or using placeholder values.\n' +
    'Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your environment variables.\n' +
    'You can find these in your Supabase Project Settings > API.'
  );
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder'
);

/**
 * Helper to check if Supabase is properly configured
 */
export const isSupabaseConfigured = () => {
  return !isPlaceholder;
};
