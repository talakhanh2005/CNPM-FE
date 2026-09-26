import { useCallback, useEffect, useRef, useState } from 'react';
import { MockRealtimeSocket } from '../mocks/mockRealtimeSocket';

const useWebSocket = ({ meetingId, user, onEvent, onStatus }) => {
  const socketRef = useRef(null);
  const callbacksRef = useRef({ onEvent, onStatus });
  const [status, setStatus] = useState('idle');

  useEffect(() => {
    callbacksRef.current = { onEvent, onStatus };
  }, [onEvent, onStatus]);

  const send = useCallback((message) => socketRef.current?.send(message) || false, []);

  useEffect(() => {
    if (!meetingId || !user) return undefined;
    const socket = new MockRealtimeSocket({ roomId: meetingId, user });
    socketRef.current = socket;

    const unsubscribe = socket.subscribe((event) => {
      if (event.type === 'socket.open') {
        setStatus('connected');
        callbacksRef.current.onStatus?.('connected');
        socket.send({ type: 'auth', payload: { userId: user.id } });
        return;
      }
      callbacksRef.current.onEvent?.(event);
    });

    return () => {
      unsubscribe();
      socket.close();
      if (socketRef.current === socket) socketRef.current = null;
    };
  }, [meetingId, user]);

  const close = useCallback(() => socketRef.current?.close(), []);

  return { status, send, close };
};

export default useWebSocket;
