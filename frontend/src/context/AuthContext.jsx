import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadUser = useCallback(async () => {
    const token = localStorage.getItem('ql_token');
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const response = await api.get('/auth/me');
      setUser(response.data);
    } catch {
      localStorage.removeItem('ql_token');
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  const login = async (email, password, role = 'student') => {
    const response = await api.post('/auth/login', { email, password, role });
    const { token, user: userData } = response.data;
    localStorage.setItem('ql_token', token);
    setUser(userData);
    return userData;
  };

  const register = async (name, email, password, role = 'student') => {
    const response = await api.post('/auth/register', { name, email, password, role });
    const { token, user: userData } = response.data;
    localStorage.setItem('ql_token', token);
    setUser(userData);
    return userData;
  };

  const logout = () => {
    localStorage.removeItem('ql_token');
    setUser(null);
  };

  const isStudent = user?.role === 'student';
  const isStaff = user?.role === 'staff' || user?.role === 'admin';
  const isAdmin = user?.role === 'admin';

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, isStudent, isStaff, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
