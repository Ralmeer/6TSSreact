import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { Box, Title, Text, Paper } from '@mantine/core';

const ScoutNoticesPage = () => {
  const [notices, setNotices] = useState([]);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchNotices();
  }, []);

  const fetchNotices = async () => {
    setMessage(null);
    setError(null);
    try {
      const { data, error } = await supabase.from('notices').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      setNotices(data);
      console.log('Fetched notices:', data); // Add this line
    } catch (err) {
      console.error('Error fetching notices:', err.message);
      setError('Error fetching notices: ' + err.message);
    }
  };

  return (
    <Box className="container mx-auto p-4">
      <Title order={2} className="text-3xl font-bold mb-6">Notices</Title>
      {message && <Text color="green">{message}</Text>}
      {error && <Text color="red">{error}</Text>}

      {notices.length === 0 ? (
        <Text>No notices available.</Text>
      ) : (
        <Box>
          {notices.map((notice) => (
            <Paper key={notice.id} shadow="xs" p="md" mb="md">
              <Title order={3} className="text-xl font-semibold mb-2">{notice.title}</Title>
              <Text style={{ whiteSpace: 'pre-wrap' }} mb="xs">{notice.description}</Text>
              <Text size="sm" color="dimmed">Posted on: {new Date(notice.created_at).toLocaleDateString()}</Text>
            </Paper>
          ))}
        </Box>
      )}
    </Box>
  );
};

export default ScoutNoticesPage;