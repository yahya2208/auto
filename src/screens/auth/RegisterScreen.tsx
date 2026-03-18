import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { Eye, EyeOff, UserPlus } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { registerSchema, RegisterForm } from '../../utils/validators';

import { WILAYAS } from '../../data';

const RegisterScreen = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const followSellerId = queryParams.get('follow');

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterForm) => {
    setLoading(true);
    setErrorMsg('');
    const qrToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    
    // 1. Sign up user via Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          full_name: data.full_name,
          phone_number: data.phone_number,
          wilaya: data.wilaya,
          qr_code_token: qrToken,
        }
      }
    });

    if (authError) {
      if (authError.message.includes('already registered')) {
        setErrorMsg('هذا البريد الإلكتروني مسجل مسبقاً.');
      } else {
        setErrorMsg('تأكد من صحة البيانات: ' + authError.message);
      }
      setLoading(false);
      return;
    }

    if (authData.user) {
      // If we have a follow id, try to auto follow
      if (followSellerId) {
        try {
          // Wait a bit to ensure the backend trigger created the profile
          await new Promise(r => setTimeout(r, 1000));
          await (supabase as any).rpc('follow_user', { target_user_id: followSellerId });
        } catch (e) {
          console.error('Failed to auto-follow:', e);
        }
      }
      
      navigate('/');
    }
    setLoading(false);
  };

  return (
    <div className="app-container" style={{ padding: '20px', overflowY: 'auto' }}>
      <div className="orb orb-red"></div>
      <div className="orb orb-blue"></div>
      
      <div style={{ zIndex: 10, textAlign: 'center', marginBottom: '20px', marginTop: '20px' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800 }}>إنشاء حساب جديد</h1>
        <p className="text-secondary">انضم إلى مجتمع كوورتي - Courtier</p>
      </div>

      <div className="glass-card" style={{ zIndex: 10, padding: '25px 20px' }}>
        {errorMsg && <div style={{ color: 'var(--color-accent)', marginBottom: '15px', textAlign: 'center', fontSize: '0.9rem' }}>{errorMsg}</div>}
        
        <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <div>
            <label style={labelStyle}>الاسم الكامل</label>
            <input type="text" {...register('full_name')} style={inputStyle} placeholder="الاسم الكامل" />
            {errors.full_name && <span style={errorStyle}>{errors.full_name.message}</span>}
          </div>

          <div>
            <label style={labelStyle}>رقم الهاتف</label>
            <input type="tel" {...register('phone_number')} style={inputStyle} placeholder="مثال: 0555123456" />
            {errors.phone_number && <span style={errorStyle}>{errors.phone_number.message}</span>}
          </div>

          <div>
            <label style={labelStyle}>البريد الإلكتروني</label>
            <input type="email" {...register('email')} style={inputStyle} placeholder="example@mail.com" />
            {errors.email && <span style={errorStyle}>{errors.email.message}</span>}
          </div>

          <div>
            <label style={labelStyle}>الولاية</label>
            <select {...register('wilaya')} style={inputStyle}>
              <option value="">اختر الولاية...</option>
              {WILAYAS.map(w => <option key={w} value={w} style={{ color: '#000' }}>{w}</option>)}
            </select>
            {errors.wilaya && <span style={errorStyle}>{errors.wilaya.message}</span>}
          </div>

          <div>
            <label style={labelStyle}>كلمة المرور</label>
            <div style={{ position: 'relative' }}>
              <input 
                type={showPassword ? "text" : "password"} 
                {...register('password')}
                style={{ ...inputStyle, paddingLeft: '40px' }}
                placeholder="********"
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={eyeBtnStyle}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            {errors.password && <span style={errorStyle}>{errors.password.message}</span>}
          </div>

          <div>
            <label style={labelStyle}>تأكيد كلمة المرور</label>
            <div style={{ position: 'relative' }}>
              <input 
                type={showConfirm ? "text" : "password"} 
                {...register('confirm_password')}
                style={{ ...inputStyle, paddingLeft: '40px' }}
                placeholder="********"
              />
              <button 
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                style={eyeBtnStyle}
              >
                {showConfirm ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            {errors.confirm_password && <span style={errorStyle}>{errors.confirm_password.message}</span>}
          </div>

          <button type="submit" className="primary-btn mt-4" disabled={loading}>
            {loading ? 'جاري إنشاء الحساب...' : 'إنشاء الحساب'} <UserPlus size={18} />
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '0.9rem' }}>
          <span className="text-secondary">لديك حساب بالفعل؟ </span>
          <Link to={`/login${location.search}`} style={{ color: 'var(--color-electric)', textDecoration: 'none', fontWeight: 'bold' }}>تسجيل الدخول</Link>
        </div>
      </div>
    </div>
  );
};

const labelStyle = { display: 'block', marginBottom: '5px', fontSize: '0.9rem' };
const inputStyle = {
  width: '100%', padding: '12px 15px', borderRadius: '10px',
  backgroundColor: 'rgba(255, 255, 255, 0.05)',
  border: '1px solid var(--color-glass-border)',
  color: '#fff', fontFamily: 'inherit', outline: 'none', fontSize: '1rem',
};
const eyeBtnStyle: any = {
  position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)',
  background: 'none', border: 'none', color: 'var(--color-text-secondary)', cursor: 'pointer'
};
const errorStyle = { color: 'var(--color-accent)', fontSize: '0.8rem', marginTop: '5px', display: 'block' };

export default RegisterScreen;
