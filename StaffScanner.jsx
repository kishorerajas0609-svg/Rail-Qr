import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { 
  Camera, 
  CameraOff, 
  QrCode, 
  ShieldCheck, 
  AlertTriangle, 
  XCircle, 
  CheckCircle2, 
  RotateCcw, 
  User, 
  Clock, 
  History, 
  Search,
  Zap,
  Volume2,
  VolumeX,
  MapPin,
  Train
} from 'lucide-react';
import { api } from '../services/api';
import { soundFX } from '../components/AudioFeedback';
import { useAuth } from '../context/AuthContext';

export default function StaffScanner({ navigate }) {
  const { user } = useAuth();

  const [isScanning, setIsScanning] = useState(false);
  const [manualInput, setManualInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [verificationResult, setVerificationResult] = useState(null);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [selectedStation, setSelectedStation] = useState(1); // Default to station ID 1
  const [stations, setStations] = useState([]);

  const html5QrCodeRef = useRef(null);

  useEffect(() => {
    api.getStations().then(data => {
      setStations(data);
      if (data.length > 0) setSelectedStation(data[0].id);
    }).catch(err => console.error('Failed to load stations', err));

    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    try {
      if (!html5QrCodeRef.current) {
        html5QrCodeRef.current = new Html5Qrcode('reader');
      }

      const cameras = await Html5Qrcode.getCameras();
      if (cameras && cameras.length > 0) {
        const cameraId = cameras[0].id;
        await html5QrCodeRef.current.start(
          cameraId,
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0
          },
          (decodedText) => {
            handleScanSuccess(decodedText);
          },
          (error) => {
            // Ignore frame decode misses
          }
        );
        setIsScanning(true);
      } else {
        alert('No camera detected on this device. You can test using the Quick Presets or manual entry below.');
      }
    } catch (err) {
      console.warn('Camera start error:', err);
      alert('Camera access could not be started. You can use Quick Presets or file upload to test.');
      setIsScanning(false);
    }
  };

  const stopCamera = async () => {
    if (html5QrCodeRef.current && isScanning) {
      try {
        await html5QrCodeRef.current.stop();
        setIsScanning(false);
      } catch (err) {
        console.warn('Camera stop error:', err);
      }
    }
  };

  const handleScanSuccess = async (scannedString) => {
    if (loading) return;
    setLoading(true);

    try {
      const payload = {
        token_string: scannedString,
        station_id: selectedStation,
        device_info: `Handheld Scanner (${user?.staff_profile?.badge_number || 'TTE-STAFF'})`
      };

      const result = await api.verifyQRScan(payload);
      setVerificationResult(result);

      // Play audio feedback
      if (audioEnabled) {
        if (result.verification_status === 'VALID') {
          soundFX.playSuccess();
        } else if (result.verification_status === 'DUPLICATE_SCAN') {
          soundFX.playWarning();
        } else {
          soundFX.playError();
        }
      }
    } catch (err) {
      console.error('Scan verification failed:', err);
      if (audioEnabled) soundFX.playError();
    } finally {
      setLoading(false);
    }
  };

  const handleManualVerify = (e) => {
    e.preventDefault();
    if (!manualInput.trim()) return;
    handleScanSuccess(manualInput.trim());
  };

  const handlePresetSelect = (tokenOrPnr) => {
    setManualInput(tokenOrPnr);
    handleScanSuccess(tokenOrPnr);
  };

  const handleUpdateBoarding = async (newStatus) => {
    if (!verificationResult?.ticket?.id) return;
    try {
      await api.updateBoardingStatus(
        verificationResult.ticket.id,
        newStatus,
        selectedStation,
        `Marked by ${user?.full_name || 'TTE'}`
      );
      setVerificationResult(prev => ({
        ...prev,
        boarding_status: newStatus,
        ticket: prev.ticket ? { ...prev.ticket, boarding_status: newStatus } : null
      }));
      alert(`Passenger marked as ${newStatus}`);
    } catch (err) {
      alert(err.message || 'Failed to update boarding status');
    }
  };

  const renderStatusBanner = () => {
    if (!verificationResult) return null;

    const { verification_status, message, scan_count, first_scanned_at, warning_reason } = verificationResult;

    if (verification_status === 'VALID') {
      return (
        <div className="hud-status-banner valid">
          <div className="hud-icon-circle" style={{ background: 'rgba(16, 185, 129, 0.25)' }}>
            <CheckCircle2 size={26} color="#34d399" />
          </div>
          <div>
            <div className="hud-status-title">VALID TICKET • CONFIRMED</div>
            <div className="hud-status-subtitle">{message}</div>
          </div>
        </div>
      );
    }

    if (verification_status === 'DUPLICATE_SCAN') {
      return (
        <div className="hud-status-banner duplicate">
          <div className="hud-icon-circle" style={{ background: 'rgba(245, 158, 11, 0.25)' }}>
            <AlertTriangle size={26} color="#fbbf24" />
          </div>
          <div>
            <div className="hud-status-title">DUPLICATE SCAN DETECTED (Scan #{scan_count})</div>
            <div className="hud-status-subtitle">
              First verified: {new Date(first_scanned_at).toLocaleTimeString()}. {warning_reason || 'Inspect prior check-in records.'}
            </div>
          </div>
        </div>
      );
    }

    // Invalid, Cancelled, Expired
    return (
      <div className="hud-status-banner invalid">
        <div className="hud-icon-circle" style={{ background: 'rgba(239, 68, 68, 0.25)' }}>
          <XCircle size={26} color="#f87171" />
        </div>
        <div>
          <div className="hud-status-title">
            {verification_status === 'CANCELLED' ? 'CANCELLED / REFUNDED TICKET' : 'INVALID / UNRECOGNIZED TICKET'}
          </div>
          <div className="hud-status-subtitle">{message}</div>
        </div>
      </div>
    );
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <QrCode size={28} color="#38bdf8" /> Railway Staff Verification Terminal
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.2rem' }}>
            Duty Inspector: <strong>{user?.full_name || 'TTE Inspector'}</strong> (Badge: {user?.badge_number || 'TTE-NDLS-901'})
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button
            onClick={() => setAudioEnabled(!audioEnabled)}
            className="btn btn-secondary btn-sm"
            title="Toggle Audio Feedback"
          >
            {audioEnabled ? <Volume2 size={16} color="#34d399" /> : <VolumeX size={16} color="var(--text-muted)" />}
            <span>Audio {audioEnabled ? 'ON' : 'OFF'}</span>
          </button>

          <button className="btn btn-secondary btn-sm" onClick={() => navigate('manifest')}>
            View Train Chart
          </button>
        </div>
      </div>

      <div className="scanner-terminal-container">
        {/* Left Column: Camera Viewfinder & Presets */}
        <div>
          <div className="viewfinder-card">
            <div className="viewfinder-header">
              <div className="scanner-status-indicator">
                <span className="status-dot" style={{ background: isScanning ? '#10b981' : '#64748b', boxShadow: isScanning ? '0 0 10px #10b981' : 'none' }} />
                <span>{isScanning ? 'CAMERA ACTIVE & READY' : 'SCANNER STANDBY'}</span>
              </div>

              <div>
                {!isScanning ? (
                  <button className="btn btn-primary btn-sm" onClick={startCamera}>
                    <Camera size={15} /> Start Camera
                  </button>
                ) : (
                  <button className="btn btn-secondary btn-sm" onClick={stopCamera}>
                    <CameraOff size={15} /> Stop Camera
                  </button>
                )}
              </div>
            </div>

            {/* Viewfinder Viewport with Reticle & Laser Beam */}
            <div className="camera-viewport">
              <div id="reader" style={{ width: '100%', height: '100%' }} />

              {isScanning && (
                <div className="scanner-overlay">
                  <div className="reticle-box">
                    <div className="reticle-corner corner-tl" />
                    <div className="reticle-corner corner-tr" />
                    <div className="reticle-corner corner-bl" />
                    <div className="reticle-corner corner-br" />
                    <div className="laser-beam" />
                  </div>
                </div>
              )}

              {!isScanning && (
                <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                  <QrCode size={56} color="var(--border-glass)" style={{ margin: '0 auto 1rem' }} />
                  <p style={{ fontWeight: 600 }}>Camera is idle</p>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                    Click "Start Camera" or select a Quick Test Scenario below.
                  </p>
                </div>
              )}
            </div>

            {/* Manual PNR / Token Input Bar */}
            <form onSubmit={handleManualVerify} className="manual-input-box">
              <input
                type="text"
                className="form-input"
                placeholder="Enter PNR (e.g. 842-9182301) or Token string"
                value={manualInput}
                onChange={e => setManualInput(e.target.value)}
                style={{ flex: 1, padding: '0.6rem 0.85rem' }}
              />
              <button type="submit" className="btn btn-primary btn-sm" disabled={loading}>
                <Search size={15} /> Verify
              </button>
            </form>

            {/* Quick Presets Section for Fast Demonstration */}
            <div className="presets-section">
              <div className="presets-title">
                <Zap size={14} style={{ display: 'inline', marginRight: '4px' }} />
                Instant Demo Verification Scenarios
              </div>

              <div className="presets-grid">
                <button 
                  className="preset-btn"
                  onClick={() => handlePresetSelect('842-9182301')}
                >
                  <span style={{ color: '#34d399' }}>✓ Valid Confirmed Ticket</span>
                  <span className="preset-tag">Kishore Raj • Shatabdi C2/36</span>
                </button>

                <button 
                  className="preset-btn"
                  onClick={() => handlePresetSelect('714-4829103')}
                >
                  <span style={{ color: '#38bdf8' }}>✓ Vande Bharat Ticket</span>
                  <span className="preset-tag">Deepika Sharma • EC1/18</span>
                </button>

                <button 
                  className="preset-btn"
                  onClick={() => handlePresetSelect('842-9182301')}
                >
                  <span style={{ color: '#fbbf24' }}>⚠ Re-scan / Duplicate Test</span>
                  <span className="preset-tag">Scan Kishore's ticket again</span>
                </button>

                <button 
                  className="preset-btn"
                  onClick={() => handlePresetSelect('312-8924018')}
                >
                  <span style={{ color: '#f87171' }}>✕ Cancelled Ticket Test</span>
                  <span className="preset-tag">Amit Kumar • Refunded PNR</span>
                </button>

                <button 
                  className="preset-btn"
                  style={{ gridColumn: 'span 2' }}
                  onClick={() => handlePresetSelect('SRQR-COUNTERFEIT-FORGED-TOKEN-999')}
                >
                  <span style={{ color: '#ef4444' }}>✕ Fake / Counterfeit QR Token Test</span>
                  <span className="preset-tag">Unregistered security token hash</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Verification Result HUD */}
        <div>
          {loading && (
            <div className="glass-card" style={{ textAlign: 'center', padding: '3rem' }}>
              <QrCode size={40} color="#38bdf8" className="animate-float" style={{ margin: '0 auto 1rem' }} />
              <h3>Verifying Digital Identity...</h3>
              <p style={{ color: 'var(--text-secondary)' }}>Authenticating signature against Central Railway DB</p>
            </div>
          )}

          {!loading && !verificationResult && (
            <div className="result-hud-card" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
              <ShieldCheck size={56} color="var(--border-glass)" style={{ margin: '0 auto 1.25rem' }} />
              <h3>Awaiting QR Scan</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.5rem' }}>
                Point the camera towards the passenger's Smart QR Pass or click a test scenario on the left to verify.
              </p>
            </div>
          )}

          {!loading && verificationResult && (
            <div className="result-hud-card">
              {/* Status Banner */}
              {renderStatusBanner()}

              {/* Passenger Details if Available */}
              {verificationResult.passenger && (
                <div>
                  <div className="passenger-hud-profile">
                    <div className="hud-avatar">
                      {verificationResult.passenger.full_name.charAt(0)}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div className="hud-name">{verificationResult.passenger.full_name}</div>
                      <div className="hud-subdetails">
                        {verificationResult.passenger.age} yrs • {verificationResult.passenger.gender} • {verificationResult.passenger.id_proof_type}: {verificationResult.passenger.id_proof_number || 'Verified'}
                      </div>
                    </div>
                    <div>
                      <span className="badge badge-valid">
                        {verificationResult.passenger.current_status}
                      </span>
                    </div>
                  </div>

                  {/* Seat & Coach Bar */}
                  <div className="hud-seat-bar">
                    <div className="hud-seat-tile">
                      <div className="hud-seat-label">Coach</div>
                      <div className="hud-seat-val">{verificationResult.passenger.allotted_coach || 'WL'}</div>
                    </div>
                    <div className="hud-seat-tile">
                      <div className="hud-seat-label">Berth No.</div>
                      <div className="hud-seat-val">{verificationResult.passenger.allotted_berth_number || 'Waiting'}</div>
                    </div>
                    <div className="hud-seat-tile">
                      <div className="hud-seat-label">Berth Type</div>
                      <div className="hud-seat-val" style={{ fontSize: '1.05rem', color: 'var(--text-primary)' }}>
                        {verificationResult.passenger.allotted_berth_type || 'Window'}
                      </div>
                    </div>
                  </div>

                  {/* Journey Details */}
                  {verificationResult.reservation && (
                    <div style={{
                      background: 'rgba(255, 255, 255, 0.03)',
                      border: '1px solid var(--border-card)',
                      borderRadius: '0.75rem',
                      padding: '1rem',
                      marginBottom: '1.5rem',
                      fontSize: '0.85rem'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Train:</span>
                        <strong style={{ color: 'var(--text-primary)' }}>
                          {verificationResult.reservation.train_number} - {verificationResult.reservation.train_name}
                        </strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Route:</span>
                        <span>{verificationResult.reservation.source_station_name} → {verificationResult.reservation.destination_station_name}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text-muted)' }}>PNR:</span>
                        <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--rail-cyan)' }}>
                          {verificationResult.reservation.pnr}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Duplicate Scan History Log */}
                  {verificationResult.verification_history && verificationResult.verification_history.length > 0 && (
                    <div className="scan-history-box">
                      <div className="history-title">
                        <History size={15} />
                        <span>Scan Audit Trail ({verificationResult.verification_history.length} scans)</span>
                      </div>
                      {verificationResult.verification_history.map(item => (
                        <div key={item.id} className="history-item">
                          <div>
                            <span style={{ fontWeight: 600, color: item.scan_result === 'VALID' ? '#34d399' : '#fbbf24' }}>
                              {item.scan_result}
                            </span>
                            <span style={{ color: 'var(--text-muted)', marginLeft: '0.4rem' }}>
                              by {item.staff_name} ({item.staff_badge || 'TTE'})
                            </span>
                          </div>
                          <div style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
                            {new Date(item.scan_timestamp).toLocaleTimeString()}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Boarding Controls Action Group */}
                  <div style={{ marginTop: '1.5rem' }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '0.65rem' }}>
                      Boarding Verification Action
                    </div>
                    <div className="boarding-action-group">
                      <button
                        className={`btn btn-sm ${verificationResult.boarding_status === 'VERIFIED' ? 'btn-primary' : 'btn-secondary'}`}
                        onClick={() => handleUpdateBoarding('VERIFIED')}
                      >
                        <ShieldCheck size={14} /> Verified
                      </button>

                      <button
                        className={`btn btn-sm ${verificationResult.boarding_status === 'BOARDED' ? 'btn-success' : 'btn-secondary'}`}
                        onClick={() => handleUpdateBoarding('BOARDED')}
                      >
                        <CheckCircle2 size={14} /> Boarded
                      </button>

                      <button
                        className={`btn btn-sm ${verificationResult.boarding_status === 'NO_SHOW' ? 'btn-danger' : 'btn-secondary'}`}
                        onClick={() => handleUpdateBoarding('NO_SHOW')}
                      >
                        <XCircle size={14} /> No Show
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
