import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/contexts/AuthContext';
import { colors, spacing } from '../../src/theme';

export default function ProfileScreen() {
  const { user, profile, signOut } = useAuth();
  const router = useRouter();

  const isSuperAdmin = profile?.is_super_admin === true;

  async function handleSignOut() {
    Alert.alert(
      'Sair',
      'Tem certeza que deseja sair?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Sair', style: 'destructive', onPress: async () => {
          await signOut();
          router.replace('/(auth)/login');
        }},
      ]
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Ionicons name="person" size={40} color={colors.text} />
        </View>
        <Text style={styles.name}>{profile?.display_name || 'Usuario'}</Text>
        <Text style={styles.email}>{user?.email}</Text>
        {isSuperAdmin && (
          <View style={styles.adminBadge}>
            <Ionicons name="shield-checkmark" size={14} color={colors.text} />
            <Text style={styles.adminText}>Super Admin</Text>
          </View>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Informacoes do Perfil</Text>
        
        <View style={styles.infoItem}>
          <View style={styles.infoRow}>
            <Ionicons name="mail" size={20} color={colors.primary} />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Email</Text>
              <Text style={styles.infoValue}>{user?.email}</Text>
            </View>
          </View>
        </View>
        
        <View style={styles.infoItem}>
          <View style={styles.infoRow}>
            <Ionicons name="person-circle" size={20} color={colors.primary} />
            <View style={styles.infoContent}>
        <Text style={styles.infoLabel}>Nome de Exibição</Text>
              <Text style={styles.infoValue}>{profile?.display_name || 'Carregando perfil...'}</Text>
            </View>
          </View>
        </View>
      </View>

      {isSuperAdmin && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Administracao</Text>
          
          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => router.push('/admin')}
          >
            <View style={styles.menuRow}>
              <View style={[styles.menuIcon, { backgroundColor: colors.warning + '30' }]}>
                <Ionicons name="settings" size={20} color={colors.warning} />
              </View>
              <Text style={styles.menuText}>Painel Admin</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => router.push('/company/select')}
          >
            <View style={styles.menuRow}>
              <View style={[styles.menuIcon, { backgroundColor: colors.primary + '30' }]}>
                <Ionicons name="business" size={20} color={colors.primary} />
              </View>
              <Text style={styles.menuText}>Gerenciar Empresas</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Conta</Text>
        
        <TouchableOpacity style={styles.menuItem}>
          <View style={styles.menuRow}>
            <View style={[styles.menuIcon, { backgroundColor: colors.info + '30' }]}>
              <Ionicons name="create" size={20} color={colors.info} />
            </View>
            <Text style={styles.menuText}>Editar Perfil</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.menuItem}>
          <View style={styles.menuRow}>
            <View style={[styles.menuIcon, { backgroundColor: colors.success + '30' }]}>
              <Ionicons name="notifications" size={20} color={colors.success} />
            </View>
            <Text style={styles.menuText}>Notificacoes</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.menuItem}>
          <View style={styles.menuRow}>
            <View style={[styles.menuIcon, { backgroundColor: colors.textMuted + '30' }]}>
              <Ionicons name="lock-closed" size={20} color={colors.textMuted} />
            </View>
            <Text style={styles.menuText}>Privacidade</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Suporte</Text>
        
        <TouchableOpacity style={styles.menuItem}>
          <View style={styles.menuRow}>
            <View style={[styles.menuIcon, { backgroundColor: colors.primary + '30' }]}>
              <Ionicons name="help-circle" size={20} color={colors.primary} />
            </View>
            <Text style={styles.menuText}>Ajuda</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.menuItem}>
          <View style={styles.menuRow}>
            <View style={[styles.menuIcon, { backgroundColor: colors.textSecondary + '30' }]}>
              <Ionicons name="information-circle" size={20} color={colors.textSecondary} />
            </View>
            <Text style={styles.menuText}>Sobre</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={styles.signOutButton}
        onPress={handleSignOut}
      >
        <Ionicons name="log-out" size={20} color={colors.text} />
        <Text style={styles.signOutText}>Sair</Text>
      </TouchableOpacity>

      <Text style={styles.version}>Versao 1.0.0</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md },
  header: { alignItems: 'center', paddingVertical: spacing.xl },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md },
  name: { fontSize: 24, fontWeight: 'bold', color: colors.text },
  email: { fontSize: 14, color: colors.textSecondary, marginTop: spacing.xs },
  adminBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.warning, paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: 16, marginTop: spacing.sm, gap: spacing.xs },
  adminText: { fontSize: 12, color: colors.text, fontWeight: '600' },
  section: { marginBottom: spacing.lg },
  sectionTitle: { fontSize: 14, fontWeight: '600', color: colors.textSecondary, marginBottom: spacing.sm, textTransform: 'uppercase' },
  infoItem: { backgroundColor: colors.surface, borderRadius: 8, padding: spacing.md, marginBottom: spacing.sm },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  infoContent: { flex: 1 },
  infoLabel: { fontSize: 12, color: colors.textSecondary },
  infoValue: { fontSize: 16, color: colors.text, fontWeight: '500' },
  menuItem: { backgroundColor: colors.surface, borderRadius: 8, padding: spacing.md, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  menuRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  menuIcon: { width: 40, height: 40, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  menuText: { fontSize: 16, color: colors.text },
  signOutButton: { backgroundColor: colors.error, borderRadius: 8, padding: spacing.md, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: spacing.md, gap: spacing.sm },
  signOutText: { fontSize: 16, color: colors.text, fontWeight: '600' },
  version: { textAlign: 'center', color: colors.textMuted, fontSize: 12, marginTop: spacing.lg, marginBottom: spacing.xl },
});

