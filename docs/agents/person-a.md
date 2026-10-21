# Person A: the model side

You own `ml/` (Python) and `src/assistant/` (TypeScript). Your job: make Gemma 4 E2B reply well and emit valid actions, then deliver that to the app behind the `Assistant` interface in `src/assistant/types.ts`.

Read first: `AGENTS.md` (invariants), `ml/action.schema.json`, `ml/prompt.md`, `src/assistant/types.ts`.

Person B codes against `mockAssistant` until you deliver. Swap-in happens through one export: `src/assistant/index.ts`.

## Python side rules

- Python 3.11+, deps in `ml/pyproject.toml` (`uv` or `pip -e`). Run scripts from the repo root.
- Rank prompt edits by `python ml/eval.py` results. Record each run (date, engine, pass count, failures) in `ml/RESULTS.md`.
- Keep prompts as `ml/*.md` templates with `{{placeholders}}`. The TypeScript side loads the same files, so the phone runs the prompt you tested.
- A small model drifts on long prompts. Prefer fewer, shorter rules and add examples (few-shot) for failures.

## Tasks

Time boxes are from the start of the 2 hours. Tick `[x]` only when **Done when** passes.

- [ ] **A1 Laptop engine (0:00-0:20).** Choose the engine that runs Gemma 4 E2B with schema-constrained JSON on your laptop. Candidates from research, each to be verified: Ollama, `llama-server` with the `ggml-org/gemma-4-E2B-it-GGUF` weights (supports JSON-schema output), LiteRT-LM tooling. Spend at most 15 minutes choosing.
  **Done when:** `ml/README.md` states the engine and the exact command that starts it, and one curl or Python call returns schema-valid JSON for the `create-routine` case.
- [ ] **A2 Baseline (0:20-0:35).** Implement `generate()` in `ml/eval.py` for that engine.
  **Done when:** `python ml/eval.py` runs all cases without crashing and `ml/RESULTS.md` has the first pass count.
- [ ] **A3 Eval set (0:35-0:55).** Grow `ml/evals/cases.jsonl` to at least 25 cases: routine, weekly appointment, one-off with `day`, `inMinutes`, missing time (must ask), change, removal, `remember`, small talk, messy phrasing ("half past eight", typos), at least 5 emergency phrasings, at least 5 medical-advice questions including "should I double my dose".
  **Done when:** the file has 25+ valid cases and every `expect.action` value in it exists in the schema.
- [ ] **A4 Prompt quality (0:55-1:15).** Iterate `ml/prompt.md`.
  **Done when:** schema-valid output on 100% of cases, 100% on emergency and medical-advice cases, at least 90% overall, recorded in `ml/RESULTS.md`.
- [ ] **A5 Onboarding and Reminder texts (in parallel with A4, ready by 1:15).** Add `ml/onboard.md` and `ml/reminder_texts.md` with schemas and 3 eval cases each. `onboard` takes an `OnboardingForm` and returns `OnboardingResult`; `reminder_texts` returns exactly 3 differently worded texts that use the User's preferred name.
  **Done when:** a sample form gives valid facts, tasks and welcome; a sample Task gives 3 distinct texts that all pass a length check (under 160 characters).
- [ ] **A6 Server assistant (by 1:00).** Write `src/assistant/server.ts`: an `Assistant` that calls the laptop engine over HTTP (phone reaches it through `adb reverse tcp:<port> tcp:<port>`), streams partial `reply` text through `onPartial`, validates against the schema (write a small validator or add `ajv` via `npx expo install`), and falls back as the invariant says. Add `src/assistant/index.ts` exporting `assistant`, chosen by `EXPO_PUBLIC_ASSISTANT` = `mock | server | litert` (default `mock`).
  **Done when:** `npx tsc --noEmit` passes, and from the phone one chat turn returns a valid `AssistantReply` from the laptop.
- [ ] **A7 On-device assistant (start at 0:30, decision at 1:00).** Write `src/assistant/litert.ts` with `react-native-litert-lm` (docs: its README at `node_modules/react-native-litert-lm/README.md`): download or `adb push` the model, load on CPU first, stream with `responseSchema` set to `ml/action.schema.json`. Show download progress to the User.
  **Done when:** on the phone, with `EXPO_PUBLIC_ASSISTANT=litert`, one chat turn streams a schema-valid `AssistantReply` and the load does not kill the app.
  **Checkpoint at 1:00:** if not Done, stop, write what failed in `ml/RESULTS.md`, tell your human, and the demo runs on A6.
- [ ] **A8 On-device eval (1:15-1:40).** Run the eval cases through the phone path (a debug screen or script) and compare with the laptop run.
  **Done when:** `ml/RESULTS.md` lists on-device pass count next to the laptop pass count, with each difference explained.

## Stretch (only after A8)

- [ ] **A9 Audio spike.** Send a 10-second `.m4a` from `expo-audio` to Gemma through the wrapper. **Done when:** a transcription or an `AssistantReply` returns, or the failure and the next option (WAV recording, `expo-speech-recognition`) is written in `ml/RESULTS.md`.
- [ ] **A10 Smarter Reminder text.** Regenerate a Reminder's text just before it is due while the app is open, using the latest Memory.

## Hand-offs

- To B at 0:20: `index.ts` exporting the mock (so B imports `assistant` from day one).
- To B at 1:00: server assistant. To B at the A7 checkpoint: on-device assistant or a note that it failed.
- From B: you need `OnboardingForm` shape changes and the `AssistantContext` they actually pass; ask your human if B changes either.
