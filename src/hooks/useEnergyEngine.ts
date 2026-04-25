import { useRef, useCallback } from 'react';
import { MULTIPLIERS, ENERGY, FanRole, EventMode, PowerUpType } from '../utils/constants';
import { useEnergyStore } from '../store/energyStore';

interface Options {
  role: FanRole;
  eventMode: EventMode;
  activePowerup: PowerUpType | null;
  onBatchReady: (amount: number, inputType: string) => void;
}

export function useEnergyEngine({ role, eventMode, activePowerup, onBatchReady }: Options) {
  const batchRef = useRef(0);
  const batchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const comboTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { addEnergy, setCombo, combo } = useEnergyStore();

  const getRoleMultiplier = (inputType: string): number => {
    if (role === 'ultra') return MULTIPLIERS.ULTRA_FAN;
    if (role === 'drummer' && inputType === 'tap') return MULTIPLIERS.DRUMMER;
    if (role === 'chanter' && inputType === 'voice') return MULTIPLIERS.CHANTER;
    return 1;
  };

  const getEventMultiplier = (): number => {
    if (eventMode === 'clutch') return MULTIPLIERS.CLUTCH_MODE;
    if (eventMode === 'goal') return MULTIPLIERS.GOAL_BOOST;
    return 1;
  };

  const getPowerMultiplier = (): number => {
    if (activePowerup === 'mega') return MULTIPLIERS.MEGA_CHEER;
    return 1;
  };

  const getTotalMultiplier = (inputType: string): number => {
    return getRoleMultiplier(inputType) * getEventMultiplier() * getPowerMultiplier();
  };

  const flushBatch = useCallback((inputType: string) => {
    if (batchRef.current <= 0) return;
    const capped = Math.min(batchRef.current, ENERGY.MAX_BATCH_SIZE);
    onBatchReady(capped, inputType);
    batchRef.current = 0;
  }, [onBatchReady]);

  const emitEnergy = useCallback((inputType: string, raw = 1) => {
    const mult = getTotalMultiplier(inputType);
    const gain = Math.round(raw * mult);

    // Update local state immediately (optimistic)
    addEnergy(gain);

    // Increment batch
    batchRef.current = Math.min(batchRef.current + gain, ENERGY.MAX_BATCH_SIZE);

    // Schedule batch flush
    if (batchTimerRef.current) clearTimeout(batchTimerRef.current);
    batchTimerRef.current = setTimeout(() => flushBatch(inputType), ENERGY.BATCH_WINDOW_MS);

    // Combo counter
    setCombo(c => c + 1);
    if (comboTimerRef.current) clearTimeout(comboTimerRef.current);
    comboTimerRef.current = setTimeout(() => setCombo(0), ENERGY.COMBO_RESET_MS);

    return gain;
  }, [role, eventMode, activePowerup, flushBatch]);

  const getMultiplierDisplay = (inputType = 'tap') => getTotalMultiplier(inputType);

  return { emitEnergy, getMultiplierDisplay };
}
