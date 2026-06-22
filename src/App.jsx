import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { 
  SquaresFour, 
  Users, 
  Wallet, 
  CalendarCheck, 
  ChartLineUp, 
  Gear,
  GraduationCap,
  Bell,
  Moon,
  Sun
} from '@phosphor-icons/react';
import './App.css';

// Pages
import Dashboard from './pages/Dashboard';
import Students from './pages/Students';
import Login from './pages/Login';
import Payments from './pages/Payments';
import Attendance from './pages/Attendance';
import Reports from './pages/Reports';

// Placeholder Components
const NotFound = () => <div className="glass-card" style={{margin: '2rem'}}><h2>404</h2><p>Page not found</p></div>;

const Sidebar = () => {
  const location = useLocation();
  const path = location.pathname;

  return (
    <div className="sidebar">
      <div className="sidebar-brand">
        <GraduationCap size={32} weight="fill" />
        TuitionMaster
      </div>
      <nav className="sidebar-nav">
        <Link to="/" className={`nav-item ${path === '/' ? 'active' : ''}`}>
          <SquaresFour size={24} /> Dashboard
        </Link>
        <Link to="/students" className={`nav-item ${path === '/students' ? 'active' : ''}`}>
          <Users size={24} /> Students
        </Link>
        <Link to="/payments" className={`nav-item ${path === '/payments' ? 'active' : ''}`}>
          <Wallet size={24} /> Payments
        </Link>
        <Link to="/attendance" className={`nav-item ${path === '/attendance' ? 'active' : ''}`}>
          <CalendarCheck size={24} /> Attendance
        </Link>
        <Link to="/reports" className={`nav-item ${path === '/reports' ? 'active' : ''}`}>
          <ChartLineUp size={24} /> Reports
        </Link>
      </nav>
      <div className="sidebar-footer">
        <Link to="/settings" className={`nav-item ${path === '/settings' ? 'active' : ''}`}>
          <Gear size={24} /> Settings
        </Link>
      </div>
    </div>
  );
};

const Header = ({ theme, toggleTheme, user, logout }) => {
  return (
    <header className="top-header">
      <div>
        <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', margin: 0 }}>
          {user ? `Welcome, ${user.displayName || user.email}` : 'Welcome'}
        </h2>
      </div>
      <div className="header-actions">
        <button className="icon-btn">
          <Bell size={20} />
        </button>
        <button className="icon-btn" onClick={toggleTheme}>
          {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
        </button>
        {user && (
          <button className="icon-btn" onClick={logout} style={{ background: 'var(--color-primary)', color: 'white' }}>
            Logout
          </button>
        )}
      </div>
    </header>
  );
};

// Layout wrapper for authenticated pages
const AppLayout = ({ theme, toggleTheme, children, user, logout }) => {
  return (
    <div className="app-container">
      <Sidebar />
      <main className="main-content">
        <Header theme={theme} toggleTheme={toggleTheme} user={user} logout={logout} />
        <div className="page-content">
          {children}
        </div>
      </main>
    </div>
  );
};

import { auth } from './firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  const [theme, setTheme] = useState('light');
  const [user, setUser] = useState(null);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const handleLogout = async () => {
    await signOut(auth);
  };

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        {/* Protected Routes */}
        <Route path="/" element={<ProtectedRoute user={user}><AppLayout theme={theme} toggleTheme={toggleTheme} logout={handleLogout} user={user}><Dashboard /></AppLayout></ProtectedRoute>} />
        <Route path="/students" element={<ProtectedRoute user={user}><AppLayout theme={theme} toggleTheme={toggleTheme} logout={handleLogout} user={user}><Students /></AppLayout></ProtectedRoute>} />
        <Route path="/payments" element={<ProtectedRoute user={user}><AppLayout theme={theme} toggleTheme={toggleTheme} logout={handleLogout} user={user}><Payments /></AppLayout></ProtectedRoute>} />
        <Route path="/attendance" element={<ProtectedRoute user={user}><AppLayout theme={theme} toggleTheme={toggleTheme} logout={handleLogout} user={user}><Attendance /></AppLayout></ProtectedRoute>} />
        <Route path="/reports" element={<ProtectedRoute user={user}><AppLayout theme={theme} toggleTheme={toggleTheme} logout={handleLogout} user={user}><Reports /></AppLayout></ProtectedRoute>} />
        <Route path="*" element={<ProtectedRoute user={user}><AppLayout theme={theme} toggleTheme={toggleTheme} logout={handleLogout} user={user}><NotFound /></AppLayout></ProtectedRoute>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
