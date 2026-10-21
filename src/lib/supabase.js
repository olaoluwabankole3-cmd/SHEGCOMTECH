import { createClient } from "@supabase/supabase-js";

const env = import.meta.env || {};
const url = (env.VITE_SUPABASE_URL || "").trim();
const key = (env.VITE_SUPABASE_PUBLISHABLE_KEY || env.VITE_SUPABASE_ANON_KEY || "").trim();

export const supabaseConfigured = Boolean(url && key);
export const supabase = supabaseConfigured
  ? createClient(url, key, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;
