import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './Login.css';

const LoginPage = ({ setUser }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await axios.post(`${process.env.REACT_APP_API_BASE_URL}/api/login`, { username, password });
      setLoading(false);

      if (response.data.success) {
        localStorage.setItem('user', JSON.stringify(response.data.user));
        setUser(response.data.user);
        navigate('/invoices');
      } else {
        alert(response.data.message || 'Login failed. Please check your credentials.');
      }
    } catch (error) {
      setLoading(false);
      alert('Login failed. Please check your credentials.');
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h2>Login</h2>
        <form onSubmit={handleLogin}>
          <input 
            type="text" 
            value={username} 
            onChange={(e) => setUsername(e.target.value)} 
            placeholder="Username" 
            required 
          />
          <input 
            type="password" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            placeholder="Password" 
            required 
          />
          <button type="submit" disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
