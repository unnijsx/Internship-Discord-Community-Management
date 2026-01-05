import axios from 'axios';

const axiosInstance = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'https://internship-discord-community-manage.vercel.app/',
});

export default axiosInstance;
