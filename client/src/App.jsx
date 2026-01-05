import React, { useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthContext } from './context/AuthContext';
import { ConfigProvider, theme, App as AntApp } from 'antd';
import Login from './pages/Login';
import DashboardLayout from './layouts/DashboardLayout';
import AdminDashboard from './pages/AdminDashboard';
import Roles from './pages/Roles';
import { LoadingOutlined } from '@ant-design/icons';

// Placeholder Pages
const Placeholder = ({ title }) => <div className="p-4 text-xl">🚧 {title} under construction</div>;

const ProtectedRoute = () => {
  const { user, loading } = useContext(AuthContext);

  if (loading) return <div className="h-screen flex items-center justify-center"><LoadingOutlined style={{ fontSize: 48 }} /></div>;
  if (!user) return <Navigate to="/login" />;

  // ProtectedRoute now renders an Outlet (via nested routes in App) or children if used as wrapper
  // But here we use Layout Routes logic
  return <DashboardLayout />;
};


import StudentDashboard from './pages/student/StudentDashboard';
import Profile from './pages/student/Profile';
import Permissions from './pages/Permissions';
import MaterialRepository from './pages/materials/MaterialRepository';
import SalesDashboard from './pages/sales/SalesDashboard';
import UserManagement from './pages/UserManagement';
import TaskBoard from './pages/tasks/TaskBoard';
import Broadcasts from './pages/communication/Broadcasts';
import Tickets from './pages/communication/Tickets';
import Leaves from './pages/Leaves';
import Attendance from './pages/Attendance';
import Feedback from './pages/Feedback';
import Targets from './pages/Targets';
import Schedules from './pages/Schedules';
import AuditLogs from './pages/AuditLogs';

const App = () => {
  const { user, loading } = useContext(AuthContext);

  return (
    <ConfigProvider
      theme={{
        algorithm: theme.defaultAlgorithm,
        token: {
          colorPrimary: '#5865F2',
          borderRadius: 8,
        },
      }}
    >
      <AntApp>
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />

            {/* Protected Routes Wrapper */}
            <Route element={
              loading ? <div className="h-screen flex items-center justify-center"><LoadingOutlined style={{ fontSize: 48 }} /></div> :
                user ? <DashboardLayout /> : <Navigate to="/login" />
            }>
              <Route path="/" element={user?.roles?.some(r => r.name === 'STUDENT' || r.name === 'Student' || r.name.includes('INTERN')) ? <Navigate to="/student" /> : <AdminDashboard />} />
              <Route path="/users" element={<UserManagement />} />
              <Route path="/roles" element={<Roles />} />
              <Route path="/permissions" element={<Permissions />} />

              {/* Student Routes */}
              <Route path="/student" element={<StudentDashboard />} />
              <Route path="/student/profile" element={<Profile />} />

              {/* Feature Routes */}
              <Route path="/materials" element={<MaterialRepository />} />
              <Route path="/attendance" element={<Attendance />} />
              <Route path="/leaves" element={<Leaves />} />
              <Route path="/sales" element={<SalesDashboard />} />
              <Route path="/tasks" element={<TaskBoard />} />
              <Route path="/broadcasts" element={<Broadcasts />} />
              <Route path="/feedback" element={<Feedback />} />
              <Route path="/tickets" element={<Tickets />} />
              <Route path="/targets" element={<Targets />} />
              <Route path="/schedules" element={<Schedules />} />
              <Route path="/audit-logs" element={<AuditLogs />} />
            </Route>

            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </Router>
      </AntApp>
    </ConfigProvider>
  );
};
export default App;
