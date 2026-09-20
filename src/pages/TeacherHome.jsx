import { useState } from 'react';
import HomeLayout from '../layouts/HomeLayout';
import Button from '../components/Button';
import NewRoom from '../components/NewRoom';
import History from '../components/HistoryRoom';
import JoinRoom from '../components/JoinRoom';

const menuItems = [
  {
    id: 'new-room',
    label: 'Cuộc họp',
    icon: '/newroom.png',
    iconClass: 'h-[18px] w-auto',
    content: NewRoom,
  },
  {
    id: 'history',
    label: 'Lịch sử',
    icon: '/schedule.png',
    iconClass: 'h-[18px] w-auto',
    content: History,
  },
];

const TeacherHome = () => {
  const [activeMenu, setActiveMenu] = useState(null);
  const [joinRoomCode, setJoinRoomCode] = useState(null);
  const activeItem = menuItems.find((item) => item.id === activeMenu);
  const Content = activeItem?.content;

  return (
    <>
      <style>{`
        @keyframes teacherContentEnter {
          from {
            opacity: 0;
            transform: scale(0.92);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        .teacher-content-enter {
          transform-origin: center;
          animation: teacherContentEnter 380ms cubic-bezier(0.22, 1, 0.36, 1);
        }
      `}</style>
      

      <HomeLayout onJoinRoom={(roomCode) => setJoinRoomCode(roomCode)}>
        <div className="absolute inset-0 z-20 flex w-full flex-col gap-8 px-5 pb-8 pt-8 md:flex-row md:gap-8">
          <nav className="flex shrink-0 flex-row justify-center gap-5 md:w-[80px] md:flex-col md:justify-start md:gap-6">
            {menuItems.map((item) => {
              const isActive = activeMenu === item.id;

              return (
                <div
                  key={item.id}
                  className="group flex w-[80px] flex-col items-center gap-1 text-center"
                >
                  <Button
                    onClick={() => {
                      setJoinRoomCode(null);
                      setActiveMenu(item.id);
                    }}
                    aria-pressed={isActive}
                    className={`!h-[35px] !min-h-0 !w-[56px] !rounded-full !p-0 !shadow-none ${
                      isActive
                        ? '!bg-[#B9E1F8]'
                        : '!bg-transparent hover:!bg-[#E7E8EA]'
                    }`}
                  >
                    <img
                      src={item.icon}
                      alt=""
                      className={`${item.iconClass} object-contain`}
                    />
                  </Button>
                  <span
                    className={`text-[14px] leading-none transition-colors ${
                      isActive
                        ? 'text-[#00689D]'
                        : 'text-[#222] group-hover:text-[#555]'
                    }`}
                  >
                    {item.label}
                  </span>
                </div>
              );
            })}
          </nav>

          <main className="min-w-0 flex-1">
            {joinRoomCode ? (
              <div className="h-full w-full teacher-content-enter">
                <JoinRoom roomCode={joinRoomCode} onBack={() => setJoinRoomCode(null)} />
              </div>
            ) : Content && (
              <div key={activeMenu} className="teacher-content-enter h-full w-full">
                <Content onExit={() => setActiveMenu(null)} />
              </div>
            )}
          </main>
        </div>
      </HomeLayout>
    </>
  );
};

export default TeacherHome;
