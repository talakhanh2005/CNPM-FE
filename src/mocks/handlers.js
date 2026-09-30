import { http, HttpResponse } from 'msw';
import { isUserRole } from './contracts';
import { getFallbackIceServers, hasTurnServer } from '../config/iceServers';

const STORE_KEY = 'cnpm-msw-store';
let users = new Map();
let sessions = new Map();
let rooms = new Map();

const sampleRoomsSeed = [
  {
    id: 'room_hist_01',
    name: 'Toán 12A1 - Ôn thi đại học (Giải tích nâng cao)',
    code: 'MATH12A1',
    hostId: 'teacher_sample',
    status: 'closed',
    participantMode: 'free',
    emotionRecognition: true,
    analysisMode: 'batch',
    recordingStatus: 'completed',
    durationMinutes: 90,
    createdAt: new Date(Date.now() - 3600 * 1000 * 24).toISOString(),
    participants: [{ id: 'user_st1', username: 'Nguyễn An', role: 'student', status: 'left' }],
  },
  {
    id: 'room_hist_02',
    name: 'Vật lý 11B2 - Điện từ trường & Cảm ứng',
    code: 'PHYS11B2',
    hostId: 'teacher_sample',
    status: 'closed',
    participantMode: 'free',
    emotionRecognition: true,
    analysisMode: 'realtime',
    recordingStatus: 'none',
    durationMinutes: 45,
    createdAt: new Date(Date.now() - 3600 * 1000 * 48).toISOString(),
    participants: [{ id: 'user_st2', username: 'Trần Bình', role: 'student', status: 'left' }],
  },
  {
    id: 'room_hist_03',
    name: 'Hóa học 10C3 - Phản ứng Oxi hóa khử',
    code: 'CHEM10C3',
    hostId: 'teacher_sample',
    status: 'closed',
    participantMode: 'approval',
    emotionRecognition: true,
    analysisMode: 'batch',
    recordingStatus: 'completed',
    durationMinutes: 60,
    createdAt: new Date(Date.now() - 3600 * 1000 * 72).toISOString(),
    participants: [{ id: 'user_st3', username: 'Lê Hoàng', role: 'student', status: 'left' }],
  },
  {
    id: 'room_hist_04',
    name: 'Hình học 12A2 - Phương pháp tọa độ không gian Oxyz',
    code: 'GEOM12A2',
    hostId: 'teacher_sample',
    status: 'closed',
    participantMode: 'free',
    emotionRecognition: true,
    analysisMode: 'realtime',
    recordingStatus: 'none',
    durationMinutes: 90,
    createdAt: new Date(Date.now() - 3600 * 1000 * 96).toISOString(),
    participants: [{ id: 'user_st4', username: 'Phạm Mai', role: 'student', status: 'left' }],
  },
];

const getStorage = () => globalThis.localStorage;

const loadState = () => {
  const storage = getStorage();
  if (!storage) return;

  try {
    const state = JSON.parse(storage.getItem(STORE_KEY) || '{}');
    users = new Map((state.users || []).map((user) => [user.id, user]));
    sessions = new Map(state.sessions || []);
    rooms = new Map((state.rooms || []).map((room) => [room.id, room]));
    if (rooms.size === 0) {
      sampleRoomsSeed.forEach((r) => rooms.set(r.id, r));
      saveState();
    }
  } catch {
    users = new Map();
    sessions = new Map();
    rooms = new Map();
    sampleRoomsSeed.forEach((r) => rooms.set(r.id, r));
  }
};

const saveState = () => {
  getStorage()?.setItem(STORE_KEY, JSON.stringify({
    users: [...users.values()],
    sessions: [...sessions.entries()],
    rooms: [...rooms.values()],
  }));
};

const withState = async (operation) => {
  const run = async () => {
    loadState();
    return operation();
  };
  const locks = globalThis.navigator?.locks;
  return locks?.request
    ? locks.request(STORE_KEY, { mode: 'exclusive' }, run)
    : run();
};

loadState();

const id = (prefix) => `${prefix}_${crypto.randomUUID().replaceAll('-', '').slice(0, 12)}`;
const now = () => new Date().toISOString();
const ok = (data, message = 'OK') => HttpResponse.json({ success: true, data, message });
const fail = (message, status = 400, code = 'BAD_REQUEST') => HttpResponse.json({
  success: false,
  data: { code },
  message,
}, { status });

