import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Lobby from '../layouts/Lobby';
import { createRoom } from '../api/meetingApi';
import { getApiErrorMessage } from '../api/axiosClient';
import { retainMediaStream } from '../utils/mediaSession';

const participantOptions = [
  { value: 'free', title: 'Tự do', description: 'Mọi học sinh có mã đều vào được ngay.' },
  { value: 'approval', title: 'Đợi duyệt', description: 'Giáo viên duyệt học sinh trước khi vào.' },
];

const analysisOptions = [
  {
    value: 'realtime',
    title: '⚡ Thời gian thực (Realtime)',
    description: 'AI theo dõi độ tập trung & cảm xúc trực tiếp trong buổi dạy.',
  },
  {
    value: 'batch',
    title: '⏳ AI phân tích sau (Batch)',
    description: 'Ghi hình bài giảng; AI xử lý và trả báo cáo khi kết thúc.',
  },
];

const NewRoom = ({ onClose }) => {
  const navigate = useNavigate();
  const [roomName, setRoomName] = useState('Toán 12A1 - Giải tích');
  const [participantMode, setParticipantMode] = useState('free');
  const [analysisMode, setAnalysisMode] = useState('batch');
  const [lobbyMedia, setLobbyMedia] = useState({ camera: false, mic: false, stream: null });
  const [isExiting, setIsExiting] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState('');

  const handleClose = () => setIsExiting(true);

  const handleCreateRoom = async () => {
    try {
      setIsCreating(true);
      setError('');
      const room = await createRoom({
        name: roomName.trim() || 'Lớp học trực tuyến',
        participantMode,
        analysisMode,
        emotionRecognition: analysisMode === 'realtime',
      });
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
      className={`${isExiting ? 'new-room-exit ' : ''}min-h-0 h-full flex flex-col`}
    >
      <Lobby
        onMediaChange={setLobbyMedia}
        roomTitle="Khởi tạo phòng học mới"
        onClose={handleClose}
      >
        <div className="flex flex-col gap-3 bg-surface-container-lowest border-[3px] border-pure-black p-3.5 shadow-[4px_4px_0px_#000000]">
          {/* Class Name Input */}
          <div>
            <label className="block text-label-xs font-bold text-on-surface uppercase mb-1">
              Tên lớp học / Chủ đề bài giảng
            </label>
            <input
              type="text"
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              placeholder="VD: Toán 12A1 - Giải tích"
              className="w-full px-3 py-2 bg-surface border-[2px] border-pure-black text-body-sm font-bold focus:bg-bright-yellow outline-none shadow-[2px_2px_0px_#000000]"
            />
          </div>

          {/* Analysis Mode */}
          <fieldset className="space-y-1.5">
            <legend className="text-label-xs font-bold text-on-surface uppercase">
              Chế độ phân tích cảm xúc AI
            </legend>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {analysisOptions.map((option) => {
                const isSelected = analysisMode === option.value;
                return (
                  <label
                    key={option.value}
                    className={`flex cursor-pointer items-start gap-2 border-[2px] border-pure-black p-2 transition-all ${
                      isSelected
                        ? 'bg-bright-yellow shadow-[2px_2px_0px_#000000]'
                        : 'bg-surface hover:bg-surface-container'
                    }`}
                  >
                    <input
                      type="radio"
                      name="analysisMode"
                      value={option.value}
                      checked={isSelected}
                      onChange={(e) => setAnalysisMode(e.target.value)}
                      className="mt-0.5 h-3.5 w-3.5 accent-pure-black cursor-pointer"
                    />
                    <div className="min-w-0">
                      <span className="block text-label-xs font-bold text-on-surface leading-tight">
                        {option.title}
                      </span>
                      <span className="text-[11px] text-on-surface-variant leading-tight block mt-0.5">
                        {option.description}
                      </span>
                    </div>
                  </label>
                );
              })}
            </div>
          </fieldset>

          {/* Participant Mode */}
          <fieldset className="space-y-1.5">
            <legend className="text-label-xs font-bold text-on-surface uppercase">
              Quản lý người tham gia
            </legend>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {participantOptions.map((option) => {
                const isSelected = participantMode === option.value;
                return (
                  <label
                    key={option.value}
                    className={`flex cursor-pointer items-start gap-2 border-[2px] border-pure-black p-2 transition-all ${
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
                      className="mt-0.5 h-3.5 w-3.5 accent-pure-black cursor-pointer"
                    />
                    <div className="min-w-0">
                      <span className="block text-label-xs font-bold text-on-surface leading-tight">
                        {option.title}
                      </span>
                      <span className="text-[11px] text-on-surface-variant leading-tight block mt-0.5">
                        {option.description}
                      </span>
                    </div>
                  </label>
                );
              })}
            </div>
          </fieldset>

          {/* Error Banner */}
          {error && (
            <p className="p-2 bg-tertiary-container border-[2px] border-pure-black text-on-tertiary-container font-bold text-label-xs text-center">
              {error}
            </p>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col gap-2 pt-1">
            <button
              type="button"
              disabled={isCreating}
              onClick={handleCreateRoom}
              className="w-full py-3 bg-bright-yellow text-pure-black border-[3px] border-pure-black font-headline font-bold text-label-lg uppercase tracking-wide shadow-[3px_3px_0px_#000000] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_#000000] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <span>{isCreating ? 'Đang khởi tạo...' : 'Tạo phòng học ngay'}</span>
              <span className="material-symbols-outlined text-[20px] font-bold">arrow_forward</span>
            </button>

            <button
              type="button"
              onClick={handleClose}
              className="w-full py-2 bg-surface text-on-surface border-[2px] border-pure-black text-label-xs font-bold shadow-[2px_2px_0px_#000000] hover:bg-surface-container active:translate-x-[1px] active:translate-y-[1px] transition-all cursor-pointer text-center"
            >
              Hủy / Đóng
            </button>
          </div>
        </div>
      </Lobby>
    </div>
  );
};

export default NewRoom;
