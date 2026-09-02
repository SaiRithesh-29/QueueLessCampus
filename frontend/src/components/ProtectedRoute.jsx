import { useAuth } from '../context/AuthContext';
import AuthModal from './AuthModal';
import { useState, useEffect } from 'react';

const ProtectedRoute = ({ children, requireRole, message, onAuthAction }) => {
  const { user, loading } = useAuth();
  const [authOpen, setAuthOpen] = useState(false);
  const [authMessage, setAuthMessage] = useState(message || '');

  useEffect(() => {
    if (!loading && !user) {
      setAuthOpen(true);
      setAuthMessage(message || 'Please log in to continue.');
    }
    if (!loading && user && requireRole) {
      const roles = Array.isArray(requireRole) ? requireRole : [requireRole];
      if (!roles.includes(user.role)) {
        setAuthMessage('You do not have permission to access this page.');
      }
    }
  }, [user, loading, requireRole, message]);

  const handleAuthSuccess = async (type, credentials) => {
    if (onAuthAction) {
      await onAuthAction(type, credentials);
      return;
    }

    if (type === 'login') {
      const userData = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: credentials.email, password: credentials.password, role: credentials.role || 'student' })
      }).then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Login failed');
        return data.user;
      });
      return userData;
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '5rem 2rem', color: '#94a3b8' }}>
        Loading...
      </div>
    );
  }

  if (!user) {
    return (
      <AuthModal
        isOpen={authOpen}
        onClose={() => setAuthOpen(false)}
        onAuthSuccess={handleAuthSuccess}
        message={authMessage}
      />
    );
  }

  if (requireRole) {
    const roles = Array.isArray(requireRole) ? requireRole : [requireRole];
    if (!roles.includes(user.role)) {
      return (
        <div style={{ textAlign: 'center', padding: '5rem 2rem' }}>
          <h2 style={{ color: '#b91c1c', marginBottom: '1rem' }}>Access Denied</h2>
          <p style={{ color: '#64748b', marginBottom: '1.5rem' }}>You do not have permission to access this page.</p>
          <div style={{ background: '#f1f5f9', borderRadius: '12px', padding: '1.5rem', maxWidth: '400px', margin: '0 auto', textAlign: 'left' }}>
            <p style={{ fontWeight: 700, color: '#334155', marginBottom: '0.5rem' }}>Staff Login Credentials:</p>
            <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '0.25rem 0' }}>Email: <strong>staff@queueless.com</strong></p>
            <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '0.25rem 0' }}>Password: <strong>staff123</strong></p>
            <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.75rem' }}>Logout and login with these credentials to access the dashboard.</p>
          </div>
        </div>
      );
    }
  }

  return children;
};

export default ProtectedRoute;
