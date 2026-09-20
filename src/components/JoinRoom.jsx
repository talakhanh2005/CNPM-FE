import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Lobby from '../layouts/Lobby';
import Button from './Button';

const JoinRoom = ({ roomCode, onBack }) => {
  const navigate = useNavigate();
  const [isExiting, setIsExiting] = useState(false);

  const handleBack = () => setIsExiting(true);

  return (
    <div
      onAnimationEnd={isExiting ? (onBack || (() => navigate(-1))) : undefined}
      className={isExiting ? 'join-room-exit h-full' : 'h-full'}
    >
      <Lobby>
        <div className="flex h-full flex-col justify-end gap-3">
          <Button
            type="button"
            onClick={() => navigate(`/meeting/${roomCode}`)}
            className="!h-[50px] !w-full !rounded-full !bg-[#1E7DFF] !px-6 !text-[16px] !font-bold !text-white hover:!bg-[#0A6BE6]"
          >
            Tham gia
          </Button>
          <Button
            type="button"
            onClick={handleBack}
            className="!h-[50px] !w-full !rounded-full !border !border-[#1E7DFF] !bg-white !px-6 !text-[16px] !font-bold !text-[#1E7DFF] !shadow-none hover:!bg-[#EFF7FF]"
          >
            Quay lại
          </Button>
        </div>
      </Lobby>
      <style>{`
        @keyframes joinRoomExit {
          from {
            opacity: 1;
            transform: scale(1);
          }
          to {
            opacity: 0;
            transform: scale(0);
          }
        }

        .join-room-exit {
          transform-origin: center;
          animation: joinRoomExit 380ms cubic-bezier(0.4, 0, 1, 1) forwards;
          pointer-events: none;
        }
      `}</style>
    </div>
  );
};

export default JoinRoom;
