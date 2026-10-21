import * as SQLite from 'expo-sqlite';

import type { MemoryFact, ReminderTexts, Schedule, Task, TaskKind } from './types';

let opening: Promise<SQLite.SQLiteDatabase> | undefined;

/** Opens the database once; every function below shares it. */
function db() {
  opening ??= (async () => {
    const database = await SQLite.openDatabaseAsync('yara.db');
    await database.execAsync(`
      CREATE TABLE IF NOT EXISTS tasks (
        id TEXT PRIMARY KEY NOT NULL,
        kind TEXT NOT NULL,
        title TEXT NOT NULL,
        details TEXT,
        schedule TEXT NOT NULL,
        reminder_texts TEXT NOT NULL,
        created_at TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS memory_facts (
        id TEXT PRIMARY KEY NOT NULL,
        text TEXT NOT NULL,
        source TEXT NOT NULL,
        created_at TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY NOT NULL,
        value TEXT NOT NULL
      );
    `);
    return database;
  })();
  return opening;
}

const newId = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;

interface TaskRow {
  id: string;
  kind: TaskKind;
  title: string;
  details: string | null;
  schedule: string;
  reminder_texts: string;
  created_at: string;
}

function toTask(row: TaskRow): Task {
  return {
    id: row.id,
    kind: row.kind,
    title: row.title,
    ...(row.details ? { details: row.details } : {}),
    schedule: JSON.parse(row.schedule) as Schedule,
    reminderTexts: JSON.parse(row.reminder_texts) as ReminderTexts,
    createdAt: row.created_at,
  };
}

export type NewTask = Omit<Task, 'id' | 'createdAt'>;

export async function createTask(input: NewTask): Promise<Task> {
  const task: Task = { ...input, id: newId(), createdAt: new Date().toISOString() };
  await (await db()).runAsync(
    'INSERT INTO tasks (id, kind, title, details, schedule, reminder_texts, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
    task.id, task.kind, task.title, task.details ?? null,
    JSON.stringify(task.schedule), JSON.stringify(task.reminderTexts), task.createdAt,
  );
  return task;
}

export async function getTask(id: string): Promise<Task | null> {
  const row = await (await db()).getFirstAsync<TaskRow>('SELECT * FROM tasks WHERE id = ?', id);
  return row ? toTask(row) : null;
}

export async function listTasks(): Promise<Task[]> {
  const rows = await (await db()).getAllAsync<TaskRow>('SELECT * FROM tasks ORDER BY created_at');
  return rows.map(toTask);
}

/** Replaces everything except id and createdAt. Returns null if the Task does not exist. */
export async function updateTask(id: string, input: NewTask): Promise<Task | null> {
  const existing = await getTask(id);
  if (!existing) return null;
  await (await db()).runAsync(
    'UPDATE tasks SET kind = ?, title = ?, details = ?, schedule = ?, reminder_texts = ? WHERE id = ?',
    input.kind, input.title, input.details ?? null,
    JSON.stringify(input.schedule), JSON.stringify(input.reminderTexts), id,
  );
  return { ...input, id, createdAt: existing.createdAt };
}

export async function deleteTask(id: string): Promise<void> {
  await (await db()).runAsync('DELETE FROM tasks WHERE id = ?', id);
}

interface FactRow {
  id: string;
  text: string;
  source: string;
  created_at: string;
}

const toFact = (row: FactRow): MemoryFact => ({
  id: row.id, text: row.text, source: row.source, createdAt: row.created_at,
});

export async function createFact(text: string, source: string): Promise<MemoryFact> {
  const fact: MemoryFact = { id: newId(), text, source, createdAt: new Date().toISOString() };
  await (await db()).runAsync(
    'INSERT INTO memory_facts (id, text, source, created_at) VALUES (?, ?, ?, ?)',
    fact.id, fact.text, fact.source, fact.createdAt,
  );
  return fact;
}

export async function listFacts(): Promise<MemoryFact[]> {
  const rows = await (await db()).getAllAsync<FactRow>('SELECT * FROM memory_facts ORDER BY created_at');
  return rows.map(toFact);
}

export async function updateFact(id: string, text: string): Promise<void> {
  await (await db()).runAsync('UPDATE memory_facts SET text = ? WHERE id = ?', text, id);
}

export async function deleteFact(id: string): Promise<void> {
  await (await db()).runAsync('DELETE FROM memory_facts WHERE id = ?', id);
}

/** Settings are small JSON values: preferredName, contacts, voice, onboarded. */
export async function getSetting<T>(key: string): Promise<T | null> {
  const row = await (await db()).getFirstAsync<{ value: string }>('SELECT value FROM settings WHERE key = ?', key);
  return row ? (JSON.parse(row.value) as T) : null;
}

export async function setSetting(key: string, value: unknown): Promise<void> {
  await (await db()).runAsync(
    'INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
    key, JSON.stringify(value),
  );
}

export async function deleteSetting(key: string): Promise<void> {
  await (await db()).runAsync('DELETE FROM settings WHERE key = ?', key);
}
