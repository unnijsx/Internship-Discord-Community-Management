
import React, { useEffect, useState, useContext } from 'react';
import { Card, Row, Col, Statistic, List, Avatar, Typography } from 'antd';
import { UserOutlined, FileTextOutlined, CheckCircleOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { AuthContext } from '../../context/AuthContext';
import axiosInstance from '../../api/axiosInstance';

const { Title, Text } = Typography;

const StudentDashboard = () => {
    const { user } = useContext(AuthContext);
    const [stats, setStats] = useState({ attendance: 0, pendingTasks: 0, materials: 0 });
    const [recentActivity, setRecentActivity] = useState([]);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const token = localStorage.getItem('token');
                const res = await axiosInstance.get('/api/students/stats', {
                    headers: { Authorization: `Bearer ${token} ` }
                });
                setStats({
                    attendance: res.data.attendance || 0,
                    pendingTasks: res.data.pendingTasks || 0,
                    materials: res.data.materials || 0
                });
            } catch (err) {
                console.error("Failed to load stats", err);
            }
        };

        fetchStats();
        // Activity logic can remain mock or be fetched similarly
        setRecentActivity([
            { title: 'Marked Attendance', time: 'Today', icon: <CheckCircleOutlined className="text-green-500" /> },
            { title: 'Login Successful', time: 'Just now', icon: <CheckCircleOutlined className="text-blue-500" /> },
        ]);
    }, []);

    return (
        <div className="p-6">
            <div className="mb-8">
                <Title level={2}>Welcome back, {user?.username}!</Title>
                <Text type="secondary">Here is what's happening with your internship today.</Text>
            </div>

            <Row gutter={24}>
                <Col span={8}>
                    <Card variant="borderless" className="shadow-md">
                        <Statistic
                            title="Attendance"
                            value={stats.attendance}
                            suffix="%"
                            prefix={<ClockCircleOutlined />}
                            itemStyle={{ color: stats.attendance > 75 ? '#3f8600' : '#cf1322' }}
                        />
                    </Card>
                </Col>
                <Col span={8}>
                    <Card variant="borderless" className="shadow-md">
                        <Statistic
                            title="Pending Tasks"
                            value={stats.pendingTasks}
                            prefix={<FileTextOutlined />}
                        />
                    </Card>
                </Col>
                <Col span={8}>
                    <Card variant="borderless" className="shadow-md">
                        <Statistic
                            title="Study Materials"
                            value={stats.materials}
                            prefix={<UserOutlined />}
                        />
                    </Card>
                </Col>
            </Row>

            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                <Card title="Recent Activity" variant="borderless" className="shadow-md">
                    <List
                        itemLayout="horizontal"
                        dataSource={recentActivity}
                        renderItem={(item) => (
                            <List.Item>
                                <List.Item.Meta
                                    avatar={<Avatar icon={item.icon} style={{ backgroundColor: 'transparent' }} />}
                                    title={item.title}
                                    description={item.time}
                                />
                            </List.Item>
                        )}
                    />
                </Card>

                <Card title="Announcements" variant="borderless" className="shadow-md">
                    <div className="text-center text-gray-500 py-8">
                        No new announcements.
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default StudentDashboard;
