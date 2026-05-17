import React from "react";
import { View, Text } from "react-native";

interface Props {
  textColor: string;
  accentColor: string;
  /** 'mark' = FR only · 'wordmark' = fanroar only · 'lockup' = FR + fanroar */
  variant?: "mark" | "wordmark" | "lockup";
  /** font-size for the FR mark; wordmark scales proportionally */
  size?: number;
}

export default function FRLogo({
  textColor,
  accentColor,
  variant = "lockup",
  size = 32,
}: Props) {
  const wordSize = size * 0.82;

  const Mark = () => (
    <Text
      style={{
        fontFamily: "InterTight_800ExtraBold",
        fontSize: size,
        letterSpacing: -(size * 0.055),
        lineHeight: size * 1.05,
        includeFontPadding: false,
      }}
    >
      <Text style={{ color: textColor }}>F</Text>
      <Text style={{ color: accentColor }}>R</Text>
    </Text>
  );

  const Wordmark = () => (
    <Text
      style={{
        fontFamily: "InterTight_800ExtraBold",
        fontSize: wordSize,
        letterSpacing: -(wordSize * 0.04),
        lineHeight: wordSize * 1.05,
        includeFontPadding: false,
      }}
    >
      <Text style={{ color: textColor }}>fan</Text>
      <Text style={{ color: accentColor }}>roars</Text>
    </Text>
  );

  if (variant === "mark") return <Mark />;
  if (variant === "wordmark") return <Wordmark />;

  return (
    <View
      style={{ flexDirection: "row", alignItems: "center", gap: size * 0.38 }}
    >
      <Mark />
      <Wordmark />
    </View>
  );
}
