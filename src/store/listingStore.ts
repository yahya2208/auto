import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import type { ListingWithDetails } from '../types/database.types';

interface ListingState {
  listings: ListingWithDetails[];
  loading: boolean;
  fetchListings: () => Promise<void>;
  fetchUserListings: (userId: string) => Promise<ListingWithDetails[]>;
}

export const useListingStore = create<ListingState>((set) => ({
  listings: [],
  loading: false,

  fetchListings: async () => {
    set({ loading: true });
    try {
      const { data, error } = await supabase
        .from('listings')
        .select(`
          *,
          profiles:user_id (full_name, phone_number, wilaya, avatar_url),
          listing_media (id, media_type, public_url, is_cover)
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      set({ listings: data as unknown as ListingWithDetails[] });
    } catch (error) {
      console.error('Error fetching listings:', error);
    } finally {
      set({ loading: false });
    }
  },

  fetchUserListings: async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('listings')
        .select(`
          *,
          profiles:user_id (full_name, phone_number, wilaya, avatar_url),
          listing_media (id, media_type, public_url, is_cover)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as unknown as ListingWithDetails[];
    } catch (error) {
      console.error('Error fetching user listings:', error);
      return [];
    }
  }
}));
