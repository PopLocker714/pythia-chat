import {
  GlassView,
  isGlassEffectAPIAvailable,
  isLiquidGlassAvailable,
} from "expo-glass-effect";
import { type ReactNode, useEffect, useState } from "react";
import { AccessibilityInfo, Platform, StyleSheet, View } from "react-native";

const supportsGlass =
  Platform.OS === "ios" &&
  isGlassEffectAPIAvailable() &&
  isLiquidGlassAvailable();

function useGlassEnabled() {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    if (!supportsGlass) return;
    let active = true;
    let receivedChange = false;
    const subscription = AccessibilityInfo.addEventListener(
      "reduceTransparencyChanged",
      (reduceTransparency) => {
        receivedChange = true;
        setEnabled(!reduceTransparency);
      },
    );
    void AccessibilityInfo.isReduceTransparencyEnabled().then(
      (reduceTransparency) => {
        // A settings event is newer than the initial asynchronous read.
        if (active && !receivedChange) setEnabled(!reduceTransparency);
      },
      () => {
        // Keep the fallback if the system preference cannot be read.
      },
    );
    return () => {
      active = false;
      subscription.remove();
    };
  }, []);

  return enabled;
}

export function GlassSurface({
  radius,
  fallback,
}: {
  radius: number;
  fallback: ReactNode;
}) {
  const enabled = useGlassEnabled();
  return (
    <View
      pointerEvents="none"
      style={StyleSheet.absoluteFill}
      accessible={false}
    >
      {enabled ? (
        <GlassView
          style={[StyleSheet.absoluteFill, { borderRadius: radius }]}
          glassEffectStyle="regular"
          colorScheme="dark"
        />
      ) : (
        fallback
      )}
    </View>
  );
}
