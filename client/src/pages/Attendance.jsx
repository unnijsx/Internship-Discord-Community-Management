import React, { useState, useEffect, useContext } from 'react';
import { Card, Button, Tabs, message, Table, Tag } from 'antd';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { AuthContext } from '../context/AuthContext';
import { QRCodeCanvas } from 'qrcode.react';
import axiosInstance from '../api/axiosInstance';

const Attendance = () => {
    const { user } = useContext(AuthContext);
    const [history, setHistory] = useState([]);

    const fetchHistory = async () => {
        if (!user?._id) return;
        try {
            const token = localStorage.getItem('token');
            const res = await axiosInstance.get(`/api/attendance/${user._id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setHistory(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        if (user) fetchHistory();
    }, [user]);



    const columns = [
        { title: 'Date', dataIndex: 'date', render: (d) => new Date(d).toLocaleDateString() },
        { title: 'In', dataIndex: 'clockInTime', render: (d) => d ? new Date(d).toLocaleTimeString() : '-' },
        { title: 'Out', dataIndex: 'clockOutTime', render: (d) => d ? new Date(d).toLocaleTimeString() : '-' },
        { title: 'Method', dataIndex: 'method', render: (m) => <Tag color="blue">{m}</Tag> },
        { title: 'Duration (m)', dataIndex: 'durationMinutes' },
    ];

    const getItems = () => {
        const items = [
            {
                key: '1',
                label: 'My History',
                children: <Table dataSource={history} columns={columns} rowKey="_id" />
            },
            {
                key: '2',
                label: 'Scan QR (Clock In/Out)',
                children: <QRScannerTab history={history} />
            }
        ];

        const isPrivileged = user?.isSuperAdmin || user?.roles?.some(r => r.permissions?.canManageUsers || r.name.includes('LEAD') || r.name === 'MANAGER' || r.name.includes('TRAINER'));

        if (isPrivileged) {
            items.push({
                key: '3',
                label: 'Admin: Generate QR',
                children: <AdminQRGenerator />
            });
        }

        if (user?.isSuperAdmin || user?.roles?.some(r => r.permissions?.canManageUsers || r.name.includes('LEAD') || r.name === 'MANAGER')) {
            items.push({
                key: '4',
                label: 'Team Attendance',
                children: <TeamAttendanceTab />
            });
        }

        return items;
    };

    return (
        <div className="p-4">
            <h1 className="text-2xl font-bold mb-4">Attendance</h1>
            <Tabs defaultActiveKey="1" items={getItems()} />
        </div>
    );
};

const QRScannerTab = ({ history }) => {
    const [manualCode, setManualCode] = useState('');
    const { user } = useContext(AuthContext);

    const handleManualSubmit = async () => {
        if (!manualCode || manualCode.length < 6) return message.error('Enter a valid 6-digit code');

        try {
            const today = new Date().toLocaleDateString();
            const lastEntry = history[0];
            let action = 'start';
            if (lastEntry && new Date(lastEntry.date).toLocaleDateString() === today && !lastEntry.clockOutTime) {
                action = 'end';
            }

            const token = localStorage.getItem('token');
            const res = await axiosInstance.post('/api/attendance/scan',
                { userId: user._id, manualCode, start_or_end: action },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            message.success(res.data.message);
            // Short delay to allow reading success message
            setTimeout(() => window.location.reload(), 1000);
        } catch (err) {
            message.error(err.response?.data?.message || 'Invalid Code');
        }
    };

    return (
        <div className="flex flex-col items-center space-y-6">
            <h3 className="text-lg font-semibold mb-4">
                {history[0] && new Date(history[0].date).toLocaleDateString() === new Date().toLocaleDateString() && !history[0].clockOutTime
                    ? "Scan to Clock OUT"
                    : "Scan to Clock IN"}
            </h3>

            <div className="w-full flex flex-col md:flex-row gap-8 items-center justify-center">
                {/* Left: Scanner */}
                <div className="flex flex-col items-center">
                    <div id="reader" style={{ width: '300px' }}></div>
                    <p className="mt-2 text-xs text-gray-500">Camera Scan</p>
                </div>

                {/* Divider */}
                <div className="hidden md:flex flex-col items-center justify-center h-48 border-l border-gray-300 mx-4"></div>
                <div className="md:hidden w-full border-t border-gray-300 my-4"></div>

                {/* Right: Manual Code */}
                <div className="flex flex-col items-center p-6 bg-gray-50 rounded-lg shadow-inner">
                    <h4 className="font-medium mb-3 text-gray-700">Enter Code from Screen</h4>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            maxLength={6}
                            value={manualCode}
                            onChange={(e) => setManualCode(e.target.value)}
                            className="border p-2 rounded text-center text-2xl tracking-widest w-40 font-mono"
                            placeholder="000000"
                        />
                    </div>
                    <Button type="primary" onClick={handleManualSubmit} className="mt-4 w-full" size="large">Submit Code</Button>
                </div>
            </div>
        </div>
    );
};

const AdminQRGenerator = () => {
    const [qrValue, setQrValue] = useState('');
    const [code, setCode] = useState('------');
    const [loading, setLoading] = useState(true);

    const fetchQR = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axiosInstance.get('/api/attendance/generate-qr', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setQrValue(res.data.token);
            // Ensure backend sends 'code'. If undefined, show placeholder/error logic if critical
            setCode(res.data.code || '------');
            setLoading(false);
        } catch (err) {
            console.error("Failed to generate QR", err);
        }
    };

    useEffect(() => {
        fetchQR();
        const interval = setInterval(fetchQR, 45000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="flex flex-col items-center">
            {loading ? <p>Generating Secure QR...</p> : (
                <div className="flex flex-col items-center space-y-8 p-6 bg-white rounded-xl shadow-sm border">
                    <div className="p-2 bg-white rounded">
                        <QRCodeCanvas value={qrValue} size={250} level={"H"} />
                    </div>

                    <div className="text-center w-full bg-indigo-50 p-4 rounded-lg">
                        <p className="text-indigo-600 font-semibold mb-1 uppercase text-xs tracking-wider">Verification Code</p>
                        <h2 className="text-6xl font-mono font-bold tracking-[0.2em] text-indigo-600">{code}</h2>
                    </div>

                    <div className="text-center">
                        <Tag color="red" className="mb-2">Refreshes every 45s</Tag>
                        <p className="text-gray-400 text-sm">Students can scan QR OR enter the code above.</p>
                    </div>
                </div>
            )}
        </div>
    );
};

const TeamAttendanceTab = () => {
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchAll = async () => {
            setLoading(true);
            try {
                const token = localStorage.getItem('token');
                const res = await axiosInstance.get('/api/attendance', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setRecords(res.data);
            } catch (err) {
                message.error('Failed to load team attendance');
            }
            setLoading(false);
        };
        fetchAll();
    }, []);

    const columns = [
        { title: 'Employee', dataIndex: ['user', 'username'] },
        { title: 'Date', dataIndex: 'date', render: d => new Date(d).toLocaleDateString() },
        { title: 'In', dataIndex: 'clockInTime', render: d => d ? new Date(d).toLocaleTimeString() : '-' },
        { title: 'Out', dataIndex: 'clockOutTime', render: d => d ? new Date(d).toLocaleTimeString() : '-' },
        { title: 'Status', dataIndex: 'status', render: s => <Tag color={s === 'Present' ? 'green' : 'red'}>{s}</Tag> },
    ];

    return <Table dataSource={records} columns={columns} rowKey="_id" loading={loading} />;
};

export default Attendance;
