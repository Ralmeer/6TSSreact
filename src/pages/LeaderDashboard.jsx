import React, { useState, useEffect } from 'react';
import { Box, Group, Text, Title, SimpleGrid, Card, ThemeIcon } from '@mantine/core';
import { Link } from 'react-router-dom';
import { IconUsers, IconCalendarEvent, IconAward, IconChartBar, IconAlertCircle, IconBell, IconUserPlus, IconUserCircle } from '@tabler/icons-react';
import { useAuth } from '../AuthContextV2';
import { supabase } from '../supabaseClient';

const LeaderDashboard = () => {
  const { user } = useAuth();
  const [leaderName, setLeaderName] = useState('');

  useEffect(() => {
    const fetchLeaderName = async () => {
      if (user) {
        const { data, error } = await supabase
          .from('scouts') // Changed from 'leaders' to 'scouts'
          .select('full_name')
          .eq('user_id', user.id)
          .single();

        if (error) {
          console.error('Error fetching leader name:', error.message);
        } else if (data) {
          setLeaderName(data.full_name);
        }
      }
    };

    fetchLeaderName();
  }, [user]);

  const leaderDashboardCards = [
    {
      title: 'Scout Management',
      icon: <IconUsers size={30} />,
      link: '/leader-section/scout-management',
      description: 'Manage scout profiles, assign to patrols, and update personal information.',
    },
    {
      title: 'Attendance',
      icon: <IconCalendarEvent size={30} />,
      link: '/leader-section/attendance',
      description: 'Record and track attendance for meetings and events.',
    },
    {
      title: 'Badges',
      icon: <IconAward size={30} />,
      link: '/leader-section/badges',
      description: 'Award and track scout badges and achievements.',
    },
    {
      title: 'Low Attendance',
      icon: <IconAlertCircle size={30} />,
      link: '/leader-section/low-attendance',
      description: 'Identify scouts with low attendance and send reminders.',
    },
    {
      title: 'Notices',
      icon: <IconBell size={30} />,
      link: '/leader-section/notices',
      description: 'Post important announcements and updates for scouts and parents.',
    },
    {
      title: 'Statistics',
      icon: <IconChartBar size={30} />,
      link: '/leader-section/statistics',
      description: 'View various statistics and reports on scout activities and progress.',
    },
    {
      title: 'Add Leaders',
      icon: <IconUserPlus size={30} />,
      link: '/leader-section/add-leaders',
      description: 'Add new leaders to the system and manage their roles.',
    },
    {
      title: 'Scout Profiles',
      icon: <IconUserCircle size={30} />,
      link: '/leader-section/profiles',
      description: 'View and manage detailed profiles of all scouts.',
    },
  ];

  return (
    <Box p="lg">
      <Title order={1} align="left" mb="lg">Leader Dashboard</Title>
      {leaderName && (
        <Text size="xl" align="left" mb="lg">
          Welcome, {leaderName}!
        </Text>
      )}
      <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="lg">
        {leaderDashboardCards.map((card, index) => (
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

export default LeaderDashboard;