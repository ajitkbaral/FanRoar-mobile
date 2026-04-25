import { useEffect, useRef, useCallback } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { getSocket } from '../api/socket';
import { useMatchStore } from '../store/matchStore';
import { useUserStore } from '../store/userStore';

export function useMatchSocket(matchId: string | null) {
  const socketRef = useRef(getSocket());
  const reconnectAttempts = useRef(0);
  const { setScores, setMomentum, setEventMode, addMatchEvent } = useMatchStore();
  const { userId } = useUserStore();

  const joinRoom = useCallback(() => {
    if (!matchId || !userId) return;
    const socket = socketRef.current;
    if (!socket.connected) socket.connect();
    socket.emit('join_match', { matchId, userId });
  }, [matchId, userId]);

  const leaveRoom = useCallback(() => {
    if (!matchId) return;
    socketRef.current.emit('leave_match', { matchId });
  }, [matchId]);

  useEffect(() => {
    const socket = socketRef.current;

    socket.on('connect', () => {
      reconnectAttempts.current = 0;
      joinRoom();
    });

    socket.on('score_update', (data: {
      teamA_score: number;
      teamB_score: number;
      momentumRatio: number;
    }) => {
      setScores(data.teamA_score, data.teamB_score);
      setMomentum(Math.round(data.momentumRatio * 100));
    });

    socket.on('match_event', (data: { type: string; teamId: string }) => {
      addMatchEvent(data);
      if (data.type === 'goal') setEventMode('goal');
      else if (data.type === 'clutch') setEventMode('clutch');
      else if (data.type === 'halftime') setEventMode('halftime');
    });

    socket.on('boost_activated', (data: { teamId: string; powerUpType: string; durationMs: number }) => {
      // handled by energy store
    });

    socket.on('disconnect', () => {
      const delay = Math.min(30000, 1000 * Math.pow(2, reconnectAttempts.current));
      reconnectAttempts.current++;
      setTimeout(() => joinRoom(), delay);
    });

    joinRoom();

    const handleAppState = (state: AppStateStatus) => {
      if (state === 'active') joinRoom();
      else leaveRoom();
    };
    const sub = AppState.addEventListener('change', handleAppState);

    return () => {
      leaveRoom();
      socket.off('connect');
      socket.off('score_update');
      socket.off('match_event');
      socket.off('boost_activated');
      socket.off('disconnect');
      sub.remove();
    };
  }, [matchId]);

  const emitEnergy = useCallback((amount: number, inputType: string) => {
    if (!matchId) return;
    socketRef.current.emit('energy_batch', {
      matchId,
      teamId: useUserStore.getState().teamId,
      amount,
      inputType,
      timestamp: Date.now(),
    });
  }, [matchId]);

  const activatePowerUp = useCallback((powerUpType: string) => {
    if (!matchId) return;
    socketRef.current.emit('activate_powerup', {
      matchId,
      teamId: useUserStore.getState().teamId,
      powerUpType,
    });
  }, [matchId]);

  return { emitEnergy, activatePowerUp };
}
