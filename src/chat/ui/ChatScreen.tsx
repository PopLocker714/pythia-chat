import { FlashList } from "@shopify/flash-list";
import { LinearGradient } from "expo-linear-gradient";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { type ChatMessage, messageKey } from "../model/message";
import type { ChatRuntime } from "../model/runtime";
import { useChat } from "../model/useChat";
import { ChatBackdrop } from "./ChatBackdrop";
import { ChatIcon } from "./ChatIcon";
import { GlassSurface } from "./GlassSurface";
import { MessageComposer } from "./MessageComposer";
import { MessageRow } from "./MessageRow";
import { colors, fonts } from "./theme";

const scrollPosition = {
  startRenderingFromBottom: true,
  autoscrollToBottomThreshold: 0.15,
  animateAutoScrollToBottom: false,
};
function itemType(message: ChatMessage) {
  if ("clientMessageId" in message || message.role === "user") return "user";
  return message.status === "done" && message.signs ? "portrait" : "assistant";
}

export function ChatScreen({ runtime }: { runtime: ChatRuntime }) {
  const chat = useChat(runtime);
  const insets = useSafeAreaInsets();
  return (
    <View style={styles.screen}>
      <ChatBackdrop />
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <View style={styles.back} accessibilityLabel="Back">
          <GlassSurface
            radius={22}
            fallback={<View style={styles.backSurface} />}
          />
          <ChatIcon name="back" />
        </View>
        <View style={styles.titlePill}>
          <GlassSurface
            radius={24}
            fallback={
              <LinearGradient
                colors={["rgba(255,255,255,0.15)", "rgba(255,255,255,0.02)"]}
                style={styles.titleSurface}
              />
            }
          />
          <Text style={styles.title}>Chat</Text>
        </View>
      </View>
      <KeyboardAvoidingView
        behavior="padding"
        style={styles.content}
        automaticOffset
        keyboardVerticalOffset={-insets.bottom}
      >
        {chat.isLoading ? (
          <View style={styles.feedback}>
            <ActivityIndicator
              color={colors.secondary}
              accessibilityLabel="Loading messages"
            />
          </View>
        ) : null}
        {chat.isError ? (
          <View style={styles.feedback}>
            <Text style={styles.feedbackText}>
              Couldn't load your conversation.
            </Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => chat.reload()}
              style={styles.reload}
            >
              <Text style={styles.feedbackText}>Try again</Text>
            </Pressable>
          </View>
        ) : null}
        <FlashList
          data={chat.messages}
          keyExtractor={messageKey}
          getItemType={itemType}
          maintainVisibleContentPosition={scrollPosition}
          contentContainerStyle={styles.messages}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
          renderItem={({ item }) => (
            <MessageRow
              message={item}
              canRetry={chat.canRetry}
              onRetry={chat.retry}
            />
          )}
        />
        <View style={{ paddingBottom: insets.bottom }}>
          <MessageComposer canSend={chat.canSend} onSend={chat.send} />
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { flex: 1 },
  header: {
    paddingBottom: 8,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(8,10,12,0.6)",
  },
  back: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  backSurface: {
    ...StyleSheet.absoluteFill,
    borderRadius: 22,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  titlePill: {
    width: 164,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    position: "absolute",
    bottom: 6,
    left: "50%",
    marginLeft: -82,
  },
  titleSurface: {
    ...StyleSheet.absoluteFill,
    borderRadius: 24,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  title: { fontFamily: fonts.heading, fontSize: 18, color: colors.text },
  messages: { paddingHorizontal: 20, paddingBottom: 12 },
  feedback: {
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    gap: 12,
  },
  feedbackText: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.secondary,
  },
  reload: {
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
  },
});
