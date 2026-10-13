import { useEffect } from "react";
import { StyleSheet, Text } from "react-native";
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { statusEnter, statusExit } from "./messageTransitions";
import { colors, fonts } from "./theme";

function ThinkingDot({ delay }: { delay: number }) {
  const opacity = useSharedValue(1);
  const reduceMotion = useReducedMotion();
  useEffect(() => {
    if (reduceMotion) return;
    opacity.value = 0.25;
    opacity.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 380 }),
          withTiming(0.25, { duration: 380 }),
        ),
        -1,
      ),
    );
    return () => cancelAnimation(opacity);
  }, [delay, opacity, reduceMotion]);
  const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));
  return <Animated.Text style={[styles.label, animatedStyle]}>.</Animated.Text>;
}

export function ThinkingIndicator() {
  return (
    <Animated.View
      entering={statusEnter}
      exiting={statusExit}
      style={styles.caption}
      accessible
      accessibilityLabel="Pythia is thinking"
      accessibilityLiveRegion="polite"
    >
      <Text style={styles.label}>Pythia is thinking</Text>
      <ThinkingDot delay={0} />
      <ThinkingDot delay={160} />
      <ThinkingDot delay={320} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  caption: { flexDirection: "row", alignItems: "baseline" },
  label: {
    fontFamily: fonts.body,
    fontSize: 14,
    lineHeight: 19,
    color: colors.secondary,
  },
});
