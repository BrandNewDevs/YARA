import { StyleSheet, Text, View } from 'react-native';

export default function ChatScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>YARA</Text>
      <Text style={styles.subtitle}>Your friendly reminder assistant</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#fff',
  },
  title: { fontSize: 40, fontWeight: '700' },
  subtitle: { fontSize: 22, marginTop: 8, textAlign: 'center' },
});
