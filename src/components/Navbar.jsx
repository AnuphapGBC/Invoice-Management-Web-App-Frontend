import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { UserContext } from '../context/UserContext';
import './Navbar.css';

const Navbar = () => {
  const { user, setUser } = useContext(UserContext);

  const handleLogout = () => {
    // Clear user data from local storage
    localStorage.removeItem('user');
    
    // Set user state to null to clear user session
    setUser(null);

    // Redirect to login page after logging out
    window.location.href = '/login';
  };

  // console.log("Navbar User Context Value:", user); // Debug log to verify the user

  return (
    <nav className="navbar">
      <div className="navbar-links">
        {user && (
          <>
            <Link to="/invoices" className="navbar-link">Invoices</Link>
            {user?.role === 'admin' && <Link to="/users" className="navbar-link">User Management</Link>}
            <button onClick={handleLogout} className="navbar-button">Logout</button>
          </>
        )}
        {!user && (
          <Link to="/login" className="navbar-link">Login</Link>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
