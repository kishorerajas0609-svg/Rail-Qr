import React, { useState, useEffect } from 'react';
import { 
  Train, 
  Search, 
  Clock, 
  MapPin, 
  Calendar, 
  ArrowRight, 
  Info, 
  X, 
  CheckCircle2, 
  ShieldAlert,
  ChevronRight
} from 'lucide-react';
import { api } from '../services/api';

export default function TrainSearch({ initialSearch, onSelectTrain, navigate }) {
  const [stations, setStations] = useState([]);
  const [sourceCode, setSourceCode] = useState(initialSearch?.sourceCode || 'NDLS');
  const [destCode, setDestCode] = useState(initialSearch?.destCode || 'BPL');
  const [journeyDate, setJourneyDate] = useState(initialSearch?.journeyDate || new Date().toISOString().split('T')[0]);
  const [travelClass, setTravelClass] = useState(initialSearch?.travelClass || 'ALL');
  const [quota, setQuota] = useState(initialSearch?.quota || 'General');

  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Halts modal state
  const [selectedTrainDetails, setSelectedTrainDetails] = useState(null);
  const [haltsModalOpen, setHaltsModalOpen] = useState(false);

  useEffect(() => {
    api.getStations().then(data => {
      setStations(data);
    }).catch(err => console.error('Error fetching stations:', err));
  }, []);

  useEffect(() => {
    performSearch();
  }, [sourceCode, destCode, journeyDate, travelClass, quota]);

  const performSearch = async () => {
    if (!sourceCode || !destCode || sourceCode === destCode) return;
    setLoading(true);
    setError(null);
    try {
      const data = await api.searchTrains(
        sourceCode, 
        destCode, 
        journeyDate, 
        travelClass === 'ALL' ? '' : travelClass, 
        quota
      );
      setResults(data);
    } catch (err) {
      setError(err.message || 'Failed to find trains for this route');
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenHalts = async (trainId) => {
    try {
      const details = await api.getTrainDetails(trainId);
      setSelectedTrainDetails(details);
      setHaltsModalOpen(true);
    } catch (err) {
      alert('Could not fetch train schedule details');
    }
  };

  const handleBook = (train, classInfo) => {
    const sourceStationObj = stations.find(s => s.code === sourceCode) || { id: 1, code: sourceCode, name: train.source_name };
    const destStationObj = stations.find(s => s.code === destCode) || { id: 2, code: destCode, name: train.destination_name };

    if (onSelectTrain) {
      onSelectTrain({
        train,
        classInfo,
        sourceStation: sourceStationObj,
        destinationStation: destStationObj,
        journeyDate,
        quota
      });
    }
    navigate('book');
  };

  return (
    <div>
      {/* Header & Filter Bar */}
      <div className="glass-card" style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
          <Search size={22} color="#38bdf8" />
          <h1 style={{ fontSize: '1.5rem' }}>Train Search & Live Seat Availability</h1>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
          gap: '1rem',
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
            <label className="form-label">Date of Journey</label>
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
        </div>
      </div>

      {/* Results Section */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <h2 style={{ fontSize: '1.25rem', color: 'var(--text-primary)' }}>
            Available Trains ({results.length})
          </h2>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Route: <strong>{sourceCode}</strong> → <strong>{destCode}</strong> on {journeyDate}
          </span>
        </div>

        {loading && (
          <div className="glass-card" style={{ textAlign: 'center', padding: '3rem' }}>
            <Train size={36} color="#38bdf8" className="animate-float" style={{ margin: '0 auto 1rem' }} />
            <p style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>
              Checking Central Railway Live Seat Inventory...
            </p>
          </div>
        )}

        {error && (
          <div className="glass-card" style={{ textAlign: 'center', padding: '2.5rem', borderColor: 'rgba(239, 68, 68, 0.4)' }}>
            <ShieldAlert size={36} color="#ef4444" style={{ margin: '0 auto 0.75rem' }} />
            <p style={{ color: '#f87171', fontWeight: 600 }}>{error}</p>
          </div>
        )}

        {!loading && !error && results.length === 0 && (
          <div className="glass-card" style={{ textAlign: 'center', padding: '3rem' }}>
            <Train size={36} color="var(--text-muted)" style={{ margin: '0 auto 1rem' }} />
            <h3 style={{ marginBottom: '0.5rem' }}>No Direct Trains Found</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              Try searching popular routes such as <strong>NDLS → BPL</strong>, <strong>NDLS → CSMT</strong>, <strong>NDLS → BSB</strong>, or <strong>SBC → MAS</strong>.
            </p>
          </div>
        )}

        {/* Train Cards List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {results.map(train => (
            <div key={train.id} className="glass-card" style={{ padding: '1.5rem 1.75rem' }}>
              {/* Train Header Info */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                flexWrap: 'wrap',
                gap: '1rem',
                borderBottom: '1px solid var(--border-card)',
                paddingBottom: '1rem',
                marginBottom: '1.25rem'
              }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                    <span className="badge badge-boarded" style={{ fontSize: '0.85rem' }}>
                      {train.train_number}
                    </span>
                    <h3 style={{ fontSize: '1.25rem' }}>{train.name}</h3>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      ({train.train_type})
                    </span>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.35rem' }}>
                    Runs On: <strong style={{ color: '#34d399' }}>{train.runs_on_days}</strong> • Distance: {train.total_distance_km} km
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '1.2rem', fontWeight: 800, fontFamily: 'var(--font-heading)' }}>
                      {train.departure_time}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      {train.source_code}
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                      {train.duration_str}
                    </span>
                    <div style={{ width: '60px', height: '2px', background: 'var(--rail-cyan)', margin: '4px 0' }} />
                  </div>

                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontSize: '1.2rem', fontWeight: 800, fontFamily: 'var(--font-heading)' }}>
                      {train.arrival_time}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      {train.destination_code}
                    </div>
                  </div>

                  <button 
                    className="btn btn-secondary btn-sm"
                    onClick={() => handleOpenHalts(train.id)}
                    title="View Route & Schedule Stops"
                  >
                    <Info size={15} /> Schedule
                  </button>
                </div>
              </div>

              {/* Class Availability Tiles */}
              <div>
                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '0.75rem' }}>
                  Select Travel Class & Fare
                </div>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                  gap: '0.85rem'
                }}>
                  {train.classes.map(c => {
                    const isAvail = c.status_label.startsWith('AVAILABLE');
                    const isRac = c.status_label.startsWith('RAC');

                    return (
                      <div
                        key={c.coach_type}
                        style={{
                          background: 'rgba(255, 255, 255, 0.03)',
                          border: '1px solid var(--border-card)',
                          borderRadius: '0.75rem',
                          padding: '0.85rem',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between',
                          gap: '0.65rem',
                          transition: 'all var(--transition-fast)'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <span style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--text-primary)' }}>
                            {c.coach_type}
                          </span>
                          <span style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--rail-cyan)' }}>
                            ₹{c.fare}
                          </span>
                        </div>

                        <div>
                          <div style={{
                            fontSize: '0.8rem',
                            fontWeight: 700,
                            color: isAvail ? '#34d399' : isRac ? '#fbbf24' : '#f87171'
                          }}>
                            {c.status_label}
                          </div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                            {c.class_name}
                          </div>
                        </div>

                        <button
                          className="btn btn-primary btn-sm"
                          style={{ width: '100%', marginTop: '0.25rem' }}
                          onClick={() => handleBook(train, c)}
                        >
                          Book Now <ChevronRight size={14} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Halts & Schedule Modal */}
      {haltsModalOpen && selectedTrainDetails && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1rem'
        }}>
          <div className="glass-card" style={{
            maxWidth: '650px',
            width: '100%',
            maxHeight: '85vh',
            overflowY: 'auto',
            position: 'relative'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-card)', paddingBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Train size={22} color="#38bdf8" />
                <h3 style={{ fontSize: '1.25rem' }}>
                  {selectedTrainDetails.train_number} - {selectedTrainDetails.name}
                </h3>
              </div>
              <button 
                onClick={() => setHaltsModalOpen(false)}
                className="btn btn-secondary btn-sm"
                style={{ padding: '0.35rem', borderRadius: '50%' }}
              >
                <X size={18} />
              </button>
            </div>

            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Stop</th>
                    <th>Station</th>
                    <th>Arr</th>
                    <th>Dep</th>
                    <th>PF</th>
                    <th>Dist</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedTrainDetails.schedules.map(sch => (
                    <tr key={sch.id}>
                      <td>#{sch.stop_number}</td>
                      <td>
                        <strong>{sch.station_name}</strong> ({sch.station_code})
                      </td>
                      <td>{sch.arrival_time}</td>
                      <td>{sch.departure_time}</td>
                      <td>PF {sch.platform_number}</td>
                      <td>{sch.distance_from_source_km} km</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
