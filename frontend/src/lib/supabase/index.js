import { createClient } from '@supabase/supabase-js';

// Environment variables with fallbacks for development
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'http://localhost:54321';
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY || 'your-local-supabase-key';

// Create a single supabase client for the entire app
export const supabase = createClient(supabaseUrl, supabaseKey);

// Check if we're in development or production mode
export const isProduction = import.meta.env.VITE_APP_ENV === 'production';
export const isDevelopment = !isProduction; 