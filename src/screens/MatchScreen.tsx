import React, { useState, useRef, useCallback, useMemo } from 'react';
import { View, Text, ScrollView, SafeAreaView } from 'react-native';
import * as Haptics from 'expo-haptics';
import { buildTheme } from '../theme';
import { useUserStore } from '../store/userStore';
import { useMatchStore } from '../store/matchStore';
import { useEnergyStore } from '../store/energyStore';
import { useShakeDetector } from '../hooks/useShakeDetector';
import { useEnergyEngine } from '../hooks/useEnergyEngine';
import { useMatchSocket } from '../hooks/useMatchSocket';
import TugOfWarBar from '../components/TugOfWarBar';
import ShakeZone from '../components/ShakeZone';
import EnergyMeter from '../components/EnergyMeter';
import PowerUpPanel from '../components/PowerUpPanel';
import FRLiveDot from '../components/shared/FRLiveDot';
import FRIcon from '../components/shared/FRIcon';
import { PowerUpType, FanRole } from '../utils/constants';
import { TEAM_COLORS } from '../theme/colors';

interface Burst { id: string; x: number; y: number; }
interface Floater { id: string; gain: number; x: number; }

const MATCH_ID = 'wc2026-bra-arg-qf'; // TODO: from navigation params

export default function MatchScreen() {
  const { isDark, teamKey, fanRole } = useUserStore();
  const theme = buildTheme(isDark, teamKey);
  const { scoreA, scoreB, momentum, eventMode, setMomentum } = useMatchStore();
  const { myEnergy, combo, activePowerup, activatePowerup } = useEnergyStore();

  const [bursts, setBursts] = useState<Burst[]>([]);
  const [floaters, setFloaters] = useState<Floater[]>([]);
  const [holdProgress, setHoldProgress] = useState(0);

  const { emitEnergy: socketEmit } = useMatchSocket(MATCH_ID);

  const { emitEnergy, getMultiplierDisplay } = useEnergyEngine({
    role: fanRole as FanRole,
    eventMode,
    activePowerup,
    onBatchReady: socketEmit,
  });

  useShakeDetector({
    onShake: () => handleInput('shake'),
    enabled: true,
  });

  const handleInput = useCallback((kind: 'tap' | 'shake' | 'voice' | 'charge', raw = 1) => {
    const gain = emitEnergy(kind, raw) ?? 1;

    // Optimistic momentum shift
    setMomentum(m => Math.max(0, Math.min(100, m + gain * 0.05)));

    // Visual feedback
    const id = Math.random().toString(36).slice(2);
    setBursts(b => [...b, { id, x: 0, y: 0 }]);
    setFloaters(f => [...f, { id, gain, x: 30 + Math.random() * 40 }]);
    setTimeout(() => setBursts(b => b.filter(x => x.id !== id)), 700);
    setTimeout(() => setFloaters(f => f.filter(x => x.id !== id)), 900);
  }, [emitEnergy, setMomentum]);

  const handleHoldRelease = useCallback((progress: number) => {
    const raw = Math.round(5 + progress * 0.1);
    handleInput('charge', raw);
  }, [handleInput]);

  const handlePowerup = useCallback((type: PowerUpType) => {
    activatePowerup(type);
    socketEmit(0, 'powerup');
  }, [activatePowerup, socketEmit]);

  const totalMult = getMultiplierDisplay(fanRole === 'drummer' ? 'tap' : fanRole === 'chanter' ? 'voice' : 'shake');

  const teamA = { code: theme.teamCode, color: theme.accent, name: theme.teamName };
  const teamB = { code: 'ARG', color: TEAM_COLORS['ARG'], name: 'Argentina' };

  const eventConfig = useMemo(() => ({
    goal:     { label: 'GOAL · DOUBLE ENERGY · 30s', color: theme.accent,   icon: 'bolt' },
    clutch:   { label: 'CLUTCH MODE · LAST 5 MIN',    color: theme.danger,   icon: 'fire' },
    halftime: { label: 'HALF-TIME · MINI-GAMES OPEN', color: theme.warning,  icon: 'sparkle' },
  }), [theme]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
      >
        {/* Top row — minute + stage */}
        <View style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingHorizontal: 20,
          paddingTop: 60,
          paddingBottom: 0,
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <FRLiveDot color="#ff3b30" />
            <Text style={{ fontFamily: 'JetBrainsMono_400Regular', fontSize: 11, color: theme.textMute, letterSpacing: 0.5, textTransform: 'uppercase' }}>
              LIVE · 2ND HALF · 73'
            </Text>
          </View>
          <Text style={{ fontFamily: 'JetBrainsMono_400Regular', fontSize: 11, color: theme.textMute, letterSpacing: 0.5 }}>
            FIFA WC · QF
          </Text>
        </View>

        {/* Scoreline */}
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 16,
          paddingHorizontal: 20,
          paddingVertical: 14,
        }}>
          <ScoreSide theme={theme} team={teamA} score={scoreA || 2} side="L" />
          <Text style={{ fontFamily: 'JetBrainsMono_400Regular', fontSize: 10, color: theme.textMute, letterSpacing: 1, flex: 0 }}>
            VS
          </Text>
          <ScoreSide theme={theme} team={teamB} score={scoreB || 1} side="R" />
        </View>

        {/* Tug-of-war */}
        <TugOfWarBar
          theme={theme}
          momentum={momentum}
          teamA={teamA}
          teamB={teamB}
        />

        {/* Event banner */}
        {eventMode !== 'normal' && eventConfig[eventMode as keyof typeof eventConfig] && (
          <EventBanner
            theme={theme}
            config={eventConfig[eventMode as keyof typeof eventConfig]}
          />
        )}

        {/* Shake zone */}
        <ShakeZone
          theme={theme}
          onTap={() => handleInput('tap')}
          onHoldRelease={handleHoldRelease}
          holdProgress={holdProgress}
          bursts={bursts}
          floaters={floaters}
          combo={combo}
          role={fanRole as FanRole}
          activePowerup={activePowerup}
        />

        {/* Energy + multiplier meters */}
        <EnergyMeter
          theme={theme}
          energy={myEnergy || 2417}
          multiplier={totalMult}
          role={fanRole}
          eventMode={eventMode}
        />

        {/* Power-up panel */}
        <PowerUpPanel
          theme={theme}
          activePowerup={activePowerup}
          role={fanRole as FanRole}
          onActivate={handlePowerup}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

