import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContextV2';

const AuthCallbackPage = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading) {
      // Extract redirect_to from URL if available, otherwise default
      const params = new URLSearchParams(window.location.search);
      const redirectTo = params.get('redirect_to') || '/';

      if (user) {
        console.log('User session found, redirecting to:', redirectTo);
        navigate(redirectTo, { replace: true });
      } else {
        console.log('No user session, redirecting to login');
        navigate('/login', { replace: true });
      }
    }
  }, [loading, user, navigate]);

  return (
    <div className="auth-callback-container">
      <p>Processing authentication...</p>
    </div>
  );
};

export default AuthCallbackPage;