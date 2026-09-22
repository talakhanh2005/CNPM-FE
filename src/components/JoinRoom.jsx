import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Lobby from '../layouts/Lobby';
import Button from './Button';
import { joinRoom } from '../api/meetingApi';
import { getApiErrorMessage } from '../api/axiosClient';
import { retainMediaStream } from '../utils/mediaSession';

const JoinRoom = ({ roomCode, onClose }) => {
  const navigate = useNavigate();
  const [lobbyMedia, setLobbyMedia] = useState({ camera: false, mic: false, stream: null });
  const [isExiting, setIsExiting] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState('');

  const handleBack = () => setIsExiting(true);
  const handleJoin = async () => {
    try {
      setIsJoining(true);
      setError('');
      const room = await joinRoom(roomCode);
      const mediaSessionId = retainMediaStream(lobbyMedia.stream);
      navigate(`/meeting/${room.id}`, {
        state: {
          media: {
            camera: lobbyMedia.camera,
            mic: lobbyMedia.mic,
            mediaSessionId,
            cameraDeviceId: lobbyMedia.cameraDeviceId,
            micDeviceId: lobbyMedia.micDeviceId,
            speakerDeviceId: lobbyMedia.speakerDeviceId,
          },
          room,
        },
      });
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Mã phòng không hợp lệ hoặc phòng đã đóng.'));
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <div
      onAnimationEnd={isExiting ? (onClose || (() => navigate(-1))) : undefined}
      className={isExiting ? 'join-room-exit h-full' : 'h-full'}
    >
      <Lobby onMediaChange={setLobbyMedia}>
        <div className="flex h-full flex-col justify-end gap-3">
          {error && <p className="m-0 rounded-xl bg-[#fff0ed] px-3 py-2 text-center text-sm text-[#b33b25]">{error}</p>}
          <Button
            type="primary"
            loading={isJoining}
            disabled={isJoining}
            onClick={handleJoin}
            className="!h-[50px] !w-full !rounded-full !bg-[#1E7DFF] !px-6 !text-[16px] !font-bold !text-white hover:!bg-[#0A6BE6]"
          >
            Tham gia
          </Button>
          <Button
            type="default"
            onClick={handleBack}
            className="!h-[50px] !w-full !rounded-full !border !border-[#1E7DFF] !bg-white !px-6 !text-[16px] !font-bold !text-[#1E7DFF] !shadow-none hover:!bg-[#EFF7FF]"
          >
            Quay lại
          </Button>
        </div>
      </Lobby>
    </div>
  );
};

export default JoinRoom;
