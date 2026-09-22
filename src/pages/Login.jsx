import { useState } from 'react';
import { Form, Input, Radio } from 'antd';
import { Link, useNavigate } from 'react-router-dom';
import AuthLayout from '../layouts/AuthLayout';
import Button from '../components/Button';
import useAuth from '../hooks/useAuth';
import { getApiErrorMessage } from '../api/axiosClient';

const Login = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const onFinish = async (values) => {
    try {
      setLoading(true);
      await login(values);
      navigate('/', { replace: true });
    } catch (error) {
      form.setFields([{ name: 'username', errors: [getApiErrorMessage(error, 'Đăng nhập thất bại.')] }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <div className="w-full rounded-[30px] bg-white p-8 font-['Roboto'] shadow-[0_8px_30px_rgba(0,0,0,0.06)] sm:p-10">
        <div className="mb-7">
          <div className="mb-3 inline-block rounded-full bg-[#FFF2CF] px-3 py-2 text-[13px] font-bold text-[#8D2F15]">Hệ thống nhận diện cảm xúc</div>
          <h1 className="m-0 text-[40px] font-bold leading-[1.15] text-[#241B17]">Đăng nhập</h1>
          <p className="m-0 mt-3 text-[16px] leading-[1.5] text-[#7A6A5E]">Chọn đúng vai trò rồi nhập thông tin để tiếp tục.</p>
        </div>

        <Form form={form} layout="vertical" onFinish={onFinish} requiredMark={false} initialValues={{ role: 'student' }} data-testid="login-form">
          <Form.Item name="role" label={<span className="text-[16px] font-semibold text-[#4A3B32]">Vai trò</span>} className="!mb-5 [&_.ant-form-item-label]:pb-2">
            <Radio.Group className="flex gap-6">
              <Radio value="student" className="text-[16px] font-semibold text-[#4A3B32]">Học sinh</Radio>
              <Radio value="teacher" className="text-[16px] font-semibold text-[#4A3B32]">Giáo viên</Radio>
            </Radio.Group>
          </Form.Item>

          <Form.Item name="username" label={<span className="text-[16px] font-semibold text-[#4A3B32]">Tên đăng nhập</span>} rules={[{ required: true, min: 3, message: 'Tên đăng nhập cần ít nhất 3 ký tự.' }]} className="!mb-6 [&_.ant-form-item-label]:pb-2">
            <Input placeholder="Nhập tên đăng nhập" autoComplete="username" className="!h-[56px] !rounded-[16px] !border-[#E8D8C3] !bg-[#FFFEF8] !px-[18px] !text-[16px] !text-[#4A3B32] !shadow-none hover:!border-[#1E7DFF] focus:!border-[#1E7DFF]" />
          </Form.Item>

          <Form.Item name="password" label={<span className="text-[16px] font-semibold text-[#4A3B32]">Mật khẩu</span>} rules={[{ required: true, min: 4, message: 'Mật khẩu cần ít nhất 4 ký tự.' }]} className="!mb-8 [&_.ant-form-item-label]:pb-2">
            <Input.Password placeholder="Nhập mật khẩu" autoComplete="current-password" visibilityToggle={false} className="!h-[56px] !rounded-[16px] !border-[#E8D8C3] !bg-[#FFFEF8] !px-[18px] !text-[16px] !text-[#4A3B32] !shadow-none hover:!border-[#1E7DFF] focus:!border-[#1E7DFF] [&>input]:!bg-transparent" />
          </Form.Item>

          <Form.Item className="mb-4">
            <Button type="primary" htmlType="submit" block loading={loading} className="!h-auto !rounded-[16px] !px-6 !py-4 !text-[18px] !font-bold !leading-[22px]">Đăng nhập</Button>
          </Form.Item>
        </Form>

        <div className="text-center text-[16px]"><Link to="/register" className="text-[#6E5E53] transition-all hover:text-[#1E7DFF] hover:underline">Chưa có tài khoản?</Link></div>
      </div>
    </AuthLayout>
  );
};

export default Login;
