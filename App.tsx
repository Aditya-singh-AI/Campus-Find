import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet, Platform, LogBox } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import Ionicons from '@expo/vector-icons/Ionicons';

// Suppress known harmless react-native-web warnings
if (Platform.OS === 'web') {
  LogBox.ignoreLogs([
    'Cannot record touch end without a touch start',
    'shadow* style props are deprecated',
    'props.pointerEvents is deprecated',
  ]);
  const originalWarn = console.warn.bind(console);
  console.warn = (...args: any[]) => {
    if (typeof args[0] === 'string' && args[0].includes('shadow*')) return;
    originalWarn(...args);
  };
}

import { Colors } from './lib/theme';
import { storage } from './lib/store';
import { supabase } from './lib/supabase';
import { User } from './lib/types';

import AuthScreen from './screens/AuthScreen';
import HomeScreen from './screens/HomeScreen';
import SearchScreen from './screens/SearchScreen';
import ReportScreen from './screens/ReportScreen';
import ClaimsScreen from './screens/ClaimsScreen';
import ProfileScreen from './screens/ProfileScreen';
import ItemDetailScreen from './screens/ItemDetailScreen';
import NotificationsScreen from './screens/NotificationsScreen';
import AnnouncementsScreen from './screens/AnnouncementsScreen';
import AdminScreen from './screens/AdminScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Bottom Tab Navigator for regular users
function UserTabs({ user, onLogout, navigation }: { user: User; onLogout: () => void; navigation?: any }) {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: Colors.tabBar,
          borderTopColor: Colors.border,
          borderTopWidth: 1,
          height: 60,
          paddingBottom: 8,
          paddingTop: 4,
        },
        tabBarActiveTintColor: Colors.tabBarActive,
        tabBarInactiveTintColor: Colors.tabBarInactive,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
        tabBarIcon: ({ focused, color, size }) => {
          const icons: Record<string, [string, string]> = {
            Home: ['home', 'home-outline'],
            Search: ['search', 'search-outline'],
            Report: ['add-circle', 'add-circle-outline'],
            Claims: ['document-text', 'document-text-outline'],
            Profile: ['person', 'person-outline'],
          };
          const [activeIcon, inactiveIcon] = icons[route.name] || ['ellipse', 'ellipse-outline'];
          return <Ionicons name={(focused ? activeIcon : inactiveIcon) as any} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home">
        {(props) => <HomeScreen {...props} user={user} />}
      </Tab.Screen>
      <Tab.Screen name="Search">
        {(props) => <SearchScreen {...props} user={user} />}
      </Tab.Screen>
      <Tab.Screen
        name="Report"
        options={{
          tabBarLabel: 'Report',
          tabBarIcon: ({ focused, color }) => (
            <View style={[styles.reportTabIcon, { backgroundColor: Colors.primary }]}>
              <Ionicons name="add" size={24} color={Colors.card} />
            </View>
          ),
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: '700',
            color: Colors.primary,
          },
        }}
      >
        {(props) => <ReportScreen {...props} user={user} />}
      </Tab.Screen>
      <Tab.Screen name="Claims">
        {(props) => <ClaimsScreen {...props} user={user} />}
      </Tab.Screen>
      <Tab.Screen name="Profile">
        {(props) => <ProfileScreen {...props} user={user} onLogout={onLogout} />}
      </Tab.Screen>
    </Tab.Navigator>
  );
}

// Main App Stack
function AppNavigator({ user, onLogout }: { user: User; onLogout: () => void }) {
  if (user.role === 'admin') {
    return (
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Admin">
          {(props) => <AdminScreen {...props} user={user} onLogout={onLogout} />}
        </Stack.Screen>
        <Stack.Screen name="ItemDetail">
          {(props) => <ItemDetailScreen {...props} user={user} />}
        </Stack.Screen>
        <Stack.Screen name="Notifications">
          {(props) => <NotificationsScreen {...props} user={user} />}
        </Stack.Screen>
        <Stack.Screen name="Announcements">
          {(props) => <AnnouncementsScreen {...props} user={user} />}
        </Stack.Screen>
        <Stack.Screen name="Report">
          {(props) => <ReportScreen {...props} user={user} />}
        </Stack.Screen>
      </Stack.Navigator>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="UserTabs">
        {(props) => <UserTabs {...props} user={user} onLogout={onLogout} />}
      </Stack.Screen>
      <Stack.Screen
        name="ItemDetail"
        options={{ presentation: 'card' }}
      >
        {(props) => <ItemDetailScreen {...props} user={user} />}
      </Stack.Screen>
      <Stack.Screen
        name="Notifications"
        options={{ presentation: 'card' }}
      >
        {(props) => <NotificationsScreen {...props} user={user} />}
      </Stack.Screen>
      <Stack.Screen
        name="Announcements"
        options={{ presentation: 'card' }}
      >
        {(props) => <AnnouncementsScreen {...props} user={user} />}
      </Stack.Screen>
      <Stack.Screen
        name="Report"
        options={{ presentation: 'card' }}
      >
        {(props) => <ReportScreen {...props} user={user} />}
      </Stack.Screen>
    </Stack.Navigator>
  );
}

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [fontsReady, setFontsReady] = useState(false);

  const [fontsLoaded] = useFonts({
    ...Ionicons.font,
  });

  // Allow app to proceed even if fonts fail to load (common on other devices)
  useEffect(() => {
    if (fontsLoaded) {
      setFontsReady(true);
    }
  }, [fontsLoaded]);

  useEffect(() => {
    // Force-unblock after 3 seconds regardless of font loading status
    const fontTimeout = setTimeout(() => setFontsReady(true), 3000);
    return () => clearTimeout(fontTimeout);
  }, []);

  useEffect(() => {
    // Safety net: never stay stuck on loading screen for more than 5 seconds
    const safetyTimeout = setTimeout(() => setLoading(false), 5000);

    const initSession = async () => {
      try {
        // Race getSession against a 4s timeout so bad network / invalid key
        // doesn't leave the app stuck on the loading screen forever.
        const sessionTimeout = new Promise<{ data: { session: null } }>(
          (resolve) => setTimeout(() => resolve({ data: { session: null } }), 4000)
        );
        const { data: { session } } = await Promise.race([
          supabase.auth.getSession(),
          sessionTimeout,
        ]);
        if (session) {
          try {
            const u = await storage.getUser();
            setUser(u);
          } catch {
            // Build a minimal user from session if profile fetch fails
            setUser({
              id: session.user.id,
              name: session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'User',
              email: session.user.email || '',
              role: session.user.user_metadata?.role || 'student',
              department: session.user.user_metadata?.department || 'General',
              studentId: session.user.user_metadata?.studentId || '',
              joinedAt: new Date().toISOString().split('T')[0],
            });
          }
        } else {
          setUser(null);
        }
      } catch (e) {
        console.error('Session init error:', e);
        setUser(null);
      } finally {
        clearTimeout(safetyTimeout);
        setLoading(false);
      }
    };

    initSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (session) {
          try {
            const u = await storage.getUser();
            setUser(u);
          } catch {
            setUser({
              id: session.user.id,
              name: session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'User',
              email: session.user.email || '',
              role: session.user.user_metadata?.role || 'student',
              department: session.user.user_metadata?.department || 'General',
              studentId: session.user.user_metadata?.studentId || '',
              joinedAt: new Date().toISOString().split('T')[0],
            });
          }
        } else {
          setUser(null);
        }
        setLoading(false);
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  if (!fontsReady || loading) {
    return (
      <View style={styles.splash}>
        <View style={styles.splashLogo}>
          <Ionicons name="search" size={36} color={Colors.card} />
        </View>
        <ActivityIndicator color={Colors.primary} style={{ marginTop: 24 }} />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <StatusBar style="dark" />
        <NavigationContainer>
          {user ? (
            <AppNavigator
              user={user}
              onLogout={async () => {
                await supabase.auth.signOut();
                setUser(null);
              }}
            />
          ) : (
            <Stack.Navigator screenOptions={{ headerShown: false }}>
              <Stack.Screen name="Auth">
                {(props) => <AuthScreen {...props} onLogin={setUser} />}
              </Stack.Screen>
            </Stack.Navigator>
          )}
        </NavigationContainer>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  splash: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  splashLogo: {
    width: 88,
    height: 88,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reportTabIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
});
