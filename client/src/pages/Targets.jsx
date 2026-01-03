
import React, { useState, useEffect, useContext } from 'react';
import { Card, Table, Button, Tabs, Modal, Form, Input, InputNumber, Select, Tag, message, Progress, Space, Divider } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';

const { Option } = Select;

const Targets = () => {
    const { user } = useContext(AuthContext);
    const [myTargets, setMyTargets] = useState([]);
    const [assignedTargets, setAssignedTargets] = useState([]);
    const [loading, setLoading] = useState(false);

    // Assign Modal State
    const [isAssignModalVisible, setIsAssignModalVisible] = useState(false);
    const [students, setStudents] = useState([]); // Or users who can be assigned targets
    const [metrics, setMetrics] = useState([{ name: '', targetValue: 0, unit: 'count' }]);
    const [form] = Form.useForm();

    const isLeadOrAdmin = user?.isSuperAdmin || user?.roles?.some(r => r.name.includes('LEAD') || r.name === 'MANAGER' || r.permissions?.canManageUsers);

    const fetchData = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            // 1. My Targets
            const resMy = await axios.get('http://localhost:5000/api/targets/my', { headers: { Authorization: `Bearer ${token}` } });
            setMyTargets(resMy.data);

            // 2. Assigned Targets (if lead)
            if (isLeadOrAdmin) {
                const resAssigned = await axios.get('http://localhost:5000/api/targets/assigned', { headers: { Authorization: `Bearer ${token}` } });
                setAssignedTargets(resAssigned.data);

                // Also fetch potential assignees (e.g. all users for now, or filter by team in real prod)
                const resUsers = await axios.get('http://localhost:5000/api/users', { headers: { Authorization: `Bearer ${token}` } });
                setStudents(resUsers.data);
            }
        } catch (err) {
            message.error('Failed to load targets');
        }
        setLoading(false);
    };

    useEffect(() => {
        if (user) fetchData();
    }, [user]);

    // Handle updates to "My Progress"
    const handleProgressUpdate = async (targetId, metricId, newValue) => {
        try {
            const token = localStorage.getItem('token');
            await axios.put(`http://localhost:5000/api/targets/${targetId}/progress`,
                { metrics: [{ _id: metricId, currentValue: newValue }] },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            message.success('Progress updated');
            fetchData(); // Refresh to check status updates
        } catch (err) {
            message.error('Failed to update progress');
        }
    };

    // Handle Assigning New Target
    const handleAssign = async (values) => {
        try {
            const token = localStorage.getItem('token');
            // Combine dynamic metrics
            const payload = {
                ...values,
                metrics: metrics.filter(m => m.name && m.targetValue)
            };

            await axios.post('http://localhost:5000/api/targets', payload, {
                headers: { Authorization: `Bearer ${token}` }
            });
            message.success('Target assigned successfully');
            setIsAssignModalVisible(false);
            form.resetFields();
            setMetrics([{ name: '', targetValue: 0, unit: 'count' }]);
            fetchData();
        } catch (err) {
            message.error('Failed to assign target');
        }
    };

    // Dynamic Form Handlers
    const addMetricField = () => {
        setMetrics([...metrics, { name: '', targetValue: 0, unit: 'count' }]);
    };

    const updateMetricField = (index, field, value) => {
        const newMetrics = [...metrics];
        newMetrics[index][field] = value;
        setMetrics(newMetrics);
    };

    const removeMetricField = (index) => {
        const newMetrics = [...metrics];
        newMetrics.splice(index, 1);
        setMetrics(newMetrics);
    };


    const myColumns = [
        { title: 'Title', dataIndex: 'title', key: 'title' },
        { title: 'Type', dataIndex: 'type', key: 'type', render: t => <Tag color="blue">{t}</Tag> },
        {
            title: 'Progress',
            key: 'metrics',
            render: (_, record) => (
                <div className="flex flex-col gap-2">
                    {record.metrics.map(m => (
                        <div key={m._id} className="flex items-center gap-2">
                            <span className="w-24 text-xs font-bold">{m.name}:</span>
                            <Progress percent={Math.round((m.currentValue / m.targetValue) * 100)} size="small" style={{ width: 100 }} />
                            <InputNumber
                                size="small"
                                value={m.currentValue}
                                onChange={(val) => handleProgressUpdate(record._id, m._id, val)}
                                style={{ width: 60 }}
                            />
                            <span className="text-xs text-gray-500">/ {m.targetValue} {m.unit}</span>
                        </div>
                    ))}
                </div>
            )
        },
        {
            title: 'Deadline',
            dataIndex: 'endDate',
            key: 'endDate',
            render: d => new Date(d).toLocaleDateString()
        },
        {
            title: 'Status',
            dataIndex: 'status',
            render: s => <Tag color={s === 'Completed' ? 'green' : 'orange'}>{s}</Tag>
        }
    ];

    const assignedColumns = [
        { title: 'Title', dataIndex: 'title' },
        { title: 'Assigned To', dataIndex: ['assignedTo', 'username'] },
        { title: 'Deadline', dataIndex: 'endDate', render: d => new Date(d).toLocaleDateString() },
        {
            title: 'Status',
            dataIndex: 'status',
            render: s => <Tag color={s === 'Completed' ? 'green' : 'orange'}>{s}</Tag>
        }
    ];

    return (
        <div className="p-6">
            <div className="flex justify-between mb-4">
                <h2 className="text-2xl font-bold">Targets & Goals</h2>
                {isLeadOrAdmin && (
                    <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsAssignModalVisible(true)}>
                        Assign Target
                    </Button>
                )}
            </div>

            <Tabs defaultActiveKey="1" items={[
                {
                    key: '1',
                    label: 'My Targets',
                    children: <Table dataSource={myTargets} columns={myColumns} rowKey="_id" loading={loading} />
                },
                isLeadOrAdmin && {
                    key: '2',
                    label: 'Assigned by Me',
                    children: <Table dataSource={assignedTargets} columns={assignedColumns} rowKey="_id" loading={loading} />
                }
            ].filter(Boolean)} />

            <Modal
                title="Assign New Target"
                open={isAssignModalVisible}
                onCancel={() => setIsAssignModalVisible(false)}
                footer={null}
                width={700}
            >
                <Form form={form} layout="vertical" onFinish={handleAssign}>
                    <Form.Item name="title" label="Target Title" rules={[{ required: true }]}>
                        <Input placeholder="e.g. Q3 Sales Goal" />
                    </Form.Item>
                    <div className="grid grid-cols-2 gap-4">
                        <Form.Item name="assignedTo" label="Assign To" rules={[{ required: true }]}>
                            <Select showSearch optionFilterProp="children">
                                {students.map(u => (
                                    <Option key={u._id} value={u._id}>{u.username} ({u.roles?.[0]?.name})</Option>
                                ))}
                            </Select>
                        </Form.Item>
                        <Form.Item name="type" label="Department" rules={[{ required: true }]}>
                            <Select>
                                <Option value="Sales">Sales</Option>
                                <Option value="Training">Training</Option>
                                <Option value="Recruitment">Recruitment</Option>
                                <Option value="Other">Other</Option>
                            </Select>
                        </Form.Item>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <Form.Item name="startDate" label="Start Date">
                            <Input type="date" />
                        </Form.Item>
                        <Form.Item name="endDate" label="Deadline">
                            <Input type="date" />
                        </Form.Item>
                    </div>

                    <Divider orientation="left">Metrics</Divider>
                    {metrics.map((metric, index) => (
                        <div key={index} className="flex gap-2 items-end mb-2">
                            <Form.Item label={index === 0 ? "Metric Name" : ""} className="mb-0 flex-1">
                                <Input placeholder="Calls / Revenue" value={metric.name} onChange={(e) => updateMetricField(index, 'name', e.target.value)} />
                            </Form.Item>
                            <Form.Item label={index === 0 ? "Target Value" : ""} className="mb-0 w-24">
                                <InputNumber placeholder="100" value={metric.targetValue} onChange={(v) => updateMetricField(index, 'targetValue', v)} />
                            </Form.Item>
                            <Form.Item label={index === 0 ? "Unit" : ""} className="mb-0 w-24">
                                <Input placeholder="Count/USD" value={metric.unit} onChange={(e) => updateMetricField(index, 'unit', e.target.value)} />
                            </Form.Item>
                            <Button danger icon={<DeleteOutlined />} onClick={() => removeMetricField(index)} />
                        </div>
                    ))}
                    <Button type="dashed" onClick={addMetricField} block icon={<PlusOutlined />} className="mb-4">
                        Add Metric
                    </Button>

                    <Button type="primary" htmlType="submit" className="w-full">Assign Target</Button>
                </Form>
            </Modal>
        </div>
    );
};

export default Targets;
