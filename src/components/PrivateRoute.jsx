import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { UserContext } from '../context/UserContext';

const PrivateRoute = ({ allowedRoles, children }) => {
  const { user } = useContext(UserContext);

  if (!user) {
    // User not logged in, redirect to login page
    return <Navigate to="/" />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // User does not have permission, redirect to login page
    return <Navigate to="/" />;
  }

  // User is authenticated and has the correct role, render the children
  return children;
};

export default PrivateRoute;
