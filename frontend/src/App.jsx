import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import HomePage from './pages/HomePage';
import StudentPage from './pages/StudentPage';
import StaffDashboard from './pages/StaffDashboard';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import { AboutModal, SupportModal } from './components/Modals';
import { connectSocket, disconnectSocket } from './services/socket';
import './App.css';

function AppContent() {
  const [aboutOpen, setAboutOpen] = useState(false);
  const [supportOpen, setSupportOpen] = useState(false);
  const { user, loading } = useAuth();

  useEffect(() => {
    connectSocket();
    return () => disconnectSocket();
  }, []);

  if (loading) {
    return (
      <div className="app">
        <div style={{ textAlign: 'center', padding: '5rem 2rem', color: '#94a3b8' }}>Loading...</div>
      </div>
    );
  }

  return (
    <>
      <Navbar
        onOpenAbout={() => setAboutOpen(true)}
        onOpenSupport={() => setSupportOpen(true)}
      />

      <Routes>
        <Route path="/" element={<HomePage onOpenAbout={() => setAboutOpen(true)} onOpenSupport={() => setSupportOpen(true)} />} />
        <Route path="/student/:serviceId" element={<StudentPage />} />
        <Route
          path="/staff"
          element={
            <ProtectedRoute requireRole={['staff', 'admin']} message="Please log in with a staff account to access the dashboard. Staff credentials: staff@queueless.com / staff123">
              <StaffDashboard />
            </ProtectedRoute>
          }
        />
      </Routes>

      <AboutModal
        isOpen={aboutOpen}
        onClose={() => setAboutOpen(false)}
      />

      <SupportModal
        isOpen={supportOpen}
        onClose={() => setSupportOpen(false)}
      />
    </>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="app">
          <AppContent />
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;
