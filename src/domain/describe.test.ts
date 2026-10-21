import assert from 'node:assert/strict';
import { test } from 'node:test';
import { describeSchedule, formatTime } from './describe';

test('formatTime uses a 12 hour clock', () => {
  assert.equal(formatTime('00:05'), '12:05 AM');
  assert.equal(formatTime('08:00'), '8:00 AM');
  assert.equal(formatTime('12:30'), '12:30 PM');
  assert.equal(formatTime('21:00'), '9:00 PM');
});

test('describeSchedule reads in plain words', () => {
  assert.equal(describeSchedule({ type: 'daily', times: ['08:00', '20:00'] }), 'every day at 8:00 AM and 8:00 PM');
  assert.equal(describeSchedule({ type: 'weekly', weekdays: ['mon'], times: ['10:00'] }), 'every mon at 10:00 AM');
  assert.equal(describeSchedule({ type: 'once', inMinutes: 10 }), 'in 10 minutes');
});
