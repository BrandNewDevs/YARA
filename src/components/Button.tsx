import { useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, type StyleProp, type ViewStyle } from 'react-native';

import { colors, sizes, type } from './theme';

type Variant = 'default' | 'secondary' | 'outline' | 'success' | 'destructive';

const variants: Record<Variant, { bg: string; fg: string; border: string }> = {
  default: { bg: colors.primary, fg: colors.onPrimary, border: colors.primary },
  secondary: { bg: colors.secondary, fg: colors.onSecondary, border: colors.secondary },
  outline: { bg: 'transparent', fg: colors.foreground, border: colors.border },
  success: { bg: colors.success, fg: colors.onSuccess, border: colors.success },
  destructive: { bg: colors.destructive, fg: colors.onDestructive, border: colors.destructive },
};

interface Props {
  label: string;
  /** Screen-reader name when the visible label is only an icon. */
  accessibilityLabel?: string;
  accessibilityHint?: string;
  expanded?: boolean;
  variant?: Variant;
  disabled?: boolean;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
  children?: ReactNode;
}

/** shadcn-style button: 56dp target, visible focus ring, pressed and disabled states. */
export function Button({
  label, accessibilityLabel, accessibilityHint, expanded, variant = 'default', disabled, onPress, style,
}: Props) {
  const [focused, setFocused] = useState(false);
  const v = variants[variant];
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: !!disabled, expanded }}
      disabled={disabled}
      onPress={onPress}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      style={({ pressed }) => [
        styles.base,
        { backgroundColor: v.bg, borderColor: focused ? colors.ring : v.border },
        focused && styles.focused,
        pressed && styles.pressed,
        disabled && styles.disabled,
        style,
      ]}>
      <Text style={[styles.label, { color: v.fg }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: sizes.button,
    minWidth: sizes.button,
    paddingHorizontal: 20,
    borderRadius: sizes.radius,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  focused: { borderWidth: 3 },
  pressed: { opacity: 0.8 },
  disabled: { opacity: 0.5 },
  label: { fontSize: type.body, fontWeight: '700' },
});
