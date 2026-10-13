import {
  Easing,
  FadeIn,
  FadeOut,
  LinearTransition,
  ReduceMotion,
} from "react-native-reanimated";

export const messageLayout = LinearTransition.duration(320)
  .easing(Easing.inOut(Easing.cubic))
  .reduceMotion(ReduceMotion.System);
export const statusEnter = FadeIn.duration(180).reduceMotion(
  ReduceMotion.System,
);
export const statusExit = FadeOut.duration(160).reduceMotion(
  ReduceMotion.System,
);
export const replyEnter = FadeIn.delay(120)
  .duration(240)
  .reduceMotion(ReduceMotion.System);
