
import React, { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Button, Card, Typography, Space, Input, Form, App, Modal } from 'antd';
import { DiscordOutlined, LockOutlined, UserOutlined } from '@ant-design/icons';
import { motion } from 'framer-motion';
import axiosInstance from '../api/axiosInstance';
import { useNavigate } from 'react-router-dom';

const { Title, Text } = Typography;

const Login = () => {
    const { message } = App.useApp();
    const { login: discordLogin, user, loading } = useContext(AuthContext);
    const [isDevMode, setIsDevMode] = useState(false);
    const [loadingAuth, setLoadingAuth] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        if (user) {
            navigate('/');
        }
    }, [user, navigate]);


    const handleCredLogin = async (values) => {
        setLoadingAuth(true);
        try {
            const res = await axiosInstance.post('/api/auth/login', values);
            localStorage.setItem('token', res.data.token);
            window.location.href = '/'; // Refresh to load context
        } catch (err) {
            message.error(err.response?.data?.message || 'Login Failed');
        }
        setLoadingAuth(false);
    };

    return (
        <div className="h-screen flex items-center justify-center bg-gray-900 overflow-hidden relative">
            {/* Animated Background Blobs */}
            <motion.div
                animate={{ x: [0, 100, 0], y: [0, -100, 0] }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="absolute top-0 left-0 w-96 h-96 bg-purple-600 rounded-full mix-blend-multiply filter blur-3xl opacity-30"
            />
            <motion.div
                animate={{ x: [0, -100, 0], y: [0, 100, 0] }}
                transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                className="absolute bottom-0 right-0 w-96 h-96 bg-blue-600 rounded-full mix-blend-multiply filter blur-3xl opacity-30"
            />

            <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="z-10"
            >
                <Card className="w-96 text-center shadow-2xl glass-effect border-none" style={{ background: 'rgba(255, 255, 255, 0.05)', backdropFilter: 'blur(10px)' }}>
                    <Title level={2} style={{ color: '#fff' }}>Welcome Back</Title>
                    <Text type="secondary" className="text-gray-300 block mb-6">Corporate Internship Management System</Text>

                    {!isDevMode ? (
                        <>
                            <Button
                                type="primary"
                                size="large"
                                icon={<DiscordOutlined />}
                                onClick={discordLogin}
                                className="w-full bg-[#5865F2] hover:bg-[#4752C4] border-none h-12 text-lg font-semibold mb-4"
                            >
                                Login with Discord
                            </Button>
                            <Button type="link" onClick={() => setIsDevMode(true)} className="text-gray-400">
                                Super Admin Login
                            </Button>
                        </>
                    ) : (
                        <Form onFinish={handleCredLogin} layout="vertical">
                            <Form.Item name="email" rules={[{ required: true, message: 'Please input your Email!' }]}>
                                <Input prefix={<UserOutlined />} placeholder="Admin Email" size="large" />
                            </Form.Item>
                            <Form.Item name="password" rules={[{ required: true, message: 'Please input your Password!' }]}>
                                <Input.Password prefix={<LockOutlined />} placeholder="Password" size="large" />
                            </Form.Item>
                            <Button type="primary" htmlType="submit" loading={loadingAuth} className="w-full h-12 text-lg font-semibold mb-2">
                                Login
                            </Button>
                            <Button type="link" onClick={() => setIsDevMode(false)} className="text-gray-400">
                                Back to Discord Login
                            </Button>
                        </Form>
                    )}
                </Card>
            </motion.div>
        </div>
    );
};

export default Login;
