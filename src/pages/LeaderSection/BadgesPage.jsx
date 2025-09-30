import { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { Box, Title, Text, TextInput, Paper, Table, Group, Select, Textarea, Alert, Modal, Button, Stack, Collapse, Badge, Checkbox } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { DatePickerInput } from '@mantine/dates';

const BadgesPage = () => {
  const [badges, setBadges] = useState([]);
  const [scouts, setScouts] = useState([]);
  const [assignedBadges, setAssignedBadges] = useState([]);
  const [newBadgeName, setNewBadgeName] = useState('');
  const [newBadgeDescription, setNewBadgeDescription] = useState('');
  const [newBadgeType, setNewBadgeType] = useState(''); // New state for badge type
  const [newBadgeRequirements, setNewBadgeRequirements] = useState(''); // New state for badge requirements
  const [selectedScout, setSelectedScout] = useState('');
  const [selectedBadge, setSelectedBadge] = useState('');
  const [dateEarned, setDateEarned] = useState(null); // New state for date earned
  const [physicallyObtained, setPhysicallyObtained] = useState(false); // New state for physically obtained
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [opened, { open, close }] = useDisclosure(false);
  const [showRequirements, setShowRequirements] = useState({}); // New state for showing/hiding requirements

  const handleAddBadge = async (e) => {
    e.preventDefault();
    setMessage(null);
    setError(null);
    setLoading(true);

    try {
      const { error } = await supabase
        .from('badges')
        .insert([{ name: newBadgeName, description: newBadgeDescription, badge_type: newBadgeType, requirements: newBadgeRequirements }]);

      if (error) {
        throw error;
      }

      setMessage('Badge added successfully!');
      setNewBadgeName('');
      setNewBadgeDescription('');
      setNewBadgeType('');
      setNewBadgeRequirements(''); // Clear requirements after submission
      fetchBadges();
    } catch (err) {
      console.error('Error adding badge:', err.message);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAssignBadge = async (e) => {
    e.preventDefault();
    setMessage(null);
    setError(null);
    setLoading(true);

    try {
      const { error } = await supabase
        .from('scout_badges')
        .insert([{ scout_id: selectedScout, badge_id: selectedBadge, date_earned: dateEarned, physically_obtained: physicallyObtained }]); // Include date_earned and physically_obtained

      if (error) {
        throw error;
      }

      setMessage('Badge assigned successfully!');
      setSelectedScout('');
      setSelectedBadge('');
      setDateEarned(null); // Clear date earned after submission
      setPhysicallyObtained(false); // Clear physically obtained after submission
      fetchAssignedBadges();
    } catch (err) {
      console.error('Error assigning badge:', err.message);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBadge = async (badgeId) => {
    console.log('Attempting to delete badge with ID:', badgeId);
    setMessage(null);
    setError(null);
    setLoading(true);

    try {
      const { error } = await supabase.from('badges').delete().eq('id', badgeId);

      if (error) {
        throw error;
      }

      setMessage('Badge deleted successfully!');
      fetchBadges();
      fetchAssignedBadges(); // Refresh assigned badges as well
    } catch (err) {
      console.error('Error deleting badge:', err.message);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAssignedBadge = async (assignedBadgeId) => {
    setMessage(null);
    setError(null);
    setLoading(true);

    try {
      const { error } = await supabase.from('scout_badges').delete().eq('id', assignedBadgeId);

      if (error) {
        throw error;
      }

      setMessage('Assigned badge deleted successfully!');
      fetchAssignedBadges();
    } catch (err) {
      console.error('Error deleting assigned badge:', err.message);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchBadges = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('badges').select('*');
      if (error) throw error;
      setBadges(data);
    } catch (error) {
      console.error('Error fetching badges:', error.message);
      setError('Failed to fetch badges.');
    } finally {
      setLoading(false);
    }
  };

  const fetchScouts = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('scouts').select('id, full_name, email');
      if (error) throw error;
      setScouts(data);
    } catch (error) {
      console.error('Error fetching scouts:', error.message);
      setError('Failed to fetch scouts.');
    } finally {
      setLoading(false);
    }
  };

  const fetchAssignedBadges = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('scout_badges')
        .select(`
          id,
          date_earned,
          physically_obtained,
          scouts ( id, full_name, email ),
          badges ( id, name, description, badge_type )
        `);
      if (error) throw error;
      setAssignedBadges(data);
    } catch (error) {
      console.error('Error fetching assigned badges:', error.message);
      setError('Failed to fetch assigned badges.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBadges();
    fetchScouts();
    fetchAssignedBadges();
  }, []);

  return (
    <Box className="container mx-auto p-4">
      <Modal opened={opened} onClose={() => setOpened(false)} title="Confirm Delete">
        <Text size="sm">{modalMessage}</Text>
        <Group position="right" mt="md">
          <Button variant="outline" onClick={() => setOpened(false)}>Cancel</Button>
        </Group>
      </Modal>
      <Title order={2} className="text-3xl font-bold mb-6 text-center">Badges Management</Title>
      {message && <Alert title="Success" color="green" withCloseButton onClose={() => setMessage(null)}>{message}</Alert>}
      {error && <Alert title="Error" color="red" withCloseButton onClose={() => setError(null)}>{error}</Alert>}

      <Stack spacing="lg">
        <Paper shadow="xs" p="md">
          <Title order={3} className="text-2xl font-semibold mb-4">Add New Badge</Title>
          <form onSubmit={handleAddBadge} className="space-y-4">
            <div>
              <label htmlFor="newBadgeName" className="block text-gray-700 text-sm font-bold mb-2">Badge Name:</label>
              <TextInput
                id="newBadgeName"
                value={newBadgeName}
                onChange={(event) => setNewBadgeName(event.currentTarget.value)}
                required
              />
            </div>
            <div>
              <label htmlFor="newBadgeDescription" className="block text-gray-700 text-sm font-bold mb-2">Description:</label>
              <Textarea
                id="newBadgeDescription"
                value={newBadgeDescription}
                onChange={(event) => setNewBadgeDescription(event.currentTarget.value)}
                required
              />
            </div>
            <div>
              <label htmlFor="newBadgeType" className="block text-gray-700 text-sm font-bold mb-2">Badge Type:</label>
              <Select
                id="newBadgeType"
                placeholder="Select badge type"
                value={newBadgeType}
                onChange={setNewBadgeType}
                data={[
                  { value: 'Proficiency Badge', label: 'Proficiency Badge' },
                  { value: 'Stage Badge', label: 'Stage Badge' },
                  { value: 'Event Badge', label: 'Event Badge' },
                  { value: 'Advancement Badge', label: 'Advancement Badge' },
                  { value: 'Challenge Badge', label: 'Challenge Badge' },
                ]}
                required
              />
            </div>
            <div>
              <label htmlFor="newBadgeRequirements" className="block text-gray-700 text-sm font-bold mb-2">Requirements:</label>
              <Textarea
                id="newBadgeRequirements"
                value={newBadgeRequirements}
                onChange={(event) => setNewBadgeRequirements(event.currentTarget.value)}
                placeholder="Enter badge requirements (e.g., complete 5 tasks, attend 3 workshops)"
                minRows={4}
                required
              />
            </div>
            <Button type="submit" disabled={loading}>
              Add Badge
            </Button>
          </form>
        </Paper>

        <Paper shadow="xs" p="md">
          <Title order={3} className="text-2xl font-semibold mb-4">Assign Badge to Scout</Title>
          <form onSubmit={handleAssignBadge} className="space-y-4">
            <div>
              <label htmlFor="selectedScout" className="block text-gray-700 text-sm font-bold mb-2">Scout:</label>
              <Select
                id="selectedScout"
                placeholder="Select a scout"
                value={selectedScout}
                onChange={setSelectedScout}
                data={scouts.map(scout => ({ value: String(scout.id), label: scout.full_name }))}
                required
              />
            </div>
            <div>
              <label htmlFor="selectedBadge" className="block text-gray-700 text-sm font-bold mb-2">Badge:</label>
              <Select
                id="selectedBadge"
                placeholder="Select a Badge"
                value={selectedBadge}
                onChange={setSelectedBadge}
                data={badges.map((badge) => ({ value: String(badge.id), label: badge.name }))}
                required
                disabled={loading}
              />
            </div>
            <div>
              <label htmlFor="dateEarned" className="block text-gray-700 text-sm font-bold mb-2">Date Earned:</label>
              <DatePickerInput
                id="dateEarned"
                placeholder="Pick date"
                value={dateEarned}
                onChange={setDateEarned}
                styles={{
                  calendarHeaderControl: { fontSize: '1rem', width: '2rem', height: '2rem' },
                }}
              />
            </div>
            <div>
              <Checkbox
                label="Physically Obtained"
                checked={physicallyObtained}
                onChange={(event) => setPhysicallyObtained(event.currentTarget.checked)}
              />
            </div>
            <Button type="submit" disabled={loading}>
              Assign Badge
            </Button>
          </form>
        </Paper>

        <Paper shadow="xs" p="md">
          <Title order={3} className="text-2xl font-semibold mb-4">Existing Badges</Title>
          <div className="overflow-x-auto">
            <Table striped highlightOnHover withTableBorder withColumnBorders>
              <thead>
                <tr>
                  <th style={{ width: '35%' }}>Name</th>
                  <th style={{ width: '45%' }}>Description</th>
                  <th style={{ width: '20%' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {badges.map((badge) => (
                  <tr key={badge.id}>
                    <td>
                      <Stack spacing="xs">
                        <Text weight={500}>{badge.name}</Text>
                        <Badge color="blue" variant="filled">
                          {badge.badge_type}
                        </Badge>
                      </Stack>
                    </td>
                    <td>{badge.description}</td>
                    <td>
                      <Stack>
                        <Group>
                          <Button color="red" onClick={() => handleDeleteBadge(badge.id)} disabled={loading}>Delete</Button>
                          <Button color="blue" onClick={() => setShowRequirements(prev => ({ ...prev, [badge.id]: !prev[badge.id] }))}>
                            {showRequirements[badge.id] ? 'Hide Requirements' : 'See Requirements'}
                          </Button>
                        </Group>
                        <Collapse in={showRequirements[badge.id]}>
                          <Paper withBorder p="xs" mt="xs">
                            <Text size="sm">{badge.requirements || 'No requirements specified.'}</Text>
                          </Paper>
                        </Collapse>
                      </Stack>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        </Paper>

        <Paper shadow="xs" p="md">
          <Title order={3} className="text-2xl font-semibold mb-4">Assigned Badges</Title>
          <div className="overflow-x-auto">
            <Table striped highlightOnHover withTableBorder withColumnBorders>
              <thead>
                <tr>
                  <th>Scout</th>
                  <th>Badge</th>
                  <th>Date Earned</th>
                  <th>Physically Obtained</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {assignedBadges.map((assigned) => (
                  <tr key={assigned.id}>
                    <td>
                      {assigned.scouts?.full_name
                        ? `${assigned.scouts.full_name} (${assigned.scouts.email})`
                        : assigned.scouts?.email || 'N/A'}
                    </td>
                    <td>{assigned.badges?.name || 'N/A'}</td>
                    <td>{new Date(assigned.date_earned).toLocaleDateString()}</td>
                    <td>{assigned.physically_obtained ? 'Yes' : 'No'}</td>
                    <td>
                      <Button color="red" onClick={() => handleDeleteAssignedBadge(assigned.id)} disabled={loading}>Delete</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        </Paper>
      </Stack>
    </Box>
  );
};

const EditBadgeModal = ({ opened, onClose, badge, onUpdate }) => {
  const [editedDateEarned, setEditedDateEarned] = useState(badge ? new Date(badge.date_earned) : null);
  const [editedPhysicallyObtained, setEditedPhysicallyObtained] = useState(badge ? badge.physically_obtained : false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (badge) {
      setEditedDateEarned(badge.date_earned ? new Date(badge.date_earned) : null);
      setEditedPhysicallyObtained(badge.physically_obtained);
    }
  }, [badge]);

  const handleUpdateBadge = async () => {
    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase
        .from('scout_badges')
        .update({
          date_earned: editedDateEarned ? editedDateEarned.toISOString().split('T')[0] : null,
          physically_obtained: editedPhysicallyObtained,
        })
        .eq('id', badge.id);

      if (error) {
        setError(error.message);
      } else {
        onUpdate();
        onClose();
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal opened={opened} onClose={onClose} title="Edit Assigned Badge">
      <Box>
        <Group direction="column" grow>
          <div>
            <label htmlFor="editDateEarned" className="block text-gray-700 text-sm font-bold mb-2">Date Earned:</label>
            <DatePickerInput
              id="editDateEarned"
              placeholder="Pick date"
              value={editedDateEarned}
              onChange={setEditedDateEarned}
              styles={{
                calendarHeaderControl: { fontSize: '1rem', width: '2rem', height: '2rem' },
              }}
            />
          </div>
          <div>
            <Checkbox
              label="Physically Obtained"
              checked={editedPhysicallyObtained}
              onChange={(event) => setEditedPhysicallyObtained(event.currentTarget.checked)}
            />
          </div>
          {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
          <Button onClick={handleUpdateBadge} disabled={loading}>
            {loading ? 'Updating...' : 'Update Badge'}
          </Button>
        </Group>
      </Box>
    </Modal>
  );
};

export default BadgesPage;