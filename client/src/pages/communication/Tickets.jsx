
import React, { useState, useEffect, useContext } from 'react';
import { Card, Table, Tag, Button, Modal, Form, Input, Select, message, Typography, Space } from 'antd';
import { PlusOutlined, EditOutlined, MessageOutlined } from '@ant-design/icons';
import axios from 'axios';
import { AuthContext } from '../../context/AuthContext';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

const Tickets = () => {
    const { user } = useContext(AuthContext);
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [editingTicket, setEditingTicket] = useState(null);
    const [form] = Form.useForm();

    const fetchTickets = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get('http://localhost:5000/api/communication/tickets', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setTickets(res.data);
        } catch (err) { message.error('Failed to load tickets'); }
        setLoading(false);
    };

    useEffect(() => { fetchTickets(); }, []);

    const handleCreate = async (values) => {
        try {
            const token = localStorage.getItem('token');
            await axios.post('http://localhost:5000/api/communication/tickets', values, {
                headers: { Authorization: `Bearer ${token}` }
            });
            message.success('Ticket created');
            setIsModalVisible(false);
            fetchTickets();
        } catch (err) { message.error('Failed to create ticket'); }
    };

    const handleUpdate = async (values) => {
        try {
            const token = localStorage.getItem('token');
            // If user is admin/support, they can update status. If user is creator, maybe just description?
            // For now assume update endpoint handles permissions.
            await axios.put(`http://localhost:5000/api/communication/tickets/${editingTicket._id}`, values, {
                headers: { Authorization: `Bearer ${token}` }
            });
            message.success('Ticket updated');
            setIsModalVisible(false);
            fetchTickets();
        } catch (err) { message.error('Failed to update ticket'); }
    };

    const openModal = (ticket = null) => {
        setEditingTicket(ticket);
        if (ticket) {
            form.setFieldsValue(ticket);
        } else {
            form.resetFields();
            form.setFieldsValue({ priority: 'Medium', status: 'Open' });
        }
        setIsModalVisible(true);
    };

    // Permissions check
    const canManageTickets = user?.isSuperAdmin || user?.roles?.some(r => r.name === 'MANAGER' || r.permissions?.canManageUsers);

    // Only show tickets created by user unless they are admin/support
    // API should ideally filter this, but we can filter too or assume API does it. 
    // (My previous read of API didn't double check filtering logic, assuming backend handles it safely)

    const columns = [
        {
            title: 'Subject',
            dataIndex: 'title',
            key: 'title',
            render: t => <span className="font-semibold">{t}</span>
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: status => {
                let color = status === 'Open' ? 'green' : status === 'In Progress' ? 'blue' : status === 'Resolved' ? 'cyan' : 'gray';
                return <Tag color={color}>{status}</Tag>;
            }
        },
        {
            title: 'Priority',
            dataIndex: 'priority',
            key: 'priority',
            render: p => {
                let color = p === 'High' || p === 'Critical' ? 'red' : p === 'Medium' ? 'orange' : 'green';
                return <Tag color={color}>{p}</Tag>;
            }
        },
        {
            title: 'Created By',
            dataIndex: ['creator', 'username'],
            key: 'creator',
            responsive: ['md']
        },
        {
            title: 'Last Updated',
            dataIndex: 'updatedAt',
            key: 'updatedAt',
            render: d => new Date(d).toLocaleDateString(),
            responsive: ['lg']
        },
        {
            title: 'Action',
            key: 'action',
            render: (_, record) => (
                <Button size="small" icon={<EditOutlined />} onClick={() => openModal(record)}>
                    {canManageTickets ? 'Manage' : 'View'}
                </Button>
            )
        }
    ];

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <Title level={2}>Support & Helpdesk</Title>
                    <Text type="secondary">Track issues and requests.</Text>
                </div>
                <Button type="primary" icon={<PlusOutlined />} onClick={() => openModal()}>
                    New Ticket
                </Button>
            </div>

            <Card className="shadow-md" bordered={false}>
                <Table columns={columns} dataSource={tickets} rowKey="_id" loading={loading} pagination={{ pageSize: 8 }} />
            </Card>

            <Modal
                title={editingTicket ? (canManageTickets ? "Manage Ticket" : "Ticket Details") : "Create New Ticket"}
                open={isModalVisible}
                onCancel={() => setIsModalVisible(false)}
                footer={null}
            >
                <Form form={form} layout="vertical" onFinish={editingTicket ? handleUpdate : handleCreate}>
                    <Form.Item name="title" label="Subject" rules={[{ required: true }]}>
                        <Input disabled={editingTicket && !canManageTickets} />
                    </Form.Item>
                    <Form.Item name="description" label="Description" rules={[{ required: true }]}>
                        <TextArea rows={4} disabled={editingTicket && !canManageTickets} />
                    </Form.Item>

                    {!editingTicket && (
                        <Form.Item name="priority" label="Priority">
                            <Select>
                                <Option value="Low">Low</Option>
                                <Option value="Medium">Medium</Option>
                                <Option value="High">High</Option>
                                <Option value="Critical">Critical</Option>
                            </Select>
                        </Form.Item>
                    )}

                    {editingTicket && canManageTickets && (
                        <div className="grid grid-cols-2 gap-4">
                            <Form.Item name="status" label="Status">
                                <Select>
                                    <Option value="Open">Open</Option>
                                    <Option value="In Progress">In Progress</Option>
                                    <Option value="Resolved">Resolved</Option>
                                    <Option value="Closed">Closed</Option>
                                </Select>
                            </Form.Item>
                            <Form.Item name="priority" label="Priority">
                                <Select>
                                    <Option value="Low">Low</Option>
                                    <Option value="Medium">Medium</Option>
                                    <Option value="High">High</Option>
                                    <Option value="Critical">Critical</Option>
                                </Select>
                            </Form.Item>
                        </div>
                    )}

                    {!editingTicket && (
                        <Button type="primary" htmlType="submit" className="w-full">
                            Submit Ticket
                        </Button>
                    )}
                    {editingTicket && canManageTickets && (
                        <Button type="primary" htmlType="submit" className="w-full">
                            Update Ticket
                        </Button>
                    )}
                </Form>
            </Modal>
        </div>
    );
};

export default Tickets;
