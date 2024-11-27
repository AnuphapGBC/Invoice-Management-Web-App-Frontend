import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
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

  return (
    <UserContext.Provider value={{ user, setUser }}>
      <Router>
        <Navbar />
        <Routes>
          {/* If user is logged in, navigate to invoices, otherwise to login */}
          <Route path="/" element={user ? <Navigate to="/invoices" /> : <LoginPage setUser={setUser} />} />
          <Route
            path="/invoices"
            element={
              user ? (
                <PrivateRoute allowedRoles={['admin', 'editor', 'viewer']}>
                  <InvoiceManagement />
                </PrivateRoute>
              ) : (
                <Navigate to="/" />
              )
            }
          />
          <Route
            path="/users"
            element={
              user ? (
                <PrivateRoute allowedRoles={['admin']}>
                  <UserManagement />
                </PrivateRoute>
              ) : (
                <Navigate to="/" />
              )
            }
          />
        </Routes>
      </Router>
    </UserContext.Provider>
  );
};

export default App;
