import React, { useState, useEffect } from 'react';
import { Train, ArrowLeft, Plus, Power, CheckCircle2, XCircle, Search } from 'lucide-react';
import { api } from '../services/api';

export default function AdminTrainManager({ navigate }) {
  const [trains, setTrains] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchTrains();
  }, []);

  const fetchTrains = async () => {
    setLoading(true);
    try {
      const data = await api.getAllTrainsAdmin();
      setTrains(data);
    } catch (err) {
      console.error('Failed to load trains', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (trainId) => {
    try {
      const res = await api.toggleTrainStatus(trainId);
      setTrains(prev => prev.map(t => t.id === trainId ? { ...t, is_active: res.is_active } : t));
    } catch (err) {
      alert('Failed to toggle train status');
    }
  };

  const filteredTrains = trains.filter(t => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      t.train_number.toLowerCase().includes(q) ||
      t.name.toLowerCase().includes(q) ||
      t.source.toLowerCase().includes(q) ||
      t.destination.toLowerCase().includes(q)
    );
  });

  return (
    <div>
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
            <Train size={28} color="#38bdf8" /> Train Fleet & Route Manager
          </h1>
        </div>

        <div className="search-input-box" style={{ maxWidth: '300px' }}>
          <Search size={16} color="var(--text-muted)" />
          <input
            type="text"
            placeholder="Search Train or Station..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="table-responsive">
        <table className="data-table">
          <thead>
            <tr>
              <th>Train Number & Name</th>
              <th>Type</th>
              <th>Route (Source → Dest)</th>
              <th>Distance</th>
              <th>Coaches</th>
              <th>Bookings</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredTrains.map(t => (
              <tr key={t.id}>
                <td>
                  <div style={{ fontWeight: 800, color: 'var(--rail-cyan)' }}>{t.train_number}</div>
                  <div style={{ fontWeight: 600 }}>{t.name}</div>
                </td>
                <td>
                  <span className="badge badge-boarded">{t.train_type}</span>
                </td>
                <td>
                  <strong>{t.source}</strong> → <strong>{t.destination}</strong>
                </td>
                <td>{t.distance_km} km</td>
                <td>{t.coach_count} Coaches</td>
                <td>
                  <span style={{ fontWeight: 700 }}>{t.reservations_count}</span>
                </td>
                <td>
                  {t.is_active ? (
                    <span className="badge badge-valid">Active</span>
                  ) : (
                    <span className="badge badge-invalid">Suspended</span>
                  )}
                </td>
                <td>
                  <button
                    className={`btn btn-sm ${t.is_active ? 'btn-danger' : 'btn-success'}`}
                    onClick={() => handleToggle(t.id)}
                    title={t.is_active ? 'Suspend Train' : 'Activate Train'}
                  >
                    <Power size={14} /> {t.is_active ? 'Suspend' : 'Activate'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
