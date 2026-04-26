import React from 'react';
import { View, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Theme } from '../../theme';
import FRMark from '../shared/FRMark';

interface RecapStats {
  energyDelivered: number;
  shakeEvents: number;
  tapCombos: number;
  rank: number;
  impactPercent: number;
}

interface MatchInfo {
  teamA: string;
  teamB: string;
  scoreA: number;
  scoreB: number;
  stage: string;
  date: string;
  venue?: string;
}

interface Props {
  theme: Theme;
  stats: RecapStats;
  match: MatchInfo;
}

export default function MomentCard({ theme, stats, match }: Props) {
  return (
    <View style={{
      borderRadius: 22,
      overflow: 'hidden',
      borderWidth: 0.5,
      borderColor: theme.border,
    }}>
      <LinearGradient
        colors={[theme.accent + '30', theme.accent + '08']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ padding: 18 }}
      >
        {/* Watermark */}
        <View style={{ position: 'absolute', top: 14, right: 14, opacity: 0.5 }}>
          <FRMark size={18} color={theme.text} />
        </View>

        <Text style={{
          fontFamily: 'JetBrainsMono_700Bold',
          fontSize: 10,
          color: theme.text,
          letterSpacing: 1.5,
        }}>
          {match.teamA} {match.scoreA} — {match.scoreB} {match.teamB}
        </Text>
        <Text style={{
          fontFamily: 'JetBrainsMono_400Regular',
          fontSize: 10,
          color: theme.textMute,
          letterSpacing: 0.6,
          marginTop: 2,
        }}>
          {match.stage} · {match.date}{match.venue ? ` · ${match.venue}` : ''}
        </Text>

        <View style={{ marginTop: 16 }}>
          <Text style={{
            fontFamily: 'InterTight_800ExtraBold',
            fontSize: 28,
            color: theme.text,
            lineHeight: 32,
            letterSpacing: -1,
          }}>
            You drove
          </Text>
          <Text style={{
            fontFamily: 'InterTight_800ExtraBold',
            fontSize: 56,
            color: theme.accent,
            lineHeight: 60,
            letterSpacing: -2,
          }}>
            {stats.impactPercent.toFixed(1)}%
          </Text>
          <Text style={{
            fontFamily: 'InterTight_800ExtraBold',
            fontSize: 28,
            color: theme.text,
            lineHeight: 32,
            letterSpacing: -1,
          }}>
            of {match.teamA}'s final push.
          </Text>
        </View>

        <View style={{ marginTop: 14, flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
          <RecapStat theme={theme} value={stats.energyDelivered.toLocaleString()} label="Energy delivered" />
          <RecapStat theme={theme} value={stats.shakeEvents.toString()} label="Shake events" />
          <RecapStat theme={theme} value={stats.tapCombos.toString()} label="Tap combos" />
          <RecapStat theme={theme} value={`#${stats.rank}`} label="Brazil rank" />
        </View>
      </LinearGradient>
    </View>
  );
}

function RecapStat({ theme, value, label }: { theme: Theme; value: string; label: string }) {
  return (
    <View style={{
      flex: 1,
      minWidth: '45%',
      padding: 10,
      borderRadius: 10,
      backgroundColor: theme.dark ? 'rgba(0,0,0,0.25)' : 'rgba(255,255,255,0.5)',
    }}>
      <Text style={{
        fontFamily: 'JetBrainsMono_700Bold',
        fontSize: 16,
        color: theme.text,
      }}>{value}</Text>
      <Text style={{
        fontFamily: 'JetBrainsMono_400Regular',
        fontSize: 9,
        color: theme.textMute,
        letterSpacing: 0.5,
        textTransform: 'uppercase',
        marginTop: 2,
      }}>{label}</Text>
    </View>
  );
}
