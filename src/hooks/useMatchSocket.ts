import { useEffect, useRef, useCallback } from "react";
import { AppState, AppStateStatus } from "react-native";
import { getSocket } from "../api/socket";
import { mapMatchStatus, XpUpdatePayload } from "../api/types";
import { useMatchStore } from "../store/matchStore";
import { useUserStore } from "../store/userStore";

const LOG = (...args: unknown[]) => console.log("[Socket]", ...args);

export function useMatchSocket(
  matchId: string | null,
  teamId: string | null = null,
) {
  const socketRef = useRef(getSocket());
  const reconnectAttempts = useRef(0);
  const { setMomentum, setScores, setEventMode, addMatchEvent, setMatchStatus } =
    useMatchStore();
  const { userId, user } = useUserStore();

  const resolvedUserId = userId ?? user?.id ?? null;

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
    LOG("emit join_match", { matchId, teamId, userId: resolvedUserId });
    socket.emit("join_match", { matchId, teamId, userId: resolvedUserId });
  }, [matchId, teamId, resolvedUserId]);

  // Always-current ref so socket listeners never hold a stale joinRoom closure
  const joinRoomRef = useRef(joinRoom);
  joinRoomRef.current = joinRoom;

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
      (data: { teamId: string; powerUpType: string; durationMs: number }) => {
        LOG("boost_activated", data);
      },
    );

    socket.on("xp_update", (data: XpUpdatePayload) => {
      LOG("xp_update", data);
      useUserStore.getState().applyXpUpdate(data);
    });

    socket.on("disconnect", (reason) => {
      LOG("disconnected — reason:", reason);
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
      if (state === "active") joinRoomRef.current();
      else leaveRoom();
    };
    const sub = AppState.addEventListener("change", handleAppState);

    return () => {
      LOG("cleanup — leaving room, matchId:", matchId, "teamId:", teamId);
      leaveRoom();
      socket.off("connect");
      socket.off("score_update");
      socket.off("match_event");
      socket.off("match_status");
      socket.off("boost_activated");
      socket.off("xp_update");
      socket.off("disconnect");
      socket.off("connect_error");
      sub.remove();
    };
  }, [matchId, teamId, resolvedUserId]);

  const emitEnergy = useCallback(
    (amount: number, inputType: string) => {
      if (!matchId) return;
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

  const activatePowerUp = useCallback(
    (powerUpType: string) => {
      if (!matchId) return;
      socketRef.current.emit("activate_powerup", {
        matchId,
        teamId: useUserStore.getState().teamId,
        powerUpType,
      });
    },
    [matchId],
  );

  return { emitEnergy, activatePowerUp, leaveRoom };
}
