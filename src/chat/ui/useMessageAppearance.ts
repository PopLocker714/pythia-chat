import { useLayoutEffect, useRef } from "react";
import {
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { type ChatMessage, messageKey } from "../model/message";

export function useMessageAppearance(message: ChatMessage) {
  const key = messageKey(message);
  const status = message.status;
  const previousKey = useRef<string | null>(null);
  const opacity = useSharedValue(1);

  useLayoutEffect(() => {
    const isNewPendingMessage =
      previousKey.current !== key &&
      (status === "sending" || status === "generating");
    previousKey.current = key;

    // Recycled history rows must be immediately visible, without replaying a fade.
    opacity.value = isNewPendingMessage ? 0 : 1;
    opacity.value = withTiming(1, { duration: 240 });
    return () => cancelAnimation(opacity);
  }, [key, status, opacity]);

  return useAnimatedStyle(() => ({ opacity: opacity.value }));
}
