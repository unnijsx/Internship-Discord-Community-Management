
import React, { useState, useEffect, useContext } from 'react';
import { Card, Button, Modal, Form, Input, Select, Tag, message, Avatar, Tooltip, DatePicker } from 'antd';
import { PlusOutlined, DeleteOutlined, UserOutlined, ArrowRightOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import axiosInstance from '../../api/axiosInstance';
import { AuthContext } from '../../context/AuthContext'; // Adjusted path if needed

const { Option } = Select;

const TaskBoard = () => {
    const { user } = useContext(AuthContext);
    const [tasks, setTasks] = useState([]);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [form] = Form.useForm();

    const statuses = ['ToDo', 'InProgress', 'Review', 'Done'];
    const priorities = ['Low', 'Medium', 'High', 'Critical'];

    const fetchData = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const [tasksRes, usersRes] = await Promise.all([
                axiosInstance.get('/api/tasks', { headers: { Authorization: `Bearer ${token}` } }),
                axiosInstance.get('/api/users', { headers: { Authorization: `Bearer ${token}` } }),
            ]);
            setTasks(tasksRes.data);
            setUsers(usersRes.data);
        } catch (err) {
            message.error('Failed to load data');
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleCreate = async (values) => {
        try {
            const token = localStorage.getItem('token');
            await axiosInstance.post('/api/tasks', values, {
                headers: { Authorization: `Bearer ${token}` }
            });
            message.success('Task created');
            setModalVisible(false);
            form.resetFields();
            fetchData();
        } catch (err) {
            message.error('Create failed');
        }
    };

    const handleMove = async (task, direction) => {
        const currentIndex = statuses.indexOf(task.status);
        const newIndex = currentIndex + direction;

        if (newIndex < 0 || newIndex >= statuses.length) return;

        const newStatus = statuses[newIndex];
        try {
            const token = localStorage.getItem('token');
            await axiosInstance.put(`/api/tasks/${task._id}`, { status: newStatus }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setTasks(prev => prev.map(t => t._id === task._id ? { ...t, status: newStatus } : t));
        } catch (err) {
            message.error('Update failed');
        }
    };

    const handleDelete = async (id) => {
        try {
            const token = localStorage.getItem('token');
            await axiosInstance.delete(`/api/tasks/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchData();
        } catch (err) {
            message.error('Delete failed');
        }
    };

    const getPriorityColor = (p) => {
        switch (p) {
            case 'Critical': return 'red';
            case 'High': return 'volcano';
            case 'Medium': return 'orange';
            default: return 'green';
        }
    };

    return (
        <div className="p-6 h-full overflow-hidden">
            <div className="flex justify-between items-center mb-4">
                <h1 className="text-2xl font-bold">Task Board</h1>
                <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalVisible(true)}>New Task</Button>
            </div>

            <div className="flex gap-4 h-[calc(100vh-140px)] overflow-x-auto pb-4">
                {statuses.map(status => (
                    <div key={status} className="w-80 flex-shrink-0 bg-gray-50 rounded-lg p-3 flex flex-col h-full">
                        <h3 className="font-semibold mb-3 text-gray-700 mx-1 flex justify-between">
                            {status}
                            <Tag>{tasks.filter(t => t.status === status).length}</Tag>
                        </h3>

                        <div className="flex-1 overflow-y-auto pr-1">
                            {tasks.filter(t => t.status === status).map(task => (
                                <Card key={task._id} size="small" className="mb-2 shadow-sm cursor-pointer hover:shadow-md transition-shadow">
                                    <div className="flex justify-between items-start mb-2">
                                        <Tag color={getPriorityColor(task.priority)} className="mr-0">{task.priority}</Tag>
                                        {user?.isSuperAdmin && (
                                            <DeleteOutlined className="text-gray-400 hover:text-red-500" onClick={() => handleDelete(task._id)} />
                                        )}
                                    </div>
                                    <h4 className="font-semibold mb-1">{task.title}</h4>
                                    <p className="text-xs text-gray-500 mb-3 truncate">{task.description}</p>

                                    <div className="flex justify-between items-center mt-2">
                                        <div className="flex -space-x-2">
                                            {task.assignee ? (
                                                <Tooltip title={task.assignee.username}>
                                                    <Avatar src={task.assignee.avatar ? `https://cdn.discordapp.com/avatars/${task.assignee.discordId}/${task.assignee.avatar}.png` : null} icon={<UserOutlined />} size="small" />
                                                </Tooltip>
                                            ) : <Avatar size="small" icon={<UserOutlined />} />}
                                        </div>

                                        <div className="flex gap-1">
                                            {status !== 'ToDo' && (
                                                <Button size="small" type="text" icon={<ArrowLeftOutlined />} onClick={() => handleMove(task, -1)} />
                                            )}
                                            {status !== 'Done' && (
                                                <Button size="small" type="text" icon={<ArrowRightOutlined />} onClick={() => handleMove(task, 1)} />
                                            )}
                                        </div>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            <Modal
                title="Create New Task"
                open={modalVisible}
                onCancel={() => setModalVisible(false)}
                footer={null}
            >
                <Form form={form} layout="vertical" onFinish={handleCreate}>
                    <Form.Item name="title" label="Title" rules={[{ required: true }]}>
                        <Input />
                    </Form.Item>
                    <Form.Item name="description" label="Description">
                        <Input.TextArea />
                    </Form.Item>
                    <div className="grid grid-cols-2 gap-4">
                        <Form.Item name="priority" label="Priority" initialValue="Medium">
                            <Select>
                                {priorities.map(p => <Option key={p} value={p}>{p}</Option>)}
                            </Select>
                        </Form.Item>
                        <Form.Item name="assignee" label="Assign To (Optional)">
                            <Select showSearch optionFilterProp="children" allowClear>
                                {users.map(u => (
                                    <Option key={u._id} value={u._id}>{u.username}</Option>
                                ))}
                            </Select>
                        </Form.Item>
                    </div>
                    <Form.Item name="dueDate" label="Due Date">
                        <DatePicker className="w-full" />
                    </Form.Item>
                    <Button type="primary" htmlType="submit" className="w-full">Create Task</Button>
                </Form>
            </Modal>
        </div>
    );
};

export default TaskBoard;
