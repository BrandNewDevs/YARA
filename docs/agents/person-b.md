# Person B: the app side

You own everything the User sees and touches: `src/app/`, `src/components/`, `src/hooks/`, `src/domain/` (except `types.ts`, a contract file), notifications and speech.

Read first: `AGENTS.md` (invariants), `src/domain/types.ts`, `src/assistant/types.ts`, `GLOSSARY.md`.

Import the model through `import { assistant } from '@/assistant'`. Until Person A ships `src/assistant/index.ts` (planned by 0:20), import `mockAssistant` from `@/assistant/mock`. Person A swaps the real one in behind the same name.

## UI rules for elderly Users

- Body text at least 20 sp, buttons at least 56 dp tall, high contrast, one primary action per screen.
- Short sentences, no icons without a text label, confirmation buttons say "Yes" and "No".
- Test with the system font scale at the largest setting.
- Every screen has a persistent "Help" button that opens `/help`.

## Tasks

Time boxes are from the start of the 2 hours. Tick `[x]` only when **Done when** passes.

- [ ] **B1 Shell (0:00-0:20).** Expo Router routes: `/onboarding`, `/` (chat), `/tasks`, `/memory`, `/help`, with a first-run gate that sends a new User to `/onboarding`. Shared theme in `src/components/` (large type, high contrast).
  **Done when:** on the phone, a fresh install lands on `/onboarding`, and after onboarding the app lands on `/`; every route renders and shows the Help button.
- [ ] **B2 Storage (0:20-0:45).** `src/domain/db.ts` with `expo-sqlite`: tables for tasks, memory facts, settings (preferred name, contacts, voice, onboarding flag). Functions to create, read, update and delete each.
  **Done when:** data written on the phone is still there after `adb shell am force-stop com.yara.assistant` and relaunch.
- [ ] **B3 Timing (parallel with B2).** `src/domain/timing.ts`: pure functions turning a `ProposedSchedule` plus `now` into a `Schedule` and the next fire time, in local time. Use relative imports only (no `@/` alias) so Node can run it.
  **Done when:** `node --experimental-strip-types --test src/domain/timing.test.ts` passes for: daily, weekly, `day: 'tomorrow'`, a weekday that is today but already past, `inMinutes`, and a time just after midnight.
- [ ] **B4 Onboarding (0:45-1:10).** Form: preferred name, medicines (name, times), regular appointments, wake and sleep time, Trusted Contacts (name, phone), voice choice, one free-text box. On submit, call `assistant.onboard`, show a summary screen of the Memory facts and proposed Tasks, and save only after the User taps "Yes".
  **Done when:** on the phone, submitting a filled form shows a summary, "Yes" saves it, and `/tasks` and `/memory` list what was saved.
- [ ] **B5 Emergency and help (parallel, by 1:00).** `src/domain/emergency.ts` (keyword and phrase check, exported `looksLikeEmergency(text)`), `src/domain/emergency-numbers.ts` (region code to number, from `expo-localization`, with a safe default), and `/help` listing the Emergency Number and Trusted Contacts as large buttons that open the dialer (`tel:` link).
  **Done when:** `looksLikeEmergency` passes a test with 10 phrases (5 emergencies, 5 normal sentences such as "this traffic is killing me"), and pressing a number on the phone opens the dialer with that number.
- [ ] **B6 Chat (1:00-1:30).** Chat screen with streaming reply (`onPartial`), a keyword check before every model call, and a confirm card for `propose_task`, `propose_change` and `propose_removal` (Yes applies it; No discards it). `remember` saves facts silently. `show_help` navigates to `/help`. When a Task is saved, call `assistant.reminderTexts` and store the three texts.
  **Done when:** on the phone, typing "remind me to take my pills every day at 8" shows a confirm card, "Yes" creates the Task with three stored texts, and "I feel chest pain" opens `/help` without a model call.
- [ ] **B7 Reminders (0:45-1:30, in parallel with B4-B6).** `expo-notifications`: ask for notification permission, create a high-importance channel with a bundled `.wav` sound (new sound means new channel id), schedule one notification per time slot from each Task's schedule (daily, weekly, date), rotating `reminderTexts`. After onboarding, request exact-alarm permission with a plain explanation and carry on if refused. Re-schedule on edit and delete.
  **Done when:** a Reminder scheduled 1 minute ahead fires with the screen off after `adb shell am force-stop com.yara.assistant`, shows the stored text, and plays the sound.
- [ ] **B8 Spoken Reminders (1:30-1:45).** Tapping a Reminder notification opens the app on a Reminder screen that speaks the text with `expo-speech` (voice and rate from settings), shows Done and Later buttons, and also speaks when the app is already open at fire time.
  **Done when:** tapping the notification on the phone speaks the stored text aloud and "Done" marks the occurrence done.
- [ ] **B9 Lists (as time allows after B6).** `/tasks` lists Tasks with delete; `/memory` lists facts with edit and delete.
  **Done when:** deleting a Task on the phone also cancels its scheduled notifications.

## Stretch (below the cut line, only after B9)

- [ ] **B10 Check-in.** When a Reminder is done or postponed by chat, the Assistant answers ("not yet, ten minutes" snoozes).
- [ ] **B11 Voice message.** Hold-to-record with `expo-audio`, 30 seconds maximum, sent through the assistant once Person A's A9 spike works.

## Hand-offs

- To A at 0:20: the `OnboardingForm` shape if you change it, and the `AssistantContext` you pass (`now`, `weekday`, Memory, Tasks).
- From A: `src/assistant/index.ts` at 0:20, the server assistant at 1:00, on-device or a failure note at the 1:00 checkpoint.
- Final 15 minutes (1:45-2:00): rehearse the demo thread in `docs/WORKPLAN.md` end to end on the phone and fix only what breaks it.
