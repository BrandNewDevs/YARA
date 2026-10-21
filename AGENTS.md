# YARA

Android app (Expo SDK 58, React Native 0.88, TypeScript) where an on-device Gemma 4 E2B model helps elderly Users keep their Routines and Appointments. Two people build it in 2 hours, each with a coding agent.

Use the words in `GLOSSARY.md` in code, UI text and prompts (Task, Routine, Appointment, Reminder, Memory, Check-in, Trusted Contact, Emergency Number).

## Which person are you?

Your human is Person A or Person B. Ask once if you don't know. Then read your file before touching code:

- **Person A** (model, prompts, evals, `src/assistant/`): `docs/agents/person-a.md`
- **Person B** (screens, storage, notifications, speech): `docs/agents/person-b.md`

Scope and the cut line live in `docs/WORKPLAN.md`. Work top-down through your task list; stop at the cut line and tell your human.

## Ownership

| Path | Owner |
| --- | --- |
| `ml/`, `src/assistant/` | A |
| `src/app/`, `src/components/`, `src/domain/` (except `types.ts`), `src/hooks/` | B |
| `package.json`, `app.json` | Whoever needs a change; merge it to `main` within minutes |

**Contract files** are `src/domain/types.ts`, `src/assistant/types.ts` and `ml/action.schema.json`. Both sides code against them. Change one in its own small PR titled `CONTRACT: ...` and tell your human to alert the other person. Keep the TypeScript types and the JSON schema in step in the same PR.

## Invariants

These are product rules. Code and prompts enforce them.

- **Confirm first.** The Assistant only proposes Task changes (`propose_task`, `propose_change`, `propose_removal`). The app applies one after the User taps Yes. Gemma adds low-stakes Memory facts (`remember`) on its own.
- **Emergency before model.** A keyword check in code (`src/domain/emergency.ts`) runs on every User message before Gemma. The help screen (Emergency Number, Trusted Contacts) is reachable in one tap from every screen.
- **Decline medical advice.** The Assistant never gives dosages or diagnoses. It points to a doctor or pharmacist.
- **Stored text fires.** Every Task keeps three Gemma-written `reminderTexts`, written when the Task is created. A fired Reminder uses stored text and needs no model call.
- **Date parts, not timestamps.** Gemma outputs weekdays, `HH:MM` and `inMinutes`. App code computes real times in the phone's local time zone.
- **One call, one JSON.** Each turn returns `{ reply, action }`, validated against `ml/action.schema.json`. An invalid reply becomes "Sorry, could you say that again?" with action `none`.
- **Plain words.** Android only, English only. Large type, high contrast, short sentences.
- **Private by default.** Memory and conversations stay on the phone.

## Workflow

- Branch per person and topic: `a/<topic>` or `b/<topic>`. Commit small and often, open a PR into `main` when a task's Done check passes. `main` takes PRs only.
- Tick a task's checkbox in your task file only after its **Done when** check passes. Paste the command and its output in the PR.
- Run `npx tsc --noEmit` and `npx expo lint` before every PR. Person A also runs `python ml/eval.py`.
- Keep changes inside your owned paths. Message your human when you need something from the other side.
- Match surrounding code: short comments, no unused dependencies.

## Run it

`android/` is generated and gitignored. Rebuild after adding a native module or changing `app.json` plugins; JS changes reload live.

```bash
export JAVA_HOME=/opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home
export ANDROID_HOME=/opt/homebrew/share/android-commandlinetools
export PATH=$JAVA_HOME/bin:$ANDROID_HOME/platform-tools:$PATH

adb devices                       # phone must show "device" (USB debugging on)
npx expo run:android --device <serial>   # native build + install (slow, only when native code changed)
npx expo start --dev-client       # JS dev server for the installed build
```

Test phone: iQOO 10R (Snapdragon 8s Gen 3, Android 16, ~7.4 GB RAM, arm64). The model runs on arm64 phones only, never on x86 emulators.

## Expo changes fast

Expo APIs differ from what you remember. Before writing code that touches an Expo, EAS or React Native API, read the matching page of the versioned docs at `https://docs.expo.dev/versions/v58.0.0/`, or find it through `https://docs.expo.dev/llms.txt`.

- Add packages with `npx expo install <package>` so versions match the SDK.
- Use Expo Router for navigation. Routes live in `src/app/`; components, hooks and utilities live outside it.
- Never hand-edit `android/`. Configure native behaviour in `app.json` and config plugins.
- Check `npx expo-doctor` after dependency changes.
