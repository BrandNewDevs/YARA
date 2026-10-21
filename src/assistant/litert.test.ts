/// <reference types="node" />
import test from 'node:test';
import assert from 'node:assert/strict';
import { createLiteRTBackend, MODEL, type NativeRuntime } from './litert';

function fakeNative() {
  let ready = false;
  let loads = 0;
  let active = 0;
  let peak = 0;
  const resets: (string | undefined)[] = [];
  const native: NativeRuntime = {
    ModelRegistry: {
      async resolveModel(_path, options) { options?.onProgress?.(.5); return '/cached/model.litertlm'; },
      getFileSizeBytes() { return MODEL.bytes; },
      deleteFile() {},
    },
    createLLM() { return {
      async loadModel(_path, config) {
        assert.equal(config?.backend, 'cpu');
        assert.equal(config?.enableStructuredOutput, true);
        loads++; ready = true;
      },
      isReady() { return ready; },
      resetConversation(history) { resets.push(history); },
      async execute(_parts, onToken, options) {
        assert.ok(options?.responseSchema);
        active++; peak = Math.max(peak, active);
        await new Promise(resolve => setTimeout(resolve, 5));
        const raw = '{"reply":"Hello","action":{"type":"none"}}';
        onToken?.(raw, true); active--; return raw;
      },
    }; },
  };
  return { native, resets, get loads() { return loads; }, get peak() { return peak; } };
}

test('native preparation is shared; turns serialize and replay the supplied transcript', async () => {
  const fake = fakeNative();
  const backend = createLiteRTBackend({ loadNative: async () => fake.native });
  const states: string[] = [];
  const unsubscribe = backend.subscribe(status => states.push(status.state));
  await Promise.all([backend.prepare(), backend.prepare()]);
  assert.equal(fake.loads, 1);
  assert.deepEqual(states, ['idle', 'downloading', 'downloading', 'loading', 'ready']);
  const request = { system: 'system', messages: [{ role: 'assistant' as const, text: 'Earlier' }, { role: 'user' as const, text: 'Hello' }], schema: {} };
  await Promise.all([backend.generate(request), backend.generate(request)]);
  assert.equal(fake.peak, 1);
  assert.equal(fake.loads, 1);
  assert.deepEqual(JSON.parse(fake.resets[0]!), [{ role: 'model', content: 'Earlier' }]);
  assert.equal(fake.resets.at(-1), undefined);
  unsubscribe();
});

test('failed preparation is observable and can be retried', async () => {
  const fake = fakeNative();
  let failures = 1;
  const backend = createLiteRTBackend({ loadNative: async () => {
    if (failures--) throw new Error('native unavailable');
    return fake.native;
  } });
  const states: string[] = [];
  backend.subscribe(s => states.push(s.state));
  await assert.rejects(backend.prepare());
  assert.equal(states.at(-1), 'error');
  await backend.prepare();
  assert.equal(states.at(-1), 'ready');
});

test('incomplete downloaded models are removed before retry, never loaded', async () => {
  const fake = fakeNative();
  let removed = false;
  fake.native.ModelRegistry.getFileSizeBytes = () => 42;
  fake.native.ModelRegistry.deleteFile = () => { removed = true; };
  const backend = createLiteRTBackend({ loadNative: async () => fake.native });
  await assert.rejects(backend.prepare(), /incomplete/);
  assert.equal(removed, true);
  assert.equal(fake.loads, 0);
});
