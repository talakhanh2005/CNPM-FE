import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Lobby from '../layouts/Lobby';
import Button from './Button';
import { createRoom } from '../api/meetingApi';
import { getApiErrorMessage } from '../api/axiosClient';
import { retainMediaStream } from '../utils/mediaSession';

const participantOptions = [
  { value: 'free', title: 'Tự do', description: 'Ai có mã phòng đều có thể tham gia.' },
  { value: 'approval', title: 'Đợi duyệt', description: 'Giáo viên duyệt trước khi vào phòng.' },
];

const NewRoom = ({ onClose }) => {
  const navigate = useNavigate();
  const [participantMode, setParticipantMode] = useState('free');
  const [emotionRecognition, setEmotionRecognition] = useState(true);
  const [lobbyMedia, setLobbyMedia] = useState({ camera: false, mic: false, stream: null });
  const [isExiting, setIsExiting] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState('');
  const handleClose = () => setIsExiting(true);
  const handleCreateRoom = async () => {
    try {
      setIsCreating(true);
      setError('');
      const room = await createRoom({ participantMode, emotionRecognition });
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
      setError(getApiErrorMessage(requestError, 'Không thể tạo phòng. Vui lòng thử lại.'));
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div onAnimationEnd={isExiting ? onClose : undefined} className={`${isExiting ? 'new-room-exit ' : ''}h-full`}>
      <Lobby onMediaChange={setLobbyMedia}>
        <div className="grid h-full grid-cols-2 gap-5 [&>button]:!mt-0">
          <fieldset className="col-span-2 space-y-6">
            <legend className="mb-3 text-[15px] font-bold text-[#4A3B32]">Quản lý người tham gia</legend>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {participantOptions.map((option) => {
                const isSelected = participantMode === option.value;

                return (
                  <label
                    key={option.value}
                    className={`flex cursor-pointer items-start gap-3 rounded-[16px] border p-3.5 transition-all ${isSelected ? 'border-[#1E7DFF] bg-[#EFF7FF] shadow-[0_8px_20px_rgba(30,125,255,0.1)]' : 'border-[#E8D8C3] bg-[#FFFEF8] hover:border-[#9CCBFF]'}`}
                  >
                    <input type="radio" name="participantMode" value={option.value} checked={isSelected} onChange={(event) => setParticipantMode(event.target.value)} className="mt-1 h-4 w-4 accent-[#1E7DFF]" />
                    <span className="min-w-0">
                      <span className="block text-[14px] font-bold text-[#4A3B32]">{option.title}</span>
                      <span className="mt-1 block text-[12px] leading-5 text-[#8A786B]">{option.description}</span>
                    </span>
                  </label>
                );
              })}
            </div>
          </fieldset>

          <div className="col-span-2 flex items-center justify-between gap-4 rounded-[16px] border border-[#E8D8C3] bg-[#FFFEF8] p-4">
            <div>
              <p className="m-0 text-[15px] font-bold text-[#4A3B32]">Nhận diện cảm xúc</p>
              <p className="m-0 mt-1 text-[12px] leading-5 text-[#8A786B]">Phân tích cảm xúc của người tham gia trong buổi học.</p>
            </div>
            <Button
              type="default"
              htmlType="button"
              role="switch"
              aria-checked={emotionRecognition}
              aria-label="Bật hoặc tắt nhận diện cảm xúc"
              onClick={() => setEmotionRecognition((enabled) => !enabled)}
              className={`!relative !flex !h-7 !w-12 !shrink-0 !items-start !justify-start !rounded-full !border-0 !p-1 !shadow-none ${emotionRecognition ? '!bg-[#1E7DFF]' : '!bg-[#C9C0B8]'}`}
            >
              <span className={`absolute left-1 top-1 block h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${emotionRecognition ? 'translate-x-5' : 'translate-x-0'}`} />
            </Button>
          </div>

          {error && <p className="col-span-2 m-0 rounded-xl bg-[#fff0ed] px-3 py-2 text-center text-sm text-[#b33b25]">{error}</p>}
          <Button type="primary" htmlType="button" loading={isCreating} disabled={isCreating} onClick={handleCreateRoom} className="!h-[50px] !w-full !rounded-full !px-6 !text-[16px] !font-bold">Tạo phòng</Button>
          <Button type="default" htmlType="button" onClick={handleClose} className="!h-[50px] !w-full !rounded-full !border !border-[#000000] !bg-white !px-6 !text-[16px] !font-bold !text-black !shadow-none hover:!bg-[#F8F8F8]">Thoát</Button>
        </div>
      </Lobby>
    </div>
  );
};

export default NewRoom;
