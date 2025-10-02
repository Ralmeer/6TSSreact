import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { Box, TextInput, Button, Title, Text, Paper } from '@mantine/core';

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
       body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send password reset email.');
      }

      setMessage('Password reset email sent. Check your inbox!');
    } catch (error) {
      console.error('Error sending password reset email:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: 'calc(100vh - 60px)', // Adjust for header height
        backgroundColor: '#f0f2f5',
      }}
    >
      <Paper withBorder shadow="md" p={30} mt={30} radius="md" sx={{ maxWidth: 400, width: '100%' }}>
        <Title order={2} align="center" mb="md">Forgot Password</Title>
        <form onSubmit={handleSubmit}>
          <TextInput
            label="Email"
            placeholder="Your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            mb="sm"
          />
          {error && <Text color="red" size="sm" mb="sm">{error}</Text>}
          {message && <Text color="green" size="sm" mb="sm">{message}</Text>}
          <Button type="submit" fullWidth color="blue" mt="md" loading={loading}>
            {loading ? 'Sending...' : 'Send Reset Email'}
          </Button>
        </form>
      </Paper>
    </Box>
  );
};

export default ForgotPasswordPage;