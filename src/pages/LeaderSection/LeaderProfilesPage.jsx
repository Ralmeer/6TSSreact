import React, { useState, useEffect } from 'react';
import { ActionIcon, Avatar, Badge, Box, Button, Card, Center, Container, Flex, Group, Loader, Modal, Paper, ScrollArea, Select, SimpleGrid, Stack, Table, Text, TextInput, Title, useMantineTheme } from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { supabase, supabaseServiceRole } from '../../supabaseClient';
import { useAuth } from '../../AuthContextV2';

const LeaderProfilesPage = () => {
  const { user, userrole, loading: authLoading, supabase: authSupabase } = useAuth();
  const [scouts, setScouts] = useState([]);
  const [selectedScout, setSelectedScout] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [scoutBadges, setScoutBadges] = useState([]);
  const [scoutActivities, setScoutActivities] = useState([]);
  const [selectedBadgeType, setSelectedBadgeType] = useState('All');
  const [selectedActivityType, setSelectedActivityType] = useState('All');
  const [activitySearchTerm, setActivitySearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activityTypes, setActivityTypes] = useState(['All']);
  const [physicallyObtainedFilter, setPhysicallyObtainedFilter] = useState('All');
  const [badgeStartDate, setBadgeStartDate] = useState(null);
  const [badgeEndDate, setBadgeEndDate] = useState(null);
  const [activityStartDate, setActivityStartDate] = useState(null);
  const [activityEndDate, setActivityEndDate] = useState(null);
  const [showHistory, setShowHistory] = useState(false); // New state for history visibility

  useEffect(() => {
    if (!authLoading && user) {
      fetchScouts();
      fetchActivityTypes();
    }
  }, [user, authLoading, activityStartDate, activityEndDate]);

  useEffect(() => {
    if (selectedScout) {
      fetchScoutDetails(selectedScout.id);
    }
  }, [physicallyObtainedFilter, badgeStartDate, badgeEndDate, activityStartDate, activityEndDate]);

  const fetchActivityTypes = async () => {
    try {
      console.log('Fetching all activity types.');
      const session = await authSupabase.auth.getSession();
      const accessToken = session?.data?.session?.access_token;
      console.log('Access Token for fetchActivityTypes:', accessToken);

      if (!accessToken) {
        console.error('No access token available for fetching activity types.');
        setActivityTypes([{ value: 'All', label: 'All' }]);
        return;
      }

      const { data, error } = await supabaseServiceRole.functions.invoke(
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

  const fetchScouts = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('scouts').select('id, full_name, email');
      if (error) throw error;
      setScouts(data);
    } catch (err) {
      console.error('Error fetching scouts:', err.message);
      setError('Failed to fetch scouts.');
    } finally {
      setLoading(false);
    }
  };

  const fetchScoutDetails = async (scoutId) => {
    setLoading(true);
    setError(null);
    try {
      // Fetch scout details
      const { data: scoutData, error: scoutError } = await supabase
        .from('scouts')
        .select('id, full_name, email')
        .eq('id', scoutId)
        .single();
      if (scoutError) throw scoutError;
      setSelectedScout(scoutData);

      // Fetch scout history
      const { data: historyData, error: historyError } = await supabase
        .from('scout_history')
        .select('change_type, old_value, new_value, changed_at')
        .eq('scout_id', scoutId)
        .order('changed_at', { ascending: false });
      if (historyError) throw historyError;
      setSelectedScout(prev => ({ ...prev, history: historyData }));

      // Fetch scout badges
      let badgesQuery = supabase
        .from('scout_badges')
        .select(`
          id,
          date_earned,
          badges ( id, name, description, badge_type ), physically_obtained
        `)
        .eq('scout_id', scoutId);

      if (physicallyObtainedFilter === 'Yes') {
        badgesQuery = badgesQuery.eq('physically_obtained', true);
      } else if (physicallyObtainedFilter === 'No') {
        badgesQuery = badgesQuery.eq('physically_obtained', false);
      }

      if (badgeStartDate) {
        const startDate = badgeStartDate instanceof Date ? badgeStartDate : new Date(badgeStartDate);
        badgesQuery = badgesQuery.gte('date_earned', startDate.toISOString());
      }
      if (badgeEndDate) {
        const endDate = badgeEndDate instanceof Date ? badgeEndDate : new Date(badgeEndDate);
        badgesQuery = badgesQuery.lte('date_earned', endDate.toISOString());
      }

      const { data: badgesData, error: badgesError } = await badgesQuery;
      if (badgesError) throw badgesError;
      setScoutBadges(badgesData);

      // Fetch scout activities
      let activitiesQuery = supabase
        .from('attendance_scouts')
        .select(`
          id,
          attendance ( id, date, activity_type, custom_activity_name )
        `)
        .eq('scout_id', scoutId);

      if (activityStartDate) {
        const startDate = activityStartDate instanceof Date ? activityStartDate : new Date(activityStartDate);
        activitiesQuery = activitiesQuery.gte('attendance.date', startDate.toISOString());
      }
      if (activityEndDate) {
        const endDate = activityEndDate instanceof Date ? activityEndDate : new Date(activityEndDate);
        activitiesQuery = activitiesQuery.lte('attendance.date', endDate.toISOString());
      }

      const { data: activitiesData, error: activitiesError } = await activitiesQuery;
      if (activitiesError) throw activitiesError;
      setScoutActivities(activitiesData);

    } catch (err) {
      console.error('Error fetching scout details:', err.message);
      setError('Failed to fetch scout details.');
    } finally {
      setLoading(false);
    }
  };

  const filteredScouts = scouts.filter(scout =>
    scout.full_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredBadges = selectedBadgeType === 'All'
    ? scoutBadges
    : scoutBadges.filter(badge => badge.badges?.badge_type === selectedBadgeType);

  const filteredActivities = selectedActivityType === 'All'
    ? scoutActivities.filter(activity => (activity.attendance?.activity_type?.toLowerCase().includes(activitySearchTerm.toLowerCase()) || activity.attendance?.custom_activity_name?.toLowerCase().includes(activitySearchTerm.toLowerCase())))
    : scoutActivities.filter(activity => activity.attendance?.activity_type === selectedActivityType && activity.attendance?.custom_activity_name?.toLowerCase().includes(activitySearchTerm.toLowerCase()));

  return (
    <Box className="container mx-auto p-4 flex">
      {error && <Text color="red">{error}</Text>}
      <Paper shadow="xs" p="md" className="w-1/4 mr-4" style={{ minWidth: 250 }}>
        <TextInput
          placeholder="Search scouts..."
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.currentTarget.value)}
          mb="md"
        />
        <ScrollArea style={{ height: 'calc(100vh - 180px)' }}>
          <Stack>
            {filteredScouts.map(scout => (
              <Group
                key={scout.id}
                onClick={() => fetchScoutDetails(scout.id)}
                className="cursor-pointer hover:bg-gray-100 p-2 rounded"
              >
                <Text>{scout.full_name}</Text>
              </Group>
            ))}
          </Stack>
        </ScrollArea>
      </Paper>

      <Paper shadow="xs" p="md" className="w-3/4">
        {selectedScout ? (
          <>
            <Title order={2} className="text-2xl font-bold mb-4">{selectedScout.full_name}'s Profile</Title>
            <Group mb="md">
              <Stack>
                <Text size="lg" weight={500}>{selectedScout.full_name}</Text>
                <Text size="sm" color="dimmed">{selectedScout.email}</Text>
              </Stack>
            </Group>

             <Title order={3} className="text-xl font-semibold mt-6 mb-3">Badges Obtained</Title>
            <Group mb="md">
              <Select
                 label="Filter by Badge Type"
                  placeholder="Filter by badge type"
                  data={['All', 'Proficiency Badge', 'Stage Badge', 'Event Badge', 'Advancement Badge', 'Challenge Badge']}
                  defaultValue="All"
                  onChange={(value) => setSelectedBadgeType(value)}
                  clearable
                />
                <Select
                  label="Filter by Physically Obtained"
                  placeholder="Filter by physically obtained"
                  data={['All', 'Yes', 'No']}
                  defaultValue="All"
                  onChange={(value) => setPhysicallyObtainedFilter(value)}
                  clearable
                />
                <DatePickerInput
                  label="From"
                  placeholder="Pick date"
                  value={badgeStartDate}
                  onChange={setBadgeStartDate}
                  clearable
                />
                <DatePickerInput
                  label="To"
                  placeholder="Pick date"
                  value={badgeEndDate}
                  onChange={setBadgeEndDate}
                  clearable
                />
             </Group>
             {filteredBadges.length > 0 ? (
               <Group spacing="xs">
                 {filteredBadges.map(sb => (
                   <Badge key={sb.id} color="teal" variant="filled">
                     {sb.badges?.name} - {new Date(sb.date_earned).toLocaleDateString()}
                   </Badge>
                 ))}
               </Group>
             ) : (
               <Text>No badges obtained yet.</Text>
             )}

             <Title order={3} className="text-xl font-semibold mb-3" mt="xl">Activities Attended</Title>
             <Group mb="md">
               <Select
                  label="Filter by Activity Type"
                  placeholder="Filter by activity type"
                  data={activityTypes}
                  defaultValue="All"
                  onChange={(value) => setSelectedActivityType(value)}
                  clearable
                />
               <TextInput
                 label="Search Activities"
                 placeholder="Search activities..."
                 value={activitySearchTerm}
                 onChange={(event) => setActivitySearchTerm(event.currentTarget.value)}
               />
                 <DatePickerInput
                   label="Activity Start Date"
                   placeholder="Pick date"
                   value={activityStartDate}
                   onChange={setActivityStartDate}
                   clearable
                 />
                 <DatePickerInput
                   label="Activity End Date"
                   placeholder="Pick date"
                   value={activityEndDate}
                   onChange={setActivityEndDate}
                   clearable
                 />
             </Group>
             {filteredActivities.length > 0 ? (
               <Group mt="md">
                 {filteredActivities.map(sa => (
                   <Badge key={sa.id} color="blue" variant="filled">
                     {sa.attendance?.custom_activity_name} - {new Date(sa.attendance?.date).toLocaleDateString()}
                   </Badge>
                 ))}
               </Group>
             ) : (
                <Text>No activities attended yet.</Text>
             )}

            <Title order={3} className="text-xl font-semibold mt-6 mb-3">Rank and Crew History</Title>
            <Button onClick={() => setShowHistory(!showHistory)} mb="md">
              {showHistory ? 'Hide History' : 'Show History'}
            </Button>

            {showHistory && selectedScout.history && selectedScout.history.length > 0 ? (
              <Stack>
                {selectedScout.history.map((entry, index) => (
                  <Paper key={index} shadow="xs" p="xs" withBorder>
                    <Text size="sm">
                      <strong>{entry.change_type === 'rank_change' ? 'Rank' : 'Crew'} Change:</strong> From {entry.old_value} to {entry.new_value} on {new Date(entry.changed_at).toLocaleDateString()}
                    </Text>
                  </Paper>
                ))}
              </Stack>
            ) : showHistory ? (
              <Text>No historical rank or crew data available.</Text>
            ) : null}
          </>
        ) : (
          <Text className="text-center text-gray-500">Select a scout from the left to view their profile.</Text>
        )}
      </Paper>
    </Box>
  );
};

export default LeaderProfilesPage;