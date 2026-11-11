import React, { useState, useEffect } from 'react';
import { 
  Database, 
  ArrowLeft, 
  RefreshCw, 
  Download, 
  Trash2, 
  CheckCircle, 
  Search, 
  Table, 
  FileText, 
  HardDrive, 
  ShieldCheck, 
  Layers, 
  X, 
  Eye 
} from 'lucide-react';
import { api } from '../services/api';

export default function AdminDatabaseManager({ navigate }) {
  const [overview, setOverview] = useState(null);
  const [loadingOverview, setLoadingOverview] = useState(true);

  // Table Inspector State
  const [selectedTable, setSelectedTable] = useState('users');
  const [tableData, setTableData] = useState(null);
  const [loadingTable, setLoadingTable] = useState(false);
  const [tableSearch, setTableSearch] = useState('');
  const [page, setPage] = useState(0);
  const limit = 30;

  // Row Detail Modal
  const [selectedRow, setSelectedRow] = useState(null);

  // Maintenance action loading
  const [maintenanceLoading, setMaintenanceLoading] = useState(false);

  useEffect(() => {
    fetchOverview();
  }, []);

  useEffect(() => {
    if (selectedTable) {
      fetchTableData(selectedTable, 0);
    }
  }, [selectedTable]);

  const fetchOverview = async () => {
    setLoadingOverview(true);
    try {
      const data = await api.getDatabaseOverview();
      setOverview(data);
    } catch (err) {
      console.error('Failed to load database overview', err);
    } finally {
      setLoadingOverview(false);
    }
  };

  const fetchTableData = async (tableName, pageIndex = 0) => {
    setLoadingTable(true);
    try {
      const data = await api.getDatabaseTable(tableName, limit, pageIndex * limit, tableSearch);
      setTableData(data);
      setPage(pageIndex);
    } catch (err) {
      console.error(`Failed to load table ${tableName}`, err);
    } finally {
      setLoadingTable(false);
    }
  };

  const handleExportSnapshot = async () => {
    try {
      const snapshot = await api.exportDatabaseSnapshot();
      const jsonContent = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(snapshot, null, 2));
      const link = document.createElement('a');
      link.setAttribute('href', jsonContent);
      link.setAttribute('download', `smart_rail_backup_${new Date().toISOString().split('T')[0]}.json`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      alert(err.message || 'Failed to export database snapshot');
    }
  };

  const handleCleanupExpired = async () => {
    if (!window.confirm('Revoke all expired QR tokens in the database?')) return;
    setMaintenanceLoading(true);
    try {
      const res = await api.cleanupExpiredTokens();
      alert(res.message);
      fetchOverview();
      if (selectedTable === 'qr_tokens') fetchTableData('qr_tokens', 0);
    } catch (err) {
      alert(err.message || 'Failed to cleanup tokens');
    } finally {
      setMaintenanceLoading(false);
    }
  };

  const handleResetSeed = async () => {
    if (!window.confirm('Re-seed initial demo stations, trains, and pre-booked tickets?')) return;
    setMaintenanceLoading(true);
    try {
      const res = await api.resetDatabaseSeed();
      alert(res.message);
      fetchOverview();
      fetchTableData(selectedTable, 0);
    } catch (err) {
      alert(err.message || 'Failed to seed database');
    } finally {
      setMaintenanceLoading(false);
    }
  };

  const tableList = [
    'users',
    'staff_profiles',
    'stations',
    'trains',
    'schedules',
    'coaches',
    'berths',
    'fare_rules',
    'reservations',
    'passengers',
    'tickets',
    'qr_tokens',
    'boarding_records',
    'verification_records'
  ];

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
            <Database size={28} color="#38bdf8" /> Central Database & System Engine
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
            Live relational database schema browser, table record inspector, token revocation, and system backups
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button className="btn btn-secondary btn-sm" onClick={handleExportSnapshot} title="Download JSON Database Snapshot">
            <Download size={15} /> Export JSON Snapshot
          </button>
          <button className="btn btn-secondary btn-sm" onClick={handleCleanupExpired} disabled={maintenanceLoading}>
            <Trash2 size={15} color="#f87171" /> Revoke Expired Tokens
          </button>
          <button className="btn btn-secondary btn-sm" onClick={handleResetSeed} disabled={maintenanceLoading}>
            <RefreshCw size={15} /> Re-Seed Demo
          </button>
        </div>
      </div>

      {/* Database KPI Cards */}
      {overview && (
        <div className="kpi-grid" style={{ marginBottom: '1.75rem' }}>
          <div className="kpi-card">
            <div>
              <div className="kpi-label">Storage Engine</div>
              <div className="kpi-value" style={{ fontSize: '1.4rem' }}>{overview.engine}</div>
            </div>
            <div className="kpi-icon-box">
              <HardDrive size={24} color="#38bdf8" />
            </div>
          </div>

          <div className="kpi-card">
            <div>
              <div className="kpi-label">Database File Size</div>
              <div className="kpi-value" style={{ fontSize: '1.4rem' }}>{overview.size_kb} KB</div>
            </div>
            <div className="kpi-icon-box">
              <Layers size={24} color="#a855f7" />
            </div>
          </div>

          <div className="kpi-card">
            <div>
              <div className="kpi-label">Total Database Records</div>
              <div className="kpi-value" style={{ fontSize: '1.4rem' }}>{overview.total_records.toLocaleString()}</div>
            </div>
            <div className="kpi-icon-box">
              <Table size={24} color="#06b6d4" />
            </div>
          </div>

          <div className="kpi-card success-card">
            <div>
              <div className="kpi-label">Integrity Status</div>
              <div className="kpi-value" style={{ fontSize: '1.25rem', color: '#4ade80' }}>
                {overview.status}
              </div>
            </div>
            <div className="kpi-icon-box">
              <CheckCircle size={24} color="#4ade80" />
            </div>
          </div>
        </div>
      )}

      {/* Table Selector Tabs */}
      <div style={{ marginBottom: '1.25rem' }}>
        <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Select Table to Inspect ({tableList.length} Schema Tables)
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {tableList.map(tbl => {
            const count = overview?.table_counts?.[tbl] ?? 0;
            const isSelected = selectedTable === tbl;
            return (
              <button
                key={tbl}
                onClick={() => setSelectedTable(tbl)}
                className={`btn btn-sm ${isSelected ? 'btn-primary' : 'btn-secondary'}`}
                style={{ borderRadius: '2rem', padding: '0.35rem 0.85rem', fontSize: '0.8rem' }}
              >
                <span>{tbl}</span>
                <span style={{ 
                  marginLeft: '0.4rem', 
                  fontSize: '0.7rem', 
                  padding: '0.1rem 0.4rem', 
                  borderRadius: '1rem', 
                  background: isSelected ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.1)' 
                }}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Table Browser View */}
      <div className="glass-card" style={{ padding: '1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Table size={18} color="#38bdf8" />
            <h3 style={{ fontSize: '1.1rem', margin: 0 }}>
              Table: <code>{selectedTable}</code>
            </h3>
            {tableData && (
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                ({tableData.total_records} total rows)
              </span>
            )}
          </div>

          {/* Pagination controls */}
          {tableData && tableData.total_records > limit && (
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <button 
                className="btn btn-secondary btn-sm" 
                disabled={page === 0} 
                onClick={() => fetchTableData(selectedTable, page - 1)}
              >
                Prev
              </button>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                Page {page + 1} of {Math.ceil(tableData.total_records / limit)}
              </span>
              <button 
                className="btn btn-secondary btn-sm" 
                disabled={(page + 1) * limit >= tableData.total_records} 
                onClick={() => fetchTableData(selectedTable, page + 1)}
              >
                Next
              </button>
            </div>
          )}
        </div>

        {loadingTable ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
            <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 0.75rem' }} />
            <div>Loading records for {selectedTable}...</div>
          </div>
        ) : !tableData || tableData.rows.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
            No records in table <code>{selectedTable}</code>.
          </div>
        ) : (
          <div className="table-responsive" style={{ maxHeight: '600px', overflowY: 'auto' }}>
            <table className="data-table" style={{ fontSize: '0.8rem' }}>
              <thead>
                <tr>
                  <th style={{ width: '40px' }}>Row</th>
                  {tableData.columns.map(col => (
                    <th key={col}>{col}</th>
                  ))}
                  <th style={{ textAlign: 'right' }}>JSON</th>
                </tr>
              </thead>
              <tbody>
                {tableData.rows.map((row, idx) => (
                  <tr key={idx}>
                    <td style={{ color: 'var(--text-muted)' }}>{page * limit + idx + 1}</td>
                    {tableData.columns.map(col => {
                      const val = row[col];
                      const displayVal = val === null ? <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>null</span> :
                        typeof val === 'boolean' ? (val ? 'true' : 'false') :
                        String(val);

                      return (
                        <td key={col} style={{ maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={String(val)}>
                          {displayVal}
                        </td>
                      );
                    })}
                    <td style={{ textAlign: 'right' }}>
                      <button 
                        className="btn btn-secondary btn-sm" 
                        onClick={() => setSelectedRow(row)}
                        title="View Full Row JSON"
                        style={{ padding: '0.25rem 0.5rem' }}
                      >
                        <Eye size={13} color="#38bdf8" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Row JSON Detail Modal */}
      {selectedRow && (
        <div className="modal-backdrop">
          <div className="modal-card" style={{ maxWidth: '600px', maxHeight: '80vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.15rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <FileText size={18} color="#38bdf8" /> Record Inspector: {selectedTable}
              </h3>
              <button onClick={() => setSelectedRow(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <pre style={{ 
              background: 'rgba(0, 0, 0, 0.4)', 
              padding: '1rem', 
              borderRadius: '0.5rem', 
              fontSize: '0.8rem', 
              overflowX: 'auto',
              color: '#38bdf8',
              fontFamily: 'monospace'
            }}>
              {JSON.stringify(selectedRow, null, 2)}
            </pre>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
              <button className="btn btn-secondary btn-sm" onClick={() => setSelectedRow(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
