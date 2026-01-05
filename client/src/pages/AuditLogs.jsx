import React, { useState, useEffect } from 'react';
import { Table, Tag, message, Card } from 'antd';
import axios from 'axios';
import axiosInstance from '../api/axiosInstance';

const AuditLogs = () => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(false);
    const [pagination, setPagination] = useState({ current: 1, pageSize: 20 });

    const fetchLogs = async (page = 1) => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await axiosInstance.get(`/api/audit-logs?page=${page}&limit=${pagination.pageSize}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setLogs(res.data.logs);
            setPagination({ ...pagination, current: page, total: res.data.logs.length * res.data.totalPages }); // Approximation for now
        } catch (err) {
            message.error('Failed to load audit logs');
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchLogs();
    }, []);

    const columns = [
        {
            title: 'Action',
            dataIndex: 'action',
            key: 'action',
            render: text => <Tag color="blue">{text}</Tag>
        },
        {
            title: 'Performed By',
            dataIndex: 'performedBy',
            key: 'performedBy',
            render: user => user ? <span className="font-semibold">{user.username}</span> : 'System'
        },
        {
            title: 'Details',
            dataIndex: 'details',
            key: 'details',
            ellipsis: true
        },
        {
            title: 'Date',
            dataIndex: 'timestamp',
            key: 'timestamp',
            render: date => new Date(date).toLocaleString()
        }
    ];

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-4 text-white">System Audit Logs</h1>
            <Card className="bg-[#1f1f1f] border-gray-700">
                <Table
                    columns={columns}
                    dataSource={logs}
                    rowKey="_id"
                    loading={loading}
                    pagination={{
                        ...pagination,
                        onChange: (page) => fetchLogs(page)
                    }}
                    className="audit-table"
                />
            </Card>
        </div>
    );
};

export default AuditLogs;
