# YARA work plan (2 hours, two people, each with a coding agent)

Vocabulary is in `GLOSSARY.md`. Use those words in code, prompts and UI.

## Demo thread (the cut line, in priority order)
1. Onboarding form -> Gemma builds Memory, proposes Tasks, writes Reminder texts -> User confirms.
2. Text chat where the Assistant adds or changes Tasks, always with a yes/no confirmation.
3. A scheduled Reminder fires; it is spoken when the User taps it or the app is open.
4. Help screen (Emergency Number, Trusted Contacts) plus a keyword check that runs before the model.
5. Memory screen (view and edit facts).
--- cut line: stop here if time is short ---
6. Check-in follow-up conversation. 7. Voice-message input. 8. Full-day conversations.

## Decisions already made
- Android only, English only, phone local time zone. Test phone: iQOO 10R (Snapdragon 8s Gen 3, Android 16).
- On-device Gemma 4 E2B through `react-native-litert-lm`. Laptop-hosted Gemma is the fallback behind the same `Assistant` interface. Hard checkpoint: if on-device does not stream a reply by about 1 hour in, demo on the laptop server.
- One model call returns `{ reply, action }` (see `ml/action.schema.json`). The model outputs date parts; the app computes timestamps.
- Gemma may add low-stakes Memory facts on its own. Any Task change is proposed in plain words and applied only after the User says yes.
- Reminder text is written by Gemma when the Task is created (three personalised variants, rotated). A fired Reminder always has stored text and never needs a model call.
- Medical advice is declined with a pointer to a doctor or pharmacist. Emergency phrases show the help screen.
- Voice out uses the phone's text-to-speech via `expo-speech`. It needs the app open or a tap; speech with the phone locked is roadmap.
- Notifications use `expo-notifications` with a bundled sound. Exact-alarm permission is requested once at the end of onboarding.

## Person A: `ml/` and `src/assistant/`
- `ml/`: choose the laptop engine that runs Gemma 4 E2B with schema-constrained output (Ollama or LiteRT-LM; check first), refine `prompt.md` and `action.schema.json`, grow `evals/cases.jsonl`, make `python ml/eval.py` pass.
- `src/assistant/`: replace `mock.ts` with `litert.ts` (on-device) and `server.ts` (laptop fallback) implementing `Assistant` from `types.ts`. Validate every reply against the schema. If a reply is invalid, return `{ reply: "Sorry, could you say that again?", action: { type: "none" } }`.
- Re-run the eval cases on the phone before trusting laptop results.

## Person B: screens, storage, notifications, speech
- `src/app/`: onboarding form, chat, Memory screen, help screen, Task list.
- `src/domain/`: SQLite storage for Tasks, Memory, Reminders; computing real timestamps from `ProposedSchedule`.
- Scheduling Reminders with `expo-notifications`; speaking with `expo-speech`; help screen reading the region for the Emergency Number.
- Code against `mockAssistant` until Person A's implementation lands.

## Shared rules
- Contract files: `src/domain/types.ts`, `src/assistant/types.ts`, `ml/action.schema.json`. Change them in a small PR and tell the other person.
- Separate branches, small PRs into `main`, merge `package.json`/`app.json` changes early.
- Before a PR: `npx tsc --noEmit` and `npx expo lint`.
