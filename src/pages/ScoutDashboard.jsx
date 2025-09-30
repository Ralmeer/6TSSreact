import React, { useState, useEffect } from 'react';
import { Box, Group, Text, Title, SimpleGrid, Card, ThemeIcon } from '@mantine/core';
import { Link } from 'react-router-dom';
import { IconCalendarEvent, IconAward, IconBell, IconUserCircle } from '@tabler/icons-react';
import { useAuth } from '../AuthContextV2';
import { supabase } from '../supabaseClient';

const ScoutDashboard = () => {
  const { user } = useAuth();
  const [scoutName, setScoutName] = useState('');
  const [scoutCrew, setScoutCrew] = useState('');
  const [scoutRank, setScoutRank] = useState('');

  useEffect(() => {
    const fetchScoutName = async () => {
      if (user) {
        const { data, error } = await supabase
          .from('scouts')
          .select('full_name, crew, rank')
          .eq('user_id', user.id)
          .single();

        if (error) {
          console.error('Error fetching scout details:', error.message);
        } else if (data) {
          setScoutName(data.full_name);
          setScoutCrew(data.crew);
          setScoutRank(data.rank);
        }
      }
    };

    fetchScoutName();
  }, [user]);

  const scoutDashboardCards = [
    {
      title: 'Attendance',
      icon: <IconCalendarEvent size={30} />,
      link: '/scout-section/attendance',
      description: 'View and manage your attendance records for meetings and events.',
    },
    {
      title: 'Badges',
      icon: <IconAward size={30} />,
      link: '/scout-section/badges',
      description: 'Track your progress on badges and achievements.',
    },
    {
      title: 'Notices',
      icon: <IconBell size={30} />,
      link: '/scout-section/notices',
      description: 'Read important announcements and updates from your leaders.',
    },
    {
      title: 'My Profile',
      icon: <IconUserCircle size={30} />,
      link: '/scout-section/scout-profile',
      description: 'View and update your personal profile information.',
    },
  ];

  return (
    <Box sx={{ padding: '20px' }}>
      <Title order={1} align="left" mb="lg">Scout Dashboard</Title>
      {scoutName && (
        <Text size="xl" align="left" mb="lg">
          Welcome, {scoutName}!
          {scoutCrew && <Text span size="md" ml="sm">Crew: {scoutCrew}</Text>}
          {scoutRank && <Text span size="md" ml="sm">Rank: {scoutRank}</Text>}
        </Text>
      )}
      <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="lg">
        {scoutDashboardCards.map((card, index) => (
          <Card key={index} shadow="sm" padding="lg" radius="md" withBorder component={Link} to={card.link}>
            <Group position="center" direction="column" spacing="xs">
              <ThemeIcon variant="light" size="xl" radius="md">
                {card.icon}
              </ThemeIcon>
              <Text weight={500} size="lg" align="center">
                {card.title}
              </Text>
              <Text size="sm" color="dimmed" align="center">
                {card.description}
              </Text>
            </Group>
          </Card>
        ))}
      </SimpleGrid>
    </Box>
  );
};

export default ScoutDashboard;