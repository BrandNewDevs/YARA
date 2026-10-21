import { useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { FlatList, KeyboardAvoidingView, Platform, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { assistant } from '@/assistant';
import type { AssistantContext, ProposedTask } from '@/assistant/types';
import { ChatInput } from '@/components/ChatInput';
import { ConfirmCard } from '@/components/ConfirmCard';
import { MessageBubble } from '@/components/MessageBubble';
import { MoreMenu } from '@/components/MoreMenu';
import { colors, sizes } from '@/components/theme';
import { describeSchedule } from '@/domain/describe';
import { createFact, createTask, deleteTask, getSetting, listFacts, listTasks, updateTask } from '@/domain/db';
import { toSchedule } from '@/domain/timing';
import type { Task, Weekday } from '@/domain/types';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  text: string;
}

const WEEKDAYS: Weekday[] = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

/** What the User has asked YARA to confirm before anything is saved. */
type Proposal =
  | { type: 'add'; task: ProposedTask }
  | { type: 'change'; taskId: string; task: ProposedTask }
  | { type: 'remove'; task: Task };

async function buildContext(): Promise<AssistantContext> {
  const now = new Date();
  const [memory, tasks] = await Promise.all([listFacts(), listTasks()]);
  return {
    now: now.toISOString(),
    weekday: WEEKDAYS[now.getDay()],
    memory,
    tasks: tasks.map(({ id, kind, title, schedule }) => ({ id, kind, title, schedule })),
  };
}

function describeProposal(p: Proposal) {
  if (p.type === 'remove') return `Remove ${p.task.title}?`;
  return `${p.task.title}, ${describeSchedule(p.task.schedule)}?`;
}

let nextId = 0;
const newId = () => String(nextId++);

export default function ChatScreen() {
  const router = useRouter();
  const listRef = useRef<FlatList<Message>>(null);
  const [messages, setMessages] = useState<Message[]>([
    { id: newId(), role: 'assistant', text: 'Hello, I am YARA. How can I help you today?' },
  ]);
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [busy, setBusy] = useState(false);

  // First run: send a new User through the questions before the chat.
  useEffect(() => {
    getSetting<boolean>('onboarded').then((done) => {
      if (!done) router.replace('/onboarding');
    });
  }, [router]);

  const scrollToEnd = useCallback(() => {
    requestAnimationFrame(() => listRef.current?.scrollToEnd({ animated: true }));
  }, []);

  const addAssistantMessage = useCallback(
    (text: string) => {
      setMessages((m) => [...m, { id: newId(), role: 'assistant', text }]);
      scrollToEnd();
    },
    [scrollToEnd],
  );

  const send = useCallback(
    async (text: string) => {
      const userMessage: Message = { id: newId(), role: 'user', text };
      const replyId = newId();
      const history = [...messages, userMessage];
      setMessages([...history, { id: replyId, role: 'assistant', text: '' }]);
      setProposal(null);
      setBusy(true);
      scrollToEnd();

      const setReply = (reply: string) => {
        setMessages((m) => m.map((x) => (x.id === replyId ? { ...x, text: reply } : x)));
        scrollToEnd();
      };

      try {
        const { reply, action } = await assistant.chat(
          history.map(({ role, text }) => ({ role, text })),
          await buildContext(),
          setReply,
        );
        setReply(reply);
        if (action.type === 'propose_task') {
          setProposal({ type: 'add', task: action.task });
        } else if (action.type === 'propose_change') {
          setProposal({ type: 'change', taskId: action.taskId, task: action.task });
        } else if (action.type === 'propose_removal') {
          const task = (await listTasks()).find((t) => t.id === action.taskId);
          if (task) setProposal({ type: 'remove', task });
        } else if (action.type === 'remember') {
          for (const fact of action.facts) await createFact(fact, text);
        } else if (action.type === 'show_help') {
          router.push('/help');
        }
      } catch {
        setReply('Sorry, could you say that again?');
      } finally {
        setBusy(false);
      }
    },
    [messages, router, scrollToEnd],
  );

  const answerProposal = async (yes: boolean) => {
    const current = proposal;
    setProposal(null);
    if (!yes || !current) {
      addAssistantMessage('Okay, I will leave it as it is.');
      return;
    }
    try {
      if (current.type === 'remove') {
        await deleteTask(current.task.id);
        addAssistantMessage('Done. I have removed it.');
        return;
      }
      const { task } = current;
      const context = await buildContext();
      const input = {
        kind: task.kind,
        title: task.title,
        ...(task.details ? { details: task.details } : {}),
        schedule: toSchedule(task.schedule, new Date()),
        reminderTexts: await assistant.reminderTexts(task, context),
      };
      if (current.type === 'change') await updateTask(current.taskId, input);
      else await createTask(input);
      addAssistantMessage('Done. I will remind you.');
    } catch {
      addAssistantMessage('Sorry, I could not save that. Could you ask me again?');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <FlatList
          ref={listRef}
          style={styles.flex}
          contentContainerStyle={styles.list}
          data={messages}
          keyExtractor={(m) => m.id}
          renderItem={({ item }) => <MessageBubble role={item.role} text={item.text} />}
          onContentSizeChange={scrollToEnd}
          keyboardShouldPersistTaps="handled"
          ListFooterComponent={
            proposal ? (
              <ConfirmCard
                question={describeProposal(proposal)}
                onYes={() => answerProposal(true)}
                onNo={() => answerProposal(false)}
              />
            ) : undefined
          }
        />
        <View style={styles.footer}>
          <ChatInput disabled={busy || proposal !== null} onSend={send} />
        </View>
      </KeyboardAvoidingView>
      <MoreMenu />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flex: 1, backgroundColor: colors.background },
  list: { padding: 16, paddingTop: 72, gap: sizes.gap },
  footer: { padding: 12 },
});
