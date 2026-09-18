// File: src/pages/Login.jsx
import { useState } from 'react';
import { Form, Input } from 'antd';
import { Link } from 'react-router-dom';
import { loginApi } from '../api/authApi';
import AuthLayout from '../layouts/AuthLayout';
import Button from '../components/Button';


const Login = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const onFinish = async (values) => {
    try {
      setLoading(true);
      
      // Gọi hàm trong Auth.js
      const response = await loginApi(values);

      if (response.success) {
        const { accessToken, user } = response.data;

        // Lưu token và user vào localStorage
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('user', JSON.stringify(user));

        // Tải lại route gốc để App đọc accessToken mới và mở Home
        window.location.replace('/');
      }
    } catch (error) {
      const errorMessage = error.message || 'Đăng nhập thất bại!';
      const fieldName = errorMessage.includes('Tên đăng nhập') ? 'username' : 'password';

      form.setFields([
        {
          name: fieldName,
          errors: [errorMessage],
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <div className="w-full rounded-[30px] bg-white p-[40px] font-['Roboto'] shadow-[0_8px_30px_rgba(0,0,0,0.06)]">
        
        {/* Header */}
        <div className="mb-[28px]">
          <div className="mb-3 inline-block rounded-full bg-[#FFF2CF] px-3 py-2">
            <span className="text-[13px] font-bold text-[#8D2F15]">Hệ thống nhận diện cảm xúc</span>
          </div>
          <h1 className="mb-3 text-[40px] font-bold leading-[1.15] text-[#241B17]">Đăng nhập</h1>
          <p className="m-0 text-[16px] leading-[1.5] text-[#7A6A5E]">Nhập thông tin tài khoản để tiếp tục vào hệ thống.</p>
        </div>

        {/* Form Đăng nhập */}
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          requiredMark={false}
        >
          {/* Tên đăng nhập */}
          <Form.Item
            label={<span className="text-[16px] font-semibold text-[#4A3B32]">Tên đăng nhập</span>}
            name="username"
            rules={[{ required: true, message: 'Vui lòng nhập tên đăng nhập!' }]}
            // Đã bỏ absolute, dùng margin bottom vừa đủ để dòng lỗi có chỗ hiện mà không làm vỡ form
            className="!mb-6 [&_.ant-form-item-control]:mt-0 [&_.ant-form-item-label]:pb-2 [&_.ant-form-item-label>label]:h-auto"
          >
            <Input
              placeholder="Nhập tên đăng nhập"
              className="!h-[56px] !rounded-[16px] !bg-[#FFFEF8] !border-[#E8D8C3] hover:!border-[#1E7DFF] focus:!border-[#1E7DFF] !px-[18px] !text-[16px] !text-[#4A3B32] !shadow-none placeholder:!text-[#A08F80]"
            />
          </Form.Item>

          {/* Mật khẩu */}
          <Form.Item
            label={<span className="text-[16px] font-semibold text-[#4A3B32]">Mật khẩu</span>}
            name="password"
            rules={[{ required: true, message: 'Vui lòng nhập mật khẩu!' }]}
            className="!mb-8 [&_.ant-form-item-control]:mt-0 [&_.ant-form-item-label]:pb-2 [&_.ant-form-item-label>label]:h-auto"
          >
            <Input.Password
              placeholder="Nhập mật khẩu"
              visibilityToggle={false}
              className="!h-[56px] !rounded-[16px] !bg-[#FFFEF8] !border-[#E8D8C3] hover:!border-[#1E7DFF] focus:!border-[#1E7DFF] !px-[18px] !text-[16px] !text-[#4A3B32] !shadow-none placeholder:!text-[#A08F80] [&>input]:!bg-transparent [&>input]:!font-['Roboto'] [&>input]:!text-[16px] [&>input]:!text-[#4A3B32]"
            />
          </Form.Item>

          {/* Nút Submit */}
          <Form.Item className="mb-4 [&_.ant-form-item-control]:mt-0">
            <Button
              type="primary"
              htmlType="submit" 
              block
              loading={loading}
              className="!h-auto !rounded-[16px] !px-6 !py-4 !text-[18px] !font-bold !leading-[22px]"
            >
              Đăng nhập
            </Button>
          </Form.Item>
        </Form>

        {/* Link chuyển trang */}
        <div className="text-center text-[16px] mt-2">
          <Link to="/register" className="text-[#6E5E53] transition-all hover:text-[#1E7DFF] hover:underline">
            Chưa có tài khoản
          </Link>
        </div>
        
      </div>
    </AuthLayout>
  );
};

export default Login;