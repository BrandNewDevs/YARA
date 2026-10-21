import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, sizes, type } from './theme';

interface Props {
  question: string;
  onYes: () => void;
  onNo: () => void;
}

export function ConfirmCard({ question, onYes, onNo }: Props) {
  return (
    <View style={styles.card}>
      <Text style={styles.question}>{question}</Text>
      <View style={styles.row}>
        <Pressable accessibilityRole="button" onPress={onYes} style={[styles.button, styles.yes]}>
          <Text style={styles.label}>Yes</Text>
        </Pressable>
        <Pressable accessibilityRole="button" onPress={onNo} style={[styles.button, styles.no]}>
          <Text style={styles.label}>No</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 2,
    borderColor: colors.primary,
    borderRadius: sizes.radius,
    padding: 16,
    gap: sizes.gap,
    backgroundColor: colors.background,
  },
  question: { fontSize: type.body, lineHeight: 30, fontWeight: '600', color: colors.text },
  row: { flexDirection: 'row', gap: sizes.gap },
  button: {
    flex: 1,
    minHeight: sizes.button,
    borderRadius: sizes.radius,
    alignItems: 'center',
    justifyContent: 'center',
  },
  yes: { backgroundColor: colors.yes },
  no: { backgroundColor: colors.no },
  label: { color: colors.onPrimary, fontSize: type.body, fontWeight: '700' },
});
