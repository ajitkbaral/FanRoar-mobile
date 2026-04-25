import { create } from 'zustand';
import { EventMode } from '../utils/constants';

interface MatchEvent {
  type: string;
  teamId: string;
  timestamp: number;
}

export interface MatchTeam {
  id: string;
  code: string;
  name: string;
  flagUrl?: string;
}

export interface Match {
  id: string;
  teamA: MatchTeam;
  teamB: MatchTeam;
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
  supportingTeamId: string | null;

  setMatch: (match: Match) => void;
  setScores: (scoreA: number, scoreB: number) => void;
  setMomentum: (momentum: number | ((prev: number) => number)) => void;
  setEventMode: (mode: EventMode) => void;
  addMatchEvent: (event: Omit<MatchEvent, 'timestamp'>) => void;
  setFanCount: (count: number) => void;
  setSupportingTeamId: (id: string | null) => void;
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
  supportingTeamId: null,

  setMatch: (match) => set((s) => {
    const sameMatch = s.match?.id === match.id;
    return {
      match,
      scoreA: sameMatch ? s.scoreA : 0,
      scoreB: sameMatch ? s.scoreB : 0,
      momentum: sameMatch ? s.momentum : 50,
      eventMode: sameMatch ? s.eventMode : 'normal',
      supportingTeamId: sameMatch ? s.supportingTeamId : null,
    };
  }),
  setScores: (scoreA, scoreB) => set({ scoreA, scoreB }),
  setMomentum: (momentum) => set((s) => ({
    momentum: Math.max(0, Math.min(100, typeof momentum === 'function' ? momentum(s.momentum) : momentum)),
  })),
  setEventMode: (eventMode) => set({ eventMode }),
  addMatchEvent: (event) => set((s) => ({
    matchEvents: [{ ...event, timestamp: Date.now() }, ...s.matchEvents].slice(0, 50),
  })),
  setFanCount: (fanCount) => set({ fanCount }),
  setSupportingTeamId: (supportingTeamId) => set({ supportingTeamId }),
  resetMatch: () => set({
    match: null, scoreA: 0, scoreB: 0, momentum: 50, eventMode: 'normal', matchEvents: [], fanCount: 0, supportingTeamId: null,
  }),
}));
