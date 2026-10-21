import { useState } from 'react';
import { StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';

import { colors, sizes, type } from './theme';

interface Props extends Pick<TextInputProps, 'keyboardType' | 'autoCapitalize' | 'multiline' | 'autoComplete'> {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
}

/** Label above a bordered dark input, with a focus ring. */
export function TextField({ label, value, onChangeText, placeholder, multiline, ...rest }: Props) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.muted}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        multiline={multiline}
        style={[styles.input, multiline && styles.multiline, focused && styles.focused]}
        {...rest}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  field: { gap: 8 },
  label: { color: colors.foreground, fontSize: type.small, fontWeight: '600' },
  input: {
    minHeight: sizes.button,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: type.body,
    color: colors.foreground,
    backgroundColor: colors.card,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: sizes.radius,
  },
  multiline: { minHeight: 140, textAlignVertical: 'top' },
  focused: { borderColor: colors.ring },
});
