import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';
import { Car, Bike, Home, MapPin, Phone, ArrowRight, UserPlus, UserCheck } from 'lucide-react';
import type { ListingWithDetails, Profile } from '../types/database.types';

const SellerProfileScreen = () => {
  const { qrToken } = useParams<{ qrToken: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [seller, setSeller] = useState<Profile | null>(null);
  const [listings, setListings] = useState<ListingWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);

  useEffect(() => {
    const fetchSellerData = async () => {
      try {
        if (!qrToken) return;

        // 1. Fetch Seller by QR Token
        const { data: profileData, error: profileError } = await (supabase
          .from('profiles') as any)
          .select('*')
          .eq('qr_code_token', qrToken)
          .single();

        if (profileError || !profileData) throw profileError || new Error('Seller not found');
        setSeller(profileData);
        setFollowersCount((profileData as any).followers_count || 0);

        // 2. Check if current user is following
        if (user?.id && profileData.id !== user.id) {
          const { data: followData } = await (supabase.from('follows') as any)
            .select('id')
            .eq('follower_id', user.id)
            .eq('following_id', profileData.id)
            .single();
          
          setIsFollowing(!!followData);
        }

        // 3. Fetch their active listings
        const { data: listingsData, error: listingsError } = await (supabase
          .from('listings') as any)
          .select(`*, profiles:user_id (full_name, phone_number, wilaya, avatar_url), listing_media (id, media_type, public_url, is_cover)`)
          .eq('user_id', profileData.id)
          .eq('is_active', true)
          .order('created_at', { ascending: false });

        if (!listingsError && listingsData) {
          setListings(listingsData as unknown as ListingWithDetails[]);
        }

        // 4. Increment Scan Counter
        await (supabase as any).rpc('increment_qr_scans', { user_id_param: profileData.id });

      } catch (err) {
        console.error("Error fetching seller profile:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchSellerData();
  }, [qrToken, user?.id]);

  const handleFollow = async () => {
    if (!seller || user?.id === seller.id) return;
    
    if (!user) {
      // User is not logged in. Redirect to register and pass the seller id so they auto-follow
      navigate(`/register?follow=${seller.id}`);
      return;
    }

    setFollowLoading(true);

    try {
      if (isFollowing) {
        // Unfollow
        await (supabase as any).rpc('unfollow_user', { target_user_id: seller.id });
        setIsFollowing(false);
        setFollowersCount(prev => Math.max(prev - 1, 0));
      } else {
        // Follow
        await (supabase as any).rpc('follow_user', { target_user_id: seller.id });
        setIsFollowing(true);
        setFollowersCount(prev => prev + 1);
      }
    } catch (err) {
      console.error("Follow error:", err);
    } finally {
      setFollowLoading(false);
    }
  };

  if (loading) return <div style={{textAlign: 'center', marginTop: '50px', padding: '20px'}}>جاري البحث عن البائع...</div>;
  if (!seller) return <div style={{textAlign: 'center', marginTop: '50px', padding: '20px'}}>لم يتم العثور على البائع أو الرابط غير صحيح.</div>;

  const isOwnProfile = user?.id === seller.id;

  return (
    <div style={{ padding: '20px 20px 100px 20px', overflowY: 'auto' }}>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
        <button onClick={() => navigate(-1)} style={{ background: 'var(--color-glass-bg)', border: '1px solid var(--color-glass-border)', padding: '10px', borderRadius: '50%', color: 'white', cursor: 'pointer' }}>
          <ArrowRight size={20} />
        </button>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 800 }}>صفحة البائع</h2>
      </div>

      {/* Seller Header */}
      <div className="glass-card" style={{ textAlign: 'center', padding: '30px 20px', marginBottom: '20px', borderTop: '4px solid var(--color-accent)', position: 'relative' }}>
        <div style={{ width: '80px', height: '80px', borderRadius: '40px', background: 'var(--color-electric)', color: 'white', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '32px', fontWeight: 'bold', margin: '0 auto 15px auto' }}>
          {seller.full_name?.charAt(0)}
        </div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '5px' }}>{seller.full_name}</h2>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '15px', color: 'var(--color-text-secondary)', fontSize: '0.9rem', marginBottom: '15px' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><MapPin size={16} /> {seller.wilaya || 'غير محدد'}</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><Phone size={16} /> {seller.phone_number}</span>
        </div>

        {/* Stats Row */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '25px', marginBottom: '20px' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-electric)' }}>{listings.length}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>إعلان</div>
          </div>
          <div style={{ width: '1px', background: 'var(--color-glass-border)' }}></div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-accent)' }}>{followersCount}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>متابِع</div>
          </div>
        </div>

        {/* Follow + Call Buttons */}
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
          {!isOwnProfile && (
            <button 
              onClick={handleFollow}
              disabled={followLoading}
              style={{ 
                padding: '12px 24px', borderRadius: '12px', fontWeight: 'bold', fontSize: '0.95rem',
                display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer',
                border: isFollowing ? '2px solid var(--color-electric)' : 'none',
                background: isFollowing ? 'transparent' : 'linear-gradient(90deg, #4facfe, #00f2fe)',
                color: '#fff',
                transition: 'all 0.3s ease',
              }}
            >
              {isFollowing ? <><UserCheck size={18} /> متابَع</> : <><UserPlus size={18} /> متابعة</>}
            </button>
          )}
          <button onClick={() => {
            if (!user) {
              navigate(`/register?follow=${seller.id}`);
            } else {
              window.location.href = `tel:${seller.phone_number}`;
            }
          }} style={{
            padding: '12px 24px', borderRadius: '12px', fontWeight: 'bold', fontSize: '0.95rem',
            background: 'linear-gradient(90deg, #38ef7d, #11998e)',
            border: 'none', cursor: 'pointer',
            color: '#fff', textDecoration: 'none',
            display: 'flex', alignItems: 'center', gap: '8px',
          }}>
            <Phone size={18} /> اتصال
          </button>
        </div>
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
