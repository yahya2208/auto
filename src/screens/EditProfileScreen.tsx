import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { supabase } from '../lib/supabase';
import { ArrowRight, Save, User as UserIcon } from 'lucide-react';
import { WILAYAS } from '../data';

const EditProfileScreen = () => {
  const { profile, fetchProfile } = useAuthStore();
  const navigate = useNavigate();
  
  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [phoneNumber, setPhoneNumber] = useState(profile?.phone_number || '');
  const [wilaya, setWilaya] = useState(profile?.wilaya || '');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!profile) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    const { error } = await (supabase
      .from('profiles') as any)
      .update({
        full_name: fullName,
        phone_number: phoneNumber,
        wilaya: wilaya,
      })
      .eq('id', profile.id);

    if (error) {
      setErrorMsg(error.message);
    } else {
      await fetchProfile(profile.id);
      alert('تم تحديث الملف الشخصي بنجاح!');
      navigate('/profile');
    }
    setLoading(false);
  };

  return (
    <div style={{ padding: '20px 20px 100px 20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '25px' }}>
        <button onClick={() => navigate(-1)} style={{ background: 'var(--color-glass-bg)', border: '1px solid var(--color-glass-border)', padding: '10px', borderRadius: '50%', color: 'white' }}>
          <ArrowRight size={20} />
        </button>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>تعديل الملف الشخصي</h2>
      </div>

      <form onSubmit={handleSave} className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div style={{ textAlign: 'center', marginBottom: '10px' }}>
            <div style={{ width: '80px', height: '80px', borderRadius: '40px', background: 'var(--color-electric)', display: 'inline-flex', justifyContent: 'center', alignItems: 'center', fontSize: '32px', fontWeight: 'bold' }}>
                <UserIcon size={40} />
            </div>
        </div>

        {errorMsg && <div style={{ color: 'var(--color-accent)', textAlign: 'center' }}>{errorMsg}</div>}

        <div>
          <label style={labelStyle}>الاسم الكامل</label>
          <input required type="text" value={fullName} onChange={e => setFullName(e.target.value)} style={inputStyle} />
        </div>

        <div>
          <label style={labelStyle}>رقم الهاتف</label>
          <input required type="tel" value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)} style={inputStyle} />
        </div>

        <div>
          <label style={labelStyle}>الولاية</label>
          <select value={wilaya} onChange={e => setWilaya(e.target.value)} style={inputStyle}>
            {WILAYAS.map(w => <option key={w} value={w} style={{color:'#000'}}>{w}</option>)}
          </select>
        </div>

        <button type="submit" className="primary-btn mt-4" disabled={loading}>
          {loading ? 'جاري الحفظ...' : 'حفظ التغييرات'} <Save size={18} />
        </button>
      </form>
    </div>
  );
};

const labelStyle = { display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--color-text-secondary)' };
const inputStyle = {
  width: '100%', padding: '12px 15px', borderRadius: '10px',
  backgroundColor: 'rgba(255, 255, 255, 0.05)',
  border: '1px solid var(--color-glass-border)',
  color: '#fff', fontFamily: 'inherit', outline: 'none', fontSize: '1rem',
};

export default EditProfileScreen;
