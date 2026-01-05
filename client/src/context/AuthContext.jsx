
import React, { createContext, useState, useEffect } from 'react';
import axiosInstance from '../api/axiosInstance';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkAuth = async () => {
            const params = new URLSearchParams(window.location.search);
            const tokenFromUrl = params.get('token');
            let token = localStorage.getItem('token');

            if (tokenFromUrl) {
                token = tokenFromUrl;
                localStorage.setItem('token', token);
                window.history.replaceState({}, document.title, "/"); // Clean URL
            }


            if (token) {
                try {
                    const res = await axiosInstance.get('/api/auth/me', {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    setUser(res.data);
                } catch (err) {
                    console.error('Auth Error', err);
                    localStorage.removeItem('token');
                }
            }

            setLoading(false);
        };
        checkAuth();
    }, []);

    const login = () => {
        const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000';
        window.location.href = `${apiBase}/api/auth/discord`;
    };

    const logout = () => {
        localStorage.removeItem('token');
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};
