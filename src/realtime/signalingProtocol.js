const cleanIceCandidate = (payload = {}) => ({
  candidate: payload.candidate || '',
  sdpMid: payload.sdpMid ?? null,
  sdpMLineIndex: payload.sdpMLineIndex ?? null,
});

export const toWireMessages = (message) => {
  if (message.type === 'signal.offer') {
    return [{ type: 'OFFER', target_id: message.targetId, payload: message.payload }];
  }
  if (message.type === 'signal.answer') {
    return [{ type: 'ANSWER', target_id: message.targetId, payload: message.payload }];
  }
  if (message.type === 'signal.ice') {
    return [{
      type: 'ICE_CANDIDATE',
      target_id: message.targetId,
      payload: cleanIceCandidate(message.payload),
    }];
  }
  if (message.type === 'media.status') {
    return [
      { type: 'CAMERA_STATUS', payload: { enabled: Boolean(message.payload.camera) } },
      { type: 'MIC_STATUS', payload: { enabled: Boolean(message.payload.mic) } },
    ];
  }
  if (message.type === 'room.ended') return [];
  if (message.type === 'room.leave') return [{ type: 'LEAVE' }];
  return [message];
};

export const fromWireMessage = (message) => {
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

export const shouldReconnectSocket = (closeCode) => ![1000, 4001].includes(closeCode);
