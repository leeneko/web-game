// src/api.js
import axios from 'axios';

// 개발 환경일 때는 REACT_APP_API_URL을 사용하고,
// 배포 환경(production)일 때는 상대 경로를 사용하도록 설정
const baseURL = process.env.NODE_ENV === 'production'
    ? '/'
    : process.env.REACT_APP_API_URL || 'http://localhost:4000';

const api = axios.create({
    baseURL: baseURL,
    withCredentials: true,
});

export default api;