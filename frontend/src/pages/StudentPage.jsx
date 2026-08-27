import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getServices, createToken } from '../services/api';
import { useTokenStatus } from '../hooks/useQueue';
import { connectSocket } from '../services/socket';
import './StudentPage.css';

const serviceIcons = { Canteen: '🍽️', Library: '📚', Office: '🏛️', Counter: '💳' };

const StudentPage = () => {
  const { serviceId } = useParams();
  const navigate = useNavigate();
  const [service, setService] = useState(null);
  const [tokenId, setTokenId] = useState(null);
  const [tokenData, setTokenData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState(null);

  const { status, loading: statusLoading } = useTokenStatus(tokenId);

  useEffect(() => {
    connectSocket();
    getServices()
      .then((servicesList) => {
        if (!servicesList || servicesList.length === 0) {
          setError('No active services found in database');
          return;
        }

        // Match by _id, code, or substring of name
        const key = (serviceId || '').toLowerCase();
        const found = servicesList.find((s) => 
          s._id === serviceId || 
          (s.code && s.code.toLowerCase() === key) || 
          s.name.toLowerCase().includes(key) ||
          key.includes(s.name.toLowerCase())
        );

        if (found) {
          setService(found);
        } else {
          // Fallback to first service in list
          setService(servicesList[0]);
        }
      })
      .catch(() => setError('Failed to load service details'))
      .finally(() => setLoading(false));
  }, [serviceId]);

  const handleGetToken = async () => {
    if (!service?._id) return;
    try {
      setCreating(true);
      setError(null);
      const data = await createToken(service._id);
      setTokenData(data);
      setTokenId(data.token._id);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to generate token');
    } finally {
      setCreating(false);
    }
  };

  if (loading) return <div className="sp-loading">⏳ Loading service queue details...</div>;
  
  if (error && !service) return (
    <div className="sp-error">
      <p>⚠️ {error}</p>
      <button onClick={() => navigate('/')}>← Return to Home</button>
    </div>
  );

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
      </div>

      {!tokenId ? (
        <div className="gen-section">
          <div className="gen-card">
            <h3>Ready to join the line?</h3>
            <p className="gen-text">
              Click below to generate your digital token. You'll receive real-time queue notifications right on this screen.
            </p>
            {error && <div className="error-msg">{error}</div>}
            <button className="get-token-btn" onClick={handleGetToken} disabled={creating}>
              {creating ? '⏳ Dispensing Token...' : '🎫 Get Queue Token'}
            </button>
          </div>
        </div>
      ) : (
        <div className="token-section">
          {/* Main QLess Pass Card */}
          <div className="token-main-card">
            <span className="token-label">YOUR VIRTUAL TOKEN</span>
            <span className={`token-big ${status?.isServing ? 'is-serving' : ''} ${status?.isCompleted ? 'is-done' : ''}`}>
              {tokenData?.token?.tokenNumber}
            </span>
            <div className="token-service-tag">
              {service?.name} Counter
            </div>
          </div>

          {/* Status Metrics */}
          {statusLoading ? (
            <div className="status-loading">🔄 Syncing queue position...</div>
          ) : status ? (
            <div className="status-grid">
              {status.isCompleted ? (
                <div className="badge badge-done">
                  ✅ TOKEN COMPLETED
                  <div className="badge-sub">Thank you for using QueueLess Campus!</div>
                </div>
              ) : status.isServing ? (
                <div className="badge badge-serving">
                  🔔 NOW SERVING AT COUNTER!
                  <div className="badge-sub">Please proceed to {service?.name} desk now.</div>
                </div>
              ) : (
                <>
                  <div className="info-card">
                    <span className="info-lbl">Currently Serving</span>
                    <span className="info-val">{status.serving?.tokenNumber || 'None'}</span>
                  </div>
                  <div className="info-card">
                    <span className="info-lbl">People Ahead</span>
                    <span className="info-val">{status.peopleAhead}</span>
                  </div>
                  <div className="info-card">
                    <span className="info-lbl">Estimated Wait</span>
                    <span className="info-val">{status.estimatedWait} min</span>
                  </div>
                  <div className="info-card">
                    <span className="info-lbl">Queue Status</span>
                    <span className="info-val active-dot">● Active Line</span>
                  </div>
                </>
              )}
            </div>
          ) : null}

          <button className="new-token-btn" onClick={() => { setTokenId(null); setTokenData(null); setError(null); }}>
            + Get Another Token
          </button>
        </div>
      )}
    </div>
  );
};

export default StudentPage;
