// File: src/pages/Register.jsx
import { Form, Input, Radio } from 'antd';
import { Link, useNavigate } from 'react-router-dom';
import AuthLayout from '../layouts/AuthLayout';
import Button from '../components/Button';

const Register = () => {
  const navigate = useNavigate();

  const onFinish = (values) => {
    console.log('Dữ liệu đăng ký:', values);
    // Xử lý gọi API đăng ký ở đây. Thành công thì chuyển sang Login
    navigate('/login'); 
  };

  return (
    <AuthLayout>
      <div className="w-full rounded-[30px] bg-white p-[40px] font-['Roboto'] shadow-[0_8px_30px_rgba(0,0,0,0.06)]">
        
        {/* Header */}
        <div className="mb-[28px]">
          <div className="mb-3 inline-block rounded-full bg-[#FFF2CF] px-3 py-2">
            <span className="text-[13px] font-bold text-[#8D2F15]">Hệ thống nhận diện cảm xúc</span>
          </div>
          <h1 className="mb-3 text-[40px] font-bold leading-[1.15] text-[#241B17]">Đăng ký</h1>
          <p className="m-0 text-[16px] leading-[1.5] text-[#7A6A5E]">Tạo tài khoản mới để tham gia vào hệ thống.</p>
        </div>

        {/* Form Đăng ký */}
        <Form
          layout="vertical"
          onFinish={onFinish}
          requiredMark={false}
          initialValues={{ role: 'student' }} // Mặc định chọn Học sinh
        >
          {/* Lựa chọn Vai trò (Giáo viên / Học sinh) */}
          <Form.Item
            name="role"
            className="!mb-5 [&_.ant-form-item-control]:mt-0"
          >
            <Radio.Group className="flex gap-6">
              <Radio value="student" className="text-[16px] font-semibold text-[#4A3B32]">Học sinh</Radio>
              <Radio value="teacher" className="text-[16px] font-semibold text-[#4A3B32]">Giáo viên</Radio>
            </Radio.Group>
          </Form.Item>

          {/* Tên đăng nhập */}
          <Form.Item
            label={<span className="text-[16px] font-semibold text-[#4A3B32]">Tên đăng nhập</span>}
            name="username"
            rules={[{ required: true, message: 'Vui lòng nhập tên đăng nhập!' }]}
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
            className="!mb-6 [&_.ant-form-item-control]:mt-0 [&_.ant-form-item-label]:pb-2 [&_.ant-form-item-label>label]:h-auto"
          >
            <Input.Password
              placeholder="Nhập mật khẩu"
              visibilityToggle={false}
              className="!h-[56px] !rounded-[16px] !bg-[#FFFEF8] !border-[#E8D8C3] hover:!border-[#1E7DFF] focus:!border-[#1E7DFF] !px-[18px] !text-[16px] !text-[#4A3B32] !shadow-none placeholder:!text-[#A08F80] [&>input]:!bg-transparent [&>input]:!font-['Roboto'] [&>input]:!text-[16px] [&>input]:!text-[#4A3B32]"
            />
          </Form.Item>

          {/* Xác nhận mật khẩu (Có kèm rule check khớp mật khẩu) */}
          <Form.Item
            label={<span className="text-[16px] font-semibold text-[#4A3B32]">Xác nhận mật khẩu</span>}
            name="confirmPassword"
            dependencies={['password']} // Bám theo sự thay đổi của field password
            rules={[
              { required: true, message: 'Vui lòng xác nhận mật khẩu!' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('password') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('Mật khẩu xác nhận không khớp!'));
                },
              }),
            ]}
            className="!mb-8 [&_.ant-form-item-control]:mt-0 [&_.ant-form-item-label]:pb-2 [&_.ant-form-item-label>label]:h-auto"
          >
            <Input.Password
              placeholder="Nhập lại mật khẩu"
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
              className="!h-auto !rounded-[16px] !px-6 !py-4 !text-[18px] !font-bold !leading-[22px] !shadow-[0_12px_28px_rgba(30,125,255,0.2)] hover:!bg-[#0a6be6] hover:!shadow-[0_14px_32px_rgba(30,125,255,0.3)]"
            >
              Đăng ký
            </Button>
          </Form.Item>
        </Form>

        {/* Link chuyển trang */}
        <div className="text-center text-[16px] mt-2">
          <Link to="/login" className="text-[#6E5E53] transition-all hover:text-[#1E7DFF] hover:underline">
            Đã có tài khoản? Đăng nhập
          </Link>
        </div>
        
      </div>
    </AuthLayout>
  );
};

export default Register;