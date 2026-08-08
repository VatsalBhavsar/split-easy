import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { UserProfile } from '../types/user';
import { useAppTheme, avatarColors, getInitials } from '../theme';

type Props = {
  participants: string[];
  members: UserProfile[];
  onToggle: (id: string) => void;
  onSelectAll: () => void;
};

export default function ParticipantsPicker({ participants, members, onToggle, onSelectAll }: Props) {
  const theme = useAppTheme();
  const allSelected = participants.length === members.length;

  return (
    <View style={styles.container}>
      {/* Select all */}
      <Pressable
        onPress={onSelectAll}
        style={({ pressed }) => [
          styles.selectAllBtn,
          {
            backgroundColor: allSelected ? theme.primarySoft : theme.cardAlt,
            borderColor: allSelected ? theme.primary : theme.border,
            opacity: pressed ? 0.8 : 1,
          },
        ]}
      >
        <MaterialCommunityIcons
          name={allSelected ? 'check-circle' : 'plus-circle-outline'}
          size={16}
          color={allSelected ? theme.primary : theme.textMuted}
        />
        <Text style={[styles.selectAllLabel, { color: allSelected ? theme.primary : theme.textSec }]}>
          {allSelected ? 'All selected' : 'Select all'}
        </Text>
      </Pressable>

      {/* Members */}
      {members.map((m) => {
        const checked = participants.includes(m.id);
        const name = m.displayName || m.email || m.id;
        const initials = getInitials(name);
        const [bg, fg] = avatarColors(m.id);

        return (
          <Pressable
            key={m.id}
            onPress={() => onToggle(m.id)}
            style={({ pressed }) => [
              styles.row,
              { borderBottomColor: theme.divider },
              pressed && { backgroundColor: theme.cardAlt },
            ]}
          >
            <View style={[styles.avatar, { backgroundColor: bg }]}>
              <Text style={[styles.avatarText, { color: fg }]}>{initials}</Text>
            </View>
            <Text style={[styles.name, { color: theme.text }]} numberOfLines={1}>
              {name}
            </Text>
            <View
              style={[
                styles.checkbox,
                {
                  backgroundColor: checked ? theme.primary : 'transparent',
                  borderColor: checked ? theme.primary : theme.borderStrong,
                },
              ]}
            >
              {checked ? (
                <MaterialCommunityIcons name="check" size={14} color={theme.onPrimary} />
              ) : null}
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 8,
  },
  selectAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 8,
  },
  selectAllLabel: {
    fontSize: 13,
    fontWeight: '500',
    fontFamily: 'Inter_500Medium',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  avatarText: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
  },
  name: {
    flex: 1,
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
    letterSpacing: -0.1,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
});
