import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { useAuth } from '../../AuthContextV2';
import { Box, Title, Text, Paper, TextInput, Table, Group } from '@mantine/core';
import { IconSearch } from '@tabler/icons-react';

const ScoutAttendancePage = () => {
  const { user } = useAuth();
  const [attendanceHistory, setAttendanceHistory] = useState([]);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchAttendanceHistory = async (userId) => {
    setMessage(null);
    setError(null);
    console.log('Fetching attendance for userId:', userId);
    try {
      // First, get the scout_id (integer) from the 'scouts' table using the user's UUID
      const { data: scoutData, error: scoutError } = await supabase
        .from('scouts')
        .select('id')
        .eq('user_id', userId) // Use user.id (UUID) to query scouts.user_id (UUID)
        .single();

      if (scoutError) throw scoutError;
      if (!scoutData) {
        setError('Scout profile not found.');
        return;
      }

      const scoutId = scoutData.id;

      const { data, error } = await supabase
        .from('attendance_scouts')
        .select('*, attendance(date, activity_type, custom_activity_name)')
        .eq('scout_id', scoutId);

      if (error) throw error;
      setAttendanceHistory(data);
    } catch (err) {
      console.error('Error fetching attendance history:', err.message);
      setError('Error fetching attendance history: ' + err.message);
    }
  };

  useEffect(() => {
    if (user) {
      console.log('User object in useEffect:', user);
      fetchAttendanceHistory(user.id);
    }
  }, [user]);

  const filteredAttendance = attendanceHistory.filter(record => {
    const activityType = record.attendance?.activity_type?.toLowerCase() || '';
    const customActivityName = record.attendance?.custom_activity_name?.toLowerCase() || '';
    const lowerCaseSearchTerm = searchTerm.toLowerCase();
    return activityType.includes(lowerCaseSearchTerm) || customActivityName.includes(lowerCaseSearchTerm);
  });

  if (!user) {
    return <Text>Please log in to view your attendance.</Text>;
  }

  return (
    <Box p="md">
      <Title order={2} mb="md">My Attendance History</Title>
      {message && <Text color="green" mb="sm">{message}</Text>}
      {error && <Text color="red" mb="sm">{error}</Text>}

      <Paper withBorder shadow="md" p="md">
        <TextInput
          placeholder="Search activities..."
          mb="md"
          icon={<IconSearch size={14} />}
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.currentTarget.value)}
        />

        {filteredAttendance.length === 0 ? (
          <Text>No attendance records found matching your search.</Text>
        ) : (
          <Table striped highlightOnHover withTableBorder withColumnBorders>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Date</Table.Th>
                <Table.Th>Activity Type</Table.Th>
                <Table.Th>Custom Activity Name</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {filteredAttendance.map((record) => (
                <Table.Tr key={record.id}>
                  <Table.Td>{record.attendance?.date}</Table.Td>
                  <Table.Td>{record.attendance?.activity_type}</Table.Td>
                  <Table.Td>{record.attendance?.custom_activity_name || 'N/A'}</Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        )}
      </Paper>
    </Box>
  );
};

export default ScoutAttendancePage;