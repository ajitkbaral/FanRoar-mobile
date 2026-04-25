import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Theme } from '../../theme';
import FRIcon from '../shared/FRIcon';
import { FanRole } from '../../utils/constants';

interface RoleConfig {
  key: FanRole;
  icon: string;
  name: string;
  mult: string;
  input: string;
  power: string;
}

const ROLES: RoleConfig[] = [
  { key: 'drummer', icon: 'drum',      name: 'Drummer',  mult: '1.5×', input: 'Tap Storm',   power: 'Beat Drop' },
  { key: 'chanter', icon: 'megaphone', name: 'Chanter',  mult: '1.5×', input: 'Voice Cheer', power: 'War Cry' },
  { key: 'ultra',   icon: 'lightning', name: 'Ultra Fan', mult: '1.5×', input: 'Shake',       power: 'Earthquake' },
];

interface Props {
  theme: Theme;
  selected: FanRole;
  onSelect: (role: FanRole) => void;
}

export default function FanRoleSelector({ theme, selected, onSelect }: Props) {
  return (
    <View style={{ gap: 10 }}>
      {ROLES.map((r) => {
        const active = selected === r.key;
        return (
          <TouchableOpacity
            key={r.key}
            onPress={() => onSelect(r.key)}
            activeOpacity={0.8}
            style={{
              padding: 14,
              borderRadius: 16,
              backgroundColor: active ? theme.accent : theme.surface,
              borderWidth: 0.5,
              borderColor: active ? theme.accent : theme.border,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 14,
            }}
          >
            <View style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              backgroundColor: active ? theme.bg : theme.surface2,
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <FRIcon name={r.icon} size={22} color={active ? theme.accent : theme.text} strokeWidth={1.8} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{
                fontFamily: 'InterTight_700Bold',
                fontSize: 17,
                color: active ? theme.bg : theme.text,
                letterSpacing: -0.3,
              }}>
                {r.name}
              </Text>
              <Text style={{
                fontFamily: 'JetBrainsMono_400Regular',
                fontSize: 10,
                color: active ? theme.bg + 'B3' : theme.textMute,
                letterSpacing: 0.3,
                marginTop: 2,
              }}>
                {r.mult} {r.input.toUpperCase()} · {r.power.toUpperCase()}
              </Text>
            </View>
            <View style={{
              width: 22,
              height: 22,
              borderRadius: 11,
              borderWidth: 1.5,
              borderColor: active ? theme.bg : theme.borderStrong,
              backgroundColor: active ? theme.bg : 'transparent',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              {active && <FRIcon name="check" size={14} color={theme.accent} strokeWidth={3} />}
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
