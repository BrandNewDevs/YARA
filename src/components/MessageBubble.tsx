import { StyleSheet, Text, View } from 'react-native';

import { colors, sizes, type } from './theme';

export function MessageBubble({ role, text }: { role: 'user' | 'assistant'; text: string }) {
  const isUser = role === 'user';
  return (
    <View style={[styles.bubble, isUser ? styles.user : styles.assistant]}>
      <Text style={[styles.text, isUser && styles.userText]}>{text || '...'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  bubble: {
    maxWidth: '85%',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: sizes.radius,
  },
  user: { alignSelf: 'flex-end', backgroundColor: colors.userBubble },
  assistant: { alignSelf: 'flex-start', backgroundColor: colors.assistantBubble },
  text: { fontSize: type.body, lineHeight: 30, color: colors.text },
  userText: { color: colors.onPrimary },
});
