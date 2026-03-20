import { useEffect, useState, useRef } from 'react';
import { useListingStore } from '../store/listingStore';
import { useAuthStore } from '../store/authStore';
import { useFavoriteStore } from '../store/favoriteStore';
import { Car, Bike, Home, Search, Heart, Phone, Share2, Info, Smartphone, Shirt, Camera } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const HomeScreen = () => {
  const { listings, fetchListings, loading } = useListingStore();
  const { user } = useAuthStore();
  const { isFavorite, addFavorite, removeFavorite } = useFavoriteStore();
  
  const [filter, setFilter] = useState<'all' | 'car' | 'motorcycle' | 'real_estate' | 'phone' | 'clothing'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchListings();
    // Restore scroll position
    const savedScroll = sessionStorage.getItem('homeScrollPosition');
    if (savedScroll && scrollContainerRef.current) {
      setTimeout(() => {
        if (scrollContainerRef.current) {
          scrollContainerRef.current.scrollTop = parseInt(savedScroll, 10);
        }
      }, 100);
    }
  }, [fetchListings]);

  const handleScroll = (e: any) => {
    sessionStorage.setItem('homeScrollPosition', e.target.scrollTop.toString());
  };

  const filteredListings = listings.filter(l => {
    const matchesCategory = filter === 'all' || l.category === filter;
    const matchesSearch = l.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          l.wilaya.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (l.car_brand?.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case 'car': return <Car size={16} />;
      case 'motorcycle': return <Bike size={16} />;
      case 'real_estate': return <Home size={16} />;
      case 'phone': return <Smartphone size={16} />;
      case 'clothing': return <Shirt size={16} />;
      default: return null;
    }
  };

  const getCategoryLabel = (cat: string) => {
    switch (cat) {
      case 'car': return 'سيارة';
      case 'motorcycle': return 'دراجة';
      case 'real_estate': return 'عقار';
      case 'phone': return 'هاتف';
      case 'clothing': return 'ملابس';
      default: return 'إعلان';
    }
  };

  const handleShare = async (id: string) => {
    const url = `${window.location.origin}/listing/${id}`;
    if (navigator.share) {
      try {
        await navigator.share({ url, title: 'كوورتي Courtier' });
      } catch (err) {}
    } else {
      navigator.clipboard.writeText(url);
      alert('تم نسخ الرابط!');
    }
  };

  const handleDoubleTapLike = (listing: any) => {
    if (isFavorite(listing.id)) {
      removeFavorite(listing.id);
    } else {
      addFavorite(listing);
    }
  };

  return (
    <div ref={scrollContainerRef} onScroll={handleScroll} style={{ padding: '20px 20px 100px 20px', height: '100vh', overflowY: 'auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>اكتشف الإعلانات</h2>
          <p className="text-secondary">جديد سوق كوورتي - Courtier</p>
        </div>
      </div>

      {/* Search Bar */}
      <div style={{ position: 'relative', marginBottom: '20px' }}>
        <input 
          type="text" 
          placeholder="ابحث عن سيارة، عقار، أو ولاية..." 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            width: '100%',
            padding: '12px 15px 12px 40px',
            borderRadius: '12px',
            border: '1px solid var(--color-glass-border)',
            background: 'var(--color-glass-bg)',
            color: '#fff',
            outline: 'none',
            fontSize: '0.95rem'
          }}
        />
        <Search size={20} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-secondary)' }} />
      </div>

      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', overflowX: 'auto', paddingBottom: '10px' }} className="no-scrollbar">
        {['all', 'car', 'motorcycle', 'real_estate', 'phone', 'clothing'].map((cat) => (
          <button
            key={cat}
            onClick={() => setFilter(cat as any)}
            style={{
              padding: '8px 16px',
              borderRadius: '20px',
              border: '1px solid var(--color-glass-border)',
              background: filter === cat ? 'linear-gradient(90deg, #ff6b8a, #e94560)' : 'var(--color-glass-bg)',
              color: '#fff',
              outline: 'none',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              fontFamily: 'inherit',
              fontWeight: filter === cat ? 'bold' : 'normal'
            }}
          >
            {cat === 'all' && 'الكل'}
            {cat === 'car' && 'سيارات 🚗'}
            {cat === 'motorcycle' && 'دراجات 🏍️'}
            {cat === 'real_estate' && 'عقارات 🏠'}
            {cat === 'phone' && 'هواتف 📱'}
            {cat === 'clothing' && 'ملابس 👕'}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', marginTop: '50px' }}>جاري التحميل...</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
          {filteredListings.length === 0 ? (
            <div style={{ textAlign: 'center', marginTop: '50px', color: 'var(--color-text-secondary)' }}>
              لا توجد إعلانات بعد. كن الأول واضغط على زر الإضافة!
            </div>
          ) : (
            filteredListings.map(listing => {
              const mediaList = listing.listing_media || [];
              const hasMultiple = mediaList.length > 1;
              const cover = mediaList.find((m: any) => m.is_cover)?.public_url 
                         || mediaList[0]?.public_url 
                         || 'https://placehold.co/400x300/1a1a3a/ffffff?text=Courtier';
              const secondImage = mediaList[1]?.public_url;
                         
              return (
                <div 
                  key={listing.id} 
                  className="glass-card" 
                  style={{ padding: 0, overflow: 'visible', position: 'relative' }}
                >
                  {/* Share & Like Overlays */}
                  <div style={{ position: 'absolute', top: '10px', right: '10px', zIndex: 10, display: 'flex', gap: '10px' }}>
                    <button onClick={() => handleShare(listing.id)} style={{ background: 'rgba(0,0,0,0.5)', border: 'none', borderRadius: '50%', padding: '8px', color: 'white', cursor: 'pointer', backdropFilter: 'blur(4px)' }}>
                      <Share2 size={18} />
                    </button>
                    <button onClick={() => handleDoubleTapLike(listing)} style={{ background: 'rgba(0,0,0,0.5)', border: 'none', borderRadius: '50%', padding: '8px', color: isFavorite(listing.id) ? 'var(--color-accent)' : 'white', cursor: 'pointer', backdropFilter: 'blur(4px)' }}>
                      <Heart size={18} fill={isFavorite(listing.id) ? 'currentColor' : 'none'} />
                    </button>
                  </div>

                  {/* Image Stack Effect container */}
                  <div style={{ position: 'relative', height: '220px', cursor: 'pointer', margin: '10px 10px 0 10px' }} 
                       onClick={() => navigate(`/listing/${listing.id}`)}
                       onDoubleClick={() => handleDoubleTapLike(listing)}>
                    {hasMultiple && secondImage && (
                      <img src={secondImage} alt="background layer" style={{ position: 'absolute', width: '90%', height: '180px', left: '5%', top: '-8px', objectFit: 'cover', borderRadius: '15px', opacity: 0.6, zIndex: 1 }} />
                    )}
                    <img src={cover} alt={listing.title} style={{ position: 'absolute', width: '100%', height: '200px', objectFit: 'cover', borderRadius: '15px', zIndex: 2, boxShadow: '0 10px 20px rgba(0,0,0,0.3)', userSelect: 'none' }} />
                    
                    {hasMultiple && (
                      <div style={{
                        position: 'absolute', bottom: '10px', left: '10px', zIndex: 3,
                        background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(5px)',
                        padding: '4px 10px', borderRadius: '12px', color: '#fff',
                        display: 'flex', alignItems: 'center', gap: '5px',
                        fontSize: '0.8rem', fontWeight: 'bold'
                      }}>
                        <Camera size={14} /> +{mediaList.length - 1}
                      </div>
                    )}
                  </div>

                  <div style={{ padding: '15px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span style={{ 
                        background: 'rgba(79, 172, 254, 0.2)', 
                        color: 'var(--color-electric)', 
                        padding: '4px 8px', 
                        borderRadius: '6px', 
                        fontSize: '0.75rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px'
                      }}>
                        {getCategoryIcon(listing.category)}
                        {getCategoryLabel(listing.category)}
                      </span>
                      <span style={{ fontWeight: 'bold', fontSize: '1.2rem', color: 'var(--color-accent)' }}>
                        {listing.price ? `${listing.price.toLocaleString()} ${listing.currency}` : 'متفاوض'}
                      </span>
                    </div>
                    <h3 style={{ fontSize: '1.1rem', marginBottom: '5px' }} onClick={() => navigate(`/listing/${listing.id}`)}>{listing.title}</h3>
                    <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '15px' }}>
                      📍 {listing.wilaya} {listing.commune && `- ${listing.commune}`}
                    </p>
                    
                    {/* Action Buttons */}
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button 
                        onClick={() => navigate(`/listing/${listing.id}`)}
                        style={{ flex: 1, padding: '10px', borderRadius: '10px', background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid var(--color-glass-border)', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '5px', fontWeight: 'bold' }}>
                        <Info size={16} /> التفاصيل
                      </button>
                      <button 
                        onClick={() => {
                          if (!user) {
                            navigate(`/register?follow=${listing.user_id}`);
                          } else {
                            window.location.href = `tel:${listing.profiles?.phone_number || ''}`;
                          }
                        }}
                        style={{ flex: 1, padding: '10px', borderRadius: '10px', background: 'linear-gradient(90deg, #38ef7d, #11998e)', color: '#fff', border: 'none', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '5px', fontWeight: 'bold' }}>
                        <Phone size={16} /> اتصال
                      </button>
                    </div>

                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};

export default HomeScreen;
