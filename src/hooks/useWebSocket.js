import { useCallback, useEffect, useRef, useState } from 'react';
import { meetingWebSocketUrl, shouldEnableMocks } from '../config/runtime';
import { refreshAccessToken } from '../api/axiosClient';
import { getAccessToken } from '../utils/session';
import { MockRealtimeSocket } from '../mocks/mockRealtimeSocket';

const toWireMessages = (message) => {
  if (message.type === 'signal.offer') {
    return [{ type: 'OFFER', target_id: message.targetId, payload: message.payload }];
  }
  if (message.type === 'signal.answer') {
    return [{ type: 'ANSWER', target_id: message.targetId, payload: message.payload }];
  }
  if (message.type === 'signal.ice') {
    return [{ type: 'ICE_CANDIDATE', target_id: message.targetId, payload: message.payload }];
  }
  if (message.type === 'media.status') {
    return [
      { type: 'CAMERA_STATUS', payload: { enabled: Boolean(message.payload.camera) } },
      { type: 'MIC_STATUS', payload: { enabled: Boolean(message.payload.mic) } },
    ];
  }
  // The backend broadcasts MEETING_ENDED after the REST end request.
  // This local-only event is kept for MockRealtimeSocket.
  if (message.type === 'room.ended') return [];
  if (message.type === 'room.leave') return [{ type: 'LEAVE' }];
  return [message];
};

const fromWireMessage = (message) => {
  if (!message?.success) {
    return [{ type: 'socket.error', payload: message?.data, message: message?.message }];
  }
  const event = message.data;
  if (!event?.type) return [];

  if (event.type === 'JOIN' && Array.isArray(event.peers)) {
    return event.peers.map((peer) => ({
      type: 'participant.present',
      senderId: peer.user_id,
      payload: { participant: { id: peer.user_id, role: peer.role } },
    }));
  }
  if (event.type === 'JOIN') {
    return [{
      type: 'participant.joined',
      senderId: event.sender_id,
      payload: { participant: { id: event.sender_id, role: event.role } },
    }];
  }
  if (event.type === 'LEAVE') {
    return [{ type: 'participant.left', senderId: event.sender_id, payload: { participantId: event.sender_id } }];
  }
  if (event.type === 'MEETING_ENDED') return [{ type: 'room.ended', payload: {} }];
  if (event.type === 'OFFER') return [{ type: 'signal.offer', senderId: event.sender_id, payload: event.payload }];
  if (event.type === 'ANSWER') return [{ type: 'signal.answer', senderId: event.sender_id, payload: event.payload }];
  if (event.type === 'ICE_CANDIDATE') return [{ type: 'signal.ice', senderId: event.sender_id, payload: event.payload }];
  if (event.type === 'CAMERA_STATUS') {
    return [{ type: 'media.status', senderId: event.sender_id, payload: { camera: event.payload.enabled } }];
  }
  if (event.type === 'MIC_STATUS') {
    return [{ type: 'media.status', senderId: event.sender_id, payload: { mic: event.payload.enabled } }];
  }
  return [{ ...event, senderId: event.sender_id }];
};

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

    if (shouldEnableMocks) {
      const socket = new MockRealtimeSocket({ roomId: meetingId, user });
      socketRef.current = socket;
      const unsubscribe = socket.subscribe((event) => {
        if (event.type === 'socket.open') {
          updateStatus('connected');
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
    }

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
        reconnectAttempts = 0;
        lastErrorCode = null;
        updateStatus('connected');
        nativeSocket.send(JSON.stringify({ type: 'AUTH', token: getAccessToken() }));
      };

      nativeSocket.onmessage = ({ data }) => {
        try {
          const message = JSON.parse(data);
          if (!message.success) lastErrorCode = message.data?.code;
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
      nativeSocket.onclose = async () => {
        if (disposed || ended) {
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
