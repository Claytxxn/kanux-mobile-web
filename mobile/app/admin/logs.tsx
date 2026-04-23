import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  ScrollView,
  RefreshControl,
  Modal,
  Platform,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius } from '../../src/theme';
import { api } from '../../src/lib/api';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Company { id: string; name: string; slug: string; }

interface DashboardStats {
  total_chats: number;
  total_messages: number;
  messages_last_30_days: number;
  messages_last_7_days: number;
  total_tickets: number;
  tickets_open: number;
  tickets_pending: number;
  tickets_resolved: number;
  total_members: number;
}

interface LogEntry {
  id: string;
  type: 'MESSAGE' | 'TICKET';
  method: string;
  endpoint: string;
  status: number;
  status_text: string;
  content_preview?: string;
  message_type?: string;
  media_url?: string;
  user_profile_id?: string;
  user_name?: string;
  created_at: string;
  chat_id?: string;
  chat_name?: string;
  ticket_status?: string;
  ticket_priority?: string;
}

interface Filters {
  search: string;
  type: 'ALL' | 'MESSAGE' | 'TICKET';
  method: 'ALL' | 'POST' | 'PUT' | 'DELETE';
  status: 'ALL' | '2xx' | '4xx' | '5xx';
}

// ─── Constants ────────────────────────────────────────────────────────────────

const METHOD_COLORS: Record<string, string> = {
  GET:    '#3B82F6',
  POST:   '#23A559',
  PUT:    '#F0B232',
  PATCH:  '#F0B232',
  DELETE: '#ED4245',
};

const STATUS_COLORS: Record<string, string> = {
  '2': '#23A559',
  '3': '#3B82F6',
  '4': '#F0B232',
  '5': '#ED4245',
};

const PRIORITY_COLORS: Record<string, string> = {
  LOW:      '#80848E',
  MEDIUM:   '#F0B232',
  HIGH:     '#F97316',
  CRITICAL: '#ED4245',
};

const TICKET_STATUS_COLORS: Record<string, string> = {
  OPEN:     '#5865F2',
  PENDING:  '#F0B232',
  RESOLVED: '#23A559',
  CLOSED:   '#80848E',
};

// ─── Helper Functions ─────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleString('pt-BR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
    });
  } catch { return iso; }
}

function getStatusColor(status: number): string {
  const key = Math.floor(status / 100).toString();
  return STATUS_COLORS[key] ?? '#80848E';
}

