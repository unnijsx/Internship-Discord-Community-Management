
import React from 'react';
import { Card, Row, Col, Statistic } from 'antd';
import { UserOutlined, ArrowUpOutlined } from '@ant-design/icons';
import { Line } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
);

const AdminDashboard = () => {
    const data = {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
        datasets: [
            {
                label: 'Attendance',
                data: [65, 59, 80, 81, 56, 55],
                fill: false,
                borderColor: 'rgb(75, 192, 192)',
                tension: 0.1
            },
        ],
    };

    return (
        <div>
            <h1 className="text-2xl font-bold mb-6">Dashboard Overview</h1>
            <Row gutter={16}>
                <Col span={6}>
                    <Card>
                        <Statistic title="Total Students" value={1128} prefix={<UserOutlined />} />
                    </Card>
                </Col>
                <Col span={6}>
                    <Card>
                        <Statistic title="Active Tasks" value={93} suffix="/ 100" />
                    </Card>
                </Col>
                <Col span={6}>
                    <Card>
                        <Statistic title="Revenue (Fees)" value={112893} prefix="$" precision={2} />
                    </Card>
                </Col>
                <Col span={6}>
                    <Card>
                        <Statistic
                            title="Attendance Rate"
                            value={93.5}
                            precision={2}
                            valueStyle={{ color: '#3f8600' }}
                            prefix={<ArrowUpOutlined />}
                            suffix="%"
                        />
                    </Card>
                </Col>
            </Row>

            <div className="mt-8">
                <Card title="Attendance Trend">
                    <div style={{ height: '300px' }}>
                        <Line options={{ maintainAspectRatio: false }} data={data} />
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default AdminDashboard;
