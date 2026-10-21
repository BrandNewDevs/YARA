import { Feather } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';

import { colors } from './theme';

interface Props {
  icon: keyof typeof Feather.glyphMap;
  /** Screen-reader name; the icon alone says nothing. */
  label: string;
  hint?: string;
  expanded?: boolean;
  variant?: 'default' | 'ghost';
  disabled?: boolean;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
}

/** Round icon button, 48dp target, visible focus ring. */
export function IconButton({ icon, label, hint, expanded, variant = 'ghost', disabled, onPress, style }: Props) {
  const [focused, setFocused] = useState(false);
  const filled = variant === 'default';
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={hint}
      accessibilityState={{ disabled: !!disabled, expanded }}
      disabled={disabled}
      onPress={onPress}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      style={({ pressed }) => [
        styles.base,
        filled && styles.filled,
        focused && styles.focused,
        pressed && styles.pressed,
        disabled && styles.disabled,
        style,
      ]}>
      <Feather name={icon} size={24} color={filled ? colors.onPrimary : colors.foreground} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  filled: { backgroundColor: colors.primary },
  focused: { borderColor: colors.ring },
  pressed: { opacity: 0.8 },
  disabled: { opacity: 0.4 },
});
