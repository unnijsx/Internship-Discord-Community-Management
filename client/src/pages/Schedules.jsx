
import React, { useState, useEffect, useContext } from 'react';
import { Calendar, Badge, Modal, Form, Input, Select, DatePicker, message, Card, Button } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import dayjs from 'dayjs';

const { Option } = Select;

const Schedules = () => {
    const { user } = useContext(AuthContext);
    const [events, setEvents] = useState([]);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [selectedDate, setSelectedDate] = useState(dayjs());
    const [form] = Form.useForm();

    // Check if user is Process Team (e.g., Manager, Admin, or specific role)
    // For now, allow Managers and Trainers to create events.
    const canCreate = user?.isSuperAdmin || user?.roles?.some(r => ['MANAGER', 'TRAINER', 'PROCESS'].some(role => r.name.includes(role)));

    const fetchEvents = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get('http://localhost:5000/api/events', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setEvents(res.data);
        } catch (err) {
            // message.error('Failed to load schedules');
        }
    };

    useEffect(() => {
        fetchEvents();
    }, []);

    const dateCellRender = (value) => {
        const listData = events.filter(event =>
            dayjs(event.startTime).format('YYYY-MM-DD') === value.format('YYYY-MM-DD')
        );
        return (
            <ul className="events">
                {listData.map((item) => (
                    <li key={item._id}>
                        <Badge status={item.status === 'Completed' ? 'success' : 'processing'} text={item.title} />
                    </li>
                ))}
            </ul>
        );
    };

    const handleCreate = async (values) => {
        try {
            const token = localStorage.getItem('token');
            const payload = {
                ...values,
                startTime: values.startTime.toISOString(),
                endTime: values.endTime?.toISOString()
            };
            await axios.post('http://localhost:5000/api/events', payload, {
                headers: { Authorization: `Bearer ${token}` }
            });
            message.success('Event scheduled');
            setIsModalVisible(false);
            form.resetFields();
            fetchEvents();
        } catch (err) {
            message.error('Failed to schedule event');
        }
    };

    const onSelect = (value) => {
        setSelectedDate(value);
        if (canCreate) {
            // Optional: Open modal on click? Or just separate button.
            // staying simple with button.
        }
    };

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Class & Exam Schedules</h2>
                {canCreate && (
                    <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsModalVisible(true)}>
                        Schedule Event
                    </Button>
                )}
            </div>

            <Card>
                <Calendar dateCellRender={dateCellRender} onSelect={onSelect} />
            </Card>

            <Modal
                title="Schedule New Event"
                open={isModalVisible}
                onCancel={() => setIsModalVisible(false)}
                footer={null}
            >
                <Form form={form} layout="vertical" onFinish={handleCreate} initialValues={{ startTime: dayjs() }}>
                    <Form.Item name="title" label="Title" rules={[{ required: true }]}>
                        <Input placeholder="e.g. React Session or Mid-Term Exam" />
                    </Form.Item>
                    <Form.Item name="type" label="Type" initialValue="Class">
                        <Select>
                            <Option value="Class">Class</Option>
                            <Option value="Exam">Exam</Option>
                            <Option value="Meeting">Meeting</Option>
                            <Option value="Holiday">Holiday</Option>
                        </Select>
                    </Form.Item>
                    <Form.Item name="batch" label="Target Batch">
                        <Input placeholder="e.g. Batch A" />
                    </Form.Item>
                    <div className="grid grid-cols-2 gap-4">
                        <Form.Item name="startTime" label="Start Time" rules={[{ required: true }]}>
                            <DatePicker showTime format="YYYY-MM-DD HH:mm" />
                        </Form.Item>
                        <Form.Item name="endTime" label="End Time">
                            <DatePicker showTime format="YYYY-MM-DD HH:mm" />
                        </Form.Item>
                    </div>
                    <Form.Item name="meetingLink" label="Meeting Link">
                        <Input placeholder="Zoom/Meet URL" />
                    </Form.Item>
                    <Button type="primary" htmlType="submit" className="w-full">Create Schedule</Button>
                </Form>
            </Modal>
        </div>
    );
};

export default Schedules;
