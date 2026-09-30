import { useCallback, useEffect, useRef, useState } from 'react';

const useWebSocket = ({ meetingId, user, onEvent, onStatus }) => {
  const socketRef = useRef(null);
  const callbacksRef = useRef({ onEvent, onStatus });
  const [status, setStatus] = useState('idle');

  useEffect(() => {
    callbacksRef.current = { onEvent, onStatus };
  }, [onEvent, onStatus]);

  const send = useCallback((message) => {
    if (socketRef.current?.readyState !== WebSocket.OPEN) return false;
    socketRef.current.send(JSON.stringify(message));
    return true;
  }, []);

  useEffect(() => {
    if (!meetingId || !user) return undefined;
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const socket = new WebSocket(`${protocol}//${window.location.host}/ws/meetings/${meetingId}`);
    socketRef.current = socket;

    socket.onopen = () => {
      setStatus('connected');
      callbacksRef.current.onStatus?.('connected');
      socket.send(JSON.stringify({
        type: 'AUTH',
        token: sessionStorage.getItem('accessToken'),
      }));
    };
    socket.onmessage = ({ data }) => {
      try {
        const envelope = JSON.parse(data);
        callbacksRef.current.onEvent?.(envelope.data || envelope);
      } catch {
        callbacksRef.current.onStatus?.('error');
      }
    };
    socket.onerror = () => {
      setStatus('error');
      callbacksRef.current.onStatus?.('error');
    };
    socket.onclose = () => {
      setStatus('disconnected');
      callbacksRef.current.onStatus?.('disconnected');
    };

    return () => {
      socket.close();
      if (socketRef.current === socket) socketRef.current = null;
    };
  }, [meetingId, user]);

  const close = useCallback(() => socketRef.current?.close(), []);

  return { status, send, close };
};

export default useWebSocket;
