
import React, { useState, useEffect, useContext } from 'react';
import { Card, Table, Rate, Button, Modal, Form, Input, Select, Tag, Tabs, message, Avatar, Typography } from 'antd';
import { MessageOutlined, PlusOutlined, UserOutlined } from '@ant-design/icons';
import { AuthContext } from '../context/AuthContext';
import axios from 'axios';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const Feedback = () => {
    const { user } = useContext(AuthContext);
    const [feedbacks, setFeedbacks] = useState([]);
    const [students, setStudents] = useState([]); // For Trainers/Leads to select
    const [loading, setLoading] = useState(false);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [form] = Form.useForm();

    const isStudent = user?.roles?.some(r => r.name === 'STUDENT' || r.name === 'Student' || r.name.includes('INTERN')) || !user?.roles?.length;
    const canGiveFeedback = user?.isSuperAdmin || user?.roles?.some(r => r.permissions?.canManageUsers || r.name.includes('TRAINER') || r.name.includes('LEAD') || r.name === 'MANAGER');

    const fetchFeedback = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            // Logic: If trainer, we might want to see feedback given? Or just feedback for a specific student?
            // The API currently expects /:studentId. 
            // If I am a student, I send my ID.
            // If I am a trainer, I might want to see feedbacks I gave OR feedbacks for a student I select.
            // For MVP: Student sees their own. Trainer sees "My Feedback" (meaning feedback GIVEN by them? Or empty until they select a student)

            // Actually, let's make the list view different based on role.
            // If Student: fetch /api/feedback/my_id

            if (isStudent) {
                const res = await axios.get(`http://localhost:5000/api/feedback/${user._id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setFeedbacks(res.data);
            } else {
                // For trainers, maybe initially show nothing or show all feedback gives?
                // Current API only gets by StudentID. Let's just allow creating for now, or fetch a student's feedback upon selection.
                setFeedbacks([]); // Trainers select student to view
            }

        } catch (err) {
            console.error(err);
        }
        setLoading(false);
    };

    const fetchStudents = async () => {
        if (!canGiveFeedback) return;
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get('http://localhost:5000/api/users', { // Assuming users endpoint filters or we filter
                headers: { Authorization: `Bearer ${token}` }
            });
            // Filter only students roughly
            const studentList = res.data.filter(u => u.roles.some(r => r.name === 'STUDENT' || r.name === 'Student' || r.name.includes('INTERN')) || u.roles.length === 0);
            setStudents(studentList);
        } catch (err) { console.error(err); }
    };

    useEffect(() => {
        fetchFeedback();
        if (canGiveFeedback) fetchStudents();
    }, [user]);

    const handleCreate = async (values) => {
        try {
            const token = localStorage.getItem('token');
            await axios.post('http://localhost:5000/api/feedback', values, {
                headers: { Authorization: `Bearer ${token}` }
            });
            message.success('Feedback submitted successfully');
            setIsModalVisible(false);
            form.resetFields();
            // If viewing that student, refresh
        } catch (err) {
            message.error('Failed to submit feedback');
        }
    };

    // Columns for the table
    const columns = [
        {
            title: 'Type',
            dataIndex: 'type',
            key: 'type',
            render: t => <Tag color="blue">{t}</Tag>
        },
        {
            title: 'Title',
            dataIndex: 'title',
            key: 'title',
            render: t => <Text strong>{t}</Text>
        },
        {
            title: 'Rating',
            dataIndex: 'rating',
            key: 'rating',
            render: r => <Rate disabled defaultValue={r} count={10} style={{ fontSize: 12 }} />
        },
        {
            title: 'From',
            dataIndex: ['author', 'username'],
            key: 'author',
            render: u => <><UserOutlined /> {u}</>
        },
        {
            title: 'Date',
            dataIndex: 'createdAt',
            key: 'date',
            render: d => new Date(d).toLocaleDateString()
        }
    ];

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <Title level={2}>Performance Feedback</Title>
                    <Text type="secondary">Reviews, assessments, and constructive feedback.</Text>
                </div>
                {canGiveFeedback && (
                    <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsModalVisible(true)}>
                        Give Feedback
                    </Button>
                )}
            </div>

            {/* Trainer View: Select Student to see their feedback */}
            {!isStudent && canGiveFeedback && (
                <div className="mb-4 flex items-center gap-4 bg-gray-800 p-4 rounded">
                    <span className="text-white font-semibold">View Student History:</span>
                    <Select
                        showSearch
                        placeholder="Select a student to view reviews"
                        optionFilterProp="children"
                        style={{ width: 300 }}
                        onChange={(val) => {
                            // fetch feedback for this student
                            setLoading(true);
                            axios.get(`http://localhost:5000/api/feedback/${val}`, {
                                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                            })
                                .then(res => setFeedbacks(res.data))
                                .catch(err => message.error('Failed to load feedback'))
                                .finally(() => setLoading(false));
                        }}
                    >
                        {students.map(s => (
                            <Option key={s._id} value={s._id}>{s.username} ({s.email})</Option>
                        ))}
                    </Select>
                </div>
            )}

            <Card className="shadow-md bg-[#1f1f1f] border-gray-700">
                {feedbacks.length > 0 ? (
                    <Table
                        dataSource={feedbacks}
                        columns={columns}
                        rowKey="_id"
                        expandable={{
                            expandedRowRender: record => (
                                <div className="p-4 bg-gray-900 rounded">
                                    <p className="text-gray-300 font-semibold mb-2">Detailed Comments:</p>
                                    <p className="text-gray-400 m-0 whitespace-pre-wrap">{record.content}</p>
                                </div>
                            ),
                        }}
                        className="feedback-table"
                    />
                ) : (
                    <div className="text-center py-10 text-gray-400">
                        {isStudent ? "No feedback received yet." : "Select a student above to view their performance reviews."}
                    </div>
                )}
            </Card>

            <Modal
                title="Give Feedback"
                open={isModalVisible}
                onCancel={() => setIsModalVisible(false)}
                footer={null}
            >
                <Form form={form} layout="vertical" onFinish={handleCreate}>
                    <Form.Item name="studentId" label="Select Student" rules={[{ required: true }]}>
                        <Select showSearch placeholder="Search student name" optionFilterProp="children">
                            {students.map(s => (
                                <Option key={s._id} value={s._id}>{s.username} ({s.email})</Option>
                            ))}
                        </Select>
                    </Form.Item>

                    <Form.Item name="type" label="Feedback Type" initialValue="General">
                        <Select>
                            <Option value="General">General</Option>
                            <Option value="Weekly">Weekly Review</Option>
                            <Option value="Monthly">Monthly Review</Option>
                            <Option value="Project">Project Evaluation</Option>
                            <Option value="Soft Skills">Soft Skills</Option>
                        </Select>
                    </Form.Item>

                    <Form.Item name="title" label="Title/Subject" rules={[{ required: true }]}>
                        <Input placeholder="e.g. Week 3 Progress" />
                    </Form.Item>

                    <Form.Item name="rating" label="Rating (1-10)">
                        <Rate count={10} />
                    </Form.Item>

                    <Form.Item name="content" label="Detailed Comments" rules={[{ required: true }]}>
                        <TextArea rows={4} placeholder="Enter detailed feedback here..." />
                    </Form.Item>

                    <Button type="primary" htmlType="submit" className="w-full">
                        Submit Review
                    </Button>
                </Form>
            </Modal>
        </div>
    );
};

export default Feedback;
