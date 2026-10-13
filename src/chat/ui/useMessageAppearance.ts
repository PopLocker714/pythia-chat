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
  const previous = useRef<{
    key: string;
    status: ChatMessage["status"];
  } | null>(null);
  const opacity = useSharedValue(1);

  useLayoutEffect(() => {
    const isNewPendingMessage =
      previous.current?.key !== key &&
      (status === "sending" || status === "generating");
    const replyBecameReady =
      previous.current?.key === key &&
      previous.current.status === "generating" &&
      status === "done";
    previous.current = { key, status };

    // Recycled history rows must be immediately visible, without replaying a fade.
    opacity.value = isNewPendingMessage || replyBecameReady ? 0 : 1;
    opacity.value = withTiming(1, { duration: 240 });
    return () => cancelAnimation(opacity);
  }, [key, status, opacity]);

  return useAnimatedStyle(() => ({ opacity: opacity.value }));
}
