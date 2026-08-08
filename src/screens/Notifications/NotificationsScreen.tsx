import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppTheme } from '../../theme';
import { useSwipeBack } from '../../hooks/useSwipeBack';
import EmptyState from '../../ui/EmptyState';

type Props = { onBack: () => void };

export default function NotificationsScreen({ onBack }: Props) {
  const theme = useAppTheme();
  const swipeBack = useSwipeBack(onBack);
  return (
    <View style={[StyleSheet.absoluteFillObject, { backgroundColor: theme.bg, zIndex: 100 }]} {...swipeBack}>
      <SafeAreaView edges={['top']} style={{ backgroundColor: theme.bg }}>
        <View style={styles.header}>
          <Pressable style={[styles.headerBtn, { backgroundColor: theme.cardAlt }]} onPress={onBack} hitSlop={4}>
            <MaterialCommunityIcons name="chevron-left" size={22} color={theme.text} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Notifications</Text>
          <View style={{ width: 36 }} />
        </View>
      </SafeAreaView>
      <View style={{ flex: 1, justifyContent: 'center' }}>
        <EmptyState
          icon="🔔"
          title="No notifications yet"
          subtitle="You're all caught up."
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 14, paddingTop: 12, paddingBottom: 10,
  },
  headerBtn: {
    width: 36, height: 36, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontSize: 17, fontFamily: 'Inter_600SemiBold', letterSpacing: -0.3 },
});
