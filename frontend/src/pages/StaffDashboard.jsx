import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllAnalytics, getServices, getQueueStatus, completeToken, rejectToken, toggleService, holdService } from '../services/api';
import { connectSocket } from '../services/socket';
import './StaffDashboard.css';

const serviceIcons = { Canteen: '🍽️', Library: '📚', Office: '🏛️', Counter: '💳' };
const serviceColors = {
  Canteen: { bg: '#fff7ed', border: '#fed7aa', accent: '#ea580c', light: '#fffbeb' },
  Library: { bg: '#eff6ff', border: '#bfdbfe', accent: '#2563eb', light: '#eff6ff' },
  Office: { bg: '#faf5ff', border: '#d8b4fe', accent: '#9333ea', light: '#faf5ff' },
  Counter: { bg: '#f0fdfa', border: '#99f6e4', accent: '#0d9488', light: '#f0fdfa' },
};
const servingTickStyle = { position: 'absolute', top: '0.5rem', right: '0.5rem', width: '20px', height: '20px', border: '3px solid #16a34a', borderRadius: '50%', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900', color: '#16a34a', fontSize: '1rem', boxShadow: '0 0 0 2px #dcfce7' };
const servingTickSmall = { width: '16px', height: '16px', borderWidth: '2px', fontSize: '0.7rem' };

const StaffDashboard = () => {
  const navigate = useNavigate();
  const [analytics, setAnalytics] = useState(null);
  const [services, setServices] = useState([]);
  const [selectedService, setSelectedService] = useState(null);
  const [queueData, setQueueData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [calling, setCalling] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [toggling, setToggling] = useState(null);
  const [holding, setHolding] = useState(null);
  const [isServing, setIsServing] = useState(false);

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

  const handleAccept = async () => {
    if (!selectedService?._id) return;
    try {
      setCalling(true);
      await completeToken(selectedService._id);
      await fetchData();
      await fetchQueue();
    } catch {} finally { setCalling(false); }
  };

  const handleReject = async () => {
    if (!selectedService?._id) return;
    try {
      setRejecting(true);
      await rejectToken(selectedService._id);
      await fetchData();
      await fetchQueue();
    } catch {} finally { setRejecting(false); }
  };

  const handleToggleService = async (svc) => {
    try {
      setToggling(svc._id);
      await toggleService(svc._id);
      await fetchData();
    } catch {} finally { setToggling(null); }
  };

  const handleHoldService = async () => {
    if (!selectedService?._id) return;
    try {
      setHolding(selectedService._id);
      await holdService(selectedService._id);
      await fetchData();
      await fetchQueue();
    } catch {} finally { setHolding(null); }
  };

  if (loading) return <div className="sd-loader">Loading dashboard...</div>;

  const waitingList = queueData?.waiting || [];
  const currentServing = queueData?.serving;
  const svcColor = serviceColors[selectedService?.name] || serviceColors.Counter;

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
          <div className="sd-stat sd-stat-blue">
            <span className="sd-stat-icon">📊</span>
            <span className="sd-stat-val">{analytics.totalTokens ?? 0}</span>
            <span className="sd-stat-lbl">Total Today</span>
          </div>
          <div className="sd-stat sd-stat-amber">
            <span className="sd-stat-icon">⏳</span>
            <span className="sd-stat-val">{analytics.waitingTokens ?? 0}</span>
            <span className="sd-stat-lbl">Waiting</span>
          </div>
          <div className="sd-stat sd-stat-teal">
            <span className="sd-stat-icon">⏱️</span>
            <span className="sd-stat-val">{analytics.averageWaitTime ?? 0}m</span>
            <span className="sd-stat-lbl">Avg Wait</span>
          </div>
          <div className="sd-stat sd-stat-green">
            <span className="sd-stat-icon">✅</span>
            <span className="sd-stat-val">{analytics.completedTokens ?? 0}</span>
            <span className="sd-stat-lbl">Completed</span>
          </div>
        </div>
      )}

      {/* Service selector */}
      <div className="sd-svc-bar">
        {services.map((s) => {
          const sc = serviceColors[s.name] || serviceColors.Counter;
          return (
            <button key={s._id}
              className={`sd-svc-tab ${s._id === selectedService?._id ? 'active' : ''} ${s.onHold ? 'on-hold' : ''} ${!s.isOpen ? 'closed' : ''}`}
              style={s._id === selectedService?._id ? { borderColor: sc.accent, background: sc.bg, color: sc.accent } : {}}
              onClick={() => setSelectedService(s)}>
              <span className="sd-svc-tab-icon">{serviceIcons[s.name] || '🏢'}</span>
              {s.name}
              {s.onHold && <span className="sd-svc-hold-dot" title="On Hold" style={{ background: '#f59e0b', boxShadow: '0 0 8px #f59e0b' }}></span>}
              {s.onHold && <span className="sd-svc-hold-text" title="On Hold">⏸</span>}
              {!s.isOpen && <span className="sd-svc-closed-dot" title="Closed"></span>}
            </button>
          );
        })}
      </div>

      {selectedService && (
        <div className="sd-main">
          {/* Left: Current token + controls */}
          <div className="sd-current" style={{ borderColor: svcColor.border }}>
            <div className="sd-current-head">
              <span className="sd-current-svc" style={{ color: svcColor.accent }}>
                {serviceIcons[selectedService.name] || '🏢'} {selectedService.name}
              </span>
              <div className="sd-current-head-btns">
                <button
                  className={`sd-toggle-btn ${selectedService.isOpen ? 'on' : 'off'}`}
                  onClick={() => handleToggleService(selectedService)}
                  disabled={toggling === selectedService._id}>
                  {toggling === selectedService._id ? '...' : selectedService.isOpen ? '● Open' : '● Closed'}
                </button>
                <button
                  className={`sd-hold-btn ${selectedService.onHold ? 'active' : ''}`}
                  onClick={handleHoldService}
                  disabled={holding === selectedService._id}>
                  {holding === selectedService._id ? '...' : selectedService.onHold ? '▶ Resume' : '⏸ Hold'}
                </button>
              </div>
            </div>

            {/* On Hold Banner */}
            {selectedService.onHold && (
              <div className="sd-hold-banner">
                <span className="sd-hold-icon">⏸</span>
                <div>
                  <strong>Service On Hold</strong>
                  <span>Queue is paused. No new tokens will be served.</span>
                </div>
              </div>
            )}

{/* NOW SERVING */}
            <div className="sd-big-token" style={{ background: `linear-gradient(135deg, ${svcColor.accent}dd, ${svcColor.accent}99)` }}>
              <span className="sd-big-label">NOW SERVING</span>
              {currentServing ? (
                <>
                  <span className="sd-serving-tick" style={servingTickStyle}>✓</span>
                  <span className="sd-big-num">{currentServing.tokenNumber}</span>
                  <span className="sd-big-sub">Accepted & Serving Now</span>
                </>
              ) : (
                <span className="sd-big-num none">—</span>
              )}
            </div>

            {/* Accept / Reject Buttons */}
            {currentServing ? (
              <div className="sd-action-row">
                <button
                  className="sd-accept-btn"
                  onClick={handleAccept}
                  disabled={calling || selectedService.onHold}>
                  {calling ? 'Processing...' : '✅ Accept & Serve Next'}
                </button>
                <button
                  className="sd-reject-btn"
                  onClick={handleReject}
                  disabled={rejecting || selectedService.onHold}>
                  {rejecting ? 'Processing...' : '❌ Reject'}
                </button>
              </div>
            ) : (
              <div className="sd-action-row">
                <button
                  className="sd-accept-btn"
                  onClick={handleAccept}
                  disabled={calling || waitingList.length === 0 || selectedService.onHold}>
                  {calling ? 'Calling...' : '📞 Call Next'}
                </button>
              </div>
            )}

            <div className="sd-mini-stats">
              <div className="sd-mini-stat">
                <span className="sd-mini-stat-val" style={{ color: '#f59e0b' }}>{selectedService.waitingCount ?? 0}</span>
                <span className="sd-mini-stat-lbl">Waiting</span>
              </div>
              <div className="sd-mini-stat">
                <span className="sd-mini-stat-val" style={{ color: svcColor.accent }}>{selectedService.averageServiceTime || '—'}m</span>
                <span className="sd-mini-stat-lbl">Avg Time</span>
              </div>
              <div className="sd-mini-stat">
                <span className="sd-mini-stat-val" style={{ color: '#6366f1' }}>{selectedService.estimatedWait ?? 0}m</span>
                <span className="sd-mini-stat-lbl">Est. Wait</span>
              </div>
            </div>
          </div>

          {/* Right: Queue list */}
          <div className="sd-queue">
            <h3>Waiting Queue <span className="sd-queue-count">{waitingList.length}</span></h3>
            <div className="sd-queue-list">
              {waitingList.length === 0 ? (
                <div className="sd-queue-empty">
                  <span className="sd-queue-empty-icon">📭</span>
                  <p>No one in queue</p>
                </div>
              ) : (
                waitingList.map((token, i) => (
                  <div key={token._id || i} className={`sd-queue-item ${token.status === 'SERVING' ? 'serving' : 'waiting'}`}>
<div className="sd-queue-item-left">
                        <span className="sd-queue-pos" style={token.status === 'SERVING' ? { background: '#dcfce7', color: '#16a34a' } : {}}>
                          {token.status === 'SERVING' ? (
                            <span className="sd-serving-tick-small" style={servingTickStyle}>✓</span>
                          ) : `#${i + 1}`}
                        </span>
                      <div>
                        <strong>{token.tokenNumber}</strong>
                        <span className="sd-queue-time">
                          {token.status === 'SERVING' ? 'SERVING NOW' :
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
