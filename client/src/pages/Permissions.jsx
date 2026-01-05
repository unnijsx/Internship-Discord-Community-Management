
import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, message, Space, Popconfirm } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import axios from 'axios';
import axiosInstance from '../api/axiosInstance';

const Permissions = () => {
    const [permissions, setPermissions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [form] = Form.useForm();

    const fetchPermissions = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await axiosInstance.get('/api/permissions', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setPermissions(res.data);
        } catch (err) {
            message.error('Failed to fetch permissions');
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchPermissions();
    }, []);

    const handleSave = async (values) => {
        try {
            const token = localStorage.getItem('token');
            await axiosInstance.post('/api/permissions', values, {
                headers: { Authorization: `Bearer ${token}` }
            });
            message.success('Permission created');
            fetchPermissions();
            setModalVisible(false);
            form.resetFields();
        } catch (err) {
            message.error(err.response?.data?.message || 'Operation failed');
        }
    };

    const handleDelete = async (id) => {
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`http://localhost:5000/api/permissions/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            message.success('Permission deleted');
            fetchPermissions();
        } catch (err) {
            message.error('Delete failed');
        }
    };

    const columns = [
        { title: 'Name', dataIndex: 'name', key: 'name' },
        { title: 'Slug', dataIndex: 'slug', key: 'slug', render: text => <code className="bg-gray-100 px-1 rounded">{text}</code> },
        { title: 'Description', dataIndex: 'description', key: 'description' },
        {
            title: 'Actions',
            key: 'actions',
            render: (_, record) => (
                <Popconfirm title="Delete permission?" onConfirm={() => handleDelete(record._id)}>
                    <Button danger icon={<DeleteOutlined />} size="small" />
                </Popconfirm>
            )
        }
    ];

    return (
        <div>
            <div className="flex justify-between items-center mb-4">
                <h1 className="text-2xl font-bold">System Permissions</h1>
                <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalVisible(true)}>Add Permission</Button>
            </div>

            <Table columns={columns} dataSource={permissions} rowKey="_id" loading={loading} pagination={false} />

            <Modal
                title="Create Permission"
                open={modalVisible}
                onCancel={() => setModalVisible(false)}
                footer={null}
            >
                <Form form={form} layout="vertical" onFinish={handleSave}>
                    <Form.Item name="name" label="Permission Name" rules={[{ required: true }]}>
                        <Input placeholder="e.g. Manage Attendance" />
                    </Form.Item>
                    <Form.Item name="slug" label="Slug (Unique Key)" rules={[{ required: true }]}>
                        <Input placeholder="e.g. canManageAttendance" />
                    </Form.Item>
                    <Form.Item name="description" label="Description">
                        <Input.TextArea />
                    </Form.Item>
                    <Button type="primary" htmlType="submit" className="w-full">
                        Create
                    </Button>
                </Form>
            </Modal>
        </div>
    );
};

export default Permissions;
