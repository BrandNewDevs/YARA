import { StyleSheet, Text, View } from 'react-native';

import { colors, sizes, type } from './theme';

export function MessageBubble({ role, text }: { role: 'user' | 'assistant'; text: string }) {
  const isUser = role === 'user';
  return (
    <View accessible accessibilityLabel={`${isUser ? 'You' : 'YARA'}: ${text || 'typing'}`} style={[styles.bubble, isUser ? styles.user : styles.assistant]}>
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
  user: { alignSelf: 'flex-end', backgroundColor: colors.primary },
  assistant: { alignSelf: 'flex-start', backgroundColor: colors.secondary },
  text: { fontSize: type.body, lineHeight: 30, color: colors.foreground },
  userText: { color: colors.onPrimary },
});
