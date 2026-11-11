import React, { useState, useEffect } from 'react';
import { 
  ClipboardList, 
  Search, 
  Train, 
  User, 
  CheckCircle2, 
  XCircle, 
  ShieldCheck, 
  AlertCircle,
  Filter,
  Calendar,
  RefreshCw
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function StaffManifest({ navigate }) {
  const { user } = useAuth();

  const [manifestData, setManifestData] = useState(null);
  const [selectedCoach, setSelectedCoach] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [journeyDate, setJourneyDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);

  useEffect(() => {
    fetchManifest();
  }, [journeyDate, selectedCoach]);

  const fetchManifest = async () => {
    setLoading(true);
    try {
      const coachFilter = selectedCoach === 'ALL' ? null : selectedCoach;
      const data = await api.getDutyManifest(null, journeyDate, coachFilter);
      setManifestData(data);
    } catch (err) {
      console.error('Failed to fetch manifest:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (ticketId, newStatus) => {
    if (!ticketId) return;
    setUpdatingId(ticketId);
    try {
      await api.updateBoardingStatus(ticketId, newStatus);
      // Update locally
      setManifestData(prev => {
        if (!prev) return prev;
        const updatedManifest = prev.manifest.map(row => {
          if (row.ticket_id === ticketId) {
            return { ...row, boarding_status: newStatus };
          }
          return row;
        });

        // Recompute summary
        let v = 0, b = 0, ns = 0;
        updatedManifest.forEach(r => {
          if (r.boarding_status === 'VERIFIED') v++;
          else if (r.boarding_status === 'BOARDED') b++;
          else if (r.boarding_status === 'NO_SHOW') ns++;
        });

        return {
          ...prev,
          manifest: updatedManifest,
          summary: {
            ...prev.summary,
            verified: v,
            boarded: b,
            no_show: ns,
            unverified: updatedManifest.length - v - b - ns
          }
        };
      });
    } catch (err) {
      alert(err.message || 'Failed to update boarding status');
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredManifest = (manifestData?.manifest || []).filter(row => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      row.full_name.toLowerCase().includes(q) ||
      row.pnr.toLowerCase().includes(q) ||
      (row.coach && row.coach.toLowerCase().includes(q)) ||
      (row.berth_number && row.berth_number.toString().includes(q))
    );
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'BOARDED':
        return <span className="badge badge-boarded">Boarded</span>;
      case 'VERIFIED':
        return <span className="badge badge-valid">Verified</span>;
      case 'NO_SHOW':
        return <span className="badge badge-invalid">No Show</span>;
      default:
        return <span className="badge badge-unverified">Not Verified</span>;
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <ClipboardList size={28} color="#38bdf8" /> Digital Passenger Manifest & Chart
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.2rem' }}>
            Live on-board passenger manifest and seat verification manager
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <input
            type="date"
            className="form-input"
            value={journeyDate}
            onChange={e => setJourneyDate(e.target.value)}
            style={{ padding: '0.45rem 0.85rem', fontSize: '0.85rem' }}
          />

          <button className="btn btn-secondary btn-sm" onClick={fetchManifest}>
            <RefreshCw size={15} /> Refresh Chart
          </button>
        </div>
      </div>

      {manifestData && (
        <>
          {/* Train & KPI Summary Cards */}
          <div className="glass-card" style={{ marginBottom: '1.5rem', background: 'linear-gradient(135deg, rgba(2, 132, 199, 0.15) 0%, rgba(13, 23, 48, 0.75) 100%)' }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '1.25rem'
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span className="badge badge-boarded">{manifestData.train.train_number}</span>
                  <h2 style={{ fontSize: '1.35rem' }}>{manifestData.train.name}</h2>
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                  Route: {manifestData.train.source} → {manifestData.train.destination} • Journey Date: {manifestData.journey_date}
                </div>
              </div>

              {/* Status Counters */}
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                <div style={{ textAlign: 'center', padding: '0.5rem 1rem', background: 'rgba(0,0,0,0.25)', borderRadius: '0.65rem' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Total Passengers</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800 }}>{manifestData.summary.total_passengers}</div>
                </div>

                <div style={{ textAlign: 'center', padding: '0.5rem 1rem', background: 'rgba(16, 185, 129, 0.15)', borderRadius: '0.65rem', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                  <div style={{ fontSize: '0.75rem', color: '#34d399' }}>Verified</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#34d399' }}>{manifestData.summary.verified}</div>
                </div>

                <div style={{ textAlign: 'center', padding: '0.5rem 1rem', background: 'rgba(6, 182, 212, 0.15)', borderRadius: '0.65rem', border: '1px solid rgba(6, 182, 212, 0.3)' }}>
                  <div style={{ fontSize: '0.75rem', color: '#22d3ee' }}>Boarded</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#22d3ee' }}>{manifestData.summary.boarded}</div>
                </div>

                <div style={{ textAlign: 'center', padding: '0.5rem 1rem', background: 'rgba(239, 68, 68, 0.15)', borderRadius: '0.65rem', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
                  <div style={{ fontSize: '0.75rem', color: '#f87171' }}>No Show</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#f87171' }}>{manifestData.summary.no_show}</div>
                </div>

                <div style={{ textAlign: 'center', padding: '0.5rem 1rem', background: 'rgba(255,255,255,0.05)', borderRadius: '0.65rem' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Pending</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800 }}>{manifestData.summary.unverified}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Coach Filter Tabs */}
          <div className="coach-tabs">
            <button
              onClick={() => setSelectedCoach('ALL')}
              className={`coach-tab-btn ${selectedCoach === 'ALL' ? 'active' : ''}`}
            >
              All Coaches ({manifestData.manifest.length})
            </button>
            {manifestData.coaches.map(c => (
              <button
                key={c.code}
                onClick={() => setSelectedCoach(c.code)}
                className={`coach-tab-btn ${selectedCoach === c.code ? 'active' : ''}`}
              >
                Coach {c.code} ({c.type})
              </button>
            ))}
          </div>

          {/* Search & Filter Toolbar */}
          <div className="toolbar-container">
            <div className="search-input-box">
              <Search size={16} color="var(--text-muted)" />
              <input
                type="text"
                placeholder="Search by Passenger Name, PNR, Coach or Seat..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Manifest Table */}
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Coach & Berth</th>
                  <th>Passenger</th>
                  <th>PNR Number</th>
                  <th>Route</th>
                  <th>Class</th>
                  <th>Verification</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredManifest.length === 0 ? (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-secondary)' }}>
                      No passengers found matching search criteria.
                    </td>
                  </tr>
                ) : (
                  filteredManifest.map(p => (
                    <tr key={p.passenger_id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--rail-cyan)' }}>
                            {p.coach}-{p.berth_number}
                          </span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            ({p.berth_type})
                          </span>
                        </div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 700 }}>{p.full_name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                          {p.age}y, {p.gender} • {p.id_proof_type}: {p.id_proof_number || 'Verified'}
                        </div>
                      </td>
                      <td>
                        <code style={{ color: 'var(--rail-cyan)', fontFamily: 'var(--font-mono)' }}>
                          {p.pnr}
                        </code>
                      </td>
                      <td>
                        <span style={{ fontSize: '0.85rem' }}>{p.source_station} → {p.destination_station}</span>
                      </td>
                      <td>
                        <span style={{ fontWeight: 600 }}>{p.travel_class}</span>
                      </td>
                      <td>
                        {getStatusBadge(p.boarding_status)}
                        {p.scan_count > 1 && (
                          <span className="badge badge-duplicate" style={{ marginLeft: '0.35rem' }}>
                            {p.scan_count} Scans
                          </span>
                        )}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.35rem' }}>
                          <button
                            className={`btn btn-sm ${p.boarding_status === 'VERIFIED' ? 'btn-primary' : 'btn-secondary'}`}
                            onClick={() => handleUpdateStatus(p.ticket_id, 'VERIFIED')}
                            title="Mark Verified"
                            disabled={updatingId === p.ticket_id}
                          >
                            <ShieldCheck size={14} />
                          </button>
                          <button
                            className={`btn btn-sm ${p.boarding_status === 'BOARDED' ? 'btn-success' : 'btn-secondary'}`}
                            onClick={() => handleUpdateStatus(p.ticket_id, 'BOARDED')}
                            title="Mark Boarded"
                            disabled={updatingId === p.ticket_id}
                          >
                            <CheckCircle2 size={14} />
                          </button>
                          <button
                            className={`btn btn-sm ${p.boarding_status === 'NO_SHOW' ? 'btn-danger' : 'btn-secondary'}`}
                            onClick={() => handleUpdateStatus(p.ticket_id, 'NO_SHOW')}
                            title="Mark No-Show"
                            disabled={updatingId === p.ticket_id}
                          >
                            <XCircle size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