function ScoreSide({ theme, team, score, side }: {
  theme: ReturnType<typeof buildTheme>;
  team: { code: string; color: string; name: string };
  score: number;
  side: 'L' | 'R';
}) {
  return (
    <View style={{
      flex: 1,
      flexDirection: side === 'L' ? 'row' : 'row-reverse',
      alignItems: 'center',
      gap: 10,
    }}>
      <View style={{
        width: 36,
        height: 36,
        borderRadius: 8,
        backgroundColor: team.color,
        shadowColor: team.color,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
      }} />
      <View style={{ alignItems: side === 'L' ? 'flex-start' : 'flex-end' }}>
        <Text style={{ fontFamily: 'JetBrainsMono_400Regular', fontSize: 10, color: theme.textMute, letterSpacing: 0.5, textTransform: 'uppercase' }}>
          {team.code}
        </Text>
        <Text style={{
          fontFamily: 'InterTight_700Bold',
          fontSize: 36,
          color: theme.text,
          lineHeight: 40,
          fontVariant: ['tabular-nums'],
        }}>
          {score}
        </Text>
      </View>
    </View>
  );
}

function EventBanner({ theme, config }: {
  theme: ReturnType<typeof buildTheme>;
  config: { label: string; color: string; icon: string };
}) {
  return (
    <View style={{
      marginHorizontal: 20,
      marginTop: 8,
      padding: 10,
      paddingHorizontal: 14,
      borderRadius: 12,
      backgroundColor: config.color + '15',
      borderWidth: 1,
      borderColor: config.color + '40',
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    }}>
      <View style={{
        width: 28,
        height: 28,
        borderRadius: 8,
        backgroundColor: config.color,
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <FRIcon name={config.icon} size={16} color={theme.bg} strokeWidth={2.4} />
      </View>
      <Text style={{
        fontFamily: 'JetBrainsMono_700Bold',
        fontSize: 11,
        color: config.color,
        letterSpacing: 0.5,
        flex: 1,
      }}>
        {config.label}
      </Text>
    </View>
  );
}
