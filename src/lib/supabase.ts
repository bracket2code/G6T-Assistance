import { createClient } from '@supabase/supabase-js'
import type { Database } from '../types/supabase'
import { handleRequest } from './utils'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

const supabaseOptions = {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
    storage: localStorage
  },
  global: {
    headers: {
      'X-Client-Info': 'supabase-js-web',
      'Cache-Control': 'no-store',
      'Pragma': 'no-cache'
    }
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  },
  db: {
    schema: 'public'
  }
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, supabaseOptions)

// Re-export handleRequest as retryRequest for backward compatibility
export const retryRequest = handleRequest