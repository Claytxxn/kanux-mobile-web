import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Modal, ScrollView } from 'react-native';
import { useEffect, useState, useCallback } from 'react';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/contexts/AuthContext';
import { getUserCompanies, getCompanyTickets, Company, Ticket } from '../../src/lib/supabase';
import { AnimatedContainer } from '../../src/components/AnimatedContainer';
import {
  getOfflineCompanies,
  getOfflineTickets,
  getUserCompany,
  saveCompaniesOffline,
  saveTicketsOffline,
  saveUserCompany,
} from '../../src/lib/offlineStorage';
import { colors, spacing, borderRadius, shadows } from '../../src/theme';

const statusLabels: Record<string, string> = {
  ALL: 'Todos',
  OPEN: 'Aberto',
  PENDING: 'Pendente',
  RESOLVED: 'Resolvido',
  CLOSED: 'Fechado',
};

const priorityLabels: Record<string, string> = {
  HIGH: 'Alta',
  MEDIUM: 'Média',
  LOW: 'Baixa',
};

export default function TicketsScreen() {
  const { profile, isOnline } = useAuth();
  const router = useRouter();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<string>('ALL');
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('');
  const [showCompanyPicker, setShowCompanyPicker] = useState(false);

  async function loadCompanies() {
    try {
      const companiesData = isOnline ? await getUserCompanies() : await getOfflineCompanies();
      setCompanies(companiesData);

      if (isOnline && companiesData.length > 0) {
        await saveCompaniesOffline(companiesData);
      }

      // Restaurar empresa salva ou usar a primeira
      const savedId = await getUserCompany();
      const valid = companiesData.find(c => c.id === savedId);
      const activeId = valid ? savedId! : companiesData[0]?.id || '';
      setSelectedCompanyId(activeId);
      if (activeId) await saveUserCompany(activeId);
      return activeId;
    } catch (error) {
      console.error('Error loading companies:', error);
      return '';
    }
  }

  async function loadTickets(companyId: string) {
    if (!companyId) return;
    setLoading(true);
    try {
      const ticketsData = isOnline
        ? await getCompanyTickets(companyId)
        : await getOfflineTickets(companyId);

      if (isOnline) {
        await saveTicketsOffline(ticketsData, companyId);
      }
      setTickets(ticketsData);
    } catch (error) {
      console.error('Error loading tickets:', error);
      const cachedTickets = await getOfflineTickets(companyId);
      setTickets(cachedTickets);
    } finally {
      setLoading(false);
    }
  }

  // Carregar ao montar
  useEffect(() => {
    if (!profile) { setLoading(false); return; }
    (async () => {
      const id = await loadCompanies();
      if (id) await loadTickets(id);
      else setLoading(false);
    })();
  }, [profile, isOnline]);

  // Recarregar chamados quando a aba recebe foco
  useFocusEffect(
    useCallback(() => {
      if (selectedCompanyId) loadTickets(selectedCompanyId);
    }, [selectedCompanyId])
  );

  async function handleSelectCompany(companyId: string) {
    setSelectedCompanyId(companyId);
    setShowCompanyPicker(false);
    await saveUserCompany(companyId);
    await loadTickets(companyId);
  }

  const selectedCompany = companies.find(c => c.id === selectedCompanyId);

  const filteredTickets = tickets.filter(ticket => {
    const matchesSearch =
      ticket.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.number?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filter === 'ALL' || ticket.status === filter;
    return matchesSearch && matchesFilter;
  });

  const filters = ['ALL', 'OPEN', 'PENDING', 'RESOLVED', 'CLOSED'];

  return (
    <AnimatedContainer type="fade" duration={200}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Chamados</Text>
          <Text style={styles.subtitle}>{tickets.length} tickets</Text>
        </View>

      {/* Company Selector */}
      {companies.length > 1 && (
        <TouchableOpacity
          style={styles.companySelector}
          onPress={() => setShowCompanyPicker(true)}
          activeOpacity={0.7}
        >
          <View style={styles.companySelectorLeft}>
            <Ionicons name="business" size={18} color={colors.primary} />
            <Text style={styles.companySelectorText} numberOfLines={1}>
              {selectedCompany?.name || 'Selecionar empresa'}
            </Text>
          </View>
          <Ionicons name="chevron-down" size={18} color={colors.textMuted} />
        </TouchableOpacity>
      )}

      <View style={styles.searchContainer}>
        <Ionicons name="search" size={18} color={colors.textMuted} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar tickets..."
          placeholderTextColor={colors.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <View style={styles.filtersRow}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterContainer}>
          {filters.map((f) => (
            <TouchableOpacity
              key={f}
              style={[styles.filterButton, filter === f && styles.filterButtonActive]}
              onPress={() => setFilter(f)}
              activeOpacity={0.7}
            >
              <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
                {statusLabels[f] || f}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <FlatList
        data={filteredTickets}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.ticketItem}
            onPress={() => router.push(`/ticket/${item.id}`)}
            activeOpacity={0.7}
          >
            <View style={styles.ticketHeader}>
              <View style={styles.ticketNumberContainer}>
                <Text style={styles.ticketHash}>#</Text>
                <Text style={styles.ticketNumber}>{item.number || item.id.slice(0, 8)}</Text>
              </View>
              <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(item.priority) + '20' }]}>
                <Text style={[styles.priorityBadgeText, { color: getPriorityColor(item.priority) }]}>
                  {priorityLabels[item.priority?.toUpperCase()] || item.priority}
                </Text>
              </View>
            </View>
            <Text style={styles.ticketTitle} numberOfLines={2}>{item.title}</Text>
            {item.description && (
              <Text style={styles.ticketDescription} numberOfLines={2}>
                {item.description}
              </Text>
            )}
            <View style={styles.ticketFooter}>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
                <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
                  {statusLabels[item.status?.toUpperCase()] || item.status}
                </Text>
              </View>
              <Text style={styles.ticketDate}>
                {new Date(item.created_at).toLocaleDateString('pt-BR')}
              </Text>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="ticket-outline" size={56} color={colors.textMuted} />
            <Text style={styles.emptyText}>
              {loading ? 'Carregando...' : 'Nenhum ticket encontrado'}
            </Text>
            {!loading && (
              <Text style={styles.emptySubtext}>Crie um novo ticket para começar</Text>
            )}
          </View>
        }
      />

      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push('/tickets/create')}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={28} color={colors.text} />
      </TouchableOpacity>

      {/* Company Picker Modal */}
      <Modal visible={showCompanyPicker} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Selecionar Empresa</Text>
              <TouchableOpacity onPress={() => setShowCompanyPicker(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={companies}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.companyItem,
                    item.id === selectedCompanyId && styles.companyItemActive,
                  ]}
                  onPress={() => handleSelectCompany(item.id)}
                >
                  <View style={styles.companyItemIcon}>
                    <Text style={styles.companyItemInitial}>{item.name.charAt(0).toUpperCase()}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.companyItemName}>{item.name}</Text>
                    <Text style={styles.companyItemSlug}>@{item.slug}</Text>
                  </View>
                  {item.id === selectedCompanyId && (
                    <Ionicons name="checkmark-circle" size={22} color={colors.primary} />
                  )}
                </TouchableOpacity>
              )}