function getMethodColor(method: string): string {
  return METHOD_COLORS[method?.toUpperCase()] ?? '#80848E';
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatCard({ label, value, icon, color, sub }: {
  label: string; value: number | string; icon: string; color: string; sub?: string;
}) {
  return (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
      <View style={styles.statCardHeader}>
        <Ionicons name={icon as any} size={18} color={color} />
        <Text style={styles.statLabel}>{label}</Text>
      </View>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      {sub && <Text style={styles.statSub}>{sub}</Text>}
    </View>
  );
}

function MethodBadge({ method }: { method: string }) {
  return (
    <View style={[styles.badge, { backgroundColor: getMethodColor(method) + '22', borderColor: getMethodColor(method) }]}>
      <Text style={[styles.badgeText, { color: getMethodColor(method) }]}>{method?.toUpperCase()}</Text>
    </View>
  );
}

function TypeBadge({ type }: { type: string }) {
  const color = type === 'MESSAGE' ? '#5865F2' : '#F0B232';
  const icon = type === 'MESSAGE' ? 'chatbubble-outline' : 'ticket-outline';
  return (
    <View style={[styles.typeBadge, { backgroundColor: color + '22', borderColor: color }]}>
      <Ionicons name={icon as any} size={10} color={color} />
      <Text style={[styles.typeBadgeText, { color }]}>{type === 'MESSAGE' ? 'MSG' : 'TKT'}</Text>
    </View>
  );
}

function LogItem({ item, onPress }: { item: LogEntry; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.logItem} onPress={onPress} activeOpacity={0.75}>
      <View style={styles.logItemLeft}>
        <View style={styles.logItemTopRow}>
          <TypeBadge type={item.type} />
          <MethodBadge method={item.method} />
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '22' }]}>
            <View style={[styles.statusDot, { backgroundColor: getStatusColor(item.status) }]} />
            <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>{item.status}</Text>
          </View>
        </View>
        <Text style={styles.logEndpoint} numberOfLines={1}>{item.endpoint}</Text>
        {item.content_preview ? (
          <Text style={styles.logPreview} numberOfLines={2}>{item.content_preview}</Text>
        ) : null}
        <View style={styles.logMeta}>
          {item.user_name ? (
            <View style={styles.logMetaItem}>
              <Ionicons name="person-outline" size={11} color={colors.textMuted} />
              <Text style={styles.logMetaText}>{item.user_name}</Text>
            </View>
          ) : null}
          {item.chat_name ? (
            <View style={styles.logMetaItem}>
              <Ionicons name="chatbubbles-outline" size={11} color={colors.textMuted} />
              <Text style={styles.logMetaText}>{item.chat_name}</Text>
            </View>
          ) : null}
          {item.ticket_status ? (
            <View style={[styles.miniTag, { borderColor: TICKET_STATUS_COLORS[item.ticket_status] ?? '#80848E' }]}>
              <Text style={[styles.miniTagText, { color: TICKET_STATUS_COLORS[item.ticket_status] ?? '#80848E' }]}>
                {item.ticket_status}
              </Text>
            </View>
          ) : null}
          {item.ticket_priority ? (
            <View style={[styles.miniTag, { borderColor: PRIORITY_COLORS[item.ticket_priority] ?? '#80848E' }]}>
              <Text style={[styles.miniTagText, { color: PRIORITY_COLORS[item.ticket_priority] ?? '#80848E' }]}>
                {item.ticket_priority}
              </Text>
            </View>
          ) : null}
        </View>
      </View>
      <Text style={styles.logDate}>{formatDate(item.created_at)}</Text>
    </TouchableOpacity>
  );
}

// ─── Log Detail Modal ─────────────────────────────────────────────────────────

