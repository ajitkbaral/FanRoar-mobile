import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Theme } from "../../theme";
import FRIcon from "../shared/FRIcon";
import { PowerUpType, FanRole } from "../../utils/constants";

interface Props {
  theme: Theme;
  activePowerup: PowerUpType | null;
  usedPowerups: Partial<Record<PowerUpType, true>>;
  role: FanRole;
  onActivate: (type: PowerUpType) => void;
}

const POWERUPS: { key: PowerUpType; icon: string; label: string; sub: string }[] = [
  { key: "mega",   icon: "bolt",   label: "Mega Cheer",      sub: "10×  ·  10s" },
  { key: "shield", icon: "shield", label: "Shield",          sub: "Block  ·  5s" },
  { key: "steal",  icon: "fire",   label: "Steal Momentum",  sub: "5% from rival" },
];

export default function PowerUpPanel({
  theme,
  activePowerup,
  usedPowerups,
  role,
  onActivate,
}: Props) {
  return (
    <View style={{ paddingHorizontal: 20, paddingBottom: 24, paddingTop: 4 }}>
      <Text
        style={{
          fontFamily: "JetBrainsMono_400Regular",
          fontSize: 10,
          color: theme.textMute,
          letterSpacing: 1.2,
          textTransform: "uppercase",
          marginBottom: 8,
        }}
      >
        Power-Ups · 1× per match
      </Text>
      <View style={{ flexDirection: "row", gap: 8 }}>
        {POWERUPS.map((p) => {
          const isActive = activePowerup === p.key;
          const isUsed = !!usedPowerups[p.key];
          const canPress = !isActive && !isUsed;

          return (
            <TouchableOpacity
              key={p.key}
              onPress={() => canPress && onActivate(p.key)}
              activeOpacity={canPress ? 0.8 : 1}
              style={{
                flex: 1,
                padding: 10,
                borderRadius: 14,
                backgroundColor: isActive
                  ? theme.accent
                  : isUsed
                    ? theme.surface2
                    : theme.surface,
                borderWidth: isActive ? 1.5 : 0.5,
                borderColor: isActive ? theme.accent : theme.border,
                opacity: isUsed ? 0.45 : 1,
              }}
            >
              <FRIcon
                name={isUsed ? "check" : p.icon}
                size={18}
                color={isActive ? theme.bg : isUsed ? theme.textMute : theme.text}
                strokeWidth={2}
              />
              <Text
                style={{
                  marginTop: 6,
                  fontFamily: "InterTight_700Bold",
                  fontSize: 12,
                  color: isActive ? theme.bg : isUsed ? theme.textMute : theme.text,
                }}
              >
                {p.label}
              </Text>
              <Text
                style={{
                  marginTop: 1,
                  fontFamily: "JetBrainsMono_400Regular",
                  fontSize: 9,
                  color: isActive ? theme.bg : theme.textMute,
                  letterSpacing: 0.4,
                }}
              >
                {isUsed ? "USED" : isActive ? "ACTIVE" : p.sub}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}
