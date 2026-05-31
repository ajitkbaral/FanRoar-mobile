import { useEffect, useRef } from "react";
import { useMatchStore } from "../store/matchStore";
import { useEnergyStore } from "../store/energyStore";
import type { Match } from "../store/matchStore";

const DEMO_MATCH: Match = {
  id: "__demo__",
  teamA: { id: "demo-bra", code: "BRA", name: "Brazil", flagUrl: undefined },
  teamB: { id: "demo-arg", code: "ARG", name: "Argentina", flagUrl: undefined },
  status: "live",
  minute: 32,
  stage: "Group Stage",
  tournament: {
    name: "FIFA World Cup 2026",
    shortName: "WC 2026",
    logoUrl: undefined,
  },
};

type PhaseName = "gentle" | "goal" | "cooldown" | "halftime" | "extratime" | "penalties";

interface DemoPhase {
  name: PhaseName;
  durationMs: number;
}

const DEMO_PHASES: DemoPhase[] = [
  { name: "gentle",    durationMs: 10_000 },
  { name: "goal",      durationMs: 30_000 },
  { name: "cooldown",  durationMs: 20_000 },
  { name: "halftime",  durationMs: 10_000 },
  { name: "extratime", durationMs: 15_000 },
  { name: "penalties", durationMs: 10_000 },
];

const DEMO_CYCLE_MS = DEMO_PHASES.reduce((acc, p) => acc + p.durationMs, 0);

export function useDemoMode(enabled: boolean): void {
  const {
    setMatch,
    setScores,
    setPenaltyScores,
    setMomentum,
    setEventMode,
    setMatchStatus,
    setSupportingTeamId,
    resetMatch,
  } = useMatchStore();
  const { resetSession } = useEnergyStore();

  const elapsedRef = useRef(0);
  const lastPhaseNameRef = useRef<PhaseName | null>(null);

  useEffect(() => {
    if (!enabled) return;

    setMatch(DEMO_MATCH);
    setScores(1, 0);
    setMomentum(55);
    setSupportingTeamId("demo-bra");
    setEventMode("normal");
    elapsedRef.current = 0;
    lastPhaseNameRef.current = null;

    const interval = setInterval(() => {
      elapsedRef.current += 100;

      if (elapsedRef.current >= DEMO_CYCLE_MS) {
        elapsedRef.current = 0;
        lastPhaseNameRef.current = null;
        setMatchStatus("live");
        setEventMode("normal");
        setMomentum(55);
        setPenaltyScores(0, 0);
        return;
      }

      let cursor = 0;
      let currentPhase = DEMO_PHASES[0];
      let phaseStart = 0;
      for (const phase of DEMO_PHASES) {
        if (elapsedRef.current < cursor + phase.durationMs) {
          currentPhase = phase;
          phaseStart = cursor;
          break;
        }
        cursor += phase.durationMs;
      }
      const phaseElapsed = elapsedRef.current - phaseStart;

      const isNewPhase = lastPhaseNameRef.current !== currentPhase.name;
      if (isNewPhase) {
        lastPhaseNameRef.current = currentPhase.name;
      }

      switch (currentPhase.name) {
        case "gentle": {
          const angle = (phaseElapsed / 10_000) * Math.PI * 4;
          const delta = Math.sin(angle) * 0.3;
          setMomentum((m) => Math.max(0, Math.min(100, m + delta)));
          break;
        }
        case "goal": {
          if (isNewPhase) setEventMode("goal");
          setMomentum((m) => Math.max(0, Math.min(100, m + (70 - m) * 0.01)));
          break;
        }
        case "cooldown": {
          if (isNewPhase) setEventMode("normal");
          setMomentum((m) => Math.max(0, Math.min(100, m + (55 - m) * 0.015)));
          break;
        }
        case "halftime": {
          if (isNewPhase) {
            setMatchStatus("halftime");
            setEventMode("halftime");
          }
          break;
        }
        case "extratime": {
          if (isNewPhase) {
            setMatchStatus("extratime");
            setEventMode("normal");
          }
          const angle = (phaseElapsed / 15_000) * Math.PI * 4;
          setMomentum((m) => Math.max(0, Math.min(100, m + Math.sin(angle) * 0.4)));
          break;
        }
        case "penalties": {
          if (isNewPhase) {
            setMatchStatus("penalties");
            setEventMode("normal");
            setPenaltyScores(4, 3);
          }
          break;
        }
      }
    }, 100);

    return () => {
      clearInterval(interval);
      resetMatch();
      resetSession();
    };
  }, [enabled]);
}
