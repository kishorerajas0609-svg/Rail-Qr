import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Users, 
  Ticket, 
  Train, 
  ShieldCheck, 
  AlertTriangle, 
  DollarSign, 
  QrCode, 
  Download, 
  RefreshCw, 
  Search,
  Filter,
  UserCheck,
  Database,
  ClipboardList,
  Layers,
  ArrowRight,
  Activity
} from 'lucide-react';
import { api } from '../services/api';

export default function AdminDashboard({ navigate }) {
  const [analytics, setAnalytics] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);
  const [resultFilter, setResultFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, [resultFilter]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [analyticsData, logsData] = await Promise.all([
        api.getAdminAnalytics(),
        api.getAuditLogs(100, resultFilter || null)
      ]);
      setAnalytics(analyticsData);
      setAuditLogs(logsData);
    } catch (err) {
      console.error('Failed to load admin dashboard data', err);
    } finally {
      setLoading(false);
    }
  };

  const exportAuditCSV = () => {
    if (!auditLogs || auditLogs.length === 0) return;
    const headers = ['Scan ID', 'Timestamp', 'Result', 'PNR', 'Ticket No', 'Passenger', 'Train', 'Staff Badge', 'Station', 'Scan Count', 'Notes'];
    const rows = auditLogs.map(l => [
      l.id,
      l.scan_timestamp,
      l.scan_result,
      l.pnr || 'N/A',
      l.ticket_number || 'N/A',
      `"${l.passenger_name || 'N/A'}"`,
      l.train_number || 'N/A',
      l.staff_badge || 'N/A',
      l.station_code || 'N/A',
      l.scan_count,
      `"${l.notes || ''}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `SmartRail_Audit_Logs_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredLogs = auditLogs.filter(log => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      (log.pnr && log.pnr.toLowerCase().includes(q)) ||
      (log.passenger_name && log.passenger_name.toLowerCase().includes(q)) ||
      (log.train_number && log.train_number.toLowerCase().includes(q)) ||
      (log.staff_badge && log.staff_badge.toLowerCase().includes(q)) ||
      (log.scan_result && log.scan_result.toLowerCase().includes(q))
    );
  });

  const getResultBadge = (result) => {
    switch (result) {
      case 'VALID':
        return <span className="badge badge-valid">Valid</span>;
      case 'DUPLICATE_SCAN':
        return <span className="badge badge-duplicate">Duplicate Scan</span>;
      case 'CANCELLED':
        return <span className="badge badge-invalid">Cancelled</span>;
      case 'EXPIRED':
        return <span className="badge badge-invalid">Expired</span>;
      case 'INVALID_TOKEN':
        return <span className="badge badge-invalid">Counterfeit / Invalid</span>;
      default:
        return <span className="badge badge-unverified">{result}</span>;
    }
  };

  return (
    <div>
      {/* Dashboard Top Header */}
      <div className="dashboard-header">
        <div className="dashboard-title-group">
          <h1>Central Railway Operations & Analytics</h1>
          <div className="dashboard-subtitle">
            Real-time digital ticket verification metrics, security audit trail, and fraud monitoring
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button className="btn btn-secondary btn-sm" onClick={() => navigate('admin-trains')}>
            <Train size={16} /> Manage Trains
          </button>
          <button className="btn btn-secondary btn-sm" onClick={() => navigate('admin-staff')}>
            <UserCheck size={16} /> Manage Staff
          </button>
          <button className="btn btn-primary btn-sm" onClick={fetchDashboardData}>
            <RefreshCw size={16} /> Refresh
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      {analytics && (
        <div className="kpi-grid">
          <div className="kpi-card">
            <div>
              <div className="kpi-label">Total Reservations</div>
              <div className="kpi-value">{analytics.total_reservations}</div>
            </div>
            <div className="kpi-icon-box">
              <Ticket size={24} />
            </div>
          </div>

          <div className="kpi-card">
            <div>
              <div className="kpi-label">Total Passengers</div>
              <div className="kpi-value">{analytics.total_passengers}</div>
            </div>
            <div className="kpi-icon-box">
              <Users size={24} />
            </div>
          </div>

          <div className="kpi-card success-card">
            <div>
              <div className="kpi-label">Verified / Boarded</div>
              <div className="kpi-value" style={{ color: '#34d399' }}>{analytics.verified_tickets}</div>
            </div>
            <div className="kpi-icon-box">
              <ShieldCheck size={24} />
            </div>
          </div>

          <div className="kpi-card alert-card">
            <div>
              <div className="kpi-label">Duplicate Scan Alerts</div>
              <div className="kpi-value" style={{ color: '#fbbf24' }}>{analytics.duplicate_scan_alerts}</div>
            </div>
            <div className="kpi-icon-box">
              <AlertTriangle size={24} />
            </div>
          </div>

          <div className="kpi-card danger-card">
            <div>
              <div className="kpi-label">Suspicious / Cancelled</div>
              <div className="kpi-value" style={{ color: '#f87171' }}>{analytics.suspicious_attempts}</div>
            </div>
            <div className="kpi-icon-box">
              <Activity size={24} />
            </div>
          </div>

          <div className="kpi-card">
            <div>
              <div className="kpi-label">Total Fare Revenue</div>
              <div className="kpi-value" style={{ color: 'var(--rail-cyan)' }}>₹{analytics.total_revenue.toLocaleString()}</div>
            </div>
            <div className="kpi-icon-box">
              <DollarSign size={24} />
            </div>
          </div>
        </div>
      )}

      {/* Central Admin Operations Hub */}
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.75rem' }}>
          Central Control & Management Modules (Full Admin Authority)
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
          {/* TTE / Staff Manager */}
          <div 
            className="glass-card" 
            style={{ 
              padding: '1.25rem', 
              cursor: 'pointer', 
              transition: 'all 0.2s', 
              border: '1px solid var(--border-card)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}
            onClick={() => navigate('admin-staff')}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <div style={{ width: '38px', height: '38px', borderRadius: '0.5rem', background: 'rgba(56, 189, 248, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <UserCheck size={20} color="#38bdf8" />
                </div>
                <span className="badge badge-boarded">TTR & Staff</span>
              </div>
              <h3 style={{ fontSize: '1.05rem', marginBottom: '0.35rem' }}>TTR & Staff Management</h3>
              <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', margin: 0 }}>
                Provision TTE examiners, inspect badge IDs, reassign trains & stations, activate/suspend duty.
              </p>
            </div>
            <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#38bdf8', fontSize: '0.825rem', fontWeight: 600 }}>
              Open Staff Manager <ArrowRight size={14} />
            </div>
          </div>

          {/* Passenger Manager */}
          <div 
            className="glass-card" 
            style={{ 
              padding: '1.25rem', 
              cursor: 'pointer', 
              transition: 'all 0.2s', 
              border: '1px solid var(--border-card)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}
            onClick={() => navigate('admin-passengers')}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <div style={{ width: '38px', height: '38px', borderRadius: '0.5rem', background: 'rgba(168, 85, 247, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Users size={20} color="#a855f7" />
                </div>
                <span className="badge badge-valid">Passengers</span>
              </div>
              <h3 style={{ fontSize: '1.05rem', marginBottom: '0.35rem' }}>Passenger Directory</h3>
              <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', margin: 0 }}>
                Manage registered passengers, review PNR bookings history, edit details, and suspend fraudulent users.
              </p>
            </div>
            <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#a855f7', fontSize: '0.825rem', fontWeight: 600 }}>
              Open Passenger Manager <ArrowRight size={14} />
            </div>
          </div>

          {/* Database & System */}
          <div 
            className="glass-card" 
            style={{ 
              padding: '1.25rem', 
              cursor: 'pointer', 
              transition: 'all 0.2s', 
              border: '1px solid var(--border-card)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}
            onClick={() => navigate('admin-database')}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <div style={{ width: '38px', height: '38px', borderRadius: '0.5rem', background: 'rgba(34, 197, 94, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Database size={20} color="#4ade80" />
                </div>
                <span className="badge badge-valid">Database</span>
              </div>
              <h3 style={{ fontSize: '1.05rem', marginBottom: '0.35rem' }}>Database & System Engine</h3>
              <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', margin: 0 }}>
                Live schema table browser (all 14 tables), token cleanup, JSON database export, and demo re-seeding.
              </p>
            </div>
            <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#4ade80', fontSize: '0.825rem', fontWeight: 600 }}>
              Open Database Manager <ArrowRight size={14} />
            </div>
          </div>

          {/* Reservations Ledger */}
          <div 
            className="glass-card" 
            style={{ 
              padding: '1.25rem', 
              cursor: 'pointer', 
              transition: 'all 0.2s', 
              border: '1px solid var(--border-card)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}
            onClick={() => navigate('admin-reservations')}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <div style={{ width: '38px', height: '38px', borderRadius: '0.5rem', background: 'rgba(245, 158, 11, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Ticket size={20} color="#fbbf24" />
                </div>
                <span className="badge badge-secondary">All PNRs</span>
              </div>
              <h3 style={{ fontSize: '1.05rem', marginBottom: '0.35rem' }}>Global Reservation Ledger</h3>
              <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', margin: 0 }}>
                Search any PNR network-wide, inspect passenger berths & QR tokens, execute admin force-cancellations.
              </p>
            </div>
            <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#fbbf24', fontSize: '0.825rem', fontWeight: 600 }}>
              Open Reservation Ledger <ArrowRight size={14} />
            </div>
          </div>

          {/* Train Fleet */}
          <div 
            className="glass-card" 
            style={{ 
              padding: '1.25rem', 
              cursor: 'pointer', 
              transition: 'all 0.2s', 
              border: '1px solid var(--border-card)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}
            onClick={() => navigate('admin-trains')}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <div style={{ width: '38px', height: '38px', borderRadius: '0.5rem', background: 'rgba(2, 132, 199, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Train size={20} color="#0284c7" />
                </div>
                <span className="badge badge-boarded">Fleet</span>
              </div>
              <h3 style={{ fontSize: '1.05rem', marginBottom: '0.35rem' }}>Train Fleet & Coaches</h3>
              <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', margin: 0 }}>
                Manage high-speed trains, toggle active operational status, and inspect coaches & route distance.
              </p>
            </div>
            <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#0284c7', fontSize: '0.825rem', fontWeight: 600 }}>
              Open Train Manager <ArrowRight size={14} />
            </div>
          </div>

          {/* TTE Scanner Access */}
          <div 
            className="glass-card" 
            style={{ 
              padding: '1.25rem', 
              cursor: 'pointer', 
              transition: 'all 0.2s', 
              border: '1px solid var(--border-card)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}
            onClick={() => navigate('scanner')}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <div style={{ width: '38px', height: '38px', borderRadius: '0.5rem', background: 'rgba(239, 68, 68, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <QrCode size={20} color="#f87171" />
                </div>
                <span className="badge badge-duplicate">Field Scanner</span>
              </div>
              <h3 style={{ fontSize: '1.05rem', marginBottom: '0.35rem' }}>Universal TTE Scanner</h3>
              <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', margin: 0 }}>
                Admin scanner authority: camera barcode scanner, anti-duplicate fraud check, and boarding status update.
              </p>
            </div>
            <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#f87171', fontSize: '0.825rem', fontWeight: 600 }}>
              Launch TTE Scanner <ArrowRight size={14} />
            </div>
          </div>
        </div>
      </div>


      {/* Live Verification Audit Stream */}
      <div className="glass-card">
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1.25rem',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <QrCode size={20} color="#38bdf8" /> Live Verification Scan Audit Stream
            </h2>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Complete chronological ledger of all digital QR scans across station checkpoints
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
            {/* Result Filter */}
            <select
              className="form-select"
              value={resultFilter}
              onChange={e => setResultFilter(e.target.value)}
              style={{ padding: '0.45rem 0.75rem', fontSize: '0.825rem' }}
            >
              <option value="">All Scan Results</option>
              <option value="VALID">Valid Scans Only</option>
              <option value="DUPLICATE_SCAN">Duplicate Scans (Alerts)</option>
              <option value="CANCELLED">Cancelled Tickets</option>
              <option value="INVALID_TOKEN">Counterfeit Tokens</option>
            </select>

            <button className="btn btn-secondary btn-sm" onClick={exportAuditCSV}>
              <Download size={15} /> Export CSV
            </button>
          </div>
        </div>

        {/* Search Toolbar */}
        <div className="toolbar-container">
          <div className="search-input-box" style={{ width: '100%', maxWidth: '380px' }}>
            <Search size={16} color="var(--text-muted)" />
            <input
              type="text"
              placeholder="Search PNR, Passenger, Train, Staff..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Audit Log Table */}
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Scan Time</th>
                <th>Result</th>
                <th>PNR</th>
                <th>Passenger</th>
                <th>Train</th>
                <th>Inspector Badge</th>
                <th>Scan #</th>
                <th>Device & Notes</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-secondary)' }}>
                    No verification records found.
                  </td>
                </tr>
              ) : (
                filteredLogs.map(log => (
                  <tr key={log.id}>
                    <td>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>
                        {new Date(log.scan_timestamp).toLocaleString()}
                      </div>
                    </td>
                    <td>{getResultBadge(log.scan_result)}</td>
                    <td>
                      <code style={{ color: 'var(--rail-cyan)', fontFamily: 'var(--font-mono)' }}>
                        {log.pnr || 'N/A'}
                      </code>
                    </td>
                    <td>
                      <strong>{log.passenger_name || 'Anonymous / Counterfeit'}</strong>
                    </td>
                    <td>{log.train_number || 'N/A'}</td>
                    <td>
                      <span className="badge badge-unverified" style={{ fontSize: '0.7rem' }}>
                        {log.staff_badge || 'Terminal'}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontWeight: 700, color: log.scan_count > 1 ? '#fbbf24' : 'var(--text-primary)' }}>
                        #{log.scan_count}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {log.notes || log.device_info}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
