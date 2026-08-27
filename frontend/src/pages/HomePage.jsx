import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getServices } from '../services/api';
import './HomePage.css';

const serviceIcons = { Canteen: '🍽', Library: '📚', Office: '🏛' };

const HomePage = () => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    getServices()
      .then(setServices)
      .catch(() => setError('Failed to load services.'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="home-page">
      <div className="home-header">
        <h1 className="home-title">QueueLess Campus</h1>
        <p className="home-subtitle">Skip the physical queue.</p>
      </div>
      <h2 className="section-title">Select a Service</h2>
      {loading && <div className="loading-msg">Loading services...</div>}
      {error && <div className="error-msg">{error}</div>}
      <div className="service-grid">
        {services.map((s) => (
          <button key={s._id} className="service-card" onClick={() => navigate(`/student/${s._id}`)}>
            <span className="service-icon">{serviceIcons[s.name] || '🏢'}</span>
            <span className="service-name">{s.name}</span>
            <span className="service-desc">{s.description}</span>
          </button>
        ))}
      </div>
      <button className="staff-btn" onClick={() => navigate('/staff')}>Staff Dashboard</button>
    </div>
  );
};

export default HomePage;
