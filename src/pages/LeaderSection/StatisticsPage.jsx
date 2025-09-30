import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { Box, Stack, Title, Text, Paper, Progress, Select, TextInput, Button } from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';

const StatisticsPage = () => {
  const [totalScouts, setTotalScouts] = useState(0);
  const [totalLeaders, setTotalLeaders] = useState(0);
  const [attendanceStats, setAttendanceStats] = useState({});
  const [previousAttendanceStats, setPreviousAttendanceStats] = useState({}); // New state for previous period attendance
  const [totalBadges, setTotalBadges] = useState(0);
  const [earnedBadges, setEarnedBadges] = useState(0);
  const [earnedBadgesData, setEarnedBadgesData] = useState([]); // New state for detailed earned badges
  const [badgeTypes, setBadgeTypes] = useState([]); // New state for badge types
  const [badgeNames, setBadgeNames] = useState([]); // New state for badge names
  const [selectedBadgeType, setSelectedBadgeType] = useState(null); // New state for selected badge type filter
  const [selectedBadgeName, setSelectedBadgeName] = useState(null); // New state for selected badge name filter
  const [startDateFilter, setStartDateFilter] = useState(null); // New state for start date filter
  const [endDateFilter, setEndDateFilter] = useState(null); // New state for end date filter
  const [selectedPeriod, setSelectedPeriod] = useState('month'); // New state for selected period
  const [minBadgesCount, setMinBadgesCount] = useState('');
  const [maxBadgesCount, setMaxBadgesCount] = useState('');
  const [scoutsByBadgeCount, setScoutsByBadgeCount] = useState([]);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchStatistics();
  }, [selectedPeriod, selectedBadgeType, selectedBadgeName, startDateFilter, endDateFilter]); // Re-run fetchStatistics when selectedPeriod or badge filters change

  useEffect(() => {
    fetchBadgeFilters();
  }, []); // Fetch badge filters once on component mount

  const fetchBadgeFilters = async () => {
    try {
      // Fetch unique badge types
      const { data: types, error: typesError } = await supabase
        .from('badges')
        .select('badge_type');
      if (typesError) throw typesError;
      const uniqueTypes = [...new Set(types.map(item => item.badge_type))];
      setBadgeTypes(uniqueTypes.map(type => ({ value: type, label: type })));

      // Fetch unique badge names
      const { data: names, error: namesError } = await supabase
        .from('badges')
        .select('name');
      if (namesError) throw namesError;
      const uniqueNames = [...new Set(names.map(item => item.name))];
      setBadgeNames(uniqueNames.map(name => ({ value: name, label: name })));

    } catch (err) {
      console.error('Error fetching badge filters:', err.message);
    }
  };

  const fetchStatistics = async () => {
    setMessage(null);
    setError(null);
    try {
      // Fetch total scouts
      const { count: scoutsCount, error: scoutsError } = await supabase
        .from('scouts')
        .select('id', { count: 'exact' });
      if (scoutsError) throw scoutsError;
      setTotalScouts(scoutsCount);

      // Fetch total leaders
      const { count: leadersCount, error: leadersError } = await supabase
        .from('userroles')
        .select('id', { count: 'exact' })
        .eq('userrole', 'Leader');
      if (leadersError) throw leadersError;
      setTotalLeaders(leadersCount);

      // Fetch total badges
      const { count: badgesCount, error: badgesError } = await supabase
        .from('badges')
        .select('id', { count: 'exact' });
      if (badgesError) throw badgesError;
      setTotalBadges(badgesCount);

      // Fetch earned badges with filters
      let earnedBadgesQuery = supabase.from('scout_badges').select('*, badges(badge_type, name)');

      if (selectedBadgeType || selectedBadgeName) {
        let badgeIds = [];
        let badgesQuery = supabase.from('badges').select('id');

        if (selectedBadgeType) {
          badgesQuery = badgesQuery.eq('badge_type', selectedBadgeType);
        }
        if (selectedBadgeName) {
          badgesQuery = badgesQuery.eq('name', selectedBadgeName);
        }

        const { data: filteredBadges, error: filteredBadgesError } = await badgesQuery;
        if (filteredBadgesError) throw filteredBadgesError;

        badgeIds = filteredBadges.map(badge => badge.id);
        earnedBadgesQuery = earnedBadgesQuery.in('badge_id', badgeIds);
      }

      if (startDateFilter) {
        const validStartDate = startDateFilter instanceof Date ? startDateFilter : new Date(startDateFilter);
        if (!isNaN(validStartDate.getTime())) {
          earnedBadgesQuery = earnedBadgesQuery.gte('date_earned', validStartDate.toISOString());
        }
      }
      if (endDateFilter) {
        const validEndDate = endDateFilter instanceof Date ? endDateFilter : new Date(endDateFilter);
        if (!isNaN(validEndDate.getTime())) {
          earnedBadgesQuery = earnedBadgesQuery.lte('date_earned', validEndDate.toISOString());
        }
      }

      const { data: earnedBadgesResult, error: earnedBadgesError } = await earnedBadgesQuery.limit(1000);
      if (earnedBadgesError) throw earnedBadgesError;
      const earnedBadgesCount = earnedBadgesResult.length;
      setEarnedBadges(earnedBadgesCount);
      setEarnedBadgesData(earnedBadgesResult);

      // Fetch attendance statistics for current period
      const { startDate: currentPeriodStartDate, endDate: currentPeriodEndDate } = getPeriodDates(selectedPeriod);

      const { count: currentAttendanceCount, error: currentAttendanceError } = await supabase
        .from('attendance')
        .select('id', { count: 'exact' })
        .gte('date', currentPeriodStartDate)
        .lte('date', currentPeriodEndDate);
      if (currentAttendanceError) throw currentAttendanceError;

      const { data: currentAttendanceIds, error: currentAttendanceIdsError } = await supabase
        .from('attendance')
        .select('id')
        .gte('date', currentPeriodStartDate)
        .lte('date', currentPeriodEndDate);
      if (currentAttendanceIdsError) throw currentAttendanceIdsError;

      const { count: currentPresentCount, error: currentPresentError } = await supabase
        .from('attendance_scouts')
        .select('attendance_id', { count: 'exact' })
        .in('attendance_id', currentAttendanceIds.map(item => item.id));
      if (currentPresentError) throw currentPresentError;

      setAttendanceStats({
        totalRecords: currentAttendanceCount,
        presentRecords: currentPresentCount,
        averageAttendance: (totalScouts > 0 && currentAttendanceCount > 0)
          ? ((currentPresentCount / (totalScouts * currentAttendanceCount)) * 100).toFixed(2)
          : 0,
      });

      // Fetch attendance statistics for previous period
      const { startDate: previousPeriodStartDate, endDate: previousPeriodEndDate } = getPeriodDates(selectedPeriod, true);

      const { count: previousAttendanceCount, error: previousAttendanceError } = await supabase
        .from('attendance')
        .select('id', { count: 'exact' })
        .gte('date', previousPeriodStartDate)
        .lte('date', previousPeriodEndDate);
      if (previousAttendanceError) throw previousAttendanceError;

      const { data: previousAttendanceIds, error: previousAttendanceIdsError } = await supabase
        .from('attendance')
        .select('id')
        .gte('date', previousPeriodStartDate)
        .lte('date', previousPeriodEndDate);
      if (previousAttendanceIdsError) throw previousAttendanceIdsError;

      const { count: previousPresentCount, error: previousPresentError } = await supabase
        .from('attendance_scouts')
        .select('attendance_id', { count: 'exact' })
        .in('attendance_id', previousAttendanceIds.map(item => item.id));
      if (previousPresentError) throw previousPresentError;

      setPreviousAttendanceStats({
        totalRecords: previousAttendanceCount,
        presentRecords: previousPresentCount,
        averageAttendance: (totalScouts > 0 && previousAttendanceCount > 0)
          ? ((previousPresentCount / (totalScouts * currentAttendanceCount)) * 100).toFixed(2)
          : 0,
      });

    } catch (err) {
      console.error('Error fetching statistics:', err.message);
      setError('Error fetching statistics: ' + err.message);
    }
  };

  const getPeriodDates = (period, isPrevious = false) => {
    const now = new Date();
    let startDate, endDate;

    switch (period) {
      case 'month':
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        if (isPrevious) {
          endDate = new Date(now.getFullYear(), now.getMonth(), 0);
          startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        }
        break;
      case 'three_months':
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        startDate = new Date(now.getFullYear(), now.getMonth() - 2, 1);
        if (isPrevious) {
          endDate = new Date(now.getFullYear(), now.getMonth() - 2, 0);
          startDate = new Date(now.getFullYear(), now.getMonth() - 5, 1);
        }
        break;
      case 'six_months':
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        startDate = new Date(now.getFullYear(), now.getMonth() - 5, 1);
        if (isPrevious) {
          endDate = new Date(now.getFullYear(), now.getMonth() - 5, 0);
          startDate = new Date(now.getFullYear(), now.getMonth() - 11, 1);
        }
        break;
      case 'year':
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        startDate = new Date(now.getFullYear(), 0, 1);
        if (isPrevious) {
          endDate = new Date(now.getFullYear() - 1, now.getMonth() + 1, 0);
          startDate = new Date(now.getFullYear() - 1, 0, 1);
        }
        break;
      default:
        // Default to month if no period is selected or invalid
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        if (isPrevious) {
          endDate = new Date(now.getFullYear(), now.getMonth(), 0);
          startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        }
        break;
    }
    return { startDate: startDate.toISOString(), endDate: endDate.toISOString() };
  };

  const fetchScoutsByBadgeCount = async () => {
    try {
      const { data: scouts, error: scoutsError } = await supabase
        .from('scouts')
        .select('id, full_name');
      if (scoutsError) throw scoutsError;

      const scoutsWithBadgeCounts = await Promise.all(scouts.map(async (scout) => {
        const { count: badgeCount, error: badgeCountError } = await supabase
          .from('scout_badges')
          .select('id', { count: 'exact' })
          .eq('scout_id', scout.id);
        if (badgeCountError) throw badgeCountError;
        return { ...scout, badge_count: badgeCount };
      }));

      const min = parseInt(minBadgesCount);
      const max = parseInt(maxBadgesCount);

      const filteredScouts = scoutsWithBadgeCounts.filter(scout => {
        const count = scout.badge_count;
        return (!isNaN(min) ? count >= min : true) && (!isNaN(max) ? count <= max : true);
      });

      setScoutsByBadgeCount(filteredScouts);

    } catch (err) {
      console.error('Error fetching scouts by badge count:', err.message);
      setError('Error fetching scouts by badge count: ' + err.message);
    }
  };

  return (
    <Stack p="md">
      <Title order={2} mb="md">Statistics</Title>
      {message && <Text color="green" mb="sm">{message}</Text>}
      {error && <Text color="red" mb="sm">{error}</Text>}

      <Paper withBorder shadow="md" p="md" mb="xl">
        <Title order={3} mb="md">Overall Statistics</Title>
        <Text size="xl" weight={700}>Total Scouts: {totalScouts}</Text>
        <Text size="xl" weight={700}>Total Leaders: {totalLeaders}</Text>
      </Paper>

      <Paper withBorder shadow="md" p="md" mb="xl">
        <Title order={3} mb="md">Attendance Statistics (Current Period)</Title>
        <Select
          label="Comparison Period"
          placeholder="Pick one"
          data={[
            { value: 'month', label: 'Last Month' },
            { value: 'three_months', label: 'Last 3 Months' },
            { value: 'six_months', label: 'Last 6 Months' },
            { value: 'year', label: 'Last Year' },
          ]}
          value={selectedPeriod}
          onChange={(value) => setSelectedPeriod(value)}
          mb="md"
        />
        <Text size="xl" weight={700}>Total Attendance Records: {attendanceStats.totalRecords}</Text>
        <Text size="xl" weight={700}>Present Records: {attendanceStats.presentRecords}</Text>
        <Text mt="md" mb="xs">Average Attendance Rate: {attendanceStats.averageAttendance}%</Text>
        <Progress value={parseFloat(attendanceStats.averageAttendance)} size="xl" radius="xl" />
        {/* More detailed attendance stats can be added here, e.g., per scout, per event */}
      </Paper>

      <Paper withBorder shadow="md" p="md" mb="xl">
        <Title order={3} mb="md">Attendance Statistics (Previous Period)</Title>
        <Text size="xl" weight={700}>Total Attendance Records: {previousAttendanceStats.totalRecords}</Text>
        <Text size="xl" weight={700}>Present Records: {previousAttendanceStats.presentRecords}</Text>
        <Text mt="md" mb="xs">Average Attendance Rate: {previousAttendanceStats.averageAttendance}%</Text>
        <Progress value={parseFloat(previousAttendanceStats.averageAttendance)} size="xl" radius="xl" />
      </Paper>

      <Paper withBorder shadow="md" p="md">
        <Title order={3} mb="md">Badge Statistics</Title>
        <Select
          label="Filter by Badge Type"
          placeholder="All Types"
          data={badgeTypes}
          value={selectedBadgeType}
          onChange={setSelectedBadgeType}
          clearable
          mb="md"
        />
        <Select
          label="Filter by Badge Name"
          placeholder="All Names"
          data={badgeNames}
          value={selectedBadgeName}
          onChange={setSelectedBadgeName}
          clearable
          mb="md"
        />
        <DatePickerInput
          label="Date Earned (Start)"
          placeholder="Pick date"
          value={startDateFilter}
          onChange={setStartDateFilter}
          clearable
          styles={{
            calendarHeaderControl: {
              width: '16px',
              height: '16px',
            },
          }}
          />
        
          <DatePickerInput
            label="Date Earned (End)"
            placeholder="Pick date"
            value={endDateFilter}
            onChange={setEndDateFilter}
            clearable
            styles={{
              calendarHeaderControl: {
                width: '16px',
                height: '16px',
              },
            }}
          />
        <Text size="xl" weight={700}>Total Badges: {totalBadges}</Text>
        <Text size="xl" weight={700}>Earned Badges: {earnedBadges}</Text>

        <Title order={4} mt="xl" mb="md">Search Scouts by Number of Badges</Title>
        <TextInput
          label="Minimum Badges"
          placeholder="e.g., 5"
          type="number"
          value={minBadgesCount}
          onChange={(event) => setMinBadgesCount(event.currentTarget.value)}
          mb="sm"
        />
        <TextInput
          label="Maximum Badges"
          placeholder="e.g., 10"
          type="number"
          value={maxBadgesCount}
          onChange={(event) => setMaxBadgesCount(event.currentTarget.value)}
          mb="md"
        />
        <Button onClick={fetchScoutsByBadgeCount} mb="md">Search Scouts</Button>

        {scoutsByBadgeCount.length > 0 && (
          <Box mt="md">
            <Text size="lg" weight={700}>Scouts by Badge Count:</Text>
            <Stack>
              {scoutsByBadgeCount.map(scout => (
                <Text key={scout.id}>{scout.full_name} ({scout.badge_count} badges)</Text>
              ))}
            </Stack>
            <Text size="lg" weight={700} mt="md">Total Scouts: {scoutsByBadgeCount.length}</Text>
          </Box>
        )}
      </Paper>
    </Stack>
  );
};

export default StatisticsPage;