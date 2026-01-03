

import React, { useContext, useState } from 'react';
import { Layout, Menu, Button, Avatar, Dropdown, theme, Space } from 'antd';
import {
    UserOutlined, VideoCameraOutlined, UploadOutlined,
    MenuFoldOutlined, MenuUnfoldOutlined, LogoutOutlined,
    TeamOutlined, DollarOutlined, SolutionOutlined, ScheduleOutlined, LockOutlined,
    BookOutlined,
    SoundOutlined,
    FallOutlined,
    RobotOutlined,
    CalendarOutlined,
    ContainerOutlined,
    LineChartOutlined
} from '@ant-design/icons';
import { AuthContext } from '../context/AuthContext';
import { useNavigate, Outlet, useLocation, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const { Header, Sider, Content } = Layout;

const DashboardLayout = () => {
    const { user, logout } = useContext(AuthContext);
    const [collapsed, setCollapsed] = useState(false);
    const { token } = theme.useToken();
    const navigate = useNavigate();
    const location = useLocation();


    // Helper to check role
    const isSuperAdmin = user?.isSuperAdmin;
    // Basic check: if user has any role with 'canManageUsers', treat as Admin-ish
    const isAdmin = isSuperAdmin || user?.roles?.some(r => r.permissions?.canManageUsers);

    // Admin Menu Items
    const adminItems = [
        { key: '/', icon: <UserOutlined />, label: 'Dashboard' },
        { key: '/users', icon: <TeamOutlined />, label: 'User Management' },
        { key: '/roles', icon: <TeamOutlined />, label: 'Role Management' },
        { key: '/permissions', icon: <LockOutlined />, label: 'Permissions' },
        { key: '/attendance', icon: <ScheduleOutlined />, label: 'Attendance' },
        { key: '/materials', icon: <BookOutlined />, label: 'Materials' },
        { key: '/sales', icon: <FallOutlined />, label: 'Fees & Sales' },
        { key: '/tasks', icon: <CalendarOutlined />, label: 'Tasks' },
        { key: '/leaves', icon: <UserOutlined />, label: 'Leaves' },
        { key: '/broadcasts', icon: <SoundOutlined />, label: 'Broadcasts' },
        { key: '/tickets', icon: <RobotOutlined />, label: 'Support' },
        { key: '/schedules', icon: <CalendarOutlined />, label: 'Schedules' },
        { key: '/targets', icon: <FallOutlined />, label: 'Targets' },
        { key: '/feedback', icon: <LineChartOutlined />, label: 'Performance' },
        { key: '/audit-logs', icon: <ContainerOutlined />, label: 'Audit Logs' },
    ];

    // Student Menu Items
    const studentItems = [
        { key: '/student', icon: <UserOutlined />, label: 'My Dashboard' },
        { key: '/student/profile', icon: <UserOutlined />, label: 'My Profile' },
        { key: '/materials', icon: <BookOutlined />, label: 'Study Materials' },
    ];

    // Determine items based on Generic Role Access Logic
    // 1. If Super Admin -> Show All Admin Items
    // 2. If Student -> Show Student Items
    // 3. If Custom Role -> Show items where `key` is in `accessiblePages`

    let menuItems = [];

    if (user?.isSuperAdmin) {
        menuItems = adminItems;
    } else {
        // Collect all accessible pages from all assigned roles
        const accessiblePages = new Set();
        // Always allow home if they have admin access?
        if (isAdmin) accessiblePages.add('/');

        user?.roles?.forEach(role => {
            role.accessiblePages?.forEach(page => accessiblePages.add(page));
        });

        if (isAdmin) {
            menuItems = adminItems.filter(item => accessiblePages.has(item.key));
        } else {
            // Default to student view for non-admins? Or maybe mixed?
            // For now, if role has student perm, show student items.
            // Simplification: Check role name or just use a flag?
            // Given the requirements, let's treat everyone as "Potential Admin" if they have custom access
            // BUT, if they are "Student" (by role name or logic), show studentItems.

            // Check if user has "Student" role?
            // Or just combine all?

            // Simplest approach satisfying user request: Dynamic Menu
            // If they have accessiblePages, show those from Admin Set.
            // Also show Student Items if relevant?

            menuItems = adminItems.filter(item => accessiblePages.has(item.key));

            // Fallback: If no accessible pages matched but is student
            if (menuItems.length === 0) {
                menuItems = studentItems;
            }
        }
    }


    return (
        <Layout className="h-screen overflow-hidden">
            <Sider trigger={null} collapsible collapsed={collapsed} theme="light" className="shadow-md z-10">
                <div className="logo h-16 flex items-center justify-center font-bold text-xl text-indigo-600">
                    {collapsed ? 'CIMS' : 'CIMS PRO'}
                </div>
                <Menu
                    theme="light"
                    mode="inline"
                    defaultSelectedKeys={[location.pathname]}
                    items={menuItems}
                    onClick={({ key }) => navigate(key)}
                    className="border-none"
                    selectedKeys={[location.pathname]}
                />
            </Sider>
            <Layout>
                <Header style={{ padding: 0, background: token.colorBgContainer }} className="flex justify-between items-center px-4 shadow-sm z-10">
                    <Button
                        type="text"
                        icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
                        onClick={() => setCollapsed(!collapsed)}
                        style={{ fontSize: '16px', width: 64, height: 64 }}
                    />
                    <div className="flex items-center gap-4">
                        <span className='font-semibold'>{user?.username}</span>
                        <Dropdown menu={{ items: [{ key: '1', label: 'Logout', icon: <LogoutOutlined />, onClick: logout }] }}>
                            <Avatar src={user?.avatar ? `https://cdn.discordapp.com/avatars/${user.discordId}/${user.avatar}.png` : null} icon={<UserOutlined />} className="cursor-pointer" />
                        </Dropdown >
                    </div >
                </Header >
                <Content
                    style={{
                        margin: '24px 16px',
                        padding: 24,
                        minHeight: 280,
                        background: token.colorBgLayout,
                        overflowY: 'auto'
                    }}
                >
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={location.pathname}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.2 }}
                            className="h-full"
                        >
                            <Outlet />
                        </motion.div>
                    </AnimatePresence>
                </Content>
            </Layout >
        </Layout >
    );
};

export default DashboardLayout;
