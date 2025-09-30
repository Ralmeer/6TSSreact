import React from 'react';
import { AppShell, Burger, Group, Image, Text, Button, Menu } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { Link as RouterLink, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './AuthContextV2';
import LoginPage from './pages/LoginPage';
import ScoutDashboard from './pages/ScoutDashboard';
import LeaderDashboard from './pages/LeaderDashboard';
import CompleteRegistrationPage from './pages/CompleteRegistrationPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import UpdatePasswordPage from './pages/UpdatePasswordPage';
import AuthCallbackPage from './pages/AuthCallbackPage';
import PrivateRoute from './components/PrivateRoute';
import AddLeadersPage from './pages/LeaderSection/AddLeadersPage';
import AttendancePageLeader from './pages/LeaderSection/AttendancePage';
import BadgesPageLeader from './pages/LeaderSection/BadgesPage';
import LowAttendancePage from './pages/LeaderSection/LowAttendancePage';
import NoticesPageLeader from './pages/LeaderSection/NoticesPage';
import ScoutManagementPage from './pages/LeaderSection/ScoutManagementPage';
import StatisticsPage from './pages/LeaderSection/StatisticsPage';
import AttendancePageScout from './pages/ScoutSection/AttendancePage';
import BadgesPageScout from './pages/ScoutSection/BadgesPage';
import NoticesPageScout from './pages/ScoutSection/NoticesPage';
import ScoutProfilePage from './pages/ScoutSection/ScoutProfilePage';
import ConfirmInvitePage from './pages/Auth/ConfirmInvitePage';
import ResetPasswordHandler from './pages/Auth/ResetPasswordHandler';
import ChangeEmailPage from './ChangeEmailPage';
import LeaderProfilesPage from './pages/LeaderSection/LeaderProfilesPage';
import '@mantine/dates/styles.css';

function App() {
  const [opened, { toggle }] = useDisclosure();
  const { user, signOut, userrole, loading } = useAuth();

  if (loading) {
    return <div className="loading-container"><p>Loading application...</p></div>;
  }

  return (
    <AppShell
      header={{ height: 70 }}
      padding="md"
    >
      <AppShell.Header bg="blue">
        <Group h="100%" px="md" justify="space-between" style={{ display: 'flex', alignItems: 'center' }}>
          <Group>
            <Image src="/6TSS Logo Transparent.png" alt="Tobatendance Logo" style={{ height: 50, width: 50 }} />
            <Text size="lg" fw={700}>Tobattendance</Text>
          </Group>
          {user && (
            <Group>
              <Menu shadow="md" width={200} opened={opened} onChange={toggle}>
                <Menu.Target>
                  <Burger opened={opened} onClick={toggle} color={opened ? "blue" : "white"} />
                </Menu.Target>
                <Menu.Dropdown>
                  {userrole === 'leader' && (
                    <>
                      <Menu.Item component={RouterLink} to="/leader-dashboard">Leader Dashboard</Menu.Item>
                      <Menu.Item component={RouterLink} to="/leader-section/scout-management">Scout Management</Menu.Item>
                      <Menu.Item component={RouterLink} to="/leader-section/attendance">Attendance</Menu.Item>
                      <Menu.Item component={RouterLink} to="/leader-section/badges">Badges</Menu.Item>
                      <Menu.Item component={RouterLink} to="/leader-section/low-attendance">Low Attendance</Menu.Item>
                      <Menu.Item component={RouterLink} to="/leader-section/notices">Notices</Menu.Item>
                      <Menu.Item component={RouterLink} to="/leader-section/statistics">Statistics</Menu.Item>
                      <Menu.Item component={RouterLink} to="/leader-section/add-leaders">Add Leaders</Menu.Item>
                      <Menu.Item component={RouterLink} to="/leader-section/profiles">Scout Profiles</Menu.Item>
                    </>
                  )}
                  {userrole === 'scout' && (
                    <>
                      <Menu.Item component={RouterLink} to="/scout-dashboard">Scout Dashboard</Menu.Item>
                      <Menu.Item component={RouterLink} to="/scout-section/attendance">Attendance</Menu.Item>
                      <Menu.Item component={RouterLink} to="/scout-section/badges">Badges</Menu.Item>
                      <Menu.Item component={RouterLink} to="/scout-section/notices">Notices</Menu.Item>
                      <Menu.Item component={RouterLink} to="/scout-section/scout-profile">My Profile</Menu.Item>
                    </>
                  )}
                  <Menu.Divider />
                  <Menu.Item onClick={signOut} color="red">Logout</Menu.Item>
                </Menu.Dropdown>
              </Menu>
            </Group>
          )}
        </Group>
      </AppShell.Header>

      <AppShell.Main className="w-full">
        <Routes>
          <Route path="/" element={user ? (userrole === 'leader' ? <Navigate to="/leader-dashboard" /> : <Navigate to="/scout-dashboard" />) : <Navigate to="/login" />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/complete-registration" element={<CompleteRegistrationPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/update-password" element={<UpdatePasswordPage />} />
          <Route path="/auth/confirm" element={<AuthCallbackPage />} />
          <Route path="/auth/reset-password-handler" element={<ResetPasswordHandler />} />
          <Route path="/change-email" element={<ChangeEmailPage />} />
          <Route path="/confirm-invite" element={<ConfirmInvitePage />} />
          <Route path="/auth/v1/verify" element={<AuthCallbackPage />} />
          <Route
            path="/scout-dashboard"
            element={
              <PrivateRoute allowedRoles={['scout']}>
                <ScoutDashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/leader-dashboard"
            element={
              <PrivateRoute allowedRoles={['leader']}>
                <LeaderDashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/leader-section/scout-management"
            element={
              <PrivateRoute requiredRole="leader">
                <ScoutManagementPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/leader-section/attendance"
            element={
              <PrivateRoute requiredRole="leader">
                <AttendancePageLeader />
              </PrivateRoute>
            }
          />
          <Route
            path="/leader-section/badges"
            element={
              <PrivateRoute requiredRole="leader">
                <BadgesPageLeader />
              </PrivateRoute>
            }
          />
          <Route
            path="/leader-section/low-attendance"
            element={
              <PrivateRoute requiredRole="leader">
                <LowAttendancePage />
              </PrivateRoute>
            }
          />
          <Route
            path="/leader-section/notices"
            element={
              <PrivateRoute requiredRole="leader">
                <NoticesPageLeader />
              </PrivateRoute>
            }
          />
          <Route
            path="/leader-section/statistics"
            element={
              <PrivateRoute requiredRole="leader">
                <StatisticsPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/leader-section/add-leaders"
            element={
              <PrivateRoute requiredRole="leader">
                <AddLeadersPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/leader-section/profiles"
            element={
              <PrivateRoute requiredRole="leader">
                <LeaderProfilesPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/scout-section/attendance"
            element={
              <PrivateRoute requiredRole="scout">
                <AttendancePageScout />
              </PrivateRoute>
            }
          />
          <Route
            path="/scout-section/badges"
            element={
              <PrivateRoute requiredRole="scout">
                <BadgesPageScout />
              </PrivateRoute>
            }
          />
          <Route
            path="/scout-section/notices"
            element={
              <PrivateRoute requiredRole="scout">
                <NoticesPageScout />
              </PrivateRoute>
            }
          />
          <Route
            path="/scout-section/scout-profile"
            element={
              <PrivateRoute requiredRole="scout">
                <ScoutProfilePage />
              </PrivateRoute>
            }
          />
        </Routes>
      </AppShell.Main>
    </AppShell>
  );
}

export default App;