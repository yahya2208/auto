import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/authStore';
import { useNavigate } from 'react-router-dom';
import { Users, Car, Bike, Home, MessageSquare, TrendingUp, BarChart, ArrowRight, Eye, Share2 } from 'lucide-react';

interface Stats {
  totalUsers: number;
  totalListings: number;
  carsCount: number;
  bikesCount: number;
  realEstateCount: number;
  totalComments: number;
}

const AdminDashboard = () => {
  const { profile } = useAuthStore();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    totalListings: 0,
    carsCount: 0,
    bikesCount: 0,
    realEstateCount: 0,
    totalComments: 0
  });
  
  const [topListings, setTopListings] = useState<any[]>([]);

  useEffect(() => {
    // Basic auth check
    if (!profile?.is_admin) {
      navigate('/');
      return;
    }

    const fetchStats = async () => {
      try {
        const [usersRes, listingsRes, commentsRes, topRes] = await Promise.all([
          supabase.from('profiles').select('id', { count: 'exact' }),
          supabase.from('listings').select('id, category', { count: 'exact' }),
          supabase.from('comments').select('id', { count: 'exact' }),
          supabase.from('listings').select('id, title, view_count, share_count, category').order('view_count', { ascending: false }).limit(5)
        ]);

        const allListings = listingsRes.data || [];
        setStats({
          totalUsers: usersRes.count || 0,
          totalListings: allListings.length,
          carsCount: allListings.filter(l => l.category === 'car').length,
          bikesCount: allListings.filter(l => l.category === 'motorcycle').length,
          realEstateCount: allListings.filter(l => l.category === 'real_estate').length,
          totalComments: commentsRes.count || 0,
        });

        setTopListings(topRes.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [profile, navigate]);

  if (loading) return <div style={{textAlign: 'center', marginTop: '50px'}}>جاري تحميل لوحة التحكم...</div>;

  return (
    <div style={{ padding: '20px', paddingBottom: '100px', overflowY: 'auto' }}>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
        <button onClick={() => navigate(-1)} style={{ background: 'var(--color-glass-bg)', border: '1px solid var(--color-glass-border)', padding: '10px', borderRadius: '50%', color: 'white', cursor: 'pointer' }}>
          <ArrowRight size={20} />
        </button>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>لوحة تحكم المشرف (Admin)</h2>
      </div>

      {/* Grid Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '15px', marginBottom: '30px' }}>
        <StatCard title="المستخدمين" value={stats.totalUsers} icon={<Users />} color="#4facfe" />
        <StatCard title="إجمالي الإعلانات" value={stats.totalListings} icon={<BarChart />} color="#38ef7d" />
        <StatCard title="السيارات" value={stats.carsCount} icon={<Car />} color="#f6d365" />
        <StatCard title="الدراجات" value={stats.bikesCount} icon={<Bike />} color="#ff0844" />
        <StatCard title="العقارات" value={stats.realEstateCount} icon={<Home />} color="#89216b" />
        <StatCard title="التعليقات" value={stats.totalComments} icon={<MessageSquare />} color="#00c6fb" />
      </div>

      {/* Top Listings */}
      <h3 style={{ fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <TrendingUp size={20} color="var(--color-electric)" />
        الإعلانات الأكثر تفاعلاً
      </h3>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {topListings.map((listing, i) => (
          <div key={listing.id} className="glass-card" style={{ padding: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>{i+1}. {listing.title}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', display: 'flex', gap: '15px' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Eye size={14}/> {listing.view_count || 0}</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Share2 size={14}/> {listing.share_count || 0}</span>
              </div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.1)', padding: '5px 10px', borderRadius: '8px', fontSize: '0.8rem' }}>
              {listing.category === 'car' ? 'سيارة' : listing.category === 'motorcycle' ? 'دراجة' : 'عقار'}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Helper component
const StatCard = ({ title, value, icon, color }: any) => (
  <div className="glass-card" style={{ padding: '20px 15px', textAlign: 'center', borderTop: `3px solid ${color}` }}>
    <div style={{ color: color, marginBottom: '10px', display: 'flex', justifyContent: 'center' }}>
      {React.cloneElement(icon, { size: 28 })}
    </div>
    <div style={{ fontSize: '1.8rem', fontWeight: 900, marginBottom: '5px' }}>{value}</div>
    <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>{title}</div>
  </div>
);

export default AdminDashboard;
