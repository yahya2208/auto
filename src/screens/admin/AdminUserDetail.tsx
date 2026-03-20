import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase, supabaseUrl, supabaseAnonKey } from '../../lib/supabase';
import { ArrowRight, BadgeCheck, Shield, Ban, Trash2, Key, Eye, Share2, Calendar, MapPin, Phone, Users, Car, Bike, Home, Edit3, Save, X } from 'lucide-react';

interface UserDetail {
  id: string;
  full_name: string;
  phone_number: string;
  wilaya: string | null;
  avatar_url: string | null;
  qr_code_token: string;
  total_qr_scans: number;
  followers_count: number;
  is_admin: boolean;
  is_verified?: boolean;
  status?: string;
  created_at: string;
}

const AdminUserDetail = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const [user, setUser] = useState<UserDetail | null>(null);
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState({ full_name: '', phone_number: '', wilaya: '' });
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const getToken = async () => {
    const { data: sess } = await supabase.auth.getSession();
    return sess.session?.access_token || supabaseAnonKey;
  };

  useEffect(() => {
    if (!userId) return;
    const load = async () => {
      setLoading(true);
      const [profileRes, listingsRes] = await Promise.all([
        (supabase.from('profiles') as any).select('*').eq('id', userId).single(),
        (supabase.from('listings') as any).select('*, listing_media(id, public_url, is_cover)').eq('user_id', userId).order('created_at', { ascending: false })
      ]);
      if (profileRes.data) {
        setUser(profileRes.data);
        setEditData({ full_name: profileRes.data.full_name, phone_number: profileRes.data.phone_number, wilaya: profileRes.data.wilaya || '' });
      }
      if (listingsRes.data) setListings(listingsRes.data);
      setLoading(false);
    };
    load();
  }, [userId]);

  const updateField = async (fields: Record<string, any>) => {
    const token = await getToken();
    await fetch(`${supabaseUrl}/rest/v1/profiles?id=eq.${userId}`, {
      method: 'PATCH',
      headers: { 'apikey': supabaseAnonKey, 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(fields)
    });
    setUser(prev => prev ? { ...prev, ...fields } : prev);
  };

  const handleSaveEdit = async () => {
    await updateField(editData);
    setEditing(false);
    showToast('تم حفظ التعديلات بنجاح ✅');
  };

  const toggleVerify = async () => {
    if (!user) return;
    await updateField({ is_verified: !user.is_verified });
    showToast(user.is_verified ? 'تم إزالة التوثيق' : 'تم توثيق الحساب ✅');
  };

  const toggleAdmin = async () => {
    if (!user) return;
    await updateField({ is_admin: !user.is_admin });
    showToast(user.is_admin ? 'تم إزالة صلاحيات المشرف' : 'تم ترقية المستخدم للمشرف 🛡️');
  };

  const banUser = async () => {
    if (!window.confirm('هل أنت متأكد من حظر هذا المستخدم؟')) return;
    const token = await getToken();
    await updateField({ status: 'banned' });
    await fetch(`${supabaseUrl}/rest/v1/listings?user_id=eq.${userId}`, {
      method: 'PATCH',
      headers: { 'apikey': supabaseAnonKey, 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: false })
    });
    setListings(prev => prev.map(l => ({ ...l, is_active: false })));
    showToast('تم حظر المستخدم وتعطيل إعلاناته 🚫', 'error');
  };

  const deleteListing = async (listingId: string) => {
    if (!window.confirm('هل تريد حذف هذا الإعلان نهائياً؟')) return;
    const token = await getToken();
    await fetch(`${supabaseUrl}/rest/v1/listings?id=eq.${listingId}`, {
      method: 'DELETE',
      headers: { 'apikey': supabaseAnonKey, 'Authorization': `Bearer ${token}` }
    });
    setListings(prev => prev.filter(l => l.id !== listingId));
    showToast('تم حذف الإعلان');
  };

  if (loading) return <div style={{ textAlign: 'center', padding: '60px' }}>جاري التحميل...</div>;
  if (!user) return <div style={{ textAlign: 'center', padding: '60px' }}>لم يتم العثور على المستخدم</div>;

  return (
    <div style={{ padding: '20px 20px 100px', overflowY: 'auto' }}>
      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', top: '20px', left: '50%', transform: 'translateX(-50%)', zIndex: 9999,
          padding: '12px 24px', borderRadius: '12px', fontWeight: 'bold', fontSize: '0.9rem',
          background: toast.type === 'success' ? 'linear-gradient(90deg,#38ef7d,#11998e)' : 'linear-gradient(90deg,#ff416c,#ff4b2b)',
          color: '#fff', boxShadow: '0 8px 30px rgba(0,0,0,0.3)'
        }}>{toast.msg}</div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '25px' }}>
        <button onClick={() => navigate('/admin')} style={{ background: 'var(--color-glass-bg)', border: '1px solid var(--color-glass-border)', padding: '10px', borderRadius: '50%', color: 'white', cursor: 'pointer' }}>
          <ArrowRight size={20} />
        </button>
        <h2 style={{ fontSize: '1.3rem', fontWeight: 800 }}>ملف المستخدم</h2>
      </div>

      {/* Profile Card */}
      <div className="glass-card" style={{ padding: '25px', marginBottom: '20px', borderTop: user.status === 'banned' ? '4px solid #ff416c' : '4px solid #4facfe', position: 'relative' }}>
        {/* Status Badge */}
        {user.status === 'banned' && (
          <div style={{ position: 'absolute', top: '15px', left: '15px', background: 'rgba(255,65,108,0.2)', color: '#ff416c', padding: '4px 12px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 'bold' }}>محظور</div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '20px' }}>
          <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'linear-gradient(135deg,#4facfe,#00f2fe)', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '32px', fontWeight: 'bold', flexShrink: 0 }}>
            {user.full_name?.charAt(0)}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>{user.full_name}</h2>
              {user.is_verified && <BadgeCheck size={20} color="#1d9bf0" />}
              {user.is_admin && <Shield size={18} color="#f6d365" />}
            </div>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '5px' }}><Phone size={14} /> {user.phone_number}</p>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '5px' }}><MapPin size={14} /> {user.wilaya || 'غير محدد'}</p>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '5px', marginTop: '4px' }}><Calendar size={14} /> تسجيل: {new Date(user.created_at).toLocaleDateString('ar-DZ')}</p>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '10px', marginBottom: '15px' }}>
          {[
            { label: 'كل الإعلانات', value: listings.length, color: '#4facfe', icon: <Car size={16} /> },
            { label: 'المتابعين', value: user.followers_count || 0, color: '#ff416c', icon: <Users size={16} /> },
            { label: 'زيارات QR', value: user.total_qr_scans || 0, color: '#38ef7d', icon: <Eye size={16} /> },
            { label: 'النشطة', value: listings.filter(l => l.is_active).length, color: '#f6d365', icon: <Share2 size={16} /> }
          ].map((s, i) => (
            <div key={i} style={{ textAlign: 'center', padding: '12px 5px', borderRadius: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--color-glass-border)' }}>
              <div style={{ color: s.color, marginBottom: '4px', display: 'flex', justifyContent: 'center' }}>{s.icon}</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 800 }}>{s.value}</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--color-text-secondary)' }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Detailed Listing Breakdown */}
        <div className="glass-card" style={{ padding: '15px', marginBottom: '0', background: 'rgba(255,255,255,0.02)' }}>
          <h4 style={{ fontSize: '0.9rem', fontWeight: 'bold', marginBottom: '12px', color: 'var(--color-text-secondary)' }}>📊 تفاصيل الإعلانات</h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '8px', marginBottom: '12px' }}>
            <MiniStat label="🚗 سيارات" value={listings.filter(l => l.category === 'car').length} />
            <MiniStat label="🏍️ دراجات" value={listings.filter(l => l.category === 'motorcycle').length} />
            <MiniStat label="🏠 عقارات" value={listings.filter(l => l.category === 'real_estate').length} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '8px', marginBottom: '12px' }}>
            <MiniStat label="👁️ مشاهدات" value={listings.reduce((sum: number, l: any) => sum + (l.view_count || 0), 0)} />
            <MiniStat label="🔗 مشاركات" value={listings.reduce((sum: number, l: any) => sum + (l.share_count || 0), 0)} />
            <MiniStat label="🔴 معطلة" value={listings.filter(l => !l.is_active).length} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '8px' }}>
            <MiniStat label="💰 بيع" value={listings.filter(l => l.listing_type === 'sell').length} />
            <MiniStat label="🛒 شراء" value={listings.filter(l => l.listing_type === 'buy').length} />
            <MiniStat label="🔄 تبادل" value={listings.filter(l => l.listing_type === 'exchange').length} />
          </div>
        </div>

        {/* Edit Mode */}
        {editing ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '15px' }}>
            <input value={editData.full_name} onChange={e => setEditData(p => ({ ...p, full_name: e.target.value }))} placeholder="الاسم الكامل"
              style={inputStyle} />
            <input value={editData.phone_number} onChange={e => setEditData(p => ({ ...p, phone_number: e.target.value }))} placeholder="رقم الهاتف"
              style={inputStyle} />
            <input value={editData.wilaya} onChange={e => setEditData(p => ({ ...p, wilaya: e.target.value }))} placeholder="الولاية"
              style={inputStyle} />
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={handleSaveEdit} style={{ ...actionBtnStyle, background: 'linear-gradient(90deg,#38ef7d,#11998e)', flex: 1 }}><Save size={16} /> حفظ</button>
              <button onClick={() => setEditing(false)} style={{ ...actionBtnStyle, background: 'rgba(255,255,255,0.1)', flex: 1 }}><X size={16} /> إلغاء</button>
            </div>
          </div>
        ) : null}
      </div>

      {/* Admin Actions */}
      <div className="glass-card" style={{ padding: '20px', marginBottom: '20px' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '15px' }}>⚡ إجراءات سريعة</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: '10px' }}>
          <button onClick={() => setEditing(true)} style={{ ...actionBtnStyle, background: 'linear-gradient(90deg,#4facfe,#00f2fe)' }}><Edit3 size={16} /> تعديل البيانات</button>
          <button onClick={toggleVerify} style={{ ...actionBtnStyle, background: user.is_verified ? 'rgba(255,255,255,0.1)' : 'linear-gradient(90deg,#667eea,#764ba2)' }}>
            <BadgeCheck size={16} /> {user.is_verified ? 'إزالة التوثيق' : 'توثيق ✅'}
          </button>
          <button onClick={toggleAdmin} style={{ ...actionBtnStyle, background: user.is_admin ? 'rgba(255,255,255,0.1)' : 'linear-gradient(90deg,#f6d365,#fda085)' }}>
            <Shield size={16} /> {user.is_admin ? 'إزالة الإشراف' : 'ترقية مشرف'}
          </button>
          <button onClick={banUser} style={{ ...actionBtnStyle, background: 'linear-gradient(90deg,#ff416c,#ff4b2b)' }}><Ban size={16} /> حظر</button>
        </div>
      </div>

      {/* User Listings */}
      <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '15px' }}>📋 إعلانات المستخدم ({listings.length})</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {listings.length === 0 ? (
          <div className="glass-card" style={{ textAlign: 'center', padding: '30px', color: 'var(--color-text-secondary)' }}>لا توجد إعلانات</div>
        ) : listings.map(listing => {
          const cover = listing.listing_media?.find((m: any) => m.is_cover)?.public_url || listing.listing_media?.[0]?.public_url || '';
          return (
            <div key={listing.id} className="glass-card" style={{ padding: '12px', display: 'flex', gap: '12px', alignItems: 'center', opacity: listing.is_active ? 1 : 0.5 }}>
              {cover && <img src={cover} style={{ width: '70px', height: '70px', borderRadius: '10px', objectFit: 'cover' }} />}
              <div style={{ flex: 1 }}>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 'bold' }}>{listing.title}</h4>
                <p style={{ fontSize: '0.85rem', color: 'var(--color-accent)', fontWeight: 'bold' }}>{listing.price?.toLocaleString()} {listing.currency}</p>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', display: 'flex', gap: '10px' }}>
                  <span>👁️ {listing.view_count || 0}</span>
                  <span>{listing.is_active ? '🟢 نشط' : '🔴 معطل'}</span>
                </div>
              </div>
              <button onClick={() => deleteListing(listing.id)} style={{ background: 'rgba(255,65,108,0.15)', border: 'none', padding: '8px', borderRadius: '8px', color: '#ff416c', cursor: 'pointer' }}>
                <Trash2 size={16} />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const inputStyle: React.CSSProperties = { padding: '12px', borderRadius: '10px', border: '1px solid var(--color-glass-border)', background: 'rgba(255,255,255,0.05)', color: '#fff', fontSize: '0.9rem' };
const actionBtnStyle: React.CSSProperties = { padding: '12px', borderRadius: '12px', border: 'none', color: '#fff', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', transition: 'all 0.3s ease' };

const MiniStat = ({ label, value }: { label: string; value: number }) => (
  <div style={{ textAlign: 'center', padding: '8px 4px', borderRadius: '8px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
    <div style={{ fontSize: '1rem', fontWeight: 800 }}>{value}</div>
    <div style={{ fontSize: '0.65rem', color: 'var(--color-text-secondary)' }}>{label}</div>
  </div>
);

export default AdminUserDetail;
