import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { Box, Stack, Title, Text, TextInput, Textarea, Button, Paper, Table, Group } from '@mantine/core';

const NoticesPage = () => {
  const [notices, setNotices] = useState([]);
  const [editingNotice, setEditingNotice] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [newNoticeTitle, setNewNoticeTitle] = useState('');
  const [newNoticeDescription, setNewNoticeDescription] = useState('');
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchNotices();
  }, []);

  const fetchNotices = async () => {
    const { data, error } = await supabase.from('notices').select('*');
    if (error) {
      console.error('Error fetching notices:', error.message);
      setError('Error fetching notices.');
    } else {
      setNotices(data);
    }
  };

  const handleAddNotice = async (e) => {
    e.preventDefault();
    setMessage(null);
    setError(null);

    try {
      const { error } = await supabase
        .from('notices')
        .insert([{ title: newNoticeTitle, description: newNoticeDescription }]);

      if (error) {
        throw error;
      }

      setMessage('Notice added successfully!');
      setNewNoticeTitle('');
      setNewNoticeDescription('');
      fetchNotices();
    } catch (err) {
      console.error('Error adding notice:', err.message);
      setError(err.message);
    }
  };

  const handleEditNotice = (notice) => {
    setEditingNotice(notice);
    setEditTitle(notice.title);
    setEditDescription(notice.description);
  };

  const handleUpdateNotice = async (e) => {
    e.preventDefault();
    setMessage(null);
    setError(null);

    if (!editingNotice) return;

    try {
      const { error } = await supabase
        .from('notices')
        .update({ title: editTitle, description: editDescription })
        .eq('id', editingNotice.id);

      if (error) {
        throw error;
      }

      setMessage('Notice updated successfully!');
      setEditingNotice(null);
      fetchNotices();
    } catch (err) {
      console.error('Error updating notice:', err.message);
      setError(err.message);
    }
  };

  const handleDeleteNotice = async (noticeId) => {
    if (!window.confirm('Are you sure you want to delete this notice?')) return;
    setMessage(null);
    setError(null);

    try {
      const { error } = await supabase.from('notices').delete().eq('id', noticeId);

      if (error) {
        throw error;
      }

      setMessage('Notice deleted successfully!');
      fetchNotices();
    } catch (err) {
      console.error('Error deleting notice:', err.message);
      setError(err.message);
    }
  };

  return (
    <Stack p="md">
      <Title order={2} mb="md">Notices Management</Title>
      {message && <Text color="green" mb="sm">{message}</Text>}
      {error && <Text color="red" mb="sm">{error}</Text>}

      <Paper withBorder shadow="md" p="md" mb="xl">
        <Title order={3} mb="md">Add New Notice</Title>
        <form onSubmit={handleAddNotice}>
          <Stack>
            <TextInput
              label="Title"
              placeholder="Enter notice title"
              value={newNoticeTitle}
              onChange={(event) => setNewNoticeTitle(event.currentTarget.value)}
              required
            />
            <Textarea
              label="Description"
              placeholder="Enter notice description"
              value={newNoticeDescription}
              onChange={(event) => setNewNoticeDescription(event.currentTarget.value)}
              required
            />
            <Button type="submit">Add Notice</Button>
          </Stack>
        </form>
      </Paper>

      <Title order={3} mb="md">Existing Notices</Title>
      <Paper withBorder shadow="md" p="md">
        <Table striped highlightOnHover withTableBorder withColumnBorders>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Title</Table.Th>
              <Table.Th>Description</Table.Th>
              <Table.Th>Actions</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {notices.map((notice) => (
              <Table.Tr key={notice.id}>
                <Table.Td>
                  {editingNotice && editingNotice.id === notice.id ? (
                    <TextInput
                      value={editTitle}
                      onChange={(event) => setEditTitle(event.currentTarget.value)}
                    />
                  ) : (
                    notice.title
                  )}
                </Table.Td>
                <Table.Td>
                  {editingNotice && editingNotice.id === notice.id ? (
                    <Textarea
                      value={editDescription}
                      onChange={(event) => setEditDescription(event.currentTarget.value)}
                    />
                  ) : (
                    <Text style={{ whiteSpace: 'pre-wrap' }}>{notice.description}</Text>
                  )}
                </Table.Td>
                <Table.Td>
                  {editingNotice && editingNotice.id === notice.id ? (
                    <Group>
                      <Button onClick={handleUpdateNotice}>Save</Button>
                      <Button onClick={() => setEditingNotice(null)}>Cancel</Button>
                    </Group>
                  ) : (
                    <Group>
                      <Button onClick={() => handleEditNotice(notice)}>Edit</Button>
                      <Button color="red" onClick={() => handleDeleteNotice(notice.id)}>Delete</Button>
                    </Group>
                  )}
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </Paper>
    </Stack>
  );
};

export default NoticesPage;