import { useRouter } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { FlatList, KeyboardAvoidingView, Platform, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { assistant } from '@/assistant';
import type { AssistantContext, ProposedSchedule, ProposedTask } from '@/assistant/types';
import { ChatInput } from '@/components/ChatInput';
import { ConfirmCard } from '@/components/ConfirmCard';
import { HelpButton } from '@/components/HelpButton';
import { MessageBubble } from '@/components/MessageBubble';
import { colors, sizes, type } from '@/components/theme';
import type { Weekday } from '@/domain/types';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  text: string;
}

const WEEKDAYS: Weekday[] = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

function buildContext(): AssistantContext {
  const now = new Date();
  return { now: now.toISOString(), weekday: WEEKDAYS[now.getDay()], memory: [], tasks: [] };
}

function describeSchedule(s: ProposedSchedule) {
  const times = s.times?.join(' and ') ?? '';
  if (s.type === 'daily') return `every day at ${times}`;
  if (s.type === 'weekly') return `on ${s.weekdays?.join(', ')} at ${times}`;
  return s.inMinutes ? `in ${s.inMinutes} minutes` : `${s.day ?? 'today'} at ${times}`;
}

function describeProposal(task: ProposedTask) {
  return `${task.title}, ${describeSchedule(task.schedule)}?`;
}

let nextId = 0;
const newId = () => String(nextId++);

export default function ChatScreen() {
  const router = useRouter();
  const listRef = useRef<FlatList<Message>>(null);
  const [messages, setMessages] = useState<Message[]>([
    { id: newId(), role: 'assistant', text: 'Hello, I am YARA. How can I help you today?' },
  ]);
  const [proposal, setProposal] = useState<ProposedTask | null>(null);
  const [busy, setBusy] = useState(false);

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
          buildContext(),
          setReply,
        );
        setReply(reply);
        if (action.type === 'propose_task' || action.type === 'propose_change') {
          setProposal(action.task);
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

  // Saving Tasks arrives with storage (B2); for now Yes only acknowledges.
  const answerProposal = (yes: boolean) => {
    setProposal(null);
    addAssistantMessage(yes ? 'Done. I will remind you.' : 'Okay, I will leave it as it is.');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>YARA</Text>
        <HelpButton />
      </View>
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: { fontSize: type.title, fontWeight: '700', color: colors.text },
  list: { padding: 16, gap: sizes.gap },
  footer: { padding: 12, borderTopWidth: 1, borderTopColor: colors.border },
});
