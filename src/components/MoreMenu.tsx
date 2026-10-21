import { usePathname, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BackHandler, Pressable, StyleSheet, Text, View } from 'react-native';

import { resetAll } from '@/domain/db';

import { Button } from './Button';
import { IconButton } from './IconButton';
import { colors, sizes, type } from './theme';

/** The three-dot button and its menu. Help lives here. */
export function MoreMenu() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);

  const close = () => {
    setOpen(false);
    setConfirming(false);
  };

  const restart = async () => {
    setBusy(true);
    try {
      await resetAll();
      close();
      router.replace('/onboarding');
    } finally {
      setBusy(false);
    }
  };

  // Android Back closes the menu instead of leaving the screen.
  useEffect(() => {
    if (!open) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      close();
      return true;
    });
    return () => sub.remove();
  }, [open]);

  const go = (path: '/help' | '/reminders') => {
    close();
    router.push(path);
  };

  return (
    <>
      <IconButton
        icon="more-vertical"
        label="More options"
        hint="Opens a menu with Help"
        expanded={open}
        onPress={() => setOpen(true)}
        style={styles.trigger}
      />
      {open && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close menu"
          style={[styles.backdrop, { paddingTop: insets.top + 64 }]}
          onPress={close}>
          <View accessibilityViewIsModal style={styles.menu}>
            {confirming ? (
              <View style={styles.confirm}>
                <Text accessibilityRole="alert" style={styles.itemLabel}>
                  Start again? I will forget your reminders and what I know about you.
                </Text>
                <View style={styles.row}>
                  <Button label="Yes" variant="destructive" disabled={busy} onPress={restart} style={styles.grow} />
                  <Button label="No" variant="secondary" disabled={busy} onPress={() => setConfirming(false)} style={styles.grow} />
                </View>
              </View>
            ) : (
              <>
                <Pressable accessibilityRole="menuitem" accessibilityLabel="Spoken Reminders"
                  onPress={() => go('/reminders')} style={({ pressed }) => [styles.item, pressed && styles.pressed]}>
                  <Text style={styles.itemLabel}>Spoken Reminders</Text>
                </Pressable>
                <Pressable
                  accessibilityRole="menuitem"
                  accessibilityLabel="Help"
                  onPress={() => go('/help')}
                  style={({ pressed }) => [styles.item, pressed && styles.pressed]}>
                  <Text style={styles.itemLabel}>Help</Text>
                </Pressable>
                {pathname !== '/onboarding' && (
                  <Pressable
                    accessibilityRole="menuitem"
                    accessibilityLabel="Restart onboarding"
                    onPress={() => setConfirming(true)}
                    style={({ pressed }) => [styles.item, pressed && styles.pressed]}>
                    <Text style={styles.itemLabel}>Restart onboarding</Text>
                  </Pressable>
                )}
              </>
            )}
          </View>
        </Pressable>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  trigger: { position: 'absolute', top: 8, right: 8 },
  backdrop: { ...StyleSheet.absoluteFill, zIndex: 10, backgroundColor: colors.overlay, alignItems: 'flex-end', padding: 16 },
  menu: {
    minWidth: 220,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: sizes.radius,
    padding: 6,
  },
  item: { minHeight: sizes.button, paddingHorizontal: 16, justifyContent: 'center', borderRadius: 10 },
  pressed: { backgroundColor: colors.secondary },
  confirm: { gap: 12, padding: 10, maxWidth: 280 },
  row: { flexDirection: 'row', gap: 8 },
  grow: { flex: 1 },
  itemLabel: { color: colors.foreground, fontSize: type.body, fontWeight: '600' },
});
