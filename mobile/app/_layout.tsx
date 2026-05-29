import { Stack, useRouter, usePathname } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import { AuthProvider, useAuth } from '../src/contexts/AuthContext';
import { SyncProvider } from '../src/contexts/SyncContext';
import { WebSocketProvider } from '../src/contexts/WebSocketContext';
import { ThemeProvider } from '../src/contexts/ThemeContext';
import { useNotifications } from '../src/contexts/NotificationContext';
import { colors } from '../src/theme';
import { ActivityIndicator, View, Text, Image } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';

/**
 * LoadingScreen - Exibida enquanto carrega fontes e dados iniciais
 */
function LoadingScreen(): JSX.Element {
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
function AuthGate(): JSX.Element | null {
  const { user, profile, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  
  useEffect(() => {
    if (loading) return;
    
    // Já logado + perfil/empresa OK → tabs (apenas se estiver em tela de auth)
    if (user && profile) {
      if (pathname.includes('login') || pathname.includes('company/select')) {
        router.replace('/(tabs)');
      }
      return;
    }
    
    // Logado mas sem perfil/empresa → selecionar empresa
    if (user && !profile) {
      if (!pathname.includes('company/select')) router.replace('/company/select');
      return;
    }
    
    // Não logado → login
    if (!user) {
      if (!pathname.includes('login')) router.replace('/(auth)/login');
    }
  }, [user, profile, loading, pathname]);

  if (loading) {
    return <LoadingScreen />;
  }

  return null;
}

/**
 * NotificationSetup - Componente que ativa o hook de notificações dentro dos providers de auth
 */
function NotificationSetup(): JSX.Element {
  const pathname = usePathname();
  const activeChatId = pathname.startsWith('/chat/') ? pathname.replace('/chat/', '') : undefined;
  useNotifications(activeChatId);
  return null;
}

/**
 * RootLayout - Layout principal da aplicação
 * 
 * Responsável por:
 * - Carregar fontes customizadas (Inter)
 * - Provedores de contexto
 * - Navegação Stack
 * - Gate de autenticação
 */
export default function RootLayout(): JSX.Element {
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
              <NotificationSetup />
              <StatusBar style="dark" />
              <AuthGate />
              <Stack
                screenOptions={{
                  headerStyle: { backgroundColor: colors.background },
                  headerTintColor: colors.text,
                  headerTitleStyle: { fontWeight: '600', fontFamily: 'Inter-SemiBold' },
                  headerShadowVisible: false,
                  contentStyle: { backgroundColor: colors.background },
                  animation: 'slide_from_right',
                }}
              >
                <Stack.Screen name="index" options={{ headerShown: false }} />
                <Stack.Screen name="(auth)/login" options={{ headerShown: false, presentation: 'modal' }} />
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
            </WebSocketProvider>
          </SyncProvider>
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}