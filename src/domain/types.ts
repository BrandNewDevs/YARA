export type Weekday = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';

/** Times are "HH:MM" in the phone's local time zone. */
export type Schedule =
  | { type: 'daily'; times: string[] }
  | { type: 'weekly'; weekdays: Weekday[]; times: string[] }
  | { type: 'once'; date: string; time: string }; // date is "YYYY-MM-DD"

export type TaskKind = 'routine' | 'appointment';

export interface Task {
  id: string;
  kind: TaskKind;
  title: string;
  details?: string;
  schedule: Schedule;
  /** Gemma-written Reminder texts; the app rotates through them. Never empty. */
  reminderTexts: string[];
  createdAt: string;
}

export interface MemoryFact {
  id: string;
  text: string;
  /** What the User said that produced this fact. */
  source: string;
  createdAt: string;
}

export interface TrustedContact {
  name: string;
  phone: string;
}

export interface OnboardingForm {
  preferredName: string;
  medicines: { name: string; times: string[] }[];
  appointments: { what: string; where?: string; weekday?: Weekday; date?: string; time: string }[];
  wakeTime: string;
  sleepTime: string;
  trustedContacts: TrustedContact[];
  voice?: { id?: string; rate?: number };
  freeText: string;
}
