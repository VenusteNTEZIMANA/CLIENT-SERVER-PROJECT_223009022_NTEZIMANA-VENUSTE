
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim()
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim()

console.log('SUPABASE URL:', supabaseUrl)
console.log('SUPABASE KEY PREFIX:', supabaseAnonKey?.slice(0, 15))

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables.')
}

if (supabaseUrl.includes('your_project_id')) {
  throw new Error('Incorrect Supabase URL. Check your .env file.')
}

export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  }
)