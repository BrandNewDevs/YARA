import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Button } from '../Button';
import { colors, sizes, type } from '../theme';

/** One question per screen: a heading, a plain sentence, then the answer controls. */
export function Question({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <View style={styles.question}>
      <Text accessibilityRole="header" style={styles.title}>{title}</Text>
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
      {children}
    </View>
  );
}

/** An answer already added, with a Remove button. */
export function AddedItem({ title, detail, onRemove }: { title: string; detail?: string; onRemove: () => void }) {
  return (
    <View style={styles.item}>
      <View style={styles.itemText}>
        <Text style={styles.itemTitle}>{title}</Text>
        {detail ? <Text style={styles.itemDetail}>{detail}</Text> : null}
      </View>
      <Button
        label="Remove"
        accessibilityLabel={`Remove ${title}`}
        variant="outline"
        onPress={onRemove}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  question: { gap: 16 },
  title: { color: colors.foreground, fontSize: type.title, fontWeight: '700', lineHeight: 36 },
  hint: { color: colors.muted, fontSize: type.body, lineHeight: 30 },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    backgroundColor: colors.card,
    borderRadius: sizes.radius,
  },
  itemText: { flex: 1, gap: 2 },
  itemTitle: { color: colors.foreground, fontSize: type.body, fontWeight: '600' },
  itemDetail: { color: colors.muted, fontSize: type.small },
});