/>
        </View>
      </View>
    </Modal>
    </View>
    </AnimatedContainer>
  );
}

function getStatusColor(status: string) {
  switch (status?.toUpperCase()) {
    case 'OPEN': return colors.statusOpen;
    case 'PENDING': return colors.statusPending;
    case 'RESOLVED': return colors.success;
    case 'CLOSED': return colors.textMuted;
    default: return colors.textMuted;
  }
}

function getPriorityColor(priority: string) {
  switch (priority?.toUpperCase()) {
    case 'HIGH': return colors.priorityHigh;
    case 'MEDIUM': return colors.priorityMedium;
    case 'LOW': return colors.priorityLow;
    default: return colors.textMuted;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    padding: spacing.lg,
    paddingTop: spacing.md,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  companySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  companySelectorLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: spacing.sm,
  },
  companySelectorText: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '500',
    flex: 1,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  searchIcon: {
    position: 'absolute',
    left: spacing.lg + spacing.md,
    zIndex: 1,
  },
  searchInput: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    paddingLeft: 40,
    color: colors.text,
    fontSize: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filtersRow: {
    marginBottom: spacing.md,
  },
  filterContainer: {
    paddingHorizontal: spacing.lg,
    paddingVertical: 2,
    gap: 6,
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterButton: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterText: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '500',
  },
  filterTextActive: {
    color: colors.text,
    fontWeight: '700',
  },
  list: {
    padding: spacing.lg,
    paddingTop: 0,
  },
  ticketItem: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
  },
  ticketHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  ticketNumberContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ticketHash: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600',
  },
  ticketNumber: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600',
    marginLeft: 2,
  },
  priorityBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
  },
  priorityBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  ticketTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  ticketDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: spacing.md,
    lineHeight: 20,
  },
  ticketFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: borderRadius.full,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  ticketDate: {
    fontSize: 13,
    color: colors.textMuted,
  },
  empty: {
    alignItems: 'center',
    padding: spacing.xxl,
    gap: spacing.md,
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: 16,
    fontWeight: '600',
  },
  emptySubtext: {
    color: colors.textMuted,
    fontSize: 14,
  },
  fab: {
    position: 'absolute',
    right: spacing.lg,
    bottom: spacing.lg,
    width: 60,
    height: 60,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.floating,
  },
  // Estilos do modal
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.backgroundLight,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    maxHeight: '60%',
    paddingBottom: spacing.xl,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  companyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    gap: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  companyItemActive: {
    backgroundColor: colors.primary + '15',
  },
  companyItemIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  companyItemInitial: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  companyItemName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  companyItemSlug: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 2,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  fabText: {
    fontSize: 32,
    color: colors.text,
    fontWeight: '300',
    marginTop: -2,
  },
});
