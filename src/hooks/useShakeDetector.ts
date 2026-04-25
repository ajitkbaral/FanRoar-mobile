import { useEffect, useRef, useCallback } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { Accelerometer } from 'expo-sensors';
import * as Haptics from 'expo-haptics';
import { SHAKE } from '../utils/constants';

interface Options {
  onShake: () => void;
  enabled?: boolean;
}

export function useShakeDetector({ onShake, enabled = true }: Options) {
  const lastShakeAt = useRef(0);
  const subscriptionRef = useRef<ReturnType<typeof Accelerometer.addListener> | null>(null);

  const start = useCallback(() => {
    Accelerometer.setUpdateInterval(SHAKE.SAMPLE_INTERVAL_MS);
    subscriptionRef.current = Accelerometer.addListener(({ x, y, z }) => {
      const force = Math.sqrt(x * x + y * y + z * z);
      const now = Date.now();
      if (force > SHAKE.THRESHOLD_G && now - lastShakeAt.current > SHAKE.COOLDOWN_MS) {
        lastShakeAt.current = now;
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        onShake();
      }
    });
  }, [onShake]);

  const stop = useCallback(() => {
    subscriptionRef.current?.remove();
    subscriptionRef.current = null;
  }, []);

  useEffect(() => {
    if (!enabled) {
      stop();
      return;
    }
    start();

    const handleAppState = (state: AppStateStatus) => {
      if (state === 'active') {
        start();
      } else {
        stop();
      }
    };

    const sub = AppState.addEventListener('change', handleAppState);
    return () => {
      stop();
      sub.remove();
    };
  }, [enabled, start, stop]);
}
