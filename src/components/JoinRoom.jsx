import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Lobby from '../layouts/Lobby';
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
      <Lobby
        onMediaChange={setLobbyMedia}
        roomCode={roomCode}
        roomTitle={`Phòng học #${roomCode}`}
      >
        <div className="flex flex-col gap-4 bg-surface-container-lowest border-[3px] border-pure-black p-5 shadow-[4px_4px_0px_#000000]">
          {error && (
            <p className="p-2.5 bg-tertiary-container border-[2px] border-pure-black text-on-tertiary-container font-bold text-body-sm text-center">
              {error}
            </p>
          )}

          <div className="flex flex-col gap-2.5">
            <button
              type="button"
              disabled={isJoining}
              onClick={handleJoin}
              className="w-full py-4 bg-bright-yellow text-pure-black border-[3px] border-pure-black font-headline font-bold text-headline-sm uppercase tracking-wide shadow-[4px_4px_0px_#000000] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_#000000] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <span>{isJoining ? 'Đang kết nối...' : 'Vào phòng học ngay'}</span>
              <span className="material-symbols-outlined text-2xl font-bold">arrow_forward</span>
            </button>

            <button
              type="button"
              onClick={handleBack}
              className="w-full py-2.5 bg-surface text-on-surface border-[2px] border-pure-black font-label-md font-bold shadow-[2px_2px_0px_#000000] hover:bg-surface-container active:translate-x-[2px] active:translate-y-[2px] transition-all cursor-pointer"
            >
              Quay lại
            </button>
          </div>
        </div>
      </Lobby>
    </div>
  );
};

export default JoinRoom;
