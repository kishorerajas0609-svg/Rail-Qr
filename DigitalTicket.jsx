import React, { useState } from 'react';
import { 
  Train, 
  QrCode, 
  Printer, 
  Copy, 
  Check, 
  ShieldCheck, 
  Clock, 
  Calendar, 
  User, 
  MapPin, 
  ArrowRight,
  AlertCircle
} from 'lucide-react';

export default function DigitalTicket({ reservation, onCancel = null, showCancel = false }) {
  const [selectedTicketIndex, setSelectedTicketIndex] = useState(0);
  const [copiedToken, setCopiedToken] = useState(false);

  if (!reservation || !reservation.tickets || reservation.tickets.length === 0) {
    return (
      <div className="glass-card" style={{ textAlign: 'center', padding: '3rem' }}>
        <AlertCircle size={40} color="#f59e0b" style={{ margin: '0 auto 1rem' }} />
        <h3>Ticket Data Unavailable</h3>
        <p style={{ color: 'var(--text-secondary)' }}>Could not load ticket verification pass.</p>
      </div>
    );
  }

  const currentTicket = reservation.tickets[selectedTicketIndex] || reservation.tickets[0];
  const passenger = currentTicket.passenger;

  const handleCopyToken = () => {
    if (currentTicket.qr_token_string) {
      navigator.clipboard.writeText(currentTicket.qr_token_string);
      setCopiedToken(true);
      setTimeout(() => setCopiedToken(false), 2000);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const getStatusBadge = (bStatus, isCancelled) => {
    if (isCancelled || reservation.booking_status === 'Cancelled') {
      return <span className="badge badge-invalid">Cancelled</span>;
    }
    switch (bStatus) {
      case 'BOARDED':
        return <span className="badge badge-boarded">Boarded</span>;
      case 'VERIFIED':
        return <span className="badge badge-valid">Verified</span>;
      default:
        return <span className="badge badge-unverified">Not Verified</span>;
    }
  };

  return (
    <div className="ticket-wrapper">
      {/* Multi-passenger selection tabs if booking has multiple passengers */}
      {reservation.tickets.length > 1 && (
        <div style={{
          display: 'flex',
          gap: '0.5rem',
          marginBottom: '1rem',
          overflowX: 'auto',
          paddingBottom: '0.25rem'
        }}>
          {reservation.tickets.map((tkt, idx) => (
            <button
              key={tkt.id}
              onClick={() => setSelectedTicketIndex(idx)}
              className={`btn btn-sm ${selectedTicketIndex === idx ? 'btn-primary' : 'btn-secondary'}`}
              style={{ borderRadius: '0.5rem' }}
            >
              <User size={14} /> Passenger {idx + 1}: {tkt.passenger.full_name}
            </button>
          ))}
        </div>
      )}

      {/* Main Ticket Card */}
      <div className="ticket-card">
        {/* Holographic Security Strip */}
        <div className="ticket-hologram-strip" />

        {/* Ticket Header */}
        <div className="ticket-header">
          <div className="ticket-brand">
            <div className="ticket-brand-icon">
              <Train size={24} />
            </div>
            <div>
              <div className="ticket-brand-title">INDIAN RAILWAYS SMART PASS</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                {reservation.train_number} • {reservation.train_name} ({reservation.travel_class})
              </div>
            </div>
          </div>
          <div className="ticket-pnr-tag">
            <div className="ticket-pnr-label">PNR NUMBER</div>
            <div className="ticket-pnr-value">{reservation.pnr}</div>
          </div>
        </div>

        {/* Route Section */}
        <div className="ticket-route">
          <div className="station-node">
            <div className="station-code">{reservation.source_station_code}</div>
            <div className="station-name">{reservation.source_station_name}</div>
            <div className="station-time">Dep: {reservation.departure_time}</div>
          </div>

          <div className="route-mid">
            <div className="route-train-pill">
              <Train size={13} /> {reservation.train_type}
            </div>
            <div className="route-line" />
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              <Calendar size={12} style={{ display: 'inline', marginRight: '3px' }} />
              {reservation.journey_date}
            </div>
          </div>

          <div className="station-node destination">
            <div className="station-code">{reservation.destination_station_code}</div>
            <div className="station-name">{reservation.destination_station_name}</div>
            <div className="station-time">Arr: {reservation.arrival_time}</div>
          </div>
        </div>

        {/* Perforation Divider */}
        <div className="ticket-perforation">
          <div className="notch-left" />
          <div className="perforation-dashed" />
          <div className="notch-right" />
        </div>

        {/* Passenger & QR Section Grid */}
        <div className="ticket-details-grid">
          <div className="passenger-info-box">
            <div className="info-row">
              <span className="info-label">Passenger Name</span>
              <span className="info-val">{passenger.full_name} ({passenger.age}y, {passenger.gender})</span>
            </div>
            <div className="info-row">
              <span className="info-label">Ticket No.</span>
              <span className="info-val" style={{ fontFamily: 'var(--font-mono)' }}>{currentTicket.ticket_number}</span>
            </div>
            <div className="info-row">
              <span className="info-label">ID Proof</span>
              <span className="info-val">{passenger.id_proof_type}: {passenger.id_proof_number || 'Verified'}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Quota & Class</span>
              <span className="info-val">{reservation.quota} Quota • Class {reservation.travel_class}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Fare Paid</span>
              <span className="info-val" style={{ color: '#38bdf8' }}>₹{reservation.total_fare}</span>
            </div>

            {/* Coach & Berth Callout Box */}
            <div className="berth-highlight-box">
              <div>
                <div className="berth-unit-title">Coach</div>
                <div className="berth-unit-val">{passenger.allotted_coach || 'WL'}</div>
              </div>
              <div>
                <div className="berth-unit-title">Berth / Seat</div>
                <div className="berth-unit-val">
                  {passenger.allotted_berth_number ? `${passenger.allotted_berth_number} (${passenger.allotted_berth_type || 'Window'})` : 'Waiting'}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Verification Status:</span>
              {getStatusBadge(currentTicket.boarding_status, currentTicket.is_cancelled)}
            </div>
          </div>

          {/* QR Code Column */}
          <div className="ticket-qr-section">
            <div className="qr-image-container">
              {currentTicket.qr_code_base64 ? (
                <img 
                  src={currentTicket.qr_code_base64} 
                  alt="Digital Verification QR" 
                  className="qr-image" 
                />
              ) : (
                <div style={{ width: '160px', height: '160px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <QrCode size={64} color="#0f172a" />
                </div>
              )}
            </div>
            <div className="qr-scan-hint">
              <ShieldCheck size={14} color="#10b981" />
              <span>Tamper-proof Digital Identity</span>
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
              Scan with TTE Handheld Terminal
            </div>
          </div>
        </div>

        {/* Security Token Bar */}
        <div className="ticket-token-bar">
          <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '75%' }}>
            <span>Token: </span>
            <span>{currentTicket.qr_token_string || 'SRQR-SECURE-TOKEN'}</span>
          </div>
          <button onClick={handleCopyToken} className="token-copy-btn">
            {copiedToken ? <Check size={13} color="#10b981" /> : <Copy size={13} />}
            <span>{copiedToken ? 'Copied' : 'Copy Token'}</span>
          </button>
        </div>
      </div>

      {/* Action Buttons Toolbar */}
      <div className="no-print" style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: '1.25rem',
        flexWrap: 'wrap',
        gap: '0.75rem'
      }}>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn btn-secondary btn-sm" onClick={handlePrint}>
            <Printer size={16} /> Print E-Ticket / Save PDF
          </button>
          <button className="btn btn-secondary btn-sm" onClick={handleCopyToken}>
            <Copy size={16} /> Copy Verification Token
          </button>
        </div>

        {showCancel && reservation.booking_status !== 'Cancelled' && (
          <button 
            className="btn btn-danger btn-sm" 
            onClick={() => onCancel && onCancel(reservation.id)}
          >
            Cancel Ticket
          </button>
        )}
      </div>
    </div>
  );
}
