import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { supabase } from '../../src/lib/supabase';
import { api, initApi, setAuthToken } from '../../src/lib/api';
import { colors, spacing, borderRadius, shadows } from '../../src/theme';

export default function LoginScreen() {
  const [email, setEmail]             = useState('');
  const [password, setPassword]       = useState('');
  const [companySlug, setCompanySlug] = useState('');
  const [loading, setLoading]         = useState(false);
  const [isSignUp, setIsSignUp]       = useState(false);
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
        const result = await api.verifyCompany(companySlug.trim());
        if (!result.success) { Alert.alert('Erro', result.error || 'Empresa não encontrada'); return; }
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        if (data.session?.access_token) setAuthToken(data.session.access_token);
        router.replace('/(tabs)');
      }
    } catch (e: any) {
      Alert.alert('Erro', e.message || 'Erro ao autenticar');
    } finally { setLoading(false); }
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.logoContainer}><Text style={styles.logo}>K</Text></View>
          <Text style={styles.title}>Kanux</Text>
          <Text style={styles.subtitle}>{isSignUp ? 'Crie sua conta' : 'Bem-vindo de volta'}</Text>
        </View>
        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Email</Text>
            <TextInput style={styles.input} placeholder="seu@email.com" placeholderTextColor={colors.textMuted}
              value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
          </View>
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Senha</Text>
            <TextInput style={styles.input} placeholder="••••••••" placeholderTextColor={colors.textMuted}
              value={password} onChangeText={setPassword} secureTextEntry />
          </View>
          {!isSignUp && (
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Número da Empresa</Text>
              <TextInput style={styles.input} placeholder="1000" placeholderTextColor={colors.textMuted}
                value={companySlug} onChangeText={setCompanySlug} keyboardType="numeric" />
            </View>
          )}
          <TouchableOpacity style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleAuth} disabled={loading} activeOpacity={0.8}>
            {loading ? <ActivityIndicator color={colors.text} />
              : <Text style={styles.buttonText}>{isSignUp ? 'Criar Conta' : 'Entrar'}</Text>}
          </TouchableOpacity>
          <TouchableOpacity style={styles.linkButton} onPress={() => setIsSignUp(!isSignUp)}>
            <Text style={styles.linkText}>
              {isSignUp ? 'Já tem uma conta? Entre' : 'Não tem conta? Cadastre-se'}
            </Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.footer}>© 2024 Kanux</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container:      { flex: 1, backgroundColor: colors.background },
  scrollContent:  { flexGrow: 1, padding: spacing.lg, justifyContent: 'center' },
  header:         { alignItems: 'center', marginBottom: spacing.xxl },
  logoContainer:  { width: 80, height: 80, borderRadius: borderRadius.full, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md, ...shadows.brand },
  logo:           { fontSize: 40, fontWeight: 'bold', color: colors.text },
  title:          { fontSize: 32, fontWeight: 'bold', color: colors.text, marginBottom: spacing.xs },
  subtitle:       { fontSize: 16, color: colors.textSecondary },
  form:           { width: '100%' },
  inputContainer: { marginBottom: spacing.md },
  inputLabel:     { fontSize: 14, fontWeight: '500', color: colors.textSecondary, marginBottom: spacing.xs },
  input:          { backgroundColor: colors.surface, borderRadius: borderRadius.md, padding: spacing.md, color: colors.text, fontSize: 16, borderWidth: 1, borderColor: colors.border },
  button:         { backgroundColor: colors.primary, borderRadius: borderRadius.md, padding: spacing.md, alignItems: 'center', marginTop: spacing.md, ...shadows.brand },
  buttonDisabled: { opacity: 0.6 },
  buttonText:     { color: colors.text, fontSize: 18, fontWeight: '600' },
  linkButton:     { marginTop: spacing.lg, alignItems: 'center', padding: spacing.sm },
  linkText:       { color: colors.primary, fontSize: 15, fontWeight: '500' },
  footer:         { textAlign: 'center', color: colors.textMuted, fontSize: 12, marginTop: spacing.xxl },
});
