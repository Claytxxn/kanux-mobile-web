import { Stack, useRouter, usePathname } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState, useRef, ReactElement } from 'react';
import { AuthProvider, useAuth } from '../src/contexts/AuthContext';
import { ThemeProvider } from '../src/contexts/ThemeContext';
import { SyncProvider } from '../src/contexts/SyncContext';
import { WebSocketProvider } from '../src/contexts/WebSocketContext';
import { colors } from '../src/theme';
import { ActivityIndicator, View, Text, Image } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';

/**
 * LoadingScreen - Exibida enquanto carrega fontes e dados iniciais
 */
function LoadingScreen(): ReactElement {
  return (
    <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }}>
      <Image
        source={require('../assets/icon.png')}
        style={{ width: 80, height: 80, borderRadius: 18, marginBottom: 16 }}
        resizeMode="contain"
      />
      <Text style={{ color: colors.text, fontSize: 24, fontWeight: '800', letterSpacing: 1 }}>Kanux</Text>
      <ActivityIndicator size="small" color={colors.primary} style={{ marginTop: 24 }} />
    </View>
  );
}

/**
 * AuthGate - Gerencia navegação baseada no estado de autenticação
 */
function AuthGate(): ReactElement | null {
  const { user, profile, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const hasNavigated = useRef(false);
  
  useEffect(() => {
    if (loading) return;
    
    if (hasNavigated.current) return;
    
    if (user && profile) {
      hasNavigated.current = true;
      router.replace('/(tabs)');
      return;
    }
    
    if (user && !profile) {
      hasNavigated.current = true;
      router.replace('/company/select');
      return;
    }
    
    if (!user) {
      hasNavigated.current = true;
      router.replace('/(auth)/login');
      return;
    }
  }, [user, profile, loading, pathname, router]);

  if (loading) {
    return <LoadingScreen />;
  }

  return null;
}

/**
 * RootLayout - Layout principal da aplicação
 */
export default function RootLayout(): ReactElement {
  const [fontsLoaded, setFontsLoaded] = useState(false);

  // Carregar fonte Inter do Google Fonts (24pt - tamanho ideal para mobile UI)
  const [fontsLoadedError] = useFonts({
    'Inter-Regular': require('../assets/fonts/Inter_24pt-Regular.ttf'),
    'Inter-Medium': require('../assets/fonts/Inter_24pt-Medium.ttf'),
    'Inter-SemiBold': require('../assets/fonts/Inter_24pt-SemiBold.ttf'),
    'Inter-Bold': require('../assets/fonts/Inter_24pt-Bold.ttf'),
  });

  useEffect(() => {
    // Definir como carregado mesmo se falhar (fallback para system-ui)
    if (fontsLoaded || fontsLoadedError) {
      setFontsLoaded(true);
    }
  }, [fontsLoaded, fontsLoadedError]);

  useEffect(() => {
    // Timeout de segurança para evitar tela cinza eterna
    const timer = setTimeout(() => {
      if (!fontsLoaded) {
        console.warn('⚠️ Font loading timeout, proceeding anyway');
        setFontsLoaded(true);
      }
    }, 5000);
    return () => clearTimeout(timer);
  }, [fontsLoaded]);

  // Mostrar loading enquanto fontes carregam
  if (!fontsLoaded) {
    return <LoadingScreen />;
  }

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AuthProvider>
          <SyncProvider>
            <WebSocketProvider>
              <StatusBar style="dark" />
              <Stack
                screenOptions={{
                  headerStyle: { backgroundColor: colors.background },
                  headerTintColor: colors.text,
                  headerTitleStyle: { fontWeight: '600' },
                  headerShadowVisible: false,
                  contentStyle: { backgroundColor: colors.background },
                  animation: 'slide_from_right',
                }}
              >
                <Stack.Screen name="index" options={{ headerShown: false }} />
                <Stack.Screen name="(auth)/login" options={{ headerShown: false }} />
                <Stack.Screen name="(auth)" options={{ headerShown: false }} />
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                <Stack.Screen name="chat/[id]" options={{ title: 'Chat', headerBackTitle: 'Voltar' }} />
                <Stack.Screen name="ticket/[id]" options={{ title: 'Ticket', headerBackTitle: 'Voltar' }} />
                <Stack.Screen 
                  name="company/select" 
                  options={{ 
                    title: 'Selecionar Empresa', 
                    headerBackTitle: 'Voltar', 
                    presentation: 'modal' 
                  }} 
                />
                <Stack.Screen name="admin" options={{ title: 'Admin' }} />
                <Stack.Screen name="tickets/create" options={{ title: 'Novo Ticket' }} />
              </Stack>
              <AuthGate />
            </WebSocketProvider>
          </SyncProvider>
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}