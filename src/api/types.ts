export interface ApiMatch {
  matchId: string;
  teamA: { id: string; code: string; name: string; flagUrl?: string };
  teamB: { id: string; code: string; name: string; flagUrl?: string };
  status: 'live' | 'upcoming' | 'finished';
  kickoffTime: string;
  stage: string;
  scores?: { teamA: number; teamB: number };
  momentumRatio?: number;
  minute?: number;
}

// Raw Prisma shapes returned by the backend
interface _BackendTeam {
  id: string;
  name: string;
  countryCode: string;
  flagUrl?: string | null;
}

interface _BackendMatchTotal {
  teamId: string;
  totalEnergy: number;
  momentumRatio: number;
}

export interface BackendMatch {
  id: string;
  teamA: _BackendTeam;
  teamB: _BackendTeam;
  status: string;
  startTime: string;
  sport: string;
  matchTotals?: _BackendMatchTotal[];
}

function _mapStatus(s: string): ApiMatch['status'] {
  if (s === 'LIVE' || s === 'HALF_TIME') return 'live';
  if (s === 'FULL_TIME' || s === 'CANCELLED') return 'finished';
  return 'upcoming';
}

export function mapMatch(m: BackendMatch): ApiMatch {
  const teamATotal = m.matchTotals?.find((t) => t.teamId === m.teamA.id);
  return {
    matchId: m.id,
    teamA: { id: m.teamA.id, code: m.teamA.countryCode, name: m.teamA.name, flagUrl: m.teamA.flagUrl ?? undefined },
    teamB: { id: m.teamB.id, code: m.teamB.countryCode, name: m.teamB.name, flagUrl: m.teamB.flagUrl ?? undefined },
    status: _mapStatus(m.status),
    kickoffTime: m.startTime,
    stage: m.sport,
    momentumRatio: teamATotal?.momentumRatio,
  };
}

export interface ApiUser {
  userId: string;
  displayName: string;
  phone: string;
  fanRole: string;
  teamKey: string;
  xp: number;
  level: number;
  badges: ApiBadge[];
  countryCode: string;
  cityCode: string;
}

export interface ApiBadge {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  earnedAt?: string;
}

export interface ApiLeaderboardEntry {
  rank: number;
  userId?: string;
  name: string;
  code: string;
  score: number;
  color: string;
  isYou?: boolean;
}

export interface ApiHistoryEntry {
  matchId: string;
  energyContributed: number;
  match: {
    id: string;
    teamA: { name: string };
    teamB: { name: string };
    startTime: string;
  };
}

export interface ApiRecap {
  matchId: string;
  energyDelivered: number;
  shakeEvents: number;
  tapCombos: number;
  rank: number;
  impactPercent: number;
  badgesUnlocked: ApiBadge[];
}
