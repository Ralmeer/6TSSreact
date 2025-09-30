const config = {
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL,
  supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY,
  supabaseServiceRoleKey: import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY,
  apiUrl: import.meta.env.VITE_API_URL || 'https://my-backend-worker.jeanmichelwilliams3.workers.dev',
};

export default config;