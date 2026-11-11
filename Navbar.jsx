import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Train, 
  QrCode, 
  Compass, 
  Ticket, 
  ShieldCheck, 
  LayoutDashboard, 
  LogOut, 
  LogIn, 
  UserPlus, 
  Sun, 
  Moon, 
  Menu, 
  X,
  ClipboardList,
  Users,
  Database,
  UserCheck
} from 'lucide-react';

export default function Navbar({ currentRoute, navigate }) {
  const { user, logout, isStaff, isAdmin, isPassenger } = useAuth();
  const [theme, setTheme] = useState(localStorage.getItem('smart_rail_theme') || 'dark');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('smart_rail_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  const handleNav = (route) => {
    navigate(route);
    setMobileMenuOpen(false);
  };

  const handleLogout = () => {
    logout();
    navigate('intro');
  };

  return (
    <header className="navbar-container" style={{
      background: 'var(--bg-card)',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      borderBottom: '1px solid var(--border-card)',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      padding: '0.85rem 1.5rem',
      boxShadow: 'var(--shadow-sm)'
    }}>
      <div style={{
        maxWidth: '1280px',
        margin: '0 auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '1rem'
      }}>
        {/* Brand Logo */}
        <div 
          onClick={() => handleNav(user ? 'home' : 'intro')} 
          style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}
        >
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '0.65rem',
            background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            boxShadow: '0 4px 12px rgba(2, 132, 199, 0.35)'
          }}>
            <Train size={22} />
          </div>
          <div>
            <div style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <span>Smart Rail</span>
              <span style={{ 
                background: 'linear-gradient(90deg, #38bdf8, #00f2fe)', 
                WebkitBackgroundClip: 'text', 
                WebkitTextFillColor: 'transparent',
                fontWeight: 800
              }}>QR</span>
            </div>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>
              Digital Transit Verification
            </div>
          </div>
        </div>

        {/* Desktop Navigation Links */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }} className="desktop-nav">
          {!user ? (
            <>
              <button 
                className={`btn btn-sm ${currentRoute === 'intro' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => handleNav('intro')}
              >
                Home
              </button>
              <button 
                className={`btn btn-sm ${currentRoute === 'search' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => handleNav('search')}
              >
                <Compass size={15} /> Search Trains
              </button>
            </>
          ) : (
            <>
              <button 
                className={`btn btn-sm ${currentRoute === 'home' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => handleNav('home')}
              >
                Dashboard
              </button>

              <button 
                className={`btn btn-sm ${currentRoute === 'search' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => handleNav('search')}
              >
                <Compass size={15} /> Search Trains
              </button>

              {isPassenger && (
                <button 
                  className={`btn btn-sm ${currentRoute === 'my-journeys' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => handleNav('my-journeys')}
                >
                  <Ticket size={15} /> My Passes
                </button>
              )}

              {/* Staff TTE Controls */}
              {(isStaff || isAdmin) && (
                <>
                  <button 
                    className={`btn btn-sm ${currentRoute === 'scanner' ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => handleNav('scanner')}
                    style={{ borderColor: 'rgba(56, 189, 248, 0.3)' }}
                  >
                    <QrCode size={15} color="#38bdf8" /> TTE Scanner
                  </button>

                  <button 
                    className={`btn btn-sm ${currentRoute === 'manifest' ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => handleNav('manifest')}
                  >
                    <ClipboardList size={15} /> Manifest
                  </button>
                </>
              )}

              {/* Admin Controls */}
              {isAdmin && (
                <>
                  <button 
                    className={`btn btn-sm ${currentRoute === 'admin-dashboard' ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => handleNav('admin-dashboard')}
                    style={{ borderColor: '#f59e0b' }}
                  >
                    <LayoutDashboard size={15} color="#fbbf24" /> Console
                  </button>
                  <button 
                    className={`btn btn-sm ${currentRoute === 'admin-staff' ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => handleNav('admin-staff')}
                  >
                    <UserCheck size={15} color="#38bdf8" /> TTR / Staff
                  </button>
                  <button 
                    className={`btn btn-sm ${currentRoute === 'admin-passengers' ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => handleNav('admin-passengers')}
                  >
                    <Users size={15} color="#a855f7" /> Passengers
                  </button>
                  <button 
                    className={`btn btn-sm ${currentRoute === 'admin-database' ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => handleNav('admin-database')}
                  >
                    <Database size={15} color="#4ade80" /> Database
                  </button>
                  <button 
                    className={`btn btn-sm ${currentRoute === 'admin-reservations' ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => handleNav('admin-reservations')}
                  >
                    <Ticket size={15} color="#fbbf24" /> Ledger
                  </button>
                </>
              )}
            </>
          )}
        </nav>

        {/* User Controls & Theme Toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          {/* Theme Toggle */}
          <button 
            onClick={toggleTheme}
            className="btn btn-secondary btn-sm"
            style={{ padding: '0.45rem', borderRadius: '0.5rem' }}
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
          >
            {theme === 'dark' ? <Sun size={17} color="#fbbf24" /> : <Moon size={17} color="#0284c7" />}
          </button>

          {/* Authenticated User Status or Sign In / Sign Up */}
          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div 
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.35rem 0.75rem',
                  borderRadius: '0.65rem',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid var(--border-card)',
                  fontSize: '0.8rem'
                }}
                className="desktop-only"
              >
                <div style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  fontWeight: 700,
                  fontSize: '0.75rem'
                }}>
                  {user.full_name?.charAt(0) || 'U'}
                </div>
                <div style={{ lineHeight: 1.2 }}>
                  <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                    {user.full_name?.split(' ')[0]}
                  </div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                    {user.role}
                  </div>
                </div>
              </div>

              <button 
                onClick={handleLogout}
                className="btn btn-secondary btn-sm"
                title="Sign Out"
                style={{ color: '#f87171' }}
              >
                <LogOut size={16} /> <span className="desktop-only">Sign Out</span>
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <button 
                className="btn btn-secondary btn-sm"
                onClick={() => handleNav('login')}
              >
                <LogIn size={15} /> Sign In
              </button>
              <button 
                className="btn btn-primary btn-sm"
                onClick={() => handleNav('register')}
              >
                <UserPlus size={15} /> Sign Up
              </button>
            </div>
          )}

          {/* Mobile Menu Hamburger */}
          <button 
            className="mobile-toggle btn btn-secondary btn-sm" 
            style={{ padding: '0.45rem', display: 'none' }}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div style={{
          marginTop: '0.75rem',
          paddingTop: '0.75rem',
          borderTop: '1px solid var(--border-card)',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem'
        }}>
          {!user ? (
            <>
              <button className="btn btn-secondary btn-sm" onClick={() => handleNav('intro')}>
                Home
              </button>
              <button className="btn btn-secondary btn-sm" onClick={() => handleNav('search')}>
                <Compass size={16} /> Search Trains
              </button>
              <button className="btn btn-primary btn-sm" onClick={() => handleNav('login')}>
                <LogIn size={16} /> Sign In
              </button>
              <button className="btn btn-secondary btn-sm" onClick={() => handleNav('register')}>
                <UserPlus size={16} /> Sign Up
              </button>
            </>
          ) : (
            <>
              <button className="btn btn-secondary btn-sm" onClick={() => handleNav('home')}>
                Dashboard
              </button>
              <button className="btn btn-secondary btn-sm" onClick={() => handleNav('search')}>
                <Compass size={16} /> Search Trains
              </button>
              {isPassenger && (
                <button className="btn btn-secondary btn-sm" onClick={() => handleNav('my-journeys')}>
                  <Ticket size={16} /> My Passes
                </button>
              )}
              {(isStaff || isAdmin) && (
                <>
                  <button className="btn btn-secondary btn-sm" onClick={() => handleNav('scanner')}>
                    <QrCode size={16} color="#38bdf8" /> TTE Scanner
                  </button>
                  <button className="btn btn-secondary btn-sm" onClick={() => handleNav('manifest')}>
                    <ClipboardList size={16} /> Manifest
                  </button>
                </>
              )}
              {isAdmin && (
                <>
                  <button className="btn btn-secondary btn-sm" onClick={() => handleNav('admin-dashboard')}>
                    <LayoutDashboard size={16} color="#fbbf24" /> Admin Console
                  </button>
                  <button className="btn btn-secondary btn-sm" onClick={() => handleNav('admin-staff')}>
                    <UserCheck size={16} color="#38bdf8" /> TTR / Staff Manager
                  </button>
                  <button className="btn btn-secondary btn-sm" onClick={() => handleNav('admin-passengers')}>
                    <Users size={16} color="#a855f7" /> Passenger Directory
                  </button>
                  <button className="btn btn-secondary btn-sm" onClick={() => handleNav('admin-database')}>
                    <Database size={16} color="#4ade80" /> Database & Schema
                  </button>
                  <button className="btn btn-secondary btn-sm" onClick={() => handleNav('admin-reservations')}>
                    <Ticket size={16} color="#fbbf24" /> Reservation Ledger
                  </button>
                </>
              )}
              <button className="btn btn-danger btn-sm" onClick={handleLogout}>
                <LogOut size={16} /> Sign Out
              </button>
            </>
          )}
        </div>
      )}
    </header>
  );
}
