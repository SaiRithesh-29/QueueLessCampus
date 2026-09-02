import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllAnalytics, getServices, getQueueStatus, completeToken, toggleService } from '../services/api';
import { connectSocket } from '../services/socket';
import './StaffDashboard.css';

const serviceIcons = { Canteen: '🍽️', Library: '📚', Office: '🏛️', Counter: '💳' };

const StaffDashboard = () => {
  const navigate = useNavigate();
  const [analytics, setAnalytics] = useState(null);
  const [services, setServices] = useState([]);
  const [selectedService, setSelectedService] = useState(null);
  const [queueData, setQueueData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [calling, setCalling] = useState(false);
  const [toggling, setToggling] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      const [a, s] = await Promise.all([getAllAnalytics(), getServices()]);
      setAnalytics(a);
      setServices(s);
      if (s.length > 0 && !selectedService) setSelectedService(s[0]);
      else if (selectedService) {
        const updated = s.find((sv) => sv._id === selectedService._id);
        if (updated) setSelectedService(updated);
      }
    } catch {} finally { setLoading(false); }
  }, [selectedService]);

  const fetchQueue = useCallback(async () => {
    if (!selectedService?._id) return;
    try {
      const data = await getQueueStatus(selectedService._id);
      setQueueData(data);
    } catch {}
  }, [selectedService]);

  useEffect(() => { fetchData(); }, []);
  useEffect(() => { fetchQueue(); }, [fetchQueue]);

  useEffect(() => {
    const socket = connectSocket();
    const handleUpdate = (data) => {
      if (data?.serviceId && selectedService?._id && data.serviceId !== selectedService._id) return;
      fetchData();
      fetchQueue();
    };
    socket.on('queue:update', handleUpdate);
    socket.on('service:update', handleUpdate);
    return () => {
      socket.off('queue:update', handleUpdate);
      socket.off('service:update', handleUpdate);
    };
  }, [fetchData, fetchQueue, selectedService?._id]);

  const handleCallNext = async () => {
    if (!selectedService?._id) return;
    try {
      setCalling(true);
      await completeToken(selectedService._id);
      await fetchData();
      await fetchQueue();
    } catch {} finally { setCalling(false); }
  };

  const handleToggleService = async (svc) => {
    try {
      setToggling(svc._id);
      await toggleService(svc._id);
      await fetchData();
    } catch {} finally { setToggling(null); }
  };

  if (loading) return <div className="sd-loader">Loading dashboard...</div>;

  const waitingList = queueData?.waiting || [];

  return (
    <div className="sd">
      {/* Header */}
      <div className="sd-top">
        <div className="sd-top-left">
          <h1>Staff Dashboard</h1>
          <p>Manage your queue in real time</p>
        </div>
        <div className="sd-top-right">
          <button className="sd-sync-btn" onClick={() => { fetchData(); fetchQueue(); }}>↻ Refresh</button>
          <button className="sd-home-btn" onClick={() => navigate('/')}>← Home</button>
        </div>
      </div>

      {/* Overview stats */}
      {analytics && (
        <div className="sd-overview">
          {[
            { label: 'Total Tokens Today', value: analytics.totalTokens ?? 0, color: '#2563eb' },
            { label: 'Currently Waiting', value: analytics.waitingTokens ?? 0, color: '#f59e0b' },
            { label: 'Avg Wait Time', value: `${analytics.averageWaitTime ?? 0}m`, color: '#0d9488' },
            { label: 'Completed Today', value: analytics.completedTokens ?? 0, color: '#16a34a' },
          ].map((stat) => (
            <div key={stat.label} className="sd-stat">
              <span className="sd-stat-val" style={{ color: stat.color }}>{stat.value}</span>
              <span className="sd-stat-lbl">{stat.label}</span>
            </div>
          ))}
        </div>
      )}

      {/* Service selector */}
      <div className="sd-svc-bar">
        {services.map((s) => (
          <button key={s._id} className={`sd-svc-tab ${s._id === selectedService?._id ? 'active' : ''}`}
            onClick={() => setSelectedService(s)}>
            <span className="sd-svc-tab-icon">{serviceIcons[s.name] || '🏢'}</span>
            {s.name}
          </button>
        ))}
      </div>

      {selectedService && (
        <div className="sd-main">
          {/* Left: Current token */}
          <div className="sd-current">
            <div className="sd-current-head">
              <span className="sd-current-svc">{serviceIcons[selectedService.name] || '🏢'} {selectedService.name}</span>
              <div className="sd-current-head-btns">
                <button className={`sd-toggle-btn ${selectedService.isOpen ? 'on' : 'off'}`}
                  onClick={() => handleToggleService(selectedService)} disabled={toggling === selectedService._id}>
                  {toggling === selectedService._id ? '...' : selectedService.isOpen ? '● Open' : '● Closed'}
                </button>
                <button className="sd-call-btn" onClick={handleCallNext} disabled={calling || !selectedService.isOpen}>
                  {calling ? 'Calling...' : 'Next ▸'}
                </button>
              </div>
            </div>

            <div className="sd-big-token">
              <span className="sd-big-label">NOW SERVING</span>
              {selectedService.serving?.tokenNumber ? (
                <span className="sd-big-num">{selectedService.serving.tokenNumber}</span>
              ) : (
                <span className="sd-big-num none">—</span>
              )}
            </div>

            <div className="sd-mini-stats">
              <div className="sd-mini-stat">
                <span className="sd-mini-stat-val">{selectedService.waitingCount ?? 0}</span>
                <span className="sd-mini-stat-lbl">Waiting</span>
              </div>
              <div className="sd-mini-stat">
                <span className="sd-mini-stat-val">{selectedService.averageServiceTime || '—'}m</span>
                <span className="sd-mini-stat-lbl">Avg Time</span>
              </div>
              <div className="sd-mini-stat">
                <span className="sd-mini-stat-val">{selectedService.estimatedWait ?? 0}m</span>
                <span className="sd-mini-stat-lbl">Est. Wait</span>
              </div>
            </div>
          </div>

          {/* Right: Queue list */}
          <div className="sd-queue">
            <h3>Waiting Queue</h3>
            <div className="sd-queue-list">
              {waitingList.length === 0 ? (
                <div className="sd-queue-empty">No one in queue</div>
              ) : (
                waitingList.map((token, i) => (
                  <div key={token._id || i} className={`sd-queue-item ${token.status === 'SERVING' ? 'serving' : token.status === 'WAITING' ? 'waiting' : token.status === 'COMPLETED' ? 'done' : 'cancelled'}`}>
                    <div className="sd-queue-item-left">
                      <span className="sd-queue-pos">{token.status === 'SERVING' ? '▶' : `#${i + 1}`}</span>
                      <div>
                        <strong>{token.tokenNumber}</strong>
                        <span className="sd-queue-time">
                          {token.status === 'SERVING' ? 'SERVING NOW' :
                           token.status === 'COMPLETED' ? 'DONE' :
                           token.status === 'CANCELLED' ? 'CANCELLED' :
                           new Date(token.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                    <span className={`sd-queue-badge ${token.status?.toLowerCase()}`}>{token.status}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffDashboard;