const publicUser = (user) => ({
  id: user.id,
  email: user.email,
  full_name: user.full_name,
  role: user.role,
  created_at: user.created_at,
});

const toRoom = (room) => ({
  id: room.id,
  code: room.code,
  teacher_id: room.hostId,
  student_id: room.participants?.find((participant) => participant.role === 'student')?.id || null,
  mode: room.analysisMode === 'batch' ? 'after_session' : 'realtime',
  status: room.status === 'active' ? 'ongoing' : room.status === 'closed' ? 'ended' : room.status,
  created_at: room.createdAt,
  ended_at: room.endedAt || null,
  participants: (room.participants || []).map((participant) => ({
    user_id: participant.id,
    status: participant.status === 'disconnected' ? 'joined' : participant.status,
    joined_at: participant.joinedAt || room.createdAt,
    left_at: participant.leftAt || null,
  })),
});

const getCurrentUser = (request) => {
  const token = request.headers.get('Authorization')?.replace(/^Bearer\s+/i, '');
  const userId = token && sessions.get(token);
  return userId ? users.get(userId) : null;
};

const nextRoomCode = () => {
  let code;
  do {
    code = Math.random().toString(36).slice(2, 10).toUpperCase();
  } while ([...rooms.values()].some((room) => room.code === code));
  return code;
};

