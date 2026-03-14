import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Car, Bike, Home, MapPin, Phone, ArrowRight } from 'lucide-react';
import type { ListingWithDetails, Profile } from '../types/database.types';

const SellerProfileScreen = () => {
  const { qrToken } = useParams<{ qrToken: string }>();
  const navigate = useNavigate();
  const [seller, setSeller] = useState<Profile | null>(null);
  const [listings, setListings] = useState<ListingWithDetails[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSellerData = async () => {
      try {
        if (!qrToken) return;

        // 1. Fetch Seller by QR Token
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('qr_code_token', qrToken)
          .single();

        if (profileError || !profileData) throw profileError || new Error('Seller not found');
        setSeller(profileData);

        // 2. Fetch their active listings
        const { data: listingsData, error: listingsError } = await supabase
          .from('listings')
          .select(`*, profiles:user_id (full_name, phone_number, wilaya, avatar_url), listing_media (id, media_type, public_url, is_cover)`)
          .eq('user_id', profileData.id)
          .eq('is_active', true)
          .order('created_at', { ascending: false });

        if (!listingsError && listingsData) {
          setListings(listingsData as unknown as ListingWithDetails[]);
        }

        // 3. Increment Scan Counter
        // Note: Ensure `increment_qr_scans` function is defined in Supabase RPC
        await supabase.rpc('increment_qr_scans', { user_id_param: profileData.id }).catch(() => {
          console.log("RPC might not exist yet, skipping scan counter increment error.");
        });

      } catch (err) {
        console.error("Error fetching seller profile:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchSellerData();
  }, [qrToken]);

  if (loading) return <div style={{textAlign: 'center', marginTop: '50px', padding: '20px'}}>جاري البحث عن البائع...</div>;
  if (!seller) return <div style={{textAlign: 'center', marginTop: '50px', padding: '20px'}}>لم يتم العثور على البائع أو الرابط غير صحيح.</div>;

  return (
    <div style={{ padding: '20px 20px 100px 20px', overflowY: 'auto' }}>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
        <button onClick={() => navigate(-1)} style={{ background: 'var(--color-glass-bg)', border: '1px solid var(--color-glass-border)', padding: '10px', borderRadius: '50%', color: 'white' }}>
          <ArrowRight size={20} />
        </button>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 800 }}>صفحة البائع</h2>
      </div>

      {/* Seller Header */}
      <div className="glass-card" style={{ textAlign: 'center', padding: '30px 20px', marginBottom: '20px', borderTop: '4px solid var(--color-accent)' }}>
        <div style={{ width: '80px', height: '80px', borderRadius: '40px', background: 'var(--color-electric)', color: 'white', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '32px', fontWeight: 'bold', margin: '0 auto 15px auto' }}>
          {seller.full_name?.charAt(0)}
        </div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '5px' }}>{seller.full_name}</h2>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '15px', color: 'var(--color-text-secondary)', fontSize: '0.9rem', marginBottom: '15px' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><MapPin size={16} /> {seller.wilaya || 'غير محدد'}</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><Phone size={16} /> {seller.phone_number}</span>
        </div>
        
        <a href={`tel:${seller.phone_number}`} className="primary-btn mt-4" style={{ display: 'inline-flex', width: 'auto', padding: '10px 20px' }}>
          اتصل بالبائع مباشرة <Phone size={18} />
        </a>
      </div>

      {/* Listings Section */}
      <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '15px', color: 'var(--color-text-primary)' }}>
        إعلانات {seller.full_name} ({listings.length})
      </h3>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        {listings.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--color-text-secondary)', padding: '20px', border: '1px solid var(--color-glass-border)', borderRadius: '15px' }}>
            لا توجد إعلانات نشطة حالياً.
          </div>
        ) : (
          listings.map(listing => {
            const cover = listing.listing_media?.find(m => m.is_cover)?.public_url 
                       || listing.listing_media?.[0]?.public_url 
                       || 'https://placehold.co/400x300/1a1a3a/ffffff?text=لا+توجد+صورة';
            return (
              <div 
                key={listing.id} 
                className="glass-card" 
                style={{ padding: 0, overflow: 'hidden', cursor: 'pointer', display: 'flex' }}
                onClick={() => navigate(`/listing/${listing.id}`)}
              >
                <img src={cover} alt={listing.title} style={{ width: '120px', height: '100%', objectFit: 'cover' }} />
                <div style={{ padding: '15px', flex: 1 }}>
                  <h4 style={{ fontSize: '1rem', fontWeight: 'bold', marginBottom: '5px' }}>{listing.title}</h4>
                  <p style={{ color: 'var(--color-accent)', fontWeight: 'bold', fontSize: '1.1rem', marginBottom: '5px' }}>
                    {listing.price ? `${listing.price.toLocaleString()} ${listing.currency}` : 'السعر غير محدد'}
                  </p>
                  <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    {listing.category === 'car' ? <Car size={12}/> : listing.category === 'motorcycle' ? <Bike size={12}/> : <Home size={12}/>}
                    {listing.wilaya}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>

    </div>
  );
};

export default SellerProfileScreen;
