import test from 'node:test';
import assert from 'node:assert/strict';
import { apiErrorMessage, isValidEmail, validatePassword } from '../src/utils/validation.js';

test('email phải có domain đầy đủ', () => {
  assert.equal(isValidEmail('teacher@teacher'), false);
  assert.equal(isValidEmail('teacher@teacher.com'), true);
});

test('password tuân theo giới hạn 72 byte của backend', () => {
  assert.equal(validatePassword('12345678'), '');
  assert.match(validatePassword('😀'.repeat(20)), /72 byte/);
});

test('lỗi validation của backend được đổi thành thông báo theo field', () => {
  const error = {
    response: {
      data: {
        message: 'Request validation failed',
        data: {
          details: [{ loc: ['body', 'email'], type: 'value_error', msg: 'invalid email' }],
        },
      },
    },
  };
  assert.equal(apiErrorMessage(error), 'Email không hợp lệ. Ví dụ đúng: ten@example.com.');
});
