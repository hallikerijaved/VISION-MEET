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
      // Clear code from URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    width: '100%', padding: '0.75rem', marginBottom: '1rem',
    border: '1px solid #ddd', borderRadius: '6px', fontSize: '1rem',
    boxSizing: 'border-box'
  };

  const btnStyle = {
    width: '100%', padding: '0.75rem', background: '#007bff',
    color: 'white', border: 'none', borderRadius: '6px',
    cursor: loading ? 'not-allowed' : 'pointer', fontSize: '1rem',
    opacity: loading ? 0.7 : 1
  };

  const dividerStyle = {
    display: 'flex', alignItems: 'center', textAlign: 'center', margin: '1.5rem 0', color: '#888'
  };
  const lineStyle = { flex: 1, borderBottom: '1px solid #ddd' };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
      <div style={{ background: 'white', padding: '2.5rem', borderRadius: '12px', boxShadow: '0 8px 32px rgba(0,0,0,0.2)', width: '100%', maxWidth: '420px', boxSizing: 'border-box' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🎓</div>
          <h2 style={{ margin: 0, color: '#333', fontWeight: '800' }}>VISION MEET</h2>
          <p style={{ color: '#666', margin: '0.5rem 0 0 0', fontSize: '0.9rem' }}>
            {mode === 'login' && 'Welcome back!'}
            {mode === 'register' && (step === 1 ? 'Create your account' : 'Verify your email')}
            {mode === 'forgot' && 'Reset your password'}
          </p>
        </div>

        {error && (
          <div style={{ background: '#f8d7da', color: '#721c24', padding: '0.75rem', borderRadius: '6px', marginBottom: '1rem', fontSize: '0.9rem', textAlign: 'center' }}>
            ❌ {error}
          </div>
        )}
        {message && (
          <div style={{ background: '#d4edda', color: '#155724', padding: '0.75rem', borderRadius: '6px', marginBottom: '1rem', fontSize: '0.9rem', textAlign: 'center' }}>
            ✅ {message}
          </div>
        )}

        {/* LOGIN */}
        {mode === 'login' && (
          <>
            <form onSubmit={handleLogin}>
              <input type="email" placeholder="Email address" value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                style={inputStyle} required />
              <input type="password" placeholder="Password" value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                style={inputStyle} required />
              <button type="submit" style={btnStyle} disabled={loading}>
                {loading ? 'Logging in...' : 'Login'}
              </button>

              <div style={{ textAlign: 'center', marginTop: '1rem' }}>
                <button type="button" onClick={() => reset('forgot')}
                  style={{ background: 'none', border: 'none', color: '#dc3545', cursor: 'pointer', fontSize: '0.9rem' }}>
                  Forgot Password?
                </button>
              </div>
            </form>

            <div style={dividerStyle}>
              <div style={lineStyle}></div>
              <span style={{ padding: '0 10px', fontSize: '0.9rem' }}>or continue with</span>
              <div style={lineStyle}></div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'row', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button 
                type="button" 
                onClick={() => loginWithGoogleCustom()}
                style={{ 
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  background: '#ffffff', color: '#3c4043', border: '1px solid #dadce0', 
                  borderRadius: '4px', padding: '0', cursor: 'pointer',
                  fontSize: '14px', fontWeight: '500', height: '40px',
                  width: '165px', fontFamily: 'Roboto, sans-serif',
                  boxShadow: '0 1px 2px 0 rgba(60,64,67,0.3)',
                  transition: 'background-color .218s, border-color .218s, box-shadow .218s'
                }}
                onMouseOver={(e) => { e.currentTarget.style.background = '#f8f9fa'; e.currentTarget.style.boxShadow = '0 1px 3px 1px rgba(60,64,67,0.15), 0 1px 2px 0 rgba(60,64,67,0.3)'; }}
                onMouseOut={(e) => { e.currentTarget.style.background = '#ffffff'; e.currentTarget.style.boxShadow = '0 1px 2px 0 rgba(60,64,67,0.3)'; }}
              >
                <svg version="1.1" xmlns="http://www.w3.org/2000/svg" width="18px" height="18px" viewBox="0 0 48 48" className="abcRioButtonSvg">
                  <g><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path><path fill="none" d="M0 0h48v48H0z"></path></g>
                </svg>
                Google
              </button>
              <button 
                type="button" 
                onClick={loginWithGithub}
                style={{ 
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  background: '#24292e', color: 'white', border: 'none', 
                  borderRadius: '4px', padding: '0', cursor: 'pointer',
                  fontSize: '14px', fontWeight: '500', height: '40px',
                  width: '165px', fontFamily: 'Roboto, sans-serif',
                  boxShadow: '0 2px 4px 0 rgba(0,0,0,.25)',
                  transition: 'background-color .218s, border-color .218s, box-shadow .218s'
                }}
                onMouseOver={(e) => e.currentTarget.style.background = '#1b1f23'}
                onMouseOut={(e) => e.currentTarget.style.background = '#24292e'}
              >
                <svg height="18" width="18" viewBox="0 0 16 16" fill="white">
                  <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"></path>
                </svg>
                GitHub
              </button>
            </div>

            <div style={{ textAlign: 'center', marginTop: '1.5rem', color: '#666', fontSize: '0.9rem' }}>
              Don't have an account?{' '}
              <button type="button" onClick={() => reset('register')}
                style={{ background: 'none', border: 'none', color: '#007bff', cursor: 'pointer', fontWeight: 'bold' }}>
                Register
              </button>
            </div>
          </>
        )}

        {/* REGISTER - Step 1: Fill details */}
        {mode === 'register' && step === 1 && (
          <div>
            <input type="text" placeholder="Full Name" value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              style={inputStyle} />
            <input type="email" placeholder="Email address" value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              style={inputStyle} />
            <input type="password" placeholder="Password" value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              style={inputStyle} />
            
            {/* Password Requirements Checklist */}
            {mode === 'register' && formData.password && (
              <div style={{ marginBottom: '1.5rem', padding: '0.8rem', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: '700', color: '#64748b', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Password Strength</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem' }}>
                  {[
                    { label: '8+ Characters', met: formData.password.length >= 8 },
                    { label: 'Uppercase', met: /[A-Z]/.test(formData.password) },
                    { label: 'Lowercase', met: /[a-z]/.test(formData.password) },
                    { label: 'Number', met: /[0-9]/.test(formData.password) },
                    { label: 'Special Symbol', met: /[!@#$%^&*(),.?":{}|<>]/.test(formData.password) }
                  ].map((req, i) => (
                    <div key={i} style={{ 
                      fontSize: '0.75rem', 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '4px',
                      color: req.met ? '#10b981' : '#94a3b8',
                      fontWeight: req.met ? '600' : '400',
                      transition: 'all 0.2s'
                    }}>
                      {req.met ? '✓' : '○'} {req.label}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button onClick={handleSendOTP} style={btnStyle} disabled={loading}>
              {loading ? 'Sending OTP...' : '📧 Send OTP to Email'}
            </button>

            <div style={dividerStyle}>
              <div style={lineStyle}></div>
              <span style={{ padding: '0 10px', fontSize: '0.9rem' }}>or continue with</span>
              <div style={lineStyle}></div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'row', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button 
                type="button" 
                onClick={() => loginWithGoogleCustom()}
                style={{ 
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  background: '#ffffff', color: '#3c4043', border: '1px solid #dadce0', 
                  borderRadius: '4px', padding: '0', cursor: 'pointer',
                  fontSize: '14px', fontWeight: '500', height: '40px',
                  width: '165px', fontFamily: 'Roboto, sans-serif',
                  boxShadow: '0 1px 2px 0 rgba(60,64,67,0.3)',
                  transition: 'background-color .218s, border-color .218s, box-shadow .218s'
                }}
                onMouseOver={(e) => { e.currentTarget.style.background = '#f8f9fa'; e.currentTarget.style.boxShadow = '0 1px 3px 1px rgba(60,64,67,0.15), 0 1px 2px 0 rgba(60,64,67,0.3)'; }}
                onMouseOut={(e) => { e.currentTarget.style.background = '#ffffff'; e.currentTarget.style.boxShadow = '0 1px 2px 0 rgba(60,64,67,0.3)'; }}
              >
                <svg version="1.1" xmlns="http://www.w3.org/2000/svg" width="18px" height="18px" viewBox="0 0 48 48" className="abcRioButtonSvg">
                  <g><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path><path fill="none" d="M0 0h48v48H0z"></path></g>
                </svg>
                Google
              </button>
              <button 
                type="button" 
                onClick={loginWithGithub}
                style={{ 
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  background: '#24292e', color: 'white', border: 'none', 
                  borderRadius: '4px', padding: '0', cursor: 'pointer',
                  fontSize: '14px', fontWeight: '500', height: '40px',
                  width: '165px', fontFamily: 'Roboto, sans-serif',
                  boxShadow: '0 2px 4px 0 rgba(0,0,0,.25)',
                  transition: 'background-color .218s, border-color .218s, box-shadow .218s'
                }}
                onMouseOver={(e) => e.currentTarget.style.background = '#1b1f23'}
                onMouseOut={(e) => e.currentTarget.style.background = '#24292e'}
              >
                <svg height="18" width="18" viewBox="0 0 16 16" fill="white">
                  <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"></path>
                </svg>
                GitHub
              </button>
            </div>

            <div style={{ textAlign: 'center', marginTop: '1.5rem', color: '#666', fontSize: '0.9rem' }}>
              Already have an account?{' '}
              <button type="button" onClick={() => reset('login')}
                style={{ background: 'none', border: 'none', color: '#007bff', cursor: 'pointer', fontWeight: 'bold' }}>
                Login
              </button>
            </div>
          </div>
        )}

        {/* REGISTER - Step 2: Enter OTP */}
        {mode === 'register' && step === 2 && (
          <form onSubmit={handleRegister}>
            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <div style={{ fontSize: '3rem' }}>📬</div>
              <p style={{ color: '#555', margin: '0.5rem 0 0 0' }}>
                We sent a 6-digit OTP to<br />
                <strong style={{ color: '#007bff' }}>{formData.email}</strong>
              </p>
            </div>
            <input
              type="text"
              placeholder="Enter 6-digit OTP"
              value={formData.otp}
              onChange={(e) => setFormData({ ...formData, otp: e.target.value.replace(/\D/g, '').slice(0, 6) })}
              style={{ ...inputStyle, textAlign: 'center', fontSize: '1.5rem', letterSpacing: '0.5rem', fontWeight: 'bold' }}
              maxLength="6"
              required
            />
            <button type="submit" style={btnStyle} disabled={loading}>
              {loading ? 'Verifying...' : '✅ Verify & Register'}
            </button>
            <div style={{ textAlign: 'center', marginTop: '1rem' }}>
              <button type="button" onClick={handleSendOTP} disabled={loading}
                style={{ background: 'none', border: 'none', color: '#007bff', cursor: 'pointer', fontSize: '0.9rem' }}>
                Resend OTP
              </button>
              {' · '}
              <button type="button" onClick={() => { setStep(1); setError(''); setMessage(''); }}
                style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer', fontSize: '0.9rem' }}>
                Change Email
              </button>
            </div>
          </form>
        )}

        {/* FORGOT PASSWORD - Step 1: Request OTP */}
        {mode === 'forgot' && step === 1 && (
          <form onSubmit={handleForgot}>
            <input type="email" placeholder="Enter your email" value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              style={inputStyle} required />
            <button type="submit" style={btnStyle} disabled={loading}>
              {loading ? 'Sending OTP...' : '📧 Send Reset OTP'}
            </button>
            <div style={{ textAlign: 'center', marginTop: '1rem' }}>
              <button type="button" onClick={() => reset('login')}
                style={{ background: 'none', border: 'none', color: '#007bff', cursor: 'pointer', fontSize: '0.9rem' }}>
                ← Back to Login
              </button>
            </div>
          </form>
        )}

        {/* FORGOT PASSWORD - Step 2: Enter OTP */}
        {mode === 'forgot' && step === 2 && (
          <form onSubmit={(e) => {
            e.preventDefault();
            if (formData.otp.length === 6) {
              navigate('/reset-password', { state: { email: formData.email, otp: formData.otp } });
            } else {
              setError("Please enter a valid 6-digit OTP");
            }
          }}>
            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <div style={{ fontSize: '3rem' }}>🔐</div>
              <p style={{ color: '#555', margin: '0.5rem 0 0 0' }}>
                We sent a 6-digit OTP for password reset to<br />
                <strong style={{ color: '#007bff' }}>{formData.email}</strong>
              </p>
            </div>
            <input
              type="text"
              placeholder="Enter 6-digit OTP"
              value={formData.otp}
              onChange={(e) => setFormData({ ...formData, otp: e.target.value.replace(/\D/g, '').slice(0, 6) })}
              style={{ ...inputStyle, textAlign: 'center', fontSize: '1.5rem', letterSpacing: '0.5rem', fontWeight: 'bold' }}
              maxLength="6"
              required
            />
            <button type="submit" style={btnStyle}>
              ✅ Verify OTP & Proceed
            </button>
            <div style={{ textAlign: 'center', marginTop: '1rem' }}>
              <button type="button" onClick={handleForgot} disabled={loading}
                style={{ background: 'none', border: 'none', color: '#007bff', cursor: 'pointer', fontSize: '0.9rem' }}>
                Resend OTP
              </button>
              {' · '}
              <button type="button" onClick={() => { setStep(1); setError(''); setMessage(''); }}
                style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer', fontSize: '0.9rem' }}>
                Change Email
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default Login;
