import * as Speech from 'expo-speech';
import { getSetting } from '../domain/db';
import type { OnboardingForm } from '../domain/types';

let sequence = 0;
let watchdog: ReturnType<typeof setTimeout> | undefined;
export function stopReminderSpeech() {
  sequence++;
  clearTimeout(watchdog);
  void Speech.stop().catch(() => {});
}

export async function speakReminder(text: string, onError: (message: string) => void) {
  stopReminderSpeech();
  const current = sequence;
  try {
    const preferences = await getSetting<OnboardingForm['voice']>('voice');
    // Some browsers never resolve the voices list when no speech engine is installed.
    let timeout: ReturnType<typeof setTimeout> | undefined;
    const voices = await Promise.race([
      Speech.getAvailableVoicesAsync(),
      new Promise<Speech.Voice[]>(resolve => { timeout = setTimeout(() => resolve([]), 1500); }),
    ]).finally(() => clearTimeout(timeout));
    if (current !== sequence) return;
    const selected = voices.find(v => v.identifier === preferences?.id && /^en\b/i.test(v.language));
    const rate = typeof preferences?.rate === 'number' && Number.isFinite(preferences.rate)
      ? Math.max(0.5, Math.min(1.5, preferences.rate)) : 0.9;
    const failed = () => {
      if (current === sequence) onError('Voice is unavailable. You can read the Reminder below or try Read aloud.');
    };
    watchdog = setTimeout(failed, 10_000);
    Speech.speak(text, { language: selected?.language ?? 'en', voice: selected?.identifier, rate,
      onStart: () => { if (current === sequence) clearTimeout(watchdog); },
      onDone: () => { if (current === sequence) clearTimeout(watchdog); },
      onError: () => { if (current === sequence) clearTimeout(watchdog); failed(); },
    });
  } catch {
    if (current === sequence) onError('Voice is unavailable. The Reminder is still shown below.');
  }
}
