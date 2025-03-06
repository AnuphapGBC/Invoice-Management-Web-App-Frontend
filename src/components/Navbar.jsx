import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserContext } from '../context/UserContext';
import { redirectToLogin } from '../utils/navigation';
import './Navbar.css';

const Navbar = () => {
  const { user, setUser } = useContext(UserContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    redirectToLogin(navigate, setUser);
  };

  return (
    <nav className="navbar">
      <div className="navbar-links">
        {user ? (
          <>
            <Link to="/invoices" className="navbar-link">Invoices</Link>
            {user.role === 'admin' && <Link to="/users" className="navbar-link">User Management</Link>}
            <button onClick={handleLogout} className="navbar-button">Logout</button>
          </>
        ) : (
          <Link to="/" className="navbar-link">Login</Link>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
