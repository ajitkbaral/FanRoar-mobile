import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, SafeAreaView, Share } from 'react-native';
import { buildTheme } from '../theme';
import { useUserStore } from '../store/userStore';
import MomentCard from '../components/MomentCard';
import FRIcon from '../components/shared/FRIcon';
import FRCard from '../components/shared/FRCard';

export default function RecapScreen() {
  const { isDark, teamKey } = useUserStore();
  const theme = buildTheme(isDark, teamKey);

  const stats = {
    energyDelivered: 3128,
    shakeEvents: 412,
    tapCombos: 89,
    rank: 312,
    impactPercent: 2.4,
  };

  const match = {
    teamA: 'BRA',
    teamB: 'ARG',
    scoreA: 2,
    scoreB: 1,
    stage: 'QF',
    date: '25 APR 2026',
    venue: 'MARACANÃ',
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `I drove ${stats.impactPercent.toFixed(1)}% of Brazil's final push in the World Cup QF! #FanRoar #BRA`,
      });
    } catch {}
  };

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
          <Text style={{ fontFamily: 'JetBrainsMono_400Regular', fontSize: 11, color: theme.textMute, letterSpacing: 0.5 }}>
            Match recap · ready to share
          </Text>
          <FRIcon name="share" size={14} color={theme.textMute} />
        </View>

        {/* Title */}
        <View style={{ paddingHorizontal: 20, paddingTop: 14 }}>
          <Text style={{ fontFamily: 'JetBrainsMono_400Regular', fontSize: 10, color: theme.textMute, letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 4 }}>
            Full time
          </Text>
          <Text style={{ fontFamily: 'InterTight_700Bold', fontSize: 30, color: theme.text, letterSpacing: -1, lineHeight: 34 }}>
            That was loud.
          </Text>
        </View>

        {/* Moment card */}
        <View style={{ paddingHorizontal: 20, paddingTop: 12 }}>
          <MomentCard theme={theme} stats={stats} match={match} />
        </View>

        {/* Badge unlock */}
        <View style={{ paddingHorizontal: 20, paddingTop: 14 }}>
          <FRCard theme={theme} padding={14} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              backgroundColor: theme.danger,
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <FRIcon name="fire" size={18} color={theme.bg} strokeWidth={2} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: 'InterTight_700Bold', fontSize: 14, color: theme.text }}>
                Clutch Supporter unlocked
              </Text>
              <Text style={{ fontFamily: 'JetBrainsMono_400Regular', fontSize: 10, color: theme.textMute, letterSpacing: 0.5, marginTop: 2, textTransform: 'uppercase' }}>
                Activated in last 5 minutes
              </Text>
            </View>
            <FRIcon name="check" size={18} color={theme.success} />
          </FRCard>
        </View>

        {/* Action buttons */}
        <View style={{ paddingHorizontal: 20, paddingTop: 12, flexDirection: 'row', gap: 8 }}>
          <TouchableOpacity
            onPress={handleShare}
            activeOpacity={0.85}
            style={{
              flex: 1,
              height: 48,
              borderRadius: 14,
              backgroundColor: theme.accent,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
            }}
          >
            <FRIcon name="share" size={16} color={theme.bg} />
            <Text style={{ fontFamily: 'InterTight_700Bold', fontSize: 14, color: theme.bg }}>
              Share
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.85}
            style={{
              width: 48,
              height: 48,
              borderRadius: 14,
              backgroundColor: theme.surface,
              borderWidth: 0.5,
              borderColor: theme.border,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <FRIcon name="plus" size={18} color={theme.text} />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
