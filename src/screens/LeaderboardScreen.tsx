import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import Animated, {
  useSharedValue,
  withRepeat,
  withTiming,
  cancelAnimation,
  useAnimatedStyle,
} from "react-native-reanimated";
import { buildTheme } from "../theme";
import { useUserStore } from "../store/userStore";
import { useMatchStore } from "../store/matchStore";
import FRLiveDot from "../components/shared/FRLiveDot";
import { api } from "../api/client";
import { ApiLeaderboardEntry } from "../api/types";

type Tab = "global" | "country" | "friends";

const TABS: { key: Tab; label: string }[] = [
  { key: "global", label: "Global" },
  { key: "country", label: "Country" },
  { key: "friends", label: "Friends" },
];

const EMPTY_ROWS: Record<Tab, ApiLeaderboardEntry[]> = {
  global: [],
  country: [],
  friends: [],
};
const EMPTY_YOU: Record<Tab, ApiLeaderboardEntry | null> = {
  global: null,
  country: null,
  friends: null,
};

export default function LeaderboardScreen() {
  const { isDark, teamCode, user } = useUserStore();
  const { match } = useMatchStore();
  const theme = buildTheme(isDark, teamCode);

  const [activeTab, setActiveTab] = useState<Tab>("global");
  const [rows, setRows] =
    useState<Record<Tab, ApiLeaderboardEntry[]>>(EMPTY_ROWS);
  const [you, setYou] =
    useState<Record<Tab, ApiLeaderboardEntry | null>>(EMPTY_YOU);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fetched = useRef<Set<Tab>>(new Set());

  // Clear cache when a new match loads
  useEffect(() => {
    fetched.current.clear();
    setRows(EMPTY_ROWS);
    setYou(EMPTY_YOU);
    setError(null);
  }, [match?.id]);

  const fetchTab = useCallback(
    async (tab: Tab) => {
      if (fetched.current.has(tab)) return;

      setLoading(true);
      setError(null);

      try {
        // Resolve matchId from store; if missing, pull the first live match
        let matchId = match?.id;
        if (!matchId) {
          const liveRes = await api.matches.live();
          matchId = liveRes.data[0]?.matchId;
        }
        if (!matchId) {
          setError("No live match · Check back during kickoff");
          return;
        }

        let res;
        if (tab === "global") {
          res = await api.leaderboard.global(matchId);
        } else if (tab === "country") {
          res = await api.leaderboard.country(
            matchId,
            user?.countryCode ?? "BRA",
          );
        } else {
          res = await api.leaderboard.friends(matchId);
        }

        const { topList, you: youEntry } = res.data;
        setRows((prev) => ({ ...prev, [tab]: topList ?? [] }));
        setYou((prev) => ({ ...prev, [tab]: youEntry ?? null }));
        fetched.current.add(tab);
      } catch {
        setError("Live rankings unavailable");
      } finally {
        setLoading(false);
      }
    },
    [match?.id, user?.countryCode],
  );

  useFocusEffect(
    useCallback(() => {
      fetchTab("global");
    }, [fetchTab]),
  );

  useEffect(() => {
    fetchTab(activeTab);
  }, [activeTab, fetchTab]);

  const currentRows = rows[activeTab];
  const currentYou = you[activeTab];
  const youInList = currentRows.some((r) => r.isYou);
  const max =
    currentRows.length > 0 ? Math.max(...currentRows.map((r) => r.score)) : 1;

  const fmt = (n: number) =>
    n >= 1_000_000
      ? (n / 1_000_000).toFixed(1) + "M"
      : n >= 1_000
      ? (n / 1_000).toFixed(0) + "K"
      : String(n);

  const pulse = useSharedValue(1);
  useEffect(() => {
    if (loading) {
      pulse.value = withRepeat(withTiming(0.3, { duration: 700 }), -1, true);
    } else {
      cancelAnimation(pulse);
      pulse.value = withTiming(1, { duration: 150 });
    }
  }, [loading]);

  const skeletonStyle = useAnimatedStyle(() => ({ opacity: pulse.value }));

  const renderRow = (r: ApiLeaderboardEntry, key: string) => {
    const pct = max > 0 ? (r.score / max) * 100 : 0;
    return (
      <View
        key={key}
        style={{
          padding: 10,
          paddingHorizontal: 12,
          borderRadius: 14,
          backgroundColor: theme.surface,
          borderWidth: 0.5,
          borderColor: r.isYou ? r.color : theme.border,
          overflow: "hidden",
        }}
      >
        <View
          style={{
            position: "absolute",
            top: 0,
            bottom: 0,
            left: 0,
            width: `${pct}%`,
            backgroundColor: r.color + "20",
          }}
        />
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <Text
            style={{
              fontFamily: "JetBrainsMono_700Bold",
              fontSize: 12,
              color: theme.textDim,
              width: 24,
              textAlign: "center",
            }}
          >
            {String(r.rank).padStart(2, "0")}
          </Text>
          <View
            style={{
              width: 28,
              height: 28,
              borderRadius: 8,
              backgroundColor: r.color,
            }}
          />
          <View style={{ flex: 1 }}>
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
            >
              <Text
                style={{
                  fontFamily: "InterTight_600SemiBold",
                  fontSize: 15,
                  color: theme.text,
                }}
              >
                {r.name}
              </Text>
              {r.isYou && (
                <Text
                  style={{
                    fontFamily: "JetBrainsMono_700Bold",
                    fontSize: 9,
                    color: r.color,
                    letterSpacing: 0.5,
                  }}
                >
                  YOU
                </Text>
              )}
            </View>
            <Text
              style={{
                fontFamily: "JetBrainsMono_400Regular",
                fontSize: 10,
                color: theme.textMute,
                letterSpacing: 0.5,
                marginTop: 1,
              }}
            >
              {r.code} · {pct.toFixed(1)}%
            </Text>
          </View>
          <Text
            style={{
              fontFamily: "JetBrainsMono_700Bold",
              fontSize: 14,
              color: theme.text,
              fontVariant: ["tabular-nums"],
            }}
          >
            {fmt(r.score)}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Top row */}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            paddingHorizontal: 20,
            paddingTop: 60,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <FRLiveDot color={theme.success} size={7} />
            <Text
              style={{
                fontFamily: "JetBrainsMono_400Regular",
                fontSize: 11,
                color: theme.textMute,
                letterSpacing: 0.5,
              }}
            >
              Live · synced 2s ago
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
            WC 2026
          </Text>
        </View>

        {/* Title */}
        <View style={{ paddingHorizontal: 20, paddingTop: 14 }}>
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
            Leaderboard
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
            Who's loudest?
          </Text>
        </View>

        {/* Segmented control */}
        <View
          style={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: 8 }}
        >
          <View
            style={{
              flexDirection: "row",
              padding: 3,
              borderRadius: 12,
              backgroundColor: theme.surface2,
              borderWidth: 0.5,
              borderColor: theme.border,
            }}
          >
            {TABS.map((t) => (
              <TouchableOpacity
                key={t.key}
                onPress={() => setActiveTab(t.key)}
                activeOpacity={0.7}
                style={{
                  flex: 1,
                  height: 32,
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: 9,
                  backgroundColor:
                    activeTab === t.key ? theme.surface : "transparent",
                  shadowColor: activeTab === t.key ? "#000" : "transparent",
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.15,
                  shadowRadius: 3,
                }}
              >
                <Text
                  style={{
                    fontFamily: "InterTight_600SemiBold",
                    fontSize: 13,
                    color: activeTab === t.key ? theme.text : theme.textMute,
                  }}
                >
                  {t.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* List area */}
        <View style={{ paddingHorizontal: 20, paddingTop: 8, gap: 6 }}>
          {loading && currentRows.length === 0 ? (
            Array.from({ length: 5 }).map((_, i) => (
              <Animated.View
                key={i}
                style={[
                  skeletonStyle,
                  {
                    height: 56,
                    borderRadius: 14,
                    backgroundColor: theme.surface,
                    borderWidth: 0.5,
                    borderColor: theme.border,
                  },
                ]}
              />
            ))
          ) : error && currentRows.length === 0 ? (
            <View style={{ padding: 24, alignItems: "center" }}>
              <Text
                style={{
                  fontFamily: "JetBrainsMono_400Regular",
                  fontSize: 12,
                  color: theme.textMute,
                  letterSpacing: 0.5,
                }}
              >
                Live rankings unavailable
              </Text>
            </View>
          ) : (
            currentRows.map((r, i) => renderRow(r, r.code + i))
          )}

          {/* Your Position — shown only when user's rank is outside the visible list */}
          {!loading && currentYou && !youInList && (
            <>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 8,
                  paddingVertical: 4,
                  paddingHorizontal: 2,
                }}
              >
                <Text
                  style={{
                    fontFamily: "JetBrainsMono_400Regular",
                    fontSize: 11,
                    color: theme.textMute,
                    letterSpacing: 2,
                  }}
                >
                  · · ·
                </Text>
                <View
                  style={{
                    flex: 1,
                    height: 0.5,
                    backgroundColor: theme.border,
                  }}
                />
                <Text
                  style={{
                    fontFamily: "JetBrainsMono_400Regular",
                    fontSize: 9,
                    color: theme.textMute,
                    letterSpacing: 0.8,
                    textTransform: "uppercase",
                  }}
                >
                  Your position
                </Text>
              </View>
              {renderRow({ ...currentYou, isYou: true }, "you-card")}
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
