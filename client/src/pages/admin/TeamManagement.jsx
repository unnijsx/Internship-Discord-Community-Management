import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, Select, message, Tree, Card } from 'antd';
import { PlusOutlined, TeamOutlined } from '@ant-design/icons';
import axiosInstance from '../../api/axiosInstance';

const TeamManagement = () => {
    const [teams, setTeams] = useState([]);
    const [users, setUsers] = useState([]); // Potential leads
    const [loading, setLoading] = useState(false);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [form] = Form.useForm();

    const fetchTeams = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await axiosInstance.get('/api/teams', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setTeams(res.data);
        } catch (err) {
            message.error('Failed to load teams');
        }
        setLoading(false);
    };

    const fetchUsers = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axiosInstance.get('/api/users', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setUsers(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        fetchTeams();
        fetchUsers();
    }, []);

    const handleCreate = async (values) => {
        try {
            const token = localStorage.getItem('token');
            await axiosInstance.post('/api/teams', values, {
                headers: { Authorization: `Bearer ${token}` }
            });
            message.success('Team created');
            setIsModalVisible(false);
            form.resetFields();
            fetchTeams();
        } catch (err) {
            message.error(err.response?.data?.message || 'Creation failed');
        }
    };

    const columns = [
        { title: 'Team Name', dataIndex: 'name', key: 'name' },
        { title: 'Parent Team', dataIndex: ['parentTeam', 'name'], key: 'parent', render: t => t || '-' },
        { title: 'Lead', dataIndex: ['lead', 'username'], key: 'lead', render: t => t || '-' },
        { title: 'Description', dataIndex: 'description', key: 'desc' },
    ];

    return (
        <div className="p-4">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold"><TeamOutlined /> Team Hierarchy</h2>
                <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsModalVisible(true)}>
                    Create Team
                </Button>
            </div>

            <Table
                dataSource={teams}
                columns={columns}
                rowKey="_id"
                loading={loading}
                pagination={false}
            />

            <Modal
                title="Create New Team"
                open={isModalVisible}
                onCancel={() => setIsModalVisible(false)}
                onOk={() => form.submit()}
            >
                <Form form={form} layout="vertical" onFinish={handleCreate}>
                    <Form.Item name="name" label="Team Name" rules={[{ required: true }]}>
                        <Input placeholder="e.g. Training, Sales" />
                    </Form.Item>
                    <Form.Item name="description" label="Description">
                        <Input.TextArea rows={2} />
                    </Form.Item>
                    <Form.Item name="parentTeamId" label="Parent Team (Optional)">
                        <Select allowClear placeholder="Select Parent Team">
                            {teams.map(t => (
                                <Select.Option key={t._id} value={t._id}>{t.name}</Select.Option>
                            ))}
                        </Select>
                    </Form.Item>
                    <Form.Item name="leadId" label="Team Lead (Optional)">
                        <Select allowClear showSearch optionFilterProp="children" placeholder="Select Lead">
                            {users.map(u => (
                                <Select.Option key={u._id} value={u._id}>{u.username}</Select.Option>
                            ))}
                        </Select>
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

export default TeamManagement;
