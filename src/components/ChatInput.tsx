import { useState } from 'react';
import { Platform, StyleSheet, TextInput, View } from 'react-native';

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
  const [height, setHeight] = useState(MIN_HEIGHT);
  const canSend = !disabled && text.trim().length > 0;

  const send = () => {
    if (!canSend) return;
    onSend(text.trim());
    setText('');
  };

  return (
    <View style={styles.composer}>
      <TextInput
        accessibilityLabel="Message to YARA"
        value={text}
        onChangeText={setText}
        onSubmitEditing={send}
        placeholder="Type here"
        placeholderTextColor={colors.muted}
        // Grows with the text up to MAX_HEIGHT, then scrolls.
        onContentSizeChange={(e) =>
          setHeight(Math.min(MAX_HEIGHT, Math.max(MIN_HEIGHT, Math.ceil(e.nativeEvent.contentSize.height) + 20)))
        }
        style={[styles.input, { height }]}
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
    paddingVertical: 10,
    fontSize: type.body,
    color: colors.foreground,
    // Web would draw its own outline around the text box.
    ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as object) : {}),
  },
});
