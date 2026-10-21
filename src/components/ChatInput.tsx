import { useLayoutEffect, useRef, useState, type ComponentRef } from 'react';
import { Platform, StyleSheet, TextInput, View, type TextInputKeyPressEvent } from 'react-native';

import { IconButton } from './IconButton';
import { colors, sizes, type } from './theme';

interface Props {
  disabled?: boolean;
  onSend: (text: string) => void;
}

const MIN_HEIGHT = 56;
const MAX_HEIGHT = 180;

export function ChatInput({ disabled, onSend }: Props) {
  const [text, setText] = useState('');
  const inputRef = useRef<ComponentRef<typeof TextInput>>(null);
  const caret = useRef<number | null>(null);
  const canSend = !disabled && text.trim().length > 0;

  // Web: Enter sends; Cmd/Ctrl+Enter inserts a line break at the cursor. On a phone the
  // keyboard's send key submits instead.
  const onKeyPress = (e: TextInputKeyPressEvent) => {
    if (Platform.OS !== 'web') return;
    const key = e.nativeEvent as { key: string; metaKey?: boolean; ctrlKey?: boolean };
    if (key.key !== 'Enter') return;
    e.preventDefault();
    if (key.metaKey || key.ctrlKey) {
      const el = inputRef.current as unknown as HTMLTextAreaElement | null;
      const start = el?.selectionStart ?? text.length;
      const end = el?.selectionEnd ?? text.length;
      caret.current = start + 1;
      setText(text.slice(0, start) + '\n' + text.slice(end));
    } else {
      send();
    }
  };

  // Native multiline inputs grow between minHeight and maxHeight on their own. The web
  // textarea does not, so measure it: collapse, then fit to scrollHeight (padding included).
  useLayoutEffect(() => {
    if (Platform.OS !== 'web') return;
    const el = inputRef.current as unknown as HTMLTextAreaElement | null;
    if (!el) return;
    if (caret.current !== null) {
      el.setSelectionRange(caret.current, caret.current);
      caret.current = null;
    }
    el.style.height = 'auto';
    el.style.height = `${Math.min(MAX_HEIGHT, Math.max(MIN_HEIGHT, el.scrollHeight))}px`;
  }, [text]);

  const send = () => {
    if (!canSend) return;
    onSend(text.trim());
    setText('');
  };

  return (
    <View style={styles.composer}>
      <TextInput
        ref={inputRef}
        accessibilityLabel="Message to YARA"
        value={text}
        onChangeText={setText}
        onKeyPress={onKeyPress}
        onSubmitEditing={Platform.OS === 'web' ? undefined : send}
        placeholder="Type here"
        placeholderTextColor={colors.muted}
        style={styles.input}
        multiline
        returnKeyType="send"
        submitBehavior="blurAndSubmit"
      />
      <IconButton icon="arrow-right" label="Send" variant="default" disabled={!canSend} onPress={send} />
    </View>
  );
}

const styles = StyleSheet.create({
  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    paddingLeft: 16,
    paddingRight: 8,
    paddingVertical: 12,
    backgroundColor: colors.card,
    borderRadius: sizes.radius + 8,
  },
  input: {
    flex: 1,
    minHeight: MIN_HEIGHT,
    maxHeight: MAX_HEIGHT,
    paddingVertical: 10,
    fontSize: type.body,
    color: colors.foreground,
    // Web would draw its own outline around the text box.
    ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as object) : {}),
  },
});
