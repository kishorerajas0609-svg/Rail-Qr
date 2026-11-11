import React, { useState, useEffect } from 'react';
import { 
  Ticket, 
  ArrowLeft, 
  Search, 
  RefreshCw, 
  CheckCircle, 
  XCircle, 
  Eye, 
  QrCode, 
  Calendar, 
  Train, 
  AlertTriangle, 
  X 
} from 'lucide-react';
import { api } from '../services/api';

export default function AdminReservationManager({ navigate }) {
  const [reservations, setReservations] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [trains, setTrains] = useState([]);
  const [selectedTrain, setSelectedTrain] = useState('');

  // View Modal
  const [selectedReservation, setSelectedReservation] = useState(null);

  useEffect(() => {
    fetchTrains();
    fetchReservations();
  }, [statusFilter, selectedTrain]);

  const fetchTrains = async () => {
    try {
      const data = await api.getAllTrainsAdmin();
      setTrains(data);
    } catch (err) {
      console.error('Failed to load trains', err);
    }
  };

  const fetchReservations = async () => {
    setLoading(true);
    try {
      const data = await api.getAllReservationsAdmin(
        search, 
        statusFilter, 
        selectedTrain ? parseInt(selectedTrain) : null,
        100, 
        0
      );
      setReservations(data.reservations || []);
      setTotalCount(data.total || 0);
    } catch (err) {
      console.error('Failed to load reservations', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchReservations();
  };

  const handleCancelReservation = async (reservationId, pnr) => {
    if (!window.confirm(`Are you sure you want to cancel reservation PNR ${pnr}? All QR tokens will be immediately revoked.`)) {
      return;
    }
    try {
      const res = await api.adminCancelReservation(reservationId);
      alert(res.message);
      fetchReservations();
      if (selectedReservation?.id === reservationId) {
        setSelectedReservation(null);
      }
    } catch (err) {
      alert(err.message || 'Failed to cancel reservation');
    }
  };

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '1rem 0' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <button 
            className="btn btn-secondary btn-sm" 
            onClick={() => navigate('admin-dashboard')}
            style={{ marginBottom: '0.75rem' }}
          >
            <ArrowLeft size={15} /> Back to Dashboard
          </button>
          <h1 style={{ fontSize: '1.75rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Ticket size={28} color="#38bdf8" /> Central Railway Reservation Ledger
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
            Inspect all booked tickets, verify cryptographic security signatures, and manage cancellations network-wide
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button className="btn btn-secondary btn-sm" onClick={fetchReservations}>
            <RefreshCw size={15} /> Refresh ({totalCount} Bookings)
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-card" style={{ padding: '1.25rem', marginBottom: '1.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '0.5rem', flex: 1, minWidth: '280px' }}>
          <div style={{ position: 'relative', width: '100%' }}>
            <input 
              type="text" 
              className="form-input" 
              placeholder="Search by PNR (e.g. 842-9182301) or passenger name..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ width: '100%', paddingLeft: '2.5rem' }}
            />
            <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)' }} />
          </div>
          <button type="submit" className="btn btn-primary btn-sm">
            Search
          </button>
        </form>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <select 
            className="form-select" 
            value={statusFilter} 
            onChange={e => setStatusFilter(e.target.value)}
            style={{ width: 'auto', padding: '0.45rem 1rem' }}
          >
            <option value="">All Statuses</option>
            <option value="Confirmed">Confirmed Only</option>
            <option value="Cancelled">Cancelled Only</option>
          </select>

          <select 
            className="form-select" 
            value={selectedTrain} 
            onChange={e => setSelectedTrain(e.target.value)}
            style={{ width: 'auto', padding: '0.45rem 1rem' }}
          >
            <option value="">All Trains</option>
            {trains.map(t => (
              <option key={t.id} value={t.id}>{t.train_number} - {t.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Reservations Table */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
          <RefreshCw size={28} className="animate-spin" style={{ margin: '0 auto 1rem' }} />
          <div>Loading reservation ledger...</div>
        </div>
      ) : reservations.length === 0 ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
          <Ticket size={40} style={{ opacity: 0.4, margin: '0 auto 1rem' }} />
          <h3>No Reservations Found</h3>
          <p>No bookings match the search criteria.</p>
        </div>
      ) : (
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>PNR & Status</th>
                <th>Train & Route</th>
                <th>Journey Date</th>
                <th>Class & Quota</th>
                <th>Passengers</th>
                <th>Total Fare</th>
                <th>Booked At</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {reservations.map(res => (
                <tr key={res.id}>
                  <td>
                    <div style={{ fontWeight: 800, color: 'var(--rail-cyan)', fontSize: '0.95rem' }}>
                      {res.pnr}
                    </div>
                    <div>
                      {res.booking_status === 'Confirmed' ? (
                        <span className="badge badge-valid" style={{ fontSize: '0.7rem' }}>
                          Confirmed
                        </span>
                      ) : (
                        <span className="badge badge-invalid" style={{ fontSize: '0.7rem' }}>
                          Cancelled
                        </span>
                      )}
                    </div>
                  </td>

                  <td>
                    <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.85rem' }}>
                      {res.train_number} - {res.train_name}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {res.source_station_code} → {res.destination_station_code}
                    </div>
                  </td>

                  <td style={{ fontSize: '0.85rem' }}>
                    {res.journey_date}
                  </td>

                  <td>
                    <span className="badge badge-secondary">
                      {res.travel_class} ({res.quota})
                    </span>
                  </td>

                  <td>
                    <div style={{ fontSize: '0.85rem' }}>
                      {res.passengers.map(p => `${p.full_name} [${p.allotted_coach}-${p.allotted_berth_number || 'WL'}]`).join(', ')}
                    </div>
                  </td>

                  <td>
                    <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                      ₹{res.total_fare.toLocaleString('en-IN')}
                    </div>
                  </td>

                  <td style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {new Date(res.booked_at).toLocaleDateString()}
                  </td>

                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end' }}>
                      <button 
                        className="btn btn-secondary btn-sm" 
                        onClick={() => setSelectedReservation(res)}
                        title="Inspect QR Passes & Berths"
                        style={{ padding: '0.4rem' }}
                      >
                        <Eye size={15} color="#38bdf8" />
                      </button>

                      {res.booking_status === 'Confirmed' && (
                        <button 
                          className="btn btn-secondary btn-sm" 
                          onClick={() => handleCancelReservation(res.id, res.pnr)}
                          title="Admin Force Cancel & Refund"
                          style={{ padding: '0.4rem', color: '#f87171' }}
                        >
                          <XCircle size={15} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Reservation Details Modal */}
      {selectedReservation && (
        <div className="modal-backdrop">
          <div className="modal-card" style={{ maxWidth: '700px', maxHeight: '85vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div>
                <h2 style={{ fontSize: '1.3rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Ticket size={20} color="#38bdf8" /> PNR: {selectedReservation.pnr}
                </h2>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  {selectedReservation.train_number} - {selectedReservation.train_name} • {selectedReservation.source_station_name} to {selectedReservation.destination_station_name}
                </div>
              </div>
              <button onClick={() => setSelectedReservation(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            {/* Passenger & Ticket Cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
              {selectedReservation.tickets.map((t, idx) => {
                const p = selectedReservation.passengers[idx] || {};
                return (
                  <div key={t.id} className="glass-card" style={{ padding: '1rem', border: '1px solid var(--border-card)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                      <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)' }}>
                        {p.full_name} ({p.age} yrs, {p.gender})
                      </div>
                      <span className={`badge ${t.is_cancelled ? 'badge-invalid' : 'badge-valid'}`}>
                        {t.is_cancelled ? 'Ticket Cancelled' : 'Confirmed'}
                      </span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.5rem', fontSize: '0.85rem', marginBottom: '0.75rem' }}>
                      <div>Coach: <strong>{p.allotted_coach || 'N/A'}</strong></div>
                      <div>Berth: <strong>{p.allotted_berth_number || 'WL'} ({p.allotted_berth_type})</strong></div>
                      <div>Ticket No: <strong>{t.ticket_number}</strong></div>
                      <div>ID Proof: <strong>{p.id_proof_type} ({p.id_proof_number})</strong></div>
                    </div>

                    {/* QR Code preview if available */}
                    {t.qr_code_image_base64 && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: 'rgba(0,0,0,0.2)', padding: '0.75rem', borderRadius: '0.5rem' }}>
                        <img 
                          src={`data:image/png;base64,${t.qr_code_image_base64}`} 
                          alt="QR Ticket" 
                          style={{ width: '80px', height: '80px', borderRadius: '0.4rem', background: '#fff', padding: '4px' }} 
                        />
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          <div><strong>Token:</strong> <code>{t.qr_token_string}</code></div>
                          <div style={{ marginTop: '0.25rem' }}><strong>HMAC SHA-256 Signature:</strong></div>
                          <div style={{ wordBreak: 'break-all', fontFamily: 'monospace', color: 'var(--rail-cyan)' }}>
                            {t.security_signature}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              {selectedReservation.booking_status === 'Confirmed' ? (
                <button 
                  className="btn btn-secondary btn-sm" 
                  style={{ color: '#f87171' }}
                  onClick={() => handleCancelReservation(selectedReservation.id, selectedReservation.pnr)}
                >
                  <XCircle size={15} /> Admin Force Cancel Reservation
                </button>
              ) : <div />}

              <button className="btn btn-secondary btn-sm" onClick={() => setSelectedReservation(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
