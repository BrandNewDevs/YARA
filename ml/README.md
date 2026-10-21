# Gemma Assistant

Person A provides `assistant` and `assistantPreparation` from `src/assistant/index.ts`.
Person B owns screens, persistence, emergency detection, and notifications.

## Laptop engine and evaluation

Verified with Ollama 0.34.0 and `gemma4:e2b`. Run from the repository root:

```sh
ollama serve                     # omit if already running
ollama pull gemma4:e2b           # omit if installed
python3 -m venv .venv
. .venv/bin/activate
python -m pip install 'jsonschema>=4.22'
python ml/eval.py --case create-routine
python ml/eval.py --output /tmp/yara-laptop.json
python -m unittest discover -s ml/tests -v
npm ci
npm run test:assistant
npx tsc --noEmit
npx expo lint
npx expo-doctor
```

The evaluator sends raw schema-constrained requests, including thinking, and
scores raw responses before app fallback. Reports include artifact identity,
source hashes, settings, raw text, timing, and failures. All 36 synthetic cases
must be schema-valid; overall correctness must reach 90%, and safety and
onboarding/Reminder cases must all pass. CI tests deterministic behavior without
downloading a model. Results and known limitations are in [RESULTS.md](RESULTS.md).

## App integration for Person B

Set `EXPO_PUBLIC_ASSISTANT=mock|server|litert` before starting Metro; default is
mock. Restart Metro after changing environment settings. Import `assistant` from
`@/assistant`, replacing direct mock imports. Call `assistantPreparation.prepare()`
and subscribe to its status; unsubscribe when the screen unmounts. Display
`downloading.progress` (0–1), loading, ready, and retryable error states. This PR
provides those states; Person B must render them.

Run the code emergency check before every chat call, including in server mode.
`onPartial` supplies cumulative reply text: replace the current displayed text.
Never apply an action from streamed text. Await the final validated reply, then
show Yes/No for every Task proposal. Invalid chat output or transport failure
returns the specified apology with `none`. Onboarding and Reminder generation
throw `AssistantError`: retain the form/Task, display the message, and allow retry.
Onboarding tasks are proposals too. Generate and store all three `reminderTexts`
before saving a new Task. Fired Reminders use stored text without inference.

Contract changes include nonempty schedules/facts, an exact three-text tuple,
explicit-date one-offs, and the preparation interface. Alert Person B before
merging. The Assistant never saves Task or Memory state itself.

## Partner machine: phone checks

The User selected the partner machine for physical-device verification. Use an
arm64 Android phone with USB debugging authorized. These checks are still pending.
Use a development build, not Expo Go; never hand-edit generated `android/`.

```sh
npm ci
adb devices
EXPO_PUBLIC_ASSISTANT=server npx expo run:android --device <serial>
adb -s <serial> reverse tcp:11434 tcp:11434
EXPO_PUBLIC_ASSISTANT=server npx expo start --dev-client --clear
```

Ollama must run on the machine attached to the phone (pull `gemma4:e2b` there).
Default URL is `http://127.0.0.1:11434`; override with
`EXPO_PUBLIC_ASSISTANT_URL` only for a trusted development endpoint. Server mode
sends conversation context to that development machine. Use synthetic data.
Verify a streamed chat proposal, confirmation, onboarding, and three Reminder
texts through Person B's screens. Keep server mode as the demo fallback if native
loading fails.

For local inference, restart Metro with:

```sh
EXPO_PUBLIC_ASSISTANT=litert npx expo start --dev-client --clear
```

`prepare()` downloads the pinned 2,588,147,712-byte CPU artifact from the URL in
`src/assistant/litert.ts`, reports progress, and loads it once. Allow sufficient
free storage and memory. Incomplete owned downloads are discarded; preparation
can retry. Optional `EXPO_PUBLIC_MODEL_PATH` points to the same artifact already
in app-readable storage. Expected SHA-256:
`181938105e0eefd105961417e8da75903eacda102c4fce9ce90f50b97139a63c`.
Runtime checks pinned source, file length, and native parsing; it does not compute
SHA-256. Verify manually with `sha256sum` when supplying a local file.

Person B can temporarily wire a development control to:

```ts
import { runDeviceEvaluation } from '@/assistant/device-eval';
const report = await runDeviceEvaluation((done, total) => console.log(done, total));
// Export the returned JSON string to phone-raw.json using the app's debug UI.
```

This runs synthetic cases through the same native singleton and shared prompts,
without app fallback hiding raw failures. Record phone model, Android version,
app commit, peak memory/crashes, and whether the model was cached. Export the full
string without console truncation. Then score on the partner laptop:

```sh
python ml/eval.py --replay phone-raw.json --output phone-scored.json
python ml/compare.py ml/evals/results/laptop-final.json phone-scored.json
```

Use the same checkout for both runs. Cold preparation includes download if uncached;
`firstReplyMs` measures the first content token (including JSON syntax), not the
first visible reply character. Completion timing is preserved during replay.
Repeat after caching with airplane mode enabled, and exercise repeated turns,
load failure/retry, Help access, confirmation, and stored Reminder firing.
Record actual results in RESULTS.md before ticking A6–A8. No phone pass count or
complete end-to-end app demo is claimed yet.
