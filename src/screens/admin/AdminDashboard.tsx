import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/authStore';
import { useNavigate } from 'react-router-dom';
import { Users, Car, Bike, Home, MessageSquare, TrendingUp, BarChart, ArrowRight, Eye, Share2, BadgeCheck, Shield, Settings, Bell, ChevronLeft } from 'lucide-react';

interface Stats {
  totalUsers: number;
  totalListings: number;
  carsCount: number;
  bikesCount: number;
  realEstateCount: number;
  totalComments: number;
  verifiedUsers: number;
  adminCount: number;
}

const AdminDashboard = () => {
  const { profile } = useAuthStore();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0, totalListings: 0, carsCount: 0, bikesCount: 0,
    realEstateCount: 0, totalComments: 0, verifiedUsers: 0, adminCount: 0
  });
  const [topListings, setTopListings] = useState<any[]>([]);
  const [recentUsers, setRecentUsers] = useState<any[]>([]);

  useEffect(() => {
    if (!profile?.is_admin) { navigate('/'); return; }

    const fetchStats = async () => {
      try {
        const [usersRes, listingsRes, commentsRes, topRes, recentRes] = await Promise.all([
          (supabase.from('profiles') as any).select('id, is_admin, is_verified'),
          (supabase.from('listings') as any).select('id, category'),
          (supabase.from('comments') as any).select('id'),
          (supabase.from('listings') as any).select('id, title, view_count, share_count, category').order('view_count', { ascending: false }).limit(5),
          (supabase.from('profiles') as any).select('id, full_name, wilaya, is_verified, is_admin, created_at').order('created_at', { ascending: false }).limit(5)
        ]);

        const allListings: any[] = listingsRes.data || [];
        const allUsers: any[] = usersRes.data || [];
        setStats({
          totalUsers: allUsers.length,
          totalListings: allListings.length,
          carsCount: allListings.filter(l => l.category === 'car').length,
          bikesCount: allListings.filter(l => l.category === 'motorcycle').length,
          realEstateCount: allListings.filter(l => l.category === 'real_estate').length,
          totalComments: (commentsRes.data || []).length,
          verifiedUsers: allUsers.filter((u: any) => u.is_verified).length,
          adminCount: allUsers.filter((u: any) => u.is_admin).length,
        });
        setTopListings(topRes.data || []);
        setRecentUsers(recentRes.data || []);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    fetchStats();
  }, [profile, navigate]);

  if (loading) return <div style={{ textAlign: 'center', marginTop: '50px' }}>جاري تحميل لوحة التحكم...</div>;

  return (
    <div style={{ padding: '20px', paddingBottom: '100px', overflowY: 'auto' }}>

      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '25px' }}>
        <button onClick={() => navigate(-1)} style={{ background: 'var(--color-glass-bg)', border: '1px solid var(--color-glass-border)', padding: '10px', borderRadius: '50%', color: 'white', cursor: 'pointer' }}>
          <ArrowRight size={20} />
        </button>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 800, flex: 1 }}>🛡️ لوحة تحكم المشرف</h2>
      </div>

      {/* Quick Nav Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', marginBottom: '25px' }}>
        <NavCard title="إدارة المستخدمين" icon={<Users size={22} />} color="#4facfe" count={stats.totalUsers} onClick={() => navigate('/admin/users')} />
        <NavCard title="الإعلانات" icon={<BarChart size={22} />} color="#38ef7d" count={stats.totalListings} onClick={() => {}} />
        <NavCard title="الموثقين" icon={<BadgeCheck size={22} />} color="#1d9bf0" count={stats.verifiedUsers} onClick={() => navigate('/admin/users')} />
        <NavCard title="المشرفين" icon={<Shield size={22} />} color="#f6d365" count={stats.adminCount} onClick={() => navigate('/admin/users')} />
      </div>

      {/* Stats Grid */}
      <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '12px' }}>📊 الإحصائيات</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '25px' }}>
        <StatCard title="السيارات" value={stats.carsCount} icon={<Car />} color="#f6d365" />
        <StatCard title="الدراجات" value={stats.bikesCount} icon={<Bike />} color="#ff0844" />
        <StatCard title="العقارات" value={stats.realEstateCount} icon={<Home />} color="#89216b" />
      </div>

      {/* Recent Users */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>🆕 آخر المسجلين</h3>
        <button onClick={() => navigate('/admin/users')} style={{ background: 'transparent', border: 'none', color: 'var(--color-electric)', cursor: 'pointer', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
          عرض الكل <ChevronLeft size={16} />
        </button>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '25px' }}>
        {recentUsers.map(u => (
          <div key={u.id} className="glass-card" style={{ padding: '12px', display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}
            onClick={() => navigate(`/admin/user/${u.id}`)}>
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'linear-gradient(135deg,#4facfe,#00f2fe)', display: 'flex', justifyContent: 'center', alignItems: 'center', fontWeight: 'bold', flexShrink: 0 }}>
              {u.full_name?.charAt(0)}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontWeight: 600 }}>{u.full_name}</span>
                {u.is_verified && <BadgeCheck size={14} color="#1d9bf0" />}
                {u.is_admin && <Shield size={12} color="#f6d365" />}
              </div>
              <span style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>{u.wilaya || 'غير محدد'} • {new Date(u.created_at).toLocaleDateString('ar-DZ')}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Top Listings */}
      <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <TrendingUp size={20} color="var(--color-electric)" /> الأكثر تفاعلاً
      </h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {topListings.map((listing, i) => (
          <div key={listing.id} className="glass-card" style={{ padding: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontWeight: 'bold', marginBottom: '4px', fontSize: '0.9rem' }}>{i + 1}. {listing.title}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', display: 'flex', gap: '15px' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Eye size={14} /> {listing.view_count || 0}</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Share2 size={14} /> {listing.share_count || 0}</span>
              </div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.1)', padding: '4px 10px', borderRadius: '8px', fontSize: '0.75rem' }}>
              {listing.category === 'car' ? '🚗' : listing.category === 'motorcycle' ? '🏍️' : '🏠'}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const NavCard = ({ title, icon, color, count, onClick }: any) => (
  <div className="glass-card" onClick={onClick} style={{ padding: '18px 15px', cursor: 'pointer', borderRight: `4px solid ${color}`, transition: 'transform 0.2s', display: 'flex', alignItems: 'center', gap: '12px' }}
    onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.02)')}
    onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}>
    <div style={{ color }}>{icon}</div>
    <div>
      <div style={{ fontSize: '1.3rem', fontWeight: 900 }}>{count}</div>
      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>{title}</div>
    </div>
  </div>
);

const StatCard = ({ title, value, icon, color }: any) => (
  <div className="glass-card" style={{ padding: '15px 10px', textAlign: 'center', borderTop: `3px solid ${color}` }}>
    <div style={{ color, marginBottom: '8px', display: 'flex', justifyContent: 'center' }}>
      {React.cloneElement(icon, { size: 22 })}
    </div>
    <div style={{ fontSize: '1.4rem', fontWeight: 900 }}>{value}</div>
    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>{title}</div>
  </div>
);

export default AdminDashboard;
