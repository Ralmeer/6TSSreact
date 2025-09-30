import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import {
  Container,
  Title,
  Text,
  Paper,
  TextInput,
  Button,
  Table,
  Group,
  Loader,
  Center,
  Select,
} from '@mantine/core';
import { useDebouncedValue } from '@mantine/hooks';

const LowAttendancePage = () => {
  const [threshold, setThreshold] = useState(70);
  const [lowAttendanceScouts, setLowAttendanceScouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedActivityType, setSelectedActivityType] = useState('All');
  const [activityTypes, setActivityTypes] = useState([{ value: 'All', label: 'All' }]);

  const debouncedThreshold = useDebouncedValue(threshold, 300);

  const fetchActivityTypes = async () => {
    try {
      console.log('Fetching all activity types.');
      const session = await supabase.auth.getSession();
      const accessToken = session?.data?.session?.access_token;
      console.log('Access Token for fetchActivityTypes:', accessToken);

      if (!accessToken) {
        console.error('No access token available for fetching activity types.');
        setActivityTypes([{ value: 'All', label: 'All' }]);
        return;
      }

      const { data, error } = await supabase.functions.invoke(
        "get-all-activity-types",
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );

      if (error) {
        console.error("Error fetching activity types:", error);
        setActivityTypes([{ value: 'All', label: 'All' }]);
        return;
      }

      if (data) {
        // Check if data exists and is an array
        if (Array.isArray(data)) {
          const formattedData = data.map((item) => ({
            value: item.activity_type,
            label: item.activity_type,
          }));
          console.log("Formatted data for dropdown:", formattedData);
          setActivityTypes([{ value: 'All', label: 'All' }, ...formattedData]);
        } else {
          console.error("Edge Function did not return an array:", data);
          setActivityTypes([{ value: 'All', label: 'All' }]);
        }
      }
    } catch (error) {
      console.error('Error fetching activity types:', error.message);
      setActivityTypes([{ value: 'All', label: 'All' }]);
    }
  };

  useEffect(() => {
    fetchActivityTypes();
  }, []);

  useEffect(() => {
    fetchLowAttendanceScouts();
  }, [debouncedThreshold[0], selectedActivityType]); // Re-fetch when threshold or activity type changes

  const fetchLowAttendanceScouts = async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch all scouts
      const { data: scouts, error: scoutsError } = await supabase
        .from('scouts')
        .select('id, full_name, email');

      if (scoutsError) throw scoutsError;

      if (!Array.isArray(scouts)) {
        console.error("Scouts data is not an array:", scouts);
        setLowAttendanceScouts([]);
        setLoading(false);
        return;
      }

      const attendanceData = await Promise.all(
        scouts.map(async (scout) => {
          // Query for total activities
          let totalActivitiesQuery = supabase
            .from('attendance')
            .select('id', { count: 'exact' });

          if (selectedActivityType !== 'All') {
            totalActivitiesQuery = totalActivitiesQuery.eq('activity_type', selectedActivityType);
          }

          const { count: totalRecords, error: totalRecordsError } = await totalActivitiesQuery;

          if (totalRecordsError) throw totalRecordsError;

          // First, get the relevant attendance IDs based on activity type filter
          let relevantAttendanceIdsQuery = supabase
            .from('attendance')
            .select('id');

          if (selectedActivityType !== 'All') {
            relevantAttendanceIdsQuery = relevantAttendanceIdsQuery.eq('activity_type', selectedActivityType);
          }

          const { data: relevantAttendanceIdsData, error: relevantAttendanceIdsError } = await relevantAttendanceIdsQuery;
          if (relevantAttendanceIdsError) throw relevantAttendanceIdsError;

          const relevantAttendanceIds = relevantAttendanceIdsData.map(item => item.id);

          let presentRecords = 0;
          if (relevantAttendanceIds.length > 0) {
            // Now, query attendance_scouts using these IDs, scout_id, and status
            const { count, error: presentRecordsError } = await supabase
              .from('attendance_scouts')
              .select('id', { count: 'exact' })
              .eq('scout_id', scout.id)
              .in('attendance_id', relevantAttendanceIds);

            if (presentRecordsError) throw presentRecordsError;
            presentRecords = count;
          }

          const attendancePercentage =
            totalRecords === 0 ? 0 : (presentRecords / totalRecords) * 100;

          return {
            ...scout,
            totalRecords,
            presentRecords,
            attendancePercentage: attendancePercentage.toFixed(2),
          };
        })
      );

      const filteredScouts = attendanceData.filter(
        (scout) => parseFloat(scout.attendancePercentage) < debouncedThreshold[0]
      );

      setLowAttendanceScouts(filteredScouts);
    } catch (err) {
      console.error('Error fetching low attendance scouts:', err.message);
      setError('Failed to fetch low attendance scouts.');
    } finally {
      setLoading(false);
    }
  };

  const handleThresholdChange = (event) => {
    setThreshold(event.currentTarget.value);
  };

  return (
    <Container size="xl" my="md">
      <Title order={2} mb="lg">
        Low Attendance Scouts
      </Title>

      <Paper shadow="xs" p="md" mb="lg">
        <Group align="flex-end">
          <TextInput
            label="Low Attendance Threshold (%):"
            placeholder="e.g., 70"
            type="number"
            min={0}
            max={100}
            value={threshold}
            onChange={handleThresholdChange}
            style={{ flex: 1 }}
          />
          <Select
            label="Filter by Activity Type"
            placeholder="Select activity type"
            data={activityTypes}
            value={selectedActivityType}
            onChange={setSelectedActivityType}
            clearable
            style={{ flex: 1 }}
          />
          <Button onClick={fetchLowAttendanceScouts}>Apply Filters</Button>
        </Group>
      </Paper>

      {loading && (
        <Center>
          <Loader />
        </Center>
      )}
      {error && (
        <Text color="red" align="center">
          {error}
        </Text>
      )}

      {!loading && !error && lowAttendanceScouts.length === 0 && (
        <Text align="center">No scouts found below the attendance threshold.</Text>
      )}

      {!loading && !error && lowAttendanceScouts.length > 0 && (
        <Paper shadow="xs" p="md">
          <Table striped highlightOnHover withTableBorder withColumnBorders>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Name</Table.Th>
                <Table.Th>Email</Table.Th>
                <Table.Th>Total Records</Table.Th>
                <Table.Th>Present Records</Table.Th>
                <Table.Th>Attendance Percentage</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {lowAttendanceScouts.map((scout) => (
                <Table.Tr key={scout.id}>
                  <Table.Td>{scout.full_name}</Table.Td>
                  <Table.Td>{scout.email}</Table.Td>
                  <Table.Td>{scout.totalRecords}</Table.Td>
                  <Table.Td>{scout.presentRecords}</Table.Td>
                  <Table.Td>{scout.attendancePercentage}%</Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Paper>
      )}
    </Container>
  );
};

export default LowAttendancePage;