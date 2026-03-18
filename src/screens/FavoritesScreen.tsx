import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useFavoriteStore } from '../store/favoriteStore';
import { Car, Bike, Home, ArrowRight, HeartOff } from 'lucide-react';

const FavoritesScreen = () => {
  const { favorites, removeFavorite } = useFavoriteStore();
  const navigate = useNavigate();

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
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
        <button onClick={() => navigate(-1)} style={{ background: 'var(--color-glass-bg)', border: '1px solid var(--color-glass-border)', padding: '10px', borderRadius: '50%', color: 'white' }}>
          <ArrowRight size={20} />
        </button>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>المفضلة</h2>
      </div>

      {favorites.length === 0 ? (
        <div style={{ textAlign: 'center', marginTop: '100px', color: 'var(--color-text-secondary)' }}>
          <div style={{ fontSize: '50px', marginBottom: '20px' }}>💝</div>
          <p>قائمة المفضلة فارغة حالياً.</p>
          <button onClick={() => navigate('/')} className="primary-btn mt-4" style={{ width: 'auto', padding: '10px 20px' }}>
            تصفح الإعلانات
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          {favorites.map(listing => (
            <div 
              key={listing.id} 
              className="glass-card" 
              style={{ padding: 0, overflow: 'hidden', display: 'flex', position: 'relative' }}
              onClick={() => navigate(`/listing/${listing.id}`)}
            >
              <div style={{ width: '120px', height: '100px', position: 'relative' }}>
                 {/* Images are not saved in the simplified favorites, normally we'd save the cover URL too. 
                     For now we'll assume the favorites store saves the whole listing object including some media info if available */}
                 <img 
                    src={(listing as any).listing_media?.[0]?.public_url || 'https://placehold.co/400x300/1a1a3a/ffffff?text=لا+توجد+صورة'} 
                    alt={listing.title} 
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                 />
              </div>
              
              <div style={{ padding: '12px', flex: 1 }}>
                <h4 style={{ fontSize: '1rem', fontWeight: 'bold', marginBottom: '5px' }}>{listing.title}</h4>
                <p style={{ color: 'var(--color-accent)', fontWeight: 'bold', fontSize: '1.1rem', marginBottom: '5px' }}>
                  {listing.price ? `${listing.price.toLocaleString()} ${listing.currency}` : 'السعر غير محدد'}
                </p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                      {getCategoryIcon(listing.category)} {listing.wilaya}
                    </span>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFavorite(listing.id);
                      }}
                      style={{ background: 'none', border: 'none', color: 'var(--color-accent)', cursor: 'pointer' }}
                    >
                      <HeartOff size={18} />
                    </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FavoritesScreen;
