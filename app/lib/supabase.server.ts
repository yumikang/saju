import { createClient } from '@supabase/supabase-js';
import type { Database } from '~/types/supabase';

// Server-side Supabase client factory
export function createServerSupabaseClient() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Supabase URL and Service Role Key must be provided');
  }

  return createClient<Database>(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

// Browser-safe Supabase client factory (using anon key)
export function createBrowserSupabaseClient() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase URL and Anon Key must be provided');
  }

  return createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
  });
}

// Remix loader/action helper for authenticated requests
export async function getSupabaseClient(request: Request) {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase configuration missing');
  }

  // Get the authorization header from the request
  const authHeader = request.headers.get('Authorization');
  
  const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    global: {
      headers: authHeader ? { Authorization: authHeader } : {},
    },
  });

  return supabase;
}

// Helper function to get session from request
export async function getSession(request: Request) {
  const supabase = await getSupabaseClient(request);
  
  // Get the session from the Authorization header
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.slice(7);
  
  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      return null;
    }
    
    return { user, token };
  } catch {
    return null;
  }
}

// Helper function to require authentication
export async function requireAuth(request: Request) {
  const session = await getSession(request);
  
  if (!session) {
    throw new Response('Unauthorized', { 
      status: 401,
      statusText: 'Authentication required' 
    });
  }
  
  return session;
}