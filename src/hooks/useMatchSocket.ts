import { useEffect, useRef, useCallback } from "react";
import { AppState, AppStateStatus } from "react-native";
import { getSocket } from "../api/socket";
import { mapMatchStatus, XpUpdatePayload, BadgeAwardedPayload, ApiBadge } from "../api/types";
import { useMatchStore } from "../store/matchStore";
import { useUserStore } from "../store/userStore";
import { SOCKET } from "../utils/constants";

const LOG = (...args: unknown[]) => console.log("[Socket]", ...args);

export function useMatchSocket(
  matchId: string | null,
  teamId: string | null = null,
  options: { onBadgeAwarded?: (badge: ApiBadge) => void } = {},
) {
  const socketRef = useRef(getSocket());
  const reconnectAttempts = useRef(0);
  const boostTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const { setMomentum, setScores, setEventMode, addMatchEvent, setMatchStatus } =
    useMatchStore();
  const { userId, user, fanRole } = useUserStore();

  const resolvedUserId = userId ?? user?.id ?? null;

  const backendFanRole =
    fanRole === 'ultra' ? 'ULTRA_FAN'
    : fanRole === 'drummer' ? 'DRUMMER'
    : fanRole === 'chanter' ? 'CHANTER'
    : 'CASUAL';

  const stopHeartbeat = useCallback(() => {
    if (heartbeatRef.current) {
      clearInterval(heartbeatRef.current);
      heartbeatRef.current = null;
    }
  }, []);

  const startHeartbeat = useCallback(() => {
    stopHeartbeat();
    if (!matchId) return;
    heartbeatRef.current = setInterval(() => {
      const socket = socketRef.current;
      if (socket.connected) {
        socket.emit("heartbeat", { matchId });
      }
    }, SOCKET.HEARTBEAT_INTERVAL_MS);
  }, [matchId, stopHeartbeat]);

  const joinRoom = useCallback(() => {
    if (!matchId) {
      LOG("join_match skipped — no matchId");
      return;
    }
    const socket = socketRef.current;
    if (!socket.connected) {
      LOG("not connected — calling connect()");
      socket.connect();
    }
    LOG("emit join_match", { matchId, teamId, userId: resolvedUserId, fanRole: backendFanRole });
    socket.emit("join_match", { matchId, teamId, userId: resolvedUserId, fanRole: backendFanRole });
  }, [matchId, teamId, resolvedUserId, backendFanRole]);

  // Always-current ref so socket listeners never hold a stale joinRoom closure
  const joinRoomRef = useRef(joinRoom);
  joinRoomRef.current = joinRoom;

  const onBadgeAwardedRef = useRef(options.onBadgeAwarded);
  onBadgeAwardedRef.current = options.onBadgeAwarded;

  const leaveRoom = useCallback(() => {
    if (!matchId) return;
    LOG("emit leave_match", { matchId });
    socketRef.current.emit("leave_match", { matchId });
  }, [matchId]);

  useEffect(() => {
    const socket = socketRef.current;

    socket.on("connect", () => {
      LOG("connected — socket.id:", socket.id);
      reconnectAttempts.current = 0;
      joinRoomRef.current();
      startHeartbeat();
    });

    socket.on(
      "score_update",
      (data: {
        status?: string;
        scoreA: number;
        scoreB: number;
        teamAEnergy: number;
        teamBEnergy: number;
        momentumRatio: number;
      }) => {
        LOG("score_update", data);
        setMomentum(Math.round(data.momentumRatio * 100));
        setScores(data.scoreA, data.scoreB);
        if (data.status) setMatchStatus(mapMatchStatus(data.status));
      },
    );

    socket.on("match_event", (data: { type: string; teamId: string }) => {
      LOG("match_event", data);
      addMatchEvent(data);
      if (data.type === "goal") setEventMode("goal");
      else if (data.type === "clutch") setEventMode("clutch");
    });

    socket.on("match_status", (data: { matchId: string; status: string }) => {
      LOG("match_status", data);
      setMatchStatus(mapMatchStatus(data.status));
    });

    socket.on(
      "boost_activated",
      (data: { teamId: string; boostType: string; durationMs: number }) => {
        LOG("boost_activated", data);
        setEventMode("goal");
        if (boostTimerRef.current) clearTimeout(boostTimerRef.current);
        boostTimerRef.current = setTimeout(() => {
          setEventMode("normal");
          boostTimerRef.current = null;
        }, data.durationMs);
      },
    );

    socket.on("xp_update", (data: XpUpdatePayload) => {
      LOG("xp_update", data);
      useUserStore.getState().applyXpUpdate(data);
    });

    socket.on("badge_awarded", (data: BadgeAwardedPayload) => {
      LOG("badge_awarded", data);
      if (data.userId === resolvedUserId) {
        useUserStore.getState().addBadge(data.badge);
        onBadgeAwardedRef.current?.(data.badge);
      }
    });

    socket.on("disconnect", (reason) => {
      LOG("disconnected — reason:", reason);
      stopHeartbeat();
      const delay = Math.min(
        30000,
        1000 * Math.pow(2, reconnectAttempts.current),
      );
      reconnectAttempts.current++;
      LOG(`reconnecting in ${delay}ms (attempt ${reconnectAttempts.current})`);
      setTimeout(() => joinRoomRef.current(), delay);
    });

    socket.on("connect_error", (err) => {
      LOG("connect_error:", err.message);
    });

    // Attempt join immediately; guard inside joinRoom handles missing values
    joinRoomRef.current();

    const handleAppState = (state: AppStateStatus) => {
      LOG("AppState changed to:", state);
      if (state === "active") {
        joinRoomRef.current();
        startHeartbeat();
      } else {
        stopHeartbeat();
        leaveRoom();
      }
    };
    const sub = AppState.addEventListener("change", handleAppState);

    return () => {
      LOG("cleanup — leaving room, matchId:", matchId, "teamId:", teamId);
      if (boostTimerRef.current) clearTimeout(boostTimerRef.current);
      stopHeartbeat();
      leaveRoom();
      socket.off("connect");
      socket.off("score_update");
      socket.off("match_event");
      socket.off("match_status");
      socket.off("boost_activated");
      socket.off("xp_update");
      socket.off("badge_awarded");
      socket.off("disconnect");
      socket.off("connect_error");
      sub.remove();
    };
  }, [matchId, teamId, resolvedUserId, backendFanRole, startHeartbeat, stopHeartbeat]);

  const emitEnergy = useCallback(
    (amount: number, inputType: string) => {
      if (!matchId || !teamId) return;
      socketRef.current.emit("energy_batch", {
        matchId,
        teamId,
        amount,
        inputType,
        timestamp: Date.now(),
      });
    },
    [matchId, teamId],
  );

  const POWERUP_BACKEND_TYPE: Record<string, string> = {
    mega:   'MEGA_CHEER',
    shield: 'DOUBLE_ENERGY',
    steal:  'TEAM_BOOST',
  };

  const activatePowerUp = useCallback(
    (powerUpType: string) => {
      if (!matchId) return;
      const backendType = POWERUP_BACKEND_TYPE[powerUpType];
      if (!backendType) return;
      socketRef.current.emit(
        "activate_powerup",
        { matchId, type: backendType },
        (res: { ok: boolean; error?: string }) => {
          if (!res?.ok) {
            LOG("activate_powerup rejected by server:", res?.error);
          }
        },
      );
    },
    [matchId],
  );

  return { emitEnergy, activatePowerUp, leaveRoom };
}
