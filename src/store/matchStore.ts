import { create } from 'zustand';
import { EventMode } from '../utils/constants';

interface MatchEvent {
  type: string;
  teamId: string;
  timestamp: number;
}

interface Match {
  id: string;
  teamA: string;
  teamB: string;
  status: 'live' | 'upcoming' | 'finished';
  minute?: number;
  stage?: string;
}

interface MatchState {
  match: Match | null;
  scoreA: number;
  scoreB: number;
  momentum: number; // 0–100, teamA = left
  eventMode: EventMode;
  matchEvents: MatchEvent[];
  fanCount: number;

  setMatch: (match: Match) => void;
  setScores: (scoreA: number, scoreB: number) => void;
  setMomentum: (momentum: number) => void;
  setEventMode: (mode: EventMode) => void;
  addMatchEvent: (event: Omit<MatchEvent, 'timestamp'>) => void;
  setFanCount: (count: number) => void;
  resetMatch: () => void;
}

export const useMatchStore = create<MatchState>((set) => ({
  match: null,
  scoreA: 0,
  scoreB: 0,
  momentum: 50,
  eventMode: 'normal',
  matchEvents: [],
  fanCount: 0,

  setMatch: (match) => set({ match, scoreA: 0, scoreB: 0, momentum: 50, eventMode: 'normal' }),
  setScores: (scoreA, scoreB) => set({ scoreA, scoreB }),
  setMomentum: (momentum) => set({ momentum: Math.max(0, Math.min(100, momentum)) }),
  setEventMode: (eventMode) => set({ eventMode }),
  addMatchEvent: (event) => set((s) => ({
    matchEvents: [{ ...event, timestamp: Date.now() }, ...s.matchEvents].slice(0, 50),
  })),
  setFanCount: (fanCount) => set({ fanCount }),
  resetMatch: () => set({
    match: null, scoreA: 0, scoreB: 0, momentum: 50, eventMode: 'normal', matchEvents: [], fanCount: 0,
  }),
}));
