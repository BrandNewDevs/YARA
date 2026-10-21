import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { colors, sizes, type } from './theme';

interface Props {
  disabled?: boolean;
  onSend: (text: string) => void;
}

export function ChatInput({ disabled, onSend }: Props) {
  const [text, setText] = useState('');
  const canSend = !disabled && text.trim().length > 0;

  const send = () => {
    if (!canSend) return;
    onSend(text.trim());
    setText('');
  };

  return (
    <View style={styles.row}>
      <TextInput
        value={text}
        onChangeText={setText}
        onSubmitEditing={send}
        placeholder="Type here"
        placeholderTextColor={colors.muted}
        style={styles.input}
        multiline
        returnKeyType="send"
        submitBehavior="blurAndSubmit"
      />
      <Pressable
        accessibilityRole="button"
        disabled={!canSend}
        onPress={send}
        style={[styles.send, !canSend && styles.disabled]}>
        <Text style={styles.sendLabel}>Send</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: sizes.gap, alignItems: 'flex-end' },
  input: {
    flex: 1,
    minHeight: sizes.button,
    maxHeight: 140,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: type.body,
    color: colors.text,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: sizes.radius,
  },
  send: {
    minHeight: sizes.button,
    minWidth: 96,
    paddingHorizontal: 20,
    borderRadius: sizes.radius,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabled: { opacity: 0.4 },
  sendLabel: { color: colors.onPrimary, fontSize: type.body, fontWeight: '700' },
});