export const handlers = [
  http.post('/api/auth/register', async ({ request }) => withState(async () => {
    const body = await request.json();
    const { email, full_name: fullName, password, role } = body || {};
    const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';

    if (!normalizedEmail.includes('@') || !String(fullName || '').trim() || typeof password !== 'string' || password.length < 8 || !isUserRole(role)) {
      return fail('Email, họ tên, mật khẩu hoặc vai trò không hợp lệ.', 422, 'VALIDATION_ERROR');
    }
    if ([...users.values()].some((user) => user.email?.toLowerCase() === normalizedEmail)) {
      return fail('Email đã tồn tại.', 409, 'EMAIL_EXISTS');
    }

    const user = {
      id: id('user'),
      email: normalizedEmail,
      full_name: fullName.trim(),
      password,
      role,
      created_at: now(),
    };
    users.set(user.id, user);
    saveState();
    return ok(publicUser(user), 'Đăng ký thành công.');
  })),

  http.post('/api/auth/login', async ({ request }) => withState(async () => {
    const body = await request.json();
    const { email, password } = body || {};
    const user = [...users.values()].find((item) => item.email?.toLowerCase() === String(email || '').trim().toLowerCase());

    if (!user || user.password !== password) {
      return fail('Email hoặc mật khẩu không đúng.', 401, 'INVALID_CREDENTIALS');
    }

    const accessToken = id('access');
    const refreshToken = id('refresh');
    sessions.set(accessToken, user.id);
    sessions.set(refreshToken, user.id);
    saveState();
    return ok({
      access_token: accessToken,
      refresh_token: refreshToken,
      token_type: 'bearer',
      expires_in: 900,
    }, 'Đăng nhập thành công.');
  })),

  http.get('/api/auth/me', ({ request }) => withState(() => {
    const user = getCurrentUser(request);
    return user ? ok(publicUser(user)) : fail('Phiên đăng nhập không hợp lệ.', 401, 'INVALID_TOKEN');
  })),

  http.post('/api/auth/refresh', async ({ request }) => withState(async () => {
    const { refresh_token: refreshToken } = await request.json();
    const userId = sessions.get(refreshToken);
    if (!userId) return fail('Refresh token không hợp lệ.', 401, 'REFRESH_REUSED');
    sessions.delete(refreshToken);
    const accessToken = id('access');
    const nextRefreshToken = id('refresh');
    sessions.set(accessToken, userId);
    sessions.set(nextRefreshToken, userId);
    saveState();
    return ok({ access_token: accessToken, refresh_token: nextRefreshToken, token_type: 'bearer', expires_in: 900 });
  })),

  http.post('/api/auth/logout', async ({ request }) => withState(async () => {
    const { refresh_token: refreshToken } = await request.json();
    sessions.delete(refreshToken);
    saveState();
    return ok(null, 'Đã đăng xuất.');
  })),

  http.post('/api/meetings', async ({ request }) => withState(async () => {
    const user = getCurrentUser(request);
    if (!user) return fail('Bạn cần đăng nhập trước.', 401, 'UNAUTHORIZED');
    if (user.role !== 'teacher') return fail('Chỉ giáo viên có thể tạo phòng.', 403, 'FORBIDDEN');

    const body = await request.json();
    const { status = 'ongoing', mode = 'realtime' } = body || {};
    if (!['scheduled', 'ongoing'].includes(status) || !['realtime', 'after_session'].includes(mode)) {
      return fail('Thiết lập phòng không hợp lệ.', 422, 'VALIDATION_ERROR');
    }

    const createdAt = now();
    const room = {
      id: id('room'),
      code: nextRoomCode(),
      hostId: user.id,
      status: status === 'ongoing' ? 'active' : 'scheduled',
      analysisMode: mode === 'after_session' ? 'batch' : 'realtime',
      recordingStatus: 'none',
      durationMinutes: 45,
      createdAt,
      participants: [{ ...publicUser(user), status: 'joined', joinedAt: createdAt, leftAt: null }],
    };
    rooms.set(room.id, room);
    saveState();
    return ok(toRoom(room), 'Tạo phòng thành công.');
  })),

  http.get('/api/meetings', ({ request }) => withState(() => {
    const user = getCurrentUser(request);
    if (!user) return fail('Bạn cần đăng nhập trước.', 401, 'UNAUTHORIZED');

    if (user.role !== 'teacher') return fail('Chỉ giáo viên có thể xem lịch sử.', 403, 'FORBIDDEN');
    const historyList = [...rooms.values()]
      .filter((r) => r.hostId === user.id || r.hostId === 'teacher_sample')
      .map((room) => ({
        id: room.id,
        code: room.code,
        mode: room.analysisMode === 'batch' ? 'after_session' : 'realtime',
        status: room.status === 'active' ? 'ongoing' : room.status === 'closed' ? 'ended' : room.status,
        student_id: room.participants?.find((participant) => participant.role === 'student')?.id || null,
        created_at: room.createdAt,
        ended_at: room.endedAt || null,
        recording_statuses: room.recordingStatus === 'completed' ? { completed: 1 } : {},
        analysis_status: room.recordingStatus === 'processing' ? 'processing' : room.analysisMode === 'batch' ? 'completed' : 'not_required',
        report_url: `/meetings/${room.id}/report`,
      }))
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    return ok({ items: historyList, offset: 0, limit: 20 });
  })),

  http.post('/api/meetings/:roomId/recordings', async ({ request, params }) => withState(async () => {
    const user = getCurrentUser(request);
    if (!user) return fail('Bạn cần đăng nhập trước.', 401, 'UNAUTHORIZED');
    const room = rooms.get(params.roomId);
    if (!room) return fail('Không tìm thấy phòng.', 404, 'ROOM_NOT_FOUND');

    const body = await request.arrayBuffer();
    if (!body.byteLength) return fail('Bản ghi trống.', 422, 'EMPTY_VIDEO');

    room.recordingStatus = 'processing';
    saveState();

    setTimeout(() => {
      withState(() => {
        const target = rooms.get(params.roomId);
        if (target) {
          target.recordingStatus = 'completed';
          saveState();
        }
      });
    }, 4000);

    return ok({
      id: id('recording'),
      meeting_id: room.id,
      cloudinary_url: 'https://example.invalid/mock-recording.webm',
      duration: 60,
      size_bytes: body.byteLength,
      status: room.analysisMode === 'batch' ? 'pending' : 'uploaded',
      created_at: now(),
    }, 'Bản ghi đã lưu, AI đang phân tích trong nền.');
  })),

  http.get('/api/meetings/:roomId', ({ request, params }) => withState(() => {
    const user = getCurrentUser(request);
    if (!user) return fail('Bạn cần đăng nhập trước.', 401, 'UNAUTHORIZED');
    const room = rooms.get(params.roomId);
    if (!room) return fail('Không tìm thấy phòng.', 404, 'ROOM_NOT_FOUND');
    const participant = room.participants.find((item) => item.id === user.id);
    if (!participant || participant.status === 'left') return fail('Bạn chưa tham gia phòng này.', 403, 'NOT_A_PARTICIPANT');
    return ok(toRoom(room));
  })),

  http.get('/api/meetings/:roomId/ice-config', ({ request, params }) => withState(() => {
    const user = getCurrentUser(request);
    if (!user) return fail('Bạn cần đăng nhập trước.', 401, 'UNAUTHORIZED');
    const room = rooms.get(params.roomId);
    if (!room || room.status !== 'active') return fail('Không tìm thấy phòng đang hoạt động.', 404, 'ROOM_NOT_FOUND');
    const participant = room.participants.find((item) => item.id === user.id && item.status === 'joined');
    if (!participant) return fail('Bạn chưa tham gia phòng này.', 403, 'NOT_A_PARTICIPANT');

    const iceServers = getFallbackIceServers();
    return ok({ iceServers, turn_configured: hasTurnServer(iceServers) });
  })),

  http.post('/api/meetings/join', async ({ request }) => withState(async () => {
    const user = getCurrentUser(request);
    if (!user) return fail('Bạn cần đăng nhập trước.', 401, 'UNAUTHORIZED');

    const body = await request.json();
    const code = typeof body?.code === 'string' ? body.code.trim().toUpperCase() : '';
    const room = [...rooms.values()].find((item) => item.code === code);
    if (!room) return fail('Không tìm thấy phòng với mã này.', 404, 'ROOM_NOT_FOUND');
    if (room.status !== 'active') return fail('Phòng đã kết thúc.', 409, 'ROOM_CLOSED');

    const assignedStudent = room.participants.find((item) => item.role === 'student' && item.id !== user.id);
    if (user.role === 'student' && assignedStudent) {
      return fail('Phòng đã có học sinh tham gia.', 403, 'FORBIDDEN');
    }

    const participant = room.participants.find((item) => item.id === user.id);
    if (participant) {
      participant.status = 'joined';
      participant.joinedAt = now();
      participant.leftAt = null;
    } else {
      room.participants.push({ ...publicUser(user), status: 'joined', joinedAt: now(), leftAt: null });
    }
    saveState();
    return ok(toRoom(room), 'Tham gia phòng thành công.');
  })),

  http.post('/api/meetings/:roomId/leave', ({ request, params }) => withState(() => {
    const user = getCurrentUser(request);
    if (!user) return fail('Bạn cần đăng nhập trước.', 401, 'UNAUTHORIZED');
    const room = rooms.get(params.roomId);
    if (!room) return fail('Không tìm thấy phòng.', 404, 'ROOM_NOT_FOUND');

    const participant = room.participants.find((item) => item.id === user.id);
    if (!participant) return fail('Bạn chưa tham gia phòng này.', 409, 'NOT_A_PARTICIPANT');
    participant.status = 'left';
    participant.leftAt = now();
    saveState();
    return ok({ roomId: room.id, participantId: user.id, status: participant.status, leftAt: participant.leftAt }, 'Đã rời phòng.');
  })),

  http.post('/api/meetings/:roomId/end', ({ request, params }) => withState(() => {
    const user = getCurrentUser(request);
    if (!user) return fail('Bạn cần đăng nhập trước.', 401, 'UNAUTHORIZED');
    const room = rooms.get(params.roomId);
    if (!room) return fail('Không tìm thấy phòng.', 404, 'ROOM_NOT_FOUND');
    if (room.hostId !== user.id || user.role !== 'teacher') {
      return fail('Chỉ giáo viên tạo phòng mới có thể đóng phòng.', 403, 'FORBIDDEN');
    }
    if (room.status === 'closed') return ok(toRoom(room), 'Phòng đã được đóng trước đó.');

    const endedAt = now();
    room.status = 'closed';
    room.endedAt = endedAt;
    room.participants = (room.participants || []).map((participant) => ({
      ...participant,
      status: 'left',
      leftAt: participant.leftAt || endedAt,
    }));
    saveState();
    return ok(toRoom(room), 'Đã đóng phòng học.');
  })),

  http.post('/api/meetings/:roomId/start', ({ request, params }) => withState(() => {
    const user = getCurrentUser(request);
    if (!user) return fail('Bạn cần đăng nhập trước.', 401, 'UNAUTHORIZED');
    const room = rooms.get(params.roomId);
    if (!room) return fail('Không tìm thấy phòng.', 404, 'MEETING_NOT_FOUND');
    if (room.hostId !== user.id || user.role !== 'teacher') return fail('Không có quyền bắt đầu phòng.', 403, 'FORBIDDEN');
    if (room.status === 'closed') return fail('Phòng đã kết thúc.', 409, 'MEETING_ENDED');
    room.status = 'active';
    saveState();
    return ok(toRoom(room));
  })),
];
