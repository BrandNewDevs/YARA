import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { ReminderProvider } from '@/reminders/ReminderProvider';

import { colors } from '@/components/theme';

export default function RootLayout() {
  return (
    <ReminderProvider>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }} />
    </ReminderProvider>
  );
}
