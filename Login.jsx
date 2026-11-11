import React, { useState } from 'react';
import { 
  LogIn, 
  Train, 
  Lock, 
  Mail, 
  AlertCircle, 
  ArrowRight, 
  Eye, 
  EyeOff, 
  ArrowLeft
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Login({ navigate }) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const user = await login(email.trim(), password);
      if (user.role === 'staff') {
        navigate('scanner');
      } else if (user.role === 'admin') {
        navigate('admin-dashboard');
      } else {
        navigate('home');
      }
    } catch (err) {
      setError(err.message || 'Invalid email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '440px', margin: '3rem auto' }}>
      <div className="glass-card" style={{ padding: '2.5rem', border: '1px solid var(--border-glass)', boxShadow: 'var(--shadow-lg)' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            width: '56px',
            height: '56px',
            borderRadius: '1rem',
            background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            margin: '0 auto 1.25rem',
            boxShadow: '0 6px 18px rgba(2, 132, 199, 0.4)'
          }}>
            <Train size={30} />
          </div>
          <h1 style={{ fontSize: '1.65rem', fontWeight: 800 }}>Sign In</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.35rem' }}>
            Enter your credentials to access your Smart Rail account
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.4)',
            color: '#f87171',
            borderRadius: '0.625rem',
            padding: '0.75rem 1rem',
            fontSize: '0.875rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            marginBottom: '1.5rem'
          }}>
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}



        {/* Login Form */}
        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <div style={{ position: 'relative' }}>
              <input
                type="email"
                className="form-input"
                required
                placeholder="name@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                style={{ width: '100%', paddingLeft: '2.5rem' }}
                autoComplete="email"
              />
              <Mail 
                size={16} 
                color="var(--text-muted)" 
                style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)' }} 
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                className="form-input"
                required
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                style={{ width: '100%', paddingLeft: '2.5rem', paddingRight: '2.5rem' }}
                autoComplete="current-password"
              />
              <Lock 
                size={16} 
                color="var(--text-muted)" 
                style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)' }} 
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '0.85rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-lg"
            style={{ width: '100%', marginTop: '1rem' }}
            disabled={loading}
          >
            {loading ? 'Signing in...' : <><LogIn size={18} /> Sign In</>}
          </button>
        </form>

        {/* Footer Links */}
        <div style={{
          textAlign: 'center',
          marginTop: '2rem',
          paddingTop: '1.25rem',
          borderTop: '1px solid var(--border-card)',
          fontSize: '0.875rem',
          color: 'var(--text-secondary)'
        }}>
          Don't have an account?{' '}
          <span 
            onClick={() => navigate('register')} 
            style={{ color: 'var(--rail-cyan)', fontWeight: 600, cursor: 'pointer' }}
          >
            Create one now
          </span>
        </div>

        <div style={{ textAlign: 'center', marginTop: '1rem' }}>
          <button
            type="button"
            onClick={() => navigate('intro')}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              fontSize: '0.8rem',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem'
            }}
          >
            <ArrowLeft size={14} /> Back to Home Page
          </button>
        </div>
      </div>
    </div>
  );
}
