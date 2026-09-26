import { http, HttpResponse } from 'msw';
import { isParticipantMode, isUserRole } from './contracts';

const STORE_KEY = 'cnpm-msw-store';
let users = new Map();
let sessions = new Map();
let rooms = new Map();

const getStorage = () => globalThis.localStorage;

const loadState = () => {
  const storage = getStorage();
  if (!storage) return;

  try {
    const state = JSON.parse(storage.getItem(STORE_KEY) || '{}');
    users = new Map((state.users || []).map((user) => [user.id, user]));
    sessions = new Map(state.sessions || []);
    rooms = new Map((state.rooms || []).map((room) => [room.id, room]));
  } catch {
    users = new Map();
    sessions = new Map();
    rooms = new Map();
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
  username: user.username,
  role: user.role,
});

const toRoom = (room) => ({
  id: room.id,
  code: room.code,
  hostId: room.hostId,
  status: room.status,
  participantMode: room.participantMode,
  emotionRecognition: room.emotionRecognition,
  createdAt: room.createdAt,
  participants: room.participants.map((participant) => ({ ...participant })),
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
    const { username, password, role } = body || {};
    const normalizedUsername = typeof username === 'string' ? username.trim() : '';

    if (normalizedUsername.length < 3 || typeof password !== 'string' || password.length < 4 || !isUserRole(role)) {
      return fail('Tên đăng nhập, mật khẩu hoặc vai trò không hợp lệ.', 422, 'VALIDATION_ERROR');
    }
    if ([...users.values()].some((user) => user.username.toLowerCase() === normalizedUsername.toLowerCase())) {
      return fail('Tên đăng nhập đã tồn tại.', 409, 'USERNAME_TAKEN');
    }

    const user = { id: id('user'), username: normalizedUsername, password, role };
    users.set(user.id, user);
    saveState();
    return ok({ user: publicUser(user) }, 'Đăng ký thành công.');
  })),

  http.post('/api/auth/login', async ({ request }) => withState(async () => {
    const body = await request.json();
    const { username, password, role } = body || {};
    const user = [...users.values()].find((item) => item.username.toLowerCase() === String(username || '').trim().toLowerCase());

    if (!user || user.password !== password || user.role !== role) {
      return fail('Tên đăng nhập, mật khẩu hoặc vai trò không đúng.', 401, 'INVALID_CREDENTIALS');
    }

    const token = id('session');
    sessions.set(token, user.id);
    saveState();
    return ok({ token, user: publicUser(user) }, 'Đăng nhập thành công.');
  })),

  http.post('/api/rooms', async ({ request }) => withState(async () => {
    const user = getCurrentUser(request);
    if (!user) return fail('Bạn cần đăng nhập trước.', 401, 'UNAUTHORIZED');
    if (user.role !== 'teacher') return fail('Chỉ giáo viên có thể tạo phòng.', 403, 'FORBIDDEN');

    const body = await request.json();
    const { participantMode, emotionRecognition } = body || {};
    if (!isParticipantMode(participantMode) || typeof emotionRecognition !== 'boolean') {
      return fail('Thiết lập phòng không hợp lệ.', 422, 'VALIDATION_ERROR');
    }

    const createdAt = now();
    const room = {
      id: id('room'),
      code: nextRoomCode(),
      hostId: user.id,
      status: 'active',
      participantMode,
      emotionRecognition,
      createdAt,
      participants: [{ ...publicUser(user), status: 'joined', joinedAt: createdAt, leftAt: null }],
    };
    rooms.set(room.id, room);
    saveState();
    return ok(toRoom(room), 'Tạo phòng thành công.');
  })),

  http.get('/api/rooms/:roomId', ({ request, params }) => withState(() => {
    const user = getCurrentUser(request);
    if (!user) return fail('Bạn cần đăng nhập trước.', 401, 'UNAUTHORIZED');
    const room = rooms.get(params.roomId);
    if (!room) return fail('Không tìm thấy phòng.', 404, 'ROOM_NOT_FOUND');
    if (room.status !== 'active') return fail('Phòng đã kết thúc.', 409, 'ROOM_CLOSED');
    const participant = room.participants.find((item) => item.id === user.id);
    if (!participant || participant.status === 'left') return fail('Bạn chưa tham gia phòng này.', 403, 'NOT_A_PARTICIPANT');
    if (participant.status === 'disconnected') {
      participant.status = 'joined';
      participant.joinedAt = now();
      participant.disconnectedAt = null;
      saveState();
    }
    return ok(toRoom(room));
  })),

  http.post('/api/rooms/join', async ({ request }) => withState(async () => {
    const user = getCurrentUser(request);
    if (!user) return fail('Bạn cần đăng nhập trước.', 401, 'UNAUTHORIZED');

    const body = await request.json();
    const code = typeof body?.code === 'string' ? body.code.trim().toUpperCase() : '';
    const room = [...rooms.values()].find((item) => item.code === code);
    if (!room) return fail('Không tìm thấy phòng với mã này.', 404, 'ROOM_NOT_FOUND');
    if (room.status !== 'active') return fail('Phòng đã kết thúc.', 409, 'ROOM_CLOSED');

    const participant = room.participants.find((item) => item.id === user.id);
    if (participant) {
      participant.status = 'joined';
      participant.joinedAt = now();
      participant.leftAt = null;
      participant.disconnectedAt = null;
    } else {
      room.participants.push({ ...publicUser(user), status: 'joined', joinedAt: now(), leftAt: null });
    }
    saveState();
    return ok(toRoom(room), 'Tham gia phòng thành công.');
  })),

  http.post('/api/rooms/:roomId/disconnect', ({ request, params }) => withState(() => {
    const user = getCurrentUser(request);
    if (!user) return fail('Bạn cần đăng nhập trước.', 401, 'UNAUTHORIZED');
    const room = rooms.get(params.roomId);
    if (!room || room.status !== 'active') return fail('Không tìm thấy phòng đang hoạt động.', 404, 'ROOM_NOT_FOUND');
    const participant = room.participants.find((item) => item.id === user.id);
    if (!participant || participant.status === 'left') return ok({ roomId: params.roomId, status: 'ignored' });

    participant.status = 'disconnected';
    participant.disconnectedAt = now();
    saveState();
    return ok({ roomId: room.id, participantId: user.id, status: participant.status });
  })),

  http.post('/api/rooms/:roomId/leave', ({ request, params }) => withState(() => {
    const user = getCurrentUser(request);
    if (!user) return fail('Bạn cần đăng nhập trước.', 401, 'UNAUTHORIZED');
    const room = rooms.get(params.roomId);
    if (!room) return fail('Không tìm thấy phòng.', 404, 'ROOM_NOT_FOUND');

    const participant = room.participants.find((item) => item.id === user.id);
    if (!participant) return fail('Bạn chưa tham gia phòng này.', 409, 'NOT_A_PARTICIPANT');
    participant.status = 'left';
    participant.leftAt = now();

    if (room.hostId === user.id) room.status = 'closed';
    saveState();
    return ok({ roomId: room.id, participantId: user.id, status: participant.status, leftAt: participant.leftAt }, 'Đã rời phòng.');
  })),
];
