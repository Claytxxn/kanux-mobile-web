
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, TextInput, Modal } from 'react-native';
import { useEffect, useState } from 'react';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius } from '../src/theme';
import { supabase } from '../src/lib/supabase';

interface Company { id: string; name: string; slug: string; created_at: string; }
interface Ticket { id: string; title: string; status: string; priority: string; }
interface Member { id: string; role: string; user_profile_id: string; user_profiles: { display_name: string; email: string; position?: string; }; }
interface Chat { id: string; name: string; is_private: boolean; only_admins_send?: boolean; }
interface Department { id: string; name: string; slug: string; }

export default function AdminScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [currentCompanyId, setCurrentCompanyId] = useState<string>((params.companyId as string) || '');
  const [currentCompany, setCurrentCompany] = useState<Company | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [chats, setChats] = useState<Chat[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  // Create User Modal
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPosition, setNewUserPosition] = useState('');
  const [newUserRole, setNewUserRole] = useState('MEMBER');
  const [newUserDeptId, setNewUserDeptId] = useState('');
  const [savingUser, setSavingUser] = useState(false);

  // Chat Config Modal
  const [showChatConfig, setShowChatConfig] = useState(false);
  const [configChat, setConfigChat] = useState<Chat | null>(null);

  useEffect(() => { checkSuperAdmin(); }, []);
  useEffect(() => { if (isSuperAdmin) loadCompanies(); }, [isSuperAdmin]);
  useEffect(() => { if (currentCompanyId) loadCompanyData(currentCompanyId); }, [currentCompanyId]);

  async function checkSuperAdmin() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase.from('user_profiles').select('is_super_admin').eq('auth_user_id', user.id).single();
        if (profile?.is_super_admin) { setIsSuperAdmin(true); } else { router.replace('/(tabs)'); }
      } else { router.replace('/(auth)/login'); }
    } catch { router.replace('/(auth)/login'); } finally { setLoading(false); }
  }

  async function loadCompanies() {
    const { data } = await supabase.from('companies').select('*').order('name');
    setCompanies(data || []);
    if (data && data.length > 0 && !currentCompanyId) setCurrentCompanyId(data[0].id);
  }

  async function loadCompanyData(companyId: string) {
    try {
      setCurrentCompany(companies.find(c => c.id === companyId) || null);
      const [membersRes, ticketsRes, chatsRes, deptsRes] = await Promise.all([
        supabase.from('company_members').select('*, user_profiles(display_name, email, position)').eq('company_id', companyId),
        supabase.from('tickets').select('id, title, status, priority').eq('company_id', companyId).order('created_at', { ascending: false }),
        supabase.from('chats').select('*').eq('company_id', companyId),
        supabase.from('departments').select('*').eq('company_id', companyId),
      ]);
      setMembers(membersRes.data || []);
      setTickets(ticketsRes.data || []);
      setChats(chatsRes.data || []);
      setDepartments(deptsRes.data || []);
    } catch (error) { console.error('Error loading company data:', error); }
  }

  async function handleRemoveMember(memberId: string) {
    Alert.alert('Remover Membro', 'Tem certeza?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Remover', style: 'destructive', onPress: async () => {
        await supabase.from('company_members').delete().eq('id', memberId);
        loadCompanyData(currentCompanyId);
      }},
    ]);
  }

  async function handleUpdateRole(memberId: string, newRole: string) {
    await supabase.from('company_members').update({ role: newRole }).eq('id', memberId);
    loadCompanyData(currentCompanyId);
  }

  async function handleCreateUser() {
    if (!newUserName.trim() || !newUserEmail.trim()) {
      Alert.alert('Erro', 'Nome e email são obrigatórios');
      return;
    }
    setSavingUser(true);
    try {
      // Check if user profile already exists
      let { data: existingProfile } = await supabase.from('user_profiles').select('id').eq('email', newUserEmail.trim()).single();
      let profileId = existingProfile?.id;

      if (!profileId) {
        // Create user profile
        const { data: newProfile, error } = await supabase.from('user_profiles').insert({
          display_name: newUserName.trim(),
          email: newUserEmail.trim(),
          position: newUserPosition.trim() || null,
        }).select().single();
        if (error) throw error;
        profileId = newProfile.id;
      }

      // Add to company as member
      const { error: memberError } = await supabase.from('company_members').insert({
        company_id: currentCompanyId,
        user_profile_id: profileId,
        role: newUserRole,
      });
      if (memberError) throw memberError;

      Alert.alert('Sucesso', 'Usuário adicionado com sucesso');
      setShowCreateUser(false);
      setNewUserName(''); setNewUserEmail(''); setNewUserPosition(''); setNewUserRole('MEMBER'); setNewUserDeptId('');
      loadCompanyData(currentCompanyId);
    } catch (error: any) {
      Alert.alert('Erro', error.message || 'Falha ao criar usuário');
    } finally { setSavingUser(false); }
  }

  async function handleToggleChatPermission(chat: Chat) {
    const newValue = !chat.only_admins_send;
    await supabase.from('chats').update({ only_admins_send: newValue }).eq('id', chat.id);
    setChats(prev => prev.map(c => c.id === chat.id ? { ...c, only_admins_send: newValue } : c));
  }

  if (loading || !isSuperAdmin) {
    return <View style={styles.loadingContainer}><Text style={styles.loadingText}>Carregando...</Text></View>;
  }

  const openTickets = tickets.filter(t => t.status === 'OPEN').length;

  const tabs = [
    { key: 'overview', icon: 'grid' as const, label: 'Geral' },
    { key: 'users', icon: 'people' as const, label: 'Usuários' },
    { key: 'chats', icon: 'chatbubbles' as const, label: 'Chats' },
    { key: 'departments', icon: 'folder' as const, label: 'Deptos' },
  ];

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Painel Admin</Text>
        <View style={{ width: 30 }} />
      </View>

      {/* Company selector */}
      <View style={styles.companySelector}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {companies.map(company => (
            <TouchableOpacity
              key={company.id}
              style={[styles.companyChip, currentCompanyId === company.id && styles.companyChipActive]}
              onPress={() => setCurrentCompanyId(company.id)}
            >
              <Text style={[styles.companyChipText, currentCompanyId === company.id && styles.companyChipTextActive]}>
                {company.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        {tabs.map(tab => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.tabActive]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Ionicons name={tab.icon} size={18} color={activeTab === tab.key ? colors.primary : colors.textMuted} />
            <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>{tab.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={styles.content}>
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <View style={styles.tabContent}>
            <Text style={styles.sectionLabel}>ESTATÍSTICAS — {currentCompany?.name || ''}</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <Ionicons name="people" size={22} color={colors.primary} />
                <Text style={styles.statNumber}>{members.length}</Text>
                <Text style={styles.statLabel}>Membros</Text>
              </View>
              <View style={styles.statCard}>
                <Ionicons name="ticket" size={22} color={colors.warning} />
                <Text style={styles.statNumber}>{tickets.length}</Text>
                <Text style={styles.statLabel}>Tickets</Text>
              </View>
              <View style={styles.statCard}>
                <Ionicons name="chatbubbles" size={22} color={colors.info} />
                <Text style={styles.statNumber}>{chats.length}</Text>
                <Text style={styles.statLabel}>Chats</Text>
              </View>
              <View style={styles.statCard}>
                <Ionicons name="alert-circle" size={22} color={colors.error} />
                <Text style={styles.statNumber}>{openTickets}</Text>
                <Text style={styles.statLabel}>Abertos</Text>
              </View>
            </View>
          </View>
        )}

        {/* Users Tab - CRUD */}
        {activeTab === 'users' && (
          <View style={styles.tabContent}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionLabel}>MEMBROS — {currentCompany?.name}</Text>
              <TouchableOpacity style={styles.addButton} onPress={() => setShowCreateUser(true)}>
                <Ionicons name="add" size={18} color={colors.text} />
                <Text style={styles.addButtonText}>Novo</Text>
              </TouchableOpacity>
            </View>

            {members.map(member => (
              <View key={member.id} style={styles.memberItem}>
                <View style={styles.memberAvatar}>
                  <Text style={styles.memberAvatarText}>
                    {(member.user_profiles?.display_name || 'U').charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View style={styles.memberInfo}>
                  <Text style={styles.memberName}>{member.user_profiles?.display_name || 'Sem nome'}</Text>
                  <Text style={styles.memberEmail}>{member.user_profiles?.email || '-'}</Text>
                  {member.user_profiles?.position && (
                    <Text style={styles.memberPosition}>{member.user_profiles.position}</Text>
                  )}
                </View>
                <TouchableOpacity
                  style={styles.roleChip}
                  onPress={() => {
                    const roles = ['MEMBER', 'MANAGER', 'ADMIN'];
                    const next = roles[(roles.indexOf(member.role) + 1) % roles.length];
                    handleUpdateRole(member.id, next);
                  }}
                >
                  <Text style={styles.roleText}>{member.role}</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleRemoveMember(member.id)} style={{ padding: 4 }}>
                  <Ionicons name="trash-outline" size={18} color={colors.error} />
                </TouchableOpacity>
              </View>
            ))}
            {members.length === 0 && <Text style={styles.emptyText}>Nenhum membro</Text>}
          </View>
        )}

        {/* Chats Tab - Config Permissions */}
        {activeTab === 'chats' && (
          <View style={styles.tabContent}>
            <Text style={styles.sectionLabel}>CHATS — {currentCompany?.name}</Text>
            <Text style={styles.hintText}>
              Configure quem pode enviar mensagens em cada chat
            </Text>

            {chats.map(chat => (
              <View key={chat.id} style={styles.chatConfigItem}>
                <View style={styles.chatConfigLeft}>
                  {chat.is_private ? (
                    <Ionicons name="lock-closed" size={18} color={colors.warning} />
                  ) : (
                    <Text style={styles.hashIcon}>#</Text>
                  )}
                  <View style={{ flex: 1 }}>
                    <Text style={styles.chatConfigName}>{chat.name}</Text>
                    <Text style={styles.chatConfigType}>
                      {chat.is_private ? 'Privado' : 'Público'}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={[
                    styles.permToggle,
                    chat.only_admins_send ? styles.permToggleRestricted : styles.permToggleOpen,
                  ]}
                  onPress={() => handleToggleChatPermission(chat)}
                >
                  <Ionicons
                    name={chat.only_admins_send ? 'shield' : 'globe'}
                    size={14}
                    color={chat.only_admins_send ? colors.warning : colors.success}
                  />
                  <Text style={[
                    styles.permToggleText,
                    { color: chat.only_admins_send ? colors.warning : colors.success },
                  ]}>
                    {chat.only_admins_send ? 'Só Admin/Manager' : 'Todos enviam'}
                  </Text>
                </TouchableOpacity>
              </View>
            ))}
            {chats.length === 0 && <Text style={styles.emptyText}>Nenhum chat</Text>}
          </View>
        )}

        {/* Departments Tab */}
        {activeTab === 'departments' && (
          <View style={styles.tabContent}>
            <Text style={styles.sectionLabel}>DEPARTAMENTOS — {currentCompany?.name}</Text>
            {departments.map(dept => (
              <View key={dept.id} style={styles.deptItem}>
                <Ionicons name="folder" size={20} color={colors.primary} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.deptName}>{dept.name}</Text>
                  <Text style={styles.deptSlug}>@{dept.slug}</Text>
                </View>
              </View>
            ))}
            {departments.length === 0 && <Text style={styles.emptyText}>Nenhum departamento</Text>}
          </View>
        )}
      </ScrollView>

      {/* Create User Modal */}
      <Modal visible={showCreateUser} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Adicionar Usuário</Text>
              <TouchableOpacity onPress={() => setShowCreateUser(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <Text style={styles.fieldLabel}>NOME *</Text>
            <TextInput style={styles.modalInput} placeholder="Nome completo" placeholderTextColor={colors.textMuted}
              value={newUserName} onChangeText={setNewUserName} />

            <Text style={styles.fieldLabel}>EMAIL *</Text>
            <TextInput style={styles.modalInput} placeholder="email@exemplo.com" placeholderTextColor={colors.textMuted}
              value={newUserEmail} onChangeText={setNewUserEmail} keyboardType="email-address" autoCapitalize="none" />

            <Text style={styles.fieldLabel}>CARGO</Text>
            <TextInput style={styles.modalInput} placeholder="Ex: Analista de Suporte" placeholderTextColor={colors.textMuted}
              value={newUserPosition} onChangeText={setNewUserPosition} />

            <Text style={styles.fieldLabel}>FUNÇÃO</Text>
            <View style={styles.roleSelector}>
              {['MEMBER', 'MANAGER', 'ADMIN'].map(role => (
                <TouchableOpacity
                  key={role}
                  style={[styles.roleSelectorItem, newUserRole === role && styles.roleSelectorItemActive]}
                  onPress={() => setNewUserRole(role)}
                >
                  <Text style={[styles.roleSelectorText, newUserRole === role && styles.roleSelectorTextActive]}>
                    {role}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setShowCreateUser(false)}>
                <Text style={styles.modalCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalSaveBtn, savingUser && { opacity: 0.5 }]}
                onPress={handleCreateUser}
                disabled={savingUser}
              >
                <Text style={styles.modalSaveText}>{savingUser ? 'Salvando...' : 'Criar'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  loadingContainer: { flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' },
  loadingText: { color: colors.text },
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: spacing.md, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.divider,
  },
  backButton: { padding: 4 },
  headerTitle: { fontSize: 17, fontWeight: '700', color: colors.text },
  companySelector: { padding: spacing.sm, backgroundColor: colors.backgroundLight },
  companyChip: {
    paddingHorizontal: 14, paddingVertical: 6, borderRadius: borderRadius.md,
    backgroundColor: colors.surface, marginRight: 8, borderWidth: 1, borderColor: colors.border,
  },
  companyChipActive: { backgroundColor: colors.primary + '18', borderColor: colors.primary },
  companyChipText: { color: colors.textSecondary, fontSize: 13, fontWeight: '500' },
  companyChipTextActive: { color: colors.text, fontWeight: '600' },
  tabs: { flexDirection: 'row', padding: 8, backgroundColor: colors.surface, gap: 4 },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 8, borderRadius: 8 },
  tabActive: { backgroundColor: colors.primary + '18' },
  tabText: { fontSize: 10, color: colors.textMuted, marginTop: 2 },
  tabTextActive: { color: colors.primary, fontWeight: '600' },
  content: { flex: 1 },
  tabContent: { padding: spacing.md, gap: spacing.sm },
  sectionLabel: { fontSize: 11, fontWeight: '700', color: colors.textMuted, letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: spacing.xs },
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  hintText: { fontSize: 13, color: colors.textMuted, marginBottom: spacing.md },
  addButton: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: colors.primary, paddingHorizontal: 12, paddingVertical: 6, borderRadius: borderRadius.sm,
  },
  addButtonText: { color: colors.text, fontSize: 13, fontWeight: '600' },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  statCard: { width: '48%', backgroundColor: colors.surface, borderRadius: borderRadius.sm, padding: spacing.md, alignItems: 'center', gap: 4 },
  statNumber: { fontSize: 22, fontWeight: '700', color: colors.text },
  statLabel: { fontSize: 11, color: colors.textMuted },
  memberItem: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface,
    borderRadius: borderRadius.sm, padding: spacing.md, gap: spacing.sm, marginBottom: spacing.xs,
  },
  memberAvatar: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  memberAvatarText: { color: colors.text, fontSize: 14, fontWeight: '700' },
  memberInfo: { flex: 1 },
  memberName: { fontSize: 15, fontWeight: '600', color: colors.text },
  memberEmail: { fontSize: 12, color: colors.textMuted },
  memberPosition: { fontSize: 11, color: colors.textSecondary, marginTop: 1 },
  roleChip: { backgroundColor: colors.primary + '20', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  roleText: { fontSize: 11, color: colors.primary, fontWeight: '700' },
  chatConfigItem: {
    backgroundColor: colors.surface, borderRadius: borderRadius.sm,
    padding: spacing.md, marginBottom: spacing.xs, gap: spacing.sm,
  },
  chatConfigLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  hashIcon: { color: colors.textMuted, fontSize: 18, fontWeight: '700' },
  chatConfigName: { fontSize: 15, fontWeight: '600', color: colors.text },
  chatConfigType: { fontSize: 12, color: colors.textMuted },
  permToggle: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: borderRadius.sm,
    alignSelf: 'flex-start', marginTop: 4,
  },
  permToggleRestricted: { backgroundColor: colors.warning + '20' },
  permToggleOpen: { backgroundColor: colors.success + '20' },
  permToggleText: { fontSize: 12, fontWeight: '600' },
  deptItem: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface,
    borderRadius: borderRadius.sm, padding: spacing.md, gap: spacing.sm, marginBottom: spacing.xs,
  },
  deptName: { fontSize: 15, fontWeight: '600', color: colors.text },
  deptSlug: { fontSize: 12, color: colors.textMuted },
  emptyText: { textAlign: 'center', color: colors.textMuted, padding: spacing.lg },
  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: colors.backgroundLight, borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: spacing.lg, paddingBottom: spacing.xxl },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.lg },
  modalTitle: { fontSize: 18, fontWeight: '700', color: colors.text },
  fieldLabel: { fontSize: 11, fontWeight: '700', color: colors.textMuted, letterSpacing: 0.5, marginBottom: 6, marginTop: spacing.md, textTransform: 'uppercase' },
  modalInput: {
    backgroundColor: colors.surface, borderRadius: borderRadius.sm, padding: spacing.md,
    color: colors.text, fontSize: 15, borderWidth: 1, borderColor: colors.border,
  },
  roleSelector: { flexDirection: 'row', gap: spacing.sm },
  roleSelectorItem: {
    flex: 1, paddingVertical: 10, borderRadius: borderRadius.sm,
    backgroundColor: colors.surface, alignItems: 'center', borderWidth: 1, borderColor: colors.border,
  },
  roleSelectorItemActive: { backgroundColor: colors.primary + '18', borderColor: colors.primary },
  roleSelectorText: { color: colors.textSecondary, fontSize: 13, fontWeight: '600' },
  roleSelectorTextActive: { color: colors.text },
  modalActions: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.lg },
  modalCancelBtn: { flex: 1, padding: spacing.md, borderRadius: borderRadius.sm, backgroundColor: colors.surface, alignItems: 'center' },
  modalCancelText: { color: colors.textSecondary, fontWeight: '600', fontSize: 15 },
  modalSaveBtn: { flex: 1, padding: spacing.md, borderRadius: borderRadius.sm, backgroundColor: colors.primary, alignItems: 'center' },
  modalSaveText: { color: colors.text, fontWeight: '600', fontSize: 15 },
});

