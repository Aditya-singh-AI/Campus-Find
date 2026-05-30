import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
  TextInput,
  Modal,
  ScrollView,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Colors, Spacing, Radius, Shadow } from '../lib/theme';
import { storage } from '../lib/store';
import { supabase } from '../lib/supabase';
import { LostFoundItem, Claim, User, Announcement } from '../lib/types';
import ItemCard from '../components/ItemCard';
import ClaimCard from '../components/ClaimCard';
import { formatDistanceToNow } from 'date-fns';

interface Props {
  user: User;
  navigation: any;
  onLogout?: () => void;
}

type AdminTab = 'dashboard' | 'items' | 'claims' | 'announcements';

export default function AdminScreen({ user, navigation, onLogout }: Props) {
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
  const [items, setItems] = useState<LostFoundItem[]>([]);
  const [claims, setClaims] = useState<Claim[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [showAnnModal, setShowAnnModal] = useState(false);
  const [annTitle, setAnnTitle] = useState('');
  const [annBody, setAnnBody] = useState('');
  const [annLoading, setAnnLoading] = useState(false);
  const [itemFilter, setItemFilter] = useState<'all' | 'lost' | 'found' | 'active' | 'claimed' | 'returned'>('all');
  const [claimFilter, setClaimFilter] = useState<'all' | 'pending' | 'approved' | 'rejected' | 'resolved'>('all');

  const loadData = useCallback(async () => {
    const [itemsData, claimsData, annsData] = await Promise.all([
      storage.getItems(),
      storage.getClaims(),
      storage.getAnnouncements(),
    ]);
    setItems(itemsData);
    setClaims(claimsData);
    setAnnouncements(annsData);
  }, []);

  useEffect(() => {
    loadData();
    const unsubscribe = navigation.addListener('focus', loadData);
    return unsubscribe;
  }, [loadData, navigation]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleApproveClaim = async (claimId: string) => {
    if (Platform.OS === 'web') {
      if (window.confirm('Are you sure you want to approve this claim?')) {
        try {
          await storage.updateClaim(claimId, {
            status: 'approved',
            updatedAt: new Date().toISOString(),
            adminNote: 'Claim verified and approved. Please collect item from Security Office.',
          });
          await loadData();
          window.alert('Claim approved successfully!');
        } catch (err: any) {
          window.alert(err.message || 'Failed to approve claim');
        }
      }
    } else {
      Alert.alert('Approve Claim', 'Are you sure you want to approve this claim?', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Approve',
          onPress: async () => {
            try {
              await storage.updateClaim(claimId, {
                status: 'approved',
                updatedAt: new Date().toISOString(),
                adminNote: 'Claim verified and approved. Please collect item from Security Office.',
              });
              await loadData();
              Alert.alert('Success', 'Claim approved successfully!');
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Failed to approve claim');
            }
          },
        },
      ]);
    }
  };

  const handleRejectClaim = async (claimId: string) => {
    if (Platform.OS === 'web') {
      if (window.confirm('Are you sure you want to reject this claim?')) {
        try {
          await storage.updateClaim(claimId, {
            status: 'rejected',
            updatedAt: new Date().toISOString(),
            adminNote: 'Claim rejected. Insufficient proof provided.',
          });
          await loadData();
          window.alert('Claim rejected.');
        } catch (err: any) {
          window.alert(err.message || 'Failed to reject claim');
        }
      }
    } else {
      Alert.alert('Reject Claim', 'Are you sure you want to reject this claim?', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: async () => {
            try {
              await storage.updateClaim(claimId, {
                status: 'rejected',
                updatedAt: new Date().toISOString(),
                adminNote: 'Claim rejected. Insufficient proof provided.',
              });
              await loadData();
              Alert.alert('Done', 'Claim rejected.');
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Failed to reject claim');
            }
          },
        },
      ]);
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    if (Platform.OS === 'web') {
      if (window.confirm('Are you sure you want to delete this item?')) {
        await storage.deleteItem(itemId);
        await loadData();
      }
    } else {
      Alert.alert('Delete Item', 'Are you sure you want to delete this item?', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await storage.deleteItem(itemId);
            await loadData();
          },
        },
      ]);
    }
  };

  const handleMarkReturned = async (itemId: string) => {
    try {
      await storage.updateItem(itemId, { status: 'returned' });
      await loadData();
    } catch (err: any) {
      if (Platform.OS === 'web') {
        window.alert(err.message || 'Failed to update item');
      } else {
        Alert.alert('Error', err.message || 'Failed to update item');
      }
    }
  };

  const handlePostAnnouncement = async () => {
    if (!annTitle.trim() || !annBody.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    setAnnLoading(true);
    await new Promise(r => setTimeout(r, 800));
    const newAnn: Omit<Announcement, 'id'> = {
      title: annTitle.trim(),
      body: annBody.trim(),
      createdAt: new Date().toISOString(),
      adminName: user.name,
    };
    await storage.addAnnouncement(newAnn);
    await loadData();
    setAnnLoading(false);
    setShowAnnModal(false);
    setAnnTitle('');
    setAnnBody('');
    Alert.alert('Success', 'Announcement posted successfully!');
  };

  // Stats
  const stats = {
    totalItems: items.length,
    lostItems: items.filter(i => i.type === 'lost').length,
    foundItems: items.filter(i => i.type === 'found').length,
    activeItems: items.filter(i => i.status === 'active').length,
    returnedItems: items.filter(i => i.status === 'returned').length,
    totalClaims: claims.length,
    pendingClaims: claims.filter(c => c.status === 'pending').length,
    approvedClaims: claims.filter(c => c.status === 'approved').length,
    resolvedClaims: claims.filter(c => c.status === 'resolved').length,
    recoveryRate: items.length > 0
      ? Math.round((items.filter(i => i.status === 'returned').length / items.length) * 100)
      : 0,
  };

  const filteredItems = items.filter(i => {
    if (itemFilter === 'all') return true;
    if (itemFilter === 'lost' || itemFilter === 'found') return i.type === itemFilter;
    return i.status === itemFilter;
  });

  const filteredClaims = claims.filter(c => claimFilter === 'all' || c.status === claimFilter);

  const [dbRole, setDbRole] = useState<string>('checking DB profile...');

  useEffect(() => {
    supabase.from('profiles').select('role').eq('id', user.id).single()
      .then((res: any) => setDbRole(res.data?.role || 'no row found'), (err: any) => setDbRole('error loading'));
  }, [user.id]);

  const renderDashboard = () => (
    <ScrollView
      contentContainerStyle={styles.dashScroll}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
      }
    >
      {/* Welcome */}
      <View style={styles.adminWelcome}>
        <View style={styles.adminAvatar}>
          <Ionicons name="shield-checkmark" size={28} color={Colors.card} />
        </View>
        <View>
          <Text style={styles.adminWelcomeText}>Admin Panel</Text>
          <Text style={styles.adminWelcomeName}>{user.name}</Text>
          <Text style={{ color: 'white', fontSize: 12, marginTop: 4 }}>DB Profile Role: {dbRole}</Text>
        </View>
      </View>

      {/* Recovery Rate */}
      <View style={styles.recoveryCard}>
        <View style={styles.recoveryLeft}>
          <Text style={styles.recoveryRate}>{stats.recoveryRate}%</Text>
          <Text style={styles.recoveryLabel}>Recovery Rate</Text>
        </View>
        <View style={styles.recoveryRight}>
          <View style={styles.recoveryBar}>
            <View style={[styles.recoveryFill, { width: `${stats.recoveryRate}%` as any }]} />
          </View>
          <Text style={styles.recoverySubtext}>
            {stats.returnedItems} of {stats.totalItems} items recovered
          </Text>
        </View>
      </View>

      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        {[
          { label: 'Total Items', value: stats.totalItems, icon: 'cube-outline', color: Colors.primary, bg: Colors.primaryLight },
          { label: 'Lost Reports', value: stats.lostItems, icon: 'search-outline', color: Colors.lost, bg: Colors.lostLight },
          { label: 'Found Reports', value: stats.foundItems, icon: 'checkmark-circle-outline', color: Colors.found, bg: Colors.foundLight },
          { label: 'Active Items', value: stats.activeItems, icon: 'radio-button-on-outline', color: Colors.success, bg: Colors.successLight },
          { label: 'Pending Claims', value: stats.pendingClaims, icon: 'time-outline', color: Colors.warning, bg: Colors.warningLight },
          { label: 'Resolved', value: stats.resolvedClaims, icon: 'ribbon-outline', color: Colors.secondary, bg: Colors.secondaryLight },
        ].map((stat, i) => (
          <View key={i} style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: stat.bg }]}>
              <Ionicons name={stat.icon as any} size={20} color={stat.color} />
            </View>
            <Text style={styles.statValue}>{stat.value}</Text>
            <Text style={styles.statLabel}>{stat.label}</Text>
          </View>
        ))}
      </View>

      {/* Quick Actions */}
      <View style={styles.quickActionsSection}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.quickActionsRow}>
          <TouchableOpacity
            style={[styles.quickActionCard, { backgroundColor: Colors.warningLight }]}
            onPress={() => setActiveTab('claims')}
          >
            <Ionicons name="time-outline" size={24} color={Colors.warning} />
            <Text style={[styles.quickActionCardText, { color: Colors.warning }]}>
              {stats.pendingClaims} Pending
            </Text>
            <Text style={[styles.quickActionCardSub, { color: Colors.warning }]}>Claims</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.quickActionCard, { backgroundColor: Colors.primaryLight }]}
            onPress={() => setActiveTab('items')}
          >
            <Ionicons name="cube-outline" size={24} color={Colors.primary} />
            <Text style={[styles.quickActionCardText, { color: Colors.primary }]}>
              {stats.activeItems} Active
            </Text>
            <Text style={[styles.quickActionCardSub, { color: Colors.primary }]}>Items</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.quickActionCard, { backgroundColor: Colors.accentLight }]}
            onPress={() => setShowAnnModal(true)}
          >
            <Ionicons name="megaphone-outline" size={24} color={Colors.accent} />
            <Text style={[styles.quickActionCardText, { color: Colors.accent }]}>Announce</Text>
            <Text style={[styles.quickActionCardSub, { color: Colors.accent }]}>Broadcast</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Recent Claims */}
      {claims.filter(c => c.status === 'pending').length > 0 && (
        <View style={styles.recentSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Pending Claims</Text>
            <TouchableOpacity onPress={() => setActiveTab('claims')}>
              <Text style={styles.seeAll}>See All</Text>
            </TouchableOpacity>
          </View>
          {claims.filter(c => c.status === 'pending').slice(0, 3).map(claim => (
            <ClaimCard
              key={claim.id}
              claim={claim}
              showActions
              onApprove={() => handleApproveClaim(claim.id)}
              onReject={() => handleRejectClaim(claim.id)}
            />
          ))}
        </View>
      )}
    </ScrollView>
  );

  const renderItems = () => (
    <View style={styles.flex}>
      <View style={styles.filterBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          {(['all', 'lost', 'found', 'active', 'claimed', 'returned'] as const).map(f => (
            <TouchableOpacity
              key={f}
              style={[styles.filterChip, itemFilter === f && styles.filterChipActive]}
              onPress={() => setItemFilter(f)}
            >
              <Text style={[styles.filterChipText, itemFilter === f && styles.filterChipTextActive]}>
                {f.charAt(0).toUpperCase() + f.slice(1)} ({items.filter(i => {
                  if (f === 'all') return true;
                  if (f === 'lost' || f === 'found') return i.type === f;
                  return i.status === f;
                }).length})
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
      <FlatList
        data={filteredItems}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <View style={styles.itemWithActions}>
            <ItemCard
              item={item}
              onPress={() => navigation.navigate('ItemDetail', { item })}
            />
            <View style={styles.adminItemActions}>
              {item.status === 'active' && (
                <TouchableOpacity
                  style={styles.adminActionBtn}
                  onPress={() => handleMarkReturned(item.id)}
                >
                  <Ionicons name="checkmark-done" size={14} color={Colors.success} />
                  <Text style={[styles.adminActionText, { color: Colors.success }]}>Returned</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={[styles.adminActionBtn, styles.deleteBtn]}
                onPress={() => handleDeleteItem(item.id)}
              >
                <Ionicons name="trash-outline" size={14} color={Colors.danger} />
                <Text style={[styles.adminActionText, { color: Colors.danger }]}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
        }
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="cube-outline" size={40} color={Colors.textMuted} />
            <Text style={styles.emptyText}>No items found</Text>
          </View>
        }
      />
    </View>
  );

  const renderClaims = () => (
    <View style={styles.flex}>
      <View style={styles.filterBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          {(['all', 'pending', 'approved', 'rejected', 'resolved'] as const).map(f => (
            <TouchableOpacity
              key={f}
              style={[styles.filterChip, claimFilter === f && styles.filterChipActive]}
              onPress={() => setClaimFilter(f)}
            >
              <Text style={[styles.filterChipText, claimFilter === f && styles.filterChipTextActive]}>
                {f.charAt(0).toUpperCase() + f.slice(1)} ({claims.filter(c => f === 'all' || c.status === f).length})
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
      <FlatList
        data={filteredClaims}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <ClaimCard
            claim={item}
            showActions
            onApprove={() => handleApproveClaim(item.id)}
            onReject={() => handleRejectClaim(item.id)}
          />
        )}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
        }
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="document-text-outline" size={40} color={Colors.textMuted} />
            <Text style={styles.emptyText}>No claims found</Text>
          </View>
        }
      />
    </View>
  );

  const renderAnnouncements = () => (
    <View style={styles.flex}>
      <View style={styles.annHeader}>
        <TouchableOpacity style={styles.postAnnBtn} onPress={() => setShowAnnModal(true)}>
          <Ionicons name="add" size={18} color={Colors.card} />
          <Text style={styles.postAnnBtnText}>Post Announcement</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={announcements}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <View style={styles.annCard}>
            <View style={styles.annCardHeader}>
              <View style={styles.annCardIcon}>
                <Ionicons name="megaphone-outline" size={18} color={Colors.accent} />
              </View>
              <View style={styles.annCardMeta}>
                <Text style={styles.annCardTitle}>{item.title}</Text>
                <Text style={styles.annCardTime}>
                  {(() => {
                    try { return formatDistanceToNow(new Date(item.createdAt), { addSuffix: true }); }
                    catch { return 'recently'; }
                  })()}
                </Text>
              </View>
            </View>
            <Text style={styles.annCardBody}>{item.body}</Text>
            <Text style={styles.annCardAdmin}>By {item.adminName}</Text>
          </View>
        )}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
        }
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="megaphone-outline" size={40} color={Colors.textMuted} />
            <Text style={styles.emptyText}>No announcements yet</Text>
          </View>
        }
      />
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Admin Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.headerIcon}>
            <Ionicons name="shield-checkmark" size={20} color={Colors.card} />
          </View>
          <Text style={styles.headerTitle}>Admin Panel</Text>
        </View>
        <View style={styles.headerRight}>
          <View style={styles.headerBadge}>
            <Ionicons name="ellipse" size={8} color={Colors.success} />
            <Text style={styles.headerBadgeText}>Live</Text>
          </View>
          <TouchableOpacity
            style={styles.logoutBtn}
            onPress={() => {
              if (Platform.OS === 'web') {
                if (window.confirm('Are you sure you want to logout?')) {
                  onLogout?.();
                }
              } else {
                Alert.alert('Logout', 'Are you sure you want to logout?', [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Logout', style: 'destructive', onPress: onLogout },
                ]);
              }
            }}
          >
            <Ionicons name="log-out-outline" size={20} color={Colors.card} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabNav}>
        {([
          { key: 'dashboard', icon: 'grid-outline', label: 'Dashboard' },
          { key: 'items', icon: 'cube-outline', label: 'Items' },
          { key: 'claims', icon: 'document-text-outline', label: 'Claims' },
          { key: 'announcements', icon: 'megaphone-outline', label: 'Announce' },
        ] as const).map(tab => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tabNavItem, activeTab === tab.key && styles.tabNavItemActive]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Ionicons
              name={tab.icon}
              size={18}
              color={activeTab === tab.key ? Colors.primary : Colors.textMuted}
            />
            <Text style={[styles.tabNavText, activeTab === tab.key && styles.tabNavTextActive]}>
              {tab.label}
            </Text>
            {tab.key === 'claims' && stats.pendingClaims > 0 && (
              <View style={styles.tabBadge}>
                <Text style={styles.tabBadgeText}>{stats.pendingClaims}</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>

      {/* Tab Content */}
      <View style={styles.flex}>
        {activeTab === 'dashboard' && renderDashboard()}
        {activeTab === 'items' && renderItems()}
        {activeTab === 'claims' && renderClaims()}
        {activeTab === 'announcements' && renderAnnouncements()}
      </View>

      {/* Announcement Modal */}
      <Modal
        visible={showAnnModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowAnnModal(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Post Announcement</Text>
            <TouchableOpacity onPress={() => setShowAnnModal(false)} style={styles.modalClose}>
              <Ionicons name="close" size={22} color={Colors.text} />
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={styles.modalScroll} keyboardShouldPersistTaps="handled">
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Title *</Text>
              <View style={styles.inputBox}>
                <TextInput
                  style={styles.input}
                  placeholder="Announcement title..."
                  placeholderTextColor={Colors.textMuted}
                  value={annTitle}
                  onChangeText={setAnnTitle}
                  maxLength={100}
                />
              </View>
            </View>
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Message *</Text>
              <View style={[styles.inputBox, styles.textAreaBox]}>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Write your announcement..."
                  placeholderTextColor={Colors.textMuted}
                  value={annBody}
                  onChangeText={setAnnBody}
                  multiline
                  numberOfLines={5}
                  textAlignVertical="top"
                  maxLength={500}
                />
              </View>
            </View>
            <TouchableOpacity
              style={[styles.postBtn, (!annTitle.trim() || !annBody.trim()) && styles.postBtnDisabled]}
              onPress={handlePostAnnouncement}
              disabled={!annTitle.trim() || !annBody.trim() || annLoading}
            >
              {annLoading ? (
                <ActivityIndicator color={Colors.card} />
              ) : (
                <>
                  <Ionicons name="megaphone-outline" size={18} color={Colors.card} />
                  <Text style={styles.postBtnText}>Post Announcement</Text>
                </>
              )}
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.primary,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerIcon: {
    width: 32,
    height: 32,
    borderRadius: Radius.sm,
    backgroundColor: Colors.card + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.card,
    letterSpacing: -0.3,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: Colors.card + '20',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  headerBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.card,
  },
  logoutBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FF3B30',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabNav: {
    flexDirection: 'row',
    backgroundColor: Colors.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  tabNavItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    gap: 3,
    position: 'relative',
  },
  tabNavItemActive: {
    borderBottomWidth: 2,
    borderBottomColor: Colors.primary,
  },
  tabNavText: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.textMuted,
  },
  tabNavTextActive: {
    color: Colors.primary,
    fontWeight: '700',
  },
  tabBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: Colors.danger,
    borderRadius: 8,
    width: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: Colors.card,
  },
  dashScroll: {
    padding: Spacing.md,
    gap: Spacing.md,
    paddingBottom: Spacing.xl,
  },
  adminWelcome: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.primary,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
  },
  adminAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.card + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  adminWelcomeText: {
    fontSize: 13,
    color: Colors.card + 'CC',
    fontWeight: '600',
  },
  adminWelcomeName: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.card,
    letterSpacing: -0.3,
  },
  recoveryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.lg,
    backgroundColor: Colors.card,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    ...Shadow.md,
  },
  recoveryLeft: { alignItems: 'center', gap: 2 },
  recoveryRate: {
    fontSize: 36,
    fontWeight: '900',
    color: Colors.success,
    letterSpacing: -1,
  },
  recoveryLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  recoveryRight: { flex: 1, gap: 8 },
  recoveryBar: {
    height: 8,
    backgroundColor: Colors.borderLight,
    borderRadius: 4,
    overflow: 'hidden',
  },
  recoveryFill: {
    height: '100%',
    backgroundColor: Colors.success,
    borderRadius: 4,
  },
  recoverySubtext: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  statCard: {
    width: '31%',
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    alignItems: 'center',
    gap: 4,
    ...Shadow.sm,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValue: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.text,
    letterSpacing: -0.5,
  },
  statLabel: {
    fontSize: 10,
    color: Colors.textSecondary,
    fontWeight: '600',
    textAlign: 'center',
  },
  quickActionsSection: { gap: Spacing.sm },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.text,
    letterSpacing: -0.2,
  },
  seeAll: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.primary,
  },
  quickActionsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  quickActionCard: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
    padding: Spacing.md,
    borderRadius: Radius.lg,
  },
  quickActionCardText: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  quickActionCardSub: {
    fontSize: 11,
    fontWeight: '600',
  },
  recentSection: { gap: Spacing.sm },
  list: { paddingBottom: Spacing.xl },
  filterBar: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.card,
  },
  filterScroll: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: Radius.full,
    backgroundColor: Colors.borderLight,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  filterChipTextActive: { color: Colors.card },
  itemWithActions: { gap: 0 },
  adminItemActions: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: Spacing.md,
    paddingBottom: 8,
    paddingTop: 4,
  },
  adminActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.full,
    backgroundColor: Colors.successLight,
  },
  deleteBtn: {
    backgroundColor: Colors.dangerLight,
  },
  adminActionText: {
    fontSize: 12,
    fontWeight: '600',
  },
  annHeader: {
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.card,
  },
  postAnnBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: 10,
    borderRadius: Radius.md,
    alignSelf: 'flex-start',
    ...Shadow.sm,
  },
  postAnnBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.card,
  },
  annCard: {
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginHorizontal: Spacing.md,
    marginVertical: Spacing.xs,
    gap: 8,
    ...Shadow.sm,
  },
  annCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  annCardIcon: {
    width: 36,
    height: 36,
    borderRadius: Radius.sm,
    backgroundColor: Colors.accentLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  annCardMeta: { flex: 1 },
  annCardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
  },
  annCardTime: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  annCardBody: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  annCardAdmin: {
    fontSize: 11,
    color: Colors.textMuted,
    fontStyle: 'italic',
  },
  empty: {
    alignItems: 'center',
    paddingVertical: Spacing.xxl,
    gap: 8,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.textMuted,
    fontWeight: '500',
  },
  modalContainer: { flex: 1, backgroundColor: Colors.background },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.text,
  },
  modalClose: {
    width: 36,
    height: 36,
    borderRadius: Radius.sm,
    backgroundColor: Colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalScroll: {
    padding: Spacing.md,
    gap: Spacing.md,
  },
  formGroup: { gap: 6 },
  formLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
  },
  inputBox: {
    backgroundColor: Colors.card,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  textAreaBox: { alignItems: 'flex-start', paddingTop: 12 },
  input: {
    fontSize: 15,
    color: Colors.text,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
    width: '100%',
  },
  postBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    borderRadius: Radius.lg,
    paddingVertical: 16,
    marginTop: 4,
    ...Shadow.md,
  },
  postBtnDisabled: { backgroundColor: Colors.border },
  postBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.card,
  },
});
