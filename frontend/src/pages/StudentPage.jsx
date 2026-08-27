import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getServices, createToken } from '../services/api';
import { useTokenStatus } from '../hooks/useQueue';
import { connectSocket } from '../services/socket';
import './StudentPage.css';

const serviceIcons = { Canteen: '🍽', Library: '📚', Office: '🏛' };

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
      .then((services) => {
        const found = services.find((s) => s._id === serviceId);
        if (found) setService(found);
        else setError('Service not found');
      })
      .catch(() => setError('Failed to load service'))
      .finally(() => setLoading(false));
  }, [serviceId]);

  const handleGetToken = async () => {
    try {
      setCreating(true);
      setError(null);
      const data = await createToken(serviceId);
      setTokenData(data);
      setTokenId(data.token._id);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to generate token');
    } finally {
      setCreating(false);
    }
  };

  if (loading) return <div className="sp-loading">Loading...</div>;
  if (error && !service) return (
    <div className="sp-error">
      <p>{error}</p>
      <button onClick={() => navigate('/')}>Go Back</button>
    </div>
  );

  return (
    <div className="student-page">
      <button className="back-btn" onClick={() => navigate('/')}>← Back</button>
      <div className="sp-header">
        <span className="sp-icon">{serviceIcons[service?.name] || '🏢'}</span>
        <h1 className="sp-name">{service?.name}</h1>
      </div>

      {!tokenId ? (
        <div className="gen-section">
          <p className="gen-text">Click below to get your queue token</p>
          {error && <div className="error-msg">{error}</div>}
          <button className="get-token-btn" onClick={handleGetToken} disabled={creating}>
            {creating ? 'Generating...' : 'Get Token'}
          </button>
        </div>
      ) : (
        <div className="token-section">
          <div className="token-main-card">
            <span className="token-label">YOUR TOKEN</span>
            <span className={`token-big ${status?.isServing ? 'is-serving' : ''} ${status?.isCompleted ? 'is-done' : ''}`}>
              {tokenData?.token?.tokenNumber}
            </span>
          </div>

          {statusLoading ? (
            <div className="status-loading">Updating...</div>
          ) : status ? (
            <div className="status-grid">
              {status.isCompleted ? (
                <div className="badge badge-done">COMPLETED</div>
              ) : status.isServing ? (
                <div className="badge badge-serving">NOW SERVING</div>
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
                    <span className="info-val active-dot">● Active</span>
                  </div>
                </>
              )}
            </div>
          ) : null}

          <button className="new-token-btn" onClick={() => { setTokenId(null); setTokenData(null); setError(null); }}>
            Get Another Token
          </button>
        </div>
      )}
    </div>
  );
};

export default StudentPage;
