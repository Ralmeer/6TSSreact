import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
// import { Container, Title, Text, Alert, Button, Center, Loader } from '@mantine/core';

const ResetPasswordHandler = () => {
  const navigate = useNavigate();
  const [message, setMessage] = useState('Processing password reset...');
  const [error, setError] = useState(null);

  useEffect(() => {
    const handlePasswordReset = async () => {
      try {
        // This page is typically reached after a user clicks a password reset link.
        // Supabase automatically handles the session update if the URL contains the access_token.
        // We just need to check if a session is now active.
        const { data: { session }, error: getSessionError } = await supabase.auth.getSession();

        if (getSessionError) throw getSessionError;

        if (session) {
          setMessage('Password reset successful! Redirecting to update password page...');
          // Redirect to a page where the user can set their new password
          navigate('/update-password');
        } else {
          setError('No active session found after reset. The link might be invalid or expired.');
        }
      } catch (err) {
        setError(err.message);
        console.error('Error during password reset handling:', err.message);
      }
    };

    handlePasswordReset();
  }, [navigate]);

  return (
    <div>
      <h2>Password Reset</h2>
      {error ? (
        <div style={{ color: 'red' }}>
          <p>Error: {error}</p>
          <button onClick={() => navigate('/forgot-password')}>Try again</button>
        </div>
      ) : (
        <div style={{ color: 'green' }}>
          <p>{message}</p>
        </div>
      )}
    </div>
  );
};

export default ResetPasswordHandler;