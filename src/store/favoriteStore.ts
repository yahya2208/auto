import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Listing } from '../types/database.types';

interface FavoriteStore {
  favorites: Listing[];
  addFavorite: (listing: Listing) => void;
  removeFavorite: (id: string) => void;
  isFavorite: (id: string) => boolean;
}

export const useFavoriteStore = create<FavoriteStore>()(
  persist(
    (set, get) => ({
      favorites: [],
      addFavorite: (listing) => {
        const { favorites } = get();
        if (!favorites.find(f => f.id === listing.id)) {
          set({ favorites: [...favorites, listing] });
        }
      },
      removeFavorite: (id) => {
        set({ favorites: get().favorites.filter(f => f.id !== id) });
      },
      isFavorite: (id) => {
        return !!get().favorites.find(f => f.id === id);
      },
    }),
    {
      name: 'courtier-favorites',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
