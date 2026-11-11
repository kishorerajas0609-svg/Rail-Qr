import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { 
  Train, 
  User, 
  Plus, 
  Trash2, 
  CreditCard, 
  ShieldCheck, 
  CheckCircle2, 
  ArrowLeft,
  Calendar,
  AlertCircle
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function BookTicket({ bookingContext, onBookingSuccess, navigate }) {
  const { user } = useAuth();

  const [passengers, setPassengers] = useState([
    {
      full_name: user?.full_name || '',
      age: 28,
      gender: 'Male',
      berth_preference: 'Window',
      id_proof_type: 'Aadhaar',
      id_proof_number: 'XXXX-XXXX-1234'
    }
  ]);

  const [paymentMethod, setPaymentMethod] = useState('UPI / Simulated Gateway');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  if (!bookingContext || !bookingContext.train) {
    return (
      <div className="glass-card" style={{ textAlign: 'center', padding: '3rem' }}>
        <AlertCircle size={40} color="#f59e0b" style={{ margin: '0 auto 1rem' }} />
        <h2>No Train Selected</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
          Please choose a train from the search page to proceed with booking.
        </p>
        <button className="btn btn-primary" onClick={() => navigate('search')}>
          Search Trains
        </button>
      </div>
    );
  }

  const { train, classInfo, sourceStation, destinationStation, journeyDate, quota } = bookingContext;

  const handleAddPassenger = () => {
    if (passengers.length >= 6) {
      alert('Maximum 6 passengers allowed per ticket reservation.');
      return;
    }
    setPassengers(prev => [
      ...prev,
      {
        full_name: '',
        age: 25,
        gender: 'Female',
        berth_preference: 'No Preference',
        id_proof_type: 'Aadhaar',
        id_proof_number: ''
      }
    ]);
  };

  const handleRemovePassenger = (index) => {
    if (passengers.length === 1) {
      alert('At least one passenger is required.');
      return;
    }
    setPassengers(prev => prev.filter((_, idx) => idx !== index));
  };

  const handlePassengerChange = (index, field, value) => {
    setPassengers(prev => {
      const updated = [...prev];
      updated[index][field] = value;
      return updated;
    });
  };

  const singleFare = classInfo?.fare || 1050;
  const totalFare = Math.round(singleFare * passengers.length);

  const handleSubmitBooking = async (e) => {
    e.preventDefault();
    setError(null);

    // Validate passenger names
    for (let i = 0; i < passengers.length; i++) {
      if (!passengers[i].full_name.trim()) {
        setError(`Please enter the full name for Passenger ${i + 1}`);
        return;
      }
    }

    if (!user) {
      alert('Please log in or create an account to book your ticket.');
      navigate('login');
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        train_id: train.id,
        source_station_id: sourceStation.id,
        destination_station_id: destinationStation.id,
        journey_date: journeyDate,
        travel_class: classInfo.coach_type,
        quota: quota || 'General',
        passengers: passengers.map(p => ({
          full_name: p.full_name.trim(),
          age: parseInt(p.age) || 25,
          gender: p.gender,
          berth_preference: p.berth_preference,
          id_proof_type: p.id_proof_type,
          id_proof_number: p.id_proof_number || 'VERIFIED'
        })),
        payment_method: paymentMethod
      };

      const result = await api.createBooking(payload);

      // Trigger Confetti effect
      try {
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.6 }
        });
      } catch (ce) {
        console.warn('Confetti error', ce);
      }

      if (onBookingSuccess) {
        onBookingSuccess(result);
      }
      navigate('ticket-details');
    } catch (err) {
      setError(err.message || 'Failed to complete reservation. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: '960px', margin: '0 auto' }}>
      <button 
        className="btn btn-secondary btn-sm" 
        onClick={() => navigate('search')}
        style={{ marginBottom: '1.5rem' }}
      >
        <ArrowLeft size={15} /> Back to Search Results
      </button>

      {/* Train Summary Bar */}
      <div className="glass-card" style={{
        background: 'linear-gradient(135deg, rgba(2, 132, 199, 0.2) 0%, rgba(13, 23, 48, 0.8) 100%)',
        border: '1px solid var(--border-glass)',
        marginBottom: '2rem'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span className="badge badge-boarded">{train.train_number}</span>
              <h2 style={{ fontSize: '1.35rem' }}>{train.name}</h2>
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
              {sourceStation.city} ({sourceStation.code}) → {destinationStation.city} ({destinationStation.code})
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Journey Date</div>
              <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{journeyDate}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Class & Quota</div>
              <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--rail-cyan)' }}>
                {classInfo.coach_type} • {quota}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Fare / Seat</div>
              <div style={{ fontWeight: 800, fontSize: '1.15rem', color: '#34d399' }}>
                ₹{singleFare}
              </div>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="glass-card" style={{ padding: '1rem 1.25rem', borderColor: '#ef4444', color: '#f87171', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      {/* Main Reservation Form */}
      <form onSubmit={handleSubmitBooking}>
        <div className="glass-card" style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <User size={22} color="#38bdf8" />
              <h3 style={{ fontSize: '1.25rem' }}>Passenger Information ({passengers.length})</h3>
            </div>
            <button 
              type="button" 
              className="btn btn-secondary btn-sm"
              onClick={handleAddPassenger}
            >
              <Plus size={15} /> Add Passenger
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {passengers.map((p, idx) => (
              <div 
                key={idx} 
                style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid var(--border-card)',
                  borderRadius: '0.875rem',
                  padding: '1.25rem',
                  position: 'relative'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--rail-cyan)' }}>
                    Passenger #{idx + 1}
                  </span>
                  {passengers.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemovePassenger(idx)}
                      style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer' }}
                      title="Remove Passenger"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                  gap: '1rem'
                }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Full Name *</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. Kishore Raj"
                      required
                      value={p.full_name}
                      onChange={e => handlePassengerChange(idx, 'full_name', e.target.value)}
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Age</label>
                    <input
                      type="number"
                      className="form-input"
                      min="1"
                      max="120"
                      required
                      value={p.age}
                      onChange={e => handlePassengerChange(idx, 'age', e.target.value)}
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Gender</label>
                    <select
                      className="form-select"
                      value={p.gender}
                      onChange={e => handlePassengerChange(idx, 'gender', e.target.value)}
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Berth Preference</label>
                    <select
                      className="form-select"
                      value={p.berth_preference}
                      onChange={e => handlePassengerChange(idx, 'berth_preference', e.target.value)}
                    >
                      <option value="No Preference">No Preference</option>
                      <option value="Window">Window Seat</option>
                      <option value="Aisle">Aisle Seat</option>
                      <option value="Lower">Lower Berth</option>
                      <option value="Middle">Middle Berth</option>
                      <option value="Upper">Upper Berth</option>
                      <option value="Side Lower">Side Lower</option>
                      <option value="Side Upper">Side Upper</option>
                    </select>
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">ID Proof Type</label>
                    <select
                      className="form-select"
                      value={p.id_proof_type}
                      onChange={e => handlePassengerChange(idx, 'id_proof_type', e.target.value)}
                    >
                      <option value="Aadhaar">Aadhaar Card</option>
                      <option value="Passport">Passport</option>
                      <option value="Driving License">Driving License</option>
                      <option value="PAN Card">PAN Card</option>
                      <option value="Voter ID">Voter ID</option>
                    </select>
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">ID Document No. (Optional)</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. XXXX-XXXX-4892"
                      value={p.id_proof_number}
                      onChange={e => handlePassengerChange(idx, 'id_proof_number', e.target.value)}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Payment & Confirmation Summary Card */}
        <div className="glass-card" style={{ marginBottom: '2.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
            <CreditCard size={22} color="#38bdf8" />
            <h3 style={{ fontSize: '1.25rem' }}>Payment & Smart Pass Generation</h3>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem' }}>
            <div>
              <div className="form-group">
                <label className="form-label">Payment Mode</label>
                <select 
                  className="form-select"
                  value={paymentMethod}
                  onChange={e => setPaymentMethod(e.target.value)}
                >
                  <option value="UPI / Simulated Gateway">UPI (Google Pay / PhonePe / Paytm)</option>
                  <option value="Credit / Debit Card">Credit / Debit Card</option>
                  <option value="Net Banking">Net Banking</option>
                  <option value="IRCTC Rail e-Wallet">IRCTC Rail e-Wallet</option>
                </select>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#34d399', fontSize: '0.85rem', marginTop: '1rem' }}>
                <ShieldCheck size={18} />
                <span>Instant HMAC-signed QR token generated upon checkout</span>
              </div>
            </div>

            <div style={{
              background: 'rgba(0, 0, 0, 0.25)',
              border: '1px solid var(--border-card)',
              borderRadius: '0.875rem',
              padding: '1.25rem'
            }}>
              <h4 style={{ fontSize: '0.95rem', marginBottom: '0.85rem', color: 'var(--text-secondary)' }}>
                Fare Breakdown
              </h4>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                <span>Ticket Fare ({passengers.length} × ₹{singleFare})</span>
                <span>₹{totalFare}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                <span>Reservation & Superfast Fee</span>
                <span style={{ color: '#34d399' }}>Included</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', marginBottom: '0.75rem', borderBottom: '1px dashed rgba(255, 255, 255, 0.15)', paddingBottom: '0.75rem' }}>
                <span>Digital QR Pass Tokenization</span>
                <span style={{ color: '#38bdf8' }}>FREE</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 700, fontSize: '1.05rem' }}>Total Amount:</span>
                <span style={{ fontFamily: 'var(--font-heading)', fontSize: '1.6rem', fontWeight: 800, color: 'var(--rail-cyan)' }}>
                  ₹{totalFare}
                </span>
              </div>
            </div>
          </div>

          <div style={{ marginTop: '2rem', borderTop: '1px solid var(--border-card)', paddingTop: '1.5rem', display: 'flex', justifyContent: 'flex-end' }}>
            <button
              type="submit"
              className="btn btn-primary btn-lg"
              disabled={submitting}
              style={{ minWidth: '240px' }}
            >
              {submitting ? 'Allocating Berths & Generating QR...' : `Pay ₹${totalFare} & Generate Smart QR Pass`}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
