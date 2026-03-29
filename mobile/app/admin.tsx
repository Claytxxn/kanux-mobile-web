
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useEffect, useState } from 'react';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing } from '../src/theme';
import { supabase } from '../src/lib/supabase';

interface Company {
  id: string;
  name: string;
  slug: string;
  created_at: string;
}

interface Ticket {
  id: string;
  title: string;
  status: string;
  priority: string;
}

interface Member {
  id: string;
  role: string;
  user_profiles: {
    display_name: string;
    email: string;
  };
}

interface Chat {
  id: string;
  name: string;
  is_private: boolean;
}

interface Department {
  id: string;
  name: string;
  slug: string;
}

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

  useEffect(() => {
    checkSuperAdmin();
  }, []);

  useEffect(() => {
    if (isSuperAdmin) {
      loadCompanies();
    }
  }, [isSuperAdmin]);

  useEffect(() => {
    if (currentCompanyId) {
      loadCompanyData(currentCompanyId);
    }
  }, [currentCompanyId]);

  async function checkSuperAdmin() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('is_super_admin')
          .eq('auth_user_id', user.id)
          .single();
        
        if (profile?.is_super_admin) {
          setIsSuperAdmin(true);
        } else {
          router.replace('/(tabs)');
        }
      } else {
        router.replace('/(auth)/login');
      }
    } catch (error) {
      console.error('Error checking admin:', error);
      router.replace('/(auth)/login');
    } finally {
      setLoading(false);
    }
  }

  async function loadCompanies() {
    try {
      const { data } = await supabase.from('companies').select('*').order('created_at', { ascending: false });
      setCompanies(data || []);
      if (data && data.length > 0 && !currentCompanyId) {
        setCurrentCompanyId(data[0].id);
      }
    } catch (error) {
      console.error('Error loading companies:', error);
    }
  }

  async function loadCompanyData(companyId: string) {
    try {
      const company = companies.find(c => c.id === companyId);
      setCurrentCompany(company || null);

      const [membersRes, ticketsRes, chatsRes, deptsRes] = await Promise.all([
        supabase.from('company_members').select('*, user_profiles(display_name, email)').eq('company_id', companyId),
        supabase.from('tickets').select('id, title, status, priority').eq('company_id', companyId).order('created_at', { ascending: false }),
        supabase.from('chats').select('*').eq('company_id', companyId),
        supabase.from('departments').select('*').eq('company_id', companyId)
      ]);

      setMembers(membersRes.data || []);
      setTickets(ticketsRes.data || []);
      setChats(chatsRes.data || []);
      setDepartments(deptsRes.data || []);
    } catch (error) {
      console.error('Error loading company data:', error);
    }
  }

  async function handleRemoveMember(memberId: string) {
    Alert.alert(
      'Remover Membro',
      'Tem certeza que deseja remover este membro?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Remover',
          style: 'destructive',
          onPress: async () => {
            try {
              await supabase.from('company_members').delete().eq('id', memberId);
              loadCompanyData(currentCompanyId);
            } catch (error) {
              console.error('Error removing member:', error);
            }
          }
        }
      ]
    );
  }

  async function handleUpdateRole(memberId: string, newRole: string) {
    try {
      await supabase.from('company_members').update({ role: newRole }).eq('id', memberId);
      loadCompanyData(currentCompanyId);
    } catch (error) {
      console.error('Error updating role:', error);
    }
  }

  if (loading || !isSuperAdmin) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Carregando...</Text>
      </View>
    );
  }

  const openTickets = tickets.filter(t => t.status === 'OPEN').length;

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Painel Admin</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.companySelector}>
        <Ionicons name="business" size={20} color={colors.primary} />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.companyList}>
          {companies.map(company => (
            <TouchableOpacity
              key={company.id}
              style={[
                styles.companyChip,
                currentCompanyId === company.id && styles.companyChipActive
              ]}
              onPress={() => setCurrentCompanyId(company.id)}
            >
              <Text style={[
                styles.companyChipText,
                currentCompanyId === company.id && styles.companyChipTextActive
              ]}>
                {company.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'overview' && styles.tabActive]}
          onPress={() => setActiveTab('overview')}
        >
          <Ionicons name="grid" size={18} color={activeTab === 'overview' ? colors.primary : colors.textMuted} />
          <Text style={[styles.tabText, activeTab === 'overview' && styles.tabTextActive]}>Visao Geral</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'companies' && styles.tabActive]}
          onPress={() => setActiveTab('companies')}
        >
          <Ionicons name="business" size={18} color={activeTab === 'companies' ? colors.primary : colors.textMuted} />
          <Text style={[styles.tabText, activeTab === 'companies' && styles.tabTextActive]}>Empresas</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'members' && styles.tabActive]}
          onPress={() => setActiveTab('members')}
        >
          <Ionicons name="people" size={18} color={activeTab === 'members' ? colors.primary : colors.textMuted} />
          <Text style={[styles.tabText, activeTab === 'members' && styles.tabTextActive]}>Membros</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'chats' && styles.tabActive]}
          onPress={() => setActiveTab('chats')}
        >
          <Ionicons name="chatbubbles" size={18} color={activeTab === 'chats' ? colors.primary : colors.textMuted} />
          <Text style={[styles.tabText, activeTab === 'chats' && styles.tabTextActive]}>Chats</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'departments' && styles.tabActive]}
          onPress={() => setActiveTab('departments')}
        >
          <Ionicons name="folder" size={18} color={activeTab === 'departments' ? colors.primary : colors.textMuted} />
          <Text style={[styles.tabText, activeTab === 'departments' && styles.tabTextActive]}>Deptos</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {activeTab === 'overview' && (
          <View style={styles.overview}>
            <Text style={styles.sectionTitle}>Estatisticas - {currentCompany?.name || 'Todas'}</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <Ionicons name="business" size={24} color={colors.primary} />
                <Text style={styles.statNumber}>{companies.length}</Text>
                <Text style={styles.statLabel}>Empresas</Text>
              </View>
              <View style={styles.statCard}>
                <Ionicons name="people" size={24} color={colors.info} />
                <Text style={styles.statNumber}>{members.length}</Text>
                <Text style={styles.statLabel}>Membros</Text>
              </View>
              <View style={styles.statCard}>
                <Ionicons name="ticket" size={24} color={colors.warning} />
                <Text style={styles.statNumber}>{tickets.length}</Text>
                <Text style={styles.statLabel}>Tickets</Text>
              </View>
              <View style={styles.statCard}>
                <Ionicons name="alert-circle" size={24} color={colors.error} />
                <Text style={styles.statNumber}>{openTickets}</Text>
                <Text style={styles.statLabel}>Abertos</Text>
              </View>
            </View>

            {currentCompany && (
              <>
                <Text style={styles.sectionTitle}>Empresa Atual</Text>
                <View style={styles.companyCard}>
                  <View style={styles.companyIcon}>
                    <Text style={styles.companyInitial}>{currentCompany.name.charAt(0)}</Text>
                  </View>
                  <View style={styles.companyDetails}>
                    <Text style={styles.companyName}>{currentCompany.name}</Text>
                    <Text style={styles.companySlug}>@{currentCompany.slug}</Text>
                  </View>
                </View>
              </>
            )}
          </View>
        )}

        {activeTab === 'companies' && (
          <View style={styles.list}>
            <Text style={styles.sectionTitle}>Todas as Empresas ({companies.length})</Text>
            {companies.map(company => (
              <TouchableOpacity
                key={company.id}
                style={[styles.listItem, currentCompanyId === company.id && styles.listItemActive]}
                onPress={() => setCurrentCompanyId(company.id)}
              >
                <View style={styles.listItemIcon}>
                  <Text style={styles.listItemInitial}>{company.name.charAt(0)}</Text>
                </View>
                <View style={styles.listItemContent}>
                  <Text style={styles.listItemTitle}>{company.name}</Text>
                  <Text style={styles.listItemSubtitle}>@{company.slug}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
              </TouchableOpacity>
            ))}
          </View>
        )}

        {activeTab === 'members' && currentCompany && (
          <View style={styles.list}>
            <Text style={styles.sectionTitle}>Membros - {currentCompany.name}</Text>
            {members.map(member => (
              <View key={member.id} style={styles.memberItem}>
                <View style={styles.memberAvatar}>
                  <Ionicons name="person" size={20} color={colors.text} />
                </View>
                <View style={styles.memberInfo}>
                  <Text style={styles.memberName}>{member.user_profiles?.display_name || 'Unknown'}</Text>
                  <Text style={styles.memberEmail}>{member.user_profiles?.email || '-'}</Text>
                </View>
                <View style={styles.memberActions}>
                  <TouchableOpacity
                    style={styles.roleSelect}
                    onPress={() => {
                      const roles = ['MEMBER', 'MANAGER', 'ADMIN'];
                      const currentIndex = roles.indexOf(member.role);
                      const nextRole = roles[(currentIndex + 1) % roles.length];
                      handleUpdateRole(member.id, nextRole);
                    }}
                  >
                    <Text style={styles.roleText}>{member.role}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleRemoveMember(member.id)}
                    style={styles.removeButton}
                  >
                    <Ionicons name="trash" size={18} color={colors.error} />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
            {members.length === 0 && (
              <Text style={styles.emptyText}>Nenhum membro encontrado</Text>
            )}
          </View>
        )}

        {activeTab === 'chats' && currentCompany && (
          <View style={styles.list}>
            <Text style={styles.sectionTitle}>Chats - {currentCompany.name}</Text>
            {chats.map(chat => (
              <View key={chat.id} style={styles.chatItem}>
                <Ionicons 
                  name={chat.is_private ? 'lock-closed' : 'chatbubbles'} 
                  size={20} 
                  color={colors.primary} 
                />
                <Text style={styles.chatName}>{chat.name}</Text>
                <Text style={styles.chatType}>{chat.is_private ? 'Privado' : 'Publico'}</Text>
              </View>
            ))}
            {chats.length === 0 && (
              <Text style={styles.emptyText}>Nenhum chat encontrado</Text>
            )}
          </View>
        )}

        {activeTab === 'departments' && currentCompany && (
          <View style={styles.list}>
            <Text style={styles.sectionTitle}>Departamentos - {currentCompany.name}</Text>
            {departments.map(dept => (
              <View key={dept.id} style={styles.deptItem}>
                <Ionicons name="folder" size={20} color={colors.info} />
                <Text style={styles.deptName}>{dept.name}</Text>
                <Text style={styles.deptSlug}>@{dept.slug}</Text>
              </View>
            ))}
            {departments.length === 0 && (
              <Text style={styles.emptyText}>Nenhum departamento encontrado</Text>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center'
  },
  loadingText: {
    color: colors.text
  },
  container: {
    flex: 1,
    backgroundColor: colors.background
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: colors.surface
  },
  backButton: {
    padding: 4
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text
  },
  headerSpacer: {
    width: 32
  },
  companySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: colors.surfaceLight,
    gap: 8
  },
  companyList: {
    flex: 1
  },
  companyChip: {
    paddingHorizontal: 16,
    paddingVertical: 4,
    borderRadius: 20,
    backgroundColor: colors.surface,
    marginRight: 8
  },
  companyChipActive: {
    backgroundColor: colors.primary
  },
  companyChipText: {
    color: colors.textSecondary,
    fontSize: 14
  },
  companyChipTextActive: {
    color: colors.text,
    fontWeight: '600'
  },
  tabs: {
    flexDirection: 'row',
    padding: 8,
    backgroundColor: colors.surface,
    gap: 4
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 8
  },
  tabActive: {
    backgroundColor: colors.primary + '20'
  },
  tabText: {
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 2
  },
  tabTextActive: {
    color: colors.primary,
    fontWeight: '600'
  },
  content: {
    flex: 1,
    padding: 16
  },
  overview: {
    gap: 16
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8
  },
  statCard: {
    width: '48%',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    gap: 4
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary
  },
  companyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    gap: 16
  },
  companyIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center'
  },
  companyInitial: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text
  },
  companyDetails: {
    flex: 1
  },
  companyName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text
  },
  companySlug: {
    fontSize: 14,
    color: colors.textSecondary
  },
  list: {
    gap: 8
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    gap: 16
  },
  listItemActive: {
    borderWidth: 2,
    borderColor: colors.primary
  },
  listItemIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: colors.primary + '30',
    alignItems: 'center',
    justifyContent: 'center'
  },
  listItemInitial: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.primary
  },
  listItemContent: {
    flex: 1
  },
  listItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text
  },
  listItemSubtitle: {
    fontSize: 14,
    color: colors.textSecondary
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    gap: 16
  },
  memberAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center'
  },
  memberInfo: {
    flex: 1
  },
  memberName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text
  },
  memberEmail: {
    fontSize: 14,
    color: colors.textSecondary
  },
  memberActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  roleSelect: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: colors.primary + '20',
    borderRadius: 4
  },
  roleText: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '600'
  },
  removeButton: {
    padding: 4
  },
  chatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    gap: 16
  },
  chatName: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
    fontWeight: '500'
  },
  chatType: {
    fontSize: 12,
    color: colors.textSecondary
  },
  deptItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    gap: 16
  },
  deptName: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
    fontWeight: '500'
  },
  deptSlug: {
    fontSize: 12,
    color: colors.textSecondary
  },
  emptyText: {
    textAlign: 'center',
    color: colors.textSecondary,
    padding: 24
  }
});

