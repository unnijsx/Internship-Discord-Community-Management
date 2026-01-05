
import React, { useState, useEffect, useContext } from 'react';
import { Card, Table, Tag, Button, Modal, Form, Input, Select, Rate, message, Typography, List, Avatar } from 'antd';
import { PlusOutlined, UserOutlined, MessageOutlined } from '@ant-design/icons';
import axios from 'axios';
import { AuthContext } from '../../context/AuthContext';
import axiosInstance from '../../api/axiosInstance';

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const Feedback = () => {
    const { user } = useContext(AuthContext);
    const [feedbacks, setFeedbacks] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [students, setStudents] = useState([]); // For trainers to select student
    const [form] = Form.useForm();

    const isTrainerOrAdmin = user?.isSuperAdmin || user?.roles?.some(r => r.name.includes('TRAINER') || r.name === 'MANAGER' || r.permissions?.canManageUsers);

    // If Trainer/Admin, we might want to see ONE student's feedback or add feedback. 
    // For simplicity, this page will show "My Feedback" for students, 
    // and "Add Feedback" for trainers (who select a student).
    // A full "All Students Feedback" view might be better in UserManagement or specialized page.

    // Changing approach: If Student -> View My Feedback.
    // If Trainer -> View a list of students? Or just "Create Feedback" button that opens a modal to select student?
    // Let's load the current user's feedback if they are a student.
    // If they are a trainer, maybe show "Recent Feedback Given" or nothing for now, just the "Add" button.

    const fetchFeedback = async (targetUserId) => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            // If no targetUserId provided, assume fetching for self (student view)
            const id = targetUserId || user._id;
            const res = await axiosInstance.get(`/api/feedback/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setFeedbacks(res.data);
        } catch (err) {
            // message.error('Failed to load feedback');
        }
        setLoading(false);
    };

    const fetchStudents = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get('http://localhost:5000/api/students', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setStudents(res.data);
        } catch (err) {
            console.error("Failed to fetch students");
        }
    };

    useEffect(() => {
        if (user) {
            // If just a student, load own.
            if (!isTrainerOrAdmin) {
                fetchFeedback(user._id);
            } else {
                fetchStudents();
            }
        }
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
            // If we were viewing that student, refresh.
        } catch (err) {
            message.error('Failed to submit feedback');
        }
    };

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <Title level={2}>Performance & Feedback</Title>
                    <Text type="secondary">Track progress, reviews, and mentorship notes.</Text>
                </div>
                {isTrainerOrAdmin && (
                    <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsModalVisible(true)}>
                        New Feedback
                    </Button>
                )}
            </div>

            <Card loading={loading}>
                {!isTrainerOrAdmin || feedbacks.length > 0 ? (
                    <List
                        itemLayout="vertical"
                        size="large"
                        dataSource={feedbacks}
                        renderItem={(item) => (
                            <List.Item
                                key={item._id}
                                extra={<Text type="secondary">{new Date(item.date).toLocaleDateString()}</Text>}
                            >
                                <List.Item.Meta
                                    avatar={<Avatar icon={<MessageOutlined />} style={{ backgroundColor: '#87d068' }} />}
                                    title={<div className="flex justify-between">
                                        <span>{item.title} <Tag color="blue">{item.type}</Tag></span>
                                        <Rate disabled defaultValue={item.rating} />
                                    </div>}
                                    description={`By: ${item.author?.username || 'Unknown'}`}
                                />
                                {item.content}
                            </List.Item>
                        )}
                    />
                ) : (
                    <div className="text-center py-10 text-gray-400">
                        {isTrainerOrAdmin ? "Select a student in 'User Management' to view their history, or click 'New Feedback' to add one." : "No feedback records found."}
                    </div>
                )}
            </Card>

            <Modal
                title="Add Performance Review"
                open={isModalVisible}
                onCancel={() => setIsModalVisible(false)}
                footer={null}
            >
                <Form form={form} layout="vertical" onFinish={handleCreate}>
                    <Form.Item name="studentId" label="Student" rules={[{ required: true }]}>
                        <Select showSearch optionFilterProp="children" placeholder="Select a student">
                            {students.map(s => (
                                <Option key={s.user._id} value={s.user._id}>{s.user.username} ({s.course})</Option>
                            ))}
                        </Select>
                    </Form.Item>
                    <Form.Item name="title" label="Title" rules={[{ required: true }]}>
                        <Input placeholder="e.g. Week 1 Assessment" />
                    </Form.Item>
                    <Form.Item name="type" label="Type" initialValue="Weekly">
                        <Select>
                            <Option value="Weekly">Weekly Review</Option>
                            <Option value="Monthly">Monthly Review</Option>
                            <Option value="Project">Project Evaluation</Option>
                            <Option value="General">General Remark</Option>
                        </Select>
                    </Form.Item>
                    <Form.Item name="rating" label="Rating (1-10)">
                        <Rate count={10} />
                    </Form.Item>
                    <Form.Item name="content" label="Feedback" rules={[{ required: true }]}>
                        <TextArea rows={4} placeholder="Detailed feedback..." />
                    </Form.Item>
                    <Button type="primary" htmlType="submit" className="w-full">Submit</Button>
                </Form>
            </Modal>
        </div>
    );
};

export default Feedback;
