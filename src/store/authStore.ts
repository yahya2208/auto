import { create } from 'zustand';
import { supabase, supabaseUrl, supabaseAnonKey } from '../lib/supabase';
import type { Session, User } from '@supabase/supabase-js';
import type { Profile } from '../types/database.types';

interface AuthState {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  setSession: (session: Session | null) => void;
  fetchProfile: (userId: string) => Promise<void>;
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  user: null,
  profile: null,
  loading: true,
  setSession: (session: Session | null) => {
    set({ session, user: session?.user || null, loading: false });
  },
  fetchProfile: async (userId: string) => {
    if (!userId) return;
    console.log('[AUTH] fetchProfile called for:', userId);
    
    try {
      const SUPABASE_URL = supabaseUrl;
      const SUPABASE_KEY = supabaseAnonKey;
      
      // Fetch profile using raw fetch to avoid type issues and be more direct
      const res = await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${userId}&select=*`, {
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
      
      const data = await res.json();
      
      if (Array.isArray(data) && data.length > 0) {
        set({ profile: data[0] as Profile });
        console.log('[AUTH] Profile loaded');
      } else {
        console.warn('[AUTH] No profile found in DB, attempting to create one...');
        
        // Get the current session to get user metadata
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const user = session.user;
          const fallback = {
            id: user.id,
            full_name: user.user_metadata?.full_name || 'مستخدم جديد',
            phone_number: user.user_metadata?.phone_number || '',
            wilaya: user.user_metadata?.wilaya || null,
            qr_code_token: user.user_metadata?.qr_code_token || user.id.substring(0, 12),
            total_qr_scans: 0,
            followers_count: 0,
            is_admin: false
            // Note: we'll skip avatar_url for now in the POST if it might be missing from schema
          };

          // Try to save profile to DB
          const insertRes = await fetch(`${SUPABASE_URL}/rest/v1/profiles`, {
            method: 'POST',
            headers: {
              'apikey': SUPABASE_KEY,
              'Authorization': `Bearer ${session.access_token}`,
              'Content-Type': 'application/json',
              'Prefer': 'return=representation,resolution=merge-duplicates'
            },
            body: JSON.stringify(fallback)
          });

          if (insertRes.ok) {
            const insertedData = await insertRes.json();
            set({ profile: insertedData[0] || fallback });
            console.log('[AUTH] Fallback profile saved successfully');
          } else {
            console.error('[AUTH] Fallback insertion failed:', await insertRes.text());
            set({ profile: fallback as any });
          }
        }
      }
    } catch (err) {
      console.error('[AUTH] Profile error:', err);
    }
  },
  signOut: async () => {
    await supabase.auth.signOut();
    set({ session: null, user: null, profile: null });
  },
}));
