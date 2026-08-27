import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useState, useEffect } from 'react';
import HomePage from './pages/HomePage';
import StudentPage from './pages/StudentPage';
import StaffDashboard from './pages/StaffDashboard';
import Navbar from './components/Navbar';
import { AboutModal, SupportModal } from './components/Modals';
import { connectSocket, disconnectSocket } from './services/socket';
import './App.css';

function App() {
  const [aboutOpen, setAboutOpen] = useState(false);
  const [supportOpen, setSupportOpen] = useState(false);

  useEffect(() => {
    connectSocket();
    return () => disconnectSocket();
  }, []);

  return (
    <Router>
      <div className="app">
        <Navbar 
          onOpenAbout={() => setAboutOpen(true)} 
          onOpenSupport={() => setSupportOpen(true)} 
        />

        <Routes>
          <Route path="/" element={<HomePage onOpenAbout={() => setAboutOpen(true)} onOpenSupport={() => setSupportOpen(true)} />} />
          <Route path="/student/:serviceId" element={<StudentPage />} />
          <Route path="/staff" element={<StaffDashboard />} />
        </Routes>

        <AboutModal 
          isOpen={aboutOpen} 
          onClose={() => setAboutOpen(false)} 
        />

        <SupportModal 
          isOpen={supportOpen} 
          onClose={() => setSupportOpen(false)} 
        />
      </div>
    </Router>
  );
}

export default App;
