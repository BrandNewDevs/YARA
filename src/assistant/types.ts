import type { MemoryFact, OnboardingForm, ReminderTexts, Task, Weekday } from '@/domain/types';

export type NonEmptyArray<T> = [T, ...T[]];

export interface ChatMessage {
  role: 'user' | 'assistant';
  text: string;
}

/** What the model says it wants to do. The app applies Task changes only after the User confirms. */
export type AssistantAction =
  | { type: 'none' }
  | { type: 'remember'; facts: NonEmptyArray<string> }
  | { type: 'propose_task'; task: ProposedTask }
  | { type: 'propose_change'; taskId: string; task: ProposedTask }
  | { type: 'propose_removal'; taskId: string }
  | { type: 'show_help' };

/** Date parts, not timestamps. Validate values with action.schema.json before use. */
export type ProposedSchedule =
  | {
      type: 'daily';
      times: NonEmptyArray<string>;
      weekdays?: never;
      day?: never;
      date?: never;
      inMinutes?: never;
    }
  | {
      type: 'weekly';
      times: NonEmptyArray<string>;
      weekdays: NonEmptyArray<Weekday>;
      day?: never;
      date?: never;
      inMinutes?: never;
    }
  | {
      type: 'once';
      inMinutes: number;
      times?: never;
      weekdays?: never;
      day?: never;
      date?: never;
    }
  | {
      type: 'once';
      day: Weekday | 'today' | 'tomorrow';
      times: [string];
      weekdays?: never;
      date?: never;
      inMinutes?: never;
    }
  | {
      type: 'once';
      /** YYYY-MM-DD copied from explicit input; the app computes local fire time. */
      date: string;
      times: [string];
      weekdays?: never;
      day?: never;
      inMinutes?: never;
    };

export interface ProposedTask {
  kind: 'routine' | 'appointment';
  title: string;
  details?: string;
  schedule: ProposedSchedule;
}

export interface AssistantReply {
  reply: string;
  action: AssistantAction;
}

export interface AssistantContext {
  /** ISO timestamp, e.g. 2026-10-21T14:05:00+05:30 */
  now: string;
  weekday: Weekday;
  memory: MemoryFact[];
  tasks: Pick<Task, 'id' | 'kind' | 'title' | 'schedule'>[];
}

export interface OnboardingResult {
  facts: string[];
  tasks: ProposedTask[];
  welcome: string;
}

export type AssistantStatus =
  | { state: 'idle' }
  | { state: 'downloading'; progress: number }
  | { state: 'loading' }
  | { state: 'ready' }
  | { state: 'error'; message: string };

/** Model lifecycle, separate from generation so existing callers stay compatible. */
export interface AssistantPreparation {
  /** Idempotent; concurrent callers share preparation. Rejects after publishing error. */
  prepare(): Promise<void>;
  /** Immediately emits current status, then updates. Returns an unsubscribe function.
   * Download progress is between 0 and 1. An error can be retried with prepare(). */
  subscribe(listener: (status: AssistantStatus) => void): () => void;
}

export interface Assistant {
  /** One chat turn. onPartial receives the growing reply text while it streams. */
  chat(
    messages: ChatMessage[],
    context: AssistantContext,
    onPartial?: (replySoFar: string) => void,
  ): Promise<AssistantReply>;

  /** Turns the onboarding form into Memory facts and proposed Tasks. */
  onboard(form: OnboardingForm, context: AssistantContext): Promise<OnboardingResult>;

  /** Three differently worded Reminder texts for a Task, personalised from Memory. */
  reminderTexts(task: ProposedTask, context: AssistantContext): Promise<ReminderTexts>;
}
