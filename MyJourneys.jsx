import React, { useState, useEffect } from 'react';
import { 
  Ticket, 
  Calendar, 
  Train, 
  QrCode, 
  ChevronRight, 
  AlertCircle, 
  CheckCircle2, 
  XCircle,
  Clock
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function MyJourneys({ onSelectReservation, navigate }) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('upcoming'); // 'upcoming', 'past', 'cancelled', 'all'
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchJourneys(activeTab);
  }, [activeTab]);

  const fetchJourneys = async (category) => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getMyJourneys(category);
      setReservations(data);
    } catch (err) {
      setError(err.message || 'Failed to load journeys');
    } finally {
      setLoading(false);
    }
  };

  const handleViewTicket = (res) => {
    if (onSelectReservation) {
      onSelectReservation(res);
    }
    navigate('ticket-details');
  };

  const handleCancelBooking = async (resId) => {
    if (!window.confirm('Are you sure you want to cancel this ticket reservation? The digital QR pass will be revoked immediately.')) {
      return;
    }
    try {
      await api.cancelReservation(resId);
      alert('Ticket reservation cancelled successfully. Refund has been initiated.');
      fetchJourneys(activeTab);
    } catch (err) {
      alert(err.message || 'Failed to cancel ticket');
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Confirmed':
        return <span className="badge badge-valid">Confirmed</span>;
      case 'Cancelled':
        return <span className="badge badge-invalid">Cancelled</span>;
      case 'RAC':
        return <span className="badge badge-duplicate">RAC</span>;
      case 'Waiting_List':
        return <span className="badge badge-unverified">Waiting List</span>;
      default:
        return <span className="badge badge-unverified">{status}</span>;
    }
  };

  return (
    <div style={{ maxWidth: '960px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Ticket size={28} color="#38bdf8" /> My Journeys & Digital Passes
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.2rem' }}>
            Access your verifiable smart QR tickets and journey history
          </p>
        </div>

        <button className="btn btn-primary btn-sm" onClick={() => navigate('search')}>
          <Train size={16} /> Book New Ticket
        </button>
      </div>

      {/* Tabs Filter */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.75rem', borderBottom: '1px solid var(--border-card)', paddingBottom: '0.75rem' }}>
        {[
          { id: 'upcoming', label: 'Upcoming Trips' },
          { id: 'past', label: 'Past Journeys' },
          { id: 'cancelled', label: 'Cancelled Trips' },
          { id: 'all', label: 'All Bookings' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`btn btn-sm ${activeTab === tab.id ? 'btn-primary' : 'btn-secondary'}`}
            style={{ borderRadius: '0.5rem' }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading && (
        <div className="glass-card" style={{ textAlign: 'center', padding: '3rem' }}>
          <Ticket size={36} color="#38bdf8" className="animate-float" style={{ margin: '0 auto 1rem' }} />
          <p style={{ color: 'var(--text-secondary)' }}>Loading your tickets...</p>
        </div>
      )}

      {error && (
        <div className="glass-card" style={{ padding: '1.5rem', borderColor: '#ef4444', color: '#f87171' }}>
          <AlertCircle size={24} style={{ marginBottom: '0.5rem' }} />
          <div>{error}</div>
        </div>
      )}

      {!loading && !error && reservations.length === 0 && (
        <div className="glass-card" style={{ textAlign: 'center', padding: '3.5rem 2rem' }}>
          <Ticket size={48} color="var(--text-muted)" style={{ margin: '0 auto 1rem' }} />
          <h3>No Journeys in this Category</h3>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem', marginBottom: '1.5rem' }}>
            You have no {activeTab} railway reservations. Ready to travel?
          </p>
          <button className="btn btn-primary" onClick={() => navigate('search')}>
            Search & Book Trains
          </button>
        </div>
      )}

      {/* Reservation Cards List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {reservations.map(res => {
          const firstPassenger = res.passengers[0];
          const ticketCount = res.tickets.length;
          const isCancelled = res.booking_status === 'Cancelled';

          return (
            <div 
              key={res.id} 
              className="glass-card"
              style={{
                borderLeft: isCancelled ? '4px solid #ef4444' : '4px solid #38bdf8',
                padding: '1.25rem 1.5rem'
              }}
            >
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                flexWrap: 'wrap',
                gap: '1rem',
                borderBottom: '1px solid var(--border-card)',
                paddingBottom: '1rem',
                marginBottom: '1rem'
              }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                    <span className="badge badge-boarded">{res.train_number}</span>
                    <h3 style={{ fontSize: '1.15rem' }}>{res.train_name}</h3>
                    {getStatusBadge(res.booking_status)}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                    Class: <strong>{res.travel_class}</strong> • Quota: {res.quota} • PNR: <code style={{ color: 'var(--rail-cyan)', fontWeight: 700 }}>{res.pnr}</code>
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                    ₹{res.total_fare}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {ticketCount} Passenger{ticketCount > 1 ? 's' : ''}
                  </div>
                </div>
              </div>

              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '1rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>From</div>
                    <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{res.source_station_name} ({res.source_station_code})</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--rail-cyan)' }}>Dep: {res.departure_time}</div>
                  </div>

                  <div style={{ color: 'var(--text-muted)' }}>→</div>

                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>To</div>
                    <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{res.destination_station_name} ({res.destination_station_code})</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--rail-cyan)' }}>Arr: {res.arrival_time}</div>
                  </div>

                  <div style={{ marginLeft: '1rem' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Journey Date</div>
                    <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{res.journey_date}</div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.65rem' }}>
                  <button 
                    className="btn btn-primary btn-sm"
                    onClick={() => handleViewTicket(res)}
                  >
                    <QrCode size={15} /> View Smart QR Pass
                  </button>

                  {!isCancelled && (
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => handleCancelBooking(res.id)}
                      style={{ color: '#ef4444' }}
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
