
import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, Checkbox, Space, Popconfirm, Tag, message, Typography, ColorPicker, Row, Col, Tabs } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import axios from 'axios';

const { Title } = Typography;
const { TabPane } = Tabs;

const Roles = () => {
    const [roles, setRoles] = useState([]);
    const [permissionsList, setPermissionsList] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [editingRole, setEditingRole] = useState(null);
    const [form] = Form.useForm();

    const AVAILABLE_PAGES = [
        { label: 'Admin Dashboard', value: '/' },
        { label: 'User Management', value: '/users' },
        { label: 'Role Management', value: '/roles' },
        { label: 'Permissions', value: '/permissions' },
        { label: 'Attendance', value: '/attendance' },
        { label: 'Materials', value: '/materials' },
        { label: 'Sales/Fees', value: '/sales' },
        { label: 'Tasks', value: '/tasks' },
        { label: 'Leaves', value: '/leaves' },
        { label: 'Broadcasts', value: '/broadcasts' },
        { label: 'Support Tickets', value: '/tickets' },
        { label: 'Feedback', value: '/feedback' },
        { label: 'Targets', value: '/targets' },
        { label: 'Schedules', value: '/schedules' },
        { label: 'Student Profile', value: '/student' },
    ];

    const fetchRoles = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const [rolesRes, permsRes] = await Promise.all([
                axios.get('http://localhost:5000/api/roles', { headers: { Authorization: `Bearer ${token}` } }),
                axios.get('http://localhost:5000/api/permissions', { headers: { Authorization: `Bearer ${token}` } })
            ]);
            setRoles(rolesRes.data);
            setPermissionsList(permsRes.data);
        } catch (error) {
            message.error('Failed to fetch roles');
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchRoles();
    }, []);

    const handleAdd = () => {
        setEditingRole(null);
        form.resetFields();
        form.setFieldsValue({ color: '#1677ff' });
        setIsModalVisible(true);
    };

    const handleEdit = (role) => {
        setEditingRole(role);
        form.setFieldsValue({
            name: role.name,
            permissions: role.permissions,
            accessiblePages: role.accessiblePages || [],
            color: role.color
        });
        setIsModalVisible(true);
    };

    const handleDelete = async (id) => {
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`http://localhost:5000/api/roles/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            message.success('Role deleted');
            fetchRoles();
        } catch (error) {
            message.error('Failed to delete role');
        }
    };

    const handleSave = async (values) => {
        const color = typeof values.color === 'string' ? values.color : values.color.toHexString();

        const payload = {
            ...values,
            color
        };

        try {
            const token = localStorage.getItem('token');
            if (editingRole) {
                await axios.put(`http://localhost:5000/api/roles/${editingRole._id}`, payload, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                message.success('Role updated');
            } else {
                await axios.post('http://localhost:5000/api/roles', payload, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                message.success('Role created');
            }
            setIsModalVisible(false);
            fetchRoles();
        } catch (error) {
            message.error('Failed to save role');
        }
    };

    const columns = [
        {
            title: 'Role Name',
            dataIndex: 'name',
            key: 'name',
            render: (text, record) => <Tag color={record.color}>{text}</Tag>
        },
        {
            title: 'Permissions',
            dataIndex: 'permissions',
            key: 'permissions',
            render: (perms) => (
                <div className="flex flex-wrap gap-1">
                    {Object.entries(perms || {}).filter(([k, v]) => v).map(([key]) => (
                        <Tag key={key}>{key}</Tag>
                    ))}
                </div>
            )
        },
        {
            title: 'Accessible Pages',
            dataIndex: 'accessiblePages',
            key: 'accessiblePages',
            render: (pages) => (
                <div className="flex flex-wrap gap-1">
                    {(pages || []).map(p => (
                        <Tag color="cyan" key={p}>{AVAILABLE_PAGES.find(ap => ap.value === p)?.label || p}</Tag>
                    ))}
                </div>
            )
        },
        {
            title: 'Actions',
            key: 'actions',
            render: (_, record) => (
                <Space>
                    <Button icon={<EditOutlined />} onClick={() => handleEdit(record)} />
                    <Popconfirm title="Delete role?" onConfirm={() => handleDelete(record._id)}>
                        <Button icon={<DeleteOutlined />} danger />
                    </Popconfirm>
                </Space>
            )
        }
    ];

    return (
        <div className="p-6">
            <div className="flex justify-between mb-4">
                <Title level={2}>Role Management</Title>
                <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>Add Role</Button>
            </div>

            <Table columns={columns} dataSource={roles} rowKey="_id" loading={loading} />

            <Modal
                title={editingRole ? "Edit Role" : "Create Role"}
                open={isModalVisible}
                onCancel={() => setIsModalVisible(false)}
                footer={null}
                width={700}
            >
                <Form form={form} layout="vertical" onFinish={handleSave}>
                    <Form.Item name="name" label="Role Name" rules={[{ required: true }]}>
                        <Input />
                    </Form.Item>

                    <Form.Item name="color" label="Role Color">
                        <ColorPicker showText />
                    </Form.Item>

                    <Tabs defaultActiveKey="1">
                        <TabPane tab="Permissions (Actions)" key="1">
                            <div className="grid grid-cols-2 gap-4">
                                {permissionsList.map(perm => (
                                    <Form.Item
                                        key={perm.key}
                                        name={['permissions', perm.key]}
                                        valuePropName="checked"
                                        noStyle
                                    >
                                        <Checkbox className="mb-2 block">
                                            {perm.name} <span className="text-xs text-gray-500">({perm.description})</span>
                                        </Checkbox>
                                    </Form.Item>
                                ))}
                            </div>
                        </TabPane>
                        <TabPane tab="Page Access (Menus)" key="2">
                            <Form.Item name="accessiblePages">
                                <Checkbox.Group className="grid grid-cols-2 gap-2">
                                    {AVAILABLE_PAGES.map(page => (
                                        <Checkbox key={page.value} value={page.value}>
                                            {page.label}
                                        </Checkbox>
                                    ))}
                                </Checkbox.Group>
                            </Form.Item>
                        </TabPane>
                    </Tabs>

                    <Button type="primary" htmlType="submit" className="w-full mt-4">
                        Save Role
                    </Button>
                </Form>
            </Modal>
        </div>
    );
};

export default Roles;
