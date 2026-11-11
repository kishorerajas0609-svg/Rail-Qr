import React, { useState } from 'react';
import { 
  UserPlus, 
  Train, 
  Mail, 
  Lock, 
  User, 
  Phone, 
  AlertCircle, 
  ArrowRight, 
  ArrowLeft,
  CheckCircle2,
  Eye,
  EyeOff
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Register({ navigate }) {
  const { register } = useAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [berthPreference, setBerthPreference] = useState('Window');
  const [idProofType, setIdProofType] = useState('Aadhaar');
  const [role, setRole] = useState('passenger');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleRegister = async (e) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      const registeredUser = await register({
        full_name: fullName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        password,
        role: role
      });
      if (registeredUser.role === 'admin') {
        navigate('admin-dashboard');
      } else if (registeredUser.role === 'staff') {
        navigate('scanner');
      } else {
        navigate('home');
      }
    } catch (err) {
      setError(err.message || 'Registration failed. Email might already be registered.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '520px', margin: '2.5rem auto' }}>
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
            <UserPlus size={28} />
          </div>
          <h1 style={{ fontSize: '1.65rem', fontWeight: 800 }}>Create Passenger Account</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.35rem' }}>
            Book verifiable digital train tickets and manage your journeys
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

        {/* Registration Form */}
        <form onSubmit={handleRegister}>
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                className="form-input"
                required
                placeholder="e.g. Deepika Sharma"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                style={{ width: '100%', paddingLeft: '2.5rem' }}
              />
              <User 
                size={16} 
                color="var(--text-muted)" 
                style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)' }} 
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Account Role</label>
            <select
              className="form-select"
              value={role}
              onChange={e => setRole(e.target.value)}
              style={{ width: '100%' }}
            >
              <option value="passenger">Passenger (Book Tickets & Digital QR Passes)</option>
              <option value="staff">Railway Staff / TTE (Field Scanner & Manifest)</option>
              <option value="admin">Chief Railway Admin (Full Authority: TTR, Passengers, Database, Ledger)</option>
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
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
                />
                <Mail 
                  size={16} 
                  color="var(--text-muted)" 
                  style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)' }} 
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Mobile Number</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="tel"
                  className="form-input"
                  placeholder="9876543210"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  style={{ width: '100%', paddingLeft: '2.5rem' }}
                />
                <Phone 
                  size={16} 
                  color="var(--text-muted)" 
                  style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)' }} 
                />
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Berth Preference</label>
              <select
                className="form-select"
                value={berthPreference}
                onChange={e => setBerthPreference(e.target.value)}
              >
                <option value="Window">Window</option>
                <option value="Lower">Lower</option>
                <option value="Middle">Middle</option>
                <option value="Upper">Upper</option>
                <option value="Side Lower">Side Lower</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">ID Proof Type</label>
              <select
                className="form-select"
                value={idProofType}
                onChange={e => setIdProofType(e.target.value)}
              >
                <option value="Aadhaar">Aadhaar Card</option>
                <option value="Passport">Passport</option>
                <option value="Voter ID">Voter ID</option>
                <option value="PAN Card">PAN Card</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="form-input"
                  required
                  placeholder="Min 6 characters"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  style={{ width: '100%', paddingLeft: '2.5rem' }}
                />
                <Lock 
                  size={16} 
                  color="var(--text-muted)" 
                  style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)' }} 
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Confirm Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="form-input"
                  required
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  style={{ width: '100%', paddingLeft: '2.5rem' }}
                />
                <Lock 
                  size={16} 
                  color="var(--text-muted)" 
                  style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)' }} 
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-lg"
            style={{ width: '100%', marginTop: '1rem' }}
            disabled={loading}
          >
            {loading ? 'Creating Account...' : <><UserPlus size={18} /> Register Account</>}
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
          Already have an account?{' '}
          <span 
            onClick={() => navigate('login')} 
            style={{ color: 'var(--rail-cyan)', fontWeight: 600, cursor: 'pointer' }}
          >
            Sign in
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
