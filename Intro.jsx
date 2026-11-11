import React, { useState, useEffect } from 'react';
import { 
  Train, 
  Search, 
  ShieldCheck, 
  QrCode, 
  AlertTriangle, 
  Users, 
  ArrowRight, 
  Sparkles,
  Zap,
  CheckCircle2,
  Lock,
  Compass,
  MapPin,
  Clock,
  Layers,
  ChevronRight,
  UserCheck
} from 'lucide-react';
import { api } from '../services/api';
import PnrTracker from '../components/PnrTracker';

export default function Intro({ navigate, onSearchTrains, onSelectReservation }) {
  const [stations, setStations] = useState([]);
  const [sourceCode, setSourceCode] = useState('NDLS');
  const [destCode, setDestCode] = useState('BPL');
  const [journeyDate, setJourneyDate] = useState(() => {
    const d = new Date();
    return d.toISOString().split('T')[0];
  });
  const [travelClass, setTravelClass] = useState('CC');
  const [quota, setQuota] = useState('General');

  useEffect(() => {
    api.getStations().then(data => {
      setStations(data);
    }).catch(err => console.error('Failed to load stations', err));
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (onSearchTrains) {
      onSearchTrains({ sourceCode, destCode, journeyDate, travelClass, quota });
    }
    navigate('search');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>
      {/* 1. Hero Section */}
      <div style={{
        position: 'relative',
        borderRadius: '1.5rem',
        padding: '4rem 2.5rem',
        background: 'linear-gradient(135deg, rgba(2, 132, 199, 0.22) 0%, rgba(99, 102, 241, 0.15) 50%, rgba(13, 23, 48, 0.95) 100%)',
        border: '1px solid var(--border-glass)',
        boxShadow: 'var(--shadow-lg)',
        overflow: 'hidden'
      }}>
        {/* Glow orb */}
        <div style={{
          position: 'absolute',
          top: '-20%',
          right: '-10%',
          width: '520px',
          height: '520px',
          background: 'radial-gradient(circle, rgba(56, 189, 248, 0.18) 0%, transparent 70%)',
          borderRadius: '50%',
          pointerEvents: 'none'
        }} />

        <div style={{ maxWidth: '820px', position: 'relative', zIndex: 2 }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            background: 'rgba(56, 189, 248, 0.15)',
            border: '1px solid rgba(56, 189, 248, 0.3)',
            padding: '0.4rem 1rem',
            borderRadius: '9999px',
            fontSize: '0.85rem',
            fontWeight: 700,
            color: 'var(--rail-cyan)',
            marginBottom: '1.5rem'
          }}>
            <Sparkles size={16} /> Intelligent Railway Ticket Verification & Transit Management
          </div>

          <h1 style={{
            fontSize: 'clamp(2.4rem, 5.5vw, 3.8rem)',
            fontWeight: 800,
            lineHeight: 1.15,
            marginBottom: '1.25rem',
            letterSpacing: '-0.03em'
          }}>
            Every Ticket Is A Secure <br />
            <span style={{
              background: 'linear-gradient(90deg, #38bdf8 0%, #00f2fe 50%, #818cf8 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              Digital QR Identity.
            </span>
          </h1>

          <p style={{
            fontSize: '1.15rem',
            color: 'var(--text-secondary)',
            lineHeight: 1.6,
            marginBottom: '2.25rem',
            maxWidth: '720px'
          }}>
            Next-generation digital railway transit with cryptographic HMAC-SHA256 signed QR passes, instant TTE camera verification, live duplicate scan fraud detection, and real-time passenger manifests.
          </p>

          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <button className="btn btn-primary btn-lg" onClick={() => navigate('login')}>
              Sign In to Transit Hub <ArrowRight size={18} />
            </button>
            <button className="btn btn-secondary btn-lg" onClick={() => navigate('register')}>
              Create Passenger Account
            </button>
            <button className="btn btn-secondary btn-lg" onClick={() => navigate('search')}>
              <Search size={18} /> Search Trains
            </button>
          </div>
        </div>
      </div>

      {/* 2. Live PNR Status & Pass Lookup Widget */}
      <div>
        <PnrTracker onSelectReservation={onSelectReservation} navigate={navigate} />
      </div>

      {/* 3. Train Search & Availability Widget */}
      <div className="glass-card" style={{ border: '1px solid var(--border-glass)', padding: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '1.5rem' }}>
          <div style={{
            width: '38px',
            height: '38px',
            borderRadius: '0.55rem',
            background: 'rgba(2, 132, 199, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--rail-cyan)'
          }}>
            <Train size={22} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 800 }}>Search Trains & Check Live Availability</h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Explore train schedules, route stations, and reserve cryptographic digital passes
            </p>
          </div>
        </div>

        <form onSubmit={handleSearch}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '1.25rem',
            alignItems: 'flex-end'
          }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">From Station</label>
              <select 
                className="form-select" 
                value={sourceCode} 
                onChange={e => setSourceCode(e.target.value)}
              >
                {stations.map(s => (
                  <option key={s.id} value={s.code}>
                    {s.city} ({s.code}) - {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">To Station</label>
              <select 
                className="form-select" 
                value={destCode} 
                onChange={e => setDestCode(e.target.value)}
              >
                {stations.map(s => (
                  <option key={s.id} value={s.code}>
                    {s.city} ({s.code}) - {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Journey Date</label>
              <input 
                type="date" 
                className="form-input" 
                value={journeyDate} 
                onChange={e => setJourneyDate(e.target.value)}
              />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Class</label>
              <select 
                className="form-select" 
                value={travelClass} 
                onChange={e => setTravelClass(e.target.value)}
              >
                <option value="ALL">All Classes</option>
                <option value="EC">Executive Chair Car (EC)</option>
                <option value="CC">AC Chair Car (CC)</option>
                <option value="1A">AC First Class (1A)</option>
                <option value="2A">AC 2 Tier (2A)</option>
                <option value="3A">AC 3 Tier (3A)</option>
                <option value="SL">Sleeper (SL)</option>
              </select>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Quota</label>
              <select 
                className="form-select" 
                value={quota} 
                onChange={e => setQuota(e.target.value)}
              >
                <option value="General">General</option>
                <option value="Tatkal">Tatkal</option>
                <option value="Ladies">Ladies</option>
                <option value="Senior Citizen">Senior Citizen</option>
              </select>
            </div>

            <div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%', height: '46px' }}>
                <Search size={18} /> Find Trains
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* 4. How It Works: 3 Simple Steps */}
      <div>
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <h2 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.5rem' }}>
            How Smart Rail QR Works
          </h2>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '600px', margin: '0 auto' }}>
            A fast, three-step cryptographic flow ensuring complete safety and zero ticket forgery.
          </p>
        </div>

        <div className="grid-3">
          <div className="glass-card" style={{ padding: '2rem', textAlign: 'center' }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              background: 'rgba(2, 132, 199, 0.15)',
              color: 'var(--rail-cyan)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.25rem',
              fontWeight: 800,
              fontSize: '1.25rem'
            }}>
              1
            </div>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem', fontWeight: 700 }}>
              Book & Generate QR Pass
            </h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              Select your train and seats. The central railway server generates an HMAC-SHA256 cryptographically signed digital QR token.
            </p>
          </div>

          <div className="glass-card" style={{ padding: '2rem', textAlign: 'center' }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              background: 'rgba(16, 185, 129, 0.15)',
              color: '#34d399',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.25rem',
              fontWeight: 800,
              fontSize: '1.25rem'
            }}>
              2
            </div>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem', fontWeight: 700 }}>
              Present Digital Pass
            </h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              Display your tamper-proof QR on your smartphone at station entry gates and during on-board ticket checks.
            </p>
          </div>

          <div className="glass-card" style={{ padding: '2rem', textAlign: 'center' }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              background: 'rgba(245, 158, 11, 0.15)',
              color: '#fbbf24',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.25rem',
              fontWeight: 800,
              fontSize: '1.25rem'
            }}>
              3
            </div>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem', fontWeight: 700 }}>
              Instant Verification & Audit
            </h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              TTE scanners verify signatures in milliseconds, update live coach manifests, and prevent duplicate screenshot re-entry.
            </p>
          </div>
        </div>
      </div>

      {/* 5. Core Platform Features */}
      <div>
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <h2 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.5rem' }}>
            Key Platform Innovations
          </h2>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '600px', margin: '0 auto' }}>
            Engineered to replace vulnerable paper and screenshot tickets with modern digital identity.
          </p>
        </div>

        <div className="grid-3">
          <div className="glass-card" style={{ borderTop: '3px solid #0284c7' }}>
            <div style={{
              width: '46px',
              height: '46px',
              borderRadius: '0.75rem',
              background: 'rgba(2, 132, 199, 0.15)',
              color: 'var(--rail-cyan)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '1rem'
            }}>
              <ShieldCheck size={26} />
            </div>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem', fontWeight: 700 }}>
              Cryptographic QR Tokens
            </h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              Zero private passenger PII is exposed in the QR code. Server-side signed tokens are authenticated instantly with zero forgery risk.
            </p>
          </div>

          <div className="glass-card" style={{ borderTop: '3px solid #f59e0b' }}>
            <div style={{
              width: '46px',
              height: '46px',
              borderRadius: '0.75rem',
              background: 'rgba(245, 158, 11, 0.15)',
              color: '#fbbf24',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '1rem'
            }}>
              <AlertTriangle size={26} />
            </div>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem', fontWeight: 700 }}>
              Duplicate Scan Detection
            </h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              Every scan timestamp, inspector badge, and station checkpoint is tracked in real-time. Repeated scans trigger immediate fraud alerts.
            </p>
          </div>

          <div className="glass-card" style={{ borderTop: '3px solid #10b981' }}>
            <div style={{
              width: '46px',
              height: '46px',
              borderRadius: '0.75rem',
              background: 'rgba(16, 185, 129, 0.15)',
              color: '#34d399',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '1rem'
            }}>
              <Users size={26} />
            </div>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem', fontWeight: 700 }}>
              Digital Coach Manifest
            </h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              Real-time coach-by-coach seating charts for on-board TTEs with one-click boarding status updates and vacant berth reallocation.
            </p>
          </div>
        </div>
      </div>

      {/* 6. Premier Express Trains Showcase */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h2 style={{ fontSize: '1.6rem', fontWeight: 800 }}>Premier Express Fleet</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>High-speed connectivity enabled with Smart QR Verification</p>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={() => navigate('search')}>
            View All Trains <ArrowRight size={14} />
          </button>
        </div>

        <div className="grid-3">
          <div className="glass-card" style={{ borderLeft: '4px solid #0284c7' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
              <div>
                <span className="badge badge-boarded" style={{ marginBottom: '0.35rem' }}>12002</span>
                <h3 style={{ fontSize: '1.15rem' }}>Bhopal Shatabdi Express</h3>
              </div>
              <Train size={24} color="#38bdf8" />
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
              New Delhi (NDLS) → Bhopal (BPL) via Agra, Gwalior & Jhansi
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-card)', paddingTop: '0.75rem' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Departs: 06:00 AM</span>
              <span style={{ fontWeight: 700, color: 'var(--rail-cyan)' }}>From ₹1,075</span>
            </div>
          </div>

          <div className="glass-card" style={{ borderLeft: '4px solid #f59e0b' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
              <div>
                <span className="badge badge-duplicate" style={{ marginBottom: '0.35rem' }}>22436</span>
                <h3 style={{ fontSize: '1.15rem' }}>Vande Bharat Express</h3>
              </div>
              <Zap size={24} color="#fbbf24" />
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
              New Delhi (NDLS) → Varanasi (BSB) via Kanpur & Prayagraj
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-card)', paddingTop: '0.75rem' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Departs: 06:00 AM</span>
              <span style={{ fontWeight: 700, color: '#fbbf24' }}>From ₹1,750</span>
            </div>
          </div>

          <div className="glass-card" style={{ borderLeft: '4px solid #10b981' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
              <div>
                <span className="badge badge-valid" style={{ marginBottom: '0.35rem' }}>12952</span>
                <h3 style={{ fontSize: '1.15rem' }}>Mumbai Rajdhani Express</h3>
              </div>
              <Train size={24} color="#34d399" />
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
              New Delhi (NDLS) → Mumbai CSMT via Vadodara & Surat
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-card)', paddingTop: '0.75rem' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Departs: 16:55 PM</span>
              <span style={{ fontWeight: 700, color: '#34d399' }}>From ₹2,310</span>
            </div>
          </div>
        </div>
      </div>

      {/* 7. Bottom CTA */}
      <div className="glass-card" style={{
        background: 'linear-gradient(135deg, rgba(2, 132, 199, 0.25) 0%, rgba(99, 102, 241, 0.2) 100%)',
        border: '1px solid var(--border-glass)',
        padding: '2.5rem',
        borderRadius: '1.25rem',
        textAlign: 'center'
      }}>
        <h2 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '0.75rem' }}>
          Ready to experience Smart Rail transit?
        </h2>
        <p style={{ color: 'var(--text-secondary)', maxWidth: '600px', margin: '0 auto 1.75rem', fontSize: '1rem' }}>
          Sign in to your account or register as a passenger to book and manage verified digital railway passes.
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <button className="btn btn-primary btn-lg" onClick={() => navigate('login')}>
            Sign In Now <ArrowRight size={18} />
          </button>
          <button className="btn btn-secondary btn-lg" onClick={() => navigate('register')}>
            Create Account
          </button>
        </div>
      </div>
    </div>
  );
}
