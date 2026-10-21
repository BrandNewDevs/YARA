import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Platform, StyleSheet, View } from 'react-native';

import { colors } from '@/components/theme';

// On a wide browser window the app stays phone-sized (375x720 at most), centred on a gray backdrop.
export default function RootLayout() {
  return (
    <View style={styles.backdrop}>
      <View style={styles.frame}>
        <StatusBar style="light" />
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: colors.desktop, alignItems: 'center', justifyContent: 'center' },
  frame: {
    flex: 1,
    width: '100%',
    maxWidth: 375,
    maxHeight: Platform.OS === 'web' ? 720 : undefined,
    backgroundColor: colors.background,
    overflow: 'hidden',
    borderRadius: Platform.OS === 'web' ? 24 : 0,
  },
});
