
import React, { useState, useEffect, useContext } from 'react';
import { Card, Table, Button, Form, Input, DatePicker, Select, Tag, message, Modal } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import dayjs from 'dayjs';

const { Option } = Select;
const { TextArea } = Input;

const Leaves = () => {
    const { user } = useContext(AuthContext);
    const [leaves, setLeaves] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [form] = Form.useForm();

    const fetchLeaves = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get('http://localhost:5000/api/leaves', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setLeaves(res.data);
        } catch (err) {
            message.error('Failed to load leaves');
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchLeaves();
    }, []);

    const handleApply = async (values) => {
        try {
            const token = localStorage.getItem('token');
            await axios.post('http://localhost:5000/api/leaves', {
                ...values,
                startDate: values.dates[0].toDate(),
                endDate: values.dates[1].toDate()
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            message.success('Leave applied successfully');
            setIsModalVisible(false);
            form.resetFields();
            fetchLeaves();
        } catch (err) {
            message.error('Failed to apply for leave');
        }
    };

    const handleStatusUpdate = async (id, status) => {
        try {
            const token = localStorage.getItem('token');
            await axios.put(`http://localhost:5000/api/leaves/${id}`, { status }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            message.success(`Leave ${status}`);
            fetchLeaves();
        } catch (err) {
            message.error('Failed to update status');
        }
    };

    const columns = [
        {
            title: 'Student',
            dataIndex: ['student', 'username'],
            key: 'student',
            hidden: !user?.isSuperAdmin && !user?.roles?.some(r => r.permissions?.canManageUsers || r.name.includes('LEAD') || r.name === 'MANAGER')
        },
        { title: 'Type', dataIndex: 'type', key: 'type', render: t => <Tag color="blue">{t}</Tag> },
        {
            title: 'Dates',
            key: 'dates',
            render: (_, r) => `${new Date(r.startDate).toLocaleDateString()} - ${new Date(r.endDate).toLocaleDateString()}`
        },
        { title: 'Reason', dataIndex: 'reason', key: 'reason' },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: s => <Tag color={s === 'Approved' ? 'green' : s === 'Rejected' ? 'red' : 'orange'}>{s}</Tag>
        },
        {
            title: 'Action',
            key: 'action',
            render: (_, record) => {
                const isApprover = user?.isSuperAdmin || user?.roles?.some(r => r.permissions?.canManageUsers || r.name.includes('LEAD') || r.name === 'MANAGER');
                if (isApprover && record.status === 'Pending') {
                    return (
                        <div className="flex gap-2">
                            <Button size="small" type="primary" onClick={() => handleStatusUpdate(record._id, 'Approved')}>Approve</Button>
                            <Button size="small" danger onClick={() => handleStatusUpdate(record._id, 'Rejected')}>Reject</Button>
                        </div>
                    )
                }
                return null;
            }
        }
    ].filter(c => !c.hidden);

    return (
        <div className="p-6">
            <div className="flex justify-between mb-4">
                <h2 className="text-2xl font-bold">Leave Management</h2>
                <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsModalVisible(true)}>
                    Apply Leave
                </Button>
            </div>

            <Table columns={columns} dataSource={leaves} rowKey="_id" loading={loading} />

            <Modal
                title="Apply for Leave"
                open={isModalVisible}
                onCancel={() => setIsModalVisible(false)}
                footer={null}
            >
                <Form form={form} layout="vertical" onFinish={handleApply}>
                    <Form.Item name="type" label="Leave Type" rules={[{ required: true }]}>
                        <Select>
                            <Option value="Sick">Sick Leave</Option>
                            <Option value="Casual">Casual Leave</Option>
                            <Option value="Emergency">Emergency</Option>
                            <Option value="Other">Other</Option>
                        </Select>
                    </Form.Item>
                    <Form.Item name="dates" label="Duration" rules={[{ required: true }]}>
                        <DatePicker.RangePicker className="w-full" />
                    </Form.Item>
                    <Form.Item name="reason" label="Reason" rules={[{ required: true }]}>
                        <TextArea rows={3} />
                    </Form.Item>
                    <Button type="primary" htmlType="submit" className="w-full">Submit Application</Button>
                </Form>
            </Modal>
        </div>
    );
};

export default Leaves;
