import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getServices } from '../services/api';
import { connectSocket, getSocket } from '../services/socket';
import './HomePage.css';

const serviceIcons = { Canteen: '🍔', Library: '📚', Office: '🏢', Counter: '💳' };
const serviceDescs = {
  Canteen: 'Meals & Refreshments',
  Library: 'Books Issue & Returns',
  Office: 'Certificates, Queries & Services',
  Counter: 'Fee Payments & Admin',
};

const HomePage = () => {
  const [services, setServices] = useState([]);
  const navigate = useNavigate();

  const fetchServices = useCallback(async () => {
    try {
      const data = await getServices();
      setServices(data);
    } catch {}
  }, []);

  useEffect(() => {
    fetchServices();
    const socket = connectSocket();
    const handleUpdate = () => fetchServices();
    socket.on('queue:update', handleUpdate);
    socket.on('service:update', handleUpdate);
    return () => {
      socket.off('queue:update', handleUpdate);
      socket.off('service:update', handleUpdate);
    };
  }, [fetchServices]);

  const goToService = (svc) => navigate(`/student/${svc._id}`);

  const calcEstWait = (svc) => {
    if (!svc.isOpen) return null;
    const count = svc.waitingCount ?? 0;
    if (count === 0) return '0 min';
    const avg = svc.averageServiceTime || 5;
    return `${count * avg} min`;
  };

  const getIcon = (svc) => serviceIcons[svc.name] || '🏢';
  const getDesc = (svc) => serviceDescs[svc.name] || svc.description || '';

  return (
    <div className="hp">
      {/* ── Hero with Floating Cards ── */}
      <section className="hp-hero">
        {/* Floating Cards — DISPLAY ONLY, NOT CLICKABLE, REAL DATA */}
        {services.length >= 1 && (
          <div className="hp-floating-card hp-fc-1" aria-hidden="true">
            <div className="hp-fc-header">
              <span className="hp-fc-icon">{getIcon(services[0])}</span>
              <span className="hp-fc-name">{services[0].name}</span>
            </div>
            <div className="hp-fc-serving">
              <span className="hp-fc-serving-label">Now Serving</span>
              <span className="hp-fc-serving-num">{services[0].serving?.tokenNumber || '—'}</span>
            </div>
            <div className="hp-fc-stats">
              <div className="hp-fc-stat">
                <span className="hp-fc-stat-val">{calcEstWait(services[0]) || '—'}</span>
                <span className="hp-fc-stat-lbl">Est. Wait</span>
              </div>
              <div className="hp-fc-stat">
                <span className="hp-fc-stat-val">{services[0].waitingCount ?? 0}</span>
                <span className="hp-fc-stat-lbl">Waiting</span>
              </div>
            </div>
            <div className="hp-fc-status">
              <span className={`hp-fc-dot ${services[0].isOpen ? 'open' : 'closed'}`}></span>
              <span>{services[0].isOpen ? 'OPEN' : 'CLOSED'}</span>
            </div>
          </div>
        )}

        {services.length >= 2 && (
          <div className="hp-floating-card hp-fc-2" aria-hidden="true">
            <div className="hp-fc-header">
              <span className="hp-fc-icon">{getIcon(services[1])}</span>
              <span className="hp-fc-name">{services[1].name}</span>
            </div>
            <div className="hp-fc-serving">
              <span className="hp-fc-serving-label">Now Serving</span>
              <span className="hp-fc-serving-num">{services[1].serving?.tokenNumber || '—'}</span>
            </div>
            <div className="hp-fc-stats">
              <div className="hp-fc-stat">
                <span className="hp-fc-stat-val">{calcEstWait(services[1]) || '—'}</span>
                <span className="hp-fc-stat-lbl">Est. Wait</span>
              </div>
              <div className="hp-fc-stat">
                <span className="hp-fc-stat-val">{services[1].waitingCount ?? 0}</span>
                <span className="hp-fc-stat-lbl">Waiting</span>
              </div>
            </div>
            <div className="hp-fc-status">
              <span className={`hp-fc-dot ${services[1].isOpen ? 'open' : 'closed'}`}></span>
              <span>{services[1].isOpen ? 'OPEN' : 'CLOSED'}</span>
            </div>
          </div>
        )}

        {services.length >= 3 && (
          <div className="hp-floating-card hp-fc-3" aria-hidden="true">
            <div className="hp-fc-header">
              <span className="hp-fc-icon">{getIcon(services[2])}</span>
              <span className="hp-fc-name">{services[2].name}</span>
            </div>
            <div className="hp-fc-serving">
              <span className="hp-fc-serving-label">Now Serving</span>
              <span className="hp-fc-serving-num">{services[2].serving?.tokenNumber || '—'}</span>
            </div>
            <div className="hp-fc-stats">
              <div className="hp-fc-stat">
                <span className="hp-fc-stat-val">{calcEstWait(services[2]) || '—'}</span>
                <span className="hp-fc-stat-lbl">Est. Wait</span>
              </div>
              <div className="hp-fc-stat">
                <span className="hp-fc-stat-val">{services[2].waitingCount ?? 0}</span>
                <span className="hp-fc-stat-lbl">Waiting</span>
              </div>
            </div>
            <div className="hp-fc-status">
              <span className={`hp-fc-dot ${services[2].isOpen ? 'open' : 'closed'}`}></span>
              <span>{services[2].isOpen ? 'OPEN' : 'CLOSED'}</span>
            </div>
          </div>
        )}

        {services.length >= 4 && (
          <div className="hp-floating-card hp-fc-4" aria-hidden="true">
            <div className="hp-fc-header">
              <span className="hp-fc-icon">{getIcon(services[3])}</span>
              <span className="hp-fc-name">{services[3].name}</span>
            </div>
            <div className="hp-fc-serving">
              <span className="hp-fc-serving-label">Now Serving</span>
              <span className="hp-fc-serving-num">{services[3].serving?.tokenNumber || '—'}</span>
            </div>
            <div className="hp-fc-stats">
              <div className="hp-fc-stat">
                <span className="hp-fc-stat-val">{calcEstWait(services[3]) || '—'}</span>
                <span className="hp-fc-stat-lbl">Est. Wait</span>
              </div>
              <div className="hp-fc-stat">
                <span className="hp-fc-stat-val">{services[3].waitingCount ?? 0}</span>
                <span className="hp-fc-stat-lbl">Waiting</span>
              </div>
            </div>
            <div className="hp-fc-status">
              <span className={`hp-fc-dot ${services[3].isOpen ? 'open' : 'closed'}`}></span>
              <span>{services[3].isOpen ? 'OPEN' : 'CLOSED'}</span>
            </div>
          </div>
        )}

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
            const icon = getIcon(s);
            const desc = getDesc(s);
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
