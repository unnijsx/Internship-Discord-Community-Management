
import React, { useState, useEffect } from 'react';
import { Card, Form, Input, Button, List, Typography, Tag, message, Select, Switch } from 'antd';
import { SoundOutlined, RobotOutlined } from '@ant-design/icons';
import axios from 'axios';
import axiosInstance from '../../api/axiosInstance';

const { Title, Text } = Typography;
const { TextArea } = Input;

const Broadcasts = () => {
    const [broadcasts, setBroadcasts] = useState([]);
    const [roles, setRoles] = useState([]);
    const [channels, setChannels] = useState([]); // [NEW]
    const [showChannelSelect, setShowChannelSelect] = useState(false); // [NEW]
    const [loading, setLoading] = useState(false);
    const [form] = Form.useForm();

    const fetchBroadcasts = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axiosInstance.get('/api/communication/broadcasts', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setBroadcasts(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const fetchRoles = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get('http://localhost:5000/api/roles', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setRoles(res.data);
        } catch (err) { console.error(err); }
    };

    const fetchChannels = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axiosInstance.get('/api/communication/channels', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setChannels(res.data);
        } catch (err) { console.error(err); }
    };

    useEffect(() => {
        fetchBroadcasts();
        fetchRoles();
        fetchChannels();
    }, []);

    const handleSend = async (values) => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            await axios.post('http://localhost:5000/api/communication/broadcasts', values, {
                headers: { Authorization: `Bearer ${token}` }
            });
            message.success('Broadcast sent successfully!');
            form.resetFields();
            fetchBroadcasts();
        } catch (err) {
            message.error('Failed to send broadcast');
        }
        setLoading(false);
    };

    return (
        <div className="p-6">
            <Title level={2}><SoundOutlined /> Broadcast Center</Title>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card title="New Announcement" className="md:col-span-1 shadow-md">
                    <Form form={form} layout="vertical" onFinish={handleSend}>
                        <Form.Item name="title" label="Title" rules={[{ required: true }]}>
                            <Input placeholder="Important Update..." />
                        </Form.Item>
                        <Form.Item name="message" label="Message" rules={[{ required: true }]}>
                            <TextArea rows={4} placeholder="Enter your message here..." />
                        </Form.Item>
                        <Form.Item name="targetRoles" label="Target Audience">
                            <Select mode="multiple" placeholder="Select roles (optional)">
                                <Select.Option value="All">All Users</Select.Option>
                                {roles.map(r => (
                                    <Select.Option key={r._id} value={r._id}>{r.name}</Select.Option>
                                ))}
                            </Select>
                        </Form.Item>
                        <Form.Item name="sendToDiscord" valuePropName="checked" label="Discord Integration">
                            <Switch checkedChildren={<RobotOutlined />} unCheckedChildren="Off" onChange={(checked) => setShowChannelSelect(checked)} />
                        </Form.Item>

                        {showChannelSelect && (
                            <Form.Item name="targetChannelId" label="Select Discord Channel">
                                <Select placeholder="Select a channel (Optional)">
                                    {channels.map(c => (
                                        <Select.Option key={c.id} value={c.id}>#{c.name}</Select.Option>
                                    ))}
                                </Select>
                            </Form.Item>
                        )}
                        <Button type="primary" htmlType="submit" loading={loading} block icon={<SoundOutlined />}>
                            Broadcast Now
                        </Button>
                    </Form>
                </Card>

                <Card title="Recent Announcements" className="md:col-span-2 shadow-md">
                    <List
                        itemLayout="vertical"
                        dataSource={broadcasts}
                        renderItem={item => (
                            <List.Item>
                                <List.Item.Meta
                                    title={
                                        <div className="flex justify-between">
                                            <span>{item.title}</span>
                                            <Text type="secondary" className="text-xs">{new Date(item.createdAt).toLocaleString()}</Text>
                                        </div>
                                    }
                                    description={<Text type="secondary">By {item.author?.username}</Text>}
                                />
                                <p>{item.message}</p>
                                <div className="mt-2">
                                    {item.sentToDiscord && <Tag color="#5865F2" icon={<RobotOutlined />}>Sent to Discord</Tag>}
                                    {item.targetRoles?.map(r => <Tag key={r}>{r}</Tag>)}
                                </div>
                            </List.Item>
                        )}
                    />
                </Card>
            </div>
        </div>
    );
};

export default Broadcasts;
