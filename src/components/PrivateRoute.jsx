import React from 'react';
import { useAuth } from '../AuthContextV2';
import { Navigate } from 'react-router-dom';

const PrivateRoute = ({ children, allowedRoles }) => {
  const { user, userrole, loading } = useAuth();

  if (loading) {
    return <div>Loading authentication...</div>;
  }

  if (!user) {
    // Not logged in, redirect to login page
    return <Navigate to="/login" />;
  }

  if (allowedRoles && !allowedRoles.includes(userrole)) {
    // Logged in but unauthorized userrole, redirect to a suitable page (e.g., home or unauthorized page)
    return <Navigate to="/" />;
  }

  return children;
};

export default PrivateRoute;