import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { UserContext } from '../context/UserContext';

const PrivateRoute = ({ allowedRoles, children }) => {
  const { user } = useContext(UserContext);

  if (!user) return <Navigate to="/" />;
  if (allowedRoles && !allowedRoles.includes(user.role)) return <Navigate to="/" />;
  
  return children;
};

export default PrivateRoute;
