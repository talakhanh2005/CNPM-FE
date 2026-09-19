import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Lobby from '../layouts/Lobby';
import Button from './Button';

const NewRoom = () => {
  const navigate = useNavigate();
  const [participantMode, setParticipantMode] = useState('free');
  const [emotionRecognition, setEmotionRecognition] = useState(true);

  const handleCreateRoom = () => navigate('/meeting/new');

  return (
    <Lobby>
      <div className="flex h-full flex-col">
        <div className="mt-7 space-y-6">
          <fieldset>
            <legend className="mb-3 text-[15px] font-bold text-[#4A3B32]">Quản lý người tham gia</legend>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {[
                { value: 'free', title: 'Tự do', description: 'Ai có mã phòng đều có thể tham gia.' },
                { value: 'approval', title: 'Đợi duyệt', description: 'Giáo viên duyệt trước khi vào phòng.' },
              ].map((option) => {
                const isSelected = participantMode === option.value;
                return (
                  <label key={option.value} className={`flex cursor-pointer items-start gap-3 rounded-[16px] border p-3.5 transition-all ${isSelected ? 'border-[#1E7DFF] bg-[#EFF7FF] shadow-[0_8px_20px_rgba(30,125,255,0.1)]' : 'border-[#E8D8C3] bg-[#FFFEF8] hover:border-[#9CCBFF]'}`}>
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

          <div className="flex items-center justify-between gap-4 rounded-[16px] border border-[#E8D8C3] bg-[#FFFEF8] p-4">
            <div>
              <p className="m-0 text-[15px] font-bold text-[#4A3B32]">Nhận diện cảm xúc</p>
              <p className="m-0 mt-1 text-[12px] leading-5 text-[#8A786B]">Phân tích cảm xúc của người tham gia trong buổi học.</p>
            </div>
            <button type="button" role="switch" aria-checked={emotionRecognition} aria-label="Bật hoặc tắt nhận diện cảm xúc" onClick={() => setEmotionRecognition((enabled) => !enabled)} className={`relative h-7 w-12 shrink-0 rounded-full p-1 transition-colors ${emotionRecognition ? 'bg-[#1E7DFF]' : 'bg-[#C9C0B8]'}`}>
              <span className={`block h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${emotionRecognition ? 'translate-x-5' : 'translate-x-0'}`} />
            </button>
          </div>
        </div>

        <Button type="button" onClick={handleCreateRoom} className="mt-auto !h-[50px] !w-full !rounded-full !bg-[#1E7DFF] !px-6 !text-[16px] !font-bold !text-white">Tạo mới</Button>
      </div>
    </Lobby>
  );
};

export default NewRoom;
