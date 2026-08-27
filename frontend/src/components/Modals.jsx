import React, { useState } from 'react';
import './Modals.css';

export const AboutModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="ql-modal-overlay" onClick={onClose}>
      <div className="ql-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="ql-modal-header">
          <div className="ql-modal-title-group">
            <span className="ql-modal-badge">💡 About Platform</span>
            <h2>QueueLess Campus</h2>
          </div>
          <button className="ql-modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="ql-modal-body">
          <p className="ql-modal-intro">
            <strong>QueueLess Campus</strong> is a smart virtual queuing platform designed to eliminate physical waiting lines across university & college campuses.
          </p>

          <div className="ql-features-grid">
            <div className="ql-feature-box">
              <span className="ql-feature-icon">🚀</span>
              <h4>Virtual Tokens</h4>
              <p>Get your queue token directly on your phone or browser without standing in physical lines.</p>
            </div>

            <div className="ql-feature-box">
              <span className="ql-feature-icon">⏱️</span>
              <h4>Live Wait Estimation</h4>
              <p>Real-time updates on currently serving token numbers & people ahead of you.</p>
            </div>

            <div className="ql-feature-box">
              <span className="ql-feature-icon">📱</span>
              <h4>Multi-Counter Support</h4>
              <p>Seamlessly access Canteen, Library, Fee Counters, & Admin Offices from one place.</p>
            </div>

            <div className="ql-feature-box">
              <span className="ql-feature-icon">⚡</span>
              <h4>Realtime Socket Sync</h4>
              <p>Instant status changes synced across student devices and staff operator screens.</p>
            </div>
          </div>

          <div className="ql-modal-steps">
            <h3>How It Works:</h3>
            <ol>
              <li>Select your campus destination (Canteen, Library, Counter, or Office).</li>
              <li>Click <strong>"Get Token"</strong> to generate your unique virtual queue spot.</li>
              <li>Relax anywhere on campus while tracking live position & estimated wait time.</li>
              <li>Head over to the counter when your token is <strong>"NOW SERVING"</strong>!</li>
            </ol>
          </div>
        </div>

        <div className="ql-modal-footer">
          <button className="ql-modal-btn-primary" onClick={onClose}>Got It!</button>
        </div>
      </div>
    </div>
  );
};

export const SupportModal = ({ isOpen, onClose }) => {
  const [activeFaq, setActiveFaq] = useState(null);
  const [ticketSent, setTicketSent] = useState(false);
  const [queryText, setQueryText] = useState('');

  if (!isOpen) return null;

  const faqs = [
    {
      q: "How do I check my position in line?",
      a: "Once you generate a token, your screen automatically updates in real-time showing 'Currently Serving', 'People Ahead', and your estimated wait time."
    },
    {
      q: "Can I leave the page and come back?",
      a: "Yes! Your active token is stored in your browser session, so you can track your status anytime while staying anywhere on campus."
    },
    {
      q: "What happens if I miss my turn?",
      a: "If your token is called and you're not present, staff will complete it and call the next student. Simply generate a new token if needed."
    },
    {
      q: "Which campus services are supported?",
      a: "We currently support the College Canteen, Library Counter, Fee & Certificate Counter, and Administrative Offices."
    }
  ];

  const handleSubmitSupport = (e) => {
    e.preventDefault();
    if (!queryText.trim()) return;
    setTicketSent(true);
    setTimeout(() => {
      setTicketSent(false);
      setQueryText('');
      onClose();
    }, 2000);
  };

  return (
    <div className="ql-modal-overlay" onClick={onClose}>
      <div className="ql-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="ql-modal-header">
          <div className="ql-modal-title-group">
            <span className="ql-modal-badge support">❓ Help & Support</span>
            <h2>How can we help you?</h2>
          </div>
          <button className="ql-modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="ql-modal-body">
          <div className="ql-faq-section">
            <h3>Frequently Asked Questions</h3>
            <div className="ql-faq-list">
              {faqs.map((faq, idx) => (
                <div 
                  key={idx} 
                  className={`ql-faq-item ${activeFaq === idx ? 'open' : ''}`}
                  onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
                >
                  <div className="ql-faq-question">
                    <span>{faq.q}</span>
                    <span className="ql-faq-toggle">{activeFaq === idx ? '−' : '+'}</span>
                  </div>
                  {activeFaq === idx && (
                    <div className="ql-faq-answer">{faq.a}</div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="ql-contact-box">
            <h3>Need Quick Assistance?</h3>
            {ticketSent ? (
              <div className="ql-success-msg">
                ✅ Thank you! Your inquiry has been submitted. Campus support will assist you shortly.
              </div>
            ) : (
              <form onSubmit={handleSubmitSupport} className="ql-support-form">
                <textarea 
                  rows="3" 
                  placeholder="Describe your issue or query here..." 
                  value={queryText}
                  onChange={(e) => setQueryText(e.target.value)}
                  required
                ></textarea>
                <div className="ql-form-row">
                  <div className="ql-helpdesk-info">
                    📞 Campus Helpdesk: <strong>ext. 4040</strong> | ✉️ <strong>support@queueless.edu</strong>
                  </div>
                  <button type="submit" className="ql-submit-btn">Send Query</button>
                </div>
              </form>
            )}
          </div>
        </div>

        <div className="ql-modal-footer">
          <button className="ql-modal-btn-secondary" onClick={onClose}>Close Help</button>
        </div>
      </div>
    </div>
  );
};
