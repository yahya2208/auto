export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string;
          phone_number: string;
          wilaya: string | null;
          avatar_url: string | null;
          qr_code_token: string;
          total_qr_scans: number;
          followers_count: number;
          is_admin: boolean;
          is_verified: boolean;
          status: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          full_name: string;
          phone_number: string;
          wilaya?: string | null;
          avatar_url?: string | null;
          qr_code_token?: string;
          total_qr_scans?: number;
          followers_count?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string;
          phone_number?: string;
          wilaya?: string | null;
          avatar_url?: string | null;
          qr_code_token?: string;
          total_qr_scans?: number;
          followers_count?: number;
        };
      };
      listings: {
        Row: {
          id: string;
          user_id: string;
          category: 'car' | 'motorcycle' | 'real_estate';
          listing_type: 'sell' | 'buy' | 'exchange';
          title: string;
          description: string;
          price: number | null;
          currency: string;
          wilaya: string;
          commune: string | null;
          is_negotiable: boolean;
          is_active: boolean;
          view_count: number;
          car_brand: string | null;
          car_model: string | null;
          car_year: number | null;
          mileage: number | null;
          fuel_type: string | null;
          transmission: string | null;
          condition: string | null;
          moto_brand: string | null;
          moto_model: string | null;
          engine_cc: number | null;
          property_type: string | null;
          property_area_m2: number | null;
          property_rooms: number | null;
          property_floor: number | null;
          has_elevator: boolean;
          has_parking: boolean;
          has_garden: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Record<string, any>;
        Update: Record<string, any>;
      };
      listing_media: {
        Row: {
          id: string;
          listing_id: string;
          media_type: 'image' | 'video';
          public_url: string;
          storage_path: string;
          is_cover: boolean;
          display_order: number;
          created_at: string;
        };
        Insert: Record<string, any>;
        Update: Record<string, any>;
      };
      follows: {
        Row: {
          id: string;
          follower_id: string;
          following_id: string;
          created_at: string;
        };
        Insert: Record<string, any>;
        Update: Record<string, any>;
      };
      qr_scans: {
        Row: {
          id: string;
          user_id: string;
          scanner_ip: string | null;
          scanned_at: string;
        };
        Insert: Record<string, any>;
        Update: Record<string, any>;
      };
    };
    Views: {};
    Functions: {
      increment_qr_scans: {
        Args: { user_id_param: string };
        Returns: void;
      };
      increment_view_count: {
        Args: { listing_id: string };
        Returns: void;
      };
      follow_user: {
        Args: { target_user_id: string };
        Returns: void;
      };
      unfollow_user: {
        Args: { target_user_id: string };
        Returns: void;
      };
    };
    Enums: {};
  };
}

export type Profile = Database['public']['Tables']['profiles']['Row'];
export type Listing = Database['public']['Tables']['listings']['Row'];
export type ListingMedia = Database['public']['Tables']['listing_media']['Row'];

export type ListingWithDetails = Listing & {
  profiles: Pick<Profile, 'full_name' | 'phone_number' | 'wilaya' | 'avatar_url'>;
  listing_media: ListingMedia[];
};
