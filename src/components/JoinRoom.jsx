import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Lobby from '../layouts/Lobby';
import { joinRoom, lookupRoomCode } from '../api/meetingApi';
import { getApiErrorMessage } from '../api/axiosClient';
import { retainMediaStream } from '../utils/mediaSession';

const JoinRoom = ({ roomCode, onClose }) => {
  const navigate = useNavigate();
  const [lobbyMedia, setLobbyMedia] = useState({ camera: false, mic: false, stream: null });
  const [isExiting, setIsExiting] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState('');
  // The code is verified before the lobby (and the camera) opens: a wrong code never reaches it.
  const [codeCheck, setCodeCheck] = useState({ status: 'checking', message: '' });

  useEffect(() => {
    let active = true;
    lookupRoomCode(roomCode)
      .then(() => { if (active) setCodeCheck({ status: 'ok', message: '' }); })
      .catch((requestError) => {
        if (!active) return;
        const status = requestError?.response?.status;
        const message = {
          404: 'Mã phòng không tồn tại. Hãy kiểm tra lại mã.',
          409: 'Phòng này không còn hoạt động hoặc đã được đóng.',
          403: 'Bạn không có quyền vào phòng này.',
        }[status] || getApiErrorMessage(requestError, 'Không thể kiểm tra mã phòng.');
        setCodeCheck({ status: 'invalid', message });
      });
    return () => { active = false; };
  }, [roomCode]);

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

  if (codeCheck.status !== 'ok') {
    const invalid = codeCheck.status === 'invalid';
    return (
      <div className="flex h-full min-h-0 items-center justify-center p-6" role={invalid ? 'alert' : 'status'}>
        <div className="max-w-md border-[3px] border-pure-black bg-surface-container-lowest p-6 text-center shadow-[6px_6px_0px_#000000]">
          <p className="font-headline text-headline-sm font-bold">
            {invalid ? `Phòng #${roomCode}` : 'Đang kiểm tra mã phòng...'}
          </p>
          {invalid && <p className="mt-2 font-bold text-on-tertiary-container">{codeCheck.message}</p>}
          {invalid && (
            <button
              type="button"
              onClick={() => (onClose ? onClose() : navigate(-1))}
              className="mt-4 cursor-pointer border-[3px] border-pure-black bg-bright-yellow px-4 py-2 font-bold shadow-[3px_3px_0px_#000000]"
            >
              Quay lại
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      onAnimationEnd={isExiting ? (onClose || (() => navigate(-1))) : undefined}
      className={isExiting ? 'join-room-exit min-h-0 h-full flex flex-col' : 'min-h-0 h-full flex flex-col'}
    >
      <Lobby
        onMediaChange={setLobbyMedia}
        roomCode={roomCode}
        roomTitle={`Phòng học #${roomCode}`}
        onClose={handleBack}
      >
        <div className="flex flex-col gap-3 bg-surface-container-lowest border-[3px] border-pure-black p-4 shadow-[4px_4px_0px_#000000]">
          <div className="bg-surface-container-low border-[2px] border-pure-black p-3">
            <span className="text-label-xs font-bold uppercase text-on-surface-variant block mb-1">
              Thông tin phiên học
            </span>
            <p className="text-body-sm font-bold text-on-surface">
              Bạn đang chuẩn bị tham gia vào lớp học trực tuyến. Vui lòng kiểm tra Micro &amp; Camera trước khi kết nối.
            </p>
          </div>

          {error && (
            <p className="p-2 bg-tertiary-container border-[2px] border-pure-black text-on-tertiary-container font-bold text-label-xs text-center">
              {error}
            </p>
          )}

          <div className="flex flex-col gap-2 pt-1">
            <button
              type="button"
              disabled={isJoining}
              onClick={handleJoin}
              className="w-full py-3 bg-bright-yellow text-pure-black border-[3px] border-pure-black font-headline font-bold text-label-lg uppercase tracking-wide shadow-[3px_3px_0px_#000000] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_#000000] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <span>{isJoining ? 'Đang kết nối...' : 'Vào phòng học ngay'}</span>
              <span className="material-symbols-outlined text-[20px] font-bold">arrow_forward</span>
            </button>

            <button
              type="button"
              onClick={handleBack}
              className="w-full py-2 bg-surface text-on-surface border-[2px] border-pure-black text-label-xs font-bold shadow-[2px_2px_0px_#000000] hover:bg-surface-container active:translate-x-[1px] active:translate-y-[1px] transition-all cursor-pointer text-center"
            >
              Quay lại / Đóng
            </button>
          </div>
        </div>
      </Lobby>
    </div>
  );
};

export default JoinRoom;
