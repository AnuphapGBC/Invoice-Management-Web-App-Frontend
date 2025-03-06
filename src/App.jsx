import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import InvoiceManagement from './pages/InvoiceManagement';
import UserManagement from './pages/UserManagement';
import PrivateRoute from './components/PrivateRoute';
import Navbar from './components/Navbar';
import { UserContext } from './context/UserContext';

const App = () => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('user');
    setUser(null);
  };

  // Dynamically get home page for different roles (optional)
  const getHomePage = (role) => {
    switch (role) {
      case 'admin':
        return '/users';
      case 'editor':
      case 'viewer':
        return '/invoices';
      default:
        return '/';
    }
  };

  return (
    <UserContext.Provider value={{ user, setUser }}>
      <Router>
        <Navbar onLogout={handleLogout} />
        <Routes>
          <Route path="/" element={user ? <Navigate to={getHomePage(user.role)} /> : <LoginPage setUser={setUser} />} />

          <Route
            path="/invoices"
            element={
              <PrivateRoute allowedRoles={['admin', 'editor', 'viewer']}>
                <InvoiceManagement />
              </PrivateRoute>
            }
          />

          <Route
            path="/users"
            element={
              <PrivateRoute allowedRoles={['admin']}>
                <UserManagement />
              </PrivateRoute>
            }
          />
        </Routes>
      </Router>
    </UserContext.Provider>
  );
};

export default App;
