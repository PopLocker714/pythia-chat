import { BlurView } from "expo-blur";
import {
  GlassView,
  isGlassEffectAPIAvailable,
  isLiquidGlassAvailable,
} from "expo-glass-effect";
import { type RefObject, useEffect, useState } from "react";
import { AccessibilityInfo, Platform, StyleSheet, View } from "react-native";
import { colors } from "./theme";

const supportsGlass =
  Platform.OS === "ios" &&
  isGlassEffectAPIAvailable() &&
  isLiquidGlassAvailable();

function useReduceTransparency() {
  const [reduced, setReduced] = useState(Platform.OS === "ios");

  useEffect(() => {
    if (Platform.OS !== "ios") return;
    let active = true;
    let receivedChange = false;
    const subscription = AccessibilityInfo.addEventListener(
      "reduceTransparencyChanged",
      (reduceTransparency) => {
        receivedChange = true;
        setReduced(reduceTransparency);
      },
    );
    void AccessibilityInfo.isReduceTransparencyEnabled().then(
      (reduceTransparency) => {
        // A settings event is newer than the initial asynchronous read.
        if (active && !receivedChange) setReduced(reduceTransparency);
      },
      () => {
        // Keep the solid surface if the system preference cannot be read.
      },
    );
    return () => {
      active = false;
      subscription.remove();
    };
  }, []);

  return reduced;
}

export function GlassSurface({
  radius,
  blurTarget,
}: {
  radius: number;
  blurTarget: RefObject<View | null>;
}) {
  const reduceTransparency = useReduceTransparency();
  return (
    <View
      pointerEvents="none"
      style={StyleSheet.absoluteFill}
      accessible={false}
    >
      {supportsGlass && !reduceTransparency ? (
        <GlassView
          style={[StyleSheet.absoluteFill, { borderRadius: radius }]}
          glassEffectStyle="regular"
          tintColor="rgba(17,21,27,0.5)"
          colorScheme="dark"
        />
      ) : reduceTransparency ? (
        <View
          style={[styles.surface, styles.solid, { borderRadius: radius }]}
        />
      ) : (
        <View style={[styles.surface, { borderRadius: radius }]}>
          <BlurView
            blurTarget={blurTarget}
            blurMethod="dimezisBlurView"
            tint="dark"
            intensity={65}
            style={StyleSheet.absoluteFill}
          />
          <View style={[StyleSheet.absoluteFill, styles.tint]} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  surface: {
    ...StyleSheet.absoluteFill,
    overflow: "hidden",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  solid: { backgroundColor: "#171B21" },
  tint: { backgroundColor: "rgba(17,21,27,0.2)" },
});
