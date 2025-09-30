import { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { registerUserAndSendInvite } from '../../utils/auth';
import { Box, Paper, Title, Text, TextInput, Button, Table, Stack } from '@mantine/core';

const AddLeadersPage = () => {
  const [leaders, setLeaders] = useState([]);
  const [newLeaderEmail, setNewLeaderEmail] = useState('');
  const [newLeaderName, setNewLeaderName] = useState('');
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchLeaders();
  }, []);

  const fetchLeaders = async () => {
    try {
      const { data: userRolesData, error: userRolesError } = await supabase
        .from('userroles')
        .select('user_id')
        .eq('userrole', 'leader');

      if (userRolesError) {
        throw userRolesError;
      }

      const leaderUserIds = userRolesData.map((role) => role.user_id);

      const { data: scoutsData, error: scoutsError } = await supabase
        .from('scouts')
        .select('user_id, full_name, email')
        .in('user_id', leaderUserIds);

      if (scoutsError) {
        throw scoutsError;
      }

      const leadersWithDetails = scoutsData.map((scout) => ({
        user_id: scout.user_id,
        full_name: scout.full_name,
        email: scout.email,
      }));

      setLeaders(leadersWithDetails);
    } catch (error) {
      console.error('Error fetching leaders:', error.message);
      setError('Error fetching leaders: ' + error.message);
    }
  };

  const handleAddLeader = async (e) => {
    e.preventDefault();
    setMessage(null);
    setError(null);

    try {
      const { success, message: authMessage } = await registerUserAndSendInvite(newLeaderEmail, 'leader', newLeaderName, null, null);

      if (!success) {
        throw new Error(authMessage);
      }

      setMessage('Leader added and invitation sent successfully!');
      setNewLeaderEmail('');
      setNewLeaderName('');
      fetchLeaders();
    } catch (err) {
      console.error('Error adding leader:', err.message);
      setError(err.message);
    }
  };

  const handleDeleteLeader = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this leader?')) return;
    setMessage(null);
    setError(null);

    try {
      // Delete from UserRoles table
      const { error: roleError } = await supabase.from('userroles').delete().eq('user_id', userId).eq('userrole', 'leader');
      if (roleError) throw roleError;

      // Optionally, you might want to disable or delete the user from Supabase Auth as well.
      // For now, we are only removing their userrole.

      setMessage('Leader deleted successfully!');
      fetchLeaders();
    } catch (err) {
      console.error('Error deleting leader:', err.message);
      setError(err.message);
    }
  };

  return (
    <Stack p="md">
      <Paper withBorder shadow="md" p={30} mt={30} radius="md">
        <Title order={2} align="center" mb="lg">Add Leaders</Title>
        {message && <Text color="green" align="center" mt="md">{message}</Text>}
        {error && <Text color="red" align="center" mt="md">{error}</Text>}

        <Stack>
          <Title order={3} mt="xl" mb="md">Add New Leader</Title>
          <form onSubmit={handleAddLeader}>
            <TextInput
              label="Email"
              placeholder="Enter leader's email"
              value={newLeaderEmail}
              onChange={(e) => setNewLeaderEmail(e.target.value)}
              required
              mb="md"
            />
            <TextInput
              label="Full Name"
              placeholder="Enter leader's full name"
              value={newLeaderName}
              onChange={(e) => setNewLeaderName(e.target.value)}
              required
              mb="md"
            />
            <Button type="submit">Add Leader</Button>
          </form>
        </Stack>

        <Stack>
          <Title order={3} mt="xl" mb="md">Existing Leaders</Title>
          <Table striped highlightOnHover>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {leaders.map((leader) => (
                <Table.Tr key={leader.user_id}>
                  <Table.Td>{leader.full_name}</Table.Td>
                  <Table.Td>{leader.email}</Table.Td>
                  <Table.Td>
                    <Button
                      color="red"
                      onClick={() => handleDeleteLeader(leader.user_id)}
                    >
                      Delete
                    </Button>
                  </Table.Td>
                </Table.Tr>
              ))}
            </tbody>
          </Table>
        </Stack>
      </Paper>
    </Stack>
  );
};

export default AddLeadersPage;