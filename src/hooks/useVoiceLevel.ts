import { useEffect, useRef, useCallback, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { Audio } from 'expo-av';
import { VOICE } from '../utils/constants';

interface Options {
  onVoiceHit: () => void;
  enabled?: boolean;
}

export function useVoiceLevel({ onVoiceHit, enabled = false }: Options) {
  const recordingRef = useRef<Audio.Recording | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [level, setLevel] = useState(0);

  const start = useCallback(async () => {
    try {
      await Audio.requestPermissionsAsync();
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      const { recording } = await Audio.Recording.createAsync({
        ...Audio.RecordingOptionsPresets.HIGH_QUALITY,
        isMeteringEnabled: true,
      });
      recordingRef.current = recording;

      pollRef.current = setInterval(async () => {
        const status = await recording.getStatusAsync();
        if (status.isRecording) {
          const db = status.metering ?? -160;
          const normalized = Math.max(0, (db + 160) / 160 * 100);
          setLevel(normalized);
          // >65dB approximates to ~normalized > 60
          if (normalized > 60) {
            onVoiceHit();
          }
        }
      }, VOICE.SAMPLE_INTERVAL_MS);
    } catch {
      // Silently fail if permission denied
    }
  }, [onVoiceHit]);

  const stop = useCallback(async () => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
    if (recordingRef.current) {
      try {
        await recordingRef.current.stopAndUnloadAsync();
      } catch {}
      recordingRef.current = null;
    }
    setLevel(0);
  }, []);

  useEffect(() => {
    if (!enabled) {
      stop();
      return;
    }
    start();

    const handleAppState = (state: AppStateStatus) => {
      if (state === 'active') start();
      else stop();
    };
    const sub = AppState.addEventListener('change', handleAppState);
    return () => {
      stop();
      sub.remove();
    };
  }, [enabled]);

  return { level };
}
