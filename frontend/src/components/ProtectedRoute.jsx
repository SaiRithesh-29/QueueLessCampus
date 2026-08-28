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
        onAuthSuccess={onAuthAction}
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
          <p style={{ color: '#64748b' }}>You do not have permission to access this page.</p>
        </div>
      );
    }
  }

  return children;
};

export default ProtectedRoute;
