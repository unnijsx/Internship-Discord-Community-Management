
import React, { useState, useEffect, useContext } from 'react';
import { Card, Table, Button, Upload, Modal, Form, Input, Select, message, Tag, Space, Typography } from 'antd';
import { UploadOutlined, FilePdfOutlined, FileOutlined, DeleteOutlined, DownloadOutlined } from '@ant-design/icons';
import { AuthContext } from '../../context/AuthContext';
import axios from 'axios';
import axiosInstance from '../../api/axiosInstance';

const { Title, Text } = Typography;
const { Option } = Select;

const MaterialRepository = () => {
    const { user } = useContext(AuthContext);
    const [materials, setMaterials] = useState([]);
    const [loading, setLoading] = useState(false);
    const [uploadModalVisible, setUploadModalVisible] = useState(false);
    const [roleList, setRoleList] = useState([]); // For visibility selection
    const [form] = Form.useForm();

    // Check permissions
    const canUpload = user?.isSuperAdmin || user?.roles?.some(r => r.permissions?.canPostJobs || r.permissions?.canManageUsers || r.name.includes('TRAINER') || r.name === 'MANAGER');

    const fetchData = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await axiosInstance.get('/api/materials', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setMaterials(res.data);

            // Also fetch roles for the upload dropdown if user can upload
            if (canUpload && roleList.length === 0) {
                const rolesRes = await axiosInstance.get('/api/roles', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setRoleList(rolesRes.data);
            }
        } catch (err) {
            message.error('Failed to load materials');
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchData();
    }, [user]); // Refresh when user context changes/loads

    const handleUpload = async (values) => {
        try {
            const formData = new FormData();
            formData.append('title', values.title);
            formData.append('description', values.description);
            formData.append('file', values.file[0].originFileObj);

            if (values.visibleToRoles) {
                formData.append('visibleToRoles', JSON.stringify(values.visibleToRoles));
            }

            const token = localStorage.getItem('token');
            await axiosInstance.post('/api/materials', formData, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data'
                }
            });
            message.success('Material uploaded successfully');
            setUploadModalVisible(false);
            form.resetFields();
            fetchData();
        } catch (err) {
            message.error('Upload failed');
            console.error(err);
        }
    };

    const columns = [
        {
            title: 'Title',
            dataIndex: 'title',
            key: 'title',
            render: (text, record) => (
                <Space>
                    {text.endsWith('.pdf') ? <FilePdfOutlined className="text-red-500" /> : <FileOutlined className="text-blue-500" />}
                    <span className="font-semibold">{text}</span>
                </Space>
            )
        },
        {
            title: 'Description',
            dataIndex: 'description',
            key: 'description',
            ellipsis: true,
        },
        {
            title: 'Uploaded By',
            dataIndex: 'uploadedBy',
            key: 'uploadedBy',
            render: (uploader) => uploader?.username || 'Unknown',
            responsive: ['md']
        },
        {
            title: 'Date',
            dataIndex: 'createdAt',
            key: 'createdAt',
            render: (date) => new Date(date).toLocaleDateString(),
            responsive: ['sm']
        },
        {
            title: 'Action',
            key: 'action',
            render: (_, record) => (
                <Space>
                    <Button
                        type="link"
                        icon={<DownloadOutlined />}
                        href={`http://localhost:5000/${record.filePath}`}
                        target="_blank"
                    >
                        Download
                    </Button>
                    {/* Add Delete button for Admins here if needed */}
                </Space>
            )
        }
    ];

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <Title level={2}>Study Materials</Title>
                    <Text type="secondary">Access course content, assignments, and resources.</Text>
                </div>
                {canUpload && (
                    <Button type="primary" icon={<UploadOutlined />} onClick={() => setUploadModalVisible(true)}>
                        Upload Material
                    </Button>
                )}
            </div>

            <Card className="shadow-md" bordered={false}>
                <Table
                    columns={columns}
                    dataSource={materials}
                    rowKey="_id"
                    loading={loading}
                    pagination={{ pageSize: 8 }}
                />
            </Card>

            <Modal
                title="Upload New Material"
                open={uploadModalVisible}
                onCancel={() => setUploadModalVisible(false)}
                footer={null}
            >
                <Form form={form} layout="vertical" onFinish={handleUpload}>
                    <Form.Item name="title" label="Material Title" rules={[{ required: true }]}>
                        <Input placeholder="e.g. React Basics Module 1" />
                    </Form.Item>
                    <Form.Item name="description" label="Description">
                        <Input.TextArea placeholder="Brief description of the content" />
                    </Form.Item>

                    {/* Visibility Selection - Optional for now */}
                    <Form.Item name="visibleToRoles" label="Visible To (Optional)">
                        <Select mode="multiple" placeholder="Select roles (leave empty for all)" optionFilterProp="children">
                            {roleList.map(role => (
                                <Option key={role._id} value={role._id}>{role.name}</Option>
                            ))}
                        </Select>
                    </Form.Item>

                    <Form.Item
                        name="file"
                        label="File"
                        valuePropName="fileList"
                        getValueFromEvent={(e) => (Array.isArray(e) ? e : e?.fileList)}
                        rules={[{ required: true, message: 'Please select a file' }]}
                    >
                        <Upload beforeUpload={() => false} maxCount={1}>
                            <Button icon={<UploadOutlined />}>Select File</Button>
                        </Upload>
                    </Form.Item>

                    <Button type="primary" htmlType="submit" className="w-full mt-4">
                        Upload
                    </Button>
                </Form>
            </Modal>
        </div>
    );
};

export default MaterialRepository;
