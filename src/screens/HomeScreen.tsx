import React, { useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, RefreshControl, SafeAreaView,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { buildTheme } from '../theme';
import { useUserStore } from '../store/userStore';
import { useMatchStore } from '../store/matchStore';
import FRCard from '../components/shared/FRCard';
import FRIcon from '../components/shared/FRIcon';
import FRLiveDot from '../components/shared/FRLiveDot';
import { TEAM_COLORS } from '../theme/colors';

const UPCOMING = [
  { time: '20:00', a: 'France',  b: 'Spain',   stage: 'QF',  until: '4h' },
  { time: '23:00', a: 'England', b: 'Germany',  stage: 'QF',  until: '7h' },
  { time: 'TMRW',  a: 'USA',     b: 'Mexico',   stage: 'R16', until: 'tomorrow' },
];

export default function HomeScreen() {
  const navigation = useNavigation<any>();
  const { isDark, teamKey, user } = useUserStore();
  const theme = buildTheme(isDark, teamKey);
  const { momentum } = useMatchStore();
  const [refreshing, setRefreshing] = React.useState(false);

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1200);
  };

  const displayName = user?.displayName ?? 'Marcus';
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning,' : hour < 18 ? 'Good afternoon,' : 'Good evening,';

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.accent} />}
      >
        {/* Top row */}
        <View style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingHorizontal: 20,
          paddingTop: 60,
          paddingBottom: 0,
        }}>
          <Text style={{
            fontFamily: 'JetBrainsMono_400Regular',
            fontSize: 11,
            color: theme.textMute,
            letterSpacing: 0.5,
            textTransform: 'uppercase',
          }}>
            WED · APR 25
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <FRLiveDot color={theme.danger} />
            <Text style={{ fontFamily: 'JetBrainsMono_700Bold', fontSize: 11, color: theme.danger, letterSpacing: 0.5 }}>
              2 LIVE
            </Text>
          </View>
        </View>

        {/* Greeting */}
        <View style={{ paddingHorizontal: 20, paddingTop: 14, paddingBottom: 6 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <View>
              <Text style={{
                fontFamily: 'InterTight_700Bold',
                fontSize: 32,
                color: theme.text,
                letterSpacing: -1.2,
                lineHeight: 36,
              }}>
                {greeting}
              </Text>
              <Text style={{
                fontFamily: 'InterTight_700Bold',
                fontSize: 32,
                color: theme.accent,
                letterSpacing: -1.2,
                lineHeight: 36,
                marginTop: 2,
              }}>
                {displayName}.
              </Text>
            </View>
            <View style={{
              width: 40,
              height: 40,
              borderRadius: 40,
              backgroundColor: theme.surface2,
              borderWidth: 0.5,
              borderColor: theme.border,
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Text style={{ fontFamily: 'InterTight_700Bold', fontSize: 16, color: theme.text }}>
                {displayName[0]}
              </Text>
            </View>
          </View>
        </View>

        {/* Live match hero */}
        <View style={{ paddingHorizontal: 20, paddingTop: 16 }}>
          <FRCard theme={theme} padding={0} style={{ overflow: 'hidden' }}>
            {/* Hero placeholder */}
            <View style={{
              height: 120,
              backgroundColor: theme.surface2,
              justifyContent: 'center',
              alignItems: 'center',
            }}>
              <Text style={{ fontFamily: 'JetBrainsMono_400Regular', fontSize: 10, color: theme.textMute, letterSpacing: 0.5 }}>
                MATCH HERO · BRA vs ARG
              </Text>
            </View>

            <View style={{ padding: 14 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                <FRLiveDot color={theme.danger} />
                <Text style={{ fontFamily: 'JetBrainsMono_700Bold', fontSize: 10, color: theme.danger, letterSpacing: 0.8 }}>
                  LIVE · 73'
                </Text>
                <Text style={{ fontFamily: 'JetBrainsMono_400Regular', fontSize: 10, color: theme.textMute, letterSpacing: 0.5 }}>
                  · QUARTER-FINAL
                </Text>
              </View>

              {/* Scoreline */}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <View style={{ width: 24, height: 24, borderRadius: 6, backgroundColor: theme.accent }} />
                  <Text style={{ fontFamily: 'InterTight_700Bold', fontSize: 22, color: theme.text }}>Brazil</Text>
                </View>
                <Text style={{
                  fontFamily: 'JetBrainsMono_700Bold',
                  fontSize: 28,
                  color: theme.text,
                  fontVariant: ['tabular-nums'],
                }}>
                  2 — 1
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <Text style={{ fontFamily: 'InterTight_700Bold', fontSize: 22, color: theme.text }}>Argentina</Text>
                  <View style={{ width: 24, height: 24, borderRadius: 6, backgroundColor: TEAM_COLORS['ARG'] }} />
                </View>
              </View>

              {/* Momentum mini-bar */}
              <View style={{ marginTop: 12, height: 6, borderRadius: 3, backgroundColor: theme.surface2, overflow: 'hidden' }}>
                <View style={{ position: 'absolute', top: 0, bottom: 0, left: 0, width: `${momentum}%`, backgroundColor: theme.accent }} />
                <View style={{ position: 'absolute', top: 0, bottom: 0, right: 0, width: `${100 - momentum}%`, backgroundColor: TEAM_COLORS['ARG'] }} />
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 }}>
                <Text style={{ fontFamily: 'JetBrainsMono_400Regular', fontSize: 10, color: theme.textMute, letterSpacing: 0.5 }}>
                  {momentum}% MOMENTUM
                </Text>
                <Text style={{ fontFamily: 'JetBrainsMono_400Regular', fontSize: 10, color: theme.textMute, letterSpacing: 0.5 }}>
                  {100 - momentum}%
                </Text>
              </View>

              {/* Join CTA */}
              <TouchableOpacity
                onPress={() => navigation.navigate('Match')}
                activeOpacity={0.85}
                style={{
                  marginTop: 12,
                  height: 44,
                  borderRadius: 12,
                  backgroundColor: theme.accent,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                }}
              >
                <FRIcon name="bolt" size={16} color={theme.bg} />
                <Text style={{ fontFamily: 'InterTight_700Bold', fontSize: 14, color: theme.bg }}>
                  Join the roar
                </Text>
              </TouchableOpacity>
            </View>
          </FRCard>
        </View>

        {/* Today's slate */}
        <View style={{ paddingHorizontal: 20, paddingTop: 18 }}>
          <Text style={{
            fontFamily: 'JetBrainsMono_400Regular',
            fontSize: 10,
            color: theme.textMute,
            letterSpacing: 1.2,
            textTransform: 'uppercase',
            marginBottom: 4,
          }}>Up next</Text>
          <Text style={{
            fontFamily: 'InterTight_700Bold',
            fontSize: 30,
            color: theme.text,
            letterSpacing: -1,
            lineHeight: 34,
          }}>Today's slate</Text>
        </View>

        <View style={{ paddingHorizontal: 20, paddingTop: 4, gap: 8 }}>
          {UPCOMING.map((m, i) => (
            <View key={i} style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 10,
              padding: 12,
              paddingHorizontal: 14,
              borderRadius: 14,
              backgroundColor: theme.surface,
              borderWidth: 0.5,
              borderColor: theme.border,
            }}>
              <Text style={{
                fontFamily: 'JetBrainsMono_700Bold',
                fontSize: 11,
                color: theme.text,
                letterSpacing: 0.4,
                width: 60,
              }}>{m.time}</Text>
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: 'InterTight_600SemiBold', fontSize: 14, color: theme.text }}>
                  {m.a} · {m.b}
                </Text>
                <Text style={{ fontFamily: 'JetBrainsMono_400Regular', fontSize: 10, color: theme.textMute, letterSpacing: 0.4, marginTop: 2 }}>
                  {m.stage} · IN {m.until.toUpperCase()}
                </Text>
              </View>
              <View style={{
                width: 30,
                height: 30,
                borderRadius: 10,
                backgroundColor: theme.surface2,
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <FRIcon name="plus" size={14} color={theme.text} />
              </View>
            </View>
          ))}
        </View>

        {/* Your impact */}
        <View style={{ paddingHorizontal: 20, paddingTop: 18 }}>
          <Text style={{
            fontFamily: 'JetBrainsMono_400Regular',
            fontSize: 10,
            color: theme.textMute,
            letterSpacing: 1.2,
            textTransform: 'uppercase',
            marginBottom: 4,
          }}>Your impact</Text>
          <Text style={{
            fontFamily: 'InterTight_700Bold',
            fontSize: 30,
            color: theme.text,
            letterSpacing: -1,
            lineHeight: 34,
          }}>This tournament</Text>
        </View>

        <View style={{ paddingHorizontal: 20, paddingTop: 4, flexDirection: 'row', gap: 8 }}>
          <FRCard theme={theme} padding={14} style={{ flex: 1 }}>
            <Text style={{ fontFamily: 'JetBrainsMono_400Regular', fontSize: 9, color: theme.textMute, letterSpacing: 1, textTransform: 'uppercase' }}>
              Energy delivered
            </Text>
            <Text style={{ marginTop: 6, fontFamily: 'JetBrainsMono_700Bold', fontSize: 26, color: theme.text }}>
              48,217
            </Text>
            <Text style={{ marginTop: 4, fontFamily: 'JetBrainsMono_400Regular', fontSize: 10, color: theme.success }}>
              +12% vs round
            </Text>
          </FRCard>
          <FRCard theme={theme} padding={14} style={{ flex: 1 }}>
            <Text style={{ fontFamily: 'JetBrainsMono_400Regular', fontSize: 9, color: theme.textMute, letterSpacing: 1, textTransform: 'uppercase' }}>
              Top fan rank
            </Text>
            <Text style={{ marginTop: 6, fontFamily: 'JetBrainsMono_700Bold', fontSize: 26, color: theme.text }}>
              #312
            </Text>
            <Text style={{ marginTop: 4, fontFamily: 'JetBrainsMono_400Regular', fontSize: 10, color: theme.textMute }}>
              top 0.4% Brazil
            </Text>
          </FRCard>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
