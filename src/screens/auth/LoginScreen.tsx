import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { Eye, EyeOff, LogIn } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { loginSchema, LoginForm } from '../../utils/validators';

const LoginScreen = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const followSellerId = queryParams.get('follow');
  
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    setLoading(true);
    setErrorMsg('');
    const { error } = await supabase.auth.signInWithPassword({
      email: data.email.trim(),
      password: data.password,
    });

    if (error) {
      console.error('Login Error details:', error);
      if (error.message === 'Invalid login credentials') {
        setErrorMsg('البريد الإلكتروني أو كلمة المرور غير صحيحة.');
      } else if (error.message.includes('Email not confirmed')) {
        setErrorMsg('يرجى تأكيد بريدك الإلكتروني أولاً (راجع صندوق الوارد).');
      } else {
        setErrorMsg('خطأ: ' + error.message);
      }
    } else {
      if (followSellerId) {
        try {
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
    <div className="app-container" style={{ padding: '20px', justifyContent: 'center' }}>
      <div className="orb orb-red"></div>
      <div className="orb orb-blue"></div>
      
      <div style={{ zIndex: 10, textAlign: 'center', marginBottom: '30px' }}>
        <div className="logo-icon" style={{ margin: '0 auto 10px auto', width: '60px', height: '60px', fontSize: '30px' }}>🤝</div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800 }}>COURTIER</h1>
        <p className="text-secondary">كوورتي - وسيطك الموثوق</p>
      </div>

      <div className="glass-card" style={{ zIndex: 10 }}>
        {errorMsg && <div style={{ color: 'var(--color-accent)', marginBottom: '15px', textAlign: 'center', fontSize: '0.9rem' }}>{errorMsg}</div>}
        
        <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.9rem' }}>البريد الإلكتروني</label>
            <input 
              type="email" 
              {...register('email')}
              style={inputStyle}
              placeholder="example@mail.com"
            />
            {errors.email && <span style={errorStyle}>{errors.email.message}</span>}
          </div>

          <div style={{ position: 'relative' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.9rem' }}>كلمة المرور</label>
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
                style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--color-text-secondary)', cursor: 'pointer' }}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            {errors.password && <span style={errorStyle}>{errors.password.message}</span>}
          </div>

          <button type="submit" className="primary-btn mt-4" disabled={loading}>
            {loading ? 'جاري الدخول...' : 'تسجيل الدخول'} <LogIn size={18} />
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '0.9rem' }}>
          <span className="text-secondary">ليس لديك حساب؟ </span>
          <Link to={`/register${location.search}`} style={{ color: 'var(--color-electric)', textDecoration: 'none', fontWeight: 'bold' }}>سجل الآن</Link>
        </div>
      </div>
    </div>
  );
};

const inputStyle = {
  width: '100%',
  padding: '12px 15px',
  borderRadius: '10px',
  backgroundColor: 'rgba(255, 255, 255, 0.05)',
  border: '1px solid var(--color-glass-border)',
  color: '#fff',
  fontFamily: 'inherit',
  outline: 'none',
  fontSize: '1rem',
};

const errorStyle = {
  color: 'var(--color-accent)',
  fontSize: '0.8rem',
  marginTop: '5px',
  display: 'block'
};

export default LoginScreen;
