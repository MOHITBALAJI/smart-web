import { createClient } from "@supabase/supabase-js";

const DEFAULT_SUPABASE_URL = "https://yugouljgwarsmkmhutke.supabase.co";
const DEFAULT_SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl1Z291bGpnd2Fyc21rbWh1dGtlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM1NzkxNzksImV4cCI6MjA5OTE1NTE3OX0._nxyemfdh9To0tBtAyfT7PFGP5SWuSIYTBu7mfZAdZQ";

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL as string) || DEFAULT_SUPABASE_URL;
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string) || DEFAULT_SUPABASE_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

export type UserRole =
  | "super_admin"
  | "district_admin"
  | "camp_officer"
  | "volunteer"
  | "beneficiary";

export interface AppUser {
  id: string;
  full_name: string;
  phone: string | null;
  avatar_url: string | null;
  role: UserRole;
  district_id: string | null;
  is_active: boolean;
  email: string;
}
