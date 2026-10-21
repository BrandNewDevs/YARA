import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, sizes, type } from '@/components/theme';

// Placeholder until B5 lists the Emergency Number and Trusted Contacts.
export default function HelpScreen() {
  const router = useRouter();
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.body}>
        <Text style={styles.title}>Help</Text>
        <Text style={styles.text}>Emergency numbers will be shown here.</Text>
      </View>
      <Pressable accessibilityRole="button" onPress={() => router.back()} style={styles.back}>
        <Text style={styles.backLabel}>Back</Text>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: colors.background },
  body: { flex: 1, gap: sizes.gap },
  title: { fontSize: type.title, fontWeight: '700', color: colors.text },
  text: { fontSize: type.body, color: colors.text },
  back: {
    minHeight: sizes.button,
    borderRadius: sizes.radius,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backLabel: { color: colors.onPrimary, fontSize: type.body, fontWeight: '700' },
});
