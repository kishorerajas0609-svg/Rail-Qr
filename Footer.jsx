import React from 'react';
import { Train, ShieldCheck, QrCode, Zap, Lock, CheckCircle2 } from 'lucide-react';

export default function Footer() {
  return (
    <footer style={{
      background: 'var(--bg-secondary)',
      borderTop: '1px solid var(--border-card)',
      padding: '3rem 1.5rem 1.5rem',
      marginTop: 'auto'
    }}>
      <div style={{
        maxWidth: '1280px',
        margin: '0 auto',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
        gap: '2.5rem',
        marginBottom: '2.5rem'
      }}>
        {/* Project Brand & Overview */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.85rem' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '0.55rem',
              background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              boxShadow: '0 4px 12px rgba(2, 132, 199, 0.35)'
            }}>
              <Train size={20} />
            </div>
            <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: '1.2rem' }}>
              Smart Rail <span style={{ color: 'var(--rail-cyan)' }}>QR</span>
            </span>
          </div>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            Intelligent Railway Ticket Verification & Real-time Passenger Management System powered by cryptographically signed HMAC-SHA256 tokens and multi-scan fraud detection.
          </p>
        </div>

        {/* Security & Verification Features */}
        <div>
          <h4 style={{ fontSize: '0.95rem', color: 'var(--text-primary)', marginBottom: '1rem', fontWeight: 700 }}>
            Security & Transit Features
          </h4>
          <ul style={{ listStyle: 'none', fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ShieldCheck size={16} color="#10b981" /> Cryptographic Tamper-Proof QR Tokens
            </li>
            <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Zap size={16} color="#f59e0b" /> Real-Time Duplicate Scan Fraud Detection
            </li>
            <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <QrCode size={16} color="#38bdf8" /> Handheld TTE Scanner HUD Terminal
            </li>
            <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Lock size={16} color="#818cf8" /> Zero PII Data Leakage Architecture
            </li>
          </ul>
        </div>

        {/* System Reliability */}
        <div>
          <h4 style={{ fontSize: '0.95rem', color: 'var(--text-primary)', marginBottom: '1rem', fontWeight: 700 }}>
            System Infrastructure
          </h4>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <CheckCircle2 size={15} color="#10b981" /> Central Verification Engine: Operational
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <CheckCircle2 size={15} color="#10b981" /> HMAC-SHA256 Signature Validation
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <CheckCircle2 size={15} color="#10b981" /> Real-time WebSocket / Manifest Sync
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div style={{
        maxWidth: '1280px',
        margin: '0 auto',
        paddingTop: '1.5rem',
        borderTop: '1px solid var(--border-card)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1rem',
        fontSize: '0.8rem',
        color: 'var(--text-muted)'
      }}>
        <div>
          © {new Date().getFullYear()} Smart Rail QR. All rights reserved. National Digital Transit Identity.
        </div>
        <div style={{ display: 'flex', gap: '1.25rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <span>High Security Transit Architecture</span>
          <span>•</span>
          <span>HMAC-SHA256 Encrypted</span>
        </div>
      </div>
    </footer>
  );
}
