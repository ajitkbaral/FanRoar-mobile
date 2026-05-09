import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  RefreshControl,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
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
import { useFriendsStore } from "../store/friendsStore";
import FRLiveDot from "../components/shared/FRLiveDot";
import { api } from "../api/client";
import {
  ApiLeaderboardEntry,
  ApiFriendRequest,
  ApiSentRequest,
} from "../api/types";

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
  const { match, lastMatchId } = useMatchStore();
  const theme = buildTheme(isDark, teamCode);
  const {
    friends,
    pendingRequests,
    sentRequests,
    pendingCount,
    setFriends,
    setPendingRequests,
    setSentRequests,
    removeFriend: removeFriendFromStore,
    acceptPending,
    cancelSent,
  } = useFriendsStore();

  const [activeTab, setActiveTab] = useState<Tab>("global");
  const activeTabRef = useRef<Tab>("global");
  const [rows, setRows] =
    useState<Record<Tab, ApiLeaderboardEntry[]>>(EMPTY_ROWS);
  const [you, setYou] =
    useState<Record<Tab, ApiLeaderboardEntry | null>>(EMPTY_YOU);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fetched = useRef<Set<Tab>>(new Set());
  const [syncedLabel, setSyncedLabel] = useState("–");
  const [refreshing, setRefreshing] = useState(false);
  const fetchingRef = useRef(false);
  const syncStartRef = useRef(0);

  // Friends sheet state
  const [sheetVisible, setSheetVisible] = useState(false);
  const [phoneInput, setPhoneInput] = useState("");
  const [requestLoading, setRequestLoading] = useState(false);
  const [requestMsg, setRequestMsg] = useState<{
    ok: boolean;
    text: string;
  } | null>(null);
  const [acceptingId, setAcceptingId] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  useEffect(() => {
    activeTabRef.current = activeTab;
  }, [activeTab]);

  // Clear cache when a new match loads
  useEffect(() => {
    fetched.current.clear();
    setRows(EMPTY_ROWS);
    setYou(EMPTY_YOU);
    setError(null);
  }, [match?.id]);

  // Load friends data once on mount
  useEffect(() => {
    api.friends
      .list()
      .then((res) => {
        setFriends(res.data.friends, res.data.pendingCount);
      })
      .catch(() => {});
    api.friends
      .pending()
      .then((res) => {
        setPendingRequests(res.data.requests);
      })
      .catch(() => {});
    api.friends
      .sent()
      .then((res) => {
        setSentRequests(res.data.requests);
      })
      .catch(() => {});
  }, []);

  const fetchTab = useCallback(
    async (tab: Tab, force = false) => {
      if (!force && fetched.current.has(tab)) return;
      if (force && fetchingRef.current) return;

      if (force) fetchingRef.current = true;
      setLoading(true);
      if (force) {
        setSyncedLabel("syncing...");
        syncStartRef.current = Date.now();
      }
      setError(null);

      try {
        let matchId = match?.id ?? lastMatchId ?? undefined;
        if (!matchId) {
          const liveRes = await api.matches.live();
          matchId = liveRes.data[0]?.matchId;
        }
        if (!matchId) {
          setError("No live match · Check back during kickoff");
          return;
        }

        if (matchId === "__demo__") {
          setRows((prev) => ({ ...prev, [tab]: [] }));
          setYou((prev) => ({ ...prev, [tab]: null }));
          fetched.current.add(tab);
          setSyncedLabel("–");
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
        const elapsed = Date.now() - syncStartRef.current;
        if (force && elapsed < 1000)
          await new Promise((r) => setTimeout(r, 1000 - elapsed));
        setSyncedLabel("synced just now");
      } catch {
        setError("Live rankings unavailable");
        if (force) {
          const elapsed = Date.now() - syncStartRef.current;
          if (elapsed < 1000)
            await new Promise((r) => setTimeout(r, 1000 - elapsed));
          setSyncedLabel("sync failed");
        }
      } finally {
        setLoading(false);
        if (force) fetchingRef.current = false;
      }
    },
    [match?.id, lastMatchId, user?.countryCode],
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchTab(activeTab, true);
    setRefreshing(false);
  }, [activeTab, fetchTab]);

  useFocusEffect(
    useCallback(() => {
      fetchTab("global");
      const id = setInterval(
        () => fetchTab(activeTabRef.current, true),
        10_000,
      );
      return () => clearInterval(id);
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

  const refreshFriendsStore = useCallback(() => {
    api.friends
      .list()
      .then((res) => {
        setFriends(res.data.friends, res.data.pendingCount);
      })
      .catch(() => {});
    api.friends
      .pending()
      .then((res) => {
        setPendingRequests(res.data.requests);
      })
      .catch(() => {});
    api.friends
      .sent()
      .then((res) => {
        setSentRequests(res.data.requests);
      })
      .catch(() => {});
  }, [setFriends, setPendingRequests, setSentRequests]);

  useEffect(() => {
    if (sheetVisible) refreshFriendsStore();
  }, [sheetVisible]);

  const handleSendRequest = async () => {
    if (!phoneInput.trim()) return;
    setRequestLoading(true);
    setRequestMsg(null);
    try {
      await api.friends.request(phoneInput.trim());
      setRequestMsg({ ok: true, text: "Friend request sent!" });
      setPhoneInput("");
      // Sync store so the sent request shows correct state
      refreshFriendsStore();
    } catch {
      setRequestMsg({
        ok: false,
        text: "Could not send request. Check the number and try again.",
      });
    } finally {
      setRequestLoading(false);
    }
  };

  const handleAccept = async (req: ApiFriendRequest) => {
    setAcceptingId(req.id);
    try {
      const res = await api.friends.accept(req.id);
      acceptPending(req.id, res.data);
      // Sync store counts + immediately reload the friends leaderboard
      refreshFriendsStore();
      fetched.current.delete("friends");
      fetchTab("friends", true);
    } catch {
      // silently ignore — will retry on next tap
    } finally {
      setAcceptingId(null);
    }
  };

  const handleCancel = async (req: ApiSentRequest) => {
    setCancellingId(req.id);
    try {
      await api.friends.cancel(req.id);
      cancelSent(req.id);
    } catch {
      // silently ignore
    } finally {
      setCancellingId(null);
    }
  };

  const handleRemove = async (friendUserId: string) => {
    setRemovingId(friendUserId);
    try {
      await api.friends.remove(friendUserId);
      removeFriendFromStore(friendUserId);
      // Sync store counts + immediately reload the friends leaderboard
      refreshFriendsStore();
      fetched.current.delete("friends");
      fetchTab("friends", true);
    } catch {
      // silently ignore
    } finally {
      setRemovingId(null);
    }
  };

  const renderFriendsSheet = () => (
    <Modal
      visible={sheetVisible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => setSheetVisible(false)}
    >
      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: theme.bg }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        {/* Sheet handle + header */}
        <View
          style={{ alignItems: "center", paddingTop: 12, paddingBottom: 4 }}
        >
          <View
            style={{
              width: 36,
              height: 4,
              borderRadius: 2,
              backgroundColor: theme.border,
            }}
          />
        </View>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingHorizontal: 20,
            paddingVertical: 12,
          }}
        >
          <Text
            style={{
              fontFamily: "InterTight_700Bold",
              fontSize: 20,
              color: theme.text,
            }}
          >
            Friends
          </Text>
          <TouchableOpacity
            onPress={() => {
              setSheetVisible(false);
              setRequestMsg(null);
              setPhoneInput("");
            }}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text
              style={{
                fontFamily: "InterTight_600SemiBold",
                fontSize: 17,
                color: theme.textMute,
              }}
            >
              ✕
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingBottom: 60,
            gap: 24,
          }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Add by phone */}
          <View style={{ gap: 10 }}>
            <Text
              style={{
                fontFamily: "JetBrainsMono_400Regular",
                fontSize: 10,
                color: theme.textMute,
                letterSpacing: 1.2,
                textTransform: "uppercase",
              }}
            >
              Add by phone
            </Text>
            <View style={{ flexDirection: "row", gap: 8 }}>
              <TextInput
                value={phoneInput}
                onChangeText={setPhoneInput}
                placeholder="+15551234567"
                placeholderTextColor={theme.textMute}
                keyboardType="phone-pad"
                autoCorrect={false}
                style={{
                  flex: 1,
                  height: 44,
                  borderRadius: 10,
                  backgroundColor: theme.surface,
                  borderWidth: 0.5,
                  borderColor: theme.border,
                  paddingHorizontal: 12,
                  fontFamily: "JetBrainsMono_400Regular",
                  fontSize: 13,
                  color: theme.text,
                }}
              />
              <TouchableOpacity
                onPress={handleSendRequest}
                disabled={requestLoading || !phoneInput.trim()}
                style={{
                  height: 44,
                  paddingHorizontal: 16,
                  borderRadius: 10,
                  backgroundColor: theme.accent + "20",
                  borderWidth: 0.5,
                  borderColor: theme.accent,
                  alignItems: "center",
                  justifyContent: "center",
                  opacity: requestLoading || !phoneInput.trim() ? 0.5 : 1,
                }}
              >
                {requestLoading ? (
                  <ActivityIndicator size="small" color={theme.accent} />
                ) : (
                  <Text
                    style={{
                      fontFamily: "InterTight_600SemiBold",
                      fontSize: 13,
                      color: theme.accent,
                    }}
                  >
                    Send
                  </Text>
                )}
              </TouchableOpacity>
            </View>
            {requestMsg && (
              <Text
                style={{
                  fontFamily: "JetBrainsMono_400Regular",
                  fontSize: 11,
                  color: requestMsg.ok ? theme.success : theme.danger,
                  letterSpacing: 0.3,
                }}
              >
                {requestMsg.text}
              </Text>
            )}
          </View>

          {/* Pending requests */}
          {pendingRequests.length > 0 && (
            <View style={{ gap: 10 }}>
              <Text
                style={{
                  fontFamily: "JetBrainsMono_400Regular",
                  fontSize: 10,
                  color: theme.textMute,
                  letterSpacing: 1.2,
                  textTransform: "uppercase",
                }}
              >
                Pending requests
              </Text>
              {pendingRequests.map((req) => (
                <View
                  key={req.id}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 10,
                    padding: 12,
                    borderRadius: 14,
                    backgroundColor: theme.surface,
                    borderWidth: 0.5,
                    borderColor: theme.border,
                  }}
                >
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        fontFamily: "InterTight_600SemiBold",
                        fontSize: 14,
                        color: theme.text,
                      }}
                    >
                      {req.requesterName}
                    </Text>
                    {req.requesterCountryCode && (
                      <Text
                        style={{
                          fontFamily: "JetBrainsMono_400Regular",
                          fontSize: 10,
                          color: theme.textMute,
                          letterSpacing: 0.5,
                          marginTop: 2,
                        }}
                      >
                        {req.requesterCountryCode}
                      </Text>
                    )}
                  </View>
                  <TouchableOpacity
                    onPress={() => handleAccept(req)}
                    disabled={acceptingId === req.id}
                    style={{
                      paddingHorizontal: 14,
                      paddingVertical: 7,
                      borderRadius: 8,
                      backgroundColor: theme.accent + "20",
                      borderWidth: 0.5,
                      borderColor: theme.accent,
                    }}
                  >
                    {acceptingId === req.id ? (
                      <ActivityIndicator size="small" color={theme.accent} />
                    ) : (
                      <Text
                        style={{
                          fontFamily: "InterTight_600SemiBold",
                          fontSize: 12,
                          color: theme.accent,
                        }}
                      >
                        Accept
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}

          {/* Sent requests */}
          {sentRequests.length > 0 && (
            <View style={{ gap: 10 }}>
              <Text
                style={{
                  fontFamily: "JetBrainsMono_400Regular",
                  fontSize: 10,
                  color: theme.textMute,
                  letterSpacing: 1.2,
                  textTransform: "uppercase",
                }}
              >
                Sent requests
              </Text>
              {sentRequests.map((req) => (
                <View
                  key={req.id}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 10,
                    padding: 12,
                    borderRadius: 14,
                    backgroundColor: theme.surface,
                    borderWidth: 0.5,
                    borderColor: theme.border,
                  }}
                >
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        fontFamily: "InterTight_600SemiBold",
                        fontSize: 14,
                        color: theme.text,
                      }}
                    >
                      {req.addresseeName}
                    </Text>
                    {req.addresseeCountryCode && (
                      <Text
                        style={{
                          fontFamily: "JetBrainsMono_400Regular",
                          fontSize: 10,
                          color: theme.textMute,
                          letterSpacing: 0.5,
                          marginTop: 2,
                        }}
                      >
                        {req.addresseeCountryCode}
                      </Text>
                    )}
                  </View>
                  <TouchableOpacity
                    onPress={() => handleCancel(req)}
                    disabled={cancellingId === req.id}
                    style={{
                      paddingHorizontal: 14,
                      paddingVertical: 7,
                      borderRadius: 8,
                      backgroundColor: theme.surface2,
                      borderWidth: 0.5,
                      borderColor: theme.border,
                    }}
                  >
                    {cancellingId === req.id ? (
                      <ActivityIndicator size="small" color={theme.textMute} />
                    ) : (
                      <Text
                        style={{
                          fontFamily: "InterTight_600SemiBold",
                          fontSize: 12,
                          color: theme.textDim,
                        }}
                      >
                        Cancel
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}

          {/* My friends */}
          {friends.length > 0 && (
            <View style={{ gap: 10 }}>
              <Text
                style={{
                  fontFamily: "JetBrainsMono_400Regular",
                  fontSize: 10,
                  color: theme.textMute,
                  letterSpacing: 1.2,
                  textTransform: "uppercase",
                }}
              >
                My friends · {friends.length}
              </Text>
              {friends.map((f) => (
                <View
                  key={f.id}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 10,
                    padding: 12,
                    borderRadius: 14,
                    backgroundColor: theme.surface,
                    borderWidth: 0.5,
                    borderColor: theme.border,
                  }}
                >
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        fontFamily: "InterTight_600SemiBold",
                        fontSize: 14,
                        color: theme.text,
                      }}
                    >
                      {f.friendName}
                    </Text>
                    {f.friendCountryCode && (
                      <Text
                        style={{
                          fontFamily: "JetBrainsMono_400Regular",
                          fontSize: 10,
                          color: theme.textMute,
                          letterSpacing: 0.5,
                          marginTop: 2,
                        }}
                      >
                        {f.friendCountryCode}
                      </Text>
                    )}
                  </View>
                  <TouchableOpacity
                    onPress={() => handleRemove(f.friendUserId)}
                    disabled={removingId === f.friendUserId}
                    style={{
                      paddingHorizontal: 14,
                      paddingVertical: 7,
                      borderRadius: 8,
                      backgroundColor: theme.danger + "15",
                      borderWidth: 0.5,
                      borderColor: theme.danger,
                    }}
                  >
                    {removingId === f.friendUserId ? (
                      <ActivityIndicator size="small" color={theme.danger} />
                    ) : (
                      <Text
                        style={{
                          fontFamily: "InterTight_600SemiBold",
                          fontSize: 12,
                          color: theme.danger,
                        }}
                      >
                        Remove
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }}>
      {renderFriendsSheet()}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.textMute}
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
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <FRLiveDot color={theme.danger} size={7} />
            <Text
              style={{
                fontFamily: "JetBrainsMono_400Regular",
                fontSize: 11,
                color: theme.textMute,
                letterSpacing: 0.5,
              }}
            >
              LIVE · {syncedLabel}
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
            {match?.tournament?.shortName?.toUpperCase() ?? "–"}
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
                {t.key === "friends" && pendingCount > 0 ? (
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 5,
                    }}
                  >
                    <Text
                      style={{
                        fontFamily: "InterTight_600SemiBold",
                        fontSize: 13,
                        color:
                          activeTab === t.key ? theme.text : theme.textMute,
                      }}
                    >
                      {t.label}
                    </Text>
                    <View
                      style={{
                        width: 16,
                        height: 16,
                        borderRadius: 8,
                        backgroundColor: theme.danger,
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Text
                        style={{
                          fontFamily: "JetBrainsMono_700Bold",
                          fontSize: 9,
                          color: "#fff",
                        }}
                      >
                        {pendingCount > 9 ? "9+" : String(pendingCount)}
                      </Text>
                    </View>
                  </View>
                ) : (
                  <Text
                    style={{
                      fontFamily: "InterTight_600SemiBold",
                      fontSize: 13,
                      color: activeTab === t.key ? theme.text : theme.textMute,
                    }}
                  >
                    {t.label}
                  </Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* List area */}
        <View style={{ paddingHorizontal: 20, paddingTop: 8, gap: 6 }}>
          {loading && !refreshing && currentRows.length === 0 ? (
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
          ) : !loading &&
            activeTab === "friends" &&
            currentRows.length === 0 ? (
            // Friends empty state — two variants
            <View
              style={{
                alignItems: "center",
                paddingVertical: 40,
                paddingHorizontal: 24,
                gap: 12,
              }}
            >
              <Text style={{ fontSize: 36 }}>👥</Text>
              {friends.length === 0 ? (
                <>
                  <Text
                    style={{
                      fontFamily: "InterTight_700Bold",
                      fontSize: 22,
                      color: theme.text,
                      textAlign: "center",
                      letterSpacing: -0.5,
                    }}
                  >
                    See how your crew ranks
                  </Text>
                  <Text
                    style={{
                      fontFamily: "JetBrainsMono_400Regular",
                      fontSize: 12,
                      color: theme.textMute,
                      textAlign: "center",
                      lineHeight: 18,
                      letterSpacing: 0.3,
                    }}
                  >
                    Add friends by phone number to compare scores during the
                    match
                  </Text>
                  <TouchableOpacity
                    onPress={() => setSheetVisible(true)}
                    activeOpacity={0.7}
                    style={{
                      marginTop: 8,
                      paddingHorizontal: 24,
                      paddingVertical: 14,
                      borderRadius: 14,
                      backgroundColor: theme.accent + "20",
                      borderWidth: 0.5,
                      borderColor: theme.accent,
                    }}
                  >
                    <Text
                      style={{
                        fontFamily: "InterTight_600SemiBold",
                        fontSize: 15,
                        color: theme.accent,
                      }}
                    >
                      Add Friends
                    </Text>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <Text
                    style={{
                      fontFamily: "InterTight_700Bold",
                      fontSize: 22,
                      color: theme.text,
                      textAlign: "center",
                      letterSpacing: -0.5,
                    }}
                  >
                    No scores yet
                  </Text>
                  <Text
                    style={{
                      fontFamily: "JetBrainsMono_400Regular",
                      fontSize: 12,
                      color: theme.textMute,
                      textAlign: "center",
                      lineHeight: 18,
                      letterSpacing: 0.3,
                    }}
                  >
                    Your friends haven't cheered in this match yet — rankings
                    will appear once they do
                  </Text>
                  <TouchableOpacity
                    onPress={() => setSheetVisible(true)}
                    activeOpacity={0.7}
                    style={{
                      marginTop: 8,
                      paddingHorizontal: 24,
                      paddingVertical: 14,
                      borderRadius: 14,
                      backgroundColor: theme.surface,
                      borderWidth: 0.5,
                      borderColor: theme.border,
                    }}
                  >
                    <Text
                      style={{
                        fontFamily: "InterTight_600SemiBold",
                        fontSize: 15,
                        color: theme.textDim,
                      }}
                    >
                      Manage Friends
                    </Text>
                  </TouchableOpacity>
                </>
              )}
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

          {/* Manage friends button — shown when the leaderboard has entries */}
          {activeTab === "friends" && currentRows.length > 0 && (
            <TouchableOpacity
              onPress={() => setSheetVisible(true)}
              activeOpacity={0.7}
              style={{
                marginTop: 8,
                padding: 12,
                borderRadius: 14,
                backgroundColor: theme.surface,
                borderWidth: 0.5,
                borderColor: theme.border,
                alignItems: "center",
              }}
            >
              <Text
                style={{
                  fontFamily: "InterTight_600SemiBold",
                  fontSize: 13,
                  color: theme.textDim,
                }}
              >
                Manage Friends
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
