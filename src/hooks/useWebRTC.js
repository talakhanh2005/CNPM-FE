import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { fallbackIceServers } from '../config/iceServers';

const fallbackName = 'Người tham gia';
const isStable = (connection) => !connection.signalingState || connection.signalingState === 'stable';
const isLiveTrack = (track) => track?.readyState !== 'ended';

const useWebRTC = ({ user, localStream, mediaState, send, iceServers = fallbackIceServers }) => {
  const peersRef = useRef(new Map());
  const localStreamRef = useRef(localStream);
  const iceServersRef = useRef(iceServers);
  const remoteParticipantsRef = useRef([]);
  const [remoteParticipants, setRemoteParticipants] = useState([]);

  useLayoutEffect(() => {
    localStreamRef.current = localStream;
  }, [localStream]);

  useLayoutEffect(() => {
    iceServersRef.current = iceServers;
  }, [iceServers]);

  useEffect(() => {
    remoteParticipantsRef.current = remoteParticipants;
  }, [remoteParticipants]);

  const updateParticipant = useCallback((participant, patch = {}) => {
    if (!participant?.id || participant.id === user?.id) return;
    setRemoteParticipants((current) => {
      const existing = current.find((item) => item.id === participant.id);
      const username = participant.full_name || participant.username || existing?.name || fallbackName;
      const next = {
        ...existing,
        id: participant.id,
        name: username,
        initials: (participant.full_name || participant.username)?.[0]?.toUpperCase() || existing?.initials || 'U',
        role: participant.role || existing?.role,
        ...patch,
      };
      return existing
        ? current.map((item) => item.id === participant.id ? next : item)
        : [...current, next];
    });
  }, [user?.id]);

  const removePeer = useCallback((peerId) => {
    const peer = peersRef.current.get(peerId);
    if (peer?.disconnectTimer) window.clearTimeout(peer.disconnectTimer);
    peer?.connection.close();
    peersRef.current.delete(peerId);
    setRemoteParticipants((current) => current.filter((participant) => participant.id !== peerId));
  }, []);

  const requestOffer = useCallback(async (peer) => {
    if (!peer || peer.closed) return;
    peer.needsNegotiation = true;
    if (peer.makingOffer || !isStable(peer.connection)) return;

    peer.makingOffer = true;
    peer.needsNegotiation = false;
    try {
      const offer = await peer.connection.createOffer();
      // An offer from the other participant can arrive while createOffer waits.
      // Never apply this old offer after a remote description has been set.
      if (!isStable(peer.connection)) {
        peer.needsNegotiation = true;
        return;
      }
      await peer.connection.setLocalDescription(offer);
      const description = peer.connection.localDescription || offer;
      send({
        type: 'OFFER',
        target_id: peer.participant.id,
        payload: { type: description.type, sdp: description.sdp },
      });
    } catch {
      peer.needsNegotiation = true;
    } finally {
      peer.makingOffer = false;
    }
  }, [send]);

  const queueOffer = useCallback((peer) => {
    if (!peer || peer.closed) return;
    peer.needsNegotiation = true;
    if (peer.offerQueued) return;
    peer.offerQueued = true;
    queueMicrotask(() => {
      peer.offerQueued = false;
      void requestOffer(peer);
    });
  }, [requestOffer]);

  const syncPeerTracks = useCallback(async (peer, stream) => {
    if (!peer || !stream) return false;
    let tracksChanged = false;

    for (const track of stream.getTracks().filter(isLiveTrack)) {
      const sender = peer.senders.get(track.kind)
        || peer.connection.getSenders?.().find((item) => item.track?.kind === track.kind);
      if (sender?.track === track) continue;

      if (sender?.track && sender.replaceTrack) {
        await sender.replaceTrack(track);
        peer.senders.set(track.kind, sender);
      } else {
        // addTrack creates an m-line carrying this exact media kind. Do not
        // reuse an empty camera sender for audio: it caused the former race.
        const nextSender = peer.connection.addTrack(track, stream);
        peer.senders.set(track.kind, nextSender);
      }
      tracksChanged = true;
    }

    return tracksChanged;
  }, []);

  const createPeer = useCallback((participant) => {
    if (!participant?.id || participant.id === user?.id) return null;
    const existing = peersRef.current.get(participant.id);
    if (existing) {
      existing.participant = { ...existing.participant, ...participant };
      updateParticipant(participant);
      return existing;
    }
    if (!window.RTCPeerConnection) return null;

    const connection = new RTCPeerConnection({ iceServers: iceServersRef.current });
    const peer = {
      connection,
      participant,
      senders: new Map(),
      pendingCandidates: [],
      hasRemoteDescription: false,
      polite: String(user?.id) > String(participant.id),
      makingOffer: false,
      isSettingRemoteAnswerPending: false,
      ignoreOffer: false,
      needsNegotiation: false,
      offerQueued: false,
      closed: false,
      disconnectTimer: null,
    };
    peersRef.current.set(participant.id, peer);

    // A peer starts with only real local tracks. Empty video/audio transceivers
    // create duplicate m-lines when a microphone is enabled later.
    const activeLocalStream = localStreamRef.current;
    activeLocalStream?.getTracks().filter(isLiveTrack).forEach((track) => {
      const sender = connection.addTrack(track, activeLocalStream);
      peer.senders.set(track.kind, sender);
    });

    connection.onicecandidate = ({ candidate }) => {
      if (candidate) send({ type: 'ICE_CANDIDATE', target_id: participant.id, payload: candidate.toJSON() });
    };
    connection.onnegotiationneeded = () => {
      queueOffer(peer);
    };
    connection.ontrack = ({ streams, track }) => {
      const remoteStream = peer.remoteStream || streams[0] || new MediaStream();
      const replacedTrack = remoteStream.getTracks().find((currentTrack) => (
        currentTrack.kind === track.kind && currentTrack.id !== track.id
      ));
      if (replacedTrack) remoteStream.removeTrack(replacedTrack);
      if (!remoteStream.getTracks().some((currentTrack) => currentTrack.id === track.id)) {
        remoteStream.addTrack(track);
      }
      peer.remoteStream = remoteStream;
      updateParticipant(peer.participant, { stream: remoteStream });
    };
    connection.onconnectionstatechange = () => {
      if (['failed', 'closed'].includes(connection.connectionState)) {
        peer.closed = true;
        removePeer(participant.id);
        return;
      }
      if (connection.connectionState === 'disconnected') {
        if (!peer.disconnectTimer) {
          peer.disconnectTimer = window.setTimeout(() => {
            peer.disconnectTimer = null;
            if (connection.connectionState === 'disconnected') removePeer(participant.id);
          }, 5000);
        }
        return;
      }
      if (peer.disconnectTimer) {
        window.clearTimeout(peer.disconnectTimer);
        peer.disconnectTimer = null;
      }
    };
    updateParticipant(participant);
    return peer;
  }, [queueOffer, removePeer, send, updateParticipant, user?.id]);

  useEffect(() => {
    if (!localStream) return undefined;

    const syncTracks = async () => {
      await Promise.all([...peersRef.current.values()].map(async (peer) => {
        const tracksChanged = await syncPeerTracks(peer, localStream);
        if (tracksChanged) queueOffer(peer);
      }));
    };

    void syncTracks();
    return undefined;
  }, [localStream, queueOffer, syncPeerTracks]);

  const flushCandidates = useCallback(async (peer) => {
    for (const candidate of peer.pendingCandidates.splice(0)) {
      try {
        await peer.connection.addIceCandidate(candidate);
      } catch {
        // ICE from an offer that lost a glare race can arrive after rollback.
      }
    }
  }, []);

  const handleEvent = useCallback(async (event) => {
    const senderId = event?.sender_id || event?.senderId;
    if (!event) return;

    if (event.type === 'JOIN') {
      // The initial JOIN is sent by this socket and contains the already
      // connected peers. It must be processed before ignoring self-events.
      const peers = event.peers || [];
      peers.forEach((participant) => {
        const participantId = participant.user_id || participant.id;
        if (!participantId || participantId === user?.id) return;
        const peer = createPeer({
          id: participantId,
          role: participant.role,
          full_name: participant.full_name,
        });
        if (peer?.senders.size) queueOffer(peer);
      });
      if (senderId && senderId !== user?.id) {
        send({
          type: 'CAMERA_STATUS',
          payload: { enabled: mediaState.camera },
        });
        const peer = createPeer({ id: event.sender_id, role: event.role, full_name: event.full_name });
        if (peer?.senders.size) queueOffer(peer);
      }
      return;
    }
    if (senderId === user?.id) return;
    if (event.type === 'PRESENT') {
      const participantId = event.sender_id || event.user_id;
      const peer = participantId === user?.id ? null : createPeer({
        id: participantId,
        role: event.role,
        full_name: event.full_name,
      });
      if (peer?.senders.size) queueOffer(peer);
      return;
    }
    if (event.type === 'LEAVE') {
      removePeer(event.sender_id || event.senderId || event.participant_id);
      return;
    }
    if (event.type === 'CAMERA_STATUS' || event.type === 'MIC_STATUS') {
      const existing = remoteParticipantsRef.current.find((item) => item.id === senderId);
      updateParticipant({
        id: senderId,
        full_name: event.full_name || existing?.name,
        role: event.role,
      }, {
        ...(event.type === 'CAMERA_STATUS' ? { cameraOn: event.payload.enabled } : {}),
        ...(event.type === 'MIC_STATUS' ? { micOn: event.payload.enabled } : {}),
      });
      return;
    }
    if (event.type === 'EMOTION' || event.type === 'FRAME_RESULT') {
      updateParticipant({ id: event.student_id || senderId }, {
        emotion: event.emotion,
        confidence: event.confidence,
        faceDetected: event.face_detected,
        emotionStatus: event.emotion === 'fail_detection' ? event.failure_reason || 'ai_error' : 'ok',
        modelVersion: event.model_version,
      });
      return;
    }
    if (event.type === 'OFFER') {
      const peer = createPeer({
        id: senderId,
        full_name: event.full_name,
        role: event.role,
      });
      if (!peer) return;

      // Perfect negotiation: when both sides enable a track together, exactly
      // one side rolls back and answers. Microphone remains independent of cam.
      const readyForOffer = !peer.makingOffer
        && (isStable(peer.connection) || peer.isSettingRemoteAnswerPending);
      const offerCollision = !readyForOffer;
      peer.ignoreOffer = !peer.polite && offerCollision;
      if (peer.ignoreOffer) return;

      try {
        if (offerCollision && !isStable(peer.connection)) {
          await peer.connection.setLocalDescription({ type: 'rollback' });
        }
        await peer.connection.setRemoteDescription(event.payload);
        peer.hasRemoteDescription = true;
        peer.ignoreOffer = false;
        await flushCandidates(peer);

        // The answer contains all local senders attached at this instant,
        // including a mic enabled concurrently with the remote participant.
        peer.needsNegotiation = false;
        const answer = await peer.connection.createAnswer();
        await peer.connection.setLocalDescription(answer);
        const description = peer.connection.localDescription || answer;
        send({
          type: 'ANSWER',
          target_id: peer.participant.id,
          payload: { type: description.type, sdp: description.sdp },
        });
      } catch {
        peer.needsNegotiation = true;
        return;
      }

      if (peer.needsNegotiation) queueOffer(peer);
      return;
    }
    if (event.type === 'ANSWER') {
      const peer = peersRef.current.get(senderId);
      if (!peer) return;
      peer.isSettingRemoteAnswerPending = true;
      try {
        await peer.connection.setRemoteDescription(event.payload);
        peer.hasRemoteDescription = true;
        peer.ignoreOffer = false;
        await flushCandidates(peer);
      } catch {
        peer.needsNegotiation = true;
      } finally {
        peer.isSettingRemoteAnswerPending = false;
      }
      if (peer.needsNegotiation) queueOffer(peer);
      return;
    }
    if (event.type === 'ICE_CANDIDATE') {
      const peer = createPeer({
        id: senderId,
        full_name: event.full_name,
        role: event.role,
      });
      if (!peer || peer.ignoreOffer) return;
      if (!peer.hasRemoteDescription) {
        peer.pendingCandidates.push(event.payload);
        return;
      }
      try {
        await peer.connection.addIceCandidate(event.payload);
      } catch {
        // ICE can belong to an offer discarded during a simultaneous update.
      }
    }
  }, [createPeer, flushCandidates, mediaState.camera, queueOffer, removePeer, send, updateParticipant, user?.id]);

  useEffect(() => () => {
    peersRef.current.forEach((peer) => {
      peer.closed = true;
      if (peer.disconnectTimer) window.clearTimeout(peer.disconnectTimer);
      peer.connection.close();
    });
    peersRef.current.clear();
  }, []);

  return { remoteParticipants, handleEvent };
};

export default useWebRTC;
