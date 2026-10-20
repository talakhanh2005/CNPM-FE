import { useState } from 'react';
import DashboardLayout from '../layouts/DashboardLayout';
import JoinRoom from '../components/JoinRoom';
import useAuth from '../hooks/useAuth';

const formatAccountDate = (value) => {
  if (!value) return 'Chưa có dữ liệu';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Chưa có dữ liệu';

  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
};

const StudentHome = () => {
  const { user } = useAuth();
  const [joinRoomCode, setJoinRoomCode] = useState(null);
  const [inputCode, setInputCode] = useState('');
  const [codeError, setCodeError] = useState('');

  const handleCodeChange = (event) => {
    setInputCode(event.target.value.replace(/[^a-z0-9]/gi, '').slice(0, 12).toUpperCase());
    setCodeError('');
  };

  const handleJoinWithCode = (event) => {
    event.preventDefault();
    const roomCode = inputCode.trim().toUpperCase();

    if (!/^[A-Z0-9]{8,12}$/.test(roomCode)) {
      setCodeError('Mã phòng phải gồm 8–12 chữ cái hoặc chữ số.');
      return;
    }

    setJoinRoomCode(roomCode);
    setInputCode('');
    setCodeError('');
  };

  return (
    <DashboardLayout activeTab="dashboard">
      {joinRoomCode && (
        <div
          onClick={(event) => {
            if (event.target === event.currentTarget) setJoinRoomCode(null);
          }}
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-pure-black/60 p-2 backdrop-blur-xs sm:items-center sm:p-4"
        >
          <div className="teacher-content-enter flex h-[calc(100dvh-1rem)] min-h-0 w-full max-w-5xl flex-col overflow-hidden border-[3px] border-pure-black bg-surface shadow-[8px_8px_0px_#000000] sm:h-[88dvh]">
            <JoinRoom roomCode={joinRoomCode} onClose={() => setJoinRoomCode(null)} />
          </div>
        </div>
      )}

      <div className="flex w-full flex-col gap-space-xl p-gutter pb-24 md:p-margin">
        <section className="relative overflow-hidden border-[3px] border-pure-black bg-off-white p-space-xl shadow-[4px_4px_0px_#000000]">
          <span className="material-symbols-outlined pointer-events-none absolute -bottom-10 -right-4 select-none text-[180px] text-role-accent opacity-20">
            school
          </span>
          <div className="relative z-10 max-w-3xl">
            <span className="mb-space-sm inline-flex items-center gap-2 border-[2px] border-pure-black bg-role-accent text-role-contrast px-3 py-1 text-label-sm font-bold uppercase shadow-[2px_2px_0px_#000000]">
              <span className="material-symbols-outlined text-[18px]">school</span>
              Trang học sinh
            </span>
            <h1 className="font-headline text-headline-xl font-bold text-on-surface">
              Xin chào, {user?.full_name || user?.email || 'Học sinh'}
            </h1>
            <p className="mt-space-xs text-body-lg text-on-surface-variant">
              Nhập mã do giáo viên cung cấp để kiểm tra thiết bị và tham gia phòng học.
            </p>
          </div>
        </section>

        <div className="grid grid-cols-1 gap-space-xl lg:grid-cols-[minmax(0,1.45fr)_minmax(280px,0.55fr)]">
          <section className="flex flex-col gap-space-lg border-[3px] border-pure-black bg-surface-container-lowest p-space-xl shadow-[4px_4px_0px_#000000]">
            <div className="flex items-start gap-space-md">
              <span className="material-symbols-outlined border-[2px] border-pure-black bg-role-accent text-role-contrast p-2 text-[28px]">
                meeting_room
              </span>
              <div>
                <h2 className="font-headline text-headline-md font-bold">Tham gia phòng học</h2>
                <p className="mt-1 text-body-md text-on-surface-variant">
                  Mã phòng gồm 8–12 ký tự và không chứa khoảng trắng hoặc ký tự đặc biệt.
                </p>
              </div>
            </div>

            <form onSubmit={handleJoinWithCode} className="flex flex-col gap-space-sm sm:flex-row">
              <label className="sr-only" htmlFor="student-room-code">Mã phòng</label>
              <input
                id="student-room-code"
                type="text"
                value={inputCode}
                onChange={handleCodeChange}
                placeholder="Nhập mã phòng"
                autoComplete="off"
                className="min-w-0 flex-1 border-[3px] border-pure-black bg-surface px-4 py-3 font-mono text-body-lg font-bold uppercase outline-none shadow-[2px_2px_0px_#000000] focus:bg-role-soft"
              />
              <button
                type="submit"
                disabled={!inputCode.trim()}
                className="flex items-center justify-center gap-2 border-[3px] border-pure-black bg-role-accent text-role-contrast px-6 py-3 font-bold shadow-[3px_3px_0px_#000000] transition-all hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none disabled:cursor-not-allowed disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-[20px]">login</span>
                Tiếp tục
              </button>
            </form>

            {codeError && (
              <p className="border-[2px] border-pure-black bg-tertiary-container px-3 py-2 text-label-md font-bold text-on-tertiary-container">
                {codeError}
              </p>
            )}

            <div className="flex items-start gap-space-sm border-[2px] border-pure-black bg-surface-container-low p-space-md">
              <span className="material-symbols-outlined text-[22px] text-secondary">videocam</span>
              <p className="text-body-sm text-on-surface-variant">
                Sau bước này, phòng chờ sẽ cho phép kiểm tra camera, micro và loa trước khi kết nối.
              </p>
            </div>
          </section>

          <section className="flex flex-col border-[3px] border-pure-black bg-off-white shadow-[4px_4px_0px_#000000]">
            <div className="flex items-center gap-space-sm border-b-[3px] border-pure-black bg-role-accent text-role-contrast px-space-md py-space-sm">
              <span className="material-symbols-outlined text-[22px]">badge</span>
              <h2 className="font-headline text-headline-sm font-bold">Tài khoản</h2>
            </div>

            <dl className="flex flex-1 flex-col divide-y-2 divide-pure-black">
              <div className="p-space-md">
                <dt className="text-label-xs font-bold uppercase tracking-wider text-on-surface-variant">Họ và tên</dt>
                <dd className="mt-1 break-words text-body-md font-bold">{user?.full_name || 'Chưa có dữ liệu'}</dd>
              </div>
              <div className="p-space-md">
                <dt className="text-label-xs font-bold uppercase tracking-wider text-on-surface-variant">Email</dt>
                <dd className="mt-1 break-all text-body-md font-bold">{user?.email || 'Chưa có dữ liệu'}</dd>
              </div>
              <div className="grid grid-cols-2 divide-x-2 divide-pure-black">
                <div className="p-space-md">
                  <dt className="text-label-xs font-bold uppercase tracking-wider text-on-surface-variant">Vai trò</dt>
                  <dd className="mt-1 text-body-md font-bold">Học sinh</dd>
                </div>
                <div className="p-space-md">
                  <dt className="text-label-xs font-bold uppercase tracking-wider text-on-surface-variant">Ngày tạo</dt>
                  <dd className="mt-1 text-body-md font-bold">{formatAccountDate(user?.created_at)}</dd>
                </div>
              </div>
            </dl>
          </section>
        </div>

      </div>
    </DashboardLayout>
  );
};

export default StudentHome;
