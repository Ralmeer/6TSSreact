import { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { registerUserAndSendInvite } from '../../utils/auth';
import { Box, Title, Text, TextInput, Button, Paper, Table, Group, Select, Stack } from '@mantine/core';

const rankOptions = ['Waster', 'Recruit', 'Scout', 'Venture Scout', 'Assistant Crew Leader', 'Crew Leader', 'Executive'];
const crewOptions = ['Kingfishers', 'Dolphins', 'Barracudas', 'Orcas', 'Falcons', 'Swifts', 'Marlins', 'Terns', 'Seals', 'Junior Executive', 'Senior Executive', 'Crewless', 'Alpha', 'Bravo', 'Charlie', 'Delta'];

const ScoutManagementPage = () => {
  const [scouts, setScouts] = useState([]);
  const [newScoutEmail, setNewScoutEmail] = useState('');
  const [newScoutRank, setNewScoutRank] = useState('');
  const [newScoutCrew, setNewScoutCrew] = useState('');
  const [newScoutName, setNewScoutName] = useState(''); // New state for scout name
  const [editingScout, setEditingScout] = useState(null);
  const [editRank, setEditRank] = useState('');
  const [editCrew, setEditCrew] = useState('');
  const [editName, setEditName] = useState(''); // New state for editing scout name
  const [editEmail, setEditEmail] = useState(''); // New state for editing scout email
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    console.log('VITE_API_URL:', import.meta.env.VITE_API_URL);
    fetchScouts();
  }, []);

  const fetchScouts = async () => {
    const { data, error } = await supabase.from('scouts').select('*, full_name');
    if (error) {
      console.error('Error fetching scouts:', error.message);
      setError('Error fetching scouts.');
    } else {
      setScouts(data);
    }
  };

  const handleAddScout = async (e) => {
    e.preventDefault();
    setMessage(null);
    setError(null);

    try {
      const { success, message: authMessage, status } = await registerUserAndSendInvite(newScoutEmail, 'scout', newScoutName, newScoutRank, newScoutCrew);

      if (!success) {
        if (status === 409) {
          setError('A scout with this email already exists.');
        } else {
          setError(authMessage);
        }
        return;
      }

      setMessage('Scout added and invitation sent successfully!');
      setNewScoutEmail('');
      setNewScoutRank('');
      setNewScoutCrew('');
      setNewScoutName(''); // Clear newScoutName
      fetchScouts();
    } catch (err) {
      console.error('Error adding scout:', err.message);
      setError(err.message);
    }
  };

  const handleEditScout = (scout) => {
    setEditingScout(scout);
    setEditRank(scout.rank);
    setEditCrew(scout.crew);
    setEditName(scout.full_name); // Set editName from full_name
    setEditEmail(scout.email); // Set editEmail
  };

  const handleUpdateScout = async (e) => {
    e.preventDefault();
    setMessage(null);
    setError(null);

    if (!editingScout) return;

    try {
      const historyEntries = [];

      if (editingScout.rank !== editRank) {
        historyEntries.push({
          scout_id: editingScout.id,
          change_type: 'rank_change',
          old_value: editingScout.rank,
          new_value: editRank,
          changed_at: new Date().toISOString(),
        });
      }

      if (editingScout.crew !== editCrew) {
        historyEntries.push({
          scout_id: editingScout.id,
          change_type: 'crew_change',
          old_value: editingScout.crew,
          new_value: editCrew,
          changed_at: new Date().toISOString(),
        });
      }

      if (historyEntries.length > 0) {
        // Verify scout_id exists in the scouts table before inserting into scout_history
        const { data: scoutData, error: scoutError } = await supabase
          .from('scouts')
          .select('id')
          .eq('id', editingScout.id)
          .single();

        if (scoutError || !scoutData) {
          console.error('Error verifying scout_id or scout_id does not exist:', scoutError?.message || 'Scout ID not found');
          setError('Failed to update scout history: Scout not found.');
          return;
        }

        const { error: historyError } = await supabase.from('scout_history').insert(historyEntries);
        if (historyError) throw historyError;
      }

      if (editingScout.email !== editEmail) {
        // Update email in Supabase Auth
        const { data: { user }, error: updateAuthError } = await supabase.auth.updateUser({
          email: editEmail,
        });

        if (updateAuthError) {
          throw updateAuthError;
        }

        // If email is updated in auth, also update in the scouts table
        const { error: updateScoutError } = await supabase
          .from('scouts')
          .update({ email: editEmail })
          .eq('id', editingScout.id);

        if (updateScoutError) {
          throw updateScoutError;
        }
      }

      const { error } = await supabase
        .from('scouts')
        .update({ rank: editRank, crew: editCrew, full_name: editName }) // Added full_name
        .eq('id', editingScout.id);

      if (error) {
        throw error;
      }

      setMessage('Scout updated successfully!');
      setEditingScout(null);
      fetchScouts();
    } catch (err) {
      console.error('Error updating scout:', err.message);
      setError(err.message);
    }
  };

  const handleDeleteScout = async (scoutId) => {
    // console.log('VITE_API_URL:', import.meta.env.VITE_API_URL);
    if (!window.confirm('Are you sure you want to delete this scout?')) return;
    setMessage(null);
    setError(null);

    try {
      console.log('Attempting to delete scout with ID:', scoutId);

      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/scout-management/delete-scout/${scoutId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete scout.');
      }

      setMessage('Scout deleted successfully!');
      console.log('Scout deleted successfully, fetching updated list.');
      fetchScouts();
    } catch (err) {
      console.error('Final error during scout deletion process:', err.message);
      setError(err.message);
    }
  };

  return (
    <Stack p="md">
      <Title order={2} mb="md">Scout Management</Title>
      {message && <Text color="green" mb="sm">{message}</Text>}
      {error && <Text color="red" mb="sm">{error}</Text>}

      <Paper withBorder shadow="md" p="md" mb="xl">
        <Title order={3} mb="md">Add New Scout</Title>
        <form onSubmit={handleAddScout}>
          <Stack>
            <TextInput
              label="Email"
              type="email"
              value={newScoutEmail}
              onChange={(event) => setNewScoutEmail(event.currentTarget.value)}
              required
            />
            <TextInput
              label="Name"
              type="text"
              value={newScoutName}
              onChange={(event) => setNewScoutName(event.currentTarget.value)}
              required
            />
            <Select
              label="Rank"
              placeholder="Select Rank"
              data={rankOptions}
              value={newScoutRank}
              onChange={(value) => setNewScoutRank(value)}
              required
            />
            <Select
              label="Crew"
              placeholder="Select Crew"
              data={crewOptions}
              value={newScoutCrew}
              onChange={(value) => setNewScoutCrew(value)}
              required
            />
            <Button type="submit">Add Scout</Button>
          </Stack>
        </form>
      </Paper>

      <Stack>
        <Title order={3} mb="md">Existing Scouts</Title>
        <Table striped highlightOnHover withTableBorder withColumnBorders>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Email</Table.Th>
              <Table.Th>Name</Table.Th> {/* Added Name column */}
              <Table.Th>Rank</Table.Th>
              <Table.Th>Crew</Table.Th>
              <Table.Th>Actions</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {scouts.map((scout) => (
              <Table.Tr key={scout.id}>
                <Table.Td>
                  {editingScout && editingScout.id === scout.id ? (
                    <TextInput
                      type="email"
                      value={editEmail}
                      onChange={(event) => setEditEmail(event.currentTarget.value)}
                    />
                  ) : (
                    scout.email
                  )}
                </Table.Td><Table.Td>
                  {editingScout && editingScout.id === scout.id ? (
                    <TextInput
                      type="text"
                      value={editName}
                      onChange={(event) => setEditName(event.currentTarget.value)}
                    />
                  ) : (
                    scout.full_name
                  )}
                </Table.Td><Table.Td>
                  {editingScout && editingScout.id === scout.id ? (
                    <Select
                      placeholder="Select Rank"
                      data={rankOptions}
                      value={editRank}
                      onChange={(value) => setEditRank(value)}
                    />
                  ) : (
                    scout.rank
                  )}
                </Table.Td><Table.Td>
                  {editingScout && editingScout.id === scout.id ? (
                    <Select
                      placeholder="Select Crew"
                      data={crewOptions}
                      value={editCrew}
                      onChange={(value) => setEditCrew(value)}
                    />
                  ) : (
                    scout.crew
                  )}
                </Table.Td><Table.Td>
                  {editingScout && editingScout.id === scout.id ? (
                    <Group>
                      <Button onClick={handleUpdateScout} size="xs">Save</Button>
                      <Button onClick={() => setEditingScout(null)} size="xs" variant="outline">Cancel</Button>
                    </Group>
                  ) : (
                    <Group>
                      <Button onClick={() => handleEditScout(scout)} size="xs">Edit</Button>
                      <Button onClick={() => handleDeleteScout(scout.id)} size="xs" color="red">Delete</Button>
                    </Group>
                  )}
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </Stack>
    </Stack>
  );
};

export default ScoutManagementPage;