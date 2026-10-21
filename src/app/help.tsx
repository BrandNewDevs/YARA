import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/Button';
import { colors, sizes, type } from '@/components/theme';

// Placeholder until B5 lists the Emergency Number and Trusted Contacts.
export default function HelpScreen() {
  const router = useRouter();
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.body}>
        <Text accessibilityRole="header" style={styles.title}>Help</Text>
        <Text style={styles.text}>Emergency numbers will be shown here.</Text>
      </View>
      <Button label="Back" onPress={() => router.back()} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: colors.background },
  body: { flex: 1, gap: sizes.gap },
  title: { fontSize: type.title, fontWeight: '700', color: colors.foreground },
  text: { fontSize: type.body, color: colors.foreground },
});
