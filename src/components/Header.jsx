import { useNavigate } from 'react-router-dom';
import JoinRoomInput from './JoinRoomInput';

const Header = () => {
  const navigate = useNavigate();

  // Đọc thông tin user từ localStorage
  const userString = localStorage.getItem('user');
  let userData = {};

  if (userString) {
    try {
      userData = JSON.parse(userString);
    } catch {
      localStorage.removeItem('user');
    }
  }
  
  // Chỉ lấy role, nếu không có mặc định là 'Student'. Chuyển đổi thành chữ viết hoa chữ cái đầu.
  const rawRole = userData.role || 'student';
  const displayRole = rawRole === 'teacher' ? 'Teacher' : 'Student';

  // Chức năng đăng xuất khi bấm vào Avatar
  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const handleJoinRoom = (roomCode) => {
    console.log('Mã phòng:', roomCode);
  };

  return (
    <header className="relative flex h-[70px] w-full items-center gap-4 bg-transparent px-5">
      
      {/* ── Logo ── */}
      <img 
        src="/logo.png" 
        alt="Nhận diện cảm xúc" 
        className="h-[60px] object-contain cursor-pointer"
        onClick={() => navigate('/')}
      />

      <div className="flex flex-1 justify-center">
        <JoinRoomInput onJoin={handleJoinRoom} />
      </div>

      {/* ── User Info ── */}
      <div className="flex items-center gap-[10px]">
        {/* Chỉ hiển thị Role ở đây */}
        <span className="text-center font-['Roboto'] text-[20px] font-medium text-black">
          {displayRole}
        </span>
        
        <img 
          src="/avatar.png" 
          alt="Avatar" 
          className="w-[45px] h-[45px] rounded-full object-cover bg-[#ccc] cursor-pointer hover:ring-2 hover:ring-white/50 transition-all"
          onClick={handleLogout}
          title="Đăng xuất"
        />
      </div>
      
    </header>
  );
};

export default Header;