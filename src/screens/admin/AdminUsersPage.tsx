import { useEffect, useState, useMemo } from 'react';
import { supabase, supabaseUrl, supabaseAnonKey } from '../../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, ChevronDown, ChevronUp, BadgeCheck, Shield, Ban, UserX, MoreVertical, ChevronLeft, ChevronRight as ChevRight } from 'lucide-react';

interface UserRow {
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

const PAGE_SIZE = 15;

const AdminUsersPage = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState<'created_at' | 'full_name' | 'followers_count'>('created_at');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [filterStatus, setFilterStatus] = useState<'all' | 'admin' | 'verified'>('all');
  const [page, setPage] = useState(0);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [actionMenu, setActionMenu] = useState<string | null>(null);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data, error } = await (supabase.from('profiles') as any)
        .select('*')
        .order('created_at', { ascending: false });
      if (!error && data) setUsers(data);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const toggleVerify = async (userId: string, current: boolean) => {
    const { data: sess } = await supabase.auth.getSession();
    const token = sess.session?.access_token || supabaseAnonKey;
    await fetch(`${supabaseUrl}/rest/v1/profiles?id=eq.${userId}`, {
      method: 'PATCH',
      headers: { 'apikey': supabaseAnonKey, 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_verified: !current })
    });
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, is_verified: !current } : u));
    showToast(!current ? 'تم توثيق الحساب ✅' : 'تم إزالة التوثيق');
    setActionMenu(null);
  };

  const toggleAdmin = async (userId: string, current: boolean) => {
    const { data: sess } = await supabase.auth.getSession();
    const token = sess.session?.access_token || supabaseAnonKey;
    await fetch(`${supabaseUrl}/rest/v1/profiles?id=eq.${userId}`, {
      method: 'PATCH',
      headers: { 'apikey': supabaseAnonKey, 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_admin: !current })
    });
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, is_admin: !current } : u));
    showToast(!current ? 'تم ترقية المستخدم للمشرف 🛡️' : 'تم إزالة صلاحيات المشرف');
    setActionMenu(null);
  };

  const banUser = async (userId: string) => {
    if (!window.confirm('هل أنت متأكد من حظر هذا المستخدم؟ سيتم تعطيل جميع إعلاناته.')) return;
    const { data: sess } = await supabase.auth.getSession();
    const token = sess.session?.access_token || supabaseAnonKey;
    await fetch(`${supabaseUrl}/rest/v1/profiles?id=eq.${userId}`, {
      method: 'PATCH',
      headers: { 'apikey': supabaseAnonKey, 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'banned' })
    });
    await fetch(`${supabaseUrl}/rest/v1/listings?user_id=eq.${userId}`, {
      method: 'PATCH',
      headers: { 'apikey': supabaseAnonKey, 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: false })
    });
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, status: 'banned' } : u));
    showToast('تم حظر المستخدم وتعطيل إعلاناته 🚫', 'error');
    setActionMenu(null);
  };

  // Filter + Search + Sort
  const filtered = useMemo(() => {
    let result = [...users];
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(u => u.full_name?.toLowerCase().includes(q) || u.phone_number?.includes(q) || u.wilaya?.toLowerCase().includes(q));
    }
    if (filterStatus === 'admin') result = result.filter(u => u.is_admin);
    if (filterStatus === 'verified') result = result.filter(u => u.is_verified);
    result.sort((a: any, b: any) => {
      const va = a[sortField] || '';
      const vb = b[sortField] || '';
      return sortDir === 'asc' ? (va > vb ? 1 : -1) : (va < vb ? 1 : -1);
    });
    return result;
  }, [users, search, filterStatus, sortField, sortDir]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paged = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const handleSort = (field: typeof sortField) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('desc'); }
  };

  const SortIcon = ({ field }: { field: typeof sortField }) => (
    sortField === field ? (sortDir === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />) : <ChevronDown size={14} style={{ opacity: 0.3 }} />
  );

  if (loading) return <div style={{ textAlign: 'center', padding: '60px' }}>جاري تحميل المستخدمين...</div>;

  return (
    <div style={{ padding: '20px 20px 100px' }}>
      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', top: '20px', left: '50%', transform: 'translateX(-50%)', zIndex: 9999,
          padding: '12px 24px', borderRadius: '12px', fontWeight: 'bold', fontSize: '0.9rem',
          background: toast.type === 'success' ? 'linear-gradient(90deg,#38ef7d,#11998e)' : 'linear-gradient(90deg,#ff416c,#ff4b2b)',
          color: '#fff', boxShadow: '0 8px 30px rgba(0,0,0,0.3)', animation: 'fadeIn 0.3s ease'
        }}>{toast.msg}</div>
      )}

      <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '20px' }}>👥 إدارة المستخدمين ({filtered.length})</h2>

      {/* Search + Filters */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: '200px', position: 'relative' }}>
          <Search size={18} style={{ position: 'absolute', right: '12px', top: '12px', color: 'var(--color-text-secondary)' }} />
          <input
            placeholder="بحث بالاسم، الهاتف، الولاية..."
            value={search} onChange={e => { setSearch(e.target.value); setPage(0); }}
            style={{ width: '100%', padding: '12px 40px 12px 12px', borderRadius: '12px', border: '1px solid var(--color-glass-border)', background: 'var(--color-glass-bg)', color: '#fff', fontSize: '0.9rem' }}
          />
        </div>
        <select value={filterStatus} onChange={e => { setFilterStatus(e.target.value as any); setPage(0); }}
          style={{ padding: '12px', borderRadius: '12px', border: '1px solid var(--color-glass-border)', background: 'var(--color-glass-bg)', color: '#fff', fontSize: '0.85rem' }}>
          <option value="all">الكل</option>
          <option value="admin">المشرفين فقط</option>
          <option value="verified">الموثقين فقط</option>
        </select>
      </div>

      {/* Users Table */}
      <div style={{ overflowX: 'auto', borderRadius: '16px', border: '1px solid var(--color-glass-border)', background: 'var(--color-glass-bg)', backdropFilter: 'blur(20px)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '700px' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--color-glass-border)' }}>
              <th style={thStyle}>المستخدم</th>
              <th style={{ ...thStyle, cursor: 'pointer' }} onClick={() => handleSort('full_name')}>الاسم <SortIcon field="full_name" /></th>
              <th style={thStyle}>الهاتف</th>
              <th style={thStyle}>الولاية</th>
              <th style={{ ...thStyle, cursor: 'pointer' }} onClick={() => handleSort('followers_count')}>المتابعين <SortIcon field="followers_count" /></th>
              <th style={thStyle}>الحالة</th>
              <th style={{ ...thStyle, cursor: 'pointer' }} onClick={() => handleSort('created_at')}>التسجيل <SortIcon field="created_at" /></th>
              <th style={thStyle}>إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {paged.map(user => (
              <tr key={user.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', transition: 'background 0.2s' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.03)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                <td style={tdStyle}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'linear-gradient(135deg,#4facfe,#00f2fe)', display: 'flex', justifyContent: 'center', alignItems: 'center', fontWeight: 'bold', fontSize: '0.9rem' }}>
                    {user.full_name?.charAt(0) || '?'}
                  </div>
                </td>
                <td style={tdStyle}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ cursor: 'pointer', fontWeight: 600 }} onClick={() => navigate(`/admin/user/${user.id}`)}>{user.full_name}</span>
                    {user.is_verified && <BadgeCheck size={16} color="#1d9bf0" />}
                    {user.is_admin && <Shield size={14} color="#f6d365" />}
                  </div>
                </td>
                <td style={{ ...tdStyle, direction: 'ltr', fontSize: '0.85rem' }}>{user.phone_number}</td>
                <td style={tdStyle}>{user.wilaya || '-'}</td>
                <td style={{ ...tdStyle, fontWeight: 'bold', color: 'var(--color-electric)' }}>{user.followers_count || 0}</td>
                <td style={tdStyle}>
                  {user.status === 'banned' ? (
                    <span style={{ background: 'rgba(255,65,108,0.2)', color: '#ff416c', padding: '4px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 'bold' }}>محظور</span>
                  ) : (
                    <span style={{ background: 'rgba(56,239,125,0.15)', color: '#38ef7d', padding: '4px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 'bold' }}>نشط</span>
                  )}
                </td>
                <td style={{ ...tdStyle, fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
                  {new Date(user.created_at).toLocaleDateString('ar-DZ')}
                </td>
                <td style={tdStyle}>
                  <div style={{ position: 'relative' }}>
                    <button onClick={() => setActionMenu(actionMenu === user.id ? null : user.id)}
                      style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', padding: '6px' }}>
                      <MoreVertical size={18} />
                    </button>
                    {actionMenu === user.id && (
                      <div style={{
                        position: 'absolute', left: 0, top: '100%', background: 'rgba(20,20,40,0.98)', border: '1px solid var(--color-glass-border)',
                        borderRadius: '12px', padding: '8px 0', minWidth: '180px', zIndex: 100, boxShadow: '0 10px 40px rgba(0,0,0,0.5)'
                      }}>
                        <MenuBtn icon={<BadgeCheck size={16} color="#1d9bf0" />} label={user.is_verified ? 'إزالة التوثيق' : 'توثيق الحساب ✅'} onClick={() => toggleVerify(user.id, !!user.is_verified)} />
                        <MenuBtn icon={<Shield size={16} color="#f6d365" />} label={user.is_admin ? 'إزالة الإشراف' : 'ترقية لمشرف'} onClick={() => toggleAdmin(user.id, user.is_admin)} />
                        <MenuBtn icon={<Ban size={16} color="#ff416c" />} label="حظر المستخدم" onClick={() => banUser(user.id)} danger />
                        <MenuBtn icon={<UserX size={16} />} label="عرض التفاصيل" onClick={() => { navigate(`/admin/user/${user.id}`); setActionMenu(null); }} />
                      </div>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '15px', marginTop: '20px' }}>
          <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
            style={{ ...pageBtnStyle, opacity: page === 0 ? 0.4 : 1 }}><ChevRight size={18} /></button>
          <span style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>{page + 1} / {totalPages}</span>
          <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}
            style={{ ...pageBtnStyle, opacity: page >= totalPages - 1 ? 0.4 : 1 }}><ChevronLeft size={18} /></button>
        </div>
      )}
    </div>
  );
};

const MenuBtn = ({ icon, label, onClick, danger }: any) => (
  <button onClick={onClick} style={{
    display: 'flex', alignItems: 'center', gap: '10px', width: '100%', padding: '10px 16px',
    background: 'transparent', border: 'none', color: danger ? '#ff416c' : '#fff',
    cursor: 'pointer', fontSize: '0.85rem', textAlign: 'right', transition: 'background 0.2s'
  }} onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
     onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
    {icon} {label}
  </button>
);

const thStyle: React.CSSProperties = { padding: '14px 12px', textAlign: 'right', fontSize: '0.8rem', color: 'var(--color-text-secondary)', fontWeight: 600, whiteSpace: 'nowrap' };
const tdStyle: React.CSSProperties = { padding: '12px', fontSize: '0.9rem', whiteSpace: 'nowrap' };
const pageBtnStyle: React.CSSProperties = { background: 'var(--color-glass-bg)', border: '1px solid var(--color-glass-border)', borderRadius: '10px', padding: '8px 12px', color: '#fff', cursor: 'pointer' };

export default AdminUsersPage;
