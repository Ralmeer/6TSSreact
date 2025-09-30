import React from 'react';
import { useLocation, Navigate } from 'react-router-dom';
import { useAuth } from '../AuthContextV2';

const NotFoundRedirect = () => {
  const { user, userrole, loading } = useAuth();
  const location = useLocation();

  // List of public paths that don't require redirection
  const publicPaths = [
    '/complete-registration',
    '/register',  // Add this to handle old registration links
    '/forgot-password',
    '/update-password',
    '/login'
  ];

  if (loading) {
    return null; // Or a loading spinner
  }

  if (user) {
    return userrole === 'leader' ? (
      <Navigate to="/leader-dashboard" replace />
    ) : (
      <Navigate to="/scout-dashboard" replace />
    );
  }

  if (publicPaths.includes(location.pathname)) {
    return null;
  }

  return <Navigate to="/login" replace />;
};

export default NotFoundRedirect;