import { useNavigate } from 'react-router-dom';
import Button from './Button';
import JoinRoomInput from './JoinRoomInput';
import useAuth from '../hooks/useAuth';

const Header = ({ onJoinRoom }) => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const displayRole = user?.role === 'teacher' ? 'Giáo viên' : 'Học sinh';

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  const handleJoinRoom = (roomCode) => {
    onJoinRoom?.(roomCode);
  };

  return (
    <header className="relative flex h-[70px] w-full items-center gap-4 bg-transparent px-5">
      <img
        src="/logo.png"
        alt="Nhận diện cảm xúc"
        className="h-[60px] cursor-pointer object-contain"
        onClick={() => navigate('/')}
      />

      <div className="flex flex-1 justify-center">
        <JoinRoomInput onJoin={handleJoinRoom} />
      </div>

      <div className="flex items-center gap-[10px]">
        <span className="text-center text-[20px] font-medium text-black">{displayRole}</span>
        <Button
          type="text"
          htmlType="button"
          onClick={handleLogout}
          title="Đăng xuất"
          aria-label="Đăng xuất"
          className="!h-[45px] !w-[45px] !rounded-full !border-0 !bg-transparent !p-0 !shadow-none hover:!ring-2 hover:!ring-white/50"
        >
          <img src="/avatar.png" alt="Avatar" className="h-[45px] w-[45px] rounded-full bg-[#ccc] object-cover" />
        </Button>
      </div>
    </header>
  );
};

export default Header;
