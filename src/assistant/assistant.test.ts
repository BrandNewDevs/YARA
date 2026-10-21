/// <reference types="node" />
import test from 'node:test';
import assert from 'node:assert/strict';
import { createAssistant, FALLBACK } from './assistant';
import { partialReply } from './stream';
import { createServerGenerate } from './server';
import { validators } from './schemas';
import { mockAssistant } from './mock';
import type { AssistantContext, ProposedTask } from './types';

const context: AssistantContext = { now: '2026-10-21T14:05:00+05:30', weekday: 'wed', memory: [], tasks: [] };
const task: ProposedTask = { kind: 'routine', title: 'Stretch', schedule: { type: 'daily', times: ['08:00'] } };
const valid = { reply: 'Shall I add this Routine?', action: { type: 'propose_task', task } };
const messages = [{ role: 'user' as const, text: 'Remind me to stretch every morning at 8' }];

test('valid action appears only after the full reply passes validation', async () => {
  const partials: string[] = [];
  const assistant = createAssistant(async request => {
    request.onText?.('{"reply":"Shall I');
    assert.deepEqual(partials, ['Shall I']);
    return JSON.stringify(valid);
  });
  assert.deepEqual(await assistant.chat(messages, context, text => partials.push(text)), valid);
  assert.equal(partials.at(-1), valid.reply);
});

test('invalid JSON, incomplete actions, unknown IDs and transport errors fall back', async () => {
  for (const raw of ['broken', JSON.stringify({ reply: 'Done', action: { type: 'propose_task' } }),
    JSON.stringify({ reply: 'Remove it?', action: { type: 'propose_removal', taskId: 'fiction' } }),
    JSON.stringify({ ...valid, reply: 'I have saved it.' })]) {
    assert.deepEqual(await createAssistant(async () => raw).chat(messages, context), FALLBACK);
  }
  assert.deepEqual(await createAssistant(async () => { throw new Error('offline'); }).chat(messages, context), FALLBACK);
});

test('chat does not accept a calculated date absent from supplied data', async () => {
  const response = { ...valid, action: { type: 'propose_task', task: { ...task, schedule: { type: 'once', date: '2026-10-22', times: ['08:00'] } } } };
  assert.deepEqual(await createAssistant(async () => JSON.stringify(response)).chat(messages, context), FALLBACK);
});

test('partial parser ignores nested replies and handles chunked escapes', () => {
  assert.equal(partialReply('{"action":{"reply":"not user text"}}'), undefined);
  assert.equal(partialReply('{"reply":"Hi\\u00'), 'Hi');
  assert.equal(partialReply('{"reply":"Hi\\u0021\\n\\"Ada'), 'Hi!\n"Ada');
  assert.equal(partialReply('{"reply":"Done","action":'), 'Done');
});

test('runtime schemas reject calendar errors, empty actions, and oversized Reminders', () => {
  assert.equal(validators.chat(valid), true);
  const bad = { ...valid, action: { type: 'propose_task', task: { ...task, schedule: { type: 'once', date: '2026-02-29', times: ['08:00'] } } } };
  assert.equal(validators.chat(bad), false);
  assert.equal(validators.reminders(['a'.repeat(160), 'b', 'c']), false);
  assert.equal(validators.reminders(['a', 'a', 'c']), false);
});

test('onboarding fails instead of dropping structured Tasks', async () => {
  const assistant = createAssistant(async () => JSON.stringify({ facts: [], tasks: [], welcome: 'Hi Ada.' }));
  await assert.rejects(assistant.onboard({ preferredName: 'Ada', medicines: [{ name: 'pill', times: ['08:00'] }], appointments: [],
    wakeTime: '07:00', sleepTime: '22:00', trustedContacts: [], freeText: '' }, context));
});

test('Reminder validation requires three different texts and the known name', async () => {
  const named = { ...context, memory: [{ id: 'm1', text: 'Prefers to be called Ada', source: 'User', createdAt: context.now }] };
  await assert.rejects(createAssistant(async () => '["Ada, one","Ada, two","three"]').reminderTexts(task, named));
  assert.deepEqual(await createAssistant(async () => '["Ada, one","Ada, two","Ada, three"]').reminderTexts(task, named), ['Ada, one', 'Ada, two', 'Ada, three']);
});

function streamResponse(parts: string[]) {
  return new Response(new ReadableStream({ start(controller) {
    for (const part of parts) controller.enqueue(new TextEncoder().encode(part));
    controller.close();
  } }));
}
test('server assembles split NDJSON and requires a completion event', async () => {
  const line = JSON.stringify({ message: { content: JSON.stringify(valid) }, done: true }) + '\n';
  const generate = createServerGenerate({ fetch: async () => streamResponse([line.slice(0, 13), line.slice(13)]) });
  assert.deepEqual(JSON.parse(await generate({ system: 'test', messages, schema: {} })), valid);
  const truncated = createServerGenerate({ fetch: async () => streamResponse([JSON.stringify({ message: { content: '{}' } })]) });
  await assert.rejects(truncated({ system: 'test', messages, schema: {} }), /Incomplete/);
});

test('server rejects HTTP errors and truncated generation', async () => {
  for (const response of [new Response('', { status: 500 }), streamResponse(['{"done":true,"done_reason":"length"}\n'])]) {
    await assert.rejects(createServerGenerate({ fetch: async () => response })({ system: '', messages, schema: {} }));
  }
});

test('mock asks for a missing time and covers onboarding and Reminder texts', async () => {
  const result = await mockAssistant.chat([{ role: 'user', text: 'Remind me to take my medicine' }], context);
  assert.equal(result.action.type, 'none');
  assert.match(result.reply, /\?/);
  const onboard = await mockAssistant.onboard({ preferredName: 'Ada', medicines: [], appointments: [{ what: 'Dentist', date: '2026-12-01', time: '10:00' }], wakeTime: '07:00', sleepTime: '22:00', trustedContacts: [], freeText: '' }, context);
  assert.equal(validators.onboard(onboard), true);
  assert.equal(validators.reminders(await mockAssistant.reminderTexts(onboard.tasks[0], context)), true);
});
