import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, View, Text, StyleSheet } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';

SplashScreen.preventAutoHideAsync();
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { onAuthStateChanged, User } from 'firebase/auth';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { auth } from './src/firebase';
import AuthScreen from './src/screens/Auth/AuthScreen';
import HomeScreen from './src/screens/Home/HomeScreen';
import GroupsStack from './src/screens/Groups/GroupsStack';
import Screen from './src/ui/Screen';
import { ThemeProvider, useAppTheme } from './src/theme';
import { globalStyles } from './src/styles/globalStyles';
import { ensureUserProfile } from './src/services/userService';
import ProfileScreen from './src/screens/Profile/ProfileScreen';
import NotificationsScreen from './src/screens/Notifications/NotificationsScreen';
import { Group } from './src/types/group';

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
