import React, { useState, useEffect } from 'react';
import { ArrowLeft, Search, AlertCircle, Ticket as TicketIcon } from 'lucide-react';
import DigitalTicket from '../components/DigitalTicket';
import { api } from '../services/api';

export default function TicketDetails({ reservation: propReservation, navigate }) {
  const [reservation, setReservation] = useState(propReservation || null);
  const [pnrSearch, setPnrSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (propReservation) {
      setReservation(propReservation);
    }
  }, [propReservation]);

  const handleLookupPnr = async (e) => {
    e.preventDefault();
    if (!pnrSearch.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const data = await api.getReservationByPnr(pnrSearch.trim());
      setReservation(data);
    } catch (err) {
      setError(err.message || 'PNR not found');
      setReservation(null);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelTicket = async (resId) => {
    if (!window.confirm('Are you sure you want to cancel this booking? The digital QR pass will be permanently revoked.')) {
      return;
    }
    try {
      const updated = await api.cancelReservation(resId);
      setReservation(updated);
      alert('Reservation successfully cancelled.');
    } catch (err) {
      alert(err.message || 'Failed to cancel ticket');
    }
  };

  return (
    <div style={{ maxWidth: '860px', margin: '0 auto' }}>
      <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <button 
          className="btn btn-secondary btn-sm"
          onClick={() => navigate('my-journeys')}
        >
          <ArrowLeft size={16} /> Back to My Journeys
        </button>

        {/* PNR Quick Search */}
        <form onSubmit={handleLookupPnr} style={{ display: 'flex', gap: '0.5rem' }}>
          <input
            type="text"
            className="form-input"
            placeholder="Lookup by PNR (e.g. 842-9182301)"
            value={pnrSearch}
            onChange={e => setPnrSearch(e.target.value)}
            style={{ padding: '0.45rem 0.85rem', fontSize: '0.85rem', minWidth: '220px' }}
          />
          <button type="submit" className="btn btn-secondary btn-sm">
            <Search size={14} /> Search
          </button>
        </form>
      </div>

      {loading && (
        <div className="glass-card" style={{ textAlign: 'center', padding: '3rem' }}>
          <TicketIcon size={36} color="#38bdf8" className="animate-float" style={{ margin: '0 auto 1rem' }} />
          <p style={{ color: 'var(--text-secondary)' }}>Retrieving digital ticket pass...</p>
        </div>
      )}

      {error && (
        <div className="glass-card" style={{ padding: '1.25rem', borderColor: '#ef4444', color: '#f87171', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      {!loading && reservation && (
        <DigitalTicket 
          reservation={reservation} 
          onCancel={handleCancelTicket}
          showCancel={true}
        />
      )}

      {!loading && !reservation && !error && (
        <div className="glass-card" style={{ textAlign: 'center', padding: '3.5rem' }}>
          <TicketIcon size={44} color="var(--text-muted)" style={{ margin: '0 auto 1rem' }} />
          <h3>No Ticket Selected</h3>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
            Enter a PNR above or choose a ticket from your journey list.
          </p>
        </div>
      )}
    </div>
  );
}
