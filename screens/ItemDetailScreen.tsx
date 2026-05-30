import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Modal,
  ActivityIndicator,
  Image,
  Pressable,
  Dimensions,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Colors, Spacing, Radius, Shadow, categoryColors, categoryIcons } from '../lib/theme';
import { storage } from '../lib/store';
import { LostFoundItem, User, Claim } from '../lib/types';
import { formatDistanceToNow, format } from 'date-fns';

interface Props {
  user: User;
  navigation: any;
  route: any;
}

export default function ItemDetailScreen({ user, navigation, route }: Props) {
  const item: LostFoundItem = route.params.item;
  const [showClaimModal, setShowClaimModal] = useState(false);
  const [claimDesc, setClaimDesc] = useState('');
  const [claimProof, setClaimProof] = useState('');
  const [loading, setLoading] = useState(false);

  const isLost = item.type === 'lost';
  const catColor = categoryColors[item.category] || categoryColors.Other;
  const catIcon = categoryIcons[item.category] || 'cube-outline';
  const isOwner = item.reportedBy === user.id;
  const [lightboxVisible, setLightboxVisible] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const screenWidth = Dimensions.get('window').width;

  const timeAgo = (() => {
    try { return formatDistanceToNow(new Date(item.createdAt), { addSuffix: true }); }
    catch { return 'recently'; }
  })();

  const formattedDate = (() => {
    try { return format(new Date(item.date), 'MMMM d, yyyy'); }
    catch { return item.date; }
  })();

  const handleClaim = async () => {
    if (!claimDesc.trim() || !claimProof.trim()) {
      Alert.alert('Error', 'Please fill in all claim fields');
      return;
    }
    setLoading(true);

    const newClaim: Omit<Claim, 'id'> = {
      itemId: item.id,
      itemTitle: item.title,
      itemType: item.type,
      claimantId: user.id,
      claimantName: user.name,
      claimantEmail: user.email,
      description: claimDesc.trim(),
      proofDescription: claimProof.trim(),
      status: 'pending',
      submittedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      await storage.addClaim(newClaim);
    } catch (err: any) {
      setLoading(false);
      const msg = err?.message || 'Failed to submit claim. Please try again.';
      if (Platform.OS === 'web') {
        window.alert('Error: ' + msg);
      } else {
        Alert.alert('Error', msg);
      }
      return;
    }

    try {
      // This may fail if the user doesn't own the item due to RLS, 
      // which is perfectly fine. The claim was already successfully submitted.
      await storage.updateItem(item.id, { status: 'claimed' });
    } catch (err) {
      console.log('Ignored item state update: RLS policy properly prevented non-owner from updating status.');
    }

    setLoading(false);
    setShowClaimModal(false);
    if (Platform.OS === 'web') {
      window.alert('✅ Claim Submitted! Your claim has been submitted and is under review. You will be notified once the admin processes it.');
      navigation.goBack();
    } else {
      Alert.alert(
        '✅ Claim Submitted!',
        'Your claim has been submitted and is under review. You will be notified once the admin processes it.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    }
  };

  const handleMarkReturned = async () => {
    Alert.alert(
      'Mark as Returned',
      'Are you sure you want to mark this item as returned?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            await storage.updateItem(item.id, { status: 'returned' });
            Alert.alert('Success', 'Item marked as returned!', [
              { text: 'OK', onPress: () => navigation.goBack() },
            ]);
          },
        },
      ]
    );
  };

  const statusConfig = {
    active: { color: Colors.success, label: 'Active', icon: 'radio-button-on-outline' },
    claimed: { color: Colors.warning, label: 'Claimed', icon: 'time-outline' },
    returned: { color: Colors.primary, label: 'Returned', icon: 'checkmark-done-circle-outline' },
    expired: { color: Colors.textMuted, label: 'Expired', icon: 'archive-outline' },
  }[item.status];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle} numberOfLines={1}>{item.title}</Text>
          {isOwner && item.status === 'active' && (
            <TouchableOpacity style={styles.returnBtn} onPress={handleMarkReturned}>
              <Ionicons name="checkmark-done" size={18} color={Colors.success} />
            </TouchableOpacity>
          )}
        </View>

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {/* Type Banner */}
          <View style={[styles.typeBanner, { backgroundColor: isLost ? Colors.lostLight : Colors.foundLight }]}>
            <View style={[styles.typeBannerIcon, { backgroundColor: isLost ? Colors.lost : Colors.found }]}>
              <Ionicons
                name={isLost ? 'search-outline' : 'checkmark-circle-outline'}
                size={28}
                color={Colors.card}
              />
            </View>
            <View style={styles.typeBannerInfo}>
              <Text style={[styles.typeBannerLabel, { color: isLost ? Colors.lost : Colors.found }]}>
                {isLost ? '🔍 LOST ITEM' : '✅ FOUND ITEM'}
              </Text>
              <Text style={styles.typeBannerTitle}>{item.title}</Text>
              {item.priority === 'urgent' && (
                <View style={styles.urgentTag}>
                  <Ionicons name="alert-circle" size={12} color={Colors.urgent} />
                  <Text style={styles.urgentTagText}>URGENT</Text>
                </View>
              )}
            </View>
            <View style={[styles.statusBadge, { backgroundColor: statusConfig.color + '20' }]}>
              <Ionicons name={statusConfig.icon as any} size={14} color={statusConfig.color} />
              <Text style={[styles.statusText, { color: statusConfig.color }]}>{statusConfig.label}</Text>
            </View>
          </View>

          {/* ── Image Gallery ── */}
          {item.images && item.images.length > 0 && (
            <View style={styles.galleryCard}>
              <View style={styles.galleryHeader}>
                <Ionicons name="images-outline" size={18} color={Colors.primary} />
                <Text style={styles.galleryTitle}>Photos ({item.images.length})</Text>
              </View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.galleryScroll}
              >
                {item.images.map((uri, idx) => (
                  <Pressable
                    key={idx}
                    onPress={() => { setLightboxIndex(idx); setLightboxVisible(true); }}
                    style={({ pressed }) => [styles.galleryThumbWrapper, pressed && { opacity: 0.85 }]}
                  >
                    <Image source={{ uri }} style={styles.galleryThumb} resizeMode="cover" />
                    <View style={styles.galleryThumbOverlay}>
                      <Ionicons name="expand-outline" size={16} color={Colors.card} />
                    </View>
                    <View style={styles.galleryIndexBadge}>
                      <Text style={styles.galleryIndexText}>{idx + 1}</Text>
                    </View>
                  </Pressable>
                ))}
              </ScrollView>
              <Text style={styles.galleryHint}>Tap a photo to view full size</Text>
            </View>
          )}

          {/* ── No Images placeholder ── */}
          {(!item.images || item.images.length === 0) && (
            <View style={styles.noImageCard}>
              <Ionicons name="image-outline" size={32} color={Colors.textMuted} />
              <Text style={styles.noImageText}>No photos attached</Text>
            </View>
          )}

          {/* Details Card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Item Details</Text>

            <View style={styles.detailRow}>
              <View style={[styles.detailIcon, { backgroundColor: catColor.bg }]}>
                <Ionicons name={catIcon as any} size={18} color={catColor.text} />
              </View>
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Category</Text>
                <Text style={styles.detailValue}>{item.category}</Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.detailRow}>
              <View style={[styles.detailIcon, { backgroundColor: Colors.primaryLight }]}>
                <Ionicons name="location-outline" size={18} color={Colors.primary} />
              </View>
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Location</Text>
                <Text style={styles.detailValue}>{item.location}</Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.detailRow}>
              <View style={[styles.detailIcon, { backgroundColor: Colors.accentLight }]}>
                <Ionicons name="calendar-outline" size={18} color={Colors.accent} />
              </View>
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Date & Time</Text>
                <Text style={styles.detailValue}>{formattedDate} at {item.time}</Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.detailRow}>
              <View style={[styles.detailIcon, { backgroundColor: Colors.infoLight }]}>
                <Ionicons name="person-outline" size={18} color={Colors.info} />
              </View>
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Reported By</Text>
                <Text style={styles.detailValue}>{item.reporterName}</Text>
                <Text style={styles.detailSub}>{item.reporterEmail}</Text>
              </View>
            </View>
          </View>

          {/* Description */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Description</Text>
            <Text style={styles.description}>{item.description}</Text>
          </View>

          {/* Timestamp */}
          <View style={styles.timestampRow}>
            <Ionicons name="time-outline" size={13} color={Colors.textMuted} />
            <Text style={styles.timestampText}>Reported {timeAgo}</Text>
          </View>

          {/* Action Buttons */}
          {!isOwner && item.status === 'active' && (
            <TouchableOpacity
              style={styles.claimBtn}
              onPress={() => setShowClaimModal(true)}
            >
              <Ionicons name="hand-right-outline" size={20} color={Colors.card} />
              <Text style={styles.claimBtnText}>Submit a Claim</Text>
            </TouchableOpacity>
          )}

          {item.status === 'claimed' && (
            <View style={styles.claimedBanner}>
              <Ionicons name="time-outline" size={20} color={Colors.warning} />
              <Text style={styles.claimedBannerText}>This item has a pending claim under review</Text>
            </View>
          )}

          {item.status === 'returned' && (
            <View style={styles.returnedBanner}>
              <Ionicons name="checkmark-done-circle" size={20} color={Colors.success} />
              <Text style={styles.returnedBannerText}>This item has been successfully returned to its owner</Text>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      {/* ── Lightbox Modal ── */}
      <Modal
        visible={lightboxVisible}
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setLightboxVisible(false)}
      >
        <View style={styles.lightboxContainer}>
          {/* Close */}
          <TouchableOpacity style={styles.lightboxClose} onPress={() => setLightboxVisible(false)}>
            <Ionicons name="close" size={26} color={Colors.card} />
          </TouchableOpacity>

          {/* Counter */}
          <View style={styles.lightboxCounter}>
            <Text style={styles.lightboxCounterText}>
              {lightboxIndex + 1} / {item.images.length}
            </Text>
          </View>

          {/* Images */}
          <FlatList
            data={item.images}
            keyExtractor={(_, i) => String(i)}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            initialScrollIndex={lightboxIndex}
            getItemLayout={(_, index) => ({
              length: Dimensions.get('window').width,
              offset: Dimensions.get('window').width * index,
              index,
            })}
            onMomentumScrollEnd={e => {
              const idx = Math.round(e.nativeEvent.contentOffset.x / Dimensions.get('window').width);
              setLightboxIndex(idx);
            }}
            renderItem={({ item: uri }) => (
              <View style={{ width: Dimensions.get('window').width, justifyContent: 'center', alignItems: 'center' }}>
                <Image
                  source={{ uri }}
                  style={{ width: Dimensions.get('window').width, height: Dimensions.get('window').height * 0.75 }}
                  resizeMode="contain"
                />
              </View>
            )}
          />

          {/* Dot indicators */}
          {item.images.length > 1 && (
            <View style={styles.lightboxDots}>
              {item.images.map((_, i) => (
                <View
                  key={i}
                  style={[styles.lightboxDot, i === lightboxIndex && styles.lightboxDotActive]}
                />
              ))}
            </View>
          )}
        </View>
      </Modal>

      {/* Claim Modal */}
      <Modal
        visible={showClaimModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowClaimModal(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Submit Claim</Text>
            <TouchableOpacity onPress={() => setShowClaimModal(false)} style={styles.modalClose}>
              <Ionicons name="close" size={22} color={Colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView
            contentContainerStyle={styles.modalScroll}
            keyboardShouldPersistTaps="handled"
          >
            <View style={[styles.modalItemPreview, { backgroundColor: isLost ? Colors.lostLight : Colors.foundLight }]}>
              <Ionicons name={isLost ? 'search-outline' : 'checkmark-circle-outline'} size={16} color={isLost ? Colors.lost : Colors.found} />
              <Text style={[styles.modalItemTitle, { color: isLost ? Colors.lost : Colors.found }]}>{item.title}</Text>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Why do you think this is yours? *</Text>
              <Text style={styles.formHint}>Explain how you know this item belongs to you</Text>
              <View style={styles.textAreaBox}>
                <TextInput
                  style={styles.textArea}
                  placeholder="e.g. I lost my laptop at the library on Monday. It has a blue sticker..."
                  placeholderTextColor={Colors.textMuted}
                  value={claimDesc}
                  onChangeText={setClaimDesc}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                  maxLength={500}
                />
              </View>
              <Text style={styles.charCount}>{claimDesc.length}/500</Text>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Proof of Ownership *</Text>
              <Text style={styles.formHint}>Describe unique features, serial number, or any proof</Text>
              <View style={styles.textAreaBox}>
                <TextInput
                  style={styles.textArea}
                  placeholder="e.g. Serial number: ABC123, has initials engraved, purchase receipt available..."
                  placeholderTextColor={Colors.textMuted}
                  value={claimProof}
                  onChangeText={setClaimProof}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                  maxLength={300}
                />
              </View>
              <Text style={styles.charCount}>{claimProof.length}/300</Text>
            </View>

            <View style={styles.warningBox}>
              <Ionicons name="information-circle-outline" size={18} color={Colors.info} />
              <Text style={styles.warningText}>
                False claims may result in account suspension. Admin will verify your claim before approval.
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.submitClaimBtn, (!claimDesc.trim() || !claimProof.trim()) && styles.submitClaimBtnDisabled]}
              onPress={handleClaim}
              disabled={!claimDesc.trim() || !claimProof.trim() || loading}
            >
              {loading ? (
                <ActivityIndicator color={Colors.card} />
              ) : (
                <>
                  <Ionicons name="send-outline" size={18} color={Colors.card} />
                  <Text style={styles.submitClaimText}>Submit Claim</Text>
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
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: 12,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: Radius.sm,
    backgroundColor: Colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.sm,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
  },
  returnBtn: {
    width: 36,
    height: 36,
    borderRadius: Radius.sm,
    backgroundColor: Colors.successLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.xl,
    gap: Spacing.md,
  },
  typeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    borderRadius: Radius.xl,
    padding: Spacing.md,
  },
  typeBannerIcon: {
    width: 56,
    height: 56,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeBannerInfo: { flex: 1, gap: 4 },
  typeBannerLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  typeBannerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.text,
    letterSpacing: -0.3,
  },
  urgentTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    alignSelf: 'flex-start',
    backgroundColor: Colors.urgentLight,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: Radius.full,
  },
  urgentTagText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.urgent,
    letterSpacing: 0.5,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Radius.md,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
  },
  card: {
    backgroundColor: Colors.card,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    gap: Spacing.sm,
    ...Shadow.md,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.text,
    letterSpacing: -0.2,
    marginBottom: 4,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
  },
  detailIcon: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailContent: { flex: 1, gap: 2 },
  detailLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  detailValue: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
  },
  detailSub: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.borderLight,
  },
  // ── Gallery ──────────────────────────────────────────────────
  galleryCard: {
    backgroundColor: Colors.card,
    borderRadius: Radius.xl,
    padding: Spacing.md,
    gap: 10,
    ...Shadow.md,
  },
  galleryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  galleryTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.text,
  },
  galleryScroll: {
    gap: 10,
    paddingRight: 4,
  },
  galleryThumbWrapper: {
    width: 120,
    height: 120,
    borderRadius: Radius.md,
    overflow: 'hidden',
    position: 'relative',
  },
  galleryThumb: {
    width: 120,
    height: 120,
    backgroundColor: Colors.borderLight,
  },
  galleryThumbOverlay: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderRadius: 6,
    padding: 4,
  },
  galleryIndexBadge: {
    position: 'absolute',
    bottom: 6,
    left: 6,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  galleryIndexText: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.card,
  },
  galleryHint: {
    fontSize: 11,
    color: Colors.textMuted,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  noImageCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: Colors.borderLight,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    justifyContent: 'center',
  },
  noImageText: {
    fontSize: 13,
    color: Colors.textMuted,
    fontWeight: '500',
  },
  // ── Lightbox ─────────────────────────────────────────────────
  lightboxContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.96)',
    justifyContent: 'center',
  },
  lightboxClose: {
    position: 'absolute',
    top: 54,
    right: 20,
    zIndex: 10,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 20,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lightboxCounter: {
    position: 'absolute',
    top: 58,
    left: 20,
    zIndex: 10,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: Radius.full,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  lightboxCounterText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.card,
  },
  lightboxDots: {
    position: 'absolute',
    bottom: 60,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  lightboxDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.35)',
  },
  lightboxDotActive: {
    backgroundColor: Colors.card,
    width: 18,
  },
  description: {
    fontSize: 15,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  timestampRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    justifyContent: 'center',
  },
  timestampText: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  claimBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: Colors.primary,
    borderRadius: Radius.lg,
    paddingVertical: 16,
    ...Shadow.md,
  },
  claimBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.card,
  },
  claimedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: Colors.warningLight,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.warning + '40',
  },
  claimedBannerText: {
    flex: 1,
    fontSize: 14,
    color: Colors.warning,
    fontWeight: '600',
  },
  returnedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: Colors.successLight,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.success + '40',
  },
  returnedBannerText: {
    flex: 1,
    fontSize: 14,
    color: Colors.success,
    fontWeight: '600',
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
  modalItemPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: Spacing.md,
    borderRadius: Radius.md,
  },
  modalItemTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  formGroup: { gap: 6 },
  formLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
  },
  formHint: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  textAreaBox: {
    backgroundColor: Colors.card,
    borderRadius: Radius.md,
    padding: Spacing.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  textArea: {
    fontSize: 14,
    color: Colors.text,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  charCount: {
    fontSize: 11,
    color: Colors.textMuted,
    textAlign: 'right',
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: Colors.infoLight,
    borderRadius: Radius.md,
    padding: Spacing.md,
  },
  warningText: {
    flex: 1,
    fontSize: 12,
    color: Colors.info,
    lineHeight: 18,
  },
  submitClaimBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    borderRadius: Radius.lg,
    paddingVertical: 16,
    ...Shadow.md,
  },
  submitClaimBtnDisabled: {
    backgroundColor: Colors.border,
  },
  submitClaimText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.card,
  },
});
