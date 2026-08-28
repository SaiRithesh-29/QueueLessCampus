import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getServices } from '../services/api';
import './HomePage.css';

const serviceIcons = { Canteen: '🍔', Library: '📚', Office: '🏢', Counter: '💳' };
const serviceDescs = {
  Canteen: 'Meals & Refreshments',
  Library: 'Books Issue & Returns',
  Office: 'Certificates, Queries & Services',
  Counter: 'Fee Payments & Admin',
};

const floatingCards = [
  { icon: '🍔', name: 'Canteen', token: 'C024', wait: '8 min', waiting: 4, status: 'OPEN', accent: '#0d9488' },
  { icon: '📚', name: 'Library Counter', token: 'L017', wait: '12 min', waiting: 6, status: 'OPEN', accent: '#2563eb' },
  { icon: '🏢', name: 'Student Office', token: 'O031', wait: '18 min', waiting: 7, status: 'OPEN', accent: '#7c3aed' },
  { icon: '💳', name: 'Accounts Office', token: 'A012', wait: '6 min', waiting: 3, status: 'OPEN', accent: '#ea580c' },
];

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
      {/* ── Hero with Floating Cards ── */}
      <section className="hp-hero">
        {/* Floating Cards — DISPLAY ONLY, NOT CLICKABLE */}
        <div className="hp-floating-card hp-fc-1" aria-hidden="true">
          <div className="hp-fc-header">
            <span className="hp-fc-icon">{floatingCards[0].icon}</span>
            <span className="hp-fc-name">{floatingCards[0].name}</span>
          </div>
          <div className="hp-fc-serving">
            <span className="hp-fc-serving-label">Now Serving</span>
            <span className="hp-fc-serving-num">{floatingCards[0].token}</span>
          </div>
          <div className="hp-fc-stats">
            <div className="hp-fc-stat">
              <span className="hp-fc-stat-val">{floatingCards[0].wait}</span>
              <span className="hp-fc-stat-lbl">Est. Wait</span>
            </div>
            <div className="hp-fc-stat">
              <span className="hp-fc-stat-val">{floatingCards[0].waiting}</span>
              <span className="hp-fc-stat-lbl">Waiting</span>
            </div>
          </div>
          <div className="hp-fc-status">
            <span className="hp-fc-dot open"></span>
            <span>{floatingCards[0].status}</span>
          </div>
        </div>

        <div className="hp-floating-card hp-fc-2" aria-hidden="true">
          <div className="hp-fc-header">
            <span className="hp-fc-icon">{floatingCards[1].icon}</span>
            <span className="hp-fc-name">{floatingCards[1].name}</span>
          </div>
          <div className="hp-fc-serving">
            <span className="hp-fc-serving-label">Now Serving</span>
            <span className="hp-fc-serving-num">{floatingCards[1].token}</span>
          </div>
          <div className="hp-fc-stats">
            <div className="hp-fc-stat">
              <span className="hp-fc-stat-val">{floatingCards[1].wait}</span>
              <span className="hp-fc-stat-lbl">Est. Wait</span>
            </div>
            <div className="hp-fc-stat">
              <span className="hp-fc-stat-val">{floatingCards[1].waiting}</span>
              <span className="hp-fc-stat-lbl">Waiting</span>
            </div>
          </div>
          <div className="hp-fc-status">
            <span className="hp-fc-dot open"></span>
            <span>{floatingCards[1].status}</span>
          </div>
        </div>

        <div className="hp-floating-card hp-fc-3" aria-hidden="true">
          <div className="hp-fc-header">
            <span className="hp-fc-icon">{floatingCards[2].icon}</span>
            <span className="hp-fc-name">{floatingCards[2].name}</span>
          </div>
          <div className="hp-fc-serving">
            <span className="hp-fc-serving-label">Now Serving</span>
            <span className="hp-fc-serving-num">{floatingCards[2].token}</span>
          </div>
          <div className="hp-fc-stats">
            <div className="hp-fc-stat">
              <span className="hp-fc-stat-val">{floatingCards[2].wait}</span>
              <span className="hp-fc-stat-lbl">Est. Wait</span>
            </div>
            <div className="hp-fc-stat">
              <span className="hp-fc-stat-val">{floatingCards[2].waiting}</span>
              <span className="hp-fc-stat-lbl">Waiting</span>
            </div>
          </div>
          <div className="hp-fc-status">
            <span className="hp-fc-dot open"></span>
            <span>{floatingCards[2].status}</span>
          </div>
        </div>

        <div className="hp-floating-card hp-fc-4" aria-hidden="true">
          <div className="hp-fc-header">
            <span className="hp-fc-icon">{floatingCards[3].icon}</span>
            <span className="hp-fc-name">{floatingCards[3].name}</span>
          </div>
          <div className="hp-fc-serving">
            <span className="hp-fc-serving-label">Now Serving</span>
            <span className="hp-fc-serving-num">{floatingCards[3].token}</span>
          </div>
          <div className="hp-fc-stats">
            <div className="hp-fc-stat">
              <span className="hp-fc-stat-val">{floatingCards[3].wait}</span>
              <span className="hp-fc-stat-lbl">Est. Wait</span>
            </div>
            <div className="hp-fc-stat">
              <span className="hp-fc-stat-val">{floatingCards[3].waiting}</span>
              <span className="hp-fc-stat-lbl">Waiting</span>
            </div>
          </div>
          <div className="hp-fc-status">
            <span className="hp-fc-dot open"></span>
            <span>{floatingCards[3].status}</span>
          </div>
        </div>

        {/* Hero Content */}
        <div className="hp-hero-content">
          <span className="hp-badge">CAMPUS QUEUE SYSTEM</span>
          <h1 className="hp-title">
            Your Campus Queue,<br />Without the Waiting.
          </h1>
          <p className="hp-sub">
            Join campus queues digitally, track your position in real time,
            and spend less time standing in line.
          </p>
          <div className="hp-hero-btns">
            <button className="hp-btn-primary" onClick={() => {
              const el = document.getElementById('services');
              el?.scrollIntoView({ behavior: 'smooth' });
            }}>
              <span className="hp-btn-icon">🎫</span> Get a Token
            </button>
            <button className="hp-btn-outline" onClick={() => {
              const el = document.getElementById('how-it-works');
              el?.scrollIntoView({ behavior: 'smooth' });
            }}>
              How It Works
            </button>
          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section className="hp-how" id="how-it-works">
        <h2 className="hp-section-title">Wait without standing in line</h2>
        <p className="hp-section-sub">Five simple steps — no app download required</p>
        <div className="hp-steps">
          {[
            { icon: '📱', title: 'Join the queue', desc: 'Select a service and tap Get Token from your phone.' },
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
