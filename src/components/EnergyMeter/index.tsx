import React, { useEffect, useRef } from 'react';
import { View, Text, Animated } from 'react-native';
import { Theme } from '../../theme';
import FRCard from '../shared/FRCard';

interface Props {
  theme: Theme;
  energy: number;
  multiplier: number;
  role: string;
  eventMode: string;
}

export default function EnergyMeter({ theme, energy, multiplier, role, eventMode }: Props) {
  const animEnergy = useRef(new Animated.Value(energy)).current;
  const displayRef = useRef(energy);

  useEffect(() => {
    Animated.timing(animEnergy, {
      toValue: energy,
      duration: Math.min(800, Math.max(180, Math.abs(energy - displayRef.current) * 8)),
      useNativeDriver: false,
    }).start();
    displayRef.current = energy;
  }, [energy]);

  const multColor = multiplier > 1 ? theme.accent : theme.text;

  return (
    <View style={{ flexDirection: 'row', gap: 12, paddingHorizontal: 20, paddingVertical: 8 }}>
      <FRCard theme={theme} padding={12} style={{ flex: 1 }}>
        <Text style={{
          fontFamily: 'JetBrainsMono_400Regular',
          fontSize: 9,
          color: theme.textMute,
          letterSpacing: 1,
          textTransform: 'uppercase',
        }}>Your Energy</Text>
        <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6, marginTop: 4 }}>
          <Text style={{
            fontFamily: 'JetBrainsMono_700Bold',
            fontSize: 26,
            color: theme.text,
          }}>
            {energy.toLocaleString()}
          </Text>
          <Text style={{
            fontFamily: 'JetBrainsMono_400Regular',
            fontSize: 10,
            color: theme.textMute,
          }}>units</Text>
        </View>
      </FRCard>

      <FRCard theme={theme} padding={12} style={{ flex: 1 }}>
        <Text style={{
          fontFamily: 'JetBrainsMono_400Regular',
          fontSize: 9,
          color: theme.textMute,
          letterSpacing: 1,
          textTransform: 'uppercase',
        }}>Multiplier</Text>
        <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4, marginTop: 4 }}>
          <Text style={{
            fontFamily: 'JetBrainsMono_700Bold',
            fontSize: 26,
            color: multColor,
          }}>
            ×{multiplier.toFixed(1)}
          </Text>
        </View>
        <Text style={{
          fontFamily: 'JetBrainsMono_400Regular',
          fontSize: 9,
          color: theme.textMute,
          marginTop: 2,
        }}>
          {role.toUpperCase()}{eventMode !== 'normal' ? ' + ' + eventMode.toUpperCase() : ''}
        </Text>
      </FRCard>
    </View>
  );
}
