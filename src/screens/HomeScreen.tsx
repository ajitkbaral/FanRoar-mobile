import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  SafeAreaView,
  ActivityIndicator,
  Image,
} from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { buildTheme } from "../theme";
import { useUserStore } from "../store/userStore";
import FRCard from "../components/shared/FRCard";
import FRIcon from "../components/shared/FRIcon";
import FRLiveDot from "../components/shared/FRLiveDot";
import { TEAM_PALETTES } from "../theme/colors";
import { api } from "../api/client";
import { ApiMatch, ApiHistoryEntry } from "../api/types";

function formatKickoff(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const todayStr = now.toDateString();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  if (date.toDateString() === todayStr) {
    return date.toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  }
  if (date.toDateString() === tomorrow.toDateString()) return "TMRW";
  return date
    .toLocaleDateString("en-GB", { day: "numeric", month: "short" })
    .toUpperCase();
}

function formatUntil(iso: string): string {
  const diff = new Date(iso).getTime() - Date.now();
  if (diff <= 0) return "NOW";
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(diff / 3600000);
  if (hours < 24) return `${hours}h`;
  return "TOMORROW";
}

export default function HomeScreen() {
  const navigation = useNavigation<any>();
  const { isDark, teamCode, user, userId } = useUserStore();
  const theme = buildTheme(isDark, teamCode);

  const [refreshing, setRefreshing] = useState(false);
  const [liveMatches, setLiveMatches] = useState<ApiMatch[]>([]);
  const [upcomingMatches, setUpcomingMatches] = useState<ApiMatch[]>([]);
  const [matchesLoading, setMatchesLoading] = useState(true);
  const [totalEnergy, setTotalEnergy] = useState<number | null>(null);
  const [myRank, setMyRank] = useState<number | null>(null);

  const fetchMatches = useCallback(async () => {
    try {
      const [liveRes, upcomingRes] = await Promise.all([
        api.matches.live(),
        api.matches.upcoming(),
      ]);
      const live = liveRes.data ?? [];
      const upcoming = upcomingRes.data ?? [];
      setLiveMatches(live);
      setUpcomingMatches(upcoming);

      if (userId) {
        const referenceMatchId = live[0]?.matchId ?? upcoming[0]?.matchId;
        const [historyRes, leaderboardRes] = await Promise.all([
          api.profile.history(userId),
          referenceMatchId ? api.leaderboard.global(referenceMatchId, 1) : Promise.resolve(null),
        ]);
        const energy = (historyRes.data as ApiHistoryEntry[]).reduce(
          (sum, e) => sum + (e.energyContributed ?? 0),
          0,
        );
        setTotalEnergy(energy);
        const rank = leaderboardRes?.data?.you?.rank;
        if (rank != null) setMyRank(rank);
      }
    } catch {
      // keep previous data on error
    } finally {
      setMatchesLoading(false);
      setRefreshing(false);
    }
  }, [userId]);

  useFocusEffect(
    useCallback(() => {
      fetchMatches();
    }, [fetchMatches]),
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchMatches();
  };

  const displayName = user?.displayName ?? "Marcus";
  const hour = new Date().getHours();
  const greeting =
    hour < 12
      ? "Good morning,"
      : hour < 18
        ? "Good afternoon,"
        : "Good evening,";

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.accent}
          />
        }
      >
        {/* Top row */}
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
          <Text
            style={{
              fontFamily: "JetBrainsMono_400Regular",
              fontSize: 11,
              color: theme.textMute,
              letterSpacing: 0.5,
              textTransform: "uppercase",
            }}
          >
            {new Date()
              .toLocaleDateString("en-US", {
                weekday: "short",
                month: "short",
                day: "numeric",
              })
              .toUpperCase()}
          </Text>
          {liveMatches.length > 0 && (
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
            >
              <FRLiveDot color={theme.success} />
              <Text
                style={{
                  fontFamily: "JetBrainsMono_700Bold",
                  fontSize: 11,
                  color: theme.success,
                  letterSpacing: 0.5,
                }}
              >
                {liveMatches.length} LIVE
              </Text>
            </View>
          )}
        </View>

        {/* Greeting */}
        <View
          style={{ paddingHorizontal: 20, paddingTop: 14, paddingBottom: 6 }}
        >
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "flex-end",
            }}
          >
            <View>
              <Text
                style={{
                  fontFamily: "InterTight_700Bold",
                  fontSize: 32,
                  color: theme.text,
                  letterSpacing: -1.2,
                  lineHeight: 36,
                }}
              >
                {greeting}
              </Text>
              <Text
                style={{
                  fontFamily: "InterTight_700Bold",
                  fontSize: 32,
                  color: theme.accent,
                  letterSpacing: -1.2,
                  lineHeight: 36,
                  marginTop: 2,
                }}
              >
                {displayName}.
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => navigation.navigate("Profile")}
              activeOpacity={0.75}
              style={{
                width: 40,
                height: 40,
                borderRadius: 40,
                backgroundColor: theme.surface2,
                borderWidth: 0.5,
                borderColor: theme.border,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text
                style={{
                  fontFamily: "InterTight_700Bold",
                  fontSize: 16,
                  color: theme.text,
                }}
              >
                {displayName[0]}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Live matches */}
        <View style={{ paddingHorizontal: 20, paddingTop: 16, gap: 10 }}>
          {matchesLoading ? (
            <FRCard theme={theme} padding={0} style={{ overflow: "hidden" }}>
              <View
                style={{
                  height: 200,
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <ActivityIndicator color={theme.accent} />
              </View>
            </FRCard>
          ) : liveMatches.length === 0 ? (
            <FRCard theme={theme} padding={0} style={{ overflow: "hidden" }}>
              <View
                style={{
                  height: 120,
                  justifyContent: "center",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <FRIcon name="clock" size={20} color={theme.textMute} />
                <Text
                  style={{
                    fontFamily: "JetBrainsMono_400Regular",
                    fontSize: 10,
                    color: theme.textMute,
                    letterSpacing: 0.5,
                  }}
                >
                  NO LIVE MATCHES RIGHT NOW
                </Text>
              </View>
            </FRCard>
          ) : (
            liveMatches.map((m) => {
              const matchMomentum =
                m.momentumRatio != null
                  ? Math.round(m.momentumRatio * 100)
                  : 50;
              return (
                <FRCard
                  key={m.matchId}
                  theme={theme}
                  padding={0}
                  style={{ overflow: "hidden" }}
                >
                  <View style={{ padding: 14 }}>
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 6,
                        marginBottom: 6,
                      }}
                    >
                      <FRLiveDot color={theme.success} />
                      <Text
                        style={{
                          fontFamily: "JetBrainsMono_700Bold",
                          fontSize: 10,
                          color: theme.success,
                          letterSpacing: 0.8,
                        }}
                      >
                        LIVE{m.minute != null ? ` · ${m.minute}'` : ""}
                      </Text>
                      <Text
                        style={{
                          fontFamily: "JetBrainsMono_400Regular",
                          fontSize: 10,
                          color: theme.textMute,
                          letterSpacing: 0.5,
                        }}
                      >
                        · {m.stage?.toUpperCase() ?? ""}
                      </Text>
                    </View>

                    {/* Scoreline */}
                    <View
                      style={{
                        flexDirection: "row",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          gap: 10,
                        }}
                      >
                        <Image
                          source={{ uri: m.teamA.flagUrl ?? "" }}
                          style={{ width: 24, height: 24, borderRadius: 6 }}
                          resizeMode="cover"
                        />
                        <Text
                          style={{
                            fontFamily: "InterTight_700Bold",
                            fontSize: 22,
                            color: theme.text,
                          }}
                        >
                          {m.teamA.name}
                        </Text>
                      </View>
                      <Text
                        style={{
                          fontFamily: "JetBrainsMono_700Bold",
                          fontSize: 28,
                          color: theme.text,
                          fontVariant: ["tabular-nums"],
                        }}
                      >
                        {m.scores?.teamA ?? 0} — {m.scores?.teamB ?? 0}
                      </Text>
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          gap: 10,
                        }}
                      >
                        <Text
                          style={{
                            fontFamily: "InterTight_700Bold",
                            fontSize: 22,
                            color: theme.text,
                          }}
                        >
                          {m.teamB.name}
                        </Text>
                        <Image
                          source={{ uri: m.teamB.flagUrl ?? "" }}
                          style={{ width: 24, height: 24, borderRadius: 6 }}
                          resizeMode="cover"
                        />
                      </View>
                    </View>

                    {/* Momentum mini-bar */}
                    <View
                      style={{
                        marginTop: 12,
                        height: 6,
                        borderRadius: 3,
                        backgroundColor: theme.surface2,
                        overflow: "hidden",
                      }}
                    >
                      <View
                        style={{
                          position: "absolute",
                          top: 0,
                          bottom: 0,
                          left: 0,
                          width: `${matchMomentum}%`,
                          backgroundColor:
                            TEAM_PALETTES[m.teamA.code]?.primary ?? theme.accent,
                        }}
                      />
                      <View
                        style={{
                          position: "absolute",
                          top: 0,
                          bottom: 0,
                          right: 0,
                          width: `${100 - matchMomentum}%`,
                          backgroundColor:
                            TEAM_PALETTES[m.teamB.code]?.primary ?? theme.surface2,
                        }}
                      />
                    </View>
                    <View
                      style={{
                        flexDirection: "row",
                        justifyContent: "space-between",
                        marginTop: 6,
                      }}
                    >
                      <Text
                        style={{
                          fontFamily: "JetBrainsMono_400Regular",
                          fontSize: 10,
                          color: theme.textMute,
                          letterSpacing: 0.5,
                        }}
                      >
                        {matchMomentum}% MOMENTUM
                      </Text>
                      <Text
                        style={{
                          fontFamily: "JetBrainsMono_400Regular",
                          fontSize: 10,
                          color: theme.textMute,
                          letterSpacing: 0.5,
                        }}
                      >
                        {100 - matchMomentum}%
                      </Text>
                    </View>

                    {/* Join CTA */}
                    <TouchableOpacity
                      onPress={() =>
                        navigation.navigate("Match", { matchId: m.matchId })
                      }
                      activeOpacity={0.85}
                      style={{
                        marginTop: 12,
                        height: 44,
                        borderRadius: 12,
                        backgroundColor: theme.accent,
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 6,
                      }}
                    >
                      <FRIcon name="bolt" size={16} color={theme.bg} />
                      <Text
                        style={{
                          fontFamily: "InterTight_700Bold",
                          fontSize: 14,
                          color: theme.bg,
                        }}
                      >
                        Join the roar
                      </Text>
                    </TouchableOpacity>
                  </View>
                </FRCard>
              );
            })
          )}
        </View>

        {/* Today's slate */}
        <View style={{ paddingHorizontal: 20, paddingTop: 18 }}>
          <Text
            style={{
              fontFamily: "JetBrainsMono_400Regular",
              fontSize: 10,
              color: theme.textMute,
              letterSpacing: 1.2,
              textTransform: "uppercase",
              marginBottom: 4,
            }}
          >
            Up next
          </Text>
          <Text
            style={{
              fontFamily: "InterTight_700Bold",
              fontSize: 30,
              color: theme.text,
              letterSpacing: -1,
              lineHeight: 34,
            }}
          >
            Today's slate
          </Text>
        </View>

        <View style={{ paddingHorizontal: 20, paddingTop: 4, gap: 8 }}>
          {matchesLoading ? (
            <ActivityIndicator color={theme.accent} style={{ marginTop: 12 }} />
          ) : upcomingMatches.length === 0 ? (
            <Text
              style={{
                fontFamily: "JetBrainsMono_400Regular",
                fontSize: 11,
                color: theme.textMute,
                letterSpacing: 0.5,
                paddingVertical: 12,
              }}
            >
              No upcoming matches scheduled.
            </Text>
          ) : (
            upcomingMatches.map((m) => (
              <View
                key={m.matchId}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 10,
                  padding: 12,
                  paddingHorizontal: 14,
                  borderRadius: 14,
                  backgroundColor: theme.surface,
                  borderWidth: 0.5,
                  borderColor: theme.border,
                }}
              >
                <Text
                  style={{
                    fontFamily: "JetBrainsMono_700Bold",
                    fontSize: 11,
                    color: theme.text,
                    letterSpacing: 0.4,
                    width: 60,
                  }}
                >
                  {m.kickoffTime ? formatKickoff(m.kickoffTime) : "—"}
                </Text>
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      fontFamily: "InterTight_600SemiBold",
                      fontSize: 14,
                      color: theme.text,
                    }}
                  >
                    {m.teamA.name} · {m.teamB.name}
                  </Text>
                  <Text
                    style={{
                      fontFamily: "JetBrainsMono_400Regular",
                      fontSize: 10,
                      color: theme.textMute,
                      letterSpacing: 0.4,
                      marginTop: 2,
                    }}
                  >
                    {m.stage?.toUpperCase() ?? ""}
                    {m.kickoffTime ? ` · IN ${formatUntil(m.kickoffTime)}` : ""}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() =>
                    navigation.navigate("Match", { matchId: m.matchId })
                  }
                  style={{
                    width: 30,
                    height: 30,
                    borderRadius: 10,
                    backgroundColor: theme.surface2,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <FRIcon name="plus" size={14} color={theme.text} />
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>

        {/* Your impact */}
        <View style={{ paddingHorizontal: 20, paddingTop: 18 }}>
          <Text
            style={{
              fontFamily: "JetBrainsMono_400Regular",
              fontSize: 10,
              color: theme.textMute,
              letterSpacing: 1.2,
              textTransform: "uppercase",
              marginBottom: 4,
            }}
          >
            Your impact
          </Text>
          <Text
            style={{
              fontFamily: "InterTight_700Bold",
              fontSize: 30,
              color: theme.text,
              letterSpacing: -1,
              lineHeight: 34,
            }}
          >
            This tournament
          </Text>
        </View>

        <View
          style={{
            paddingHorizontal: 20,
            paddingTop: 4,
            flexDirection: "row",
            gap: 8,
          }}
        >
          <FRCard theme={theme} padding={14} style={{ flex: 1 }}>
            <Text
              style={{
                fontFamily: "JetBrainsMono_400Regular",
                fontSize: 9,
                color: theme.textMute,
                letterSpacing: 1,
                textTransform: "uppercase",
              }}
            >
              Energy delivered
            </Text>
            <Text
              style={{
                marginTop: 6,
                fontFamily: "JetBrainsMono_700Bold",
                fontSize: 26,
                color: theme.text,
              }}
            >
              {totalEnergy != null ? totalEnergy.toLocaleString() : "—"}
            </Text>
            <Text
              style={{
                marginTop: 4,
                fontFamily: "JetBrainsMono_400Regular",
                fontSize: 10,
                color: theme.textMute,
              }}
            >
              {totalEnergy != null ? "THIS TOURNAMENT" : "LOADING..."}
            </Text>
          </FRCard>
          <FRCard theme={theme} padding={14} style={{ flex: 1 }}>
            <Text
              style={{
                fontFamily: "JetBrainsMono_400Regular",
                fontSize: 9,
                color: theme.textMute,
                letterSpacing: 1,
                textTransform: "uppercase",
              }}
            >
              Top fan rank
            </Text>
            <Text
              style={{
                marginTop: 6,
                fontFamily: "JetBrainsMono_700Bold",
                fontSize: 26,
                color: theme.text,
              }}
            >
              {myRank != null ? `#${myRank}` : "—"}
            </Text>
            <Text
              style={{
                marginTop: 4,
                fontFamily: "JetBrainsMono_400Regular",
                fontSize: 10,
                color: theme.textMute,
              }}
            >
              {user?.countryCode ?? "GLOBAL"}
            </Text>
          </FRCard>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
