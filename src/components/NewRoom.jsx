import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Lobby from '../layouts/Lobby';
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
    <div
      onAnimationEnd={isExiting ? onClose : undefined}
      className={`${isExiting ? 'new-room-exit ' : ''}h-full`}
    >
      <Lobby
        onMediaChange={setLobbyMedia}
        roomTitle="Khởi tạo phòng học mới"
      >
        <div className="flex flex-col gap-4 bg-surface-container-lowest border-[3px] border-pure-black p-5 shadow-[4px_4px_0px_#000000]">
          {/* Participant Mode Fieldset */}
          <fieldset className="space-y-3">
            <legend className="text-label-md font-bold text-on-surface uppercase mb-2">
              Quản lý người tham gia
            </legend>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {participantOptions.map((option) => {
                const isSelected = participantMode === option.value;
                return (
                  <label
                    key={option.value}
                    className={`flex cursor-pointer items-start gap-3 border-[3px] border-pure-black p-3 transition-all ${
                      isSelected
                        ? 'bg-bright-yellow shadow-[2px_2px_0px_#000000]'
                        : 'bg-surface hover:bg-surface-container'
                    }`}
                  >
                    <input
                      type="radio"
                      name="participantMode"
                      value={option.value}
                      checked={isSelected}
                      onChange={(e) => setParticipantMode(e.target.value)}
                      className="mt-1 h-4 w-4 accent-pure-black cursor-pointer"
                    />
                    <div className="min-w-0">
                      <span className="block text-label-md font-bold text-on-surface">
                        {option.title}
                      </span>
                      <span className="text-body-sm text-on-surface-variant leading-tight block mt-0.5">
                        {option.description}
                      </span>
                    </div>
                  </label>
                );
              })}
            </div>
          </fieldset>

          {/* Emotion Recognition Switch */}
          <div className="flex items-center justify-between gap-4 border-[3px] border-pure-black bg-surface p-3 shadow-[2px_2px_0px_#000000]">
            <div>
              <p className="text-label-md font-bold text-on-surface">AI Cảm xúc thời gian thực</p>
              <p className="text-body-sm text-on-surface-variant">
                Tự động nhận diện mức độ tập trung học sinh trong lớp.
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={emotionRecognition}
              onClick={() => setEmotionRecognition((prev) => !prev)}
              className={`w-14 h-8 border-[2px] border-pure-black p-0.5 flex items-center transition-colors cursor-pointer ${
                emotionRecognition ? 'bg-bright-yellow justify-end' : 'bg-surface-variant justify-start'
              }`}
            >
              <span className="w-6 h-6 bg-pure-black border border-pure-black shadow-xs block" />
            </button>
          </div>

          {/* Error Banner */}
          {error && (
            <p className="p-2.5 bg-tertiary-container border-[2px] border-pure-black text-on-tertiary-container font-bold text-body-sm text-center">
              {error}
            </p>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col gap-2.5 pt-2">
            <button
              type="button"
              disabled={isCreating}
              onClick={handleCreateRoom}
              className="w-full py-4 bg-bright-yellow text-pure-black border-[3px] border-pure-black font-headline font-bold text-headline-sm uppercase tracking-wide shadow-[4px_4px_0px_#000000] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_#000000] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <span>{isCreating ? 'Đang khởi tạo...' : 'Tạo phòng học ngay'}</span>
              <span className="material-symbols-outlined text-2xl font-bold">arrow_forward</span>
            </button>

            <button
              type="button"
              onClick={handleClose}
              className="w-full py-2.5 bg-surface text-on-surface border-[2px] border-pure-black font-label-md font-bold shadow-[2px_2px_0px_#000000] hover:bg-surface-container active:translate-x-[2px] active:translate-y-[2px] transition-all cursor-pointer"
            >
              Thoát
            </button>
          </div>
        </div>
      </Lobby>
    </div>
  );
};

export default NewRoom;
