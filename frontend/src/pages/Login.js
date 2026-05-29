import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../utils/api';
import { useGoogleLogin } from '@react-oauth/google';

const Login = ({ setUser }) => {
  const navigate = useNavigate();
  const [mode, setMode] = useState('login'); // 'login' | 'register' | 'forgot'
  const [step, setStep] = useState(1); // register: 1=details, 2=otp
  const [formData, setFormData] = useState({ name: '', email: '', password: '', otp: '' });
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const githubCodeProcessed = useRef(false);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    if (code && !githubCodeProcessed.current) {
      githubCodeProcessed.current = true;
      handleGithubCallback(code);
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const handleGithubCallback = async (code) => {
    setLoading(true);
    setError('');
    try {
      const response = await auth.githubLogin(code);
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      setUser(response.data.user);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'GitHub login failed');
    } finally {
      setLoading(false);
    }
  };

  const loginWithGithub = () => {
    window.location.href = `https://github.com/login/oauth/authorize?client_id=${process.env.REACT_APP_GITHUB_CLIENT_ID}&scope=user:email`;
  };

  const reset = (newMode) => {
    setMode(newMode);
    setStep(1);
    setError('');
    setMessage('');
    setFormData({ name: '', email: '', password: '', otp: '' });
  };

  const validatePassword = (password) => {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    if (password.length < minLength) return "Password must be at least 8 characters long";
    if (!hasUpperCase) return "Password must contain at least one uppercase letter";
    if (!hasLowerCase) return "Password must contain at least one lowercase letter";
    if (!hasNumber) return "Password must contain at least one number";
    if (!hasSpecialChar) return "Password must contain at least one special symbol (@, #, $, etc.)";
    
    return null;
  };

  const handleSendOTP = async () => {
    if (!formData.name || !formData.email || !formData.password) {
      setError('Please fill in all fields');
      return;
    }

    const passError = validatePassword(formData.password);
    if (passError) {
      setError(passError);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const response = await auth.sendOTP(formData.email);
      let msg = response.data?.message || `OTP sent to ${formData.email} — check your inbox`;
      if (response.data?.otp) msg += ` Your OTP is ${response.data.otp}.`;
      setMessage(msg);
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!formData.otp) { setError('Enter the OTP'); return; }
    setLoading(true);
    setError('');
    try {
      const response = await auth.register(formData);
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      setUser(response.data.user);
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const response = await auth.login({ email: formData.email, password: formData.password });
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      setUser(response.data.user);
    } catch (err) {
      if (!err.response) {
        setError('Network Error: Could not connect to the server');
      } else {
        setError(err.response?.data?.message || 'Invalid credentials');
      }
    } finally {
      setLoading(false);
    }
  };

  const loginWithGoogleCustom = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setLoading(true);
      setError('');
      try {
        const response = await auth.googleLogin({ access_token: tokenResponse.access_token });
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        setUser(response.data.user);
      } catch (err) {
        setError(err.response?.data?.message || 'Google login failed');
      } finally {
        setLoading(false);
      }
    },
    onError: () => setError('Google login failed'),
  });

  const handleForgot = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const response = await auth.forgotPassword(formData.email);
      let msg = response.data?.message || `OTP sent! Check your email.`;
      if (response.data?.otp) msg += ` Your OTP is ${response.data.otp}.`;
      setMessage(msg);
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    width: '100%', padding: '1rem', marginBottom: '1rem',
    background: '#f8fafc',
    border: '1px solid #e2e8f0', borderRadius: '12px', fontSize: '1rem',
    boxSizing: 'border-box', outline: 'none', transition: 'all 0.2s',
    fontFamily: 'inherit'
  };

  const focusInput = (e) => {
    e.currentTarget.style.borderColor = '#6366f1';
    e.currentTarget.style.boxShadow = '0 0 0 4px rgba(99, 102, 241, 0.1)';
    e.currentTarget.style.background = 'white';
  };

  const blurInput = (e) => {
    e.currentTarget.style.borderColor = '#e2e8f0';
    e.currentTarget.style.boxShadow = 'none';
    e.currentTarget.style.background = '#f8fafc';
  };

  const btnStyle = {
    width: '100%', padding: '1rem', background: 'linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)',
    color: 'white', border: 'none', borderRadius: '12px',
    cursor: loading ? 'not-allowed' : 'pointer', fontSize: '1rem', fontWeight: '700',
    opacity: loading ? 0.7 : 1, transition: 'all 0.2s',
    boxShadow: '0 10px 15px -3px rgba(79, 70, 229, 0.3)'
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      background: '#0f172a',
      position: 'relative',
      overflow: 'hidden',
      fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif"
    }}>
      {/* Dynamic background effects */}
      <div style={{ position: 'absolute', top: '-10%', left: '-10%', width: '500px', height: '500px', background: 'radial-gradient(circle, rgba(99, 102, 241, 0.15) 0%, transparent 70%)', filter: 'blur(80px)' }} />
      <div style={{ position: 'absolute', bottom: '-10%', right: '-10%', width: '500px', height: '500px', background: 'radial-gradient(circle, rgba(167, 139, 250, 0.1) 0%, transparent 70%)', filter: 'blur(80px)' }} />

      <div style={{ 
        background: 'rgba(255, 255, 255, 1)', 
        padding: '3rem', 
        borderRadius: '24px', 
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)', 
        width: '100%', 
        maxWidth: '460px', 
        boxSizing: 'border-box',
        position: 'relative',
        zIndex: 10
      }}>

        {/* Branding */}
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <div style={{ 
            width: '64px', height: '64px', background: 'linear-gradient(135deg, #6366f1 0%, #a78bfa 100%)', 
            borderRadius: '16px', margin: '0 auto 1.5rem', display: 'flex', alignItems: 'center', 
            justifyContent: 'center', fontSize: '2rem', boxShadow: '0 10px 20px -5px rgba(99, 102, 241, 0.5)'
          }}>
            🎓
          </div>
          <h2 style={{ margin: 0, color: '#1e293b', fontWeight: '900', fontSize: '1.75rem', letterSpacing: '-0.04em' }}>
            Vision<span style={{ color: '#6366f1' }}>Meet</span>
          </h2>
          <p style={{ color: '#64748b', margin: '0.5rem 0 0 0', fontSize: '0.95rem', fontWeight: '500' }}>
            {mode === 'login' && 'Sign in to your workspace'}
            {mode === 'register' && (step === 1 ? 'Join the community' : 'Verify your identity')}
            {mode === 'forgot' && 'Account recovery'}
          </p>
        </div>

        {error && (
          <div style={{ background: '#fef2f2', color: '#dc2626', padding: '1rem', borderRadius: '12px', marginBottom: '1.5rem', fontSize: '0.9rem', border: '1px solid #fee2e2', fontWeight: '600', textAlign: 'center' }}>
            ⚠️ {error}
          </div>
        )}
        {message && (
          <div style={{ background: '#f0fdf4', color: '#16a34a', padding: '1rem', borderRadius: '12px', marginBottom: '1.5rem', fontSize: '0.9rem', border: '1px solid #dcfce7', fontWeight: '600', textAlign: 'center' }}>
            ✅ {message}
          </div>
        )}

        {/* FORM MODES */}
        {mode === 'login' && (
          <>
            <form onSubmit={handleLogin}>
              <div style={{ marginBottom: '0.5rem', fontSize: '0.85rem', fontWeight: '700', color: '#64748b', marginLeft: '0.25rem' }}>EMAIL ADDRESS</div>
              <input type="email" placeholder="name@company.com" value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                onFocus={focusInput} onBlur={blurInput}
                style={inputStyle} required />
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', marginLeft: '0.25rem' }}>
                <div style={{ fontSize: '0.85rem', fontWeight: '700', color: '#64748b' }}>PASSWORD</div>
                <button type="button" onClick={() => reset('forgot')}
                  style={{ background: 'none', border: 'none', color: '#6366f1', cursor: 'pointer', fontSize: '0.85rem', fontWeight: '700' }}>
                  Forgot?
                </button>
              </div>
              <input type="password" placeholder="••••••••" value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                onFocus={focusInput} onBlur={blurInput}
                style={inputStyle} required />
              
              <button type="submit" style={btnStyle} disabled={loading}
                onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
                {loading ? 'Authenticating...' : 'Sign In'}
              </button>
            </form>

            <div style={{ display: 'flex', alignItems: 'center', textAlign: 'center', margin: '2rem 0', color: '#94a3b8' }}>
              <div style={{ flex: 1, borderBottom: '1px solid #f1f5f9' }}></div>
              <span style={{ padding: '0 1rem', fontSize: '0.8rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Social Login</span>
              <div style={{ flex: 1, borderBottom: '1px solid #f1f5f9' }}></div>
            </div>

            <div style={{ display: 'flex', gap: '1rem' }}>
              <button onClick={() => loginWithGoogleCustom()} style={{ flex: 1, height: '48px', background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', cursor: 'pointer', transition: 'all 0.2s', fontWeight: '600', color: '#475569' }} onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'} onMouseLeave={e => e.currentTarget.style.background = 'white'}>
                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="G" style={{ width: '18px' }} /> Google
              </button>
              <button onClick={loginWithGithub} style={{ flex: 1, height: '48px', background: '#1e293b', border: 'none', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', cursor: 'pointer', transition: 'all 0.2s', fontWeight: '600', color: 'white' }} onMouseEnter={e => e.currentTarget.style.background = '#0f172a'} onMouseLeave={e => e.currentTarget.style.background = '#1e293b'}>
                <svg height="18" width="18" viewBox="0 0 16 16" fill="white"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"></path></svg> GitHub
              </button>
            </div>

            <p style={{ textAlign: 'center', marginTop: '2.5rem', color: '#64748b', fontSize: '0.95rem', fontWeight: '500' }}>
              New to VisionMeet?{' '}
              <button type="button" onClick={() => reset('register')}
                style={{ background: 'none', border: 'none', color: '#6366f1', cursor: 'pointer', fontWeight: '800' }}>
                Create an account
              </button>
            </p>
          </>
        )}

        {/* REGISTER */}
        {mode === 'register' && step === 1 && (
          <div>
            <div style={{ marginBottom: '0.5rem', fontSize: '0.85rem', fontWeight: '700', color: '#64748b', marginLeft: '0.25rem' }}>FULL NAME</div>
            <input type="text" placeholder="John Doe" value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              onFocus={focusInput} onBlur={blurInput}
              style={inputStyle} />

            <div style={{ marginBottom: '0.5rem', fontSize: '0.85rem', fontWeight: '700', color: '#64748b', marginLeft: '0.25rem' }}>EMAIL ADDRESS</div>
            <input type="email" placeholder="name@company.com" value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              onFocus={focusInput} onBlur={blurInput}
              style={inputStyle} />

            <div style={{ marginBottom: '0.5rem', fontSize: '0.85rem', fontWeight: '700', color: '#64748b', marginLeft: '0.25rem' }}>PASSWORD</div>
            <input type="password" placeholder="••••••••" value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              onFocus={focusInput} onBlur={blurInput}
              style={inputStyle} />
            
            {formData.password && (
              <div style={{ marginBottom: '1.5rem', padding: '1rem', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: '800', color: '#94a3b8', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Security Checklist</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                  {[
                    { label: '8+ Characters', met: formData.password.length >= 8 },
                    { label: 'Uppercase', met: /[A-Z]/.test(formData.password) },
                    { label: 'Lowercase', met: /[a-z]/.test(formData.password) },
                    { label: 'Number', met: /[0-9]/.test(formData.password) },
                    { label: 'Special Symbol', met: /[!@#$%^&*(),.?":{}|<>]/.test(formData.password) }
                  ].map((req, i) => (
                    <div key={i} style={{ 
                      fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '6px',
                      color: req.met ? '#10b981' : '#94a3b8', fontWeight: '700'
                    }}>
                      <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: req.met ? '#10b981' : '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '8px', color: 'white' }}>{req.met && '✓'}</div>
                      {req.label}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button onClick={handleSendOTP} style={btnStyle} disabled={loading}>
              {loading ? 'Processing...' : 'Create Account'}
            </button>

            <p style={{ textAlign: 'center', marginTop: '2rem', color: '#64748b', fontSize: '0.95rem', fontWeight: '500' }}>
              Already have an account?{' '}
              <button type="button" onClick={() => reset('login')}
                style={{ background: 'none', border: 'none', color: '#6366f1', cursor: 'pointer', fontWeight: '800' }}>
                Sign in
              </button>
            </p>
          </div>
        )}

        {/* OTP VERIFICATION */}
        {step === 2 && (
          <form onSubmit={mode === 'register' ? handleRegister : (e) => {
            e.preventDefault();
            if (formData.otp.length === 6) {
              navigate('/reset-password', { state: { email: formData.email, otp: formData.otp } });
            } else {
              setError("Please enter a valid 6-digit OTP");
            }
          }}>
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
              <div style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>📬</div>
              <p style={{ color: '#64748b', fontSize: '1rem', fontWeight: '500', lineHeight: 1.5 }}>
                We've sent a code to<br />
                <strong style={{ color: '#1e293b' }}>{formData.email}</strong>
              </p>
            </div>
            <input
              type="text"
              placeholder="0 0 0 0 0 0"
              value={formData.otp}
              onChange={(e) => setFormData({ ...formData, otp: e.target.value.replace(/\D/g, '').slice(0, 6) })}
              onFocus={focusInput} onBlur={blurInput}
              style={{ ...inputStyle, textAlign: 'center', fontSize: '1.75rem', letterSpacing: '0.5rem', fontWeight: '900', color: '#6366f1' }}
              maxLength="6"
              required
            />
            <button type="submit" style={btnStyle} disabled={loading}>
              {loading ? 'Verifying...' : 'Complete Verification'}
            </button>
            <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.9rem', color: '#64748b', fontWeight: '600' }}>
              Didn't get the code?{' '}
              <button type="button" onClick={mode === 'register' ? handleSendOTP : handleForgot} disabled={loading}
                style={{ background: 'none', border: 'none', color: '#6366f1', cursor: 'pointer', fontWeight: '800' }}>
                Resend
              </button>
            </div>
          </form>
        )}

        {/* FORGOT PASSWORD */}
        {mode === 'forgot' && step === 1 && (
          <form onSubmit={handleForgot}>
            <div style={{ marginBottom: '0.5rem', fontSize: '0.85rem', fontWeight: '700', color: '#64748b', marginLeft: '0.25rem' }}>EMAIL ADDRESS</div>
            <input type="email" placeholder="name@company.com" value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              onFocus={focusInput} onBlur={blurInput}
              style={inputStyle} required />
            <button type="submit" style={btnStyle} disabled={loading}>
              {loading ? 'Sending Code...' : 'Reset Password'}
            </button>
            <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
              <button type="button" onClick={() => reset('login')}
                style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '0.9rem', fontWeight: '700' }}>
                ← Back to sign in
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default Login;
