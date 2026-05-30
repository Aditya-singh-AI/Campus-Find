import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  Image,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import * as ImagePicker from 'expo-image-picker';
import { Colors, Spacing, Radius, Shadow, categoryIcons, categoryColors } from '../lib/theme';
import { storage } from '../lib/store';
import { LostFoundItem, ItemCategory, ItemType, Priority, User } from '../lib/types';

const CATEGORIES: ItemCategory[] = [
  'Electronics', 'Documents', 'Clothing', 'Accessories',
  'Books', 'Keys', 'Bags', 'Sports', 'Other',
];

const LOCATIONS = [
  'Main Library', 'University Cafeteria', 'Science Building',
  'Engineering Building', 'Student Parking Lot', 'University Gym',
  'Admin Block', 'Math Department', 'Arts Building', 'Medical Center',
  'Sports Complex', 'Student Union', 'Campus Entrance', 'Other',
];

const MAX_IMAGES = 4;

interface Props {
  user: User;
  navigation: any;
  route: any;
}

export default function ReportScreen({ user, navigation, route }: Props) {
  const defaultType: ItemType = route?.params?.type || 'lost';
  const [type, setType] = useState<ItemType>(defaultType);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<ItemCategory | ''>('');
  const [location, setLocation] = useState('');
  const [customLocation, setCustomLocation] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState(
    new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
  );
  const [priority, setPriority] = useState<Priority>('normal');
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);

  const isStep1Valid = type && title.trim() && category;
  const isStep2Valid = location && description.trim();

  // ─── Image Picker ──────────────────────────────────────────────
  const requestPermission = async (source: 'camera' | 'library') => {
    if (source === 'camera') {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      return status === 'granted';
    } else {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      return status === 'granted';
    }
  };

  const pickFromLibrary = async () => {
    if (images.length >= MAX_IMAGES) {
      Alert.alert('Limit Reached', `You can add up to ${MAX_IMAGES} images.`);
      return;
    }
    const granted = await requestPermission('library');
    if (!granted) {
      Alert.alert('Permission Required', 'Please allow access to your photo library in Settings.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      selectionLimit: MAX_IMAGES - images.length,
      quality: 0.75,
      base64: false,
    });
    if (!result.canceled) {
      const uris = result.assets.map(a => a.uri);
      setImages(prev => [...prev, ...uris].slice(0, MAX_IMAGES));
    }
  };

  const pickFromCamera = async () => {
    if (images.length >= MAX_IMAGES) {
      Alert.alert('Limit Reached', `You can add up to ${MAX_IMAGES} images.`);
      return;
    }
    const granted = await requestPermission('camera');
    if (!granted) {
      Alert.alert('Permission Required', 'Please allow camera access in Settings.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      quality: 0.75,
      base64: false,
    });
    if (!result.canceled) {
      setImages(prev => [...prev, result.assets[0].uri].slice(0, MAX_IMAGES));
    }
  };

  const showImageOptions = () => {
    Alert.alert('Add Photo', 'Choose a source', [
      { text: 'Camera', onPress: pickFromCamera },
      { text: 'Photo Library', onPress: pickFromLibrary },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const removeImage = (idx: number) => {
    setImages(prev => prev.filter((_, i) => i !== idx));
  };

  // ─── Submit ────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!title || !description || !category || !location) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }
    setLoading(true);
    await new Promise(r => setTimeout(r, 1000));

    const finalLocation = location === 'Other' ? customLocation || location : location;

    const newItem: Omit<LostFoundItem, 'id'> = {
      type,
      title: title.trim(),
      description: description.trim(),
      category: category as ItemCategory,
      date,
      time,
      location: finalLocation,
      images,
      priority,
      status: 'active',
      reportedBy: user.id,
      reporterName: user.name,
      reporterEmail: user.email,
      createdAt: new Date().toISOString(),
    };

    await storage.addItem(newItem);
    setLoading(false);

    Alert.alert(
      '✅ Report Submitted!',
      `Your ${type} item report has been submitted successfully. We'll notify you if a match is found.`,
      [{ text: 'OK', onPress: () => navigation.goBack() }]
    );
  };

  // ─── Step 1 ────────────────────────────────────────────────────
  const renderStep1 = () => (
    <View style={styles.stepContent}>
      {/* Type Toggle */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Report Type *</Text>
        <View style={styles.typeToggle}>
          <TouchableOpacity
            style={[styles.typeBtn, type === 'lost' && styles.typeBtnLost]}
            onPress={() => setType('lost')}
          >
            <Ionicons name="search-outline" size={20} color={type === 'lost' ? Colors.card : Colors.textSecondary} />
            <Text style={[styles.typeBtnText, type === 'lost' && styles.typeBtnTextActive]}>
              I Lost Something
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.typeBtn, type === 'found' && styles.typeBtnFound]}
            onPress={() => setType('found')}
          >
            <Ionicons name="checkmark-circle-outline" size={20} color={type === 'found' ? Colors.card : Colors.textSecondary} />
            <Text style={[styles.typeBtnText, type === 'found' && styles.typeBtnTextActive]}>
              I Found Something
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Title */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Item Title *</Text>
        <View style={styles.inputBox}>
          <Ionicons name="create-outline" size={18} color={Colors.textMuted} />
          <TextInput
            style={styles.input}
            placeholder="e.g. Black MacBook Pro"
            placeholderTextColor={Colors.textMuted}
            value={title}
            onChangeText={setTitle}
            maxLength={80}
          />
        </View>
        <Text style={styles.charCount}>{title.length}/80</Text>
      </View>

      {/* Category */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Category *</Text>
        <View style={styles.categoryGrid}>
          {CATEGORIES.map(cat => {
            const catColor = categoryColors[cat];
            const isSelected = category === cat;
            return (
              <TouchableOpacity
                key={cat}
                style={[
                  styles.categoryBtn,
                  isSelected && { backgroundColor: catColor.bg, borderColor: catColor.text + '60' },
                ]}
                onPress={() => setCategory(cat)}
              >
                <Ionicons
                  name={categoryIcons[cat] as any}
                  size={18}
                  color={isSelected ? catColor.text : Colors.textMuted}
                />
                <Text style={[styles.categoryBtnText, isSelected && { color: catColor.text, fontWeight: '700' }]}>
                  {cat}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Priority */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Priority</Text>
        <View style={styles.priorityRow}>
          <TouchableOpacity
            style={[styles.priorityBtn, priority === 'normal' && styles.priorityBtnNormal]}
            onPress={() => setPriority('normal')}
          >
            <Ionicons name="flag-outline" size={16} color={priority === 'normal' ? Colors.card : Colors.textSecondary} />
            <Text style={[styles.priorityText, priority === 'normal' && styles.priorityTextActive]}>Normal</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.priorityBtn, priority === 'urgent' && styles.priorityBtnUrgent]}
            onPress={() => setPriority('urgent')}
          >
            <Ionicons name="alert-circle-outline" size={16} color={priority === 'urgent' ? Colors.card : Colors.textSecondary} />
            <Text style={[styles.priorityText, priority === 'urgent' && styles.priorityTextActive]}>Urgent</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  // ─── Step 2 ────────────────────────────────────────────────────
  const renderStep2 = () => (
    <View style={styles.stepContent}>
      {/* Description */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Description *</Text>
        <Text style={styles.sectionHint}>Be specific – include color, brand, size, unique features</Text>
        <View style={[styles.inputBox, styles.textAreaBox]}>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Describe the item in detail..."
            placeholderTextColor={Colors.textMuted}
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={5}
            textAlignVertical="top"
            maxLength={500}
          />
        </View>
        <Text style={styles.charCount}>{description.length}/500</Text>
      </View>

      {/* ── Image Upload ── */}
      <View style={styles.section}>
        <View style={styles.sectionRow}>
          <View>
            <Text style={styles.sectionLabel}>Photos</Text>
            <Text style={styles.sectionHint}>Add up to {MAX_IMAGES} photos to help identify the item</Text>
          </View>
          <View style={styles.imageCountBadge}>
            <Text style={styles.imageCountText}>{images.length}/{MAX_IMAGES}</Text>
          </View>
        </View>

        {/* Image grid */}
        <View style={styles.imageGrid}>
          {images.map((uri, idx) => (
            <View key={idx} style={styles.imageThumbWrapper}>
              <Image source={{ uri }} style={styles.imageThumb} resizeMode="cover" />
              {/* Remove button */}
              <Pressable style={styles.removeImageBtn} onPress={() => removeImage(idx)}>
                <Ionicons name="close-circle" size={22} color={Colors.danger} />
              </Pressable>
              {/* Index badge */}
              <View style={styles.imageIndexBadge}>
                <Text style={styles.imageIndexText}>{idx + 1}</Text>
              </View>
            </View>
          ))}

          {/* Add button */}
          {images.length < MAX_IMAGES && (
            <TouchableOpacity style={styles.addImageBtn} onPress={showImageOptions} activeOpacity={0.7}>
              <View style={styles.addImageInner}>
                <Ionicons name="camera-outline" size={28} color={Colors.primary} />
                <Text style={styles.addImageText}>Add Photo</Text>
                <Text style={styles.addImageSub}>Camera or Library</Text>
              </View>
            </TouchableOpacity>
          )}
        </View>

        {/* Tips */}
        {images.length === 0 && (
          <View style={styles.photoTips}>
            <Ionicons name="bulb-outline" size={14} color={Colors.accent} />
            <Text style={styles.photoTipsText}>
              Clear photos greatly improve the chance of your item being recognised
            </Text>
          </View>
        )}

        {/* Source quick buttons */}
        {images.length < MAX_IMAGES && (
          <View style={styles.sourceRow}>
            <TouchableOpacity style={styles.sourceBtn} onPress={pickFromCamera}>
              <Ionicons name="camera-outline" size={16} color={Colors.primary} />
              <Text style={styles.sourceBtnText}>Camera</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.sourceBtn} onPress={pickFromLibrary}>
              <Ionicons name="images-outline" size={16} color={Colors.primary} />
              <Text style={styles.sourceBtnText}>Gallery</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Location */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Location *</Text>
        <Text style={styles.sectionHint}>Where was the item {type === 'lost' ? 'lost' : 'found'}?</Text>
        <View style={styles.locationGrid}>
          {LOCATIONS.map(loc => (
            <TouchableOpacity
              key={loc}
              style={[styles.locationBtn, location === loc && styles.locationBtnActive]}
              onPress={() => setLocation(loc)}
            >
              <Ionicons
                name="location-outline"
                size={12}
                color={location === loc ? Colors.card : Colors.textMuted}
              />
              <Text style={[styles.locationBtnText, location === loc && styles.locationBtnTextActive]}>
                {loc}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        {location === 'Other' && (
          <View style={[styles.inputBox, { marginTop: 8 }]}>
            <Ionicons name="location-outline" size={18} color={Colors.textMuted} />
            <TextInput
              style={styles.input}
              placeholder="Specify location..."
              placeholderTextColor={Colors.textMuted}
              value={customLocation}
              onChangeText={setCustomLocation}
            />
          </View>
        )}
      </View>

      {/* Date & Time */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Date & Time</Text>
        <View style={styles.dateTimeRow}>
          <View style={[styles.inputBox, styles.flex]}>
            <Ionicons name="calendar-outline" size={18} color={Colors.textMuted} />
            <TextInput
              style={styles.input}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={Colors.textMuted}
              value={date}
              onChangeText={setDate}
              keyboardType="numeric"
            />
          </View>
          <View style={[styles.inputBox, styles.flex]}>
            <Ionicons name="time-outline" size={18} color={Colors.textMuted} />
            <TextInput
              style={styles.input}
              placeholder="HH:MM"
              placeholderTextColor={Colors.textMuted}
              value={time}
              onChangeText={setTime}
              keyboardType="numeric"
            />
          </View>
        </View>
      </View>
    </View>
  );

  // ─── Render ────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Report Item</Text>
          <View style={styles.stepIndicator}>
            <Text style={styles.stepText}>{step}/2</Text>
          </View>
        </View>

        {/* Progress bar */}
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: step === 1 ? '50%' : '100%' }]} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Step Labels */}
          <View style={styles.stepLabels}>
            <View style={styles.stepLabel}>
              <View style={[styles.stepDot, step >= 1 && styles.stepDotActive]}>
                {step > 1
                  ? <Ionicons name="checkmark" size={14} color={Colors.card} />
                  : <Text style={[styles.stepDotText, step >= 1 && styles.stepDotTextActive]}>1</Text>
                }
              </View>
              <Text style={[styles.stepLabelText, step === 1 && styles.stepLabelTextActive]}>Item Details</Text>
            </View>
            <View style={styles.stepConnector} />
            <View style={styles.stepLabel}>
              <View style={[styles.stepDot, step >= 2 && styles.stepDotActive]}>
                <Text style={[styles.stepDotText, step >= 2 && styles.stepDotTextActive]}>2</Text>
              </View>
              <Text style={[styles.stepLabelText, step === 2 && styles.stepLabelTextActive]}>Photos & Location</Text>
            </View>
          </View>

          {step === 1 ? renderStep1() : renderStep2()}

          {/* Navigation Buttons */}
          <View style={styles.navButtons}>
            {step === 2 && (
              <TouchableOpacity style={styles.backNavBtn} onPress={() => setStep(1)}>
                <Ionicons name="arrow-back" size={18} color={Colors.text} />
                <Text style={styles.backNavText}>Back</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[
                styles.nextBtn,
                !(step === 1 ? isStep1Valid : isStep2Valid) && styles.nextBtnDisabled,
              ]}
              onPress={() => {
                if (step === 1 && isStep1Valid) setStep(2);
                else if (step === 2 && isStep2Valid) handleSubmit();
              }}
              disabled={!(step === 1 ? isStep1Valid : isStep2Valid) || loading}
            >
              {loading ? (
                <ActivityIndicator color={Colors.card} />
              ) : (
                <>
                  <Text style={styles.nextBtnText}>
                    {step === 1 ? 'Continue' : 'Submit Report'}
                  </Text>
                  <Ionicons
                    name={step === 1 ? 'arrow-forward' : 'checkmark-circle'}
                    size={18}
                    color={Colors.card}
                  />
                </>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const THUMB_SIZE = 96;

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
    fontSize: 20,
    fontWeight: '800',
    color: Colors.text,
    letterSpacing: -0.3,
  },
  stepIndicator: {
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  stepText: { fontSize: 12, fontWeight: '700', color: Colors.primary },
  progressBar: {
    height: 3,
    backgroundColor: Colors.border,
    marginHorizontal: Spacing.md,
    borderRadius: 2,
    marginBottom: Spacing.sm,
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 2,
  },
  scroll: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.xl,
    gap: Spacing.md,
  },
  stepLabels: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  stepLabel: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  stepDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.border,
  },
  stepDotActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  stepDotText: { fontSize: 12, fontWeight: '700', color: Colors.textMuted },
  stepDotTextActive: { color: Colors.card },
  stepLabelText: { fontSize: 13, color: Colors.textMuted, fontWeight: '500' },
  stepLabelTextActive: { color: Colors.text, fontWeight: '700' },
  stepConnector: { flex: 1, height: 1, backgroundColor: Colors.border, marginHorizontal: 8 },
  stepContent: { gap: Spacing.md },
  section: { gap: 8 },
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  sectionLabel: { fontSize: 14, fontWeight: '700', color: Colors.text },
  sectionHint: { fontSize: 12, color: Colors.textMuted, marginTop: -4 },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: Colors.card,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  textAreaBox: { alignItems: 'flex-start', paddingTop: 12 },
  input: { flex: 1, fontSize: 15, color: Colors.text },
  textArea: { minHeight: 100, textAlignVertical: 'top' },
  charCount: { fontSize: 11, color: Colors.textMuted, textAlign: 'right' },

  // ── Image picker ──────────────────────────────────────────────
  imageCountBadge: {
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: Radius.full,
    alignSelf: 'flex-start',
    marginTop: 2,
  },
  imageCountText: { fontSize: 12, fontWeight: '700', color: Colors.primary },

  imageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  imageThumbWrapper: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: Radius.md,
    overflow: 'visible',
    position: 'relative',
  },
  imageThumb: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: Radius.md,
    backgroundColor: Colors.borderLight,
  },
  removeImageBtn: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: Colors.card,
    borderRadius: 11,
    zIndex: 10,
  },
  imageIndexBadge: {
    position: 'absolute',
    bottom: 5,
    left: 5,
    backgroundColor: 'rgba(0,0,0,0.55)',
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageIndexText: { fontSize: 10, fontWeight: '800', color: Colors.card },

  addImageBtn: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: Radius.md,
    borderWidth: 2,
    borderColor: Colors.primary + '50',
    borderStyle: 'dashed',
    backgroundColor: Colors.primaryLight,
    overflow: 'hidden',
  },
  addImageInner: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  addImageText: { fontSize: 11, fontWeight: '700', color: Colors.primary },
  addImageSub: { fontSize: 9, color: Colors.primary + 'AA' },

  photoTips: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    backgroundColor: Colors.accentLight,
    borderRadius: Radius.sm,
    padding: 10,
    borderWidth: 1,
    borderColor: Colors.accent + '30',
  },
  photoTipsText: {
    flex: 1,
    fontSize: 12,
    color: Colors.accent,
    lineHeight: 17,
    fontWeight: '500',
  },

  sourceRow: {
    flexDirection: 'row',
    gap: 10,
  },
  sourceBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: Radius.md,
    backgroundColor: Colors.card,
    borderWidth: 1.5,
    borderColor: Colors.primary + '40',
  },
  sourceBtnText: { fontSize: 13, fontWeight: '700', color: Colors.primary },

  // ── Location ──────────────────────────────────────────────────
  locationGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  locationBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: Radius.full,
    backgroundColor: Colors.card,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  locationBtnActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  locationBtnText: { fontSize: 12, color: Colors.textMuted, fontWeight: '500' },
  locationBtnTextActive: { color: Colors.card, fontWeight: '700' },

  dateTimeRow: { flexDirection: 'row', gap: 10 },

  // ── Type / Category / Priority ────────────────────────────────
  typeToggle: { flexDirection: 'row', gap: 10 },
  typeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: Radius.md,
    backgroundColor: Colors.card,
    borderWidth: 2,
    borderColor: Colors.border,
  },
  typeBtnLost: { backgroundColor: Colors.lost, borderColor: Colors.lost },
  typeBtnFound: { backgroundColor: Colors.found, borderColor: Colors.found },
  typeBtnText: { fontSize: 14, fontWeight: '700', color: Colors.textSecondary },
  typeBtnTextActive: { color: Colors.card },
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  categoryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Radius.md,
    backgroundColor: Colors.card,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  categoryBtnText: { fontSize: 13, color: Colors.textMuted, fontWeight: '500' },
  priorityRow: { flexDirection: 'row', gap: 10 },
  priorityBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: Radius.md,
    backgroundColor: Colors.card,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  priorityBtnNormal: { backgroundColor: Colors.textSecondary, borderColor: Colors.textSecondary },
  priorityBtnUrgent: { backgroundColor: Colors.urgent, borderColor: Colors.urgent },
  priorityText: { fontSize: 14, fontWeight: '600', color: Colors.textSecondary },
  priorityTextActive: { color: Colors.card },

  // ── Nav buttons ───────────────────────────────────────────────
  navButtons: { flexDirection: 'row', gap: 10, marginTop: Spacing.sm },
  backNavBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: Spacing.lg,
    paddingVertical: 14,
    borderRadius: Radius.md,
    backgroundColor: Colors.card,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  backNavText: { fontSize: 15, fontWeight: '600', color: Colors.text },
  nextBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: Radius.md,
    backgroundColor: Colors.primary,
    ...Shadow.md,
  },
  nextBtnDisabled: { backgroundColor: Colors.border },
  nextBtnText: { fontSize: 16, fontWeight: '700', color: Colors.card },
});
