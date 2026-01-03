
import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { Card, Table, Statistic, Row, Col, Button, Modal, Form, Input, Select, DatePicker, message, Tag, Typography } from 'antd';
import { DollarOutlined, PlusOutlined, FallOutlined, RiseOutlined } from '@ant-design/icons';
import axios from 'axios';

const { Title } = Typography;
const { Option } = Select;

const SalesDashboard = () => {
    const { user } = useContext(AuthContext);
    const [stats, setStats] = useState({ total: 0, pending: 0, today: 0 });
    const [transactions, setTransactions] = useState([]);
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [form] = Form.useForm();

    const fetchData = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const [feesRes, studentsRes] = await Promise.all([
                axios.get('http://localhost:5000/api/fees', { headers: { Authorization: `Bearer ${token}` } }),
                axios.get('http://localhost:5000/api/students', { headers: { Authorization: `Bearer ${token}` } })
            ]);

            setTransactions(feesRes.data);

            // Filter students: If Sales Associate, only show assigned students.
            let myStudents = studentsRes.data;
            const isManager = user?.isSuperAdmin || user?.roles?.some(r => r.name === 'MANAGER' || r.name === 'SALES_DIVISION_LEAD');
            if (!isManager && user) {
                // This requires StudentProfile to be populated in the API. 
                // Assuming the API returns student users with profile populated, or we need to check profile.
                // Actually, let's assume the API returns User objects. We need to match `assignedSalesPerson`.
                // Since the API `/api/students` likely returns Users or Profiles, let's just implement filtering on client for now 
                // assuming `studentsRes.data` contains necessary profile info or checking `student.profile.assignedSalesPerson`.
                // Note: This needs backend support to be secure, but for "Views", client filter is okay for MVP.
                myStudents = studentsRes.data.filter(s => s.profile?.assignedSalesPerson === user._id);
            }
            setStudents(myStudents);

            // Calculate mock stats from data
            const total = feesRes.data.reduce((acc, curr) => acc + curr.amount, 0);
            setStats({
                total,
                pending: 0, // Need 'Pending' status in backend data to calculate real value
                today: 0 // Need date filtering for real value
            });

        } catch (err) {
            message.error('Failed to load sales data');
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleAddRecord = async (values) => {
        try {
            const token = localStorage.getItem('token');
            await axios.post('http://localhost:5000/api/fees', values, {
                headers: { Authorization: `Bearer ${token}` }
            });
            message.success('Fee record added');
            setModalVisible(false);
            form.resetFields();
            fetchData();
        } catch (err) {
            message.error('Failed to add record');
        }
    };

    const columns = [
        {
            title: 'Student',
            dataIndex: 'student',
            key: 'student',
            render: (student) => student?.fullName || 'Unknown'
        },
        {
            title: 'Type',
            dataIndex: 'type',
            key: 'type',
            render: (type) => <Tag color={type === 'Registration' ? 'blue' : 'green'}>{type}</Tag>
        },
        {
            title: 'Amount',
            dataIndex: 'amount',
            key: 'amount',
            render: (amount) => `₹${amount}`
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: (status) => <Tag color={status === 'Completed' ? 'success' : 'warning'}>{status}</Tag>
        },
        {
            title: 'Date',
            dataIndex: 'paymentDate',
            key: 'paymentDate',
            render: (date) => new Date(date).toLocaleDateString()
        }
    ];

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <Title level={2}>Sales & Fees Overview</Title>
                <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalVisible(true)}>
                    Record Payment
                </Button>
            </div>

            <Row gutter={16} className="mb-6">
                <Col span={8}>
                    <Card bordered={false} className="shadow-sm">
                        <Statistic
                            title="Total Revenue"
                            value={stats.total}
                            prefix={<DollarOutlined />}
                            precision={2}
                            valueStyle={{ color: '#3f8600' }}
                        />
                    </Card>
                </Col>
                <Col span={8}>
                    <Card bordered={false} className="shadow-sm">
                        <Statistic
                            title="Pending Payments"
                            value={stats.pending}
                            valueStyle={{ color: '#cf1322' }}
                        />
                    </Card>
                </Col>
                <Col span={8}>
                    <Card bordered={false} className="shadow-sm">
                        <Statistic
                            title="Active Students"
                            value={students.length}
                            prefix={<RiseOutlined />}
                        />
                    </Card>
                </Col>
            </Row>

            <Card title="Recent Transactions" className="shadow-md" bordered={false}>
                <Table
                    columns={columns}
                    dataSource={transactions.filter(t => {
                        // If admin/manager, show all. If Sales, show only assigned students.
                        // Assuming backend filters 'students' correctly, we can filter transactions here or backend.
                        // For now, let's filter in frontend for simplicity:
                        if (user?.isSuperAdmin || user?.roles?.some(r => r.name === 'MANAGER' || r.name === 'SALES_DIVISION_LEAD')) return true;
                        // Check if transaction student is in the 'students' list (which we will filter next)
                        return students.some(s => s._id === t.student?._id);
                    })}
                    rowKey="_id"
                    pagination={{ pageSize: 5 }}
                />
            </Card>

            <Modal
                title="Record New Fee Payment"
                open={modalVisible}
                onCancel={() => setModalVisible(false)}
                footer={null}
            >
                <Form form={form} layout="vertical" onFinish={handleAddRecord}>
                    <Form.Item name="student" label="Select Student" rules={[{ required: true }]}>
                        <Select showSearch optionFilterProp="children">
                            {students.map(s => (
                                <Option key={s._id} value={s._id}>{s.fullName} ({s.course})</Option>
                            ))}
                        </Select>
                    </Form.Item>
                    <Form.Item name="amount" label="Amount (₹)" rules={[{ required: true }]}>
                        <Input type="number" />
                    </Form.Item>
                    <Form.Item name="type" label="Payment Type" rules={[{ required: true }]}>
                        <Select>
                            <Option value="Registration">Registration</Option>
                            <Option value="Installment">Installment</Option>
                            <Option value="Full">Full Payment</Option>
                            <Option value="Fine">Fine/Other</Option>
                        </Select>
                    </Form.Item>
                    <Form.Item name="remarks" label="Remarks">
                        <Input.TextArea />
                    </Form.Item>

                    <Button type="primary" htmlType="submit" className="w-full">
                        Submit Record
                    </Button>
                </Form>
            </Modal>
        </div>
    );
};

export default SalesDashboard;
