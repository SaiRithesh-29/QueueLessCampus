import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useEffect } from 'react';
import HomePage from './pages/HomePage';
import StudentPage from './pages/StudentPage';
import StaffDashboard from './pages/StaffDashboard';
import { connectSocket, disconnectSocket } from './services/socket';
import './App.css';

function App() {
  useEffect(() => {
    connectSocket();
    return () => disconnectSocket();
  }, []);

  return (
    <Router>
      <div className="app">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/student/:serviceId" element={<StudentPage />} />
          <Route path="/staff" element={<StaffDashboard />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
