import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated from "react-native-reanimated";
import type { ChatMessage } from "../model/message";
import { AssistantMessageRow } from "./AssistantMessageRow";
import { ChatIcon } from "./ChatIcon";
import { statusEnter, statusExit } from "./messageTransitions";
import { colors, fonts } from "./theme";
import { useMessageAppearance } from "./useMessageAppearance";

export function MessageRow({
  message,
  canRetry,
  onRetry,
}: {
  message: ChatMessage;
  canRetry: boolean;
  onRetry(id: string): boolean;
}) {
  const appearance = useMessageAppearance(message);
  if ("clientMessageId" in message || message.role === "user") {
    return (
      <Animated.View style={[styles.outgoing, appearance]}>
        <View style={styles.bubble}>
          <Text style={styles.body}>{message.text}</Text>
        </View>
        <View style={styles.deliveryStatus}>
          {message.status === "failed" ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Retry message"
              disabled={!canRetry}
              onPress={() => onRetry(message.clientMessageId)}
              style={styles.retry}
              hitSlop={8}
            >
              <Text style={styles.error}>Not sent</Text>
              <ChatIcon name="retry" size={16} color={colors.muted} />
              <Text style={styles.retryLabel}>Retry</Text>
            </Pressable>
          ) : message.status === "sending" ? (
            <Animated.Text
              entering={statusEnter}
              exiting={statusExit}
              accessibilityLiveRegion="polite"
              style={styles.sending}
            >
              Sending…
            </Animated.Text>
          ) : null}
        </View>
      </Animated.View>
    );
  }
  return (
    <Animated.View style={appearance}>
      <AssistantMessageRow message={message} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  body: {
    fontFamily: fonts.body,
    fontSize: 14,
    lineHeight: 19,
    color: colors.text,
  },
  outgoing: { alignItems: "flex-end", paddingTop: 16 },
  deliveryStatus: { height: 36, alignItems: "flex-end" },
  bubble: {
    backgroundColor: colors.bubble,
    borderRadius: 28,
    paddingVertical: 16,
    paddingHorizontal: 20,
    maxWidth: "90%",
  },
  retry: {
    minHeight: 36,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 8,
  },
  error: { fontFamily: fonts.body, fontSize: 12, color: "#D7979D" },
  retryLabel: { fontFamily: fonts.body, fontSize: 12, color: colors.secondary },
  sending: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: colors.secondary,
    paddingTop: 8,
  },
});
