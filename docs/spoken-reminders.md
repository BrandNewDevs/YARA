# Spoken Reminders

Open **More → Spoken Reminders → Enable spoken Reminders**. Use **Try voice**
to check the device's English voice. Voice can be turned off without disabling
text Reminders. Keep the browser tab open for the laptop demo.

A due Reminder shows its saved text with **Done**, **Later — 10 minutes**,
**Read aloud**, **Stop voice**, and **Help**. Done and Later are saved locally.
Each occurrence is claimed before automatic speech so polling and reloads do
not repeatedly read it. Read aloud is available if speech fails or was stopped.
Edited or deleted Tasks invalidate their old pending Reminders.

## Android delivery

Rebuild the development app after installing these changes: expo-speech,
expo-notifications, and the bundled notification sound require native code.
Use the project's usual `npx expo run:android --device <serial>` build flow.
No changes to generated `android/` are needed.

Enable notifications from the Spoken Reminders screen. Optionally allow precise
timing there; without it Android may delay delivery while idle. Daily, weekly,
and future one-off Tasks are scheduled with Android. Later schedules a separate
notification ten minutes ahead. Changes reconcile only YARA's own notifications.

While the app is closed, Android displays the stored text and plays a chime.
Tap the notification to open YARA and hear the Reminder when voice is enabled.
This implementation does not speak autonomously on the lock screen. Force-stop,
revoked permissions, disabled channel sound, and device power policies can prevent
or delay delivery. Browser tabs cannot provide closed-app delivery.

## Onboarding integration

No contract changes are needed. Save the existing voice preference with:

```ts
await setSetting('voice', { id: selectedVoice.identifier, rate: 0.9 });
```

Use an English voice identifier from `expo-speech.getAvailableVoicesAsync()`.
Missing or unavailable voices use the system English default. The supported rate
range is 0.5–1.5. Save `spokenReminders: true` only after the User enables speech;
notification permission still needs to be requested from the Reminder controls.

Persist onboarding facts as Memory through the existing storage helpers, including
`Prefers to be called <name>`. Pass those facts in `AssistantContext` when generating
Task reminderTexts. Save Tasks through `createTask` from `src/domain/db.ts`; the
Reminder provider subscribes to those writes and schedules them automatically.
Use `updateTask` and `deleteTask` for edits/removals so delivery stays in sync.

Reminders always use the Task's three stored reminderTexts. Firing, replaying,
and snoozing never call Gemma. A name change affects newly generated texts;
existing Tasks retain their stored wording.

## Verification

Automated tests cover due-time calculation, stable occurrence identity, stale Task
invalidation, all recurring slots, expired one-offs and snoozes. Web export and
Android JavaScript bundling are checked separately from native runtime behavior.

The embedded laptop browser has no available synthesis voices and reports
`synthesis-failed`; speech failure is visible and the text remains accessible.
Audible speech and background notification delivery need a rebuilt Android app
or a browser with a functioning speech engine. On the partner's phone, verify:

1. Enable speech and notifications; Try voice speaks English.
2. Confirm a Task a few minutes ahead; keep the app open and check speech once.
3. Use Later, then background the app; check the notification and chime.
4. Tap it, check speech and Done, then reopen and confirm it stays dismissed.
5. Repeat with the app swiped away; also check daily/weekly scheduling, Task
   edits/removals, denied permission, and precise timing while idle.

These phone checks are not marked complete by a successful JavaScript bundle.
