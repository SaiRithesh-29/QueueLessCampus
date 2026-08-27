import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getServices } from '../services/api';
import './HomePage.css';

const serviceIcons = { Canteen: '🍽️', Library: '📚', Office: '🏛️', Counter: '💳' };

const FLOATING_CARDS = [
  {
    position: 'top-left',
    name: 'Rahul S',
    queue: '1024',
    service: 'Canteen',
    serviceKey: 'canteen',
    type: 'Walk-in',
    time: '10:15 am',
    timeAlert: true,
    timeNote: 'Over 5 min',
    wait: '10 min',
    status: 'CHECKED-IN',
  },
  {
    position: 'top-right',
    name: 'Priya M',
    queue: '2048',
    service: 'Library',
    serviceKey: 'library',
    type: 'Appointment',
    time: '9:00 am',
    timeAlert: false,
    timeNote: '',
    wait: '20 min',
    status: 'CONFIRMED',
  },
  {
    position: 'bottom-left',
    name: 'Arjun K',
    queue: '3072',
    service: 'Admin Counter',
    serviceKey: 'counter',
    type: 'Appointment',
    time: '11:15 am',
    timeAlert: false,
    timeNote: '',
    wait: '15 min',
    status: 'CONFIRMED',
  },
  {
    position: 'bottom-right',
    name: 'Neha G',
    queue: '4096',
    service: 'Exam Cell',
    serviceKey: 'office',
    type: 'Walk-in',
    time: '10:30 am',
    timeAlert: true,
    timeNote: 'Now',
    wait: '15 min',
    status: 'CHECKED-IN',
  },
];

const HomePage = () => {
  const [services, setServices] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    getServices()
      .then(setServices)
      .catch(() => {});
  }, []);

  const handleCardClick = (serviceKey) => {
    const found = services.find((s) => s.name.toLowerCase().includes(serviceKey.toLowerCase()));
    if (found) {
      navigate(`/student/${found._id}`);
    } else {
      navigate(`/student/${serviceKey.toLowerCase()}`);
    }
  };

  return (
    <div className="home-page-light">
      <main className="hero-section">
        {/* Floating appointment cards */}
        {FLOATING_CARDS.map((card, idx) => (
          <div
            key={idx}
            className={`floating-card floating-${card.position}`}
            onClick={() => handleCardClick(card.serviceKey)}
          >
            <div className="fc-header">
              <div className="fc-name-group">
                <span className="fc-name">{card.name}</span>
                <span className="fc-queue">{card.queue}</span>
              </div>
              <div className={`fc-time ${card.timeAlert ? 'fc-time-alert' : ''}`}>
                <span>{card.time}</span>
                {card.timeNote && <span className="fc-time-note">{card.timeNote}</span>}
              </div>
            </div>
            <div className="fc-service">{card.service}</div>
            <div className="fc-footer">
              <span className="fc-type">
                <span className="fc-type-icon">{card.type === 'Appointment' ? '📅' : '🚶'}</span>
                {card.type}
              </span>
              <span className="fc-wait">
                <span className="fc-wait-icon">⏱</span>
                {card.wait}
              </span>
              <span className={`fc-status fc-status-${card.status.toLowerCase().replace('-', '')}`}>
                {card.status}
              </span>
              <span className="fc-chat-icon">💬</span>
            </div>
          </div>
        ))}

        {/* Center content */}
        <div className="hero-center">
          <div className="hero-avatars">
            <div className="avatar-circle avatar-1"></div>
            <div className="avatar-circle avatar-2"></div>
            <div className="avatar-circle avatar-3"></div>
          </div>

          <p className="hero-eyebrow">BECAUSE EVERY INTERACTION COUNTS</p>

          <h1 className="hero-title">
            Queue Less,<br />Stress Less
          </h1>

          <p className="hero-subtitle">
            The leading queue management system for campus to
            <br />help you skip the line and stress less
          </p>

          <div className="hero-ctas">
            <button className="cta-primary" onClick={() => handleCardClick('canteen')}>
              See How It Works
            </button>
            <button className="cta-secondary" onClick={() => handleCardClick('library')}>
              Join a Queue
            </button>
          </div>
        </div>
      </main>

      {/* Live Services Dashboard */}
      <section className="home-services">
        <div className="home-services-header">
          <span className="hs-eyebrow">CAMPUS SERVICES</span>
          <h2>Join a live queue</h2>
          <p className="hs-sub">Pick a service to get your digital token. No more standing in line.</p>
        </div>

        <div className="home-services-grid">
          {services.length === 0 && (
            <p className="hs-empty">Loading services…</p>
          )}
          {services.map((s) => {
            const icon = serviceIcons[s.name] || '🏢';
            return (
              <div key={s._id} className={`hs-card ${s.isOpen ? '' : 'closed'}`}>
                <div className="hs-card-top">
                  <span className="hs-icon">{icon}</span>
                  <span className={`hs-status ${s.isOpen ? 'open' : 'closed'}`}>
                    {s.isOpen ? '● Open' : '● Closed'}
                  </span>
                </div>
                <h3 className="hs-name">{s.name}</h3>
                <p className="hs-desc">{s.description || 'Taller service counter'}</p>
                <div className="hs-meta">
                  <span className="hs-meta-item">Now: <strong>{s.serving?.tokenNumber || '—'}</strong></span>
                  <span className="hs-meta-item">Waiting: <strong>{s.waitingCount ?? 0}</strong></span>
                </div>
                <button
                  className={`hs-join ${s.isOpen ? '' : 'disabled'}`}
                  onClick={() => handleCardClick(s.name)}
                  disabled={!s.isOpen}
                >
                  {s.isOpen ? 'Join Queue →' : 'Currently Closed'}
                </button>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};

export default HomePage;
