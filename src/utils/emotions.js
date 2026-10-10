export const emotionMeta = {
  happy: { label: 'Vui vẻ', color: 'bg-bright-yellow', text: 'text-pure-black', icon: 'sentiment_very_satisfied' },
  neutral: { label: 'Bình thường', color: 'bg-royal-blue', text: 'text-white', icon: 'sentiment_neutral' },
  sad: { label: 'Buồn', color: 'bg-indigo-400', text: 'text-white', icon: 'sentiment_sad' },
  angry: { label: 'Tức giận', color: 'bg-vivid-red', text: 'text-white', icon: 'sentiment_extremely_dissatisfied' },
  surprised: { label: 'Ngạc nhiên', color: 'bg-orange-400', text: 'text-pure-black', icon: 'sentiment_excited' },
  fearful: { label: 'Lo lắng', color: 'bg-purple-500', text: 'text-white', icon: 'mood_bad' },
  disgusted: { label: 'Khó chịu', color: 'bg-emerald-600', text: 'text-white', icon: 'sick' },
  fail_detection: { label: 'Không nhận diện được', color: 'bg-gray-400', text: 'text-pure-black', icon: 'no_accounts' },
};

export const emotionKeys = Object.keys(emotionMeta).filter((key) => key !== 'fail_detection');

export const getEmotionMeta = (emotion) => emotionMeta[emotion] || {
  label: emotion || 'Chưa có dữ liệu',
  color: 'bg-surface-container-high',
  text: 'text-on-surface',
  icon: 'psychology',
};

export const percentOf = (value) => {
  const numeric = Number(value) || 0;
  return Math.max(0, Math.min(100, numeric <= 1 ? numeric * 100 : numeric));
};

export const dominantEmotion = (distribution = {}) => (
  Object.entries(distribution).reduce((best, entry) => (
    Number(entry[1]) > Number(best?.[1] || -1) ? entry : best
  ), null)
);
