import type { MemoryFact, OnboardingForm, Task, Weekday } from '@/domain/types';

export interface ChatMessage {
  role: 'user' | 'assistant';
  text: string;
}

/** What the model says it wants to do. The app applies Task changes only after the User confirms. */
export type AssistantAction =
  | { type: 'none' }
  | { type: 'remember'; facts: string[] }
  | { type: 'propose_task'; task: ProposedTask }
  | { type: 'propose_change'; taskId: string; task: ProposedTask }
  | { type: 'propose_removal'; taskId: string }
  | { type: 'show_help' };

/** Date parts, not timestamps: the app computes the real time (see timing.ts). */
export interface ProposedSchedule {
  type: 'once' | 'daily' | 'weekly';
  times?: string[];
  weekdays?: Weekday[];
  /** For "once": a weekday name, "today" or "tomorrow". */
  day?: Weekday | 'today' | 'tomorrow';
  inMinutes?: number;
}

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
  reminderTexts(task: ProposedTask, context: AssistantContext): Promise<string[]>;
}
