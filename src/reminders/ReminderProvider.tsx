import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { AppState, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { usePathname, useRouter } from 'expo-router';
import { Button } from '../components/Button';
import { colors, sizes, type } from '../components/theme';
import { getSetting, listTasks, onTasksChanged, setSetting } from '../domain/db';
import { dueOccurrences, isCurrent, occurrence, taskVersion, type ReminderOccurrence } from './occurrences';
import { claimSpeech, finishReminder, outstandingReminders, postponeReminder, recordReminder } from './store';
import { enableExactAlarms, enableNotifications, listenForReminders, syncNotifications } from './notifications';
import { speakReminder, stopReminderSpeech } from './speech';
import { nextFireTime } from '../domain/timing';

interface ReminderControls {
  enabled: boolean;
  status: string;
  enable: () => Promise<void>;
  disable: () => Promise<void>;
  preciseTiming: () => Promise<void>;
  preview: () => void;
}
const Controls = createContext<ReminderControls | null>(null);
export function useReminderControls() {
  const context = useContext(Controls);
  if (!context) throw new Error('ReminderProvider is missing');
  return context;
}

export function ReminderProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [enabled, setEnabled] = useState(false);
  const [foreground, setForeground] = useState(AppState.currentState === 'active');
  const [status, setStatus] = useState('Enable voice to hear your Reminders.');
  const [active, setActive] = useState<ReminderOccurrence | null>(null);
  const [busy, setBusy] = useState(false);
  const [speechError, setSpeechError] = useState('');
  const since = useRef<number | null>(null);
  const queue = useRef(Promise.resolve());
  const mounted = useRef(true);
  const tick = useCallback(() => {
    const run = async () => {
      const tasks = await listTasks();
      const now = Date.now();
      for (const item of dueOccurrences(tasks, since.current ?? now - 60_000, now)) await recordReminder(item);
      since.current = now;
      const outstanding = await outstandingReminders();
      for (const item of outstanding) if (!isCurrent(item, tasks)) await finishReminder(item.id);
      const current = outstanding.filter(item => isCurrent(item, tasks));
      try { await syncNotifications(tasks, current.filter(item => item.status === 'snoozed')); }
      catch { if (mounted.current) setStatus('Notifications could not be prepared. Reminders still appear while YARA is open.'); }
      if (!mounted.current) return;
      setEnabled((await getSetting<boolean>('spokenReminders')) === true);
      const next = current.find(item => item.status === 'pending' || (item.snoozeUntil !== null && item.snoozeUntil <= now));
      setActive(previous => previous?.id === next?.id ? previous : next ?? null);
    };
    queue.current = queue.current.then(run).catch(() => {
      if (mounted.current) setStatus('Some Reminders could not be prepared. Open Reminders to try again.');
    });
    return queue.current;
  }, []);

  useEffect(() => {
    mounted.current = true;
    void tick();
    let polling = false;
    const interval = setInterval(() => {
      if (!polling && AppState.currentState === 'active') {
        polling = true;
        void tick().finally(() => { polling = false; });
      }
    }, 2000);
    const changes = onTasksChanged(tick);
    const app = AppState.addEventListener('change', state => {
      setForeground(state === 'active');
      if (state === 'active') void tick();
      else stopReminderSpeech();
    });
    const notifications = listenForReminders((data, deliveredAt, tapped) => {
      void (async () => {
        const tasks = await listTasks();
        const task = tasks.find(t => t.id === data.taskId && taskVersion(t) === data.version);
        if (!task) return;
        let reminderId = typeof data.occurrenceId === 'string' ? data.occurrenceId : undefined;
        if (!reminderId) {
          // Recover the scheduled minute even if Android delivers the notification late.
          let cursor = new Date(deliveredAt - 8 * 24 * 60 * 60_000);
          let fireAt: number | undefined;
          for (let i = 0; i < 12_000; i++) {
            const next = nextFireTime(task.schedule, cursor);
            if (!next || next.getTime() > deliveredAt) break;
            fireAt = next.getTime();
            cursor = next;
          }
          if (fireAt !== undefined) {
            const reminder = occurrence(task, fireAt);
            reminderId = reminder.id;
            await recordReminder(reminder);
          }
        }
        if (tapped && reminderId) {
          const reminder = (await outstandingReminders()).find(r => r.id === reminderId);
          if (reminder && (reminder.snoozeUntil === null || reminder.snoozeUntil <= Date.now())) {
            await claimSpeech(reminder.id);
            if (await getSetting<boolean>('spokenReminders')) void speakReminder(reminder.text, setSpeechError);
          }
        }
        await tick();
      })().catch(() => setStatus('The Reminder could not be opened. Please try again.'));
    });
    return () => { mounted.current = false; clearInterval(interval); changes(); app.remove(); notifications(); stopReminderSpeech(); };
  }, [tick]);

  useEffect(() => {
    let canceled = false;
    if (active && enabled && foreground) {
      void claimSpeech(active.id).then(claimed => {
        if (claimed && !canceled) { setSpeechError(''); void speakReminder(active.text, setSpeechError); }
      }).catch(() => setSpeechError('Tap Read aloud to hear this Reminder.'));
    }
    return () => { canceled = true; if (active) stopReminderSpeech(); };
  }, [active, enabled, foreground]);

  const enable = async () => {
    try {
      await setSetting('spokenReminders', true);
      setEnabled(true);
      void speakReminder('Spoken Reminders are on.', setSpeechError);
      setStatus(await enableNotifications());
      await tick();
    } catch { setStatus('Voice is on. Notifications could not be enabled; please try again.'); }
  };
  const disable = async () => {
    try {
      await setSetting('spokenReminders', false);
      setEnabled(false);
      stopReminderSpeech();
      setStatus('Voice is off. Text Reminders are still enabled.');
    } catch { setStatus('Could not save your voice preference. Please try again.'); }
  };
  const complete = async (later: boolean) => {
    if (!active || busy) return;
    setBusy(true);
    stopReminderSpeech();
    try {
      if (later) await postponeReminder(active.id, Date.now() + 10 * 60_000);
      else await finishReminder(active.id);
      setActive(null);
      await tick();
    } catch { setSpeechError('Could not save your response. Please try again.'); }
    finally { setBusy(false); }
  };
  return (
    <Controls.Provider value={{ enabled, status, enable, disable,
      preciseTiming: async () => { try { setStatus(await enableExactAlarms()); await tick(); } catch { setStatus('Precise timing could not be enabled. Reminders may arrive later.'); } },
      preview: () => { setSpeechError(''); void speakReminder('This is how your Reminder will sound.', setSpeechError); },
    }}>
      {children}
      {speechError && !active ? <Text accessibilityRole="alert" style={styles.error}>{speechError}</Text> : null}
      {active && foreground && pathname !== '/help' ? (
        <View style={styles.panel} accessibilityLiveRegion="polite">
          <ScrollView contentContainerStyle={styles.content}>
            <Text style={styles.heading}>Reminder</Text>
            <Text style={styles.text}>{active.text}</Text>
            {speechError ? <Text style={styles.text}>{speechError}</Text> : null}
            <Button label="Done" disabled={busy} onPress={() => { void complete(false); }} />
            <Button label="Later — 10 minutes" variant="secondary" disabled={busy} onPress={() => { void complete(true); }} />
            <Button label="Read aloud" variant="outline" onPress={() => { setSpeechError(''); void speakReminder(active.text, setSpeechError); }} />
            <Button label="Stop voice" variant="outline" onPress={stopReminderSpeech} />
            <Button label="Help" variant="outline" onPress={() => { stopReminderSpeech(); setActive(null); router.push('/help'); }} />
          </ScrollView>
        </View>
      ) : null}
    </Controls.Provider>
  );
}
const styles = StyleSheet.create({
  panel: { position: 'absolute', bottom: Platform.OS === 'web' ? 12 : 32, left: 12, right: 12, maxHeight: '80%',
    backgroundColor: colors.card, borderColor: colors.border, borderWidth: 2, borderRadius: sizes.radius, zIndex: 100 },
  content: { padding: 20, gap: sizes.gap },
  heading: { fontSize: type.title, color: colors.foreground, fontWeight: '700' },
  text: { fontSize: type.body, color: colors.foreground },
  error: { color: colors.foreground, backgroundColor: colors.card, fontSize: type.small, padding: 12 },
});
