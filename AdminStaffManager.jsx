import React, { useState, useEffect } from 'react';
import { 
  UserCheck, 
  ArrowLeft, 
  UserPlus, 
  ShieldCheck, 
  Search, 
  Plus, 
  X, 
  Edit3, 
  Trash2, 
  CheckCircle, 
  XCircle, 
  RefreshCw 
} from 'lucide-react';
import { api } from '../services/api';

export default function AdminStaffManager({ navigate }) {
  const [staffList, setStaffList] = useState([]);
  const [trains, setTrains] = useState([]);
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [search, setSearch] = useState('');

  // Create Form State
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('Staff@123');
  const [phone, setPhone] = useState('');
  const [badgeNumber, setBadgeNumber] = useState('');
  const [designation, setDesignation] = useState('Senior Travelling Ticket Examiner');
  const [assignedTrainId, setAssignedTrainId] = useState('');
  const [assignedStationId, setAssignedStationId] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Edit Staff Modal State
  const [editingStaff, setEditingStaff] = useState(null);
  const [editFullName, setEditFullName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editBadge, setEditBadge] = useState('');
  const [editDesignation, setEditDesignation] = useState('');
  const [editTrainId, setEditTrainId] = useState('');
  const [editStationId, setEditStationId] = useState('');
  const [submittingEdit, setSubmittingEdit] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [staffData, trainsData, stationsData] = await Promise.all([
        api.getStaffList(),
        api.getAllTrainsAdmin(),
        api.getStations()
      ]);
      setStaffList(staffData);
      setTrains(trainsData);
      setStations(stationsData);
    } catch (err) {
      console.error('Failed to load staff list', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateStaff = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.createStaff({
        email,
        password,
        full_name: fullName,
        phone,
        role: 'staff',
        badge_number: badgeNumber || `TTE-${Math.floor(100 + Math.random() * 900)}`,
        designation,
        assigned_train_id: assignedTrainId ? parseInt(assignedTrainId) : null,
        assigned_station_id: assignedStationId ? parseInt(assignedStationId) : null
      });
      alert('Staff member registered successfully!');
      setModalOpen(false);
      // Reset
      setFullName('');
      setEmail('');
      setBadgeNumber('');
      fetchData();
    } catch (err) {
      alert(err.message || 'Failed to create staff member');
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenEdit = (staff) => {
    setEditingStaff(staff);
    setEditFullName(staff.full_name);
    setEditPhone(staff.phone || '');
    setEditBadge(staff.badge_number || '');
    setEditDesignation(staff.designation || 'Senior Travelling Ticket Examiner');
    
    // Find matching train and station IDs
    const matchedTrain = trains.find(t => t.train_number === staff.assigned_train);
    setEditTrainId(matchedTrain ? String(matchedTrain.id) : '');

    const matchedStation = stations.find(s => s.code === staff.assigned_station);
    setEditStationId(matchedStation ? String(matchedStation.id) : '');
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    setSubmittingEdit(true);
    try {
      await api.updateStaff(editingStaff.id, {
        full_name: editFullName,
        phone: editPhone,
        badge_number: editBadge,
        designation: editDesignation,
        assigned_train_id: editTrainId ? parseInt(editTrainId) : 0,
        assigned_station_id: editStationId ? parseInt(editStationId) : 0
      });
      alert('Staff details updated successfully!');
      setEditingStaff(null);
      fetchData();
    } catch (err) {
      alert(err.message || 'Failed to update staff member');
    } finally {
      setSubmittingEdit(false);
    }
  };

  const handleToggleStatus = async (userId) => {
    try {
      await api.toggleStaffStatus(userId);
      fetchData();
    } catch (err) {
      alert(err.message || 'Failed to toggle staff status');
    }
  };

  const handleDeleteStaff = async (userId, email) => {
    if (!window.confirm(`Permanently remove staff account ${email}?`)) return;
    try {
      await api.deleteStaff(userId);
      fetchData();
    } catch (err) {
      alert(err.message || 'Failed to delete staff member');
    }
  };

  const filteredStaff = staffList.filter(s => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      s.full_name.toLowerCase().includes(q) ||
      s.email.toLowerCase().includes(q) ||
      (s.badge_number && s.badge_number.toLowerCase().includes(q)) ||
      (s.designation && s.designation.toLowerCase().includes(q))
    );
  });

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
            <UserCheck size={28} color="#38bdf8" /> Railway Staff & TTR / TTE Management
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
            Provision ticket examiners, gate inspectors, station supervisors, and assign train routes
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button className="btn btn-secondary btn-sm" onClick={fetchData}>
            <RefreshCw size={15} /> Refresh
          </button>
          <button className="btn btn-primary btn-sm" onClick={() => setModalOpen(true)}>
            <UserPlus size={16} /> Provision New TTR / Staff
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="glass-card" style={{ padding: '1rem', marginBottom: '1.5rem' }}>
        <div style={{ position: 'relative', maxWidth: '400px' }}>
          <input 
            type="text" 
            className="form-input" 
            placeholder="Search by staff name, badge, email, or role..." 
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ width: '100%', paddingLeft: '2.5rem' }}
          />
          <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)' }} />
        </div>
      </div>

      {/* Staff Table */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
          <RefreshCw size={28} className="animate-spin" style={{ margin: '0 auto 1rem' }} />
          <div>Loading staff directory...</div>
        </div>
      ) : (
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Staff Name & Email</th>
                <th>Badge No.</th>
                <th>Designation</th>
                <th>Role</th>
                <th>Assigned Train</th>
                <th>Assigned Station</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Admin Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredStaff.map(s => (
                <tr key={s.id}>
                  <td>
                    <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{s.full_name}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{s.email}</div>
                  </td>
                  <td>
                    <code style={{ color: 'var(--rail-cyan)', fontFamily: 'var(--font-mono)' }}>
                      {s.badge_number}
                    </code>
                  </td>
                  <td>{s.designation}</td>
                  <td>
                    <span className={`badge ${s.role === 'admin' ? 'badge-duplicate' : 'badge-boarded'}`}>
                      {s.role}
                    </span>
                  </td>
                  <td>{s.assigned_train || <span style={{ color: 'var(--text-muted)' }}>All Trains</span>}</td>
                  <td>{s.assigned_station || <span style={{ color: 'var(--text-muted)' }}>Network-wide</span>}</td>
                  <td>
                    {s.is_active ? (
                      <span className="badge badge-valid" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>
                        <CheckCircle size={12} /> Active
                      </span>
                    ) : (
                      <span className="badge badge-invalid" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>
                        <XCircle size={12} /> Inactive
                      </span>
                    )}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end' }}>
                      <button 
                        className="btn btn-secondary btn-sm" 
                        onClick={() => handleOpenEdit(s)}
                        title="Edit Staff Member"
                        style={{ padding: '0.4rem' }}
                      >
                        <Edit3 size={15} color="#38bdf8" />
                      </button>

                      {s.role !== 'admin' && (
                        <>
                          <button 
                            className="btn btn-secondary btn-sm" 
                            onClick={() => handleToggleStatus(s.id)}
                            title={s.is_active ? "Deactivate Staff" : "Activate Staff"}
                            style={{ padding: '0.4rem', color: s.is_active ? '#f87171' : '#4ade80' }}
                          >
                            {s.is_active ? <XCircle size={15} /> : <CheckCircle size={15} />}
                          </button>

                          <button 
                            className="btn btn-secondary btn-sm" 
                            onClick={() => handleDeleteStaff(s.id, s.email)}
                            title="Delete Staff Account"
                            style={{ padding: '0.4rem', color: '#f87171' }}
                          >
                            <Trash2 size={15} />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Provision Staff Modal */}
      {modalOpen && (
        <div className="modal-backdrop">
          <div className="modal-card" style={{ maxWidth: '540px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <UserPlus size={20} color="#38bdf8" /> Provision Staff / TTE Account
              </h3>
              <button onClick={() => setModalOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateStaff}>
              <div className="form-group">
                <label className="form-label">Full Name *</label>
                <input
                  type="text"
                  className="form-input"
                  required
                  placeholder="e.g. Rajesh Kumar"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Official Email *</label>
                  <input
                    type="email"
                    className="form-input"
                    required
                    placeholder="rajesh@smartrail.in"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Initial Password *</label>
                  <input
                    type="password"
                    className="form-input"
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Badge Number</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="TTE-NDLS-905"
                    value={badgeNumber}
                    onChange={e => setBadgeNumber(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Designation</label>
                  <select
                    className="form-select"
                    value={designation}
                    onChange={e => setDesignation(e.target.value)}
                  >
                    <option value="Senior Travelling Ticket Examiner">Senior TTE</option>
                    <option value="Travelling Ticket Examiner">Travelling Ticket Examiner (TTE)</option>
                    <option value="Station Gate Inspector">Station Gate Inspector</option>
                    <option value="Station Master">Station Master</option>
                    <option value="Railway Security Inspector">Railway Security Inspector</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Assigned Train</label>
                  <select
                    className="form-select"
                    value={assignedTrainId}
                    onChange={e => setAssignedTrainId(e.target.value)}
                  >
                    <option value="">Any Train / Network</option>
                    {trains.map(t => (
                      <option key={t.id} value={t.id}>{t.train_number} - {t.name}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Assigned Station</label>
                  <select
                    className="form-select"
                    value={assignedStationId}
                    onChange={e => setAssignedStationId(e.target.value)}
                  >
                    <option value="">All Stations</option>
                    {stations.map(st => (
                      <option key={st.id} value={st.id}>{st.code} - {st.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary btn-sm" disabled={submitting}>
                  {submitting ? 'Creating...' : 'Provision Staff'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Staff Modal */}
      {editingStaff && (
        <div className="modal-backdrop">
          <div className="modal-card" style={{ maxWidth: '540px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Edit3 size={20} color="#38bdf8" /> Edit Staff Member: {editingStaff.full_name}
              </h3>
              <button onClick={() => setEditingStaff(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveEdit}>
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input
                  type="text"
                  className="form-input"
                  required
                  value={editFullName}
                  onChange={e => setEditFullName(e.target.value)}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Email (Read Only)</label>
                  <input
                    type="text"
                    className="form-input"
                    disabled
                    value={editingStaff.email}
                    style={{ opacity: 0.6 }}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Phone</label>
                  <input
                    type="text"
                    className="form-input"
                    value={editPhone}
                    onChange={e => setEditPhone(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Badge Number</label>
                  <input
                    type="text"
                    className="form-input"
                    value={editBadge}
                    onChange={e => setEditBadge(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Designation</label>
                  <select
                    className="form-select"
                    value={editDesignation}
                    onChange={e => setEditDesignation(e.target.value)}
                  >
                    <option value="Senior Travelling Ticket Examiner">Senior TTE</option>
                    <option value="Travelling Ticket Examiner">Travelling Ticket Examiner (TTE)</option>
                    <option value="Station Gate Inspector">Station Gate Inspector</option>
                    <option value="Station Master">Station Master</option>
                    <option value="System Administrator">System Administrator</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Assigned Train</label>
                  <select
                    className="form-select"
                    value={editTrainId}
                    onChange={e => setEditTrainId(e.target.value)}
                  >
                    <option value="">Any Train / Unassigned</option>
                    {trains.map(t => (
                      <option key={t.id} value={t.id}>{t.train_number} - {t.name}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Assigned Station</label>
                  <select
                    className="form-select"
                    value={editStationId}
                    onChange={e => setEditStationId(e.target.value)}
                  >
                    <option value="">All Stations</option>
                    {stations.map(st => (
                      <option key={st.id} value={st.id}>{st.code} - {st.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setEditingStaff(null)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary btn-sm" disabled={submittingEdit}>
                  {submittingEdit ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
