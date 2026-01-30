
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://hjtesbenenthxmcaaegm.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhqdGVzYmVuZW50aHhtY2FhZWdtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg1NzQxMDQsImV4cCI6MjA4NDE1MDEwNH0.XEoUSN7qWglXb0onVuSCupvxherQ_8lK-BVOBRWKano';

// Validaciones para desarrollo
export const isKeyValid = supabaseAnonKey.startsWith('eyJ');
export const isStripeKey = supabaseAnonKey.startsWith('sb_') || supabaseAnonKey.startsWith('pk_');

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true
  }
});
