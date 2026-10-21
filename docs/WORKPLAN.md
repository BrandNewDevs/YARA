# YARA work plan

2 hours, two people, each with a coding agent. Rules are in `AGENTS.md`; tasks are in `docs/agents/person-a.md` and `docs/agents/person-b.md`.

## Demo thread (priority order, stop at the cut line)

1. Onboarding form -> Gemma builds Memory, proposes Tasks, writes Reminder texts -> User confirms.
2. Text chat where the Assistant adds or changes Tasks, always with a yes/no confirmation.
3. A scheduled Reminder fires; it is spoken when the User taps it or the app is open.
4. Help screen (Emergency Number, Trusted Contacts) plus the emergency keyword check.
5. Memory screen (view and edit facts).

--- cut line ---

6. Check-in follow-up conversation. 7. Voice-message input. 8. Full-day conversations.

## Timeline

| Time | Milestone |
| --- | --- |
| 0:20 | Contract confirmed by both; A exports `assistant` (mock) from `src/assistant/index.ts`; B has the route shell |
| 1:00 | **On-device checkpoint.** A7 streams a valid reply on the phone, or the demo runs on the laptop server (A6) |
| 1:30 | Integration: real assistant in the app, Reminders firing |
| 1:45 | Freeze features; rehearse the demo thread on the phone and fix only what breaks it |
| 2:00 | Done |

## Why these choices

- **On-device Gemma 4 E2B** through `react-native-litert-lm`: private, offline, schema-constrained JSON, audio-capable. The wrapper is young and unproven on RN 0.88, so a laptop-hosted Gemma sits behind the same `Assistant` interface as a fallback.
- **Voice out needs the app.** `expo-speech` is documented only for a live JS runtime, and Android 14+ limits full-screen alerts. With the phone locked a Reminder shows its text and plays a bundled sound; the voice speaks on tap. Speech with the phone locked is roadmap.
- **Onboarding is a form** with one free-text box: structured fields are reliable, and Gemma interprets the free text and builds Memory.
- **Roadmap (not built):** alert a Trusted Contact when a Check-in goes unanswered; recorded or family voices; Reminder wording tuned to the User's recent responses.
