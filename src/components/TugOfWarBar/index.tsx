import React, { useEffect, useRef } from 'react';
import { View, Text, Animated } from 'react-native';
import { Theme } from '../../theme';
import { MOMENTUM } from '../../utils/constants';

interface TeamInfo {
  code: string;
  color: string;
  name: string;
}

interface Props {
  theme: Theme;
  momentum: number; // 0–100, our team = left
  teamA: TeamInfo;
  teamB: TeamInfo;
}

export default function TugOfWarBar({ theme, momentum, teamA, teamB }: Props) {
  const animMomentum = useRef(new Animated.Value(momentum)).current;

  useEffect(() => {
    Animated.spring(animMomentum, {
      toValue: momentum,
      tension: 80,
      friction: 10,
      useNativeDriver: false,
    }).start();
  }, [momentum]);

  const heat = Math.abs(momentum - 50) / 50;
  const dominant = momentum > 50 ? teamA : teamB;
  const dominantColor = momentum > 50 ? teamA.color : teamB.color;
  const label = heat > MOMENTUM.TAKEOVER_THRESHOLD
    ? 'TAKEOVER'
    : heat > MOMENTUM.SURGE_THRESHOLD
    ? 'SURGE'
    : 'BALANCED';

  const leftWidth = animMomentum.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });
  const rightWidth = animMomentum.interpolate({
    inputRange: [0, 100],
    outputRange: ['100%', '0%'],
  });
  const dividerLeft = animMomentum.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={{ paddingHorizontal: 20, paddingBottom: 4 }}>
      <View style={{
        height: 56,
        borderRadius: 16,
        overflow: 'hidden',
        backgroundColor: theme.surface,
        borderWidth: 0.5,
        borderColor: theme.border,
        shadowColor: heat > MOMENTUM.SURGE_THRESHOLD ? dominantColor : 'transparent',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        position: 'relative',
      }}>
        {/* Left fill — our team */}
        <Animated.View style={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          left: 0,
          width: leftWidth,
          backgroundColor: teamA.color + '40',
        }} />
        {/* Right fill — opponents */}
        <Animated.View style={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          right: 0,
          width: rightWidth,
          backgroundColor: teamB.color + '40',
        }} />

        {/* Threshold tick marks */}
        {[15, 30, 70, 85].map((t) => (
          <View key={t} style={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            left: `${t}%`,
            width: 1,
            backgroundColor: theme.dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
          }} />
        ))}

        {/* Center divider */}
        <Animated.View style={{
          position: 'absolute',
          top: 8,
          bottom: 8,
          left: dividerLeft,
          width: 2,
          marginLeft: -1,
          backgroundColor: theme.text,
          borderRadius: 2,
        }} />

        {/* Percentage labels */}
        <View style={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          left: 14,
          right: 14,
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <Text style={{
            fontFamily: 'JetBrainsMono_700Bold',
            fontSize: 18,
            color: theme.text,
          }}>
            {Math.round(momentum)}%
          </Text>
          <Text style={{
            fontFamily: 'JetBrainsMono_700Bold',
            fontSize: 18,
            color: theme.text,
          }}>
            {100 - Math.round(momentum)}%
          </Text>
        </View>
      </View>

      {/* Footer labels */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 }}>
        <Text style={{
          fontFamily: 'JetBrainsMono_400Regular',
          fontSize: 9,
          color: theme.textMute,
          letterSpacing: 0.6,
          textTransform: 'uppercase',
        }}>
          Momentum {teamA.code}
        </Text>
        <Text style={{
          fontFamily: 'JetBrainsMono_700Bold',
          fontSize: 9,
          color: heat > MOMENTUM.SURGE_THRESHOLD ? dominantColor : theme.textMute,
          letterSpacing: 0.6,
        }}>
          {label}
        </Text>
        <Text style={{
          fontFamily: 'JetBrainsMono_400Regular',
          fontSize: 9,
          color: theme.textMute,
          letterSpacing: 0.6,
          textTransform: 'uppercase',
        }}>
          Momentum {teamB.code}
        </Text>
      </View>
    </View>
  );
}
