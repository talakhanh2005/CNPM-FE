import { useCallback, useEffect, useRef, useState } from 'react';
import { meetingWebSocketUrl } from '../config/runtime';
import { refreshAccessToken } from '../api/axiosClient';
import { getAccessToken } from '../utils/session';
import { fromWireMessage, shouldReconnectSocket, toWireMessages } from '../realtime/signalingProtocol';

const useWebSocket = ({ meetingId, user, onEvent, onStatus }) => {
  const socketRef = useRef(null);
  const callbacksRef = useRef({ onEvent, onStatus });
  const [status, setStatus] = useState('idle');

  useEffect(() => {
    callbacksRef.current = { onEvent, onStatus };
  }, [onEvent, onStatus]);

  const updateStatus = useCallback((nextStatus) => {
    setStatus(nextStatus);
    callbacksRef.current.onStatus?.(nextStatus);
  }, []);

  const send = useCallback((message) => socketRef.current?.send(message) || false, []);

  useEffect(() => {
    if (!meetingId || !user) return undefined;

    let disposed = false;
    let ended = false;
    let reconnectTimer = null;
    let reconnectAttempts = 0;
    let lastErrorCode = null;
    let nativeSocket = null;

    const connect = () => {
      if (disposed) return;
      updateStatus(reconnectAttempts ? 'reconnecting' : 'connecting');
      nativeSocket = new WebSocket(meetingWebSocketUrl(meetingId));

      const transport = {
        send(message) {
          if (nativeSocket?.readyState !== WebSocket.OPEN) return false;
          toWireMessages(message).forEach((wireMessage) => nativeSocket.send(JSON.stringify(wireMessage)));
          return true;
        },
        close() {
          disposed = true;
          nativeSocket?.close(1000);
        },
      };
      socketRef.current = transport;

      nativeSocket.onopen = () => {
        lastErrorCode = null;
        updateStatus('authenticating');
        nativeSocket.send(JSON.stringify({ type: 'AUTH', token: getAccessToken() }));
      };

      nativeSocket.onmessage = ({ data }) => {
        try {
          const message = JSON.parse(data);
          if (!message.success) lastErrorCode = message.data?.code;
          if (message.success && message.data?.type === 'JOIN') {
            reconnectAttempts = 0;
            updateStatus('connected');
          }
          fromWireMessage(message).forEach((event) => {
            if (event.type === 'room.ended') ended = true;
            callbacksRef.current.onEvent?.(event);
          });
        } catch {
          callbacksRef.current.onEvent?.({
            type: 'socket.error',
            message: 'WebSocket trả về dữ liệu không hợp lệ.',
          });
        }
      };

      nativeSocket.onerror = () => updateStatus('error');
      nativeSocket.onclose = async ({ code }) => {
        if (disposed || ended) {
          updateStatus('closed');
          return;
        }
        if (code === 4001) {
          disposed = true;
          socketRef.current = null;
          updateStatus('replaced');
          callbacksRef.current.onEvent?.({
            type: 'socket.error',
            payload: { code: 'SOCKET_REPLACED' },
            message: 'Phiên phòng này đã được mở ở một tab hoặc thiết bị khác.',
          });
          return;
        }
        if (!shouldReconnectSocket(code)) {
          updateStatus('closed');
          return;
        }
        reconnectAttempts += 1;
        if (reconnectAttempts > 5) {
          updateStatus('failed');
          return;
        }
        if (lastErrorCode === 'TOKEN_EXPIRED') {
          try {
            await refreshAccessToken();
          } catch {
            updateStatus('failed');
            return;
          }
        }
        updateStatus('reconnecting');
        reconnectTimer = window.setTimeout(connect, Math.min(1000 * reconnectAttempts, 5000));
      };
    };

    connect();
    return () => {
      disposed = true;
      window.clearTimeout(reconnectTimer);
      nativeSocket?.close(1000);
      socketRef.current = null;
    };
  }, [meetingId, updateStatus, user]);

  const close = useCallback(() => socketRef.current?.close(), []);

  return { status, send, close };
};

export default useWebSocket;
