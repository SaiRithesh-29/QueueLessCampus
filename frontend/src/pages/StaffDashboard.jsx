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

  if (loading) return <div className="sd-loading">⏳ Loading Operator Dashboard...</div>;

  return (
    <div className="staff-page">
      {/* Top Header Bar */}
      <div className="sd-header-bar">
        <div className="sd-title-group">
          <button className="sd-back-btn" onClick={() => navigate('/')}>
            ← Back to Home
          </button>
          <h2>🛡️ Staff Operator Control Center</h2>
        </div>

        <div className="sd-selector-box">
          <label>Active Counter:</label>
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
              <option key={s._id} value={s._id}>
                {s.name} Desk ({s.code})
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && <div className="sd-error">⚠️ {error}</div>}
      {message && <div className="sd-success">✅ {message}</div>}

      <div className="sd-content">
        {queueLoading ? (
          <div className="sd-loading">🔄 Syncing queue control panel...</div>
        ) : queue ? (
          <>
            {/* Currently Serving Hero Card */}
            <div className="sd-current-card">
              <div className="sd-card-header">
                <span className="sd-card-label">CURRENTLY SERVING</span>
                <span className="sd-counter-badge">{selectedService?.name} Counter</span>
              </div>

              {queue.serving ? (
                <div className="sd-serving-box">
                  <span className="sd-serving-num">{queue.serving.tokenNumber}</span>
                  <span className="sd-serving-status">In Progress</span>
                </div>
              ) : (
                <div className="sd-no-token-box">
                  <span className="sd-no-token">No Token Currently Being Served</span>
                  <span className="sd-no-token-sub">Next student will be called when queue advances.</span>
                </div>
              )}
            </div>

            {/* Metrics Row */}
            <div className="sd-stats">
              <div className="sd-stat waiting">
                <span className="sd-stat-val">{queue.waitingCount}</span>
                <span className="sd-stat-lbl">Students Waiting</span>
              </div>
              <div className="sd-stat completed">
                <span className="sd-stat-val">{queue.completedToday}</span>
                <span className="sd-stat-lbl">Completed Today</span>
              </div>
            </div>

            {/* Complete Token Action Button */}
            <button
              className="sd-complete-btn"
              onClick={handleComplete}
              disabled={completing || !queue.serving}
            >
              {completing ? '⏳ Advancing Queue...' : '✅ Complete & Call Next Token'}
            </button>

            {/* Waiting List Card */}
            <div className="sd-queue-card">
              <div className="sd-queue-header">
                <span className="sd-card-label">WAITING LINE QUEUE</span>
                <span className="sd-queue-count">{queue.waiting.length} in line</span>
              </div>

              {queue.waiting.length === 0 ? (
                <div className="sd-empty-box">
                  <span>🎉 Queue line is empty!</span>
                </div>
              ) : (
                <div className="sd-waiting-list">
                  {queue.waiting.map((t, i) => (
                    <div key={t._id} className="sd-wait-item">
                      <span className="sd-wait-pos">#{i + 1}</span>
                      <span className="sd-wait-num">{t.tokenNumber}</span>
                      <span className="sd-wait-time">Waiting in line</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        ) : (
          <p className="sd-empty">No queue data available</p>
        )}
      </div>
    </div>
  );
};

export default StaffDashboard;
