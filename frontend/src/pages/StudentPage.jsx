import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getServices, createToken, cancelToken } from '../services/api';
import { useTokenStatus } from '../hooks/useQueue';
import { useAuth } from '../context/AuthContext';
import { connectSocket } from '../services/socket';
import { notifyApproaching, notifyYourTurn, requestNotificationPermission } from '../services/notifications';
import AuthModal from '../components/AuthModal';
import './StudentPage.css';

const serviceIcons = { Canteen: '🍽️', Library: '📚', Office: '🏛️', Counter: '💳' };
const serviceDescs = {
  Canteen: 'Meals & Refreshments',
  Library: 'Books Issue & Returns',
  Office: 'Certificates, Queries & Services',
  Counter: 'Fee Payments & Admin',
};

const StudentPage = () => {
  const { serviceId } = useParams();
  const navigate = useNavigate();
  const { user, login, register } = useAuth();
  const [services, setServices] = useState([]);
  const [service, setService] = useState(null);
  const [tokenId, setTokenId] = useState(null);
  const [tokenData, setTokenData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState(null);
  const [banner, setBanner] = useState(null);
  const [notifEnabled, setNotifEnabled] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [authMessage, setAuthMessage] = useState('');
  const prevStatusRef = useRef(null);

  const { status, loading: statusLoading } = useTokenStatus(tokenId);

  useEffect(() => {
    connectSocket();
    getServices()
      .then((list) => {
        if (!list || list.length === 0) { setError('No services found'); return; }
        setServices(list);
        const key = (serviceId || '').toLowerCase();
        const found = list.find((s) =>
          s._id === serviceId ||
          (s.code && s.code.toLowerCase() === key) ||
          s.name.toLowerCase().includes(key)
        );
        setService(found || list[0]);
      })
      .catch(() => setError('Failed to load services'))
      .finally(() => setLoading(false));
  }, [serviceId]);

  // Notifications on status change
  useEffect(() => {
    if (!status?.token) return;
    const ts = status.token.status;
    const ahead = status.peopleAhead ?? 0;

    if (ts === 'SERVING' && prevStatusRef.current !== 'SERVING') {
      setBanner(notifyYourTurn(service?.name || 'Service'));
    } else if (ts === 'WAITING' && ahead > 0 && ahead <= 2 && prevStatusRef.current !== 'APPROACHING') {
      setBanner(notifyApproaching(ahead));
      prevStatusRef.current = 'APPROACHING';
    }

    if (ts === 'SERVING') prevStatusRef.current = 'SERVING';
    else if (ts === 'COMPLETED' || ts === 'CANCELLED') prevStatusRef.current = ts;
    else if (ahead > 2) prevStatusRef.current = 'WAITING';
  }, [status, service]);

  useEffect(() => {
    if (notifEnabled || !('Notification' in window)) return;
    requestNotificationPermission().then((p) => { if (p === 'granted') setNotifEnabled(true); });
  }, [notifEnabled]);

  const handleJoin = async () => {
    if (!service?._id) return;
    if (!user) {
      setAuthMessage('Please log in to get a queue token and track your place in line.');
      setAuthOpen(true);
      return;
    }
    try {
      setCreating(true); setError(null);
      const data = await createToken(service._id);
      setTokenData(data); setTokenId(data.token._id); setBanner(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to join queue');
    } finally { setCreating(false); }
  };

  const handleAuthSuccess = async (type, credentials) => {
    if (type === 'login') {
      await login(credentials.email, credentials.password);
    } else {
      await register(credentials.name, credentials.email, credentials.password);
    }
    setAuthOpen(false);
    if (service?._id) {
      try {
        setCreating(true); setError(null);
        const data = await createToken(service._id);
        setTokenData(data); setTokenId(data.token._id); setBanner(null);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to join queue');
      } finally { setCreating(false); }
    }
  };

  const handleCancel = async () => {
    if (!tokenId) return;
    try {
      setCancelling(true); setError(null);
      await cancelToken(tokenId);
      setBanner(null); setTokenId(null); setTokenData(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to cancel');
    } finally { setCancelling(false); }
  };

  const handleSwitch = (svc) => navigate(`/student/${svc._id}`);

  if (loading) return <div className="sp-loader">Loading...</div>;
  if (error && !service) return (
    <div className="sp-error">
      <p>{error}</p>
      <button onClick={() => navigate('/')}>Back to Home</button>
    </div>
  );

  const ts = status?.token?.status;

  return (
    <div className="sp">
      {/* Breadcrumb */}
      <div className="sp-breadcrumb">
        <button onClick={() => navigate('/')}>← Home</button>
        <span>/</span>
        <span className="sp-crumb-active">{service?.name}</span>
      </div>

      {/* Service chips */}
      <div className="sp-chips">
        {services.map((s) => (
          <button key={s._id} className={`sp-chip ${s._id === service?._id ? 'active' : ''} ${s.isOpen ? '' : 'off'}`}
            onClick={() => handleSwitch(s)}>
            {serviceIcons[s.name] || '🏢'} {s.name}
          </button>
        ))}
      </div>

      {/* Service header */}
      <div className="sp-header">
        <span className="sp-svc-icon">{serviceIcons[service?.name] || '🏢'}</span>
        <h1>{service?.name}</h1>
        <p>{serviceDescs[service?.name] || service?.description || ''}</p>
        <span className={`sp-open-badge ${service?.isOpen ? 'open' : 'closed'}`}>
          {service?.isOpen ? '● OPEN' : '● CLOSED'}
        </span>
      </div>

      {/* Notification banner */}
      {banner && (
        <div className={`sp-banner ${banner.type}`}>
          <span className="sp-banner-icon">{banner.type === 'serving' ? '🎉' : '🔔'}</span>
          <div>
            <strong>{banner.title}</strong>
            <span>{banner.body}</span>
          </div>
          <button onClick={() => setBanner(null)}>✕</button>
        </div>
      )}

      {!tokenId ? (
        /* ── JOIN QUEUE ── */
        <div className="sp-join-card">
          <h2>Join {service?.name} Queue</h2>

          <div className="sp-join-stats">
            <div className="sp-join-stat">
              <span className="sp-join-stat-label">Currently Serving</span>
              <span className="sp-join-stat-val">{status?.serving?.tokenNumber || '—'}</span>
            </div>
            <div className="sp-join-stat">
              <span className="sp-join-stat-label">People Waiting</span>
              <span className="sp-join-stat-val">{status?.peopleAhead ?? service?.waitingCount ?? 0}</span>
            </div>
            <div className="sp-join-stat">
              <span className="sp-join-stat-label">Estimated Wait</span>
              <span className="sp-join-stat-val">{status?.estimatedWait ?? 0} min</span>
            </div>
          </div>

          {error && <div className="sp-error-msg">{error}</div>}

          {service?.isOpen ? (
            <button className="sp-join-btn" onClick={handleJoin} disabled={creating}>
              {creating ? 'Joining...' : '🎫 Join Queue'}
            </button>
          ) : (
            <button className="sp-join-btn closed" disabled>
              Service Closed
            </button>
          )}
        </div>
      ) : (
        /* ── QUEUE STATUS ── */
        <div className="sp-status-section">
          {/* Token card */}
          <div className="sp-token-card">
            <span className="sp-token-label">YOUR TOKEN</span>
            <span className={`sp-token-num ${ts === 'SERVING' ? 'serving' : ''} ${ts === 'COMPLETED' || ts === 'CANCELLED' ? 'done' : ''}`}>
              {tokenData?.token?.tokenNumber}
            </span>
            <span className="sp-token-svc">{service?.name} Counter</span>
          </div>

          {/* Status banner */}
          <div className={`sp-status-bar ${ts === 'SERVING' ? 'serving' : ts === 'COMPLETED' ? 'done' : ts === 'CANCELLED' ? 'cancelled' : 'waiting'}`}>
            <span className="sp-status-dot"></span>
            <div>
              <strong>
                {ts === 'SERVING' ? "IT'S YOUR TURN!" :
                 ts === 'COMPLETED' ? 'COMPLETED' :
                 ts === 'CANCELLED' ? 'CANCELLED' : 'WAITING'}
              </strong>
              <span>
                {ts === 'SERVING' ? `Please proceed to the ${service?.name} counter now.` :
                 ts === 'COMPLETED' ? 'Thank you for using QueueLess Campus.' :
                 ts === 'CANCELLED' ? 'Your token has been cancelled.' :
                 'Your position updates automatically. You can leave and come back.'}
              </span>
            </div>
          </div>

          {/* Stats grid */}
          {statusLoading ? (
            <div className="sp-syncing">Syncing...</div>
          ) : status ? (
            ts === 'WAITING' ? (
              <div className="sp-stats-grid">
                <div className="sp-stat-card">
                  <span className="sp-stat-lbl">Now Serving</span>
                  <span className="sp-stat-val">{status.serving?.tokenNumber || '—'}</span>
                </div>
                <div className="sp-stat-card">
                  <span className="sp-stat-lbl">People Ahead</span>
                  <span className="sp-stat-val">{status.peopleAhead}</span>
                </div>
                <div className="sp-stat-card">
                  <span className="sp-stat-lbl">People Behind</span>
                  <span className="sp-stat-val">{status.peopleBehind}</span>
                </div>
                <div className="sp-stat-card">
                  <span className="sp-stat-lbl">Estimated Wait</span>
                  <span className="sp-stat-val">{status.estimatedWait} min</span>
                </div>
              </div>
            ) : (
              <div className="sp-stats-grid single">
                <div className="sp-stat-card wide">
                  <span className="sp-stat-lbl">Status</span>
                  <span className={`sp-stat-val status-${ts}`}>{ts}</span>
                </div>
              </div>
            )
          ) : null}

          {/* Actions */}
          <div className="sp-actions">
            {ts === 'WAITING' && (
              <button className="sp-cancel-btn" onClick={handleCancel} disabled={cancelling}>
                {cancelling ? 'Cancelling...' : 'Cancel Token'}
              </button>
            )}
            <button className="sp-new-btn" onClick={() => { setTokenId(null); setTokenData(null); setError(null); setBanner(null); }}>
              Get Another Token
            </button>
          </div>
        </div>
      )}

      <AuthModal
        isOpen={authOpen}
        onClose={() => setAuthOpen(false)}
        onAuthSuccess={handleAuthSuccess}
        initialMode="register"
        message={authMessage}
      />
    </div>
  );
};

export default StudentPage;
