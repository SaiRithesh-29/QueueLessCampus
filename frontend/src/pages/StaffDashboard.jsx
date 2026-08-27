import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getServices, completeToken } from '../services/api';
import { useQueueStatus } from '../hooks/useQueue';
import { connectSocket } from '../services/socket';
import './StaffDashboard.css';

const StaffDashboard = () => {
  const navigate = useNavigate();
  const [services, setServices] = useState([]);
  const [selectedService, setSelectedService] = useState(null);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);

  const { queue, loading: queueLoading, refetch } = useQueueStatus(selectedService?._id);

  useEffect(() => {
    connectSocket();
    getServices()
      .then((data) => {
        setServices(data);
        if (data.length > 0) setSelectedService(data[0]);
      })
      .catch(() => setError('Failed to load services'))
      .finally(() => setLoading(false));
  }, []);

  const handleComplete = async () => {
    if (!selectedService || !queue?.serving) return;
    try {
      setCompleting(true);
      setError(null);
      const result = await completeToken(selectedService._id);
      setMessage(result.message);
      refetch();
      setTimeout(() => setMessage(null), 4000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to complete token');
    } finally {
      setCompleting(false);
    }
  };

  if (loading) return <div className="sd-loading">Loading...</div>;

  return (
    <div className="staff-page">
      <div className="sd-topbar">
        <button className="sd-back" onClick={() => navigate('/')}>← Back</button>
        <h1 className="sd-title">Staff Dashboard</h1>
      </div>

      <div className="sd-selector">
        <label>Service:</label>
        <select
          value={selectedService?._id || ''}
          onChange={(e) => {
            const svc = services.find((s) => s._id === e.target.value);
            setSelectedService(svc);
            setMessage(null);
            setError(null);
          }}
        >
          {services.map((s) => (
            <option key={s._id} value={s._id}>{s.name}</option>
          ))}
        </select>
      </div>

      {error && <div className="sd-error">{error}</div>}
      {message && <div className="sd-success">{message}</div>}

      <div className="sd-content">
        {queueLoading ? (
          <div className="sd-loading">Loading queue...</div>
        ) : queue ? (
          <>
            <div className="sd-current-card">
              <span className="sd-card-label">CURRENTLY SERVING</span>
              {queue.serving ? (
                <span className="sd-serving-num">{queue.serving.tokenNumber}</span>
              ) : (
                <span className="sd-no-token">No token serving</span>
              )}
            </div>

            <div className="sd-stats">
              <div className="sd-stat">
                <span className="sd-stat-val">{queue.waitingCount}</span>
                <span className="sd-stat-lbl">Waiting</span>
              </div>
              <div className="sd-stat">
                <span className="sd-stat-val">{queue.completedToday}</span>
                <span className="sd-stat-lbl">Completed Today</span>
              </div>
            </div>

            <div className="sd-queue-card">
              <span className="sd-card-label">WAITING QUEUE</span>
              {queue.waiting.length === 0 ? (
                <p className="sd-empty">No tokens waiting</p>
              ) : (
                <div className="sd-waiting-list">
                  {queue.waiting.map((t, i) => (
                    <div key={t._id} className="sd-wait-item">
                      <span className="sd-wait-pos">{i + 1}</span>
                      <span className="sd-wait-num">{t.tokenNumber}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button
              className="sd-complete-btn"
              onClick={handleComplete}
              disabled={completing || !queue.serving}
            >
              {completing ? 'Completing...' : 'Complete Token'}
            </button>
          </>
        ) : (
          <p className="sd-empty">No queue data available</p>
        )}
      </div>
    </div>
  );
};

export default StaffDashboard;
