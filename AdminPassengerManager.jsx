import React, { useState, useEffect } from 'react';
import { 
  Users, 
  ArrowLeft, 
  Search, 
  RefreshCw, 
  ShieldAlert, 
  CheckCircle, 
  XCircle, 
  Ticket, 
  IndianRupee, 
  Calendar, 
  Phone, 
  Mail, 
  Edit3, 
  Trash2, 
  X, 
  Eye, 
  AlertTriangle 
} from 'lucide-react';
import { api } from '../services/api';

export default function AdminPassengerManager({ navigate }) {
  const [passengers, setPassengers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Edit User Modal
  const [editingUser, setEditingUser] = useState(null);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editRole, setEditRole] = useState('passenger');
  const [submittingEdit, setSubmittingEdit] = useState(false);

  // View Passenger Reservations Modal
  const [selectedUser, setSelectedUser] = useState(null);
  const [userReservations, setUserReservations] = useState([]);
  const [loadingReservations, setLoadingReservations] = useState(false);

  useEffect(() => {
    fetchPassengers();
  }, [statusFilter]);

  const fetchPassengers = async () => {
    setLoading(true);
    try {
      const data = await api.getAdminPassengers(search, statusFilter);
      setPassengers(data);
    } catch (err) {
      console.error('Failed to load passengers', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchPassengers();
  };

  const handleToggleStatus = async (userId) => {
    try {
      await api.toggleUserStatus(userId);
      fetchPassengers();
    } catch (err) {
      alert(err.message || 'Failed to toggle user status');
    }
  };

  const handleDeleteUser = async (userId, email) => {
    if (!window.confirm(`Are you sure you want to permanently delete passenger account ${email}?`)) {
      return;
    }
    try {
      await api.deleteUser(userId);
      fetchPassengers();
    } catch (err) {
      alert(err.message || 'Failed to delete user');
    }
  };

  const handleOpenEdit = (user) => {
    setEditingUser(user);
    setEditName(user.full_name);
    setEditPhone(user.phone || '');
    setEditRole(user.role);
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    setSubmittingEdit(true);
    try {
      await api.updateUser(editingUser.id, {
        full_name: editName,
        phone: editPhone,
        role: editRole
      });
      setEditingUser(null);
      fetchPassengers();
    } catch (err) {
      alert(err.message || 'Failed to update user');
    } finally {
      setSubmittingEdit(false);
    }
  };

  const handleViewReservations = async (user) => {
    setSelectedUser(user);
    setLoadingReservations(true);
    try {
      const resData = await api.getPassengerReservations(user.id);
      setUserReservations(resData);
    } catch (err) {
      console.error('Failed to fetch user reservations', err);
      setUserReservations([]);
    } finally {
      setLoadingReservations(false);
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
            <Users size={28} color="#38bdf8" /> Central Passenger Management
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
            Manage registered travelers, inspect booking records, update profiles, and control account status
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button className="btn btn-secondary btn-sm" onClick={fetchPassengers}>
            <RefreshCw size={15} /> Refresh
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
              placeholder="Search passengers by name, email, or phone..." 
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

        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Status:</span>
          <select 
            className="form-select" 
            value={statusFilter} 
            onChange={e => setStatusFilter(e.target.value)}
            style={{ width: 'auto', padding: '0.45rem 1rem' }}
          >
            <option value="">All Passengers</option>
            <option value="active">Active Only</option>
            <option value="inactive">Suspended Only</option>
          </select>
        </div>
      </div>

      {/* Passengers Table */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
          <RefreshCw size={28} className="animate-spin" style={{ margin: '0 auto 1rem' }} />
          <div>Loading passenger directory...</div>
        </div>
      ) : passengers.length === 0 ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
          <Users size={40} style={{ opacity: 0.4, margin: '0 auto 1rem' }} />
          <h3>No Passengers Found</h3>
          <p>No passenger accounts match the current filter criteria.</p>
        </div>
      ) : (
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Passenger Info</th>
                <th>Contact</th>
                <th>Total Bookings</th>
                <th>Total Spent</th>
                <th>Account Status</th>
                <th>Joined</th>
                <th style={{ textAlign: 'right' }}>Admin Actions</th>
              </tr>
            </thead>
            <tbody>
              {passengers.map(p => (
                <tr key={p.id}>
                  <td>
                    <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.95rem' }}>
                      {p.full_name}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <Mail size={13} /> {p.email}
                    </div>
                  </td>

                  <td>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <Phone size={13} /> {p.phone || 'N/A'}
                    </div>
                  </td>

                  <td>
                    <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                      <span className="badge badge-valid" title="Confirmed Bookings">
                        {p.confirmed_tickets} CNF
                      </span>
                      {p.cancelled_tickets > 0 && (
                        <span className="badge badge-invalid" title="Cancelled Bookings">
                          {p.cancelled_tickets} CAN
                        </span>
                      )}
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        ({p.total_bookings} total)
                      </span>
                    </div>
                  </td>

                  <td>
                    <div style={{ fontWeight: 700, color: '#38bdf8' }}>
                      ₹{p.total_spent.toLocaleString('en-IN')}
                    </div>
                  </td>

                  <td>
                    {p.is_active ? (
                      <span className="badge badge-valid" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                        <CheckCircle size={12} /> Active
                      </span>
                    ) : (
                      <span className="badge badge-invalid" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                        <XCircle size={12} /> Suspended
                      </span>
                    )}
                  </td>

                  <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {new Date(p.created_at).toLocaleDateString()}
                  </td>

                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end' }}>
                      <button 
                        className="btn btn-secondary btn-sm" 
                        onClick={() => handleViewReservations(p)}
                        title="View Bookings History"
                        style={{ padding: '0.4rem' }}
                      >
                        <Eye size={15} color="#38bdf8" />
                      </button>

                      <button 
                        className="btn btn-secondary btn-sm" 
                        onClick={() => handleOpenEdit(p)}
                        title="Edit Passenger Info"
                        style={{ padding: '0.4rem' }}
                      >
                        <Edit3 size={15} />
                      </button>

                      <button 
                        className="btn btn-secondary btn-sm" 
                        onClick={() => handleToggleStatus(p.id)}
                        title={p.is_active ? "Suspend Passenger Account" : "Activate Passenger Account"}
                        style={{ padding: '0.4rem', color: p.is_active ? '#f87171' : '#4ade80' }}
                      >
                        {p.is_active ? <XCircle size={15} /> : <CheckCircle size={15} />}
                      </button>

                      <button 
                        className="btn btn-secondary btn-sm" 
                        onClick={() => handleDeleteUser(p.id, p.email)}
                        title="Delete Passenger Account"
                        style={{ padding: '0.4rem', color: '#f87171' }}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Edit User Modal */}
      {editingUser && (
        <div className="modal-backdrop">
          <div className="modal-card" style={{ maxWidth: '480px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h2 style={{ fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Edit3 size={20} color="#38bdf8" /> Edit Passenger Profile
              </h2>
              <button onClick={() => setEditingUser(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
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
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Email Address (Read Only)</label>
                <input 
                  type="text" 
                  className="form-input" 
                  disabled 
                  value={editingUser.email}
                  style={{ opacity: 0.6 }}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Phone Number</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={editPhone}
                  onChange={e => setEditPhone(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Account Role</label>
                <select 
                  className="form-select" 
                  value={editRole}
                  onChange={e => setEditRole(e.target.value)}
                >
                  <option value="passenger">Passenger</option>
                  <option value="staff">Staff / TTE</option>
                  <option value="admin">System Admin</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setEditingUser(null)}>
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

      {/* Passenger Bookings History Modal */}
      {selectedUser && (
        <div className="modal-backdrop">
          <div className="modal-card" style={{ maxWidth: '750px', maxHeight: '85vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div>
                <h2 style={{ fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Ticket size={20} color="#38bdf8" /> Bookings for {selectedUser.full_name}
                </h2>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  {selectedUser.email} • {userReservations.length} total reservations recorded
                </div>
              </div>
              <button onClick={() => setSelectedUser(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            {loadingReservations ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 0.75rem' }} />
                <div>Fetching reservation history...</div>
              </div>
            ) : userReservations.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                <p>This passenger has no booking records yet.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {userReservations.map(res => (
                  <div key={res.id} className="glass-card" style={{ padding: '1rem', border: '1px solid var(--border-card)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--rail-cyan)' }}>
                          PNR: {res.pnr}
                        </span>
                        <span className={`badge ${res.booking_status === 'Confirmed' ? 'badge-valid' : 'badge-invalid'}`}>
                          {res.booking_status}
                        </span>
                      </div>
                      <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                        ₹{res.total_fare}
                      </div>
                    </div>

                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                      <strong>{res.train_number} - {res.train_name}</strong> • {res.source_station_code} → {res.destination_station_code} ({res.journey_date}) • Class {res.travel_class}
                    </div>

                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      <strong>Passengers:</strong> {res.passengers.map(p => `${p.full_name} (${p.allotted_coach}-${p.allotted_berth_number || 'WL'})`).join(', ')}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
              <button className="btn btn-secondary btn-sm" onClick={() => setSelectedUser(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
