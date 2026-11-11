import React, { useState } from 'react';
import { 
  Search, 
  Ticket, 
  Train, 
  MapPin, 
  AlertCircle, 
  ArrowRight, 
  QrCode
} from 'lucide-react';
import { api } from '../services/api';

export default function PnrTracker({ onSelectReservation, navigate }) {
  const [pnrInput, setPnrInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  const handleLookup = async (pnrToQuery) => {
    const pnr = (pnrToQuery || pnrInput).trim();
    if (!pnr) {
      setError('Please enter a 10-digit PNR number');
      return;
    }

    setError(null);
    setLoading(true);
    setResult(null);

    try {
      const data = await api.getReservationByPnr(pnr);
      setResult(data);
    } catch (err) {
      setError(err.message || 'PNR not found or invalid format');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status, bStatus) => {
    if (status === 'Cancelled') {
      return <span className="badge badge-invalid">Cancelled</span>;
    }
    if (bStatus === 'BOARDED') {
      return <span className="badge badge-boarded">Boarded</span>;
    }
    if (bStatus === 'VERIFIED') {
      return <span className="badge badge-valid">Verified</span>;
    }
    return <span className="badge badge-unverified">Not Verified</span>;
  };

  return (
    <div className="glass-card" style={{
      border: '1px solid var(--border-glass)',
      background: 'linear-gradient(135deg, rgba(16, 28, 58, 0.85) 0%, rgba(13, 23, 48, 0.7) 100%)',
      padding: '1.75rem',
      borderRadius: '1.25rem',
      boxShadow: 'var(--shadow-md)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '1.25rem' }}>
        <div style={{
          width: '38px',
          height: '38px',
          borderRadius: '0.65rem',
          background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fff'
        }}>
          <Search size={20} />
        </div>
        <div>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>Live PNR Status & Pass Lookup</h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            Check real-time booking confirmation & load your cryptographic digital QR pass
          </p>
        </div>
      </div>

      <form 
        onSubmit={(e) => { e.preventDefault(); handleLookup(); }}
        style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}
      >
        <div style={{ flex: 1, minWidth: '240px', position: 'relative' }}>
          <input
            type="text"
            className="form-input"
            style={{ width: '100%', paddingLeft: '2.5rem', fontFamily: 'var(--font-mono)' }}
            placeholder="Enter 10-digit PNR (e.g. 842-9182301)"
            value={pnrInput}
            onChange={e => setPnrInput(e.target.value)}
          />
          <Ticket 
            size={18} 
            color="var(--text-muted)" 
            style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)' }} 
          />
        </div>
        <button 
          type="submit" 
          className="btn btn-primary"
          disabled={loading}
          style={{ minWidth: '150px' }}
        >
          {loading ? 'Checking PNR...' : <><Search size={16} /> Check Status</>}
        </button>
      </form>

      {error && (
        <div style={{
          background: 'rgba(239, 68, 68, 0.15)',
          border: '1px solid rgba(239, 68, 68, 0.4)',
          color: '#f87171',
          borderRadius: '0.625rem',
          padding: '0.75rem 1rem',
          fontSize: '0.85rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          marginTop: '0.75rem'
        }}>
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* Lookup Result Card */}
      {result && (
        <div style={{
          marginTop: '1.25rem',
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid var(--border-glass)',
          borderRadius: '0.875rem',
          padding: '1.25rem',
          animation: 'fadeIn 0.25s ease-out'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1rem', borderBottom: '1px solid var(--border-card)', paddingBottom: '0.85rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                <span className="badge badge-boarded">{result.train_number}</span>
                <span style={{ fontWeight: 800, fontSize: '1.1rem' }}>{result.train_name}</span>
                <span className="badge badge-valid">{result.booking_status}</span>
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <MapPin size={14} color="#38bdf8" />
                <span>{result.source_station_name} ({result.source_station_code})</span>
                <ArrowRight size={12} />
                <span>{result.destination_station_name} ({result.destination_station_code})</span>
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>PNR NUMBER</div>
              <code style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--rail-cyan)' }}>{result.pnr}</code>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                Journey: {result.journey_date}
              </div>
            </div>
          </div>

          {/* Passenger List in this reservation */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginBottom: '1.25rem' }}>
            {result.passengers.map((p, idx) => {
              const ticket = result.tickets[idx];
              const bStatus = ticket ? ticket.boarding_status : 'NOT_VERIFIED';
              return (
                <div 
                  key={p.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: 'rgba(15, 23, 42, 0.4)',
                    padding: '0.65rem 1rem',
                    borderRadius: '0.5rem',
                    border: '1px solid var(--border-card)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      background: 'rgba(2, 132, 199, 0.2)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--rail-cyan)',
                      fontSize: '0.8rem',
                      fontWeight: 700
                    }}>
                      {idx + 1}
                    </div>
                    <div>
                      <div style={{ fontSize: '0.9rem', fontWeight: 700 }}>{p.full_name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {p.age} yrs • {p.gender} • {p.id_proof_type}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--rail-cyan)' }}>
                        Coach {p.allotted_coach} / Berth {p.allotted_berth_number}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                        {p.allotted_berth_type}
                      </div>
                    </div>
                    {getStatusBadge(result.booking_status, bStatus)}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
            <button
              className="btn btn-primary btn-sm"
              onClick={() => {
                if (onSelectReservation) {
                  onSelectReservation(result);
                } else if (navigate) {
                  navigate('ticket-details');
                }
              }}
            >
              <QrCode size={16} /> Open Cryptographic QR Pass & Ticket
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
