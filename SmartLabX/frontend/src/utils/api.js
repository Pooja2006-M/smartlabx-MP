import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000/api',
});

// Add a request interceptor to attach JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// RAISE (Recovery-Aware Intervention Selection Engine) client
export const raiseApi = {
  attempt: (payload) => api.post('/raise/attempt', payload).then((res) => res.data),
  hint: (payload) => api.post('/raise/hint', payload).then((res) => res.data),
  verify: (payload) => api.post('/raise/verify', payload).then((res) => res.data),
  state: (studentId) => api.get(`/raise/state/${encodeURIComponent(studentId)}`).then((res) => res.data),
  ledger: (studentId) => api.get(`/raise/ledger/${encodeURIComponent(studentId)}`).then((res) => res.data),
};

export default api;
