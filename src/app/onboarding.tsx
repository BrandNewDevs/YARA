import { useRouter } from 'expo-router';
import { useState, type ComponentType } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { assistant } from '@/assistant';
import type { OnboardingResult } from '@/assistant/types';
import { Button } from '@/components/Button';
import { MoreMenu } from '@/components/MoreMenu';
import {
  AppointmentsStep, ContactsStep, MedicinesStep, NameStep, NotesStep, SleepStep, type StepProps,
} from '@/components/onboarding/steps';
import { colors, sizes, type } from '@/components/theme';
import { describeSchedule } from '@/domain/describe';
import { emptyForm, saveOnboarding } from '@/domain/onboarding';
import type { OnboardingForm } from '@/domain/types';

const STEPS: ComponentType<StepProps>[] = [NameStep, MedicinesStep, AppointmentsStep, SleepStep, ContactsStep, NotesStep];

type Phase =
  | { name: 'questions' }
  | { name: 'working' }
  | { name: 'summary'; result: OnboardingResult }
  | { name: 'error'; message: string };

function buildContext() {
  const now = new Date();
  return { now: now.toISOString(), weekday: (['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const)[now.getDay()], memory: [], tasks: [] };
}

export default function OnboardingScreen() {
  const router = useRouter();
  const [form, setForm] = useState<OnboardingForm>(emptyForm);
  const [step, setStep] = useState(0);
  const [phase, setPhase] = useState<Phase>({ name: 'questions' });
  const [saving, setSaving] = useState(false);

  const update = (patch: Partial<OnboardingForm>) => setForm((f) => ({ ...f, ...patch }));
  const Step = STEPS[step];
  const last = step === STEPS.length - 1;
  const canContinue = step !== 0 || form.preferredName.trim().length > 0;

  const review = async () => {
    setPhase({ name: 'working' });
    try {
      const result = await assistant.onboard({ ...form, preferredName: form.preferredName.trim() }, buildContext());
      setPhase({ name: 'summary', result });
    } catch (e) {
      setPhase({ name: 'error', message: e instanceof Error ? e.message : 'Something went wrong.' });
    }
  };

  const confirm = async (result: OnboardingResult) => {
    setSaving(true);
    try {
      await saveOnboarding({ ...form, preferredName: form.preferredName.trim() }, result);
      router.replace('/');
    } catch {
      setSaving(false);
      setPhase({ name: 'error', message: 'I could not save that. Please try again.' });
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {phase.name === 'questions' && (
            <>
              <Text accessibilityLiveRegion="polite" style={styles.progress}>
                Question {step + 1} of {STEPS.length}
              </Text>
              <Step form={form} update={update} />
            </>
          )}

          {phase.name === 'working' && (
            <View accessibilityLiveRegion="polite" style={styles.center}>
              <ActivityIndicator size="large" color={colors.foreground} />
              <Text style={styles.body}>One moment while I get everything ready.</Text>
            </View>
          )}

          {phase.name === 'summary' && (
            <View style={styles.summary}>
              <Text accessibilityRole="header" style={styles.title}>Is this right?</Text>
              <Text style={styles.body}>{phase.result.welcome}</Text>
              {phase.result.facts.length > 0 && (
                <>
                  <Text style={styles.heading}>What I will remember</Text>
                  {phase.result.facts.map((f, i) => (
                    <Text key={i} style={styles.body}>• {f}</Text>
                  ))}
                </>
              )}
              {phase.result.tasks.length > 0 && (
                <>
                  <Text style={styles.heading}>Your reminders</Text>
                  {phase.result.tasks.map((t, i) => (
                    <Text key={i} style={styles.body}>• {t.title}, {describeSchedule(t.schedule)}</Text>
                  ))}
                </>
              )}
            </View>
          )}

          {phase.name === 'error' && (
            <View style={styles.summary}>
              <Text accessibilityRole="alert" style={styles.title}>Sorry</Text>
              <Text style={styles.body}>{phase.message}</Text>
            </View>
          )}
        </ScrollView>

        <View style={styles.footer}>
          {phase.name === 'questions' && (
            <>
              {step > 0 && <Button label="Back" variant="outline" onPress={() => setStep(step - 1)} style={styles.grow} />}
              <Button
                label={last ? 'Finish' : 'Next'}
                disabled={!canContinue}
                onPress={last ? review : () => setStep(step + 1)}
                style={styles.grow}
              />
            </>
          )}
          {phase.name === 'summary' && (
            <>
              <Button label="No" variant="secondary" disabled={saving} onPress={() => setPhase({ name: 'questions' })} style={styles.grow} />
              <Button label="Yes" variant="success" disabled={saving} onPress={() => confirm(phase.result)} style={styles.grow} />
            </>
          )}
          {phase.name === 'error' && (
            <>
              <Button label="Back" variant="outline" onPress={() => setPhase({ name: 'questions' })} style={styles.grow} />
              <Button label="Try again" onPress={review} style={styles.grow} />
            </>
          )}
        </View>
      </KeyboardAvoidingView>
      <MoreMenu />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 20, paddingTop: 72, gap: 16, flexGrow: 1 },
  progress: { color: colors.muted, fontSize: type.small, fontWeight: '600' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 },
  summary: { gap: 12 },
  title: { color: colors.foreground, fontSize: type.title, fontWeight: '700' },
  heading: { color: colors.foreground, fontSize: type.body, fontWeight: '700', marginTop: 8 },
  body: { color: colors.foreground, fontSize: type.body, lineHeight: 30 },
  footer: { flexDirection: 'row', gap: sizes.gap, padding: 12 },
  grow: { flex: 1 },
});
