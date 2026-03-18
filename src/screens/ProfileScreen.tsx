import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { QRCodeSVG } from 'qrcode.react';
import { LogOut, MapPin, Phone, Link } from 'lucide-react';
import { useListingStore } from '../store/listingStore';

const ProfileScreen = () => {
  const navigate = useNavigate();
  const { profile, signOut } = useAuthStore();
  const { fetchUserListings } = useListingStore();
  const [totalListings, setTotalListings] = useState(0);

  useEffect(() => {
    if (profile?.id) {
      fetchUserListings(profile.id).then(res => setTotalListings(res.length));
    }
  }, [profile?.id, fetchUserListings]);

  if (!profile) return <div style={{textAlign: 'center', marginTop: '50px'}}>جاري التحميل...</div>;

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
      <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '20px' }}>
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
      <div style={{ display: 'flex', gap: '15px', marginBottom: '20px' }}>
        <div className="glass-card" style={{ flex: 1, textAlign: 'center' }}>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>إعلاناتي</p>
          <h2 style={{ fontSize: '2rem', color: 'var(--color-electric)', fontWeight: 800 }}>{totalListings}</h2>
        </div>
        <div className="glass-card" style={{ flex: 1, textAlign: 'center' }}>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>عدد الزيارات (الرمز)</p>
          <h2 style={{ fontSize: '2rem', color: 'var(--color-accent)', fontWeight: 800 }}>{profile.total_qr_scans || 0}</h2>
        </div>
      </div>

      {/* QR Code Section */}
      <div className="glass-card" style={{ textAlign: 'center', padding: '30px 20px', border: '2px solid rgba(233, 69, 96, 0.3)' }}>
        <h3 style={{ marginBottom: '10px', color: 'var(--color-text-primary)' }}>رمز الإعلانات الخاص بك</h3>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', marginBottom: '20px' }}>
          شارك هذا الرمز ليتمكن الزبائن من رؤية كل إعلاناتك
        </p>
        
        <div style={{ background: '#fff', padding: '15px', borderRadius: '15px', display: 'inline-block', marginBottom: '20px' }}>
          <QRCodeSVG 
            value={sellerUrl} 
            size={200} 
            level="H"
            includeMargin={false}
          />
        </div>

        <div style={{ background: 'rgba(233, 69, 96, 0.1)', padding: '15px', borderRadius: '10px', border: '1px solid rgba(233, 69, 96, 0.2)' }}>
          <p style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--color-accent)', margin: 0 }}>
            "سكانّي الكود وشوف واش نبيع 🚗🏍️🏠 <br/>
            سيارات، دراجات وسكنات… كلش تلقاه هنا!"
          </p>
        </div>
        
        <button className="primary-btn mt-4" onClick={() => {
          navigator.clipboard.writeText(sellerUrl);
          alert('تم نسخ الرابط بنجاح!');
        }}>
          نسخ الرابط <Link size={18} />
        </button>
      </div>

    </div>
  );
};

export default ProfileScreen;
