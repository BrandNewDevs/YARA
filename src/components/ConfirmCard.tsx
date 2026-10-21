import { StyleSheet, Text, View } from 'react-native';

import { Button } from './Button';
import { colors, sizes, type } from './theme';

interface Props {
  question: string;
  onYes: () => void;
  onNo: () => void;
}

export function ConfirmCard({ question, onYes, onNo }: Props) {
  return (
    <View accessibilityRole="alert" style={styles.card}>
      <Text style={styles.question}>{question}</Text>
      <View style={styles.row}>
        <Button label="Yes" variant="success" onPress={onYes} style={styles.flex} />
        <Button label="No" variant="secondary" onPress={onNo} style={styles.flex} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 2,
    borderColor: colors.ring,
    borderRadius: sizes.radius,
    padding: 16,
    gap: sizes.gap,
    backgroundColor: colors.card,
  },
  question: { fontSize: type.body, lineHeight: 30, fontWeight: '600', color: colors.foreground },
  row: { flexDirection: 'row', gap: sizes.gap },
  flex: { flex: 1 },
});
