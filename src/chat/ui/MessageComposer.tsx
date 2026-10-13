import { type RefObject, useRef, useState } from "react";
import { Pressable, StyleSheet, TextInput, View } from "react-native";
import { MAX_MESSAGE_LENGTH } from "../model/message";
import { ChatIcon } from "./ChatIcon";
import { GlassSurface } from "./GlassSurface";
import { colors, fonts } from "./theme";

export function MessageComposer({
  canSend,
  onSend,
  blurTarget,
}: {
  canSend: boolean;
  onSend(text: string): boolean;
  blurTarget: RefObject<View | null>;
}) {
  const [text, setText] = useState("");
  const input = useRef<TextInput>(null);
  const disabled = !canSend || text.trim().length === 0;
  function send() {
    if (onSend(text)) setText("");
  }
  return (
    <Pressable
      accessible={false}
      onPress={() => input.current?.focus()}
      style={styles.border}
    >
      <GlassSurface radius={28} blurTarget={blurTarget} />
      <View style={styles.composer}>
        <TextInput
          ref={input}
          accessibilityLabel="Message"
          testID="message-input"
          value={text}
          onChangeText={setText}
          placeholder="Ask the stars..."
          placeholderTextColor={colors.muted}
          multiline
          keyboardAppearance="dark"
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
            onPress={(event) => {
              event.stopPropagation();
              send();
            }}
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
    </Pressable>
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
