import { Pressable, StyleSheet, Text, View } from "react-native";
import type { ChatMessage } from "../model/message";
import { ChatIcon } from "./ChatIcon";
import { PythiaMark } from "./PythiaMark";
import { colors, fonts } from "./theme";

const signLabels = {
  sun: "SUN SIGN",
  moon: "MOON SIGN",
  rising: "RISING SIGN",
};

export function MessageRow({
  message,
  canRetry,
  onRetry,
}: {
  message: ChatMessage;
  canRetry: boolean;
  onRetry(id: string): boolean;
}) {
  if ("clientMessageId" in message || message.role === "user") {
    return (
      <View style={styles.outgoing}>
        <View style={styles.bubble}>
          <Text style={styles.body}>{message.text}</Text>
        </View>
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
          <Text accessibilityLiveRegion="polite" style={styles.sending}>
            Sending…
          </Text>
        ) : null}
      </View>
    );
  }
  if (message.status === "generating") {
    return (
      <View style={styles.thinking} accessibilityLiveRegion="polite">
        <PythiaMark />
        <Text style={[styles.body, styles.secondary]}>
          Pythia is thinking...
        </Text>
      </View>
    );
  }
  const hasSigns = Boolean(message.signs?.length);
  return (
    <View style={styles.incoming}>
      {message.signs?.map((sign) => (
        <View key={sign.kind} style={styles.sign}>
          <View style={styles.signIcon}>
            <ChatIcon name={sign.kind} size={16} color={colors.secondary} />
          </View>
          <View style={styles.signDescription}>
            <Text style={styles.signTitle}>
              <Text style={styles.muted}>{signLabels[sign.kind]} – </Text>
              {sign.sign.toUpperCase()}
            </Text>
            <Text style={styles.caption}>{sign.caption}</Text>
          </View>
        </View>
      ))}
      <Text style={[styles.body, hasSigns && styles.portraitText]}>
        {message.text}
      </Text>
      <View style={styles.signature}>
        <PythiaMark />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  body: {
    fontFamily: fonts.body,
    fontSize: 14,
    lineHeight: 19,
    color: colors.text,
  },
  incoming: { paddingTop: 12, paddingBottom: 16 },
  outgoing: { alignItems: "flex-end", paddingVertical: 16 },
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
  thinking: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
  },
  secondary: { color: colors.secondary },
  muted: { color: colors.muted },
  portraitText: { color: colors.secondary, marginTop: 16 },
  signature: { marginTop: 24, marginLeft: -4 },
  sign: { flexDirection: "row", gap: 8, paddingBottom: 12 },
  signIcon: { paddingTop: 6 },
  signDescription: { flex: 1 },
  signTitle: {
    fontFamily: fonts.heading,
    fontSize: 16,
    lineHeight: 22,
    color: colors.text,
  },
  caption: {
    fontFamily: fonts.body,
    fontSize: 12,
    lineHeight: 16,
    color: colors.secondary,
  },
});
