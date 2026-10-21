import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text } from 'react-native';

import { colors, sizes, type } from './theme';

export function HelpButton() {
  const router = useRouter();
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => router.push('/help')}
      style={({ pressed }) => [styles.button, pressed && styles.pressed]}>
      <Text style={styles.label}>Help</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: sizes.button,
    minWidth: 96,
    paddingHorizontal: 20,
    borderRadius: sizes.radius,
    backgroundColor: colors.help,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { opacity: 0.8 },
  label: { color: colors.onHelp, fontSize: type.body, fontWeight: '700' },
});
