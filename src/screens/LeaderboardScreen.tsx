import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, SafeAreaView } from 'react-native';
import { buildTheme } from '../theme';
import { useUserStore } from '../store/userStore';
import FRLiveDot from '../components/shared/FRLiveDot';
import { TEAM_COLORS } from '../theme/colors';

type Tab = 'country' | 'city' | 'friends';

interface Row {
  rank: number;
  name: string;
  code: string;
  score: number;
  color: string;
  isYou?: boolean;
}

const DATA: Record<Tab, Row[]> = {
  country: [
    { rank: 1, name: 'Brazil',    code: 'BRA', score: 18420391, color: '#E8C429', isYou: true },
    { rank: 2, name: 'Argentina', code: 'ARG', score: 17833102, color: '#62AFE0' },
    { rank: 3, name: 'France',    code: 'FRA', score: 14217803, color: '#6060E0' },
    { rank: 4, name: 'Germany',   code: 'GER', score: 12108229, color: '#A0A4B0' },
    { rank: 5, name: 'England',   code: 'ENG', score: 11402993, color: '#E85030' },
    { rank: 6, name: 'Spain',     code: 'ESP', score: 10211440, color: '#E8A000' },
    { rank: 7, name: 'Mexico',    code: 'MEX', score:  9882371, color: '#00B840' },
  ],
  city: [
    { rank: 1, name: 'São Paulo',    code: 'SP',  score: 4128902, color: '#E8C429', isYou: true },
    { rank: 2, name: 'Buenos Aires', code: 'BA',  score: 3982103, color: '#62AFE0' },
    { rank: 3, name: 'Rio',          code: 'RIO', score: 3211089, color: '#E8C429' },
    { rank: 4, name: 'Mexico City',  code: 'MEX', score: 2880103, color: '#00B840' },
    { rank: 5, name: 'Madrid',       code: 'MAD', score: 2402981, color: '#E8A000' },
  ],
  friends: [
    { rank: 1, name: 'Lucia G.',  code: 'LG', score: 84392, color: '#E8C429' },
    { rank: 2, name: 'You',       code: 'ME', score: 48217, color: '#E8C429', isYou: true },
    { rank: 3, name: 'Joel R.',   code: 'JR', score: 41902, color: '#00B840' },
    { rank: 4, name: 'Carla P.',  code: 'CP', score: 38211, color: '#E85030' },
    { rank: 5, name: 'Diego B.',  code: 'DB', score: 21084, color: '#6060E0' },
  ],
};

const TABS: { key: Tab; label: string }[] = [
  { key: 'country', label: 'Country' },
  { key: 'city',    label: 'City' },
  { key: 'friends', label: 'Friends' },
];

export default function LeaderboardScreen() {
  const { isDark, teamKey } = useUserStore();
  const theme = buildTheme(isDark, teamKey);
  const [activeTab, setActiveTab] = useState<Tab>('country');

  const rows = DATA[activeTab];
  const max = Math.max(...rows.map(r => r.score));

  const fmt = (n: number) =>
    n >= 1_000_000 ? (n / 1_000_000).toFixed(1) + 'M' : (n / 1000).toFixed(0) + 'K';

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
          alignItems: 'center',
          paddingHorizontal: 20,
          paddingTop: 60,
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <FRLiveDot color={theme.success} size={7} />
            <Text style={{ fontFamily: 'JetBrainsMono_400Regular', fontSize: 11, color: theme.textMute, letterSpacing: 0.5 }}>
              Live · synced 2s ago
            </Text>
          </View>
          <Text style={{ fontFamily: 'JetBrainsMono_400Regular', fontSize: 11, color: theme.textMute, letterSpacing: 0.5 }}>
            WC 2026
          </Text>
        </View>

        {/* Title */}
        <View style={{ paddingHorizontal: 20, paddingTop: 14 }}>
          <Text style={{ fontFamily: 'JetBrainsMono_400Regular', fontSize: 10, color: theme.textMute, letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 4 }}>
            Leaderboard
          </Text>
          <Text style={{ fontFamily: 'InterTight_700Bold', fontSize: 30, color: theme.text, letterSpacing: -1, lineHeight: 34 }}>
            Who's loudest?
          </Text>
        </View>

        {/* Segmented control */}
        <View style={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: 8 }}>
          <View style={{
            flexDirection: 'row',
            padding: 3,
            borderRadius: 12,
            backgroundColor: theme.surface2,
            borderWidth: 0.5,
            borderColor: theme.border,
          }}>
            {TABS.map((t) => (
              <TouchableOpacity
                key={t.key}
                onPress={() => setActiveTab(t.key)}
                activeOpacity={0.7}
                style={{
                  flex: 1,
                  height: 32,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 9,
                  backgroundColor: activeTab === t.key ? theme.surface : 'transparent',
                  shadowColor: activeTab === t.key ? '#000' : 'transparent',
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.15,
                  shadowRadius: 3,
                }}
              >
                <Text style={{
                  fontFamily: 'InterTight_600SemiBold',
                  fontSize: 13,
                  color: activeTab === t.key ? theme.text : theme.textMute,
                }}>
                  {t.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Rows */}
        <View style={{ paddingHorizontal: 20, paddingTop: 8, gap: 6 }}>
          {rows.map((r, i) => {
            const pct = (r.score / max) * 100;
            return (
              <View
                key={r.code + i}
                style={{
                  padding: 10,
                  paddingHorizontal: 12,
                  borderRadius: 14,
                  backgroundColor: theme.surface,
                  borderWidth: 0.5,
                  borderColor: r.isYou ? r.color : theme.border,
                  overflow: 'hidden',
                }}
              >
                {/* Background bar */}
                <View style={{
                  position: 'absolute',
                  top: 0,
                  bottom: 0,
                  left: 0,
                  width: `${pct}%`,
                  backgroundColor: r.color + '20',
                }} />

                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <Text style={{
                    fontFamily: 'JetBrainsMono_700Bold',
                    fontSize: 12,
                    color: theme.textDim,
                    width: 24,
                    textAlign: 'center',
                  }}>
                    {String(r.rank).padStart(2, '0')}
                  </Text>
                  <View style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: r.color }} />
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Text style={{ fontFamily: 'InterTight_600SemiBold', fontSize: 15, color: theme.text }}>
                        {r.name}
                      </Text>
                      {r.isYou && (
                        <Text style={{
                          fontFamily: 'JetBrainsMono_700Bold',
                          fontSize: 9,
                          color: r.color,
                          letterSpacing: 0.5,
                        }}>YOU</Text>
                      )}
                    </View>
                    <Text style={{ fontFamily: 'JetBrainsMono_400Regular', fontSize: 10, color: theme.textMute, letterSpacing: 0.5, marginTop: 1 }}>
                      {r.code} · {pct.toFixed(1)}%
                    </Text>
                  </View>
                  <Text style={{
                    fontFamily: 'JetBrainsMono_700Bold',
                    fontSize: 14,
                    color: theme.text,
                    fontVariant: ['tabular-nums'],
                  }}>
                    {fmt(r.score)}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
