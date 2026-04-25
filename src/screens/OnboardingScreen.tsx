import React, { useRef, useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  TextInput, KeyboardAvoidingView, Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation';
import { buildTheme, Theme } from '../theme';
import { TeamKey } from '../theme/colors';
import { useUserStore } from '../store/userStore';
import { FanRole } from '../utils/constants';
import { api } from '../api/client';
import FRMark from '../components/shared/FRMark';
import FRIcon from '../components/shared/FRIcon';

type Props = NativeStackScreenProps<RootStackParamList, 'Onboarding'>;

// ─── Countries ───────────────────────────────────────────────────────────────

interface Country {
  code: string;
  dial: string;
  name: string;
  emoji: string;
}

const COUNTRIES: Country[] = [
  { code: 'BR', dial: '+55', name: 'Brazil',         emoji: '🇧🇷' },
  { code: 'AR', dial: '+54', name: 'Argentina',      emoji: '🇦🇷' },
  { code: 'US', dial: '+1',  name: 'United States',  emoji: '🇺🇸' },
  { code: 'GB', dial: '+44', name: 'United Kingdom', emoji: '🇬🇧' },
  { code: 'IN', dial: '+91', name: 'India',          emoji: '🇮🇳' },
  { code: 'DE', dial: '+49', name: 'Germany',        emoji: '🇩🇪' },
  { code: 'FR', dial: '+33', name: 'France',         emoji: '🇫🇷' },
  { code: 'ES', dial: '+34', name: 'Spain',          emoji: '🇪🇸' },
  { code: 'MX', dial: '+52', name: 'Mexico',         emoji: '🇲🇽' },
  { code: 'JP', dial: '+81', name: 'Japan',          emoji: '🇯🇵' },
];

// ─── Shared: StepHeader ───────────────────────────────────────────────────────

interface StepHeaderProps {
  theme: Theme;
  step: number;
  total: number;
  onBack?: () => void;
  title: string;
  sub?: string;
  topInset: number;
}

function StepHeader({ theme, step, total, onBack, title, sub, topInset }: StepHeaderProps) {
  return (
    <>
      <View style={{
        paddingTop: topInset + 16,
        paddingHorizontal: 20,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        {step > 1 ? (
          <TouchableOpacity
            onPress={onBack}
            style={{
              width: 40, height: 40, borderRadius: 12,
              backgroundColor: theme.surface,
              borderWidth: 0.5, borderColor: theme.border,
              alignItems: 'center', justifyContent: 'center',
            }}
          >
            <FRIcon name="back" size={14} color={theme.text} strokeWidth={2} />
          </TouchableOpacity>
        ) : <View style={{ width: 40 }} />}

        <Text style={{
          fontFamily: 'JetBrainsMono_600SemiBold',
          fontSize: 11,
          color: theme.textMute,
          letterSpacing: 1.2,
        }}>
          STEP {String(step).padStart(2, '0')} / {String(total).padStart(2, '0')}
        </Text>

        <FRMark size={18} color={theme.text} />
      </View>

      {/* Progress dashes */}
      <View style={{
        paddingHorizontal: 20,
        paddingTop: 14,
        flexDirection: 'row',
        gap: 4,
      }}>
        {Array.from({ length: total }).map((_, i) => (
          <View key={i} style={{
            flex: 1,
            height: 3,
            borderRadius: 3,
            backgroundColor: i < step ? theme.accent : theme.surface2,
          }} />
        ))}
      </View>

      {/* Title */}
      <View style={{ paddingHorizontal: 20, paddingTop: 32 }}>
        <Text style={{
          fontFamily: 'InterTight_700Bold',
          fontSize: 32,
          color: theme.text,
          letterSpacing: -1.2,
          lineHeight: 34,
        }}>
          {title}
        </Text>
        {sub ? (
          <Text style={{
            marginTop: 10,
            fontSize: 14,
            color: theme.textDim,
            lineHeight: 20,
            maxWidth: 300,
          }}>
            {sub}
          </Text>
        ) : null}
      </View>
    </>
  );
}

// ─── Shared: StepCTA ──────────────────────────────────────────────────────────

interface StepCTAProps {
  theme: Theme;
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  hint?: string;
  error?: string;
}

function StepCTA({ theme, label, onPress, disabled = false, loading = false, hint, error }: StepCTAProps) {
  const blocked = disabled || loading;
  return (
    <View style={{ paddingHorizontal: 20, paddingBottom: 28, marginTop: 'auto' as any }}>
      <TouchableOpacity
        onPress={blocked ? undefined : onPress}
        activeOpacity={blocked ? 1 : 0.85}
        style={{
          height: 56,
          borderRadius: 16,
          backgroundColor: blocked ? theme.surface2 : theme.accent,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          opacity: blocked ? 0.6 : 1,
        }}
      >
        <Text style={{
          fontFamily: 'InterTight_700Bold',
          fontSize: 16,
          color: blocked ? theme.textMute : theme.bg,
          letterSpacing: -0.2,
        }}>
          {loading ? '···' : label}
        </Text>
        {!blocked && <FRIcon name="arrow" size={18} color={theme.bg} strokeWidth={2.4} />}
      </TouchableOpacity>
      {error ? (
        <Text style={{
          marginTop: 10,
          textAlign: 'center',
          fontFamily: 'JetBrainsMono_400Regular',
          fontSize: 11,
          color: theme.danger,
          letterSpacing: 0.3,
        }}>
          {error}
        </Text>
      ) : hint ? (
        <Text style={{
          marginTop: 12,
          textAlign: 'center',
          fontFamily: 'JetBrainsMono_400Regular',
          fontSize: 10,
          color: theme.textMute,
          letterSpacing: 0.5,
        }}>
          {hint}
        </Text>
      ) : null}
    </View>
  );
}

// ─── Country Picker Overlay ───────────────────────────────────────────────────

interface CountryPickerProps {
  theme: Theme;
  onPick: (c: Country) => void;
  onClose: () => void;
  topInset: number;
}

function CountryPicker({ theme, onPick, onClose, topInset }: CountryPickerProps) {
  const [query, setQuery] = useState('');
  const filtered = COUNTRIES.filter(c =>
    c.name.toLowerCase().includes(query.toLowerCase()) || c.dial.includes(query)
  );

  return (
    <View style={{
      position: 'absolute',
      top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: theme.bg,
      zIndex: 100,
    }}>
      {/* Header */}
      <View style={{
        paddingTop: topInset + 16,
        paddingHorizontal: 20,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <Text style={{
          fontFamily: 'InterTight_700Bold',
          fontSize: 22,
          color: theme.text,
          letterSpacing: -0.5,
        }}>
          Country
        </Text>
        <TouchableOpacity
          onPress={onClose}
          style={{
            width: 40, height: 40, borderRadius: 12,
            backgroundColor: theme.surface,
            borderWidth: 0.5, borderColor: theme.border,
            alignItems: 'center', justifyContent: 'center',
          }}
        >
          <FRIcon name="close" size={16} color={theme.text} />
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 }}>
        <View style={{
          height: 44, borderRadius: 12,
          paddingHorizontal: 12,
          backgroundColor: theme.surface,
          borderWidth: 0.5, borderColor: theme.border,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
        }}>
          <FRIcon name="search" size={16} color={theme.textMute} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search country or code"
            placeholderTextColor={theme.textMute}
            style={{
              flex: 1,
              fontFamily: 'InterTight_400Regular',
              fontSize: 14,
              color: theme.text,
            }}
          />
        </View>
      </View>

      {/* List */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled"
      >
        {filtered.map(c => (
          <TouchableOpacity
            key={c.code}
            onPress={() => { onPick(c); onClose(); }}
            activeOpacity={0.7}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12,
              paddingVertical: 12,
              paddingHorizontal: 4,
              borderBottomWidth: 0.5,
              borderBottomColor: theme.border,
            }}
          >
            <Text style={{ fontSize: 22 }}>{c.emoji}</Text>
            <Text style={{
              flex: 1,
              fontFamily: 'InterTight_400Regular',
              fontSize: 15,
              color: theme.text,
            }}>
              {c.name}
            </Text>
            <Text style={{
              fontFamily: 'JetBrainsMono_600SemiBold',
              fontSize: 13,
              color: theme.textMute,
            }}>
              {c.dial}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

// ─── Step 1: Phone ────────────────────────────────────────────────────────────

interface PhoneStepProps {
  theme: Theme;
  topInset: number;
  country: Country;
  phone: string;
  setPhone: (v: string) => void;
  onNext: () => void;
  onPickerOpen: () => void;
  loading?: boolean;
  error?: string;
}

function PhoneStep({ theme, topInset, country, phone, setPhone, onNext, onPickerOpen, loading, error }: PhoneStepProps) {
  const valid = phone.replace(/\D/g, '').length >= 8;

  return (
    <View style={{ flex: 1 }}>
      <StepHeader
        theme={theme}
        step={1} total={4}
        topInset={topInset}
        title={'Sign in.\nGet loud.'}
        sub="We'll text you a 6-digit code. No password to remember."
      />

      <View style={{ paddingHorizontal: 20, paddingTop: 32 }}>
        <Text style={{
          fontFamily: 'JetBrainsMono_400Regular',
          fontSize: 10,
          color: theme.textMute,
          letterSpacing: 1,
          textTransform: 'uppercase',
          marginBottom: 8,
        }}>
          Phone number
        </Text>

        <View style={{ flexDirection: 'row', gap: 10 }}>
          {/* Country picker button */}
          <TouchableOpacity
            onPress={onPickerOpen}
            activeOpacity={0.75}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 8,
              height: 60,
              paddingHorizontal: 14,
              borderRadius: 14,
              backgroundColor: theme.surface,
              borderWidth: 0.5,
              borderColor: theme.border,
              minWidth: 110,
            }}
          >
            <Text style={{ fontSize: 22, lineHeight: 28 }}>{country.emoji}</Text>
            <Text style={{
              fontFamily: 'JetBrainsMono_700Bold',
              fontSize: 15,
              color: theme.text,
            }}>
              {country.dial}
            </Text>
            <FRIcon name="chevron-down" size={12} color={theme.textMute} strokeWidth={2} />
          </TouchableOpacity>

          {/* Number input */}
          <View style={{
            flex: 1,
            height: 60,
            paddingHorizontal: 14,
            borderRadius: 14,
            backgroundColor: theme.surface,
            borderWidth: 0.5,
            borderColor: valid ? theme.accent : theme.border,
            justifyContent: 'center',
          }}>
            <TextInput
              value={phone}
              onChangeText={(t) => setPhone(t.replace(/[^\d\s\-()+]/g, ''))}
              placeholder="98 7654-3210"
              placeholderTextColor={theme.textMute}
              keyboardType="phone-pad"
              style={{
                fontFamily: 'JetBrainsMono_600SemiBold',
                fontSize: 17,
                color: theme.text,
                letterSpacing: 0.3,
              }}
            />
          </View>
        </View>

        {/* Terms notice */}
        <View style={{
          marginTop: 18,
          padding: 12,
          borderRadius: 12,
          borderWidth: 1,
          borderStyle: 'dashed',
          borderColor: theme.border,
        }}>
          <Text style={{
            fontFamily: 'JetBrainsMono_400Regular',
            fontSize: 11,
            color: theme.textDim,
            letterSpacing: 0.3,
            lineHeight: 16,
          }}>
            By continuing you agree to FanRoar's terms · We'll never post or call without permission.
          </Text>
        </View>
      </View>

      <View style={{ flex: 1 }} />
      <StepCTA
        theme={theme}
        label="Send code"
        onPress={onNext}
        disabled={!valid}
        loading={loading}
        error={error}
        hint={valid ? `Code will be sent to ${country.dial} ${phone}` : 'Enter a valid number to continue'}
      />
    </View>
  );
}

// ─── Step 2: OTP ──────────────────────────────────────────────────────────────

interface OTPStepProps {
  theme: Theme;
  topInset: number;
  country: Country;
  phone: string;
  otp: string;
  setOtp: (v: string) => void;
  onNext: () => void;
  onBack: () => void;
  onResend: () => void;
  loading?: boolean;
  error?: string;
}

function OTPStep({ theme, topInset, country, phone, otp, setOtp, onNext, onBack, onResend, loading, error }: OTPStepProps) {
  const valid = otp.length === 6;
  const inputRef = useRef<TextInput>(null);
  const [resendIn, setResendIn] = useState(28);
  const [tick, setTick] = useState(true);

  useEffect(() => {
    if (resendIn <= 0) return;
    const t = setTimeout(() => setResendIn(r => r - 1), 1000);
    return () => clearTimeout(t);
  }, [resendIn]);

  useEffect(() => {
    const t = setInterval(() => setTick(v => !v), 530);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 150);
    return () => clearTimeout(t);
  }, []);

  return (
    <View style={{ flex: 1 }}>
      <StepHeader
        theme={theme}
        step={2} total={4}
        topInset={topInset}
        onBack={onBack}
        title={'Enter the\n6-digit code.'}
        sub={`Sent to ${country.dial} ${phone} · Expires in 10 min`}
      />

      <TouchableOpacity
        activeOpacity={1}
        onPress={() => inputRef.current?.focus()}
        style={{ paddingHorizontal: 20, paddingTop: 32 }}
      >
        {/* Hidden driver input */}
        <TextInput
          ref={inputRef}
          value={otp}
          onChangeText={(t) => setOtp(t.replace(/\D/g, '').slice(0, 6))}
          keyboardType="number-pad"
          maxLength={6}
          style={{ position: 'absolute', opacity: 0, width: 1, height: 1 }}
        />

        {/* 6 cells */}
        <View style={{ flexDirection: 'row', gap: 8, justifyContent: 'space-between' }}>
          {Array.from({ length: 6 }).map((_, i) => {
            const digit = otp[i] ?? '';
            const focused = otp.length === i;
            const filled = digit !== '';
            return (
              <View
                key={i}
                style={{
                  flex: 1,
                  maxWidth: 50,
                  height: 58,
                  borderRadius: 12,
                  backgroundColor: filled ? theme.surface : theme.surface2,
                  borderWidth: 1.5,
                  borderColor: focused ? theme.accent : filled ? theme.borderStrong : theme.border,
                  alignItems: 'center',
                  justifyContent: 'center',
                  shadowColor: focused ? theme.accent : 'transparent',
                  shadowOffset: { width: 0, height: 0 },
                  shadowOpacity: focused ? 0.35 : 0,
                  shadowRadius: focused ? 8 : 0,
                }}
              >
                {filled ? (
                  <Text style={{
                    fontFamily: 'JetBrainsMono_700Bold',
                    fontSize: 26,
                    color: theme.text,
                  }}>
                    {digit}
                  </Text>
                ) : focused && tick ? (
                  <View style={{ width: 2, height: 22, backgroundColor: theme.accent }} />
                ) : null}
              </View>
            );
          })}
        </View>

        {/* Resend row */}
        <View style={{
          marginTop: 22,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <Text style={{
            fontFamily: 'JetBrainsMono_400Regular',
            fontSize: 12,
            color: theme.textMute,
            letterSpacing: 0.3,
          }}>
            {resendIn > 0 ? `Resend in 0:${String(resendIn).padStart(2, '0')}` : ''}
          </Text>
          <TouchableOpacity
            onPress={() => { if (resendIn === 0) { setResendIn(28); onResend(); } }}
            disabled={resendIn > 0}
          >
            <Text style={{
              fontFamily: 'JetBrainsMono_600SemiBold',
              fontSize: 12,
              color: resendIn === 0 ? theme.accent : theme.textMute,
              letterSpacing: 0.3,
            }}>
              Resend code
            </Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>

      <View style={{ flex: 1 }} />
      <StepCTA
        theme={theme}
        label="Verify"
        onPress={onNext}
        disabled={!valid}
        loading={loading}
        error={error}
      />
    </View>
  );
}

// ─── Step 3: Display Name ─────────────────────────────────────────────────────

const NAME_SUGGESTIONS = ['AKB', 'BRA-12', 'verde47', 'samba.gold'];

interface DisplayNameStepProps {
  theme: Theme;
  topInset: number;
  displayName: string;
  setDisplayName: (v: string) => void;
  onNext: () => void;
  onBack: () => void;
}

function DisplayNameStep({ theme, topInset, displayName, setDisplayName, onNext, onBack }: DisplayNameStepProps) {
  const valid = displayName.trim().length >= 2 && displayName.trim().length <= 16;

  return (
    <View style={{ flex: 1 }}>
      <StepHeader
        theme={theme}
        step={3} total={4}
        topInset={topInset}
        onBack={onBack}
        title={'How should\nfans know you?'}
        sub="Shows on leaderboards and shareable cards. You can change it later."
      />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 32 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={{
          fontFamily: 'JetBrainsMono_400Regular',
          fontSize: 10,
          color: theme.textMute,
          letterSpacing: 1,
          textTransform: 'uppercase',
          marginBottom: 8,
        }}>
          Display name
        </Text>

        {/* Input */}
        <View style={{
          height: 60,
          paddingHorizontal: 14,
          borderRadius: 14,
          backgroundColor: theme.surface,
          borderWidth: 0.5,
          borderColor: valid ? theme.accent : theme.border,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
        }}>
          <Text style={{
            fontFamily: 'JetBrainsMono_700Bold',
            fontSize: 17,
            color: theme.textMute,
          }}>@</Text>
          <TextInput
            value={displayName}
            onChangeText={(t) => setDisplayName(t.replace(/[^a-zA-Z0-9._-]/g, '').slice(0, 16))}
            placeholder="AKB"
            placeholderTextColor={theme.textMute}
            autoCapitalize="none"
            autoCorrect={false}
            style={{
              flex: 1,
              fontFamily: 'JetBrainsMono_600SemiBold',
              fontSize: 17,
              color: theme.text,
            }}
          />
          <Text style={{
            fontFamily: 'JetBrainsMono_400Regular',
            fontSize: 11,
            color: theme.textMute,
          }}>
            {displayName.length}/16
          </Text>
        </View>

        <Text style={{
          marginTop: 8,
          fontFamily: 'JetBrainsMono_400Regular',
          fontSize: 10,
          color: theme.textMute,
          letterSpacing: 0.3,
          lineHeight: 15,
        }}>
          A–Z, 0–9, dot, dash, underscore · 2–16 characters
        </Text>

        {/* Suggestions */}
        <Text style={{
          marginTop: 22,
          fontFamily: 'JetBrainsMono_400Regular',
          fontSize: 10,
          color: theme.textMute,
          letterSpacing: 1,
          textTransform: 'uppercase',
          marginBottom: 8,
        }}>
          Suggested
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {NAME_SUGGESTIONS.map(s => {
            const active = displayName === s;
            return (
              <TouchableOpacity
                key={s}
                onPress={() => setDisplayName(s)}
                activeOpacity={0.75}
                style={{
                  paddingVertical: 8,
                  paddingHorizontal: 14,
                  borderRadius: 999,
                  backgroundColor: active ? theme.accent : theme.surface,
                  borderWidth: 0.5,
                  borderColor: active ? theme.accent : theme.border,
                }}
              >
                <Text style={{
                  fontFamily: 'JetBrainsMono_600SemiBold',
                  fontSize: 13,
                  color: active ? theme.bg : theme.text,
                }}>
                  @{s}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Leaderboard preview */}
        <Text style={{
          marginTop: 28,
          fontFamily: 'JetBrainsMono_400Regular',
          fontSize: 10,
          color: theme.textMute,
          letterSpacing: 1,
          textTransform: 'uppercase',
          marginBottom: 8,
        }}>
          Preview · leaderboard row
        </Text>
        <View style={{
          borderRadius: 14,
          overflow: 'hidden',
          borderWidth: 0.5,
          borderColor: theme.accent,
        }}>
          <LinearGradient
            colors={[theme.accent + '22', theme.accent + '06']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              padding: 12,
              gap: 10,
            }}
          >
            <Text style={{
              width: 24,
              fontFamily: 'JetBrainsMono_700Bold',
              fontSize: 12,
              color: theme.textDim,
              textAlign: 'center',
            }}>
              312
            </Text>
            <View style={{
              width: 28, height: 28,
              borderRadius: 8,
              backgroundColor: theme.accent,
            }} />
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={{
                  fontFamily: 'InterTight_600SemiBold',
                  fontSize: 15,
                  color: theme.text,
                }}>
                  @{displayName || 'AKB'}
                </Text>
                <View style={{
                  paddingHorizontal: 5,
                  paddingVertical: 2,
                  borderRadius: 4,
                  backgroundColor: theme.accent + '22',
                }}>
                  <Text style={{
                    fontFamily: 'JetBrainsMono_700Bold',
                    fontSize: 9,
                    color: theme.accent,
                    letterSpacing: 0.5,
                  }}>
                    YOU
                  </Text>
                </View>
              </View>
              <Text style={{
                fontFamily: 'JetBrainsMono_400Regular',
                fontSize: 10,
                color: theme.textMute,
                letterSpacing: 0.5,
                marginTop: 1,
              }}>
                BRA · top 0.4%
              </Text>
            </View>
            <Text style={{
              fontFamily: 'JetBrainsMono_700Bold',
              fontSize: 14,
              color: theme.text,
            }}>
              48K
            </Text>
          </LinearGradient>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      <StepCTA
        theme={theme}
        label="Continue"
        onPress={onNext}
        disabled={!valid}
      />
    </View>
  );
}

// ─── Step 4: Fan Role ─────────────────────────────────────────────────────────

interface RoleCardProps {
  theme: Theme;
  active: boolean;
  onSelect: () => void;
  icon: string;
  name: string;
  mult: string;
  input: string;
  power: string;
}

function RoleCard({ theme, active, onSelect, icon, name, mult, input, power }: RoleCardProps) {
  return (
    <TouchableOpacity
      onPress={onSelect}
      activeOpacity={0.8}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        padding: 14,
        paddingHorizontal: 16,
        borderRadius: 16,
        backgroundColor: active ? theme.accent : theme.surface,
        borderWidth: 0.5,
        borderColor: active ? theme.accent : theme.border,
      }}
    >
      <View style={{
        width: 44, height: 44, borderRadius: 12,
        backgroundColor: active ? theme.bg : theme.surface2,
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}>
        <FRIcon name={icon} size={22} color={active ? theme.accent : theme.text} strokeWidth={1.8} />
      </View>

      <View style={{ flex: 1 }}>
        <Text style={{
          fontFamily: 'InterTight_700Bold',
          fontSize: 17,
          color: active ? theme.bg : theme.text,
          letterSpacing: -0.3,
        }}>
          {name}
        </Text>
        <Text style={{
          fontFamily: 'JetBrainsMono_400Regular',
          fontSize: 10,
          color: active ? theme.bg : theme.textMute,
          opacity: active ? 0.7 : 1,
          letterSpacing: 0.3,
          marginTop: 2,
        }}>
          {mult} {input.toUpperCase()} · {power.toUpperCase()}
        </Text>
      </View>

      {/* Radio */}
      <View style={{
        width: 22, height: 22, borderRadius: 22,
        borderWidth: 1.5,
        borderColor: active ? theme.bg : theme.borderStrong,
        backgroundColor: active ? theme.bg : 'transparent',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        {active && <FRIcon name="check" size={12} color={theme.accent} strokeWidth={3} />}
      </View>
    </TouchableOpacity>
  );
}

interface RoleStepProps {
  theme: Theme;
  topInset: number;
  role: FanRole;
  setRole: (r: FanRole) => void;
  onFinish: () => void;
  onBack: () => void;
  loading?: boolean;
  error?: string;
}

function RoleStep({ theme, topInset, role, setRole, onFinish, onBack, loading, error }: RoleStepProps) {
  return (
    <View style={{ flex: 1 }}>
      <StepHeader
        theme={theme}
        step={4} total={4}
        topInset={topInset}
        onBack={onBack}
        title={'Pick your\nfan role.'}
        sub="Each role amplifies a different input. You can switch any time."
      />

      <View style={{ paddingHorizontal: 20, paddingTop: 24, gap: 10 }}>
        <RoleCard
          theme={theme}
          active={role === 'drummer'}
          onSelect={() => setRole('drummer')}
          icon="drum"
          name="Drummer"
          mult="1.2×"
          input="Tap Storm"
          power="Beat Drop"
        />
        <RoleCard
          theme={theme}
          active={role === 'chanter'}
          onSelect={() => setRole('chanter')}
          icon="megaphone"
          name="Chanter"
          mult="1.3×"
          input="Voice Cheer"
          power="War Cry"
        />
        <RoleCard
          theme={theme}
          active={role === 'ultra'}
          onSelect={() => setRole('ultra')}
          icon="lightning"
          name="Ultra Fan"
          mult="1.5×"
          input="Shake"
          power="Earthquake"
        />
      </View>

      <View style={{ flex: 1 }} />
      <StepCTA
        theme={theme}
        label="Start roaring"
        onPress={onFinish}
        loading={loading}
        error={error}
        hint="Joining Brazil supporters · Change in profile"
      />
    </View>
  );
}

// ─── Main: OnboardingScreen ───────────────────────────────────────────────────

const FAN_ROLE_API: Record<FanRole, string> = {
  ultra:    'ULTRA_FAN',
  drummer:  'DRUMMER',
  chanter:  'CHANTER',
};

function mapApiFanRole(apiRole: string): FanRole {
  const map: Record<string, FanRole> = {
    ULTRA_FAN: 'ultra',
    DRUMMER:   'drummer',
    CHANTER:   'chanter',
  };
  return map[apiRole] ?? 'ultra';
}

export default function OnboardingScreen({ navigation }: Props) {
  const { isDark, teamKey, setToken, setUser, setOnboarded } = useUserStore();
  const theme = buildTheme(isDark, teamKey);
  const insets = useSafeAreaInsets();

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [country, setCountry] = useState<Country>(COUNTRIES[0]);
  const [phone, setPhoneLocal] = useState('');
  const [otp, setOtp] = useState('');
  const [displayNameLocal, setDisplayNameLocal] = useState('');
  const [role, setRole] = useState<FanRole>('ultra');
  const [showPicker, setShowPicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fullPhone = `${country.dial}${phone}`;

  const handleSendCode = async () => {
    setLoading(true);
    setError('');
    try {
      await api.auth.requestOtp(fullPhone);
      setOtp('');
      setStep(2);
    } catch (e: any) {
      setError(e.response?.data?.message ?? 'Failed to send code. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    setLoading(true);
    setError('');
    try {
      const { data: authData } = await api.auth.verifyOtp(fullPhone, otp);
      setToken(authData.accessToken);
      const { data: me } = await api.auth.me();
      setUser({
        userId:      me.userId,
        displayName: me.displayName ?? '',
        phone:       me.phone ?? fullPhone,
        fanRole:     mapApiFanRole(me.fanRole),
        teamKey:     (me.teamKey ?? teamKey) as TeamKey,
        xp:          me.xp ?? 0,
        level:       me.level ?? 1,
        badges:      me.badges ?? [],
        countryCode: me.countryCode ?? country.code,
        cityCode:    me.cityCode ?? '',
      });
      if (me.displayName) setDisplayNameLocal(me.displayName);
      setStep(3);
    } catch (e: any) {
      setError(e.response?.data?.message ?? 'Invalid code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleFinish = async () => {
    setLoading(true);
    setError('');
    try {
      await api.auth.updateProfile({
        displayName: displayNameLocal,
        fanRole: FAN_ROLE_API[role],
      });
      const { data: me } = await api.auth.me();
      setUser({
        userId:      me.userId,
        displayName: me.displayName ?? displayNameLocal,
        phone:       me.phone ?? fullPhone,
        fanRole:     mapApiFanRole(me.fanRole),
        teamKey:     (me.teamKey ?? teamKey) as TeamKey,
        xp:          me.xp ?? 0,
        level:       me.level ?? 1,
        badges:      me.badges ?? [],
        countryCode: me.countryCode ?? country.code,
        cityCode:    me.cityCode ?? '',
      });
      setOnboarded();
      navigation.replace('Main');
    } catch (e: any) {
      setError(e.response?.data?.message ?? 'Something went wrong. Try again.');
      setLoading(false);
    }
  };

  const goToStep = (s: 1 | 2 | 3 | 4) => {
    setError('');
    setStep(s);
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: theme.bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {step === 1 && (
        <PhoneStep
          theme={theme}
          topInset={insets.top}
          country={country}
          phone={phone}
          setPhone={setPhoneLocal}
          onNext={handleSendCode}
          onPickerOpen={() => setShowPicker(true)}
          loading={loading}
          error={error}
        />
      )}
      {step === 2 && (
        <OTPStep
          theme={theme}
          topInset={insets.top}
          country={country}
          phone={phone}
          otp={otp}
          setOtp={setOtp}
          onNext={handleVerifyOtp}
          onBack={() => goToStep(1)}
          onResend={handleSendCode}
          loading={loading}
          error={error}
        />
      )}
      {step === 3 && (
        <DisplayNameStep
          theme={theme}
          topInset={insets.top}
          displayName={displayNameLocal}
          setDisplayName={setDisplayNameLocal}
          onNext={() => goToStep(4)}
          onBack={() => goToStep(2)}
        />
      )}
      {step === 4 && (
        <RoleStep
          theme={theme}
          topInset={insets.top}
          role={role}
          setRole={setRole}
          onFinish={handleFinish}
          onBack={() => goToStep(3)}
          loading={loading}
          error={error}
        />
      )}

      {showPicker && (
        <CountryPicker
          theme={theme}
          topInset={insets.top}
          onPick={(c) => setCountry(c)}
          onClose={() => setShowPicker(false)}
        />
      )}
    </KeyboardAvoidingView>
  );
}
