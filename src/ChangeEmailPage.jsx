import { useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { TextInput, Button, Paper, Title, Text, Container } from '@mantine/core';
import { useForm } from '@mantine/form';
import { supabase } from './supabaseClient';

function ChangeEmailPage() {
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const form = useForm({
    initialValues: {
      newEmail: '',
    },
    validate: {
      newEmail: (value) => (/^\S+@\S+$/.test(value) ? null : 'Invalid email'),
    },
  });

  const handleChangeEmail = async (values) => {
    setMessage('');
    setError('');
    try {
      const { error } = await supabase.auth.updateUser({
        email: values.newEmail,
      });

      if (error) {
        throw error;
      }

      setMessage('A confirmation email has been sent to your new email address. Please verify to complete the change.');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <Container size={420} my={40}>
      <Title align="center">Change Your Email Address</Title>
      <Text color="dimmed" size="sm" align="center" mt={5}>
        Enter your new email address below.
      </Text>

      <Paper withBorder shadow="md" p={30} mt={30} radius="md">
        <form onSubmit={form.onSubmit(handleChangeEmail)}>
          <TextInput
            label="New Email"
            placeholder="you@example.com"
            required
            {...form.getInputProps('newEmail')}
          />
          <Button type="submit" fullWidth mt="xl">
            Change Email
          </Button>
        </form>

        {message && <Text color="green" align="center" mt="md">{message}</Text>}
        {error && <Text color="red" align="center" mt="md">{error}</Text>}
      </Paper>
    </Container>
  );
}

export default ChangeEmailPage;