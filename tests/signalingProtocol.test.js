import test from 'node:test';
import assert from 'node:assert/strict';
import { shouldReconnectSocket, toWireMessages } from '../src/realtime/signalingProtocol.js';

test('ICE candidate chỉ gửi các trường backend chấp nhận', () => {
  const [message] = toWireMessages({
    type: 'signal.ice',
    targetId: 'peer-1',
    payload: {
      candidate: 'candidate:1',
      sdpMid: '0',
      sdpMLineIndex: 0,
      usernameFragment: 'chrome-generated-value',
    },
  });

  assert.deepEqual(message, {
    type: 'ICE_CANDIDATE',
    target_id: 'peer-1',
    payload: {
      candidate: 'candidate:1',
      sdpMid: '0',
      sdpMLineIndex: 0,
    },
  });
});

test('socket bị thay thế không được tự reconnect', () => {
  assert.equal(shouldReconnectSocket(4001), false);
  assert.equal(shouldReconnectSocket(1000), false);
  assert.equal(shouldReconnectSocket(1006), true);
});
