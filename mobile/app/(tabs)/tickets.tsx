import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput } from 'react-native';
import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/contexts/AuthContext';
import { getUserCompanies, getCompanyTickets, Ticket } from '../../src/lib/supabase';
import { colors, spacing, borderRadius, shadows } from '../../src/theme';

export default function TicketsScreen() {
  const { profile } = useAuth();
  const router = useRouter();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<string>('ALL');

  async function loadData() {
    try {
      const companies = await getUserCompanies();
      if (companies.length > 0) {
        const ticketsData = await getCompanyTickets(companies[0].id);
        setTickets(ticketsData);
      }
    } catch (error) {
      console.error('Error loading tickets:', error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const filteredTickets = tickets.filter(ticket => {
    const matchesSearch = 
      ticket.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.number?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filter === 'ALL' || ticket.status === filter;
    return matchesSearch && matchesFilter;
  });

  const filters = ['ALL', 'OPEN', 'PENDING', 'RESOLVED', 'CLOSED'];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Chamados</Text>
        <Text style={styles.subtitle}>{tickets.length} tickets</Text>
      </View>

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar tickets..."
          placeholderTextColor={colors.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <View style={styles.filterContainer}>
        {filters.map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filterButton, filter === f && styles.filterButtonActive]}
            onPress={() => setFilter(f)}
            activeOpacity={0.7}
          >
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
              {f === 'ALL' ? 'Todos' : f}
            </Text>
          </TouchableOpacity>
        ))}
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
                <Text style={[styles.priorityText, { color: getPriorityColor(item.priority) }]}>{item.priority}</Text>
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
                <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>{item.status}</Text>
              </View>
              <Text style={styles.ticketDate}>
                {new Date(item.created_at).toLocaleDateString('pt-BR')}
              </Text>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>🎫</Text>
            <Text style={styles.emptyText}>Nenhum ticket encontrado</Text>
          </View>
        }
      />

      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push('/tickets/create')}
        activeOpacity={0.8}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

function getStatusColor(status: string) {
  switch (status) {
    case 'OPEN': return colors.statusOpen;
    case 'PENDING': return colors.statusPending;
    case 'RESOLVED': return colors.success;
    case 'CLOSED': return colors.textMuted;
    default: return colors.textMuted;
  }
}

function getPriorityColor(priority: string) {
  switch (priority) {
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
  searchContainer: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  searchInput: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    color: colors.text,
    fontSize: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  filterButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
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
    fontSize: 13,
    fontWeight: '500',
  },
  filterTextActive: {
    color: colors.text,
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
  priorityText: {
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
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: 16,
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
  fabText: {
    fontSize: 32,
    color: colors.text,
    fontWeight: '300',
    marginTop: -2,
  },
});
