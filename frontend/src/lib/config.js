// Environment-based app configuration
const config = {
  // Add your environment variables here
  API_URL: import.meta.env.VITE_API_URL || "http://localhost:8000",
  SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
  SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY,
};

export default config;
