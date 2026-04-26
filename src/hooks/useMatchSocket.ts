import { useEffect, useRef, useCallback } from "react";
import { AppState, AppStateStatus } from "react-native";
import { getSocket } from "../api/socket";
import { useMatchStore } from "../store/matchStore";
import { useUserStore } from "../store/userStore";

const LOG = (...args: unknown[]) => console.log("[Socket]", ...args);

export function useMatchSocket(
  matchId: string | null,
  teamId: string | null = null,
) {
  const socketRef = useRef(getSocket());
  const reconnectAttempts = useRef(0);
  const { setMomentum, setEventMode, addMatchEvent } =
    useMatchStore();
  const { userId, user } = useUserStore();

  const resolvedUserId = userId ?? user?.id ?? null;

  const joinRoom = useCallback(() => {
    // Wait until match, team, and user are all known before joining
    if (!matchId || !teamId || !resolvedUserId) {
      LOG("join_match skipped — missing", {
        matchId,
        teamId,
        userId: resolvedUserId,
      });
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
      joinRoom();
    });

    socket.on(
      "score_update",
      (data: {
        teamAEnergy: number;
        teamBEnergy: number;
        momentumRatio: number;
      }) => {
        LOG("score_update", data);
        setMomentum(Math.round(data.momentumRatio * 100));
      },
    );

    socket.on("match_event", (data: { type: string; teamId: string }) => {
      LOG("match_event", data);
      addMatchEvent(data);
      if (data.type === "goal") setEventMode("goal");
      else if (data.type === "clutch") setEventMode("clutch");
      else if (data.type === "halftime") setEventMode("halftime");
    });

    socket.on(
      "boost_activated",
      (data: { teamId: string; powerUpType: string; durationMs: number }) => {
        LOG("boost_activated", data);
      },
    );

    socket.on("disconnect", (reason) => {
      LOG("disconnected — reason:", reason);
      const delay = Math.min(
        30000,
        1000 * Math.pow(2, reconnectAttempts.current),
      );
      reconnectAttempts.current++;
      LOG(`reconnecting in ${delay}ms (attempt ${reconnectAttempts.current})`);
      setTimeout(() => joinRoom(), delay);
    });

    socket.on("connect_error", (err) => {
      LOG("connect_error:", err.message);
    });

    joinRoom();

    const handleAppState = (state: AppStateStatus) => {
      LOG("AppState changed to:", state);
      if (state === "active") joinRoom();
      else leaveRoom();
    };
    const sub = AppState.addEventListener("change", handleAppState);

    return () => {
      LOG("cleanup — leaving room, matchId:", matchId, "teamId:", teamId);
      leaveRoom();
      socket.off("connect");
      socket.off("score_update");
      socket.off("match_event");
      socket.off("boost_activated");
      socket.off("disconnect");
      socket.off("connect_error");
      sub.remove();
    };
  }, [matchId, teamId]);

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

  return { emitEnergy, activatePowerUp };
}
