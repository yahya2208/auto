import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';
import { ArrowRight, Phone, MessageCircle, MapPin, Clock, Eye, ShieldCheck, Heart, Edit } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';
import { useFavoriteStore } from '../store/favoriteStore';
import type { ListingWithDetails } from '../types/database.types';

const ListingDetailScreen = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  
  const { addFavorite, removeFavorite, isFavorite } = useFavoriteStore();
  
  const [listing, setListing] = useState<ListingWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentMediaIdx, setCurrentMediaIdx] = useState(0);

  useEffect(() => {
    const fetchDetail = async () => {
      if (!id) return;
      
      const { data, error } = await (supabase
        .from('listings') as any)
        .select(`*, profiles:user_id (full_name, phone_number, wilaya, avatar_url), listing_media (id, media_type, public_url, is_cover)`)
        .eq('id', id)
        .single();
        
      if (!error && data) {
        setListing(data as unknown as ListingWithDetails);
        
        // Save to recently viewed
        const currentRecent = JSON.parse(localStorage.getItem('recent_views') || '[]');
        const updatedRecent = [data.id, ...currentRecent.filter((viewedId: string) => viewedId !== data.id)].slice(0, 20); // keep last 20
        localStorage.setItem('recent_views', JSON.stringify(updatedRecent));

        // Increase views
        await (supabase as any).rpc('increment_view_count', { listing_id: id });
      }
      setLoading(false);
    };
    
    fetchDetail();
  }, [id]);

  if (loading) return <div style={{textAlign: 'center', marginTop: '50px', color: 'white'}}>جاري تحميل الإعلان...</div>;
  if (!listing) return <div style={{textAlign: 'center', marginTop: '50px', color: 'white'}}>لم يتم العثور على الإعلان.</div>;

  const handleCall = () => {
    if (!user) {
      navigate(`/register?follow=${listing.user_id}`);
      return;
    }
    window.location.href = `tel:${listing.profiles.phone_number}`;
  };

  const handleWhatsApp = () => {
    if (!user) {
      navigate(`/register?follow=${listing.user_id}`);
      return;
    }
    const message = encodeURIComponent(`مرحباً، أنا مهتم بإعلانك: ${listing.title}\nالرابط: ${window.location.href}`);
    window.open(`https://wa.me/213${listing.profiles.phone_number.replace(/^0/, '')}?text=${message}`, '_blank');
  };

  const media = listing.listing_media || [];
  const activeMedia = media[currentMediaIdx];

  return (
    <div style={{ paddingBottom: '100px', backgroundColor: 'var(--color-deep-space)', minHeight: '100vh', position: 'relative' }}>
      
      {/* Header Buttons */}
      <div style={{ position: 'absolute', top: '20px', left: '20px', right: '20px', display: 'flex', justifyContent: 'space-between', zIndex: 50 }}>
        <button onClick={() => navigate(-1)} style={{ background: 'rgba(0,0,0,0.5)', border: '1px solid var(--color-glass-border)', color: '#fff', width: '45px', height: '45px', borderRadius: '23px', display: 'flex', justifyContent: 'center', alignItems: 'center', backdropFilter: 'blur(10px)' }}>
          <ArrowRight size={24} />
        </button>
        
        <div style={{ display: 'flex', gap: '10px' }}>
          {user?.id === listing.user_id && (
            <button 
              onClick={() => navigate(`/edit/${listing.id}`)} 
              style={{ background: 'rgba(79, 172, 254, 0.2)', border: '1px solid rgba(79, 172, 254, 0.4)', color: '#fff', padding: '0 15px', height: '45px', borderRadius: '23px', display: 'flex', justifyContent: 'center', alignItems: 'center', backdropFilter: 'blur(10px)', gap: '8px', fontSize: '0.9rem', fontWeight: 'bold' }}>
              <Edit size={20} /> تعديل
            </button>
          )}
          
          <button 
            onClick={() => isFavorite(listing.id) ? removeFavorite(listing.id) : addFavorite(listing)}
            style={{ 
              background: 'rgba(0,0,0,0.5)', border: '1px solid var(--color-glass-border)', 
              color: isFavorite(listing.id) ? 'var(--color-accent)' : '#fff', 
              width: '45px', height: '45px', borderRadius: '23px', 
              display: 'flex', justifyContent: 'center', alignItems: 'center', 
              backdropFilter: 'blur(10px)', transition: 'all 0.3s'
            }}>
            <Heart size={24} fill={isFavorite(listing.id) ? 'currentColor' : 'none'} />
          </button>
        </div>
      </div>

      {/* Hero Media Slider */}
      <div style={{ position: 'relative', width: '100%', aspectRatio: '1/1', background: '#000' }}>
        {activeMedia ? (
          activeMedia.media_type === 'video' ? (
            <video src={activeMedia.public_url} controls style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          ) : (
            <img src={activeMedia.public_url} alt={listing.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          )
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#555' }}>لا توجد صور</div>
        )}
        
        {media.length > 1 && (
          <div style={{ position: 'absolute', bottom: '20px', left: '0', right: '0', display: 'flex', justifyContent: 'center', gap: '8px' }}>
            {media.map((_, idx) => (
              <div 
                key={idx} 
                onClick={() => setCurrentMediaIdx(idx)}
                style={{ 
                  width: '8px', height: '8px', borderRadius: '4px', 
                  background: currentMediaIdx === idx ? 'var(--color-electric)' : 'rgba(255,255,255,0.5)',
                  cursor: 'pointer' 
                }} 
              />
            ))}
          </div>
        )}
      </div>

      {/* Content */}
      <div style={{ padding: '25px', marginTop: '-20px', background: 'var(--color-deep-space)', borderRadius: '25px 25px 0 0', position: 'relative', zIndex: 5 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
          <div>
            <h1 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: '5px', color: 'white' }}>{listing.title}</h1>
            <p style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>
              <MapPin size={16} /> {listing.wilaya}{listing.commune ? `، ${listing.commune}` : ''}
            </p>
          </div>
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--color-accent)' }}>
              {listing.price?.toLocaleString()} <span style={{fontSize: '1rem'}}>دج</span>
            </div>
            {listing.is_negotiable && <span style={{ fontSize: '0.75rem', color: '#38ef7d', fontWeight: 'bold' }}>قابل للتفاوض</span>}
          </div>
        </div>

        {/* Specs Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '30px' }}>
           <div className="glass-card" style={{ padding: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
             <Clock size={18} color="var(--color-electric)" />
             <div>
               <p style={{ fontSize: '0.7rem', color: 'var(--color-text-secondary)', margin: 0 }}>تاريخ النشر</p>
               <p style={{ fontSize: '0.85rem', fontWeight: 'bold', margin: 0, color: 'white' }}>{formatDistanceToNow(new Date(listing.created_at), { addSuffix: true, locale: ar })}</p>
             </div>
           </div>
           <div className="glass-card" style={{ padding: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
             <Eye size={18} color="var(--color-electric)" />
             <div>
               <p style={{ fontSize: '0.7rem', color: 'var(--color-text-secondary)', margin: 0 }}>المشاهدات</p>
               <p style={{ fontSize: '0.85rem', fontWeight: 'bold', margin: 0, color: 'white' }}>{listing.view_count || 0}</p>
             </div>
           </div>
           
           {listing.category === 'car' && (
             <>
               <div className="glass-card" style={{ padding: '12px' }}>
                 <p style={{ fontSize: '0.7rem', color: 'var(--color-text-secondary)', margin: 0 }}>العداد</p>
                 <p style={{ fontSize: '0.85rem', fontWeight: 'bold', margin: 0, color: 'white' }}>{listing.mileage?.toLocaleString()} كم</p>
               </div>
               <div className="glass-card" style={{ padding: '12px' }}>
                 <p style={{ fontSize: '0.7rem', color: 'var(--color-text-secondary)', margin: 0 }}>المحرك</p>
                 <p style={{ fontSize: '0.85rem', fontWeight: 'bold', margin: 0, color: 'white' }}>{listing.fuel_type}</p>
               </div>
             </>
           )}
           {listing.category === 'phone' && (
             <>
               <div className="glass-card" style={{ padding: '12px' }}>
                 <p style={{ fontSize: '0.7rem', color: 'var(--color-text-secondary)', margin: 0 }}>التخزين (GB)</p>
                 <p style={{ fontSize: '0.85rem', fontWeight: 'bold', margin: 0, color: 'white' }}>{listing.storage_capacity || '-'} GB</p>
               </div>
               <div className="glass-card" style={{ padding: '12px' }}>
                 <p style={{ fontSize: '0.7rem', color: 'var(--color-text-secondary)', margin: 0 }}>الرام (GB)</p>
                 <p style={{ fontSize: '0.85rem', fontWeight: 'bold', margin: 0, color: 'white' }}>{listing.ram || '-'} GB</p>
               </div>
             </>
           )}
           {listing.category === 'clothing' && (
             <>
               <div className="glass-card" style={{ padding: '12px' }}>
                 <p style={{ fontSize: '0.7rem', color: 'var(--color-text-secondary)', margin: 0 }}>الماركة العالمية</p>
                 <p style={{ fontSize: '0.85rem', fontWeight: 'bold', margin: 0, color: 'white' }}>{listing.clothing_brand || '-'}</p>
               </div>
               <div className="glass-card" style={{ padding: '12px' }}>
                 <p style={{ fontSize: '0.7rem', color: 'var(--color-text-secondary)', margin: 0 }}>المقاس</p>
                 <p style={{ fontSize: '0.85rem', fontWeight: 'bold', margin: 0, color: 'white' }}>{listing.clothing_size || '-'}</p>
               </div>
             </>
           )}
        </div>

        {/* Description */}
        <div style={{ marginBottom: '30px' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '10px', color: 'white' }}>الوصف</h3>
          <p style={{ lineHeight: '1.6', color: 'var(--color-text-secondary)', whiteSpace: 'pre-line' }}>
            {listing.description}
          </p>
        </div>

        {/* Seller Info */}
        <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '15px', padding: '15px' }}>
           <div style={{ width: '50px', height: '50px', borderRadius: '25px', background: 'var(--color-electric)', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '20px', fontWeight: 'bold' }}>
             {listing.profiles?.avatar_url ? <img src={listing.profiles.avatar_url} style={{width:'100%', height:'100%', borderRadius:'50%'}} /> : listing.profiles?.full_name?.charAt(0)}
           </div>
           <div style={{ flex: 1 }}>
             <h4 style={{ fontSize: '1rem', fontWeight: 'bold', margin: 0, color: 'white' }}>{listing.profiles?.full_name}</h4>
             <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', margin: 0 }}>عضو منذ فترة</p>
           </div>
           <ShieldCheck color="#38ef7d" size={24} />
        </div>
      </div>

      {/* Sticky Action Buttons */}
      <div style={{ position: 'fixed', bottom: '20px', left: '25px', right: '25px', display: 'flex', gap: '15px', zIndex: 100 }}>
        <button 
          onClick={handleCall}
          style={{ 
            flex: 1, height: '55px', borderRadius: '15px', background: 'linear-gradient(45deg, #4facfe, #00f2fe)', 
            border: 'none', color: '#fff', fontWeight: 800, fontSize: '1.1rem', 
            display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px', 
            boxShadow: '0 8px 20px rgba(79, 172, 254, 0.4)' 
          }}>
          <Phone size={22} /> اتصل الآن
        </button>
        <button 
          onClick={handleWhatsApp}
          style={{ 
            width: '55px', height: '55px', borderRadius: '15px', background: '#25D366', 
            border: 'none', color: '#fff', 
            display: 'flex', justifyContent: 'center', alignItems: 'center',
            boxShadow: '0 8px 20px rgba(37, 211, 102, 0.3)' 
          }}>
          <MessageCircle size={28} />
        </button>
      </div>

    </div>
  );
};

export default ListingDetailScreen;
