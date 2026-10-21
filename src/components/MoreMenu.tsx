import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BackHandler, Pressable, StyleSheet, Text, View } from 'react-native';

import { IconButton } from './IconButton';
import { colors, sizes, type } from './theme';

/** The three-dot button and its menu. Help lives here. */
export function MoreMenu() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  // Android Back closes the menu instead of leaving the screen.
  useEffect(() => {
    if (!open) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      setOpen(false);
      return true;
    });
    return () => sub.remove();
  }, [open]);

  const go = (path: '/help') => {
    setOpen(false);
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
          onPress={() => setOpen(false)}>
          <View accessibilityViewIsModal style={styles.menu}>
            <Pressable
              accessibilityRole="menuitem"
              accessibilityLabel="Help"
              onPress={() => go('/help')}
              style={({ pressed }) => [styles.item, pressed && styles.pressed]}>
              <Text style={styles.itemLabel}>Help</Text>
            </Pressable>
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
    minWidth: 200,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: sizes.radius,
    padding: 6,
  },
  item: { minHeight: sizes.button, paddingHorizontal: 16, justifyContent: 'center', borderRadius: 10 },
  pressed: { backgroundColor: colors.secondary },
  itemLabel: { color: colors.foreground, fontSize: type.body, fontWeight: '600' },
});
