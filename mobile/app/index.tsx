
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../src/contexts/AuthContext';
import { getUserCompanies, getCompanyTickets } from '../src/lib/supabase';
import { colors } from '../src/theme';

interface Company {
  id: string;
  name: string;
  slug: string;
}

interface Ticket {
  id: string;
  title: string;
  status: string;
  number?: string;
}

export default function HomeScreen() {
  const { user, profile } = useAuth();
  const router = useRouter();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [allCompanies, setAllCompanies] = useState<Company[]>([]);
  const [recentTickets, setRecentTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const isSuperAdmin = profile?.is_super_admin === true;

  async function loadData() {
    try {
      const companiesData = await getUserCompanies();
      setCompanies(companiesData);

      if (isSuperAdmin) {
        const { supabase } = await import('../src/lib/supabase');
        const { data: allData } = await supabase.from('companies').select('*').order('created_at', { ascending: false });
        setAllCompanies(allData || []);
      }

      if (companiesData.length > 0) {
        const ticketsData = await getCompanyTickets(companiesData[0].id);
        setRecentTickets(ticketsData.slice(0, 5));
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [profile?.is_super_admin]);

  function onRefresh() {
    setRefreshing(true);
    loadData();
  }

  const openTickets = recentTickets.filter(t => t.status === 'OPEN').length;
  const pendingTickets = recentTickets.filter(t => t.status === 'PENDING').length;

  function getStatusColor(status: string) {
    switch (status) {
      case 'OPEN': return colors.statusOpen;
      case 'PENDING': return colors.statusPending;
      case 'RESOLVED': return colors.success;
      case 'CLOSED': return colors.textMuted;
      default: return colors.textMuted;
    }
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Carregando...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
      }
    >
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.greeting}>Ola, {profile?.display_name || user?.email?.split('@')[0] || 'Usuario'}!</Text>
            <Text style={styles.subtitle}>Bem-vindo ao Kanux</Text>
          </View>
          <View style={styles.avatar}>
            <Ionicons name="person" size={24} color={colors.text} />
          </View>
        </View>
        
        {isSuperAdmin && (
          <View style={styles.superAdminBadge}>
            <Ionicons name="shield-checkmark" size={16} color={colors.warning} />
            <Text style={styles.superAdminText}>Super Admin</Text>
          </View>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Suas Empresas</Text>
        {companies.length > 0 ? (
          <TouchableOpacity
            style={styles.companyCard}
            onPress={() => router.push('/company/select')}
          >
            <View style={styles.companyIcon}>
              <Ionicons name="business" size={24} color={colors.primary} />
            </View>
            <View style={styles.companyInfo}>
              <Text style={styles.companyName}>{companies[0].name}</Text>
              <Text style={styles.companySlug}>@{companies[0].slug}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
          </TouchableOpacity>
        ) : (
          <View style={styles.emptyCard}>
            <Ionicons name="business-outline" size={48} color={colors.textMuted} />
            <Text style={styles.emptyText}>Nenhuma empresa encontrada</Text>
          </View>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Resumo</Text>
        <View style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: colors.statusOpen + '30' }]}>
            <Ionicons name="alert-circle" size={24} color={colors.statusOpen} />
            <Text style={styles.statNumber}>{openTickets}</Text>
            <Text style={styles.statLabel}>Abertos</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.statusPending + '30' }]}>
            <Ionicons name="time" size={24} color={colors.statusPending} />
            <Text style={styles.statNumber}>{pendingTickets}</Text>
            <Text style={styles.statLabel}>Pendentes</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.success + '30' }]}>
            <Ionicons name="checkmark-circle" size={24} color={colors.success} />
            <Text style={styles.statNumber}>{recentTickets.filter(t => t.status === 'RESOLVED').length}</Text>
            <Text style={styles.statLabel}>Resolvidos</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Acoes Rapidas</Text>
        <View style={styles.actionsGrid}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.push('/tickets/create')}
          >
            <View style={[styles.actionIcon, { backgroundColor: colors.statusOpen + '30' }]}>
              <Ionicons name="ticket" size={24} color={colors.statusOpen} />
            </View>
            <Text style={styles.actionText}>Novo Ticket</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.push('/(tabs)/chats')}
          >
            <View style={[styles.actionIcon, { backgroundColor: colors.primary + '30' }]}>
              <Ionicons name="chatbubbles" size={24} color={colors.primary} />
            </View>
            <Text style={styles.actionText}>Ver Chats</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.push('/company/select')}
          >
            <View style={[styles.actionIcon, { backgroundColor: colors.info + '30' }]}>
              <Ionicons name="people" size={24} color={colors.info} />
            </View>
            <Text style={styles.actionText}>Empresas</Text>
          </TouchableOpacity>
          
          {isSuperAdmin && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => router.push('/admin' as any)}
            >
              <View style={[styles.actionIcon, { backgroundColor: colors.warning + '30' }]}>
                <Ionicons name="settings" size={24} color={colors.warning} />
              </View>
              <Text style={styles.actionText}>Admin</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {isSuperAdmin && allCompanies.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Todas as Empresas ({allCompanies.length})</Text>
          </View>
          {allCompanies.slice(0, 5).map((company) => (
            <TouchableOpacity
              key={company.id}
              style={styles.companyItem}
              onPress={() => router.push(`/company/select?companyId=${company.id}`)}
            >
              <View style={styles.companyIconSmall}>
                <Text style={styles.companyInitial}>{company.name.charAt(0).toUpperCase()}</Text>
              </View>
              <View style={styles.companyInfo}>
                <Text style={styles.companyName}>{company.name}</Text>
                <Text style={styles.companySlug}>@{company.slug}</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
            </TouchableOpacity>
          ))}
        </View>
      )}

      {recentTickets.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Tickets Recentes</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/tickets')}>
              <Text style={styles.seeAll}>Ver todos</Text>
            </TouchableOpacity>
          </View>
          {recentTickets.map((ticket) => (
            <TouchableOpacity
              key={ticket.id}
              style={styles.ticketItem}
              onPress={() => router.push(`/ticket/${ticket.id}`)}
            >
              <View style={styles.ticketInfo}>
                <Text style={styles.ticketNumber}>#{ticket.number || ticket.id.slice(0, 8)}</Text>
                <Text style={styles.ticketTitle} numberOfLines={1}>{ticket.title}</Text>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(ticket.status) + '30' }]}>
                <Text style={styles.statusText}>{ticket.status}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </ScrollView>
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
  content: {
    padding: 16
  },
  header: {
    marginBottom: 24
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start'
  },
  greeting: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    marginTop: 4
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center'
  },
  superAdminBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.warning + '20',
    paddingHorizontal: 16,
    paddingVertical: 4,
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginTop: 16,
    gap: 4
  },
  superAdminText: {
    color: colors.warning,
    fontWeight: '600',
    fontSize: 12
  },
  section: {
    marginBottom: 24
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8
  },
  companyCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16
  },
  companyIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center'
  },
  companyInfo: {
    flex: 1
  },
  companyName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text
  },
  companySlug: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 2
  },
  companyItem: {
    backgroundColor: colors.surface,
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 4
  },
  companyIconSmall: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center'
  },
  companyInitial: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text
  },
  emptyCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    gap: 8
  },
  emptyText: {
    color: colors.textSecondary
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8
  },
  statCard: {
    flex: 1,
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
    color: colors.text
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8
  },
  actionButton: {
    width: '48%',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    gap: 8
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center'
  },
  actionText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '500'
  },
  seeAll: {
    color: colors.primary,
    fontSize: 14
  },
  ticketItem: {
    backgroundColor: colors.surface,
    borderRadius: 8,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
  },
  ticketInfo: {
    flex: 1
  },
  ticketNumber: {
    fontSize: 12,
    color: colors.textSecondary
  },
  ticketTitle: {
    fontSize: 16,
    color: colors.text,
    fontWeight: '500',
    marginTop: 2
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginLeft: 8
  },
  statusText: {
    fontSize: 12,
    color: colors.text,
    fontWeight: '500'
  }
});

