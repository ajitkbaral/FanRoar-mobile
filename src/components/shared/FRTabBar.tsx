import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Theme } from '../../theme';
import FRIcon from './FRIcon';

interface Tab {
  key: string;
  icon: string;
  label: string;
}

interface Props {
  theme: Theme;
  activeKey: string;
  onPress: (key: string) => void;
}

const TABS: Tab[] = [
  { key: 'Home',        icon: 'home',    label: 'Home' },
  { key: 'Match',       icon: 'pulse',   label: 'Match' },
  { key: 'Leaderboard', icon: 'trophy',  label: 'Boards' },
  { key: 'Profile',     icon: 'profile', label: 'Me' },
];

export default function FRTabBar({ theme, activeKey, onPress }: Props) {
  const insets = useSafeAreaInsets();

  return (
    <View style={{
      position: 'absolute',
      left: 12,
      right: 12,
      bottom: Math.max(insets.bottom, 16),
      height: 54,
      borderRadius: 26,
      backgroundColor: theme.dark ? 'rgba(20,20,30,0.85)' : 'rgba(255,255,255,0.85)',
      borderWidth: 0.5,
      borderColor: theme.border,
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 8,
      overflow: Platform.OS === 'android' ? 'hidden' : 'visible',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: theme.dark ? 0.4 : 0.08,
      shadowRadius: 24,
      elevation: 12,
    }}>
      {TABS.map((t) => {
        const isActive = activeKey === t.key;
        return (
          <TouchableOpacity
            key={t.key}
            onPress={() => onPress(t.key)}
            style={{ flex: 1, alignItems: 'center', gap: 3 }}
            activeOpacity={0.7}
          >
            {isActive && (
              <View style={{
                position: 'absolute',
                top: -2,
                width: 4,
                height: 4,
                borderRadius: 4,
                backgroundColor: theme.accent,
              }} />
            )}
            <FRIcon
              name={t.icon}
              size={22}
              color={isActive ? theme.accent : theme.textMute}
              strokeWidth={isActive ? 2.2 : 1.8}
            />
            <Text style={{
              fontFamily: 'JetBrainsMono_600SemiBold',
              fontSize: 10,
              color: isActive ? theme.accent : theme.textMute,
              letterSpacing: 0.3,
              textTransform: 'uppercase',
            }}>
              {t.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
