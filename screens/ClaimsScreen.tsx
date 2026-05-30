import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Colors, Spacing, Radius, Shadow } from '../lib/theme';
import { storage } from '../lib/store';
import { Claim, User } from '../lib/types';
import ClaimCard from '../components/ClaimCard';

interface Props {
  user: User;
  navigation: any;
}

export default function ClaimsScreen({ user, navigation }: Props) {
  const [claims, setClaims] = useState<Claim[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected' | 'resolved'>('all');

  const loadClaims = useCallback(async () => {
    const all = await storage.getClaims();
    const myClaims = all.filter(c => c.claimantId === user.id);
    setClaims(myClaims);
  }, [user.id]);

  useEffect(() => {
    loadClaims();
    const unsubscribe = navigation.addListener('focus', loadClaims);
    return unsubscribe;
  }, [loadClaims, navigation]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadClaims();
    setRefreshing(false);
  };

  const filtered = claims.filter(c => filter === 'all' || c.status === filter);

  const counts = {
    all: claims.length,
    pending: claims.filter(c => c.status === 'pending').length,
    approved: claims.filter(c => c.status === 'approved').length,
    rejected: claims.filter(c => c.status === 'rejected').length,
    resolved: claims.filter(c => c.status === 'resolved').length,
  };

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <View style={styles.pageHeader}>
        <Text style={styles.pageTitle}>My Claims</Text>
        <Text style={styles.pageSubtitle}>{claims.length} total claim{claims.length !== 1 ? 's' : ''}</Text>
      </View>

      {/* Summary Cards */}
      <View style={styles.summaryRow}>
        <View style={[styles.summaryCard, { backgroundColor: Colors.warningLight }]}>
          <Text style={[styles.summaryValue, { color: Colors.warning }]}>{counts.pending}</Text>
          <Text style={[styles.summaryLabel, { color: Colors.warning }]}>Pending</Text>
        </View>
        <View style={[styles.summaryCard, { backgroundColor: Colors.successLight }]}>
          <Text style={[styles.summaryValue, { color: Colors.success }]}>{counts.approved}</Text>
          <Text style={[styles.summaryLabel, { color: Colors.success }]}>Approved</Text>
        </View>
        <View style={[styles.summaryCard, { backgroundColor: Colors.primaryLight }]}>
          <Text style={[styles.summaryValue, { color: Colors.primary }]}>{counts.resolved}</Text>
          <Text style={[styles.summaryLabel, { color: Colors.primary }]}>Resolved</Text>
        </View>
        <View style={[styles.summaryCard, { backgroundColor: Colors.dangerLight }]}>
          <Text style={[styles.summaryValue, { color: Colors.danger }]}>{counts.rejected}</Text>
          <Text style={[styles.summaryLabel, { color: Colors.danger }]}>Rejected</Text>
        </View>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterTabs}>
        {(['all', 'pending', 'approved', 'rejected', 'resolved'] as const).map(f => (
          <TouchableOpacity
            key={f}
            style={[styles.filterTab, filter === f && styles.filterTabActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.filterTabText, filter === f && styles.filterTabTextActive]}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </Text>
            {counts[f] > 0 && (
              <View style={[styles.countBadge, filter === f && styles.countBadgeActive]}>
                <Text style={[styles.countBadgeText, filter === f && styles.countBadgeTextActive]}>
                  {counts[f]}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.empty}>
      <View style={styles.emptyIcon}>
        <Ionicons name="document-text-outline" size={40} color={Colors.textMuted} />
      </View>
      <Text style={styles.emptyTitle}>
        {filter === 'all' ? 'No claims yet' : `No ${filter} claims`}
      </Text>
      <Text style={styles.emptyText}>
        {filter === 'all'
          ? 'Browse items and submit a claim if you find your lost item'
          : 'No claims with this status'}
      </Text>
      {filter === 'all' && (
        <TouchableOpacity
          style={styles.browseBtn}
          onPress={() => navigation.navigate('Search')}
        >
          <Ionicons name="search-outline" size={16} color={Colors.card} />
          <Text style={styles.browseBtnText}>Browse Items</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <FlatList
        data={filtered}
        keyExtractor={item => item.id}
        renderItem={({ item }) => <ClaimCard claim={item} />}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
        }
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  list: { paddingBottom: Spacing.xl },
  headerContainer: { gap: Spacing.md, paddingBottom: Spacing.sm },
  pageHeader: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
  },
  pageTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: Colors.text,
    letterSpacing: -0.5,
  },
  pageSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
    fontWeight: '500',
  },
  summaryRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },
  summaryCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: Radius.md,
    gap: 2,
  },
  summaryValue: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  summaryLabel: {
    fontSize: 10,
    fontWeight: '600',
  },
  filterTabs: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.md,
    gap: 6,
    flexWrap: 'wrap',
  },
  filterTab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: Radius.full,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterTabActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterTabText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  filterTabTextActive: { color: Colors.card },
  countBadge: {
    backgroundColor: Colors.borderLight,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: Radius.full,
    minWidth: 18,
    alignItems: 'center',
  },
  countBadgeActive: { backgroundColor: Colors.card + '40' },
  countBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  countBadgeTextActive: { color: Colors.card },
  empty: {
    alignItems: 'center',
    paddingVertical: Spacing.xxl,
    gap: 10,
    paddingHorizontal: Spacing.xl,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: Radius.xl,
    backgroundColor: Colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  browseBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: 12,
    borderRadius: Radius.md,
    marginTop: 4,
    ...Shadow.sm,
  },
  browseBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.card,
  },
});
