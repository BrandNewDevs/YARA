import { StyleSheet, Text, View } from 'react-native';

import { Button } from './Button';
import { IconButton } from './IconButton';
import { colors, type } from './theme';

const pad = (n: number) => String(n).padStart(2, '0');
const wrap = (n: number, size: number) => ((n % size) + size) % size;

interface Props {
  label: string;
  /** "HH:MM", 24 hour. */
  value: string;
  onChange: (value: string) => void;
}

/** Big steppers instead of typing: hour, minute (steps of 5) and AM/PM. */
export function TimeField({ label, value, onChange }: Props) {
  const [h, m] = value.split(':').map(Number);
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  const set = (hour: number, minute: number) => onChange(`${pad(wrap(hour, 24))}:${pad(wrap(minute, 60))}`);

  return (
    <View accessibilityRole="adjustable" accessibilityLabel={label} style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.row}>
        <Stepper name="hour" text={String(hour12)} onMinus={() => set(h - 1, m)} onPlus={() => set(h + 1, m)} />
        <Text style={styles.colon}>:</Text>
        <Stepper name="minutes" text={pad(m)} onMinus={() => set(h, m - 5)} onPlus={() => set(h, m + 5)} />
        <Button
          label={h < 12 ? 'AM' : 'PM'}
          accessibilityLabel={`${h < 12 ? 'AM' : 'PM'}, tap to switch`}
          variant="secondary"
          onPress={() => set(h + 12, m)}
        />
      </View>
    </View>
  );
}

function Stepper({ name, text, onMinus, onPlus }: { name: string; text: string; onMinus: () => void; onPlus: () => void }) {
  return (
    <View style={styles.stepper}>
      <IconButton icon="plus" label={`More ${name}`} variant="default" onPress={onPlus} />
      <Text style={styles.value}>{text}</Text>
      <IconButton icon="minus" label={`Less ${name}`} variant="default" onPress={onMinus} />
    </View>
  );
}

const styles = StyleSheet.create({
  field: { gap: 8 },
  label: { color: colors.foreground, fontSize: type.small, fontWeight: '600' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  stepper: { alignItems: 'center', gap: 4 },
  value: { color: colors.foreground, fontSize: type.title, fontWeight: '700', minWidth: 48, textAlign: 'center' },
  colon: { color: colors.foreground, fontSize: type.title, fontWeight: '700' },
});