function LogDetailModal({ item, visible, onClose }: { item: LogEntry | null; visible: boolean; onClose: () => void }) {
  if (!item) return null;
  const rows: { label: string; value: string | number | undefined; color?: string }[] = [
    { label: 'ID', value: item.id },
    { label: 'Tipo', value: item.type },
    { label: 'Método', value: item.method, color: getMethodColor(item.method) },
    { label: 'Endpoint', value: item.endpoint },
    { label: 'Status', value: `${item.status} ${item.status_text}`, color: getStatusColor(item.status) },
    { label: 'Data/Hora', value: formatDate(item.created_at) },
    { label: 'Usuário', value: item.user_name ?? item.user_profile_id },
    { label: 'Conteúdo', value: item.content_preview },
    { label: 'Chat', value: item.chat_name ?? item.chat_id },
    { label: 'Status Ticket', value: item.ticket_status, color: item.ticket_status ? TICKET_STATUS_COLORS[item.ticket_status] : undefined },
    { label: 'Prioridade', value: item.ticket_priority, color: item.ticket_priority ? PRIORITY_COLORS[item.ticket_priority] : undefined },
    { label: 'Tipo Mensagem', value: item.message_type },
    { label: 'Mídia', value: item.media_url },
  ].filter(r => r.value !== undefined && r.value !== null && r.value !== '');

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Detalhe do Log</Text>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="close" size={22} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalBody}>
            {rows.map(r => (
              <View key={r.label} style={styles.detailRow}>
                <Text style={styles.detailLabel}>{r.label}</Text>
                <Text style={[styles.detailValue, r.color ? { color: r.color } : {}]}>{String(r.value)}</Text>
              </View>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function AdminLogsScreen() {
  const router = useRouter();

  // Auth + companies
  const [authorized, setAuthorized] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState('');

  // Data
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  // Filters
  const [filters, setFilters] = useState<Filters>({
    search: '', type: 'ALL', method: 'ALL', status: 'ALL',
  });
  const [showFilters, setShowFilters] = useState(false);
  const [showCompanyPicker, setShowCompanyPicker] = useState(false);

  // Detail modal
  const [detailItem, setDetailItem] = useState<LogEntry | null>(null);

  // ── Auth Check ──────────────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const profileRes = await api.getProfile();
        const profile = profileRes?.data;
        if (!profile) { router.replace('/(auth)/login'); return; }

        const isSuperAdmin = profile.is_super_admin || profile.superAdmin;
        const companiesRes = await api.getAllCompanies();
        const list: Company[] = companiesRes?.data || [];

        if (!isSuperAdmin && list.length === 0) {
          router.replace('/(tabs)'); return;
        }

        setCompanies(list);
        if (list.length > 0) setSelectedCompanyId(list[0].id);
        setAuthorized(true);
      } catch {
        router.replace('/(tabs)');
      } finally {
        setAuthLoading(false);
      }
    })();
  }, []);

  // ── Load Dashboard ──────────────────────────────────────────────────────────
  const loadDashboard = useCallback(async (companyId: string, silent = false) => {
    if (!companyId) return;
    if (!silent) setLoading(true);
    setError('');
    try {
      const res = await api.getAdminDashboard(companyId);
      if (res?.data) {
        setStats(res.data.stats ?? null);
        setLogs(res.data.logs ?? []);
      } else {
        setError(res?.error ?? 'Erro ao carregar dados');
      }
    } catch (e: any) {
      setError(e.message ?? 'Erro ao carregar dados');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (authorized && selectedCompanyId) loadDashboard(selectedCompanyId);
  }, [authorized, selectedCompanyId]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadDashboard(selectedCompanyId, true);
  }, [selectedCompanyId, loadDashboard]);

  // ── Filtered Logs ───────────────────────────────────────────────────────────
  const filteredLogs = useMemo(() => {
    return logs.filter(entry => {
      if (filters.type !== 'ALL' && entry.type !== filters.type) return false;
      if (filters.method !== 'ALL' && entry.method?.toUpperCase() !== filters.method) return false;
      if (filters.status !== 'ALL') {
        const statusClass = Math.floor(entry.status / 100) + 'xx';
        if (statusClass !== filters.status) return false;
      }
      if (filters.search) {
        const q = filters.search.toLowerCase();
        return (
          (entry.content_preview ?? '').toLowerCase().includes(q) ||
          (entry.endpoint ?? '').toLowerCase().includes(q) ||
          (entry.user_name ?? '').toLowerCase().includes(q) ||
          (entry.chat_name ?? '').toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [logs, filters]);

  const selectedCompany = companies.find(c => c.id === selectedCompanyId);
  const activeFilterCount = [
    filters.type !== 'ALL', filters.method !== 'ALL', filters.status !== 'ALL', filters.search !== '',
  ].filter(Boolean).length;

  // ── Loading / Auth ──────────────────────────────────────────────────────────
  if (authLoading) {
    return (
      <View style={styles.centered}>
        <Stack.Screen options={{ title: 'Logs', headerShown: false }} />
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Verificando acesso...</Text>
      </View>
    );
  }

  if (!authorized) return null;

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* ── Custom Header ── */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="chevron-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Ionicons name="pulse-outline" size={18} color={colors.primary} />
          <Text style={styles.headerTitle}>Log de Atividades</Text>
        </View>
        <TouchableOpacity onPress={() => loadDashboard(selectedCompanyId)} style={styles.refreshBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="refresh-outline" size={20} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* ── Company Selector ── */}
      <TouchableOpacity style={styles.companySelectorBtn} onPress={() => setShowCompanyPicker(true)} activeOpacity={0.8}>
        <View style={styles.companySelectorLeft}>
          <Ionicons name="business-outline" size={16} color={colors.primary} />
          <Text style={styles.companySelectorText} numberOfLines={1}>
            {selectedCompany?.name ?? 'Selecionar empresa...'}
          </Text>
        </View>
        <Ionicons name="chevron-down" size={16} color={colors.textMuted} />
      </TouchableOpacity>

      {/* ── Company Picker Modal ── */}
      <Modal visible={showCompanyPicker} animationType="fade" transparent onRequestClose={() => setShowCompanyPicker(false)}>
        <TouchableOpacity style={styles.pickerOverlay} activeOpacity={1} onPress={() => setShowCompanyPicker(false)}>
          <View style={styles.pickerContainer}>
            <Text style={styles.pickerTitle}>Selecionar Empresa</Text>
            <ScrollView>
              {companies.map(c => (
                <TouchableOpacity
                  key={c.id}
                  style={[styles.pickerItem, c.id === selectedCompanyId && styles.pickerItemActive]}
                  onPress={() => { setSelectedCompanyId(c.id); setShowCompanyPicker(false); }}
                >
                  <Text style={[styles.pickerItemText, c.id === selectedCompanyId && { color: colors.primary }]}>
                    {c.name}
                  </Text>
                  {c.id === selectedCompanyId && <Ionicons name="checkmark" size={16} color={colors.primary} />}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      <FlatList
        data={filteredLogs}
        keyExtractor={item => item.id + item.created_at}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} colors={[colors.primary]} />}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={() => (
          <>
            {/* ── Stats Dashboard ── */}
            {stats && (
              <View style={styles.statsSection}>
                <Text style={styles.sectionTitle}>Visão Geral</Text>
                <View style={styles.statsGrid}>
                  <StatCard
                    label="Mensagens"
                    value={stats.total_messages.toLocaleString('pt-BR')}
                    icon="chatbubbles-outline"
                    color={colors.primary}
                    sub={`${stats.messages_last_7_days} esta semana`}
                  />
                  <StatCard
                    label="Tickets"
                    value={stats.total_tickets.toLocaleString('pt-BR')}
                    icon="ticket-outline"
                    color="#F0B232"
                    sub={`${stats.tickets_open} abertos`}
                  />
                  <StatCard
                    label="Chats"
                    value={stats.total_chats.toLocaleString('pt-BR')}
                    icon="chatbox-outline"
                    color="#3B82F6"
                    sub={`canais ativos`}
                  />
                  <StatCard
                    label="Membros"
                    value={stats.total_members.toLocaleString('pt-BR')}
                    icon="people-outline"
                    color="#23A559"
                  />
                </View>

                {/* Ticket breakdown bar */}
                <View style={styles.ticketBreakdown}>
                  <Text style={styles.breakdownTitle}>Tickets por Status</Text>
                  <View style={styles.breakdownRow}>
                    {[
                      { label: 'Abertos', value: stats.tickets_open, color: '#5865F2' },
                      { label: 'Pendentes', value: stats.tickets_pending, color: '#F0B232' },
                      { label: 'Resolvidos', value: stats.tickets_resolved, color: '#23A559' },
                    ].map(item => (
                      <View key={item.label} style={styles.breakdownItem}>
                        <View style={[styles.breakdownDot, { backgroundColor: item.color }]} />
                        <Text style={styles.breakdownLabel}>{item.label}</Text>
                        <Text style={[styles.breakdownValue, { color: item.color }]}>{item.value}</Text>
                      </View>
                    ))}
                  </View>
                </View>

                {/* Messages trend */}
                <View style={styles.trendCard}>
                  <View style={styles.trendRow}>
                    <Ionicons name="trending-up-outline" size={14} color="#23A559" />
                    <Text style={styles.trendText}>
                      <Text style={{ color: '#23A559', fontWeight: '700' }}>{stats.messages_last_30_days}</Text>
                      {' mensagens nos últimos 30 dias'}
                    </Text>
                  </View>
                  <View style={styles.trendRow}>
                    <Ionicons name="flash-outline" size={14} color={colors.primary} />
                    <Text style={styles.trendText}>
                      <Text style={{ color: colors.primary, fontWeight: '700' }}>{stats.messages_last_7_days}</Text>
                      {' mensagens nos últimos 7 dias'}
                    </Text>
                  </View>
                </View>
              </View>
            )}

            {loading && !stats && (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={styles.loadingText}>Carregando dados...</Text>
              </View>
            )}

            {error ? (
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle-outline" size={32} color={colors.error} />
                <Text style={styles.errorText}>{error}</Text>
                <TouchableOpacity style={styles.retryBtn} onPress={() => loadDashboard(selectedCompanyId)}>
                  <Text style={styles.retryText}>Tentar novamente</Text>
                </TouchableOpacity>
              </View>
            ) : null}

            {/* ── Logs Header + Filters ── */}
            <View style={styles.logsHeader}>
              <View style={styles.logsHeaderLeft}>
                <Text style={styles.sectionTitle}>Histórico de Atividades</Text>
                <View style={styles.logCount}>
                  <Text style={styles.logCountText}>{filteredLogs.length}</Text>
                </View>
              </View>
              <TouchableOpacity
                style={[styles.filterToggle, activeFilterCount > 0 && styles.filterToggleActive]}
                onPress={() => setShowFilters(v => !v)}
              >
                <Ionicons name="options-outline" size={16} color={activeFilterCount > 0 ? colors.primary : colors.textSecondary} />
                <Text style={[styles.filterToggleText, activeFilterCount > 0 && { color: colors.primary }]}>
                  Filtros{activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}
                </Text>
              </TouchableOpacity>
            </View>

            {/* ── Filter Panel ── */}
            {showFilters && (
              <View style={styles.filterPanel}>
                {/* Search */}
                <View style={styles.searchBar}>
                  <Ionicons name="search-outline" size={15} color={colors.textMuted} />
                  <TextInput
                    style={styles.searchInput}
                    placeholder="Buscar por conteúdo, usuário, canal..."
                    placeholderTextColor={colors.textMuted}
                    value={filters.search}
                    onChangeText={v => setFilters(f => ({ ...f, search: v }))}
                    returnKeyType="search"
                  />
                  {filters.search ? (
                    <TouchableOpacity onPress={() => setFilters(f => ({ ...f, search: '' }))}>
                      <Ionicons name="close-circle" size={15} color={colors.textMuted} />
                    </TouchableOpacity>
                  ) : null}
                </View>

                {/* Type filter */}
                <View style={styles.filterGroup}>
                  <Text style={styles.filterGroupLabel}>Tipo</Text>
                  <View style={styles.filterChips}>
                    {(['ALL', 'MESSAGE', 'TICKET'] as const).map(v => (
                      <TouchableOpacity
                        key={v}
                        style={[styles.chip, filters.type === v && styles.chipActive]}
                        onPress={() => setFilters(f => ({ ...f, type: v }))}
                      >
                        <Text style={[styles.chipText, filters.type === v && styles.chipTextActive]}>
                          {v === 'ALL' ? 'Todos' : v === 'MESSAGE' ? 'Mensagem' : 'Ticket'}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Method filter */}
                <View style={styles.filterGroup}>
                  <Text style={styles.filterGroupLabel}>Método</Text>
                  <View style={styles.filterChips}>
                    {(['ALL', 'POST', 'PUT', 'DELETE'] as const).map(v => (
                      <TouchableOpacity
                        key={v}
                        style={[styles.chip, filters.method === v && styles.chipActive, v !== 'ALL' && { borderColor: getMethodColor(v) + '88' }]}
                        onPress={() => setFilters(f => ({ ...f, method: v }))}
                      >
                        <Text style={[styles.chipText, filters.method === v && { color: v !== 'ALL' ? getMethodColor(v) : colors.primary }]}>
                          {v === 'ALL' ? 'Todos' : v}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Status filter */}
                <View style={styles.filterGroup}>
                  <Text style={styles.filterGroupLabel}>Status HTTP</Text>
                  <View style={styles.filterChips}>
                    {(['ALL', '2xx', '4xx', '5xx'] as const).map(v => (
                      <TouchableOpacity
                        key={v}
                        style={[styles.chip, filters.status === v && styles.chipActive]}
                        onPress={() => setFilters(f => ({ ...f, status: v }))}
                      >
                        <Text style={[styles.chipText, filters.status === v && styles.chipTextActive]}>
                          {v === 'ALL' ? 'Todos' : v}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Clear filters */}
                {activeFilterCount > 0 && (
                  <TouchableOpacity
                    style={styles.clearFiltersBtn}
                    onPress={() => setFilters({ search: '', type: 'ALL', method: 'ALL', status: 'ALL' })}
                  >
                    <Ionicons name="trash-outline" size={14} color={colors.error} />
                    <Text style={styles.clearFiltersText}>Limpar filtros</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </>
        )}
        renderItem={({ item }) => (
          <LogItem item={item} onPress={() => setDetailItem(item)} />
        )}
        ListEmptyComponent={!loading ? (
          <View style={styles.emptyState}>
            <Ionicons name="document-outline" size={40} color={colors.textMuted} />
            <Text style={styles.emptyText}>
              {logs.length === 0 ? 'Nenhuma atividade encontrada' : 'Nenhum resultado para os filtros aplicados'}
            </Text>
          </View>
        ) : null}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />

      {/* ── Log Detail Modal ── */}
      <LogDetailModal
        item={detailItem}
        visible={detailItem !== null}
        onClose={() => setDetailItem(null)}
      />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background, gap: 12 },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 56 : 20,
    paddingHorizontal: spacing.md, paddingBottom: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1, borderBottomColor: colors.divider,
  },
  backBtn: { padding: 2 },
  refreshBtn: { padding: 2 },
  headerCenter: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  headerTitle: { fontSize: 16, fontWeight: '700', color: colors.text },

  // Company Selector
  companySelectorBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginHorizontal: spacing.md, marginTop: spacing.sm, marginBottom: 2,
    backgroundColor: colors.surface,
    borderWidth: 1, borderColor: colors.border,
    borderRadius: borderRadius.md, paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
  },
  companySelectorLeft: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1, marginRight: 8 },
  companySelectorText: { fontSize: 14, fontWeight: '600', color: colors.text, flex: 1 },

  // Company Picker
  pickerOverlay: { flex: 1, backgroundColor: '#00000080', justifyContent: 'center', padding: spacing.xl },
  pickerContainer: {
    backgroundColor: colors.surface, borderRadius: borderRadius.lg,
    borderWidth: 1, borderColor: colors.border, maxHeight: 360, padding: spacing.md,
  },
  pickerTitle: { fontSize: 15, fontWeight: '700', color: colors.text, marginBottom: spacing.sm },
  pickerItem: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: spacing.sm, paddingHorizontal: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  pickerItemActive: { backgroundColor: colors.primary + '18' },
  pickerItemText: { fontSize: 14, color: colors.text },

  // List
  listContent: { paddingBottom: 32 },

  // Stats
  statsSection: { paddingHorizontal: spacing.md, paddingTop: spacing.md },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: spacing.sm },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.sm },
  statCard: {
    flex: 1, minWidth: '45%',
    backgroundColor: colors.surface, borderRadius: borderRadius.md,
    borderWidth: 1, borderColor: colors.border,
    borderLeftWidth: 3, padding: spacing.sm,
  },
  statCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 4 },
  statLabel: { fontSize: 11, color: colors.textSecondary, flex: 1 },
  statValue: { fontSize: 22, fontWeight: '800', lineHeight: 28 },
  statSub: { fontSize: 11, color: colors.textMuted, marginTop: 2 },

  // Ticket breakdown
  ticketBreakdown: {
    backgroundColor: colors.surface, borderRadius: borderRadius.md,
    borderWidth: 1, borderColor: colors.border,
    padding: spacing.sm, marginBottom: spacing.sm,
  },
  breakdownTitle: { fontSize: 11, color: colors.textSecondary, fontWeight: '600', marginBottom: spacing.xs },
  breakdownRow: { flexDirection: 'row', gap: spacing.md },
  breakdownItem: { flexDirection: 'row', alignItems: 'center', gap: 5, flex: 1 },
  breakdownDot: { width: 8, height: 8, borderRadius: 4 },
  breakdownLabel: { fontSize: 11, color: colors.textMuted, flex: 1 },
  breakdownValue: { fontSize: 14, fontWeight: '700' },

  // Trend card
  trendCard: {
    backgroundColor: colors.surface, borderRadius: borderRadius.md,
    borderWidth: 1, borderColor: colors.border,
    padding: spacing.sm, marginBottom: spacing.md, gap: 6,
  },
  trendRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  trendText: { fontSize: 12, color: colors.textSecondary },

  // Logs header
  logsHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.md, paddingTop: spacing.xs, marginBottom: spacing.xs,
  },
  logsHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  logCount: {
    backgroundColor: colors.primary + '22', borderRadius: 10,
    paddingHorizontal: 7, paddingVertical: 2,
  },
  logCountText: { fontSize: 11, fontWeight: '700', color: colors.primary },
  filterToggle: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: spacing.sm, paddingVertical: 6,
    borderRadius: borderRadius.sm, borderWidth: 1, borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  filterToggleActive: { borderColor: colors.primary, backgroundColor: colors.primary + '18' },
  filterToggleText: { fontSize: 12, color: colors.textSecondary, fontWeight: '600' },

  // Filter panel
  filterPanel: {
    marginHorizontal: spacing.md, marginBottom: spacing.sm,
    backgroundColor: colors.surface, borderRadius: borderRadius.md,
    borderWidth: 1, borderColor: colors.border, padding: spacing.sm, gap: spacing.sm,
  },
  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: colors.background, borderRadius: borderRadius.sm,
    borderWidth: 1, borderColor: colors.border,
    paddingHorizontal: spacing.sm, paddingVertical: 7,
  },
  searchInput: { flex: 1, fontSize: 13, color: colors.text },
  filterGroup: { gap: 5 },
  filterGroupLabel: { fontSize: 11, color: colors.textMuted, fontWeight: '600' },
  filterChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: {
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12,
    borderWidth: 1, borderColor: colors.border, backgroundColor: colors.background,
  },
  chipActive: { borderColor: colors.primary, backgroundColor: colors.primary + '18' },
  chipText: { fontSize: 12, color: colors.textSecondary },
  chipTextActive: { color: colors.primary, fontWeight: '600' },
  clearFiltersBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    alignSelf: 'flex-end', paddingHorizontal: 10, paddingVertical: 4,
  },
  clearFiltersText: { fontSize: 12, color: colors.error },

  // Log item
  logItem: {
    flexDirection: 'row', alignItems: 'flex-start',
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  logItemLeft: { flex: 1, gap: 4 },
  logItemTopRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  logEndpoint: { fontSize: 12, color: colors.textSecondary, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' },
  logPreview: { fontSize: 13, color: colors.text, lineHeight: 18 },
  logMeta: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6, marginTop: 2 },
  logMetaItem: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  logMetaText: { fontSize: 11, color: colors.textMuted },
  logDate: { fontSize: 10, color: colors.textMuted, marginTop: 2, minWidth: 72, textAlign: 'right' },

  // Badges
  badge: {
    paddingHorizontal: 7, paddingVertical: 2, borderRadius: 4, borderWidth: 1,
  },
  badgeText: { fontSize: 10, fontWeight: '700' },
  typeBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, borderWidth: 1,
  },
  typeBadgeText: { fontSize: 9, fontWeight: '700' },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 10, fontWeight: '700' },
  miniTag: { borderWidth: 1, borderRadius: 4, paddingHorizontal: 5, paddingVertical: 1 },
  miniTagText: { fontSize: 9, fontWeight: '700' },

  // Separator
  separator: { height: 1, backgroundColor: colors.divider, marginHorizontal: spacing.md },

  // Empty / Loading / Error
  loadingContainer: { alignItems: 'center', paddingVertical: 32, gap: 12 },
  loadingText: { fontSize: 14, color: colors.textMuted },
  errorContainer: { alignItems: 'center', paddingVertical: 32, gap: 12, paddingHorizontal: spacing.xl },
  errorText: { fontSize: 14, color: colors.textSecondary, textAlign: 'center' },
  retryBtn: {
    paddingHorizontal: spacing.lg, paddingVertical: spacing.sm,
    backgroundColor: colors.primary, borderRadius: borderRadius.md,
  },
  retryText: { fontSize: 14, color: '#fff', fontWeight: '600' },
  emptyState: { alignItems: 'center', paddingVertical: 48, gap: 10 },
  emptyText: { fontSize: 14, color: colors.textMuted, textAlign: 'center', paddingHorizontal: spacing.xl },

  // Detail Modal
  modalOverlay: { flex: 1, backgroundColor: '#00000090', justifyContent: 'flex-end' },
  modalContainer: {
    backgroundColor: colors.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20,
    borderTopWidth: 1, borderColor: colors.border, maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.divider,
  },
  modalTitle: { fontSize: 16, fontWeight: '700', color: colors.text },
  modalBody: { padding: spacing.md },
  detailRow: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 12,
    paddingVertical: spacing.xs, borderBottomWidth: 1, borderBottomColor: colors.divider,
  },
  detailLabel: { fontSize: 12, color: colors.textMuted, fontWeight: '600', minWidth: 110 },
  detailValue: { fontSize: 13, color: colors.text, flex: 1 },
});
