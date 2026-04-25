import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Theme } from '../../theme';
import FRIcon from '../shared/FRIcon';
import { PowerUpType, FanRole } from '../../utils/constants';

interface PowerUp {
  key: PowerUpType;
  icon: string;
  label: string;
  sub: string;
  ready: boolean;
  cd: string;
}

interface Props {
  theme: Theme;
  activePowerup: PowerUpType | null;
  role: FanRole;
  onActivate: (type: PowerUpType) => void;
}

const POWERUPS: PowerUp[] = [
  { key: 'mega',   icon: 'bolt',   label: 'Mega Cheer',     sub: '10×, 10s',     ready: true,  cd: '60m' },
  { key: 'shield', icon: 'shield', label: 'Shield',         sub: 'Block 5s',     ready: true,  cd: '45m' },
  { key: 'steal',  icon: 'fire',   label: 'Steal Momentum', sub: '5% from rival', ready: false, cd: '2m'  },
];

export default function PowerUpPanel({ theme, activePowerup, role, onActivate }: Props) {
  return (
    <View style={{ paddingHorizontal: 20, paddingBottom: 24, paddingTop: 4 }}>
      <Text style={{
        fontFamily: 'JetBrainsMono_400Regular',
        fontSize: 10,
        color: theme.textMute,
        letterSpacing: 1.2,
        textTransform: 'uppercase',
        marginBottom: 8,
      }}>Power-Ups</Text>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        {POWERUPS.map((p) => {
          const isActive = activePowerup === p.key;
          return (
            <TouchableOpacity
              key={p.key}
              onPress={() => p.ready && onActivate(p.key)}
              activeOpacity={p.ready ? 0.8 : 1}
              style={{
                flex: 1,
                padding: 10,
                borderRadius: 14,
                backgroundColor: isActive ? theme.accent : theme.surface,
                borderWidth: 0.5,
                borderColor: isActive ? theme.accent : theme.border,
                opacity: p.ready ? 1 : 0.5,
              }}
            >
              <FRIcon
                name={p.icon}
                size={18}
                color={isActive ? theme.bg : theme.text}
                strokeWidth={2}
              />
              <Text style={{
                marginTop: 6,
                fontFamily: 'InterTight_700Bold',
                fontSize: 12,
                color: isActive ? theme.bg : theme.text,
              }}>
                {p.label}
              </Text>
              <Text style={{
                marginTop: 1,
                fontFamily: 'JetBrainsMono_400Regular',
                fontSize: 9,
                color: isActive ? theme.bg : theme.textMute,
                letterSpacing: 0.4,
              }}>
                {p.ready ? p.sub : 'CD ' + p.cd}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}
