const EMOTIONS = [
  'happy',
  'neutral',
  'sad',
  'angry',
  'surprised',
  'fearful',
  'disgusted',
];

const REPORT_TEMPLATES = [
  {
    summary: 'Phần lớn thời lượng lớp học duy trì trạng thái tích cực. Học sinh phản hồi tốt và có nhiều thời điểm vui vẻ, ngạc nhiên.',
    pattern: [
      'neutral', 'happy', 'happy', 'surprised', 'happy', 'neutral',
      'happy', 'happy', 'neutral', 'surprised', 'happy', 'neutral',
      'happy', 'happy', 'surprised', 'neutral', 'happy', 'happy',
      'neutral', 'happy', 'surprised', 'happy', 'neutral', 'happy',
    ],
    stepSeconds: 30,
  },
  {
    summary: 'Lớp học nhìn chung ổn định và tập trung. Trạng thái trung tính chiếm đa số, xen kẽ một số thời điểm vui vẻ và mệt mỏi.',
    pattern: [
      'neutral', 'neutral', 'happy', 'neutral', 'surprised', 'neutral',
      'neutral', 'sad', 'neutral', 'happy', 'neutral', 'fearful',
      'neutral', 'neutral', 'sad', 'neutral', 'happy', 'neutral',
      'neutral', 'surprised', 'neutral', 'sad', 'neutral', 'happy',
    ],
    stepSeconds: 35,
  },
  {
    summary: 'Mức độ tham gia biến động trong buổi học. Một số giai đoạn xuất hiện cảm xúc tiêu cực; giáo viên nên xem lại các mốc tương ứng trên timeline.',
    pattern: [
      'neutral', 'fearful', 'sad', 'neutral', 'angry', 'sad',
      'neutral', 'disgusted', 'fearful', 'neutral', 'sad', 'angry',
      'neutral', 'happy', 'neutral', 'sad', 'fearful', 'neutral',
      'disgusted', 'neutral', 'sad', 'surprised', 'neutral', 'sad',
    ],
    stepSeconds: 40,
    hasFailedRecording: true,
  },
];

const templateIndexFor = (meetingId) => {
  const hash = [...String(meetingId)].reduce(
    (value, character) => Math.imul(value, 31) + character.charCodeAt(0),
    0,
  );
  return (hash >>> 0) % REPORT_TEMPLATES.length;
};

const uniqueStudentIds = (studentIds = []) => {
  const ids = [...new Set(studentIds.filter(Boolean).map(String))];
  return ids.length ? ids : ['student-demo-01', 'student-demo-02', 'student-demo-03'];
};

const buildTimeline = (template, templateIndex, studentIds) => (
  studentIds.flatMap((studentId, studentIndex) => {
    const recordingId = `mock-recording-${templateIndex + 1}-${studentIndex + 1}`;
    return template.pattern.map((_, pointIndex) => {
      const emotion = template.pattern[(pointIndex + studentIndex * 3) % template.pattern.length];
      return {
        timestamp: pointIndex * template.stepSeconds,
        emotion,
        confidence: Number((0.72 + ((pointIndex + studentIndex * 5) % 20) / 100).toFixed(2)),
        student_id: studentId,
        recording_id: recordingId,
        sample_id: `mock-sample-${templateIndex + 1}-${studentIndex + 1}-${pointIndex + 1}`,
        mock: true,
        probabilities: null,
        face_id: null,
        face_detected: true,
        frame_id: null,
        failure_reason: null,
      };
    });
  })
);

const countEmotions = (timeline) => {
  const counts = Object.fromEntries(EMOTIONS.map((emotion) => [emotion, 0]));
  timeline.forEach((point) => { counts[point.emotion] += 1; });
  return counts;
};

const calculateDistribution = (counts, total) => Object.fromEntries(
  EMOTIONS.map((emotion) => [
    emotion,
    total ? Number(((counts[emotion] * 100) / total).toFixed(4)) : 0,
  ]),
);

export const getMockMeetingReport = (meetingId, params = {}, context = {}) => {
  const templateIndex = templateIndexFor(meetingId);
  const template = REPORT_TEMPLATES[templateIndex];
  const studentIds = uniqueStudentIds(context.studentIds);
  const failedCount = template.hasFailedRecording && studentIds.length > 1 ? 1 : 0;
  const analyzedStudentIds = failedCount ? studentIds.slice(0, -1) : studentIds;
  const fullTimeline = buildTimeline(template, templateIndex, analyzedStudentIds);
  const sampleCounts = countEmotions(fullTimeline);
  const sampleCount = fullTimeline.length;
  const offset = Math.max(0, Number(params.offset) || 0);
  const limit = Math.max(1, Number(params.limit) || 500);

  return {
    meeting_id: meetingId,
    recording_id: null,
    student_id: null,
    distribution: calculateDistribution(sampleCounts, sampleCount),
    sample_counts: sampleCounts,
    sample_count: sampleCount,
    timeline: fullTimeline.slice(offset, offset + limit),
    timeline_total: fullTimeline.length,
    offset,
    limit,
    summary: template.summary,
    source: 'batch',
    time_basis: 'recording_seconds',
    status: failedCount ? 'partial' : 'completed',
    recording_statuses: {
      completed: analyzedStudentIds.length,
      processing: 0,
      pending: 0,
      uploaded: 0,
      failed: failedCount,
    },
    mock: true,
  };
};

