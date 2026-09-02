import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getServices } from '../services/api';
import { useAuth } from '../context/AuthContext';
import AuthModal from './AuthModal';
import './Navbar.css';

const DEFAULT_SERVICES = [
  { _id: 'canteen', name: 'Canteen' },
  { _id: 'library', name: 'Library' },
  { _id: 'counter', name: 'Counter' },
  { _id: 'office', name: 'Offices' },
];

const Navbar = ({ onOpenAbout, onOpenSupport }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, login, register, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [services, setServices] = useState([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    getServices()
      .then((data) => {
        if (data && data.length > 0) {
          setServices(data);
        } else {
          setServices(DEFAULT_SERVICES);
        }
      })
      .catch(() => {
        setServices(DEFAULT_SERVICES);
      });
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectService = (serviceKey) => {
    setDropdownOpen(false);
    setMobileMenuOpen(false);
    const found = services.find((s) => 
      s._id === serviceKey || 
      s.name.toLowerCase().includes(serviceKey.toLowerCase()) || 
      (s.code && s.code.toLowerCase() === serviceKey.toLowerCase())
    );

    if (found && found._id) {
      navigate(`/student/${found._id}`);
    } else {
      navigate(`/student/${serviceKey}`);
    }
  };

  const handleAuthSuccess = async (type, credentials) => {
    const selectedRole = credentials.role || 'student';
    if (type === 'login') {
      await login(credentials.email, credentials.password, selectedRole);
    } else {
      await register(credentials.name, credentials.email, credentials.password, selectedRole);
    }
  };

  return (
    <header className="ql-topbar">
      <div className="ql-topbar-container">
        
        {/* Friendly Brand / Logo */}
        <div className="ql-brand" onClick={() => navigate('/')}>
          <div className="ql-friendly-logo">
            <span>👋</span>
          </div>
          <div className="ql-brand-text">
            QueueLess <span className="ql-brand-accent">Campus</span>
          </div>
        </div>

        {/* Desktop Navigation Links */}
        <nav className="ql-nav-links">
          <button 
            className={`ql-nav-btn ${location.pathname === '/' ? 'active' : ''}`}
            onClick={() => navigate('/')}
          >
            Home
          </button>

          <div className="ql-dropdown-container" ref={dropdownRef}>
            <button 
              className={`ql-nav-btn ${dropdownOpen ? 'active' : ''}`}
              onClick={() => setDropdownOpen(!dropdownOpen)}
            >
              Services <svg className="ql-chevron-icon" width="10" height="6" viewBox="0 0 10 6" fill="none"><path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
            {dropdownOpen && (
              <div className="ql-dropdown-menu">
                <button onClick={() => handleSelectService('canteen')}>
                  <span className="ql-menu-icon">🍽️</span> Canteen
                </button>
                <button onClick={() => handleSelectService('library')}>
                  <span className="ql-menu-icon">📚</span> Library
                </button>
                <button onClick={() => handleSelectService('counter')}>
                  <span className="ql-menu-icon">🏢</span> Counter
                </button>
                <button onClick={() => handleSelectService('office')}>
                  <span className="ql-menu-icon">📋</span> Offices
                </button>
              </div>
            )}
          </div>

          <button className="ql-nav-btn" onClick={onOpenAbout}>
            About
          </button>
        </nav>

        {/* Right Actions */}
        <div className="ql-actions">
          <button className="ql-btn-staff" onClick={() => navigate('/staff')}>
            Staff Dashboard
          </button>
          {user ? (
            <>
              <span className="ql-user-greeting">Hi, {user.name}</span>
              <button className="ql-btn-logout" onClick={() => { logout(); navigate('/'); }}>
                Logout
              </button>
            </>
          ) : (
            <button className="ql-btn-solid" onClick={() => setAuthOpen(true)}>
              Login <span className="ql-arrow">→</span>
            </button>
          )}
          <button className="ql-btn-support" onClick={onOpenSupport}>
            <span className="ql-question-mark">?</span>
            Support
          </button>
          <button 
            className="ql-mobile-toggle"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            ☰
          </button>
        </div>

      </div>

      {mobileMenuOpen && (
        <div className="ql-mobile-drawer">
          <button onClick={() => { setMobileMenuOpen(false); navigate('/'); }}>🏠 Home</button>
          <button onClick={() => handleSelectService('canteen')}>🍽️ Canteen</button>
          <button onClick={() => handleSelectService('library')}>📚 Library</button>
          <button onClick={() => handleSelectService('counter')}>🏢 Counter</button>
          <button onClick={() => handleSelectService('office')}>📋 Offices</button>
          <button onClick={() => { setMobileMenuOpen(false); onOpenAbout(); }}>ℹ️ About</button>
          <button onClick={() => { setMobileMenuOpen(false); navigate('/staff'); }}>📊 Staff Dashboard</button>
          <button onClick={() => { setMobileMenuOpen(false); onOpenSupport(); }}>❓ Support</button>
          {user ? (
            <button onClick={() => { setMobileMenuOpen(false); logout(); navigate('/'); }}>🚪 Logout ({user.name})</button>
          ) : (
            <button onClick={() => { setMobileMenuOpen(false); setAuthOpen(true); }}>🔑 Login</button>
          )}
        </div>
      )}

      <AuthModal
        isOpen={authOpen}
        onClose={() => setAuthOpen(false)}
        onAuthSuccess={handleAuthSuccess}
        message=""
      />
    </header>
  );
};

export default Navbar;
