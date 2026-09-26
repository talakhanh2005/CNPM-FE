const fallbackChannels = new Map();

const publishFallback = (channelName, event) => {
  fallbackChannels.get(channelName)?.forEach((listener) => listener(event));
};

export class MockRealtimeSocket {
  constructor({ roomId, user }) {
    this.roomId = roomId;
    this.user = user;
    this.listeners = new Set();
    this.channelName = `cnpm-room-${roomId}`;
    this.closed = false;
    this.channel = typeof BroadcastChannel === 'undefined' ? null : new BroadcastChannel(this.channelName);

    if (this.channel) this.channel.onmessage = ({ data }) => this.receive(data);
    else {
      if (!fallbackChannels.has(this.channelName)) fallbackChannels.set(this.channelName, new Set());
      fallbackChannels.get(this.channelName).add(this.receive);
    }

    queueMicrotask(() => this.emit({ type: 'socket.open', payload: { roomId } }));
  }

  receive = (event) => {
    if (this.closed || event.senderId === this.user.id) return;
    if (event.targetId && event.targetId !== this.user.id) return;

    if (event.type === 'presence.request') {
      this.emit({ type: 'participant.joined', senderId: event.senderId, payload: event.payload });
      this.publish({ type: 'participant.present', targetId: event.senderId, payload: { participant: this.user } });
      return;
    }

    this.emit(event);
  };

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  emit(event) {
    this.listeners.forEach((listener) => listener(event));
  }

  publish(event) {
    const message = { ...event, senderId: this.user.id };
    if (this.channel) this.channel.postMessage(message);
    else publishFallback(this.channelName, message);
  }

  send(message) {
    if (this.closed) return false;
    if (message.type === 'auth') {
      this.emit({ type: 'room.ready', payload: { roomId: this.roomId } });
      this.publish({ type: 'presence.request', payload: { participant: this.user } });
      return true;
    }
    if (message.type === 'room.leave') {
      this.publish({ type: 'participant.left', payload: { participantId: this.user.id } });
      return true;
    }
    this.publish(message);
    return true;
  }

  close() {
    if (this.closed) return;
    this.send({ type: 'room.leave', payload: { roomId: this.roomId } });
    this.closed = true;
    if (this.channel) this.channel.close();
    else fallbackChannels.get(this.channelName)?.delete(this.receive);
    this.listeners.clear();
  }
}
