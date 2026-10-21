import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { formatTime } from '@/domain/describe';
import type { OnboardingForm, Weekday } from '@/domain/types';

import { Button } from '../Button';
import { TextField } from '../TextField';
import { TimeField } from '../TimeField';
import { WeekdayPicker } from '../WeekdayPicker';
import { AddedItem, Question } from './parts';

export interface StepProps {
  form: OnboardingForm;
  update: (patch: Partial<OnboardingForm>) => void;
}

const DAY_NAMES: Record<Weekday, string> = {
  mon: 'Monday', tue: 'Tuesday', wed: 'Wednesday', thu: 'Thursday', fri: 'Friday', sat: 'Saturday', sun: 'Sunday',
};

export function NameStep({ form, update }: StepProps) {
  return (
    <Question title="What should I call you?" hint="I will use this name when I talk to you.">
      <TextField
        label="Your name"
        value={form.preferredName}
        onChangeText={(preferredName) => update({ preferredName })}
        placeholder="For example, Margaret"
        autoCapitalize="words"
        autoComplete="name"
        autoFocus
      />
    </Question>
  );
}

export function MedicinesStep({ form, update }: StepProps) {
  const [name, setName] = useState('');
  const [times, setTimes] = useState(['08:00']);
  const canAdd = name.trim().length > 0;

  const add = () => {
    update({ medicines: [...form.medicines, { name: name.trim(), times: [...times].sort() }] });
    setName('');
    setTimes(['08:00']);
  };

  return (
    <Question title="Do you take any medicine?" hint="Add each one and when you take it. If you take none, tap Next.">
      {form.medicines.map((m, i) => (
        <AddedItem
          key={`${m.name}-${i}`}
          title={m.name}
          detail={m.times.map(formatTime).join(', ')}
          onRemove={() => update({ medicines: form.medicines.filter((_, j) => j !== i) })}
        />
      ))}
      <TextField label="Medicine name" value={name} onChangeText={setName} placeholder="For example, Blood pressure pill" />
      {times.map((t, i) => (
        <TimeField
          key={i}
          label={times.length > 1 ? `Time ${i + 1}` : 'What time?'}
          value={t}
          onChange={(v) => setTimes(times.map((x, j) => (j === i ? v : x)))}
        />
      ))}
      <View style={styles.row}>
        <Button label="Add another time" variant="outline" onPress={() => setTimes([...times, '20:00'])} style={styles.grow} />
        {times.length > 1 && (
          <Button label="Remove last time" variant="outline" onPress={() => setTimes(times.slice(0, -1))} style={styles.grow} />
        )}
      </View>
      <Button label="Add this medicine" variant="secondary" disabled={!canAdd} onPress={add} />
    </Question>
  );
}

export function AppointmentsStep({ form, update }: StepProps) {
  const [what, setWhat] = useState('');
  const [where, setWhere] = useState('');
  const [weekday, setWeekday] = useState<Weekday | undefined>();
  const [time, setTime] = useState('10:00');
  const canAdd = what.trim().length > 0 && weekday !== undefined;

  const add = () => {
    update({
      appointments: [
        ...form.appointments,
        { what: what.trim(), ...(where.trim() ? { where: where.trim() } : {}), weekday, time },
      ],
    });
    setWhat('');
    setWhere('');
    setWeekday(undefined);
    setTime('10:00');
  };

  return (
    <Question title="Do you have regular appointments?" hint="For example, a weekly class or a doctor visit. If you have none, tap Next.">
      {form.appointments.map((a, i) => (
        <AddedItem
          key={`${a.what}-${i}`}
          title={a.what}
          detail={`${a.weekday ? `Every ${DAY_NAMES[a.weekday]}` : a.date}, ${formatTime(a.time)}${a.where ? `, ${a.where}` : ''}`}
          onRemove={() => update({ appointments: form.appointments.filter((_, j) => j !== i) })}
        />
      ))}
      <TextField label="What is it?" value={what} onChangeText={setWhat} placeholder="For example, Physiotherapy" />
      <TextField label="Where? (optional)" value={where} onChangeText={setWhere} placeholder="For example, City Clinic" />
      <WeekdayPicker value={weekday} onChange={setWeekday} />
      <TimeField label="What time?" value={time} onChange={setTime} />
      <Button label="Add this appointment" variant="secondary" disabled={!canAdd} onPress={add} />
    </Question>
  );
}

export function SleepStep({ form, update }: StepProps) {
  return (
    <Question title="When is your day?" hint="I will not remind you while you are asleep.">
      <TimeField label="I wake up at" value={form.wakeTime} onChange={(wakeTime) => update({ wakeTime })} />
      <TimeField label="I go to bed at" value={form.sleepTime} onChange={(sleepTime) => update({ sleepTime })} />
    </Question>
  );
}

export function ContactsStep({ form, update }: StepProps) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const canAdd = name.trim().length > 0 && phone.replace(/\D/g, '').length >= 3;

  const add = () => {
    update({ trustedContacts: [...form.trustedContacts, { name: name.trim(), phone: phone.trim() }] });
    setName('');
    setPhone('');
  };

  return (
    <Question title="Who should I help you call?" hint="Add family or friends you trust. They show on the Help screen. If you want none, tap Next.">
      {form.trustedContacts.map((c, i) => (
        <AddedItem
          key={`${c.phone}-${i}`}
          title={c.name}
          detail={c.phone}
          onRemove={() => update({ trustedContacts: form.trustedContacts.filter((_, j) => j !== i) })}
        />
      ))}
      <TextField label="Their name" value={name} onChangeText={setName} placeholder="For example, Anna (daughter)" autoCapitalize="words" />
      <TextField label="Their phone number" value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholder="Phone number" />
      <Button label="Add this person" variant="secondary" disabled={!canAdd} onPress={add} />
    </Question>
  );
}

export function NotesStep({ form, update }: StepProps) {
  return (
    <Question title="Is there anything else I should know?" hint="For example, what you like, or what is hard for you. You can leave this empty.">
      <TextField
        label="Anything else"
        value={form.freeText}
        onChangeText={(freeText) => update({ freeText })}
        multiline
        placeholder="Write here"
      />
    </Question>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  grow: { flexGrow: 1 },
});
