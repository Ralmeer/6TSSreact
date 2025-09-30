import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { Box, PasswordInput, Button, Title, Text, Paper, TextInput } from '@mantine/core';

const UpdatePasswordPage = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) throw error;

      setMessage('Password updated successfully!');
      console.log('Password updated:', data);
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err) {
      setError(err.message);
      console.error('Error updating password:', err.message);
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
        <Title order={2} align="center" mb="md">Update Password</Title>
        <form onSubmit={handleSubmit}>
          <PasswordInput
            label="New Password"
            placeholder="Your new password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            mb="sm"
          />
          <PasswordInput
            label="Confirm New Password"
            placeholder="Confirm new password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            mb="md"
          />
          {error && <Text color="red" size="sm" mb="sm">{error}</Text>}
          {message && <Text color="green" size="sm" mb="sm">{message}</Text>}
          <Button type="submit" fullWidth color="blue" mt="md" loading={loading}>
            {loading ? 'Updating...' : 'Update Password'}
          </Button>
        </form>
      </Paper>
    </Box>
  );
};

export default UpdatePasswordPage;