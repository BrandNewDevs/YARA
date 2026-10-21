import * as SQLite from 'expo-sqlite';
import type { ReminderOccurrence } from './occurrences';

let opening: Promise<SQLite.SQLiteDatabase> | undefined;
function db() {
  opening ??= (async () => {
    const database = await SQLite.openDatabaseAsync('yara-reminders.db');
    await database.execAsync(`CREATE TABLE IF NOT EXISTS occurrences (
      id TEXT PRIMARY KEY NOT NULL, taskId TEXT NOT NULL, version TEXT NOT NULL,
      title TEXT NOT NULL, text TEXT NOT NULL, fireAt INTEGER NOT NULL,
      status TEXT NOT NULL, snoozeUntil INTEGER, spoken INTEGER NOT NULL DEFAULT 0
    )`);
    return database;
  })();
  return opening;
}
export async function recordReminder(r: ReminderOccurrence) {
  await (await db()).runAsync('INSERT OR IGNORE INTO occurrences (id,taskId,version,title,text,fireAt,status,snoozeUntil,spoken) VALUES (?,?,?,?,?,?,?,?,?)',
    r.id, r.taskId, r.version, r.title, r.text, r.fireAt, r.status, r.snoozeUntil, r.spoken);
}
export async function outstandingReminders() {
  return (await db()).getAllAsync<ReminderOccurrence>("SELECT * FROM occurrences WHERE status != 'done' ORDER BY fireAt");
}
export async function finishReminder(id: string) {
  await (await db()).runAsync("UPDATE occurrences SET status = 'done' WHERE id = ?", id);
}
export async function postponeReminder(id: string, until: number) {
  await (await db()).runAsync("UPDATE occurrences SET status = 'snoozed', snoozeUntil = ?, spoken = 0 WHERE id = ?", until, id);
}
export async function claimSpeech(id: string) {
  const result = await (await db()).runAsync('UPDATE occurrences SET spoken = 1 WHERE id = ? AND spoken = 0', id);
  return result.changes === 1;
}

export async function clearReminderHistory() {
  await (await db()).runAsync('DELETE FROM occurrences');
}
