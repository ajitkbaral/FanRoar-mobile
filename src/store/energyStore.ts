import { create } from 'zustand';
import { PowerUpType } from '../utils/constants';
import { POWER_UPS } from '../utils/constants';

interface PowerUpState {
  type: PowerUpType;
  activatedAt: number;
  durationMs: number;
}

interface EnergyState {
  myEnergy: number;
  combo: number;
  activePowerup: PowerUpType | null;
  powerupState: PowerUpState | null;
  cooldowns: Partial<Record<PowerUpType, number>>;

  addEnergy: (amount: number) => void;
  setCombo: (combo: number | ((prev: number) => number)) => void;
  activatePowerup: (type: PowerUpType) => void;
  deactivatePowerup: () => void;
  resetSession: () => void;
}

export const useEnergyStore = create<EnergyState>((set, get) => ({
  myEnergy: 0,
  combo: 0,
  activePowerup: null,
  powerupState: null,
  cooldowns: {},

  addEnergy: (amount) => set((s) => ({ myEnergy: s.myEnergy + amount })),

  setCombo: (comboOrFn) => set((s) => ({
    combo: typeof comboOrFn === 'function' ? comboOrFn(s.combo) : comboOrFn,
  })),

  activatePowerup: (type) => {
    const now = Date.now();
    const durations: Record<PowerUpType, number> = {
      mega:   POWER_UPS.MEGA_CHEER_DURATION_MS,
      shield: POWER_UPS.SHIELD_DURATION_MS,
      steal:  3000,
    };
    const cooldownMs: Record<PowerUpType, number> = {
      mega:   POWER_UPS.MEGA_CHEER_COOLDOWN_MS,
      shield: POWER_UPS.SHIELD_COOLDOWN_MS,
      steal:  POWER_UPS.STEAL_COOLDOWN_MS,
    };
    set({
      activePowerup: type,
      powerupState: { type, activatedAt: now, durationMs: durations[type] },
      cooldowns: { ...get().cooldowns, [type]: now + cooldownMs[type] },
    });
    setTimeout(() => {
      set({ activePowerup: null, powerupState: null });
    }, durations[type]);
  },

  deactivatePowerup: () => set({ activePowerup: null, powerupState: null }),

  resetSession: () => set({ myEnergy: 0, combo: 0, activePowerup: null, powerupState: null }),
}));
