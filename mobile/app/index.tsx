import {
  View,
  Text,
  StyleSheet
} from 'react-native';
import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useAuth } from '../src/contexts/AuthContext';

export default function IndexScreen() {
  const { user, profile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    // Já logado + perfil/empresa OK → tabs
    if (user && profile) {
      router.replace('/(tabs)');
      return;
    }

    // Logado mas sem perfil/empresa → selecionar empresa
    if (user && !profile) {
      router.replace('/company/select');
      return;
    }

    // Não logado → login
    if (!user) {
      router.replace('/(auth)/login');
      return;
    }
  }, [user, profile, loading, router]);

  return (
    <View style={styles.container}>
      <Text style={styles.text}>Carregando...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a2e',
  },
  text: {
    color: '#fff',
    fontSize: 18,
  },
});
