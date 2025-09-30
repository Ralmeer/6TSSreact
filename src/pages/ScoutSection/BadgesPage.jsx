import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { useAuth } from '../../AuthContextV2';
import { Box, Title, Text, Paper, Table, Button, Collapse, TextInput, Checkbox } from '@mantine/core';

const ScoutBadgesPage = () => {
  const { user } = useAuth();
  const [badges, setBadges] = useState([]);
  const [unobtainedBadges, setUnobtainedBadges] = useState([]);
  const [unobtainedSearchTerm, setUnobtainedSearchTerm] = useState('');
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showRequirements, setShowRequirements] = useState({}); // State to manage visibility of requirements for each badge

  const handleTogglePhysicallyObtained = async (badgeId, isChecked) => {
    try {
      const { error } = await supabase
        .from('scout_badges')
        .update({ physically_obtained: isChecked })
        .eq('id', badgeId);

      if (error) throw error;

      // Re-fetch badges to update the UI
      if (user) {
        fetchBadges(user.id);
      }
    } catch (err) {
      console.error('Error updating physically obtained status:', err.message);
      setError('Error updating status: ' + err.message);
    }
  };

  useEffect(() => {
    if (user) {
      fetchBadges(user.id);
    }
  }, [user]);

  const fetchBadges = async (userId) => {
    setMessage(null);
    setError(null);
    try {
      // First, get the scout_id for the current user
      const { data: scoutData, error: scoutError } = await supabase
        .from('scouts')
        .select('id')
        .eq('user_id', userId)
        .single();

      if (scoutError) throw scoutError;

      if (scoutData) {
        // Fetch all available badges
        const { data: allBadgesData, error: allBadgesError } = await supabase
          .from('badges')
          .select('id, name, description, badge_type, requirements');
        if (allBadgesError) throw allBadgesError;

        // Fetch badges obtained by the current scout
        const { data: obtainedBadgesData, error: obtainedBadgesError } = await supabase
          .from('scout_badges')
          .select('*, badges(id, name, description, badge_type, requirements)')
          .eq('scout_id', scoutData.id);

        if (obtainedBadgesError) throw obtainedBadgesError;
        setBadges(obtainedBadgesData);

        // Determine unobtained badges
        const obtainedBadgeIds = new Set(obtainedBadgesData.map(b => b.badges.id));
        const filteredUnobtainedBadges = allBadgesData.filter(
          badge => !obtainedBadgeIds.has(badge.id)
        );
        setUnobtainedBadges(filteredUnobtainedBadges);

      } else {
        setMessage('No scout profile found for this user.');
      }
    } catch (err) {
      console.error('Error fetching badges:', err.message);
      setError('Error fetching badges: ' + err.message);
    }
  };

  const filteredUnobtainedBadges = unobtainedBadges.filter(badge =>
    badge.name.toLowerCase().includes(unobtainedSearchTerm.toLowerCase())
  );

  if (!user) {
    return <p>Please log in to view your badges.</p>;
  }

  return (
    <Box className="container mx-auto p-4">
      <Paper shadow="xs" p="md">
        <Title order={2} className="text-3xl font-bold mb-6 text-center">My Badges</Title>
        {message && <p style={{ color: 'green' }}>{message}</p>}
        {error && <p style={{ color: 'red' }}>{error}</p>}

        {badges.length === 0 ? (
          <Text>No badges assigned yet.</Text>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Badge Name</th>
                <th>Description</th>
                <th>Badge Type</th>
                <th>Physically Obtained</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {badges.map((badge) => (
                <tr key={badge.id}>
                  <td>{badge.badges?.name || 'N/A'}</td>
                  <td>{badge.badges?.description || 'N/A'}</td>
                  <td>{badge.badges?.badge_type || 'N/A'}</td>
                  <td>
                    <Checkbox
                      checked={badge.physically_obtained}
                      onChange={(event) => handleTogglePhysicallyObtained(badge.id, event.currentTarget.checked)}
                      aria-label="Physically Obtained"
                    />
                  </td>
                  <td>
                    <Button onClick={() => setShowRequirements(prev => ({ ...prev, [badge.id]: !prev[badge.id] }))} size="xs">
                      {showRequirements[badge.id] ? 'Hide Requirements' : 'See Requirements'}
                    </Button>
                    <Collapse in={showRequirements[badge.id]}>
                      <Paper withBorder p="xs" mt="xs">
                        <Text size="sm" style={{ whiteSpace: 'pre-wrap' }}>{badge.badges?.requirements || 'No requirements specified.'}</Text>
                      </Paper>
                    </Collapse>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Paper>

      <Paper shadow="xs" p="md" mt="lg">
        <Title order={2} className="text-3xl font-bold mb-6 text-center">Unobtained Badges</Title>
        <TextInput
          placeholder="Search unobtained badges by name"
          value={unobtainedSearchTerm}
          onChange={(event) => setUnobtainedSearchTerm(event.currentTarget.value)}
          mb="md"
        />
        {filteredUnobtainedBadges.length === 0 ? (
          <Text>No unobtained badges found or all badges obtained.</Text>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Badge Name</th>
                <th>Description</th>
                <th>Badge Type</th>
                <th>Requirements</th>
              </tr>
            </thead>
            <tbody>
              {filteredUnobtainedBadges.map((badge) => (
                <tr key={badge.id}>
                  <td>{badge.name || 'N/A'}</td>
                  <td>{badge.description || 'N/A'}</td>
                  <td>{badge.badge_type || 'N/A'}</td>
                  <td>
                    <Button onClick={() => setShowRequirements(prev => ({ ...prev, [`unobtained-${badge.id}`]: !prev[`unobtained-${badge.id}`] }))} size="xs">
                      {showRequirements[`unobtained-${badge.id}`] ? 'Hide Requirements' : 'See Requirements'}
                    </Button>
                    <Collapse in={showRequirements[`unobtained-${badge.id}`]}>
                      <Paper withBorder p="xs" mt="xs">
                        <Text size="sm" style={{ whiteSpace: 'pre-wrap' }}>{badge.requirements || 'No requirements specified.'}</Text>
                      </Paper>
                    </Collapse>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Paper>
    </Box>
  );
};

export default ScoutBadgesPage;