
import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';

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
                    const res = await axios.get('http://localhost:5000/api/auth/me', {
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
        window.location.href = 'http://localhost:5000/api/auth/discord';
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
