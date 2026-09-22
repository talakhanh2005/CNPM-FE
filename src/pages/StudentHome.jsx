import { useState } from 'react';
import HomeLayout from '../layouts/HomeLayout';
import JoinRoom from '../components/JoinRoom';

const StudentDashBoard = () => {
  const [joinRoomCode, setJoinRoomCode] = useState(null);

  return (
    <HomeLayout onJoinRoom={setJoinRoomCode}>
      {joinRoomCode && (
        <div className="absolute inset-0 z-20 flex w-full px-5 pb-8 pt-8 teacher-content-enter">
          <JoinRoom roomCode={joinRoomCode} onClose={() => setJoinRoomCode(null)} />
        </div>
      )}
    </HomeLayout>
  );
};

export default StudentDashBoard;
