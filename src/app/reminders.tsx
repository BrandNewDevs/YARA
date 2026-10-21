import { Button } from "@/components/Button";
import { colors, sizes, type } from "@/components/theme";
import { useReminderControls } from "@/reminders/ReminderProvider";
import { useRouter } from "expo-router";
import { Platform, ScrollView, StyleSheet, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function RemindersScreen() {
  const reminders = useReminderControls();
  const router = useRouter();
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Spoken Reminders</Text>
        <Text style={styles.text}>
          YARA reads your saved Reminder aloud. Your preferred voice and
          speaking speed come from your profile.
        </Text>
        <Text style={styles.text}>
          {Platform.OS === "web"
            ? "Keep this tab open. Your browser may ask you to enable sound first."
            : "When YARA is closed, a notification plays a sound. Tap it to open YARA and hear the Reminder."}
        </Text>
        <Text style={styles.text} accessibilityLiveRegion="polite">
          {reminders.status}
        </Text>
        <Button
          label={
            reminders.enabled
              ? "Enable notifications again"
              : "Enable spoken Reminders"
          }
          onPress={() => {
            void reminders.enable();
          }}
        />
        <Button
          label="Try voice"
          variant="secondary"
          onPress={reminders.preview}
        />
        {reminders.enabled ? (
          <Button
            label="Turn voice off"
            variant="outline"
            onPress={() => {
              void reminders.disable();
            }}
          />
        ) : null}
        {Platform.OS === "android" ? (
          <>
            <Text style={styles.text}>
              Allow precise timing in Android settings to help Reminders arrive
              on time. You can continue without it.
            </Text>
            <Button
              label="Allow precise timing"
              variant="outline"
              onPress={() => {
                void reminders.preciseTiming();
              }}
            />
          </>
        ) : null}
        <Button
          label="Help"
          variant="outline"
          onPress={() => router.push("/help")}
        />
        <Button label="Back" variant="outline" onPress={() => router.back()} />
      </ScrollView>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 20, gap: sizes.gap },
  title: { fontSize: type.title, color: colors.foreground, fontWeight: "700" },
  text: { fontSize: type.body, color: colors.foreground },
});
