import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { supabase } from '../lib/supabase';
import { QRCodeSVG } from 'qrcode.react';
import { LogOut, MapPin, Phone, Link, Edit, Trash2 } from 'lucide-react';
import { useListingStore } from '../store/listingStore';

const ProfileScreen = () => {
  const navigate = useNavigate();
  const { profile, signOut } = useAuthStore();
  const { fetchUserListings } = useListingStore();
  const [totalListings, setTotalListings] = useState(0);
  const [userListings, setUserListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile?.id) {
      setLoading(true);
      fetchUserListings(profile.id).then(res => {
        setTotalListings(res.length);
        setUserListings(res);
        setLoading(false);
      });
    }
  }, [profile?.id, fetchUserListings]);

  if (!profile) return <div style={{textAlign: 'center', marginTop: '50px'}}>جاري التحميل...</div>;

  const handleDelete = async (id: string) => {
    if (window.confirm('هل أنت متأكد من حذف هذا الإعلان؟')) {
      const { error } = await (supabase.from('listings') as any).update({ is_active: false }).eq('id', id);
      if (!error) {
        setUserListings(prev => prev.filter(l => l.id !== id));
        setTotalListings(prev => Math.max(0, prev - 1));
      }
    }
  };

  // The link to the seller page:
  const sellerUrl = `${window.location.origin}/seller/${profile.qr_code_token}`;

  return (
    <div style={{ padding: '20px 20px 100px 20px', overflowY: 'auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>حسابي</h2>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={() => navigate('/profile/edit')} style={{ background: 'transparent', border: '1px solid var(--color-glass-border)', color: 'var(--color-electric)', padding: '8px 12px', borderRadius: '10px', display: 'flex', gap: '5px' }}>
            تعديل
          </button>
          <button onClick={signOut} style={{ background: 'transparent', border: '1px solid var(--color-glass-border)', color: 'var(--color-accent)', padding: '8px 12px', borderRadius: '10px', display: 'flex', gap: '5px' }}>
            خروج <LogOut size={18} />
          </button>
        </div>
      </div>

      {/* User Info Card */}
      <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '30px' }}>
        <div style={{ width: '60px', height: '60px', borderRadius: '30px', background: 'var(--color-electric)', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '24px', fontWeight: 'bold' }}>
          {profile.full_name?.charAt(0)}
        </div>
        <div>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>{profile.full_name}</h3>
          <p style={{ color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.9rem' }}>
            <Phone size={14} /> {profile.phone_number}
          </p>
          <p style={{ color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.9rem' }}>
            <MapPin size={14} /> {profile.wilaya || 'غير محدد'}
          </p>
        </div>
      </div>

      {/* Stats Row */}
      <div style={{ display: 'flex', gap: '15px', marginBottom: '30px' }}>
        <div className="glass-card" style={{ flex: 1, textAlign: 'center' }}>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>إجمالي الإعلانات</p>
          <h2 style={{ fontSize: '1.8rem', color: 'var(--color-electric)', fontWeight: 800 }}>{totalListings}</h2>
        </div>
        <div className="glass-card" style={{ flex: 1, textAlign: 'center' }}>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>عدد الزيارات (الرمز)</p>
          <h2 style={{ fontSize: '1.8rem', color: 'var(--color-accent)', fontWeight: 800 }}>{profile.total_qr_scans || 0}</h2>
        </div>
      </div>

      {/* My Listings Section */}
      <div style={{ marginBottom: '40px' }}>
        <h3 style={{ marginBottom: '15px', fontWeight: 'bold', fontSize: '1.2rem' }}>إعلاناتي المعروضة</h3>
        {loading ? (
          <p style={{ textAlign: 'center', padding: '20px' }}>جاري التحميل...</p>
        ) : userListings.length === 0 ? (
          <div className="glass-card" style={{ textAlign: 'center', padding: '30px', color: 'var(--color-text-secondary)' }}>
            <p>لا توجد إعلانات نشطة حالياً</p>
            <button className="primary-btn mt-4" onClick={() => navigate('/add')}>أضف إعلانك الأول</button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {userListings.map(listing => (
              <div key={listing.id} className="glass-card" style={{ padding: '12px', display: 'flex', gap: '15px', alignItems: 'center' }}>
                <div style={{ position: 'relative' }}>
                  <img 
                    src={listing.listing_media?.find((m:any) => m.is_cover)?.public_url || listing.listing_media?.[0]?.public_url || 'https://placehold.co/100'} 
                    style={{ width: '90px', height: '90px', borderRadius: '12px', objectFit: 'cover' }} 
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <h4 style={{ fontSize: '1rem', fontWeight: 'bold', marginBottom: '4px' }}>{listing.title}</h4>
                  <p style={{ fontSize: '0.9rem', color: 'var(--color-accent)', fontWeight: 'bold' }}>
                    {listing.price?.toLocaleString()} {listing.currency}
                  </p>
                  <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
                    📍 {listing.wilaya}
                  </p>
                  <div style={{ display: 'flex', gap: '15px', marginTop: '12px' }}>
                    <button 
                      onClick={() => navigate(`/edit/${listing.id}`)} 
                      style={{ fontSize: '0.85rem', color: 'var(--color-electric)', background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 'bold' }}>
                      <Edit size={14} /> تعديل
                    </button>
                    <button 
                      onClick={() => handleDelete(listing.id)} 
                      style={{ fontSize: '0.85rem', color: 'var(--color-accent)', background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 'bold' }}>
                      <Trash2 size={14} /> حذف
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* QR Code Section */}
      <div className="glass-card" style={{ textAlign: 'center', padding: '30px 20px', border: '2px solid rgba(233, 69, 96, 0.3)', marginBottom: '40px' }}>
        <h3 style={{ marginBottom: '10px', color: 'var(--color-text-primary)', fontWeight: 800 }}>رمز المتجر الشخصي</h3>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', marginBottom: '25px' }}>
          اجعل الزبائن يتصفحون جميع سلعك بمسحة واحدة للكود
        </p>
        
        <div style={{ background: '#fff', padding: '20px', borderRadius: '20px', display: 'inline-block', marginBottom: '25px', boxShadow: '0 0 30px rgba(79, 172, 254, 0.2)' }}>
          <QRCodeSVG 
            value={sellerUrl} 
            size={180} 
            level="H"
            includeMargin={false}
          />
        </div>

        <div style={{ background: 'rgba(79, 172, 254, 0.05)', padding: '15px', borderRadius: '15px', border: '1px solid rgba(79, 172, 254, 0.1)', marginBottom: '20px' }}>
          <p style={{ fontSize: '1.2rem', fontWeight: 900, color: '#4facfe', margin: 0, lineHeight: 1.6, textAlign: 'center' }}>
            "سكاني وشري هاني" 🚗🏍️🏠
          </p>
        </div>
        
        <button className="primary-btn" style={{ width: '100%', maxWidth: '250px' }} onClick={() => {
          navigator.clipboard.writeText(sellerUrl);
          alert('تم نسخ رابط متجرك الشخصي!');
        }}>
          نسخ رابط المتجر <Link size={18} />
        </button>
      </div>

    </div>
  );
};

export default ProfileScreen;
