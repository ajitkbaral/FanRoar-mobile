// Game constants — single source of truth for all thresholds and multipliers

export const SHAKE = {
  THRESHOLD_G: 2.5,
  COOLDOWN_MS: 300,
  SAMPLE_INTERVAL_MS: 16, // ~60Hz
} as const;

export const VOICE = {
  THRESHOLD_DB: 65,
  SAMPLE_INTERVAL_MS: 100,
} as const;

export const SOCKET = {
  HEARTBEAT_INTERVAL_MS: 15_000,
} as const;

export const ENERGY = {
  BATCH_WINDOW_MS: 500,
  MAX_BATCH_SIZE: 60,
  CAP_PER_MINUTE: 120,
  COMBO_RESET_MS: 1400,
  COMBO_FLAT_BONUS: 3, // shake+tap within 500ms
} as const;

export const MULTIPLIERS = {
  ULTRA_FAN:    1.5,
  DRUMMER:      1.2,
  CHANTER:      1.3,
  GOAL_BOOST:   2.0,
  CLUTCH_MODE:  3.0,
  GROUP_BONUS:  1.10,
  MEGA_CHEER:   10,
} as const;

export const POWER_UPS = {
  MEGA_CHEER_DURATION_MS:    10_000,
  MEGA_CHEER_COOLDOWN_MS:    3_600_000, // 60 min
  SHIELD_DURATION_MS:        5_000,
  SHIELD_COOLDOWN_MS:        2_700_000, // 45 min
  STEAL_COOLDOWN_MS:         120_000,   // 2 min
  STEAL_PERCENT:             0.05,
} as const;

export const MOMENTUM = {
  SURGE_THRESHOLD:    0.4, // heat level for "SURGE"
  TAKEOVER_THRESHOLD: 0.7, // heat level for "TAKEOVER"
  FIREWORKS_AT:       70,  // momentum % for fireworks
  TAKEOVER_AT:        85,  // momentum % for full takeover
} as const;

export type FanRole = 'ultra' | 'drummer' | 'chanter';
export type EventMode = 'normal' | 'goal' | 'clutch' | 'halftime';
export type PowerUpType = 'mega' | 'shield' | 'steal';
export type InputType = 'shake' | 'tap' | 'voice' | 'charge';
