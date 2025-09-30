import React, { useState, useEffect } from 'react';
import { useAuth } from '../AuthContextV2';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { Box, TextInput, Button, Title, Text, Paper, Anchor, Group, PasswordInput } from '@mantine/core';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const { signIn, user, userrole } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    console.log('LoginPage.jsx: useEffect - user:', user, 'userrole:', userrole);
    if (user && userrole) {
      if (userrole === 'leader') {
        navigate('/leader-dashboard');
      } else if (userrole === 'Scout') {
        navigate('/scout-dashboard');
      } else {
        navigate('/'); // Fallback for other userroles or if userrole is not yet determined
      }
    }
  }, [user, userrole, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      const { user, session, error: signInError } = await signIn(email, password);
      console.log('Sign-in attempt result:', { user, session, signInError });
      if (signInError) {
        throw signInError;
      }
      // Redirection logic moved to useEffect
    } catch (err) {
      console.error('Login error:', err.message);
      setError(err.message);
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
        <Title order={2} align="center" mb="md">Login</Title>
        <form onSubmit={handleSubmit}>
          <TextInput
            label="Email"
            placeholder="Your email"
            value={email}
            onChange={(event) => setEmail(event.currentTarget.value)}
            required
            mb="sm"
          />
          <PasswordInput
            label="Password"
            placeholder="Your password"
            value={password}
            onChange={(event) => setPassword(event.currentTarget.value)}
            required
            mb="md"
          />
          {error && (
            <Text color="red" size="sm" mb="sm">{error}</Text>
          )}
          <Group position="center" mt="md">
            <Button type="submit" fullWidth color="blue">Login</Button>
          </Group>
          <Text align="center" mt="xs">
            <Anchor component={RouterLink} to="/forgot-password" size="sm">
              Forgot password?
            </Anchor>
          </Text>
        </form>
      </Paper>
    </Box>
  );
};

export default LoginPage;