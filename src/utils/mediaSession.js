const sessions = new Map();
const retainedStreams = new WeakSet();

const createId = () => crypto.randomUUID();

export const retainMediaStream = (stream) => {
  if (!stream) return null;
  const id = createId();
  retainedStreams.add(stream);
  sessions.set(id, stream);
  return id;
};

export const takeRetainedMediaStream = (id) => {
  if (!id) return null;
  const stream = sessions.get(id) || null;
  sessions.delete(id);
  // Keep the weak retention mark until the old Lobby has unmounted. React may
  // run that cleanup after Meeting claims the stream; removing it here lets
  // Lobby stop a microphone that Meeting has just started sending.
  return stream;
};

export const isMediaStreamRetained = (stream) => Boolean(stream) && retainedStreams.has(stream);
