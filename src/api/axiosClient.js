import axios from 'axios';

const axiosClient = axios.create({
  baseURL: 'http://localhost:8000/api', // Đường dẫn tới Backend FastAPI (sau này đổi lại sau)
  headers: {
    'Content-Type': 'application/json',
  },
});

// Tự động gắn Token vào mọi request gửi đi
axiosClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Tự động bắt lỗi nếu Token hết hạn (401)
axiosClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('user');
      window.location.href = '/login'; // Đuổi về trang login
    }
    return Promise.reject(error);
  }
);

export default axiosClient;