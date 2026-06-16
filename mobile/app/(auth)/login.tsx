import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Alert, KeyboardAvoidingView, Platform, ScrollView, StatusBar,
  ActivityIndicator,
} from 'react-native';
import { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../src/lib/supabase';
import { api, initApi, setAuthToken } from '../../src/lib/api';
import { colors, spacing, borderRadius } from '../../src/theme';
import KanuxLogo from '../../src/components/KanuxLogo';

export default function LoginScreen() {
  // Log 6: No topo do corpo da função
  console.log('[LoginScreen] TOP OF FUNCTION - Rendering...');
  
  const [email, setEmail]             = useState('');
  const [password, setPassword]       = useState('');
  const [companySlug, setCompanySlug] = useState('');
  const [loading, setLoading]         = useState(false);
  const [isSignUp, setIsSignUp]       = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  useEffect(() => { initApi().catch(() => {}); }, []);

  async function handleAuth() {
    if (!email || !password) { Alert.alert('Erro', 'Preencha todos os campos'); return; }
    if (!isSignUp && !companySlug) { Alert.alert('Erro', 'Informe o número da empresa'); return; }
    
    setLoading(true);
    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        Alert.alert('Sucesso', 'Conta criada! Verifique seu email.');
      } else {
        console.log('[LoginScreen] Verifying company:', companySlug);
        const result = await api.verifyCompany(companySlug.trim());
        console.log('[LoginScreen] Company verification result:', result);
        
        if (!result.success) { 
          Alert.alert('Erro', result.error || 'Empresa não encontrada'); 
          return; 
        }
        
        console.log('[LoginScreen] Signing in with Supabase...');
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        
        if (error) {
          console.error('[LoginScreen] Supabase sign in error:', {
            name: error.name,
            message: error.message,
            status: error.status,
            code: error.code
          });
          throw error;
        }
        
        console.log('[LoginScreen] Login successful, setting auth token...');
        if (data.session?.access_token) setAuthToken(data.session.access_token);
        console.log('[LoginScreen] Navigating to tabs...');
        router.replace('/(tabs)');
      }
    } catch (e: any) {
      console.error('[LoginScreen] Login error:', {
        name: e?.name,
        message: e?.message,
        code: e?.code,
        status: e?.status,
        stack: e?.stack?.substring(0, 200)
      });
      
      let errorMessage = 'Erro ao autenticar';
      let errorTitle = 'Erro';
      
      // Tratamento específico para AbortError (timeout)
      if (e?.name === 'AbortError') {
        errorTitle = 'Tempo Esgotado';
        errorMessage = 'O servidor está demorando para responder. Isso é normal quando o servidor fica inativo.\n\nTente novamente em 10-20 segundos.';
      } else if (e?.message?.includes('Network request failed') || e?.message?.includes('fetch')) {
        errorTitle = 'Erro de Conexão';
        errorMessage = 'Verifique sua conexão com a internet e tente novamente.';
      } else if (e?.message) {
        errorMessage = e.message;
      }
      
      Alert.alert(errorTitle, errorMessage);
    } finally { 
      setLoading(false); 
    }
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'padding'} keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : (StatusBar.currentHeight ?? 0)}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <KanuxLogo size="lg" />
          <Text style={styles.subtitle}>{isSignUp ? 'Crie sua conta' : 'Bem-vindo de volta'}</Text>
        </View>
        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Email</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="mail-outline" size={20} color={colors.textMuted} style={styles.inputIcon} />
              <TextInput style={styles.inputWithIcon} placeholder="seu@email.com" placeholderTextColor={colors.textMuted}
                value={email} onChangeText={setEmail} autoCapitalize="none" autoCorrect={false} keyboardType="email-address" />
            </View>
          </View>
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Senha</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="lock-closed-outline" size={20} color={colors.textMuted} style={styles.inputIcon} />
              <TextInput style={styles.inputWithIcon} placeholder="********" placeholderTextColor={colors.textMuted}
                value={password} onChangeText={setPassword} secureTextEntry={!showPassword} autoCorrect={false} autoComplete="off" />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeButton}>
                <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color={colors.textMuted} />
              </TouchableOpacity>
            </View>
          </View>
          {!isSignUp && (
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Número da Empresa</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="business-outline" size={20} color={colors.textMuted} style={styles.inputIcon} />
                <TextInput style={styles.inputWithIcon} placeholder="1000" placeholderTextColor={colors.textMuted}
                  value={companySlug} onChangeText={setCompanySlug} keyboardType="numeric" autoCorrect={false} />
              </View>
            </View>
          )}
          <TouchableOpacity style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleAuth} disabled={loading} activeOpacity={0.8}>
            {loading ? <ActivityIndicator color={colors.text} />
              : (
                <View style={styles.buttonContent}>
                  <Ionicons name={isSignUp ? 'person-add' : 'log-in'} size={20} color={colors.text} />
                  <Text style={styles.buttonText}>{isSignUp ? 'Criar Conta' : 'Entrar'}</Text>
                </View>
              )}
          </TouchableOpacity>
          <TouchableOpacity style={styles.linkButton} onPress={() => setIsSignUp(!isSignUp)}>
            <Text style={styles.linkText}>
              {isSignUp ? 'Já tem uma conta? Entre' : 'Não tem conta? Cadastre-se'}
            </Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.footer}>© 2025 Kanux - Help Desk</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container:      { flex: 1, backgroundColor: colors.background },
  scrollContent:  { flexGrow: 1, padding: spacing.lg, justifyContent: 'center' },
  header:         { alignItems: 'center', marginBottom: spacing.xl },
  subtitle:       { fontSize: 16, color: colors.textSecondary, marginTop: spacing.lg },
  form:           { width: '100%' },
  inputContainer: { marginBottom: spacing.md },
  inputLabel:     { fontSize: 14, fontWeight: '500', color: colors.textSecondary, marginBottom: spacing.xs },
  inputWrapper:   { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surfaceContainerLow, borderRadius: borderRadius.md, borderWidth: 1, borderColor: colors.border },
  inputIcon:      { paddingLeft: spacing.md },
  inputWithIcon:  { flex: 1, padding: spacing.md, color: colors.text, fontSize: 16 },
  eyeButton:      { padding: spacing.md },
  button:         { backgroundColor: colors.primary, borderRadius: borderRadius.md, paddingVertical: spacing.md, paddingHorizontal: spacing.lg, alignItems: 'center', justifyContent: 'center', marginTop: spacing.lg },
  buttonDisabled: { opacity: 0.5 },
  buttonContent:  { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  buttonText:     { color: colors.text, fontSize: 16, fontWeight: '600' },
  linkButton: { alignItems: 'center', padding: spacing.sm },
  linkText:       { color: colors.primary, fontSize: 15, fontWeight: '500' },
  footer:         { textAlign: 'center', color: colors.textMuted, fontSize: 12, marginTop: spacing.xxl },
});
