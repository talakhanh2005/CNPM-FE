import { getEmotionMeta, percentOf } from '../utils/emotions';

const EmotionPanel = ({ participants = [] }) => {
  const students = participants.filter((participant) => participant.role === 'student');

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-[minmax(0,1fr)_minmax(140px,0.9fr)] gap-3 border-[3px] border-pure-black bg-surface-container px-3 py-2 text-label-sm font-bold uppercase shadow-[3px_3px_0px_#000000]">
        <span>Họ và tên</span>
        <span>Cảm xúc hiện tại</span>
      </div>

      {!students.length && (
        <div className="border-[2px] border-pure-black bg-surface p-5 text-center text-body-sm text-on-surface-variant shadow-[2px_2px_0px_#000000]">
          Chưa có học sinh trong phòng.
        </div>
      )}

      {students.map((student) => {
        const emotion = student.emotion;
        const meta = getEmotionMeta(emotion?.emotion);
        const confidence = emotion ? percentOf(emotion.confidence) : 0;

        return (
          <div
            key={student.id}
            className="grid grid-cols-[minmax(0,1fr)_minmax(140px,0.9fr)] items-center gap-3 border-[2px] border-pure-black bg-surface p-3 shadow-[2px_2px_0px_#000000]"
          >
            <div className="flex min-w-0 items-center gap-2">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center border-[2px] border-pure-black bg-bright-yellow font-headline font-bold">
                {student.initials || student.name?.[0]?.toUpperCase() || 'H'}
              </span>
              <span className="truncate text-body-sm font-bold" title={student.name}>
                {student.name || 'Học sinh'}
              </span>
            </div>

            <div className="min-w-0">
              <div className={`flex items-center gap-1.5 border-[2px] border-pure-black px-2 py-1 text-label-sm font-bold ${meta.color} ${meta.text}`}>
                <span className="material-symbols-outlined text-[18px]">{meta.icon}</span>
                <span className="truncate">{meta.label}</span>
              </div>
              <div className="mt-1.5 h-2 overflow-hidden border border-pure-black bg-surface-container-high">
                <div className={`${meta.color} h-full transition-[width] duration-300`} style={{ width: `${confidence}%` }} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default EmotionPanel;
