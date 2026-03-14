import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';
import { ArrowRight, Phone, MessageCircle, MapPin, Calendar, Clock, Eye, ShieldCheck, Heart } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';
import type { ListingWithDetails } from '../types/database.types';

const ListingDetailScreen = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  
  const [listing, setListing] = useState<ListingWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentMediaIdx, setCurrentMediaIdx] = useState(0);

  useEffect(() => {
    const fetchDetail = async () => {
      if (!id) return;
      
      const { data, error } = await supabase
        .from('listings')
        .select(`*, profiles:user_id (full_name, phone_number, wilaya, avatar_url), listing_media (id, media_type, public_url, is_cover)`)
        .eq('id', id)
        .single();
        
      if (!error && data) {
        setListing(data as unknown as ListingWithDetails);
        
        // Increase views
        await supabase.rpc('increment_view_count', { listing_id: id }).catch(() => {});
      }
      setLoading(false);
    };
    
    fetchDetail();
  }, [id]);

  if (loading) return <div style={{textAlign: 'center', marginTop: '50px'}}>جاري تحميل الإعلان...</div>;
  if (!listing) return <div style={{textAlign: 'center', marginTop: '50px'}}>لم يتم العثور على الإعلان.</div>;

  const handleCall = () => {
    window.location.href = `tel:${listing.profiles.phone_number}`;
  };

  const handleWhatsApp = () => {
    const phone = listing.profiles.phone_number.replace(/^0/, '+213');
    window.location.href = `https://wa.me/${phone}?text=مرحباً، أنا مهتم بإعلانك (${listing.title}) على Ghaza Auto.`;
  };

  const isOwner = user?.id === listing.user_id;

  return (
    <div style={{ paddingBottom: '100px', backgroundColor: 'var(--color-deep-space)', minHeight: '100vh', position: 'relative' }}>
      
      {/* Absolute Back Button */}
      <button 
        onClick={() => navigate(-1)} 
        style={{ position: 'absolute', top: '20px', left: '20px', zIndex: 50, background: 'rgba(0,0,0,0.5)', border: '1px solid var(--color-glass-border)', padding: '10px', borderRadius: '50%', color: 'white', cursor: 'pointer', backdropFilter: 'blur(5px)' }}
      >
        <ArrowRight size={24} />
      </button>

      {/* Media Carousel */}
      <div style={{ height: '40vh', position: 'relative', background: '#000' }}>
        {listing.listing_media && listing.listing_media.length > 0 ? (
          <>
            {listing.listing_media[currentMediaIdx].media_type === 'video' ? (
              <video src={listing.listing_media[currentMediaIdx].public_url} controls style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <img src={listing.listing_media[currentMediaIdx].public_url} alt={listing.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            )}
            
            {/* Dots */}
            <div style={{ position: 'absolute', bottom: '15px', width: '100%', display: 'flex', justifyContent: 'center', gap: '8px' }}>
              {listing.listing_media.map((_, idx) => (
                <div key={idx} onClick={() => setCurrentMediaIdx(idx)} style={{ width: idx === currentMediaIdx ? '24px' : '8px', height: '8px', borderRadius: '4px', background: idx === currentMediaIdx ? 'var(--color-accent)' : 'rgba(255,255,255,0.5)', cursor: 'pointer', transition: 'width 0.3s' }} />
              ))}
            </div>
          </>
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'var(--color-text-secondary)' }}>
            لا توجد صور متوفرة
          </div>
        )}
      </div>

      {/* Details Card - overlapping the image slightly */}
      <div className="glass-card" style={{ marginTop: '-30px', borderRadius: '30px 30px 0 0', position: 'relative', minHeight: '60vh', borderBottom: 'none' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
          <div>
            <h1 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '5px' }}>{listing.title}</h1>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <MapPin size={16} /> {listing.wilaya} {listing.commune && `- ${listing.commune}`}
            </p>
          </div>
          <div style={{ background: 'var(--color-accent)', padding: '10px 15px', borderRadius: '15px', fontWeight: 'bold', fontSize: '1.2rem', boxShadow: '0 4px 15px rgba(233,69,96,0.3)' }}>
            {listing.price ? `${listing.price.toLocaleString()} ${listing.currency}` : 'نقطة المبيع'}
          </div>
        </div>

        {/* Quick Info Bar */}
        <div style={{ display: 'flex', gap: '20px', borderTop: '1px solid var(--color-glass-border)', borderBottom: '1px solid var(--color-glass-border)', padding: '15px 0', margin: '20px 0' }}>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px' }}>
            <Clock size={20} color="var(--color-electric)" />
            <span style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
              {formatDistanceToNow(new Date(listing.created_at), { addSuffix: true, locale: ar })}
            </span>
          </div>
          <div style={{ width: '1px', background: 'var(--color-glass-border)' }}></div>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px' }}>
            <Eye size={20} color="var(--color-electric)" />
            <span style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
              {listing.view_count || 0} مشاهدة
            </span>
          </div>
          <div style={{ width: '1px', background: 'var(--color-glass-border)' }}></div>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px' }}>
            <ShieldCheck size={20} color="var(--color-electric)" />
            <span style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
              {listing.is_negotiable ? 'قابل للتفاوض' : 'ثابت'}
            </span>
          </div>
        </div>

        {/* Specs Grid based on category */}
        {listing.category === 'car' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '20px' }}>
            <div className="glass-card" style={{ padding: '10px' }}><p className="text-secondary" style={{margin:0}}>الماركة</p><p style={{fontWeight:'bold'}}>{listing.car_brand}</p></div>
            {listing.car_year && <div className="glass-card" style={{ padding: '10px' }}><p className="text-secondary" style={{margin:0}}>السنة</p><p style={{fontWeight:'bold'}}>{listing.car_year}</p></div>}
            {listing.fuel_type && <div className="glass-card" style={{ padding: '10px' }}><p className="text-secondary" style={{margin:0}}>الوقود</p><p style={{fontWeight:'bold'}}>{listing.fuel_type}</p></div>}
            {listing.transmission && <div className="glass-card" style={{ padding: '10px' }}><p className="text-secondary" style={{margin:0}}>الناقل</p><p style={{fontWeight:'bold'}}>{listing.transmission}</p></div>}
            {listing.mileage && <div className="glass-card" style={{ padding: '10px' }}><p className="text-secondary" style={{margin:0}}>العداد</p><p style={{fontWeight:'bold'}}>{listing.mileage.toLocaleString()} كم</p></div>}
          </div>
        )}

        {/* Description */}
        <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '10px' }}>الوصف</h3>
        <p style={{ color: 'var(--color-text-secondary)', lineHeight: '1.7', marginBottom: '30px', whiteSpace: 'pre-wrap' }}>
          {listing.description}
        </p>

        {/* Seller Info */}
        <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '10px' }}>معلومات البائع</h3>
        <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '15px', background: 'rgba(25, 25, 50, 0.5)' }}>
          <div style={{ width: '50px', height: '50px', borderRadius: '25px', background: 'var(--color-accent)', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '20px', fontWeight: 'bold' }}>
            {listing.profiles.full_name?.charAt(0)}
          </div>
          <div>
            <h4 style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>{listing.profiles.full_name}</h4>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>بائع معتمد بالمنصة</p>
          </div>
        </div>

      </div>

      {/* Floating Action Buttons */}
      {!isOwner && (
        <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, padding: '15px 20px', background: 'rgba(7, 7, 26, 0.9)', backdropFilter: 'blur(10px)', borderTop: '1px solid var(--color-glass-border)', display: 'flex', gap: '15px', zIndex: 100 }}>
          
          {/* Call Button */}
          <button 
             onClick={handleCall}
             style={{ flex: 1, padding: '15px', borderRadius: '15px', background: 'linear-gradient(90deg, #4facfe, #00f2fe)', color: 'white', border: 'none', fontWeight: 'bold', fontSize: '1rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px', boxShadow: '0 4px 15px rgba(79, 172, 254, 0.4)', cursor: 'pointer' }}>
            <Phone size={20} />
            اتصال
          </button>
          
          {/* WhatsApp Button */}
          <button 
             onClick={handleWhatsApp}
             style={{ flex: 1, padding: '15px', borderRadius: '15px', background: 'linear-gradient(90deg, #11998e, #38ef7d)', color: 'white', border: 'none', fontWeight: 'bold', fontSize: '1rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px', boxShadow: '0 4px 15px rgba(56, 239, 125, 0.4)', cursor: 'pointer' }}>
            <MessageCircle size={20} />
            واتساب
          </button>
        </div>
      )}

    </div>
  );
};

export default ListingDetailScreen;
