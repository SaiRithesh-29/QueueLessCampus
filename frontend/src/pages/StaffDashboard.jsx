import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getServices, completeToken, toggleService } from '../services/api';
import { useQueueStatus } from '../hooks/useQueue';
import { useAnalytics } from '../hooks/useQueue';
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
  const { analytics, refetch: refetchAnalytics } = useAnalytics(selectedService?._id);

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
      refetchAnalytics();
      setTimeout(() => setMessage(null), 5000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to complete token');
    } finally {
      setCompleting(false);
    }
  };

  const handleToggleService = async () => {
    if (!selectedService) return;
    try {
      setError(null);
      const updated = await toggleService(selectedService._id);
      setSelectedService(updated);
      setServices((prev) => prev.map((s) => (s._id === updated._id ? updated : s)));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update service status');
    }
  };

  const handleSelectService = (e) => {
    const svc = services.find((s) => s._id === e.target.value);
    setSelectedService(svc);
    setMessage(null);
    setError(null);
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
          <label>Service:</label>
          <select
            value={selectedService?._id || ''}
            onChange={handleSelectService}
          >
            {services.map((s) => (
              <option key={s._id} value={s._id}>
                {s.name} ({s.code}) {s.isOpen ? '' : '· CLOSED'}
              </option>
            ))}
          </select>
        </div>

        {selectedService && (
          <div className="sd-status-bar">
            <div className="sd-status-info">
              <span className={`sd-status-dot ${selectedService.isOpen ? 'open' : 'closed'}`}></span>
              <span className="sd-status-label">
                {selectedService.isOpen ? 'SERVICE OPEN' : 'SERVICE CLOSED'}
              </span>
              <span className="sd-status-nowserving">
                Current: {queue?.serving?.tokenNumber || '—'} · Waiting: {queue?.waitingCount ?? 0}
              </span>
            </div>
            <button className="sd-status-toggle" onClick={handleToggleService}>
              {selectedService.isOpen ? 'Close Service' : 'Open Service'}
            </button>
          </div>
        )}
      </div>

      {error && <div className="sd-error">⚠️ {error}</div>}
      {message && <div className="sd-success">✅ {message}</div>}

      <div className="sd-content">
        {queueLoading ? (
          <div className="sd-loading">🔄 Syncing queue control panel...</div>
        ) : queue ? (
          <div className="sd-grid">
            {/* Main column: queue management */}
            <div className="sd-main-col">
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

              {/* Complete Token Action Button */}
              <button
                className="sd-complete-btn"
                onClick={handleComplete}
                disabled={completing || !queue.serving}
              >
                {completing ? '⏳ Advancing Queue...' : '✅ Complete Current Token'}
              </button>

              {/* Waiting List Card */}
              <div className="sd-queue-card">
                <div className="sd-queue-header">
                  <span className="sd-card-label-dark">WAITING QUEUE</span>
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
                        <span className="sd-wait-time">Waiting</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Side column: analytics */}
            <div className="sd-side-col">
              <div className="sd-analytics-card">
                <div className="sd-ana-header">
                  <span className="sd-card-label-dark">TODAY'S QUEUE</span>
                </div>
                <div className="sd-ana-grid">
                  <div className="sd-ana-item">
                    <span className="sd-ana-val">{analytics?.tokensServed ?? '—'}</span>
                    <span className="sd-ana-lbl">Tokens Served</span>
                  </div>
                  <div className="sd-ana-item">
                    <span className="sd-ana-val">{analytics?.currentlyWaiting ?? '—'}</span>
                    <span className="sd-ana-lbl">Currently Waiting</span>
                  </div>
                  <div className="sd-ana-item">
                    <span className="sd-ana-val">{analytics?.currentlyServing || '—'}</span>
                    <span className="sd-ana-lbl">Currently Serving</span>
                  </div>
                  <div className="sd-ana-item">
                    <span className="sd-ana-val">{analytics ? `${analytics.averageWait} min` : '—'}</span>
                    <span className="sd-ana-lbl">Average Wait</span>
                  </div>
                  <div className="sd-ana-item">
                    <span className="sd-ana-val">{analytics ? `${analytics.averageService} min` : '—'}</span>
                    <span className="sd-ana-lbl">Average Service</span>
                  </div>
                </div>
              </div>

              {/* Quick stats */}
              <div className="sd-stats">
                <div className="sd-stat waiting">
                  <span className="sd-stat-val">{queue.waitingCount}</span>
                  <span className="sd-stat-lbl">Waiting</span>
                </div>
                <div className="sd-stat completed">
                  <span className="sd-stat-val">{queue.completedToday}</span>
                  <span className="sd-stat-lbl">Served Today</span>
                </div>
              </div>

              {/* Service status overview */}
              <div className="sd-services-card">
                <div className="sd-card-label-dark">SERVICE STATUS</div>
                <div className="sd-service-list">
                  {services.map((s) => (
                    <div key={s._id} className="sd-service-row">
                      <span className="sd-service-name">{s.name}</span>
                      <span className={`sd-service-dot ${s.isOpen ? 'open' : 'closed'}`}></span>
                      <span className="sd-service-open">{s.isOpen ? 'Open' : 'Closed'}</span>
                      <span className="sd-service-now">Now: {s.serving?.tokenNumber || '—'}</span>
                      <span className="sd-service-wait">Waiting: {s.waitingCount ?? 0}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <p className="sd-empty">No queue data available</p>
        )}
      </div>
    </div>
  );
};

export default StaffDashboard;
