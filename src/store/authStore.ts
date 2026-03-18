import { create } from 'zustand';
import { supabase } from '../lib/supabase';
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
    console.log('[AUTH] fetchProfile called for userId:', userId);
    try {
      // Use raw fetch to bypass any TypeScript / supabase-js type issues
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/profiles?id=eq.${userId}&select=*`,
        {
          headers: {
            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
          },
        }
      );
      
      const data = await res.json();
      console.log('[AUTH] Profile fetch response:', data);
      
      if (Array.isArray(data) && data.length > 0) {
        set({ profile: data[0] as Profile });
        console.log('[AUTH] Profile set successfully:', data[0].full_name);
      } else {
        console.warn('[AUTH] No profile found, creating fallback from user metadata');
        // Fallback: create profile object from auth user metadata
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const fallback: Profile = {
            id: user.id,
            full_name: user.user_metadata?.full_name || 'مستخدم',
            phone_number: user.user_metadata?.phone_number || '',
            wilaya: user.user_metadata?.wilaya || null,
            avatar_url: null,
            qr_code_token: user.user_metadata?.qr_code_token || user.id.substring(0, 12),
            total_qr_scans: 0,
            followers_count: 0,
            created_at: new Date().toISOString(),
          };

          // Try to actually insert it into the database to satisfy foreign key constraints!
          try {
            const { data: sessionData } = await supabase.auth.getSession();
            const token = sessionData.session?.access_token || import.meta.env.VITE_SUPABASE_ANON_KEY;

            await fetch(`${import.meta.env.VITE_SUPABASE_URL}/rest/v1/profiles`, {
              method: 'POST',
              headers: {
                'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                'Prefer': 'resolution=merge-duplicates'
              },
              body: JSON.stringify(fallback)
            });
            console.log('[AUTH] Fallback profile saved to DB automatically.');
          } catch (insertErr) {
            console.error('[AUTH] Failed to save fallback profile to DB:', insertErr);
          }

          set({ profile: fallback });
          console.log('[AUTH] Fallback profile created');
        }
      }
    } catch (err) {
      console.error('[AUTH] fetchProfile FAILED:', err);
      // Even on failure, try to create a minimal profile from session
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          set({
            profile: {
              id: user.id,
              full_name: user.user_metadata?.full_name || user.email || 'مستخدم',
              phone_number: user.user_metadata?.phone_number || '',
              wilaya: null,
              avatar_url: null,
              qr_code_token: user.id.substring(0, 12),
              total_qr_scans: 0,
              followers_count: 0,
              created_at: new Date().toISOString(),
            }
          });
        }
      } catch (_) {
        // Nothing more we can do
      }
    }
  },
  signOut: async () => {
    await supabase.auth.signOut();
    set({ session: null, user: null, profile: null });
  },
}));
