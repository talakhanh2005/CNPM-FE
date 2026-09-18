export const loginApi = async (credentials) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const username = credentials.username?.trim().toLowerCase();
      const password = credentials.password;

      const accounts = {
        student: {
          password: 'student123',
          fullName: 'Học Sinh Demo',
          role: 'student',
        },
        teacher: {
          password: 'teacher123',
          fullName: 'Thầy Giáo Demo',
          role: 'teacher',
        },
      };

      if (!username || !password) {
        reject(new Error('Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu!'));
        return;
      }

      const account = accounts[username];

      if (!account) {
        reject(new Error('Tên đăng nhập không đúng!'));
        return;
      }
      else if (account.password !== password) {
        reject(new Error('Mật khẩu không đúng!'));
        return;
      }

      resolve({
        success: true,
        message: 'Đăng nhập thành công',
        data: {
          accessToken: 'demo-access-token',
          user: {
            username,
            fullName: account.fullName,
            role: account.role,
          },
        },
      });
    }, 500);
  });
};