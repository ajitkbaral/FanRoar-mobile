import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, SafeAreaView, TouchableOpacity } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { buildTheme } from '../theme';
import { useUserStore } from '../store/userStore';
import FRCard from '../components/shared/FRCard';
import FRChip from '../components/shared/FRChip';
import FRIcon from '../components/shared/FRIcon';
import { LinearGradient } from 'expo-linear-gradient';
import { api } from '../api/client';
import { ApiHistoryEntry } from '../api/types';

const ROLE_LABELS: Record<string, string> = {
  ultra:   'Ultra Fan',
  drummer: 'Drummer',
  chanter: 'Chanter',
};

const COUNTRY_NAMES: Record<string, string> = {
  BR: 'Brazil',        AR: 'Argentina', US: 'United States',
  GB: 'United Kingdom', IN: 'India',   DE: 'Germany',
  FR: 'France',        ES: 'Spain',    MX: 'Mexico',
  JP: 'Japan',
};

function fmtNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

function tierName(level: number): string {
  if (level >= 21) return 'ULTRA TIER';
  if (level >= 11) return 'SUPER FAN';
  if (level >= 6)  return 'REGULAR';
  return 'ROOKIE';
}

const LOCKED_PLACEHOLDERS = [
  { name: 'WC Warrior', description: '10+ matches',        color: '#E8C000', icon: 'shield' },
  { name: 'Earthquake', description: '500 shakes / match', color: '#6060E0', icon: 'lightning' },
  { name: 'Voice of',   description: 'Top voice fan',      color: '#00A8C0', icon: 'megaphone' },
];

