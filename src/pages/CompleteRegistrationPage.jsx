import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import config from '../config';
import { Box, TextInput, Button, Title, Text, Paper, PasswordInput } from '@mantine/core';

const CompleteRegistrationPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const emailFromUrl = params.get('email');

    if (emailFromUrl) {
      setEmail(emailFromUrl);
    }
  }, [location]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) {
        throw new Error(error.message);
      }

      console.log('User password set successfully.');
      navigate('/login');
    } catch (err) {
      setError(err.message);
      console.error('Error completing registration:', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={(theme) => ({
        backgroundColor: theme.colorScheme === 'dark' ? theme.colors.dark[7] : theme.colors.gray[0],
        minHeight: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
      })}
    >
      <Paper withBorder shadow="md" p={30} mt={30} radius="md" style={{ width: '100%', maxWidth: 400 }}>
        <Title order={2} align="center" mb="md">
          Complete Registration
        </Title>
        <form onSubmit={handleSubmit}>
          <TextInput
            label="Email"
            placeholder="Your email"
            value={email}
            onChange={(event) => setEmail(event.currentTarget.value)}
            required
            disabled
            mb="sm"
          />
          <PasswordInput
            label="Password"
            placeholder="Your password"
            value={password}
            onChange={(event) => setPassword(event.currentTarget.value)}
            required
            mb="sm"
          />
          <PasswordInput
            label="Confirm Password"
            placeholder="Confirm password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.currentTarget.value)}
            required
            mb="md"
          />
          {error && (
            <Text color="red" size="sm" align="center" mb="sm">
              {error}
            </Text>
          )}
          <Button type="submit" fullWidth mt="xl" loading={loading}>
            Complete Registration
          </Button>
        </form>
      </Paper>
    </Box>
  );
};

export default CompleteRegistrationPage;