
import React, { useState, useEffect, useContext } from 'react';
import { Card, Avatar, Form, Input, Button, Tabs, Descriptions, Tag, message } from 'antd';
import { UserOutlined, EditOutlined, SaveOutlined } from '@ant-design/icons';
import { AuthContext } from '../../context/AuthContext';
import axios from 'axios';

const Profile = () => {
    const { user } = useContext(AuthContext);
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [editing, setEditing] = useState(false);
    const [form] = Form.useForm();

    const fetchProfile = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get('http://localhost:5000/api/students/profile', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setProfile(res.data);
            form.setFieldsValue(res.data);
        } catch (err) {
            console.error(err);
            // message.error('Failed to load profile');
        }
        setLoading(false);
    };

    useEffect(() => {
        if (user) fetchProfile();
    }, [user]);

    const handleUpdate = async (values) => {
        try {
            const token = localStorage.getItem('token');
            await axios.put('http://localhost:5000/api/students/profile', values, {
                headers: { Authorization: `Bearer ${token}` }
            });
            message.success('Profile updated successfully');
            setEditing(false);
            fetchProfile();
        } catch (err) {
            message.error('Update failed');
        }
    };

    return (
        <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* User Card */}
                <Card className="col-span-1 text-center shadow-md">
                    <Avatar
                        size={120}
                        src={user?.avatar ? `https://cdn.discordapp.com/avatars/${user.discordId}/${user.avatar}.png` : null}
                        icon={<UserOutlined />}
                        className="mb-4"
                    />
                    <h2 className="text-xl font-bold">{user?.username}</h2>
                    <Tag color="blue">{user?.roles?.map(r => r.name).join(', ') || 'Student'}</Tag>
                    <div className="mt-4 text-left">
                        <Descriptions column={1} size="small">
                            <Descriptions.Item label="Email">{user?.email}</Descriptions.Item>
                            <Descriptions.Item label="Joined">{new Date(user?.createdAt).toLocaleDateString()}</Descriptions.Item>
                        </Descriptions>
                    </div>
                </Card>

                {/* Details Tab */}
                <Card className="col-span-2 shadow-md">
                    <Tabs defaultActiveKey="1" items={[
                        {
                            key: '1',
                            label: 'Academic Details',
                            children: (
                                <div>
                                    <div className="flex justify-between mb-4">
                                        <h3 className="text-lg font-semibold">Student Information</h3>
                                        <Button
                                            icon={editing ? <SaveOutlined /> : <EditOutlined />}
                                            type={editing ? "primary" : "default"}
                                            onClick={() => editing ? form.submit() : setEditing(true)}
                                        >
                                            {editing ? 'Save' : 'Edit'}
                                        </Button>
                                    </div>

                                    <Form form={form} layout="vertical" disabled={!editing} onFinish={handleUpdate}>
                                        <div className="grid grid-cols-2 gap-4">
                                            <Form.Item name="fullName" label="Full Name">
                                                <Input />
                                            </Form.Item>
                                            <Form.Item name="phone" label="Phone Number">
                                                <Input />
                                            </Form.Item>
                                            <Form.Item name="institution" label="Institution/College">
                                                <Input />
                                            </Form.Item>
                                            <Form.Item name="course" label="Course/Degree">
                                                <Input />
                                            </Form.Item>
                                            <Form.Item name="year" label="Year of Study">
                                                <Input />
                                            </Form.Item>
                                            <Form.Item name="address" label="Address" className="col-span-2">
                                                <Input.TextArea rows={2} />
                                            </Form.Item>
                                        </div>
                                    </Form>

                                    {!profile && !loading && (
                                        <div className="mt-4 p-4 bg-yellow-50 text-yellow-700 rounded-md">
                                            Please complete your profile details.
                                        </div>
                                    )}
                                </div>
                            )
                        },
                        {
                            key: '2',
                            label: 'Course Progress',
                            children: <div>Progress tracking coming soon...</div>
                        }
                    ]} />
                </Card>
            </div>
        </div>
    );
};

export default Profile;