export default function ProfileScreen() {
  const { isDark, teamKey, fanRole, user, userId, logout } = useUserStore();
  const theme = buildTheme(isDark, teamKey);

  const displayName  = user?.displayName || 'Fan';
  const level        = user?.level ?? 1;
  const xp           = user?.xp ?? 0;
  const badges       = user?.badges ?? [];
  const nextLevelXp  = user?.xpToNextLevel ?? level * 1000;
  const xpProgress   = Math.min(xp / nextLevelXp, 1);
  const roleLabel      = ROLE_LABELS[fanRole] ?? fanRole;
  const countryDisplay = user?.countryCode
    ? (COUNTRY_NAMES[user.countryCode] ?? user.countryCode)
    : theme.teamName;

  const [matchCount, setMatchCount] = useState<number | null>(null);

  useFocusEffect(useCallback(() => {
    if (!userId) return;
    api.profile.history(userId).then((res) => {
      const history = res.data as ApiHistoryEntry[];
      setMatchCount(history.length);
    }).catch(() => {});
  }, [userId]));

  const lockedSlots = LOCKED_PLACEHOLDERS.slice(0, Math.max(0, 6 - badges.length));

  const stats = [
    { v: fmtNumber(xp),                                          l: 'XP' },
    { v: matchCount !== null ? String(matchCount) : '–',         l: 'Matches' },
    { v: String(badges.length),                                   l: 'Badges' },
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Top row */}
        <View style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          paddingHorizontal: 20,
          paddingTop: 60,
        }}>
          <Text style={{ fontFamily: 'JetBrainsMono_400Regular', fontSize: 11, color: theme.textMute, letterSpacing: 0.5 }}>
            Profile
          </Text>
          <Text style={{ fontFamily: 'JetBrainsMono_700Bold', fontSize: 11, color: theme.accent, letterSpacing: 0.5 }}>
            LV {level}
          </Text>
        </View>

        {/* Hero */}
        <View style={{ paddingHorizontal: 20, paddingTop: 14, flexDirection: 'row', alignItems: 'center', gap: 14 }}>
          <LinearGradient
            colors={[theme.accent, theme.accent2]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ width: 72, height: 72, borderRadius: 18, alignItems: 'center', justifyContent: 'center' }}
          >
            <Text style={{ fontFamily: 'InterTight_700Bold', fontSize: 28, color: theme.bg }}>
              {displayName[0].toUpperCase()}
            </Text>
          </LinearGradient>
          <View style={{ flex: 1 }}>
            <Text style={{ fontFamily: 'InterTight_700Bold', fontSize: 22, color: theme.text, letterSpacing: -0.5 }}>
              {displayName}
            </Text>
            <View style={{ flexDirection: 'row', gap: 6, marginTop: 6 }}>
              <FRChip theme={theme} color={theme.accent} filled>{countryDisplay}</FRChip>
              <FRChip theme={theme} color={theme.text}>{roleLabel}</FRChip>
            </View>
          </View>
        </View>

        {/* XP bar */}
        <View style={{ paddingHorizontal: 20, paddingTop: 18 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
            <Text style={{ fontFamily: 'JetBrainsMono_400Regular', fontSize: 10, color: theme.textMute, letterSpacing: 0.5 }}>
              LEVEL {level} · {tierName(level)}
            </Text>
            <Text style={{ fontFamily: 'JetBrainsMono_400Regular', fontSize: 10, color: theme.textMute, letterSpacing: 0.5 }}>
              {xp.toLocaleString()} / {nextLevelXp.toLocaleString()} XP
            </Text>
          </View>
          <View style={{ height: 8, borderRadius: 4, backgroundColor: theme.surface2, overflow: 'hidden' }}>
            <LinearGradient
              colors={[theme.accent, theme.accent2]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{
                position: 'absolute', top: 0, bottom: 0, left: 0,
                width: `${Math.max(4, Math.round(xpProgress * 100))}%`,
                borderRadius: 4,
              }}
            />
          </View>
        </View>

        {/* Stats */}
        <View style={{ paddingHorizontal: 20, paddingTop: 18, flexDirection: 'row', gap: 8 }}>
          {stats.map((s, i) => (
            <FRCard key={i} theme={theme} padding={12} style={{ flex: 1 }}>
              <Text style={{ fontFamily: 'JetBrainsMono_700Bold', fontSize: 22, color: theme.text }}>
                {s.v}
              </Text>
              <Text style={{ fontFamily: 'JetBrainsMono_400Regular', fontSize: 9, color: theme.textMute, letterSpacing: 0.6, textTransform: 'uppercase', marginTop: 2 }}>
                {s.l}
              </Text>
            </FRCard>
          ))}
        </View>

        {/* Badges header */}
        <View style={{ paddingHorizontal: 20, paddingTop: 18, paddingBottom: 4 }}>
          <Text style={{ fontFamily: 'JetBrainsMono_400Regular', fontSize: 10, color: theme.textMute, letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 4 }}>
            Collection
          </Text>
          <Text style={{ fontFamily: 'InterTight_700Bold', fontSize: 30, color: theme.text, letterSpacing: -1, lineHeight: 34 }}>
            Badges
          </Text>
        </View>

        {/* Badge grid */}
        <View style={{ paddingHorizontal: 20, paddingTop: 8, flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {badges.map((b) => (
            <View
              key={b.id}
              style={{
                width: '30%', aspectRatio: 1, borderRadius: 16, padding: 10,
                backgroundColor: theme.surface,
                borderWidth: 0.5, borderColor: theme.border,
                justifyContent: 'space-between',
              }}
            >
              <View style={{
                width: 32, height: 32, borderRadius: 10,
                backgroundColor: b.color,
                alignItems: 'center', justifyContent: 'center',
              }}>
                <FRIcon name={b.icon} size={16} color={theme.bg} strokeWidth={2} />
              </View>
              <View>
                <Text style={{ fontFamily: 'InterTight_700Bold', fontSize: 12, color: theme.text, lineHeight: 14 }}>
                  {b.name}
                </Text>
                <Text style={{ fontFamily: 'JetBrainsMono_400Regular', fontSize: 8, color: theme.textMute, letterSpacing: 0.4, marginTop: 2, textTransform: 'uppercase' }}>
                  {b.description}
                </Text>
              </View>
            </View>
          ))}

          {lockedSlots.map((b, i) => (
            <View
              key={`locked-${i}`}
              style={{
                width: '30%', aspectRatio: 1, borderRadius: 16, padding: 10,
                backgroundColor: 'transparent',
                borderWidth: 0.5, borderStyle: 'dashed', borderColor: theme.borderStrong,
                justifyContent: 'space-between',
                opacity: 0.4,
              }}
            >
              <View style={{
                width: 32, height: 32, borderRadius: 10,
                borderWidth: 1, borderColor: theme.borderStrong,
                alignItems: 'center', justifyContent: 'center',
              }}>
                <FRIcon name={b.icon} size={16} color={theme.textMute} strokeWidth={2} />
              </View>
              <View>
                <Text style={{ fontFamily: 'InterTight_700Bold', fontSize: 12, color: theme.text, lineHeight: 14 }}>
                  {b.name}
                </Text>
                <Text style={{ fontFamily: 'JetBrainsMono_400Regular', fontSize: 8, color: theme.textMute, letterSpacing: 0.4, marginTop: 2, textTransform: 'uppercase' }}>
                  {b.description}
                </Text>
              </View>
            </View>
          ))}

          {badges.length === 0 && (
            <Text style={{ fontFamily: 'JetBrainsMono_400Regular', fontSize: 12, color: theme.textMute, letterSpacing: 0.3, paddingTop: 8 }}>
              No badges yet · Keep cheering!
            </Text>
          )}
        </View>

        {/* Logout */}
        <View style={{ paddingHorizontal: 20, paddingTop: 24 }}>
          <TouchableOpacity
            onPress={logout}
            activeOpacity={0.75}
            style={{
              height: 48,
              borderRadius: 14,
              borderWidth: 1,
              borderColor: theme.danger,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
            }}
          >
            <FRIcon name="log-out" size={16} color={theme.danger} />
            <Text style={{
              fontFamily: 'InterTight_700Bold',
              fontSize: 14,
              color: theme.danger,
            }}>
              Log out
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
