import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getServices } from '../services/api';
import './HomePage.css';

const serviceIcons = { Canteen: '🍽️', Library: '📚', Office: '🏛️', Counter: '💳' };
const serviceDescs = {
  Canteen: 'Meals & Refreshments',
  Library: 'Books Issue & Returns',
  Office: 'Certificates, Queries & Services',
  Counter: 'Fee Payments & Admin',
};

const HomePage = () => {
  const [services, setServices] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    getServices().then(setServices).catch(() => {});
  }, []);

  const goToService = (svc) => navigate(`/student/${svc._id}`);

  const calcEstWait = (svc) => {
    if (!svc.isOpen) return null;
    const count = svc.waitingCount ?? 0;
    if (count === 0) return '0 min';
    const avg = svc.averageServiceTime || 5;
    return `${count * avg} min`;
  };

  return (
    <div className="hp">
      {/* ── Hero ── */}
      <section className="hp-hero">
        <div className="hp-hero-inner">
          <span className="hp-badge">DIGITAL QUEUE SYSTEM</span>
          <h1 className="hp-title">
            Queue Less,<br />Stress Less
          </h1>
          <p className="hp-sub">
            Skip the physical queue. Know exactly when it's your turn.
          </p>
          <p className="hp-sub2">
            Join your college service queue digitally, track your position in real time,
            and return when your turn is near.
          </p>
          <div className="hp-hero-btns">
            <button className="hp-btn-primary" onClick={() => {
              const el = document.getElementById('services');
              el?.scrollIntoView({ behavior: 'smooth' });
            }}>
              Join a Queue
            </button>
            <button className="hp-btn-outline" onClick={() => navigate('/staff')}>
              Staff Dashboard
            </button>
          </div>
        </div>
        <div className="hp-hero-visual">
          <div className="hp-token-preview">
            <span className="hp-token-label">YOUR TOKEN</span>
            <span className="hp-token-number">L-027</span>
            <div className="hp-token-meta">
              <span>Currently Serving: <strong>L-021</strong></span>
              <span>People Ahead: <strong>5</strong></span>
              <span>Est. Wait: <strong>15 min</strong></span>
            </div>
            <span className="hp-token-status">● WAITING</span>
          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section className="hp-how">
        <h2 className="hp-section-title">Wait without standing in line</h2>
        <p className="hp-section-sub">Five simple steps — no app download required</p>
        <div className="hp-steps">
          {[
            { icon: '📱', title: 'Join the queue', desc: 'Select a service and tap Join Queue from your phone.' },
            { icon: '🚶', title: 'Leave the area', desc: 'Walk away. Go to class, the cafeteria, or anywhere on campus.' },
            { icon: '📍', title: 'Monitor your position', desc: 'Watch your token move in real time — people ahead, estimated wait.' },
            { icon: '🔔', title: 'Get notified', desc: 'Receive an alert when your turn is approaching.' },
            { icon: '✅', title: 'Get served', desc: 'Return to the counter when called. No wasted time.' },
          ].map((step, i) => (
            <div key={i} className="hp-step">
              <div className="hp-step-num">{i + 1}</div>
              <span className="hp-step-icon">{step.icon}</span>
              <h3>{step.title}</h3>
              <p>{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Live Services ── */}
      <section className="hp-services" id="services">
        <h2 className="hp-section-title">Campus Services</h2>
        <p className="hp-section-sub">Pick a service to get your digital token. No more standing in line.</p>

        <div className="hp-svc-grid">
          {services.length === 0 && <p className="hp-svc-loading">Loading services...</p>}
          {services.map((s) => {
            const icon = serviceIcons[s.name] || '🏢';
            const desc = serviceDescs[s.name] || s.description || '';
            const estWait = calcEstWait(s);
            return (
              <div key={s._id} className={`hp-svc-card ${s.isOpen ? '' : 'closed'}`}>
                <div className="hp-svc-head">
                  <span className="hp-svc-icon">{icon}</span>
                  <div className="hp-svc-head-text">
                    <h3>{s.name}</h3>
                    <p>{desc}</p>
                  </div>
                  <span className={`hp-svc-badge ${s.isOpen ? 'open' : 'closed'}`}>
                    {s.isOpen ? '● Open' : '● Closed'}
                  </span>
                </div>

                <div className="hp-svc-stats">
                  <div className="hp-svc-stat">
                    <span className="hp-svc-stat-label">Now Serving</span>
                    <span className="hp-svc-stat-val">{s.serving?.tokenNumber || '—'}</span>
                  </div>
                  <div className="hp-svc-stat">
                    <span className="hp-svc-stat-label">Waiting</span>
                    <span className="hp-svc-stat-val">{s.waitingCount ?? 0}</span>
                  </div>
                  {estWait !== null && (
                    <div className="hp-svc-stat">
                      <span className="hp-svc-stat-label">Est. Wait</span>
                      <span className="hp-svc-stat-val">{estWait}</span>
                    </div>
                  )}
                </div>

                {s.isOpen ? (
                  <button className="hp-svc-btn" onClick={() => goToService(s)}>
                    Join Queue
                  </button>
                ) : (
                  <button className="hp-svc-btn closed" disabled>
                    Service Closed
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="hp-footer">
        <span>QueueLess Campus &mdash; Digital Queue Management</span>
      </footer>
    </div>
  );
};

export default HomePage;
