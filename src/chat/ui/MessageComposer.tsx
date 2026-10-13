import { LinearGradient } from "expo-linear-gradient";
import { useState } from "react";
import { Pressable, StyleSheet, TextInput, View } from "react-native";
import { MAX_MESSAGE_LENGTH } from "../model/message";
import { ChatIcon } from "./ChatIcon";
import { GlassSurface } from "./GlassSurface";
import { colors, fonts } from "./theme";

export function MessageComposer({
  canSend,
  onSend,
}: {
  canSend: boolean;
  onSend(text: string): boolean;
}) {
  const [text, setText] = useState("");
  const disabled = !canSend || text.trim().length === 0;
  function send() {
    if (onSend(text)) setText("");
  }
  return (
    <View style={styles.border}>
      <GlassSurface
        radius={28}
        fallback={
          <LinearGradient
            colors={[
              "rgba(185,195,200,0.75)",
              "rgba(185,195,200,0.06)",
              "rgba(185,195,200,0.35)",
            ]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.fallbackBorder}
          >
            <View style={styles.fallbackFill} />
          </LinearGradient>
        }
      />
      <View style={styles.composer}>
        <TextInput
          accessibilityLabel="Message"
          testID="message-input"
          value={text}
          onChangeText={setText}
          placeholder="Ask the stars..."
          placeholderTextColor={colors.muted}
          multiline
          maxLength={MAX_MESSAGE_LENGTH}
          style={styles.input}
          selectionColor={colors.secondary}
        />
        <View style={styles.toolbar}>
          <View accessibilityLabel="Tools" style={styles.tools}>
            <ChatIcon name="grid" size={24} color={colors.secondary} />
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Send message"
            accessibilityState={{ disabled }}
            testID="send-message"
            disabled={disabled}
            onPress={send}
            hitSlop={8}
            style={({ pressed }) => [
              styles.send,
              disabled && styles.sendDisabled,
              pressed && styles.pressed,
            ]}
          >
            <ChatIcon
              name="send"
              size={24}
              color={disabled ? colors.secondary : colors.background}
            />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  border: {
    borderRadius: 28,
    padding: StyleSheet.hairlineWidth,
    marginHorizontal: 12,
    marginBottom: 8,
  },
  composer: {
    borderRadius: 28,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 10,
  },
  fallbackBorder: {
    ...StyleSheet.absoluteFill,
    borderRadius: 28,
    padding: StyleSheet.hairlineWidth,
  },
  fallbackFill: {
    flex: 1,
    borderRadius: 28,
    backgroundColor: "rgba(17,21,27,0.92)",
  },
  input: {
    fontFamily: fonts.body,
    fontSize: 16,
    lineHeight: 22,
    color: colors.text,
    minHeight: 28,
    maxHeight: 116,
    padding: 0,
    paddingBottom: 8,
    textAlignVertical: "top",
  },
  toolbar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  tools: { height: 40, justifyContent: "center" },
  send: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.text,
  },
  sendDisabled: { backgroundColor: "rgba(185,195,200,0.15)" },
  pressed: { opacity: 0.7 },
});
