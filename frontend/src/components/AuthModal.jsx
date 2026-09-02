import { useState, useEffect } from 'react';
import './AuthModal.css';

const AuthModal = ({ isOpen, onClose, onAuthSuccess, initialMode = 'login', message }) => {
  const [mode, setMode] = useState(initialMode);
  const [role, setRole] = useState('student');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setRole('student');
      setName('');
      setEmail('');
      setPassword('');
      setError('');
    }
  }, [isOpen, initialMode]);

  useEffect(() => {
    if (!isOpen) return;
    const nextRole = mode === 'login' ? 'student' : 'student';
    setRole(nextRole);
  }, [isOpen, mode]);

  if (!isOpen) return null;

  const resetForm = () => {
    setName('');
    setEmail('');
    setPassword('');
    setError('');
  };

  const handleModeSwitch = (newMode) => {
    resetForm();
    setMode(newMode);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const selectedRole = role || 'student';
      if (mode === 'login') {
        await onAuthSuccess('login', { email, password, role: selectedRole });
      } else {
        await onAuthSuccess('register', { name, email, password, role: selectedRole });
      }
      resetForm();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="ql-auth-overlay" onClick={onClose}>
      <div className="ql-auth-card" onClick={(e) => e.stopPropagation()}>
        <div className="ql-auth-header">
          <div className="ql-auth-title-group">
            <span className="ql-auth-badge">{mode === 'login' ? '🔑 Welcome Back' : '✨ Create Account'}</span>
            <h2>{mode === 'login' ? 'Login to QueueLess' : 'Join QueueLess Campus'}</h2>
          </div>
          <button className="ql-auth-close" onClick={onClose}>✕</button>
        </div>

        <div className="ql-auth-body">
          {message && (
            <div className="ql-auth-message">
              <span className="ql-auth-message-icon">ℹ️</span>
              <span>{message}</span>
            </div>
          )}

          {error && (
            <div className="ql-auth-error">
              <span className="ql-auth-error-icon">⚠️</span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="ql-auth-form">
            {/* Role Toggle */}
            <div className="ql-auth-role-toggle">
              <button type="button"
                className={`ql-auth-role-btn ${role === 'student' ? 'active' : ''}`}
                onClick={() => setRole('student')}>
                <span>🎓</span> Student
              </button>
              <button type="button"
                className={`ql-auth-role-btn ${role === 'staff' ? 'active' : ''}`}
                onClick={() => setRole('staff')}>
                <span>👨‍💼</span> Staff
              </button>
            </div>

            {mode === 'register' && (
              <div className="ql-auth-field">
                <label htmlFor="auth-name">Full Name</label>
                <input
                  id="auth-name"
                  type="text"
                  placeholder="Your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
            )}

            <div className="ql-auth-field">
              <label htmlFor="auth-email">Email Address</label>
              <input
                id="auth-email"
                type="email"
                placeholder="you@campus.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="ql-auth-field">
              <label htmlFor="auth-password">Password</label>
              <input
                id="auth-password"
                type="password"
                placeholder="At least 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>

            <button type="submit" className="ql-auth-submit" disabled={submitting}>
              {submitting ? 'Please wait...' : mode === 'login' ? 'Login' : 'Create Account'}
            </button>
          </form>
        </div>

        <div className="ql-auth-footer">
          {mode === 'login' ? (
            <span>
              Don't have an account?{' '}
              <button onClick={() => handleModeSwitch('register')}>Create Account</button>
            </span>
          ) : (
            <span>
              Already have an account?{' '}
              <button onClick={() => handleModeSwitch('login')}>Login</button>
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthModal;
