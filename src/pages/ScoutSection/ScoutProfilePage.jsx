import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { useAuth } from '../../AuthContextV2';
import { Button, Box, Title, Text, Paper } from '@mantine/core';
import { Link as RouterLink } from 'react-router-dom';

const ScoutProfilePage = () => {
  const { user } = useAuth();
  const [scoutProfile, setScoutProfile] = useState(null);
  const [attendanceHistory, setAttendanceHistory] = useState([]);
  const [badges, setBadges] = useState([]);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (user) {
      const getProfileData = async () => {
        const { data, error } = await supabase
          .from('scouts')
          .select('*') // Removed users(email) join
          .eq('user_id', user.id)
          .single();

        if (error) {
          console.error('Error fetching scout profile:', error.message);
          setError('Error fetching scout profile: ' + error.message);
          return;
        }
        setScoutProfile(data);
        if (data && data.id) { // Ensure data.id is valid before fetching attendance and badges
          fetchAttendanceHistory(data.id);
          fetchBadges(data.id);
        }
      };
      getProfileData();
    }
  }, [user]);

  const fetchScoutProfile = async (userId) => {
    setMessage(null);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('scouts')
        .select('*') // Removed users(email) join
        .eq('user_id', userId)
        .single();

      if (error) throw error;
      setScoutProfile(data);
    } catch (err) {
      console.error('Error fetching scout profile:', err.message);
      setError('Error fetching scout profile: ' + err.message);
    }
  };

  const fetchAttendanceHistory = async (scoutId) => {
    setMessage(null);
    setError(null);
    try {
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

  const fetchBadges = async (scoutId) => {
    setMessage(null);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('scout_badges')
        .select('*, badges(name, description), physically_obtained')
        .eq('scout_id', scoutId); // Use scoutId directly

      if (error) throw error;
      setBadges(data);
    } catch (err) {
      console.error('Error fetching badges:', err.message);
      setError('Error fetching badges: ' + err.message);
    }
  };

  if (!user) {
    return <p>Please log in to view your profile.</p>;
  }

  if (!scoutProfile) {
    return <p>Loading profile...</p>;
  }

  return (
    <Box className="container mx-auto p-4">
      <Title order={2} className="text-3xl font-bold mb-6">Scout Profile</Title>
      {message && <Text color="green">{message}</Text>}
      {error && <Text color="red">{error}</Text>}

      <Paper shadow="xs" p="md" mb="md">
        <Title order={3} className="text-xl font-semibold mb-2">Personal Information</Title>
        <Text><strong>Name:</strong> {scoutProfile.name}</Text>
        <Text><strong>Email:</strong> {scoutProfile.email || user.email}</Text>
        <RouterLink to="/change-email">
          <Button variant="outline" size="xs" mt="sm">Change Email</Button>
        </RouterLink>
        <Text><strong>Rank:</strong> {scoutProfile.rank}</Text>
        <Text><strong>Crew:</strong> {scoutProfile.crew}</Text>
      </Paper>

      <Paper shadow="xs" p="md" mb="md">
        <Title order={3} className="text-xl font-semibold mb-2">Attendance History</Title>
        {attendanceHistory.length === 0 ? (
          <Text>No attendance records found.</Text>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Activity Type</th>
                <th>Custom Activity Name</th>
              </tr>
            </thead>
            <tbody>
              {attendanceHistory.map((record) => (
                <tr key={record.id}>
                  <td>{record.attendance?.date}</td>
                  <td>{record.attendance?.activity_type}</td>
                  <td>{record.attendance?.custom_activity_name || 'N/A'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Paper>

      <Paper shadow="xs" p="md" mb="md">
        <Title order={3} className="text-xl font-semibold mb-2">Badges</Title>
        {badges.length === 0 ? (
          <Text>No badges assigned yet.</Text>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Badge Name</th>
                <th>Description</th>
                <th>Physically Obtained</th>
              </tr>
            </thead>
            <tbody>
              {badges.map((badge) => (
                <tr key={badge.id}>
                  <td>{badge.badges?.name || 'N/A'}</td>
                  <td>{badge.badges?.description || 'N/A'}</td>
                  <td>{badge.physically_obtained ? 'Yes' : 'No'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Paper>
    </Box>
  );
};

export default ScoutProfilePage;