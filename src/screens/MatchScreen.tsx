import React, { useState, useCallback, useMemo, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  TouchableOpacity,
  Image,
} from "react-native";
import { useRoute, useNavigation, RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation";
import { buildTheme } from "../theme";
import { useUserStore } from "../store/userStore";
import { useMatchStore } from "../store/matchStore";
import { useEnergyStore } from "../store/energyStore";
import { useShakeDetector } from "../hooks/useShakeDetector";
import { useEnergyEngine } from "../hooks/useEnergyEngine";
import { useMatchSocket } from "../hooks/useMatchSocket";
import TugOfWarBar from "../components/TugOfWarBar";
import ShakeZone from "../components/ShakeZone";
import EnergyMeter from "../components/EnergyMeter";
import PowerUpPanel from "../components/PowerUpPanel";
import FRLiveDot from "../components/shared/FRLiveDot";
import FRIcon from "../components/shared/FRIcon";
import { PowerUpType, FanRole } from "../utils/constants";
import { TEAM_COLORS } from "../theme/colors";
import { api } from "../api/client";
import { MainTabParamList } from "../navigation";

interface Burst {
  id: string;
  x: number;
  y: number;
}
interface Floater {
  id: string;
  gain: number;
  x: number;
}

function matchStatusLabel(status: string, minute?: number): string {
  if (status === "halftime") return "HALF TIME";
  if (status !== "live") return status.toUpperCase();
  const half = (minute ?? 0) > 45 ? "2ND HALF" : "1ST HALF";
  return minute != null ? `LIVE · ${half} · ${minute}'` : `LIVE · ${half}`;
}

export default function MatchScreen() {
  const route = useRoute<RouteProp<MainTabParamList, "Match">>();
  const matchId = route.params?.matchId ?? null;

  const { isDark, teamKey, fanRole } = useUserStore();
  const theme = buildTheme(isDark, teamKey);
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const {
    match,
    scoreA,
    scoreB,
    momentum,
    eventMode,
    setMatch,
    setScores,
    setMomentum,
    setEventMode,
    supportingTeamId,
    setSupportingTeamId,
  } = useMatchStore();

  useEffect(() => {
    if (match?.status === "halftime") setEventMode("halftime");
    else if (match?.status === "live") setEventMode("normal");
  }, [match?.status]);
  const { myEnergy, combo, activePowerup, activatePowerup } = useEnergyStore();

  const [bursts, setBursts] = useState<Burst[]>([]);
  const [floaters, setFloaters] = useState<Floater[]>([]);
  const [holdProgress] = useState(0);
  const [matchLoading, setMatchLoading] = useState(false);
  const [pickerVisible, setPickerVisible] = useState(false);

  useEffect(() => {
    if (!matchId) return;
    setMatchLoading(true);
    api.matches
      .byId(matchId)
      .then((res) => {
        const m = res.data;
        console.log(m);

        setMatch({
          id: m.matchId,
          teamA: m.teamA,
          teamB: m.teamB,
          status: m.status,
          minute: m.minute,
          stage: m.stage,
        });
        if (m.scores) setScores(m.scores.teamA, m.scores.teamB);
        if (m.momentumRatio != null)
          setMomentum(Math.round(m.momentumRatio * 100));
        if (!supportingTeamId) setPickerVisible(true);
      })
      .catch(() => {})
      .finally(() => setMatchLoading(false));
  }, [matchId]);

  const { emitEnergy: socketEmit } = useMatchSocket(matchId, supportingTeamId);

  const { emitEnergy, getMultiplierDisplay } = useEnergyEngine({
    role: fanRole as FanRole,
    eventMode,
    activePowerup,
    onBatchReady: socketEmit,
  });

  const interactionAllowed = match?.status === "live";

  useShakeDetector({
    onShake: () => handleInput("shake"),
    enabled: !!supportingTeamId && interactionAllowed,
  });

  const handleInput = useCallback(
    (kind: "tap" | "shake" | "voice" | "charge", raw = 1) => {
      if (!supportingTeamId || !interactionAllowed) return;
      const gain = emitEnergy(kind, raw) ?? 1;
      // teamA owns the left (high momentum); teamB owns the right (low momentum)
      const direction = supportingTeamId === match?.teamB.id ? -1 : 1;
      setMomentum((m) =>
        Math.max(0, Math.min(100, m + direction * gain * 0.05)),
      );
      const id = Math.random().toString(36).slice(2);
      setBursts((b) => [...b, { id, x: 0, y: 0 }]);
      setFloaters((f) => [...f, { id, gain, x: 30 + Math.random() * 40 }]);
      setTimeout(() => setBursts((b) => b.filter((x) => x.id !== id)), 700);
      setTimeout(() => setFloaters((f) => f.filter((x) => x.id !== id)), 900);
    },
    [emitEnergy, setMomentum, supportingTeamId, interactionAllowed],
  );

  const handleHoldRelease = useCallback(
    (progress: number) => {
      handleInput("charge", Math.round(5 + progress * 0.1));
    },
    [handleInput],
  );

  const handlePowerup = useCallback(
    (type: PowerUpType) => {
      activatePowerup(type);
      socketEmit(0, "powerup");
    },
    [activatePowerup, socketEmit],
  );

  const totalMult = getMultiplierDisplay(
    fanRole === "drummer" ? "tap" : fanRole === "chanter" ? "voice" : "shake",
  );

  const teamACode = match?.teamA.code ?? theme.teamCode;
  const teamAName = match?.teamA.name ?? theme.teamName;
  const teamAColor = TEAM_COLORS[teamACode] ?? theme.accent;
  const teamA = { code: teamACode, color: teamAColor, name: teamAName, flagUrl: match?.teamA.flagUrl };

  const teamBCode = match?.teamB.code ?? "OPP";
  const teamBName = match?.teamB.name ?? "Opponent";
  const teamBColor = TEAM_COLORS[teamBCode] ?? theme.surface2;
  const teamB = { code: teamBCode, color: teamBColor, name: teamBName, flagUrl: match?.teamB.flagUrl };

  const stageLabel = match?.stage?.toUpperCase() ?? "—";
  const statusLabel = matchStatusLabel(match?.status ?? "live", match?.minute);

  const supportingTeam =
    supportingTeamId === match?.teamA.id
      ? teamA
      : supportingTeamId === match?.teamB.id
        ? teamB
        : null;

  // Force-show the picker if a match is loaded but no team has been chosen yet.
  const showTeamPicker =
    !!match && !matchLoading && (pickerVisible || !supportingTeamId);

  const eventConfig = useMemo(
    () => ({
      goal: {
        label: "GOAL · DOUBLE ENERGY · 30s",
        color: theme.accent,
        icon: "bolt",
      },
      clutch: {
        label: "CLUTCH MODE · LAST 5 MIN",
        color: theme.danger,
        icon: "fire",
      },
      halftime: {
        label: "HALF-TIME · MINI-GAMES OPEN",
        color: theme.warning,
        icon: "sparkle",
      },
    }),
    [theme],
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }}>
      {matchLoading && (
        <View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            alignItems: "center",
            justifyContent: "center",
            zIndex: 10,
            backgroundColor: theme.bg + "CC",
          }}
        >
          <ActivityIndicator color={theme.accent} size="large" />
        </View>
      )}

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
      >
        {/* Top row — status + stage */}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            paddingHorizontal: 20,
            paddingTop: 60,
            paddingBottom: 0,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            {(match?.status === "live" || match?.status === "halftime") && <FRLiveDot color="#ff3b30" />}
            <Text
              style={{
                fontFamily: "JetBrainsMono_400Regular",
                fontSize: 11,
                color: theme.textMute,
                letterSpacing: 0.5,
                textTransform: "uppercase",
              }}
            >
              {statusLabel}
            </Text>
          </View>
          <Text
            style={{
              fontFamily: "JetBrainsMono_400Regular",
              fontSize: 11,
              color: theme.textMute,
              letterSpacing: 0.5,
            }}
          >
            {stageLabel}
          </Text>
        </View>

        {/* Scoreline */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 16,
            paddingHorizontal: 20,
            paddingVertical: 14,
          }}
        >
          <ScoreSide
            theme={theme}
            team={teamA}
            score={scoreA}
            side="L"
            active={supportingTeamId === match?.teamA.id}
          />
          <Text
            style={{
              fontFamily: "JetBrainsMono_400Regular",
              fontSize: 10,
              color: theme.textMute,
              letterSpacing: 1,
              flex: 0,
            }}
          >
            VS
          </Text>
          <ScoreSide
            theme={theme}
            team={teamB}
            score={scoreB}
            side="R"
            active={supportingTeamId === match?.teamB.id}
          />
        </View>

        {/* Supporting team badge */}
        {supportingTeam && (
          <View
            style={{
              marginHorizontal: 20,
              marginBottom: 4,
              flexDirection: "row",
              alignItems: "center",
              gap: 8,
            }}
          >
            <View
              style={{
                width: 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: supportingTeam.color,
              }}
            />
            <Text
              style={{
                fontFamily: "JetBrainsMono_400Regular",
                fontSize: 10,
                color: theme.textMute,
                letterSpacing: 0.5,
              }}
            >
              YOU'RE ROOTING FOR {supportingTeam.code}
            </Text>
            <TouchableOpacity onPress={() => setPickerVisible(true)}>
              <Text
                style={{
                  fontFamily: "JetBrainsMono_400Regular",
                  fontSize: 10,
                  color: theme.textMute,
                  letterSpacing: 0.5,
                }}
              >
                · CHANGE
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Tug-of-war */}
        <TugOfWarBar
          theme={theme}
          momentum={momentum}
          teamA={teamA}
          teamB={teamB}
          matchStatus={match?.status}
        />

        {/* Event banner */}
        {eventMode !== "normal" &&
          eventConfig[eventMode as keyof typeof eventConfig] && (
            <EventBanner
              theme={theme}
              config={eventConfig[eventMode as keyof typeof eventConfig]}
              onPress={
                eventMode === "halftime" && matchId
                  ? () => navigation.navigate("MiniGame", { matchId: matchId! })
                  : undefined
              }
            />
          )}

        {/* Shake zone */}
        <ShakeZone
          theme={theme}
          onTap={() => handleInput("tap")}
          onHoldRelease={handleHoldRelease}
          holdProgress={holdProgress}
          bursts={bursts}
          floaters={floaters}
          combo={combo}
          role={fanRole as FanRole}
          activePowerup={activePowerup}
          disabled={!interactionAllowed}
          disabledLabel={
            match?.status === "halftime"
              ? "HALF TIME · MATCH RESUMES SOON"
              : match?.status === "finished"
                ? "FULL TIME · MATCH ENDED"
                : undefined
          }
        />

        {/* Energy + multiplier meters */}
        <EnergyMeter
          theme={theme}
          energy={myEnergy || 0}
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

      {/* Team picker overlay — blocks interaction until a team is chosen */}
      {showTeamPicker && (
        <TeamPicker
          theme={theme}
          teamA={teamA}
          teamAId={match!.teamA.id}
          teamB={teamB}
          teamBId={match!.teamB.id}
          currentId={supportingTeamId}
          onSelect={(id) => {
            setSupportingTeamId(id);
            setPickerVisible(false);
          }}
        />
      )}
    </SafeAreaView>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function ScoreSide({
  theme,
  team,
  score,
  side,
  active,
}: {
  theme: ReturnType<typeof buildTheme>;
  team: { code: string; color: string; name: string; flagUrl?: string };
  score: number;
  side: "L" | "R";
  active: boolean;
}) {
  return (
    <View
      style={{
        flex: 1,
        flexDirection: side === "L" ? "row" : "row-reverse",
        alignItems: "center",
        gap: 10,
      }}
    >
      <View
        style={{
          width: 36,
          height: 36,
          shadowColor: team.color,
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: active ? 0.7 : 0.3,
          shadowRadius: active ? 16 : 8,
          opacity: active ? 1 : 0.7,
        }}
      >
        {team.flagUrl ? (
          <Image
            source={{ uri: team.flagUrl }}
            style={{ width: 36, height: 36, borderRadius: 8 }}
            resizeMode="cover"
          />
        ) : (
          <View style={{ width: 36, height: 36, borderRadius: 8, backgroundColor: team.color }} />
        )}
      </View>
      <View style={{ alignItems: "flex-start" }}>
        <Text
          style={{
            fontFamily: "JetBrainsMono_400Regular",
            fontSize: 10,
            color: theme.textMute,
            letterSpacing: 0.5,
            textTransform: "uppercase",
          }}
        >
          {team.code}
        </Text>
        <Text
          style={{
            fontFamily: "InterTight_700Bold",
            fontSize: 36,
            color: active ? theme.text : theme.textDim,
            lineHeight: 40,
            fontVariant: ["tabular-nums"],
          }}
        >
          {score}
        </Text>
      </View>
    </View>
  );
}

function TeamPicker({
  theme,
  teamA,
  teamAId,
  teamB,
  teamBId,
  currentId,
  onSelect,
}: {
  theme: ReturnType<typeof buildTheme>;
  teamA: { code: string; color: string; name: string; flagUrl?: string };
  teamAId: string;
  teamB: { code: string; color: string; name: string; flagUrl?: string };
  teamBId: string;
  currentId: string | null;
  onSelect: (id: string) => void;
}) {
  const isChanging = !!currentId;

  return (
    <View
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: theme.bg + "F0",
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 24,
      }}
    >
      <Text
        style={{
          fontFamily: "JetBrainsMono_400Regular",
          fontSize: 10,
          color: theme.textMute,
          letterSpacing: 1.5,
          textTransform: "uppercase",
          marginBottom: 8,
        }}
      >
        {isChanging ? "Switch your allegiance" : "Who are you rooting for?"}
      </Text>
      <Text
        style={{
          fontFamily: "InterTight_700Bold",
          fontSize: 28,
          color: theme.text,
          letterSpacing: -0.8,
          marginBottom: 28,
        }}
      >
        {isChanging ? "Change team" : "Pick your team"}
      </Text>

      <View style={{ width: "100%", gap: 12 }}>
        {[
          { id: teamAId, team: teamA },
          { id: teamBId, team: teamB },
        ].map(({ id, team }) => {
          const selected = id === currentId;
          return (
            <TouchableOpacity
              key={id}
              onPress={() => onSelect(id)}
              activeOpacity={0.8}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 16,
                padding: 18,
                borderRadius: 18,
                backgroundColor: selected ? team.color + "22" : theme.surface,
                borderWidth: selected ? 2 : 1,
                borderColor: selected ? "#E8C429" : theme.border,
              }}
            >
              <View
                style={{
                  width: 44,
                  height: 44,
                  shadowColor: team.color,
                  shadowOffset: { width: 0, height: 0 },
                  shadowOpacity: selected ? 0.7 : 0,
                  shadowRadius: selected ? 16 : 0,
                }}
              >
                {team.flagUrl ? (
                  <Image
                    source={{ uri: team.flagUrl }}
                    style={{ width: 44, height: 44, borderRadius: 12 }}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: team.color }} />
                )}
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontFamily: "InterTight_700Bold",
                    fontSize: 20,
                    color: selected ? theme.text : theme.textDim,
                    letterSpacing: -0.4,
                  }}
                >
                  {team.name}
                </Text>
                <Text
                  style={{
                    fontFamily: "JetBrainsMono_400Regular",
                    fontSize: 10,
                    color: selected ? team.color : theme.textMute,
                    letterSpacing: 0.5,
                    marginTop: 2,
                  }}
                >
                  {team.code}
                </Text>
              </View>
              {selected ? (
                <FRIcon name="check" size={20} color="#E8C429" strokeWidth={2.5} />
              ) : (
                <FRIcon name="chevron-right" size={18} color={theme.textMute} />
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

function EventBanner({
  theme,
  config,
  onPress,
}: {
  theme: ReturnType<typeof buildTheme>;
  config: { label: string; color: string; icon: string };
  onPress?: () => void;
}) {
  return (
    <TouchableOpacity
      activeOpacity={onPress ? 0.75 : 1}
      onPress={onPress}
      style={{
        marginHorizontal: 20,
        marginTop: 8,
        padding: 10,
        paddingHorizontal: 14,
        borderRadius: 12,
        backgroundColor: config.color + "15",
        borderWidth: 1,
        borderColor: config.color + "40",
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
      }}
    >
      <View
        style={{
          width: 28,
          height: 28,
          borderRadius: 8,
          backgroundColor: config.color,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <FRIcon
          name={config.icon}
          size={16}
          color={theme.bg}
          strokeWidth={2.4}
        />
      </View>
      <Text
        style={{
          fontFamily: "JetBrainsMono_700Bold",
          fontSize: 11,
          color: config.color,
          letterSpacing: 0.5,
          flex: 1,
        }}
      >
        {config.label}
      </Text>
    </TouchableOpacity>
  );
}
