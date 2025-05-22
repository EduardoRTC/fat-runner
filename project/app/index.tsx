import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function HomeScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      <View style={styles.titleContainer}>
        <Text style={styles.title}>Fat Runner</Text>
        <Text style={styles.subtitle}>Correr pra não comer</Text>
      </View>

      <TouchableOpacity 
        style={styles.button}
        onPress={() => router.push('/game')}
        activeOpacity={0.8}
      >
        <Text style={styles.buttonText}>Jogar</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#111',
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 48,
    fontWeight: 'bold',
    color: 'white',
    textShadowColor: 'rgba(255, 255, 255, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 4,
  },
  subtitle: {
    fontSize: 20,
    color: '#888',
    marginTop: 8,
  },
  button: {
    backgroundColor: '#38b000',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 30,
    width: '80%',
    alignItems: 'center',
    shadowColor: '#38b000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },
  buttonText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
});