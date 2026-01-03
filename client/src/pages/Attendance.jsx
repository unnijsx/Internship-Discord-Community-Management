
import React, { useState, useEffect, useContext } from 'react';
import { Card, Button, Tabs, message, Table, Tag } from 'antd';
import { Html5QrcodeScanner } from 'html5-qrcode';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { QRCodeCanvas } from 'qrcode.react'; // Need to install this

const Attendance = () => {
    const { user } = useContext(AuthContext);
    const [history, setHistory] = useState([]);
    const [scannedResult, setScannedResult] = useState('');

    const fetchHistory = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`http://localhost:5000/api/attendance/${user._id}`, {
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

    // QR Code Scanner Logic
    useEffect(() => {
        const scannerId = "reader";

        // Only initialize scanner if element exists
        if (document.getElementById(scannerId)) {
            const scanner = new Html5QrcodeScanner(scannerId, { fps: 10, qrbox: 250 }, false);

            scanner.render(async (decodedText) => {
                scanner.clear();
                try {
                    // Determine action based on last history
                    const today = new Date().toLocaleDateString();
                    const lastEntry = history[0]; // Assuming sorted desc
                    let action = 'start';

                    if (lastEntry && new Date(lastEntry.date).toLocaleDateString() === today && !lastEntry.clockOutTime) {
                        action = 'end';
                    }

                    const token = localStorage.getItem('token');
                    const res = await axios.post('http://localhost:5000/api/attendance/scan',
                        { userId: user._id, qrToken: decodedText, start_or_end: action },
                        { headers: { Authorization: `Bearer ${token}` } }
                    );
                    message.success(res.data.message);
                    fetchHistory();
                } catch (err) {
                    message.error(err.response?.data?.message || 'Scan Failed');
                    // Restart scanner after failure?
                    // form logic might require page refresh or re-init
                }
            }, (err) => {
                // Ignore errors
            });

            // Cleanup
            return () => {
                scanner.clear().catch(error => console.error("Failed to clear html5-qrcode scanner. ", error));
            };
        }
    }, [user]); // Re-run if user changes? Better on specific tab activation

    const columns = [
        { title: 'Date', dataIndex: 'date', render: (d) => new Date(d).toLocaleDateString() },
        { title: 'In', dataIndex: 'clockInTime', render: (d) => d ? new Date(d).toLocaleTimeString() : '-' },
        { title: 'Out', dataIndex: 'clockOutTime', render: (d) => d ? new Date(d).toLocaleTimeString() : '-' },
        { title: 'Method', dataIndex: 'method', render: (m) => <Tag color="blue">{m}</Tag> },
        { title: 'Duration (m)', dataIndex: 'durationMinutes' },
    ];

    return (
        <div className="p-4">
            <h1 className="text-2xl font-bold mb-4">Attendance</h1>

            <Tabs defaultActiveKey="1" items={[
                {
                    key: '1',
                    label: 'My History',
                    children: <Table dataSource={history} columns={columns} rowKey="_id" />
                },
                {
                    key: '2',
                    label: 'Scan QR (Clock In/Out)',
                    children: (
                        <div className="flex flex-col items-center">
                            <h3 className="text-lg font-semibold mb-2">
                                {history[0] && new Date(history[0].date).toLocaleDateString() === new Date().toLocaleDateString() && !history[0].clockOutTime
                                    ? "Scan to Clock OUT"
                                    : "Scan to Clock IN"}
                            </h3>
                            <div id="reader" style={{ width: '300px' }}></div>
                            <p className="mt-4 text-gray-500">Scan the Campus QR Code to mark attendance</p>
                        </div>
                    )
                },
                {
                    key: '3',
                    label: 'Admin: Generate QR',
                    children: (
                        <div className="flex flex-col items-center">
                            <QRCodeCanvas value="CAMPUS_LOCATION_ID_123" size={256} />
                            <p className="mt-2">Print this QR Code and place it at the front desk.</p>
                        </div>
                    )
                }
            ].filter(tab => {
                if (tab.key === '3') {
                    return user?.isSuperAdmin || user?.roles?.some(r => r.permissions?.canManageUsers || r.name.includes('LEAD') || r.name === 'MANAGER' || r.name.includes('TRAINER'));
                }
                return true;
            })} />
        </div>
    );
};

export default Attendance;
