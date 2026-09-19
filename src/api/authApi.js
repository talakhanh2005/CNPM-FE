import axiosClient from './axiosClient';

export const loginApi = async (credentials) => {
  // Nào chốt json thì xài sau
  // return await axiosClient.post('/auth/login', credentials);

  // Mock Data
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const { username, password } = credentials;
      
      
      if (username === 'teacher' && password === 'teacher') {
        resolve({
          success: true,
          data: {
            username: 'teacher',
            role: 'teacher',
            token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...', // Chuỗi JWT token
            expiresIn: 3600 // giây
          }
        });
      } else if (username === 'student' && password === 'student') {
        resolve({
          success: true,
          data: {
            username: 'student',
            role: 'student',
            token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
            expiresIn: 3600
          }
        });
      } else {
        reject(new Error('Tài khoản hoặc mật khẩu không chính xác!'));
      }
    }, 1000);
  });
};

export const registerApi = async (userData) => {
  // Có backend thì xài
  // return await axiosClient.post('/auth/register', userData);

  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ success: true, message: 'Đăng ký thành công!' });
    }, 1000);
  });
};