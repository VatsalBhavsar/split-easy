import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, View, Text, StyleSheet } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';

SplashScreen.preventAutoHideAsync();
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { onAuthStateChanged, User } from 'firebase/auth';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Linking from 'expo-linking';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth } from './src/firebase';
import AuthScreen from './src/screens/Auth/AuthScreen';
import HomeScreen from './src/screens/Home/HomeScreen';
import GroupsStack from './src/screens/Groups/GroupsStack';
import JoinGroupScreen from './src/screens/Groups/JoinGroupScreen';
import Screen from './src/ui/Screen';
import { ThemeProvider, useAppTheme } from './src/theme';
import { globalStyles } from './src/styles/globalStyles';
import { ensureUserProfile } from './src/services/userService';
import { joinGroupByInviteCode } from './src/services/groupService';
import { parseInviteCode } from './src/utils/inviteLink';
import ProfileScreen from './src/screens/Profile/ProfileScreen';
import NotificationsScreen from './src/screens/Notifications/NotificationsScreen';
import { Group } from './src/types/group';

const PENDING_INVITE_KEY = 'pendingInviteCode';
const PENDING_INVITE_AUTOJOIN_KEY = 'pendingInviteAutoJoin';

type RouteKey = 'home' | 'groups' | 'profile';

const ROUTES = [
  {
    key: 'home' as RouteKey, title: 'Home',
    icon: 'home-outline' as const, iconActive: 'home' as const,
  },
  {
    key: 'groups' as RouteKey, title: 'Groups',
    icon: 'account-group-outline' as const, iconActive: 'account-group' as const,
  },
  {
    key: 'profile' as RouteKey, title: 'Profile',
    icon: 'account-circle-outline' as const, iconActive: 'account-circle' as const,
  },
];

function BottomTabBar({ index, onPress }: { index: number; onPress: (i: number) => void }) {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.tabBar,
        {
          backgroundColor: theme.tabBarBg,
          borderTopColor: theme.border,
          paddingBottom: insets.bottom || 16,
        },
      ]}
    >
      {ROUTES.map((route, i) => {
        const focused = i === index;
        return (
          <Pressable
            key={route.key}
            onPress={() => onPress(i)}
            style={styles.tabItem}
            accessibilityRole="button"
            accessibilityState={focused ? { selected: true } : {}}
            accessibilityLabel={route.title}
          >
            <MaterialCommunityIcons
              name={focused ? route.iconActive : route.icon}
              color={focused ? theme.primary : theme.textMuted}
              size={22}
            />
            <Text style={[
              styles.tabLabel,
              {
                color: focused ? theme.primary : theme.textMuted,
                fontFamily: focused ? 'Inter_600SemiBold' : 'Inter_500Medium',
              },
            ]}>
              {route.title}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function AppInner() {
  const theme = useAppTheme();
  const [user, setUser] = useState<User | null>(auth.currentUser);
  const [checking, setChecking] = useState(true);
  const [index, setIndex] = useState(0);
  const [pendingGroupAction, setPendingGroupAction] = useState<{ type: 'create' | 'details' | 'addExpense' | 'settle'; group?: Group } | null>(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [pendingInviteCode, setPendingInviteCode] = useState<string | null>(null);
  const [autoJoinPending, setAutoJoinPending] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setChecking(false);
      ensureUserProfile(firebaseUser);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!user) setIndex(0);
  }, [user]);

  const handledInviteCodesRef = useRef<Set<string>>(new Set());

  const clearPendingInvite = () => {
    if (pendingInviteCode) handledInviteCodesRef.current.add(pendingInviteCode);
    setPendingInviteCode(null);
    setAutoJoinPending(false);
    AsyncStorage.removeItem(PENDING_INVITE_KEY).catch(() => {});
    AsyncStorage.removeItem(PENDING_INVITE_AUTOJOIN_KEY).catch(() => {});
  };

  const handleInviteJoined = (group: Group) => {
    clearPendingInvite();
    setPendingGroupAction({ type: 'details', group });
    setIndex(1);
  };

  useEffect(() => {
    const captureInvite = (url: string | null) => {
      if (!url) return;
      const code = parseInviteCode(url);
      if (!code) return;
      // On web, expo-linking's 'url' event actually fires on any window
      // `message` event (Firebase auth/Firestore internals send these
      // routinely), re-reading window.location.href each time. Scrub the
      // invite path from the visible URL immediately so those stray events
      // can't keep re-parsing the same already-handled invite link.
      if (typeof window !== 'undefined' && window.history?.replaceState) {
        window.history.replaceState(null, '', '/');
      }
      if (handledInviteCodesRef.current.has(code)) return;
      setPendingInviteCode(code);
      AsyncStorage.setItem(PENDING_INVITE_KEY, code).catch(() => {});
      if (!auth.currentUser) {
        setAutoJoinPending(true);
        AsyncStorage.setItem(PENDING_INVITE_AUTOJOIN_KEY, '1').catch(() => {});
      }
    };
    Linking.getInitialURL().then(captureInvite);
    const sub = Linking.addEventListener('url', ({ url }) => captureInvite(url));
    AsyncStorage.getItem(PENDING_INVITE_KEY).then(async (stored) => {
      if (!stored || handledInviteCodesRef.current.has(stored)) return;
      setPendingInviteCode((prev) => prev ?? stored);
      const autoJoin = await AsyncStorage.getItem(PENDING_INVITE_AUTOJOIN_KEY);
      if (autoJoin === '1') setAutoJoinPending(true);
    });
    return () => sub.remove();
  }, []);

  useEffect(() => {
    if (!user || !pendingInviteCode || !autoJoinPending) return;
    let cancelled = false;
    joinGroupByInviteCode(pendingInviteCode, user.uid)
      .then((group) => { if (!cancelled) handleInviteJoined(group); })
      .catch(() => { if (!cancelled) clearPendingInvite(); });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, pendingInviteCode, autoJoinPending]);

  const renderScene = (key: RouteKey) => {
    switch (key) {
      case 'home':
        return (
          <HomeScreen
            user={user!}
            onNewGroup={() => { setPendingGroupAction({ type: 'create' }); setIndex(1); }}
            onOpenGroup={(g) => { setPendingGroupAction({ type: 'details', group: g }); setIndex(1); }}
            onAddExpense={(g) => { setPendingGroupAction({ type: 'addExpense', group: g }); setIndex(1); }}
            onSettleUp={(g) => { setPendingGroupAction({ type: 'settle', group: g }); setIndex(1); }}
            onSeeAll={() => setIndex(1)}
            onOpenProfile={() => setIndex(2)}
            onOpenNotifications={() => setShowNotifications(true)}
          />
        );
      case 'groups':
        return (
          <GroupsStack
            userId={user!.uid}
            onClose={() => setIndex(0)}
            pendingAction={pendingGroupAction}
            onActionHandled={() => setPendingGroupAction(null)}
          />
        );
      case 'profile':
        return <ProfileScreen user={user!} />;
      default:
        return null;
    }
  };

  if (checking) {
    return (
      <Screen>
        <View style={globalStyles.centerContent}>
          <ActivityIndicator size="small" color={theme.primary} />
          <Text style={{ marginTop: 8, color: theme.textSec, fontFamily: 'Inter_400Regular', fontSize: 14 }}>
            Checking session...
          </Text>
        </View>
      </Screen>
    );
  }

  if (!user) {
    return <AuthScreen />;
  }

  const activeKey = ROUTES[index].key;

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg }}>
      <View style={{ flex: 1 }}>
        {renderScene(activeKey)}
        {showNotifications && (
          <NotificationsScreen onBack={() => setShowNotifications(false)} />
        )}
        {pendingInviteCode && !autoJoinPending && (
          <JoinGroupScreen
            inviteCode={pendingInviteCode}
            user={user}
            onJoined={handleInviteJoined}
            onDismiss={clearPendingInvite}
          />
        )}
      </View>
      <BottomTabBar index={index} onPress={setIndex} />
    </View>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AppInner />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    borderTopWidth: 1,
    paddingTop: 8,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 4,
  },
  tabLabel: {
    fontSize: 10.5,
    letterSpacing: -0.1,
  },
});
