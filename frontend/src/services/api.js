import axios from 'axios';

const apiBaseUrl = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
    baseURL: apiBaseUrl,
});

export const getImageUrl = (path) => {
    if (!path) return '';
    if (path.startsWith('http')) return path;

    const assetBaseUrl = apiBaseUrl.startsWith('http')
        ? apiBaseUrl.replace(/\/api\/?$/, '')
        : '';

    return `${assetBaseUrl}${path}`;
};

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export default api;
