import React, { useState, useEffect } from 'react';
import { 
  Train, 
  Search, 
  Calendar, 
  ShieldCheck, 
  QrCode, 
  AlertTriangle, 
  Users, 
  ArrowRight, 
  Sparkles,
  Zap,
  CheckCircle2,
  Lock,
  MapPin,
  Clock,
  Compass,
  CreditCard,
  Layers,
  ChevronRight,
  ClipboardList,
  LayoutDashboard
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import PnrTracker from '../components/PnrTracker';

export default function Home({ navigate, onSearchTrains, onSelectReservation }) {
  const { user, isStaff, isAdmin, isPassenger } = useAuth();
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
      {/* 1. Personalized User Welcome Banner */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(2, 132, 199, 0.25) 0%, rgba(99, 102, 241, 0.18) 50%, rgba(13, 23, 48, 0.95) 100%)',
        border: '1px solid var(--border-glass)',
        borderRadius: '1.25rem',
        padding: '2rem 2.25rem',
        boxShadow: 'var(--shadow-md)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1.5rem'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
            <span className={`badge ${isAdmin ? 'badge-duplicate' : isStaff ? 'badge-valid' : 'badge-boarded'}`}>
              {user?.role?.toUpperCase() || 'PASSENGER'}
            </span>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Active Transit Session</span>
          </div>
          <h1 style={{ fontSize: '1.85rem', fontWeight: 800 }}>
            Welcome back, <span style={{ color: 'var(--rail-cyan)' }}>{user?.full_name || 'Passenger'}</span>!
          </h1>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
            {isPassenger && 'Manage your verified digital QR tickets, check PNR confirmation, and reserve new journeys.'}
            {isStaff && !isAdmin && 'Railway Inspection Terminal: Handheld QR verification HUD and passenger coach manifest ready.'}
            {isAdmin && 'Chief Operations Controller: Complete fleet management, stations oversight, and real-time audit ledger.'}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          {isPassenger && (
            <>
              <button className="btn btn-primary" onClick={() => navigate('my-journeys')}>
                <QrCode size={16} /> My Digital Tickets
              </button>
              <button className="btn btn-secondary" onClick={() => navigate('search')}>
                <Search size={16} /> Book New Ticket
              </button>
            </>
          )}
          {isStaff && !isAdmin && (
            <>
              <button className="btn btn-primary" onClick={() => navigate('scanner')}>
                <QrCode size={16} /> Launch TTE Scanner
              </button>
              <button className="btn btn-secondary" onClick={() => navigate('manifest')}>
                <ClipboardList size={16} /> Coach Manifest HUD
              </button>
            </>
          )}
          {isAdmin && (
            <>
              <button className="btn btn-primary" onClick={() => navigate('admin-dashboard')}>
                <LayoutDashboard size={16} /> Operations Control
              </button>
              <button className="btn btn-secondary" onClick={() => navigate('scanner')}>
                <QrCode size={16} /> Scanner Terminal
              </button>
            </>
          )}
        </div>
      </div>

      {/* 2. Live PNR Status & Pass Lookup Widget */}
      <PnrTracker onSelectReservation={onSelectReservation} navigate={navigate} />

      {/* 3. Train Search & Availability Booking Widget */}
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
            <h2 style={{ fontSize: '1.35rem', fontWeight: 800 }}>Search Trains & Check Real-Time Availability</h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Dynamic berth allocation engine with instant HMAC-SHA256 digital ticket generation
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

      {/* 4. Core Security Highlights */}
      <div>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.85rem', fontWeight: 800, marginBottom: '0.5rem' }}>
            Transit Security & Verification Highlights
          </h2>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '650px', margin: '0 auto' }}>
            Tamper-proof digital railway verification architecture.
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
            <h3 style={{ fontSize: '1.15rem', marginBottom: '0.5rem', fontWeight: 700 }}>
              Cryptographic QR Tokens
            </h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              No private passenger PII is exposed inside the QR image. HMAC-SHA256 authenticated tokens are validated dynamically against the central database.
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
            <h3 style={{ fontSize: '1.15rem', marginBottom: '0.5rem', fontWeight: 700 }}>
              Duplicate Scan Detection
            </h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              Tracks scan counts, inspector badge numbers, and station checkpoints. Repeated scans trigger instant amber re-inspection warnings.
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
            <h3 style={{ fontSize: '1.15rem', marginBottom: '0.5rem', fontWeight: 700 }}>
              Digital Coach Manifest HUD
            </h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              Provides on-board TTE staff with a real-time coach seating chart, one-click boarding status updates, and vacant berth reallocation.
            </p>
          </div>
        </div>
      </div>

      {/* 5. Featured Premier Express Fleet */}
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
    </div>
  );
}
