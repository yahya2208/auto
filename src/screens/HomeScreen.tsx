import { useEffect, useState } from 'react';
import { useListingStore } from '../store/listingStore';
import { Car, Bike, Home, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const HomeScreen = () => {
  const { listings, fetchListings, loading } = useListingStore();
  const [filter, setFilter] = useState<'all' | 'car' | 'motorcycle' | 'real_estate'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchListings();
  }, [fetchListings]);

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
      default: return null;
    }
  };

  return (
    <div style={{ padding: '20px 20px 100px 20px' }}>
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
        {['all', 'car', 'motorcycle', 'real_estate'].map((cat) => (
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
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', marginTop: '50px' }}>جاري التحميل...</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          {filteredListings.length === 0 ? (
            <div style={{ textAlign: 'center', marginTop: '50px', color: 'var(--color-text-secondary)' }}>
              لا توجد إعلانات بعد. كن الأول واضغط على زر الإضافة!
            </div>
          ) : (
            filteredListings.map(listing => {
              const cover = listing.listing_media?.find((m: any) => m.is_cover)?.public_url 
                         || (listing.listing_media?.[0]?.public_url) 
                         || 'https://placehold.co/400x300/1a1a3a/ffffff?text=لا+توجد+صورة';
                         
              return (
                <div 
                  key={listing.id} 
                  className="glass-card" 
                  style={{ padding: 0, overflow: 'hidden', cursor: 'pointer' }}
                  onClick={() => navigate(`/listing/${listing.id}`)}
                >
                  <img src={cover} alt={listing.title} style={{ width: '100%', height: '200px', objectFit: 'cover' }} />
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
                        {listing.category === 'car' ? 'سيارة' : listing.category === 'motorcycle' ? 'دراجة' : 'عقار'}
                      </span>
                      <span style={{ fontWeight: 'bold', fontSize: '1.2rem', color: 'var(--color-accent)' }}>
                        {listing.price ? `${listing.price.toLocaleString()} ${listing.currency}` : 'السعر غير محدد'}
                      </span>
                    </div>
                    <h3 style={{ fontSize: '1.1rem', marginBottom: '5px' }}>{listing.title}</h3>
                    <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '5px' }}>
                      📍 {listing.wilaya} {listing.commune && `- ${listing.commune}`}
                    </p>
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
