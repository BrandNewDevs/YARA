import { StyleSheet, View } from 'react-native';

import { Button } from './Button';
import type { Weekday } from '@/domain/types';

const DAYS: { id: Weekday; short: string; long: string }[] = [
  { id: 'mon', short: 'Mon', long: 'Monday' },
  { id: 'tue', short: 'Tue', long: 'Tuesday' },
  { id: 'wed', short: 'Wed', long: 'Wednesday' },
  { id: 'thu', short: 'Thu', long: 'Thursday' },
  { id: 'fri', short: 'Fri', long: 'Friday' },
  { id: 'sat', short: 'Sat', long: 'Saturday' },
  { id: 'sun', short: 'Sun', long: 'Sunday' },
];

export function WeekdayPicker({ value, onChange }: { value?: Weekday; onChange: (day: Weekday) => void }) {
  return (
    <View accessibilityRole="radiogroup" style={styles.row}>
      {DAYS.map((d) => (
        <Button
          key={d.id}
          label={d.short}
          accessibilityLabel={d.long}
          selected={value === d.id}
          variant={value === d.id ? 'default' : 'outline'}
          onPress={() => onChange(d.id)}
          style={styles.day}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  day: { minWidth: 72, paddingHorizontal: 12 },
});
