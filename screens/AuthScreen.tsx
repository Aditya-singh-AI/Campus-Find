import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Colors, Spacing, Radius, Shadow } from '../lib/theme';
import { storage } from '../lib/store';
import { supabase } from '../lib/supabase';
import { MOCK_USERS } from '../lib/data';
import { User, UserRole } from '../lib/types';

interface Props {
  onLogin: (user: User) => void;
}

export default function AuthScreen({ onLogin }: Props) {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [department, setDepartment] = useState('');
  const [studentId, setStudentId] = useState('');
  const [role, setRole] = useState<UserRole>('student');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    setLoading(true);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      Alert.alert('Login Error', error.message);
      setLoading(false);
      return;
    }

    const { data: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.session?.user.id)
      .maybeSingle();
      
    // The user state will be synced in App.tsx via onAuthStateChange
    setLoading(false);
  };

  const handleSignup = async () => {
    if (!name || !email || !password || !department || !studentId) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    setLoading(true);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
          role,
          department,
          studentId,
        },
      },
    });

    if (error) {
      console.error('Supabase Signup Error Details:', error);
      Alert.alert('Signup Error', error.message);
      setLoading(false);
      return;
    }

    if (data.session) {
      // Create user profile
      const newUser: User = {
        id: data.session.user.id,
        name,
        email,
        role,
        department,
        studentId,
        joinedAt: new Date().toISOString().split('T')[0],
      };
      await supabase.from('profiles').insert([newUser]);
    } else {
      Alert.alert(
        'Success', 
        'Check your email for the confirmation link.',
        [{ text: 'OK', onPress: () => setMode('login') }]
      );
    }

    setLoading(false);
  };

  const quickLogin = async (userRole: 'student' | 'admin') => {
    if (userRole === 'admin') {
      setEmail('aditya.asb24@gmail.com');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <View style={styles.logoOuter}>
                <View style={styles.logoInner}>
                  <Ionicons name="search" size={32} color={Colors.card} />
                </View>
              </View>
            </View>
            <Text style={styles.appName}>Campus Find</Text>
            <Text style={styles.tagline}>University Lost & Found Platform</Text>
          </View>

          {/* Card */}
          <View style={styles.card}>
            {/* Tabs */}
            <View style={styles.tabs}>
              <TouchableOpacity
                style={[styles.tab, mode === 'login' && styles.tabActive]}
                onPress={() => setMode('login')}
              >
                <Text style={[styles.tabText, mode === 'login' && styles.tabTextActive]}>Sign In</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tab, mode === 'signup' && styles.tabActive]}
                onPress={() => setMode('signup')}
              >
                <Text style={[styles.tabText, mode === 'signup' && styles.tabTextActive]}>Register</Text>
              </TouchableOpacity>
            </View>

            {/* Form */}
            <View style={styles.form}>
              {mode === 'signup' && (
                <>
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Full Name</Text>
                    <View style={styles.inputBox}>
                      <Ionicons name="person-outline" size={18} color={Colors.textMuted} />
                      <TextInput
                        style={styles.input}
                        placeholder="Your full name"
                        placeholderTextColor={Colors.textMuted}
                        value={name}
                        onChangeText={setName}
                        autoCapitalize="words"
                      />
                    </View>
                  </View>
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Department</Text>
                    <View style={styles.inputBox}>
                      <Ionicons name="school-outline" size={18} color={Colors.textMuted} />
                      <TextInput
                        style={styles.input}
                        placeholder="e.g. Computer Science"
                        placeholderTextColor={Colors.textMuted}
                        value={department}
                        onChangeText={setDepartment}
                        autoCapitalize="words"
                      />
                    </View>
                  </View>
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Student/Staff ID</Text>
                    <View style={styles.inputBox}>
                      <Ionicons name="card-outline" size={18} color={Colors.textMuted} />
                      <TextInput
                        style={styles.input}
                        placeholder="e.g. CS2021001"
                        placeholderTextColor={Colors.textMuted}
                        value={studentId}
                        onChangeText={setStudentId}
                        autoCapitalize="characters"
                      />
                    </View>
                  </View>
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Role</Text>
                    <View style={styles.roleRow}>
                      {(['student', 'staff'] as UserRole[]).map(r => (
                        <TouchableOpacity
                          key={r}
                          style={[styles.roleBtn, role === r && styles.roleBtnActive]}
                          onPress={() => setRole(r)}
                        >
                          <Ionicons
                            name={r === 'student' ? 'school-outline' : 'briefcase-outline'}
                            size={16}
                            color={role === r ? Colors.card : Colors.textSecondary}
                          />
                          <Text style={[styles.roleBtnText, role === r && styles.roleBtnTextActive]}>
                            {r.charAt(0).toUpperCase() + r.slice(1)}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                </>
              )}

              <View style={styles.inputGroup}>
                <Text style={styles.label}>University Email</Text>
                <View style={styles.inputBox}>
                  <Ionicons name="mail-outline" size={18} color={Colors.textMuted} />
                  <TextInput
                    style={styles.input}
                    placeholder="your.name@university.edu"
                    placeholderTextColor={Colors.textMuted}
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Password</Text>
                <View style={styles.inputBox}>
                  <Ionicons name="lock-closed-outline" size={18} color={Colors.textMuted} />
                  <TextInput
                    style={styles.input}
                    placeholder="Enter your password"
                    placeholderTextColor={Colors.textMuted}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                  />
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                    <Ionicons
                      name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                      size={18}
                      color={Colors.textMuted}
                    />
                  </TouchableOpacity>
                </View>
              </View>

              <TouchableOpacity
                style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
                onPress={mode === 'login' ? handleLogin : handleSignup}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color={Colors.card} />
                ) : (
                  <>
                    <Ionicons
                      name={mode === 'login' ? 'log-in-outline' : 'person-add-outline'}
                      size={20}
                      color={Colors.card}
                    />
                    <Text style={styles.submitText}>
                      {mode === 'login' ? 'Sign In' : 'Create Account'}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>



          <Text style={styles.footer}>Campus Find v1.0 • Secure University Platform</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  flex: { flex: 1 },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.xl,
  },
  header: {
    alignItems: 'center',
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.lg,
  },
  logoContainer: {
    marginBottom: Spacing.md,
  },
  logoOuter: {
    width: 88,
    height: 88,
    borderRadius: 28,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.lg,
  },
  logoInner: {
    width: 68,
    height: 68,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  appName: {
    fontSize: 34,
    fontWeight: '900',
    color: Colors.text,
    letterSpacing: -1,
  },
  tagline: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 4,
    fontWeight: '500',
  },
  card: {
    backgroundColor: Colors.card,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    ...Shadow.lg,
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: Colors.borderLight,
    borderRadius: Radius.md,
    padding: 4,
    marginBottom: Spacing.lg,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: Radius.sm,
  },
  tabActive: {
    backgroundColor: Colors.card,
    ...Shadow.sm,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textMuted,
  },
  tabTextActive: {
    color: Colors.text,
  },
  form: { gap: 14 },
  inputGroup: { gap: 6 },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text,
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: Colors.background,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: Colors.text,
  },
  roleRow: {
    flexDirection: 'row',
    gap: 10,
  },
  roleBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.background,
  },
  roleBtnActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  roleBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  roleBtnTextActive: {
    color: Colors.card,
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    borderRadius: Radius.md,
    paddingVertical: 14,
    marginTop: 4,
    ...Shadow.md,
  },
  submitBtnDisabled: {
    opacity: 0.7,
  },
  submitText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.card,
  },
  quickSection: {
    marginTop: Spacing.lg,
    gap: 10,
  },
  quickTitle: {
    fontSize: 13,
    color: Colors.textMuted,
    fontWeight: '600',
    textAlign: 'center',
  },
  quickRow: {
    flexDirection: 'row',
    gap: 10,
  },
  quickBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: Radius.md,
    backgroundColor: Colors.primaryLight,
    borderWidth: 1,
    borderColor: Colors.primary + '30',
  },
  quickBtnAdmin: {
    backgroundColor: Colors.secondaryLight,
    borderColor: Colors.secondary + '30',
  },
  quickBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
  },
  footer: {
    textAlign: 'center',
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: Spacing.lg,
  },
});
