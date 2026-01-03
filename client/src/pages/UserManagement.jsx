
import React, { useState, useEffect, useContext } from 'react';
import { Table, Tag, Select, message, Button, Typography, Switch } from 'antd';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';

const { Title } = Typography;
const { Option } = Select;

const UserManagement = () => {
    const { user: currentUser } = useContext(AuthContext);
    const [users, setUsers] = useState([]);
    const [roles, setRoles] = useState([]);
    const [loading, setLoading] = useState(false);

    const fetchData = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const [usersRes, rolesRes] = await Promise.all([
                axios.get('http://localhost:5000/api/users', { headers: { Authorization: `Bearer ${token}` } }),
                axios.get('http://localhost:5000/api/roles', { headers: { Authorization: `Bearer ${token}` } })
            ]);
            setUsers(usersRes.data);
            setRoles(rolesRes.data);
        } catch (err) {
            message.error('Failed to load data');
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleRoleChange = async (userId, newRoles) => {
        try {
            const token = localStorage.getItem('token');
            await axios.put(`http://localhost:5000/api/users/${userId}/roles`, { roles: newRoles }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            message.success('Roles updated');
            fetchData();
        } catch (err) {
            message.error('Update failed');
        }
    };

    const handleSuperAdminToggle = async (userId, checked) => {
        try {
            const token = localStorage.getItem('token');
            await axios.put(`http://localhost:5000/api/users/${userId}/superadmin`, { isSuperAdmin: checked }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            message.success('User updated');
            fetchData();
        } catch (err) {
            message.error('Operation failed');
        }
    };

    const columns = [
        {
            title: 'User',
            dataIndex: 'username',
            key: 'username',
            render: (text, record) => (
                <div>
                    <div className="font-bold">{text}</div>
                    <div className="text-xs text-gray-500">{record.email}</div>
                </div>
            )
        },
        {
            title: 'Discord ID',
            dataIndex: 'discordId',
            key: 'discordId',
            responsive: ['md']
        },
        {
            title: 'Roles',
            dataIndex: 'roles',
            key: 'roles',
            render: (userRoles, record) => (
                <Select
                    mode="multiple"
                    style={{ width: '100%', minWidth: 200 }}
                    placeholder="Assign roles"
                    value={userRoles.map(r => r._id)}
                    onChange={(values) => handleRoleChange(record._id, values)}
                    disabled={!currentUser?.isSuperAdmin && !currentUser?.roles?.some(r => r.permissions?.canManageUsers)}
                >
                    {roles.map(role => (
                        <Option key={role._id} value={role._id}>
                            <Tag color={role.color || 'blue'}>{role.name}</Tag>
                        </Option>
                    ))}
                </Select>
            )
        },
        {
            title: 'Super Admin',
            dataIndex: 'isSuperAdmin',
            key: 'isSuperAdmin',
            render: (checked, record) => (
                <Switch
                    checked={checked}
                    onChange={(val) => handleSuperAdminToggle(record._id, val)}
                    disabled={!currentUser?.isSuperAdmin || record._id === currentUser?._id} // Prevent removing self
                />
            )
        }
    ];

    return (
        <div className="p-6">
            <Title level={2}>User Management</Title>
            <Table
                columns={columns}
                dataSource={users}
                rowKey="_id"
                loading={loading}
                pagination={{ pageSize: 10 }}
            />
        </div>
    );
};

export default UserManagement;
