import { useRecyclingState } from "@shopify/flash-list";
import { StyleSheet, Text, View } from "react-native";
import Animated from "react-native-reanimated";
import type { AssistantMessage } from "../model/message";
import { ChatIcon } from "./ChatIcon";
import { messageLayout, replyEnter } from "./messageTransitions";
import { PythiaMark } from "./PythiaMark";
import { ThinkingIndicator } from "./ThinkingIndicator";
import { colors, fonts } from "./theme";

const signLabels = {
  sun: "SUN SIGN",
  moon: "MOON SIGN",
  rising: "RISING SIGN",
};

export function AssistantMessageRow({
  message,
}: {
  message: AssistantMessage;
}) {
  const [startedGenerating] = useRecyclingState(
    message.status === "generating",
    [message.id],
  );
  const layout =
    startedGenerating && message.status === "done" ? messageLayout : undefined;
  return (
    <Animated.View style={styles.incoming} layout={layout}>
      {message.status === "done" ? (
        <Animated.View entering={startedGenerating ? replyEnter : undefined}>
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
          <Text
            style={[
              styles.body,
              Boolean(message.signs?.length) && styles.portraitText,
            ]}
          >
            {message.text}
          </Text>
        </Animated.View>
      ) : null}
      <Animated.View
        layout={layout}
        style={[
          styles.signature,
          message.status === "generating" && styles.pendingSignature,
        ]}
      >
        <PythiaMark />
        {message.status === "generating" ? <ThinkingIndicator /> : null}
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  incoming: { paddingTop: 12, paddingBottom: 16 },
  body: {
    fontFamily: fonts.body,
    fontSize: 14,
    lineHeight: 19,
    color: colors.text,
  },
  signature: {
    marginTop: 24,
    marginLeft: -4,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  pendingSignature: { marginTop: 0 },
  muted: { color: colors.muted },
  portraitText: { color: colors.secondary, marginTop: 16 },
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
