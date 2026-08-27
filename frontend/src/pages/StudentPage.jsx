import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getServices, createToken, cancelToken } from '../services/api';
import { useTokenStatus } from '../hooks/useQueue';
import { connectSocket } from '../services/socket';
import { notifyApproaching, notifyYourTurn, requestNotificationPermission } from '../services/notifications';
import './StudentPage.css';

const serviceIcons = { Canteen: '🍽️', Library: '📚', Office: '🏛️', Counter: '💳' };

const STATUS_BADGE = {
  WAITING: 'WAITING',
  SERVING: 'SERVING',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED'
};

const StudentPage = () => {
  const { serviceId } = useParams();
  const navigate = useNavigate();
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
  const prevAheadRef = useRef(null);
  const prevStatusRef = useRef(null);

  const { status, loading: statusLoading } = useTokenStatus(tokenId);

  // Load services and resolve the selected service
  useEffect(() => {
    connectSocket();
    getServices()
      .then((servicesList) => {
        if (!servicesList || servicesList.length === 0) {
          setError('No active services found in database');
          return;
        }
        setServices(servicesList);
        const key = (serviceId || '').toLowerCase();
        const found = servicesList.find((s) =>
          s._id === serviceId ||
          (s.code && s.code.toLowerCase() === key) ||
          s.name.toLowerCase().includes(key) ||
          key.includes(s.name.toLowerCase())
        );
        setService(found || servicesList[0]);
      })
      .catch(() => setError('Failed to load service details'))
      .finally(() => setLoading(false));
  }, [serviceId]);

  // Handle near-turn / turn notifications based on status transitions
  useEffect(() => {
    if (!status || !status.token) return;

    const tokenStatus = status.token.status;
    const peopleAhead = status.peopleAhead ?? 0;

    // Notify when token becomes SERVING
    if (tokenStatus === 'SERVING' && prevStatusRef.current !== 'SERVING') {
      const n = notifyYourTurn(service?.name || 'Service');
      setBanner(n);
    }
    // Notify when approaching (<= 2 ahead) and still WAITING
    else if (
      tokenStatus === 'WAITING' &&
      peopleAhead > 0 &&
      peopleAhead <= 2 &&
      prevStatusRef.current !== 'APPROACHING'
    ) {
      prevAheadRef.current = peopleAhead;
      const n = notifyApproaching(peopleAhead);
      setBanner(n);
      prevStatusRef.current = 'APPROACHING';
    }
    // Reset flags appropriately
    if (tokenStatus === 'SERVING') {
      prevStatusRef.current = 'SERVING';
    } else if (tokenStatus === 'COMPLETED' || tokenStatus === 'CANCELLED') {
      prevStatusRef.current = tokenStatus;
    } else if (peopleAhead > 2) {
      prevStatusRef.current = 'WAITING';
    }
  }, [status, service]);

  // Auto-request notification permission once (user gesture later handles it)
  useEffect(() => {
    if (notifEnabled || !('Notification' in window)) return;
    requestNotificationPermission().then((p) => {
      if (p === 'granted') setNotifEnabled(true);
    });
  }, [notifEnabled]);

  const handleGetToken = async () => {
    if (!service?._id) return;
    try {
      setCreating(true);
      setError(null);
      const data = await createToken(service._id);
      setTokenData(data);
      setTokenId(data.token._id);
      setBanner(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to generate token');
    } finally {
      setCreating(false);
    }
  };

  const handleCancelToken = async () => {
    if (!tokenId) return;
    try {
      setCancelling(true);
      setError(null);
      await cancelToken(tokenId);
      setBanner(null);
      setTokenId(null);
      setTokenData(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to cancel token');
    } finally {
      setCancelling(false);
    }
  };

  const handleSelectService = (svc) => {
    navigate(`/student/${svc._id}`);
  };

  if (loading) return <div className="sp-loading">⏳ Loading service queue details...</div>;

  if (error && !service) return (
    <div className="sp-error">
      <p>⚠️ {error}</p>
      <button onClick={() => navigate('/')}>← Return to Home</button>
    </div>
  );

  const tokenStatus = status?.token?.status;

  return (
    <div className="student-page">
      {/* Breadcrumb Navigation */}
      <div className="sp-breadcrumb">
        <button className="sp-back-btn" onClick={() => navigate('/')}>
          ← Back to Home
        </button>
        <span className="sp-crumb-sep">/</span>
        <span className="sp-crumb-current">{service?.name || 'Queue Token'}</span>
      </div>

      {/* Header Info */}
      <div className="sp-header">
        <div className="sp-icon-wrap">
          <span>{serviceIcons[service?.name] || '🏢'}</span>
        </div>
        <h1 className="sp-name">{service?.name}</h1>
        <p className="sp-desc">{service?.description || 'Virtual Queue Token Dispenser'}</p>
        <span className={`service-open-badge ${service?.isOpen ? 'open' : 'closed'}`}>
          {service?.isOpen ? '● OPEN' : '● CLOSED'}
        </span>
      </div>

      {banner && (
        <div className={`notif-banner ${banner.type === 'serving' ? 'serving' : 'approaching'}`}>
          <span className="notif-icon">{banner.type === 'serving' ? '🔔' : '⏰'}</span>
          <div className="notif-text">
            <span className="notif-title">{banner.title}</span>
            <span className="notif-body">{banner.body}</span>
          </div>
          <button className="notif-close" onClick={() => setBanner(null)}>✕</button>
        </div>
      )}

      {/* Service selector for improved dashboard */}
      {services.length > 1 && (
        <div className="sp-service-selector">
          <span className="sp-selector-label">Switch Service:</span>
          <div className="sp-selector-chips">
            {services.map((s) => (
              <button
                key={s._id}
                className={`sp-chip ${s._id === service?._id ? 'active' : ''} ${s.isOpen ? '' : 'closed'}`}
                onClick={() => handleSelectService(s)}
              >
                {serviceIcons[s.name] || '🏢'} {s.name} {s.isOpen ? '' : '· Closed'}
              </button>
            ))}
          </div>
        </div>
      )}

      {!tokenId ? (
        <div className="gen-section">
          <div className="gen-card">
            <h3>Ready to join the line?</h3>
            <p className="gen-text">
              Click below to generate your digital token. You'll receive real-time queue updates right on this screen — no need to stand in line.
            </p>
            {error && <div className="error-msg">{error}</div>}
            <button
              className="get-token-btn"
              onClick={handleGetToken}
              disabled={creating || !service?.isOpen}
            >
              {!service?.isOpen
                ? '🚫 Service Closed'
                : creating
                  ? '⏳ Dispensing Token...'
                  : '🎫 Join Queue'}
            </button>
            {!service?.isOpen && (
              <p className="closed-note">This service is currently closed. Please try again later.</p>
            )}
            {/* Available services overview */}
            <div className="gen-services-preview">
              <span className="preview-label">Quick access:</span>
              <div className="preview-chips">
                {services.map((s) => (
                  <button key={s._id} className="preview-chip" onClick={() => handleSelectService(s)}>
                    {serviceIcons[s.name] || '🏢'} {s.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="token-section">
          <div className="join-confirmation">
            <span className="confirm-icon">✅</span>
            <span className="confirm-text">You've successfully joined the virtual queue! You can now leave the queue area and monitor your status remotely.</span>
          </div>

          {/* Main Token Card */}
          <div className="token-main-card">
            <span className="token-label">YOUR TOKEN</span>
            <span className={`token-big ${tokenStatus === 'SERVING' ? 'is-serving' : ''} ${tokenStatus === 'COMPLETED' ? 'is-done' : ''} ${tokenStatus === 'CANCELLED' ? 'is-done' : ''}`}>
              {tokenData?.token?.tokenNumber}
            </span>
            <div className="token-service-tag">
              {service?.name} Counter
            </div>
          </div>

          {statusLoading ? (
            <div className="status-loading">🔄 Syncing queue position...</div>
          ) : status ? (
            <>
              {/* Queue Status Banner */}
              <div className={`queue-status-banner ${tokenStatus === 'SERVING' ? 'serving' : tokenStatus === 'COMPLETED' ? 'completed' : tokenStatus === 'CANCELLED' ? 'cancelled' : 'waiting'}`}>
                <span className="status-badge">
                  {tokenStatus === 'SERVING' ? '🔔 SERVING'
                    : tokenStatus === 'COMPLETED' ? '✅ COMPLETED'
                    : tokenStatus === 'CANCELLED' ? '✖ CANCELLED'
                    : '⏳ WAITING'}
                </span>
                <span className="status-text">
                  {tokenStatus === 'SERVING'
                    ? "It's your turn! Please proceed to the counter now."
                    : tokenStatus === 'COMPLETED'
                      ? 'Your service has been completed. Thank you!'
                      : tokenStatus === 'CANCELLED'
                        ? 'This token has been cancelled.'
                        : 'You are in the queue. Your position updates automatically.'}
                </span>
              </div>

              {/* Real-time status grid */}
              {tokenStatus === 'WAITING' ? (
                <div className="status-grid">
                  <div className="info-card">
                    <span className="info-lbl">Currently Serving</span>
                    <span className="info-val">{status.serving?.tokenNumber || 'None'}</span>
                  </div>
                  <div className="info-card">
                    <span className="info-lbl">People Ahead</span>
                    <span className="info-val">{status.peopleAhead}</span>
                  </div>
                  <div className="info-card">
                    <span className="info-lbl">People Behind</span>
                    <span className="info-val">{status.peopleBehind}</span>
                  </div>
                  <div className="info-card">
                    <span className="info-lbl">Estimated Wait</span>
                    <span className="info-val">{status.estimatedWait} min</span>
                  </div>
                  <div className="info-card">
                    <span className="info-lbl">Queue Status</span>
                    <span className="info-val active-dot">● Active</span>
                  </div>
                </div>
              ) : (
                <div className="status-single">
                  <div className="info-card">
                    <span className="info-lbl">Your Token Status</span>
                    <span className={`info-val status-${(tokenStatus || '').toLowerCase()}`}>
                      {STATUS_BADGE[tokenStatus] || tokenStatus}
                    </span>
                  </div>
                </div>
              )}
            </>
          ) : null}

          {/* Actions */}
          <div className="token-actions">
            {tokenStatus === 'WAITING' && (
              <button className="cancel-token-btn" onClick={handleCancelToken} disabled={cancelling}>
                {cancelling ? '⏳ Cancelling...' : '✖ Cancel My Token'}
              </button>
            )}
            <button className="new-token-btn" onClick={() => { setTokenId(null); setTokenData(null); setError(null); setBanner(null); }}>
              + Get Another Token
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentPage;
