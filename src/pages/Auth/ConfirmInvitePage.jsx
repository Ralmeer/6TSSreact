import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../AuthContextV2';

const ConfirmInvitePage = () => {
  const [message, setMessage] = useState('Processing invitation...');
  const [error, setError] = useState(null);
  const { supabase } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const handleInvite = async () => {
      const params = new URLSearchParams(location.search); // Get params from query string
      const tokenHash = params.get('token_hash');
      const type = params.get('type');

          console.log('Processing invitation token...', { tokenHash, type });

          if (tokenHash && type === 'invite') {
            try {
              const { data, error } = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type: 'invite',
          });

          if (error) {
            throw error;
          }

          if (data.user) {
            setMessage('Invitation successfully confirmed! Redirecting to complete registration...');
            navigate('/complete-registration', { state: { user: data.user } });
          } else {
            setMessage('No user data returned after token verification. Please try again.');
          }
        } catch (err) {
          console.error('Error verifying invitation token:', err);
          setError(err.message || 'Failed to confirm invitation.');
          setMessage('Error confirming invitation. Please try again or request a new invite.');
        }
      } else {
        setMessage('Invalid invitation link or missing tokens.');
      }
    };

    handleInvite();
  }, [location.search, navigate, supabase]);

  return (
    <div>
      <h1>Confirm Invitation</h1>
      {error ? <p style={{ color: 'red' }}>Error: {error}</p> : <p>{message}</p>}
    </div>
  );
};

export default ConfirmInvitePage;