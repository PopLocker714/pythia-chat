import { FlashList } from "@shopify/flash-list";
import { LinearGradient } from "expo-linear-gradient";
import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import { useReducedMotion } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { type ChatMessage, messageKey } from "../model/message";
import type { ChatRuntime } from "../model/runtime";
import { useChat } from "../model/useChat";
import { ChatBackdrop } from "./ChatBackdrop";
import { ChatIcon } from "./ChatIcon";
import { ChatPlanet } from "./ChatPlanet";
import { GlassSurface } from "./GlassSurface";
import { MessageComposer } from "./MessageComposer";
import { MessageRow } from "./MessageRow";
import { colors, fonts } from "./theme";

const scrollPosition = {
  startRenderingFromBottom: true,
  autoscrollToBottomThreshold: 0.15,
};
function itemType(message: ChatMessage) {
  if ("clientMessageId" in message || message.role === "user") return "user";
  return message.status === "done" && message.signs ? "portrait" : "assistant";
}

export function ChatScreen({ runtime }: { runtime: ChatRuntime }) {
  const chat = useChat(runtime);
  const insets = useSafeAreaInsets();
  const reduceMotion = useReducedMotion();
  const [composerHeight, setComposerHeight] = useState(0);
  const headerHeight = insets.top + 60;
  return (
    <View style={styles.screen}>
      <ChatBackdrop />
      <KeyboardAvoidingView
        behavior="padding"
        style={styles.content}
        automaticOffset
        keyboardVerticalOffset={-insets.bottom}
      >
        <View style={styles.content}>
          <ChatPlanet />
          {composerHeight > 0 ? (
            <FlashList
              style={styles.messages}
              data={chat.messages}
              keyExtractor={messageKey}
              getItemType={itemType}
              maintainVisibleContentPosition={{
                ...scrollPosition,
                animateAutoScrollToBottom: !reduceMotion,
              }}
              contentInsetAdjustmentBehavior="never"
              contentContainerStyle={{
                paddingHorizontal: 20,
                paddingTop: headerHeight,
                paddingBottom: composerHeight + 12,
              }}
              scrollIndicatorInsets={{
                top: headerHeight,
                bottom: composerHeight,
              }}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="interactive"
              ListEmptyComponent={
                chat.isLoading ? (
                  <View style={styles.feedback}>
                    <ActivityIndicator
                      color={colors.secondary}
                      accessibilityLabel="Loading messages"
                    />
                  </View>
                ) : chat.isError ? (
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
                ) : null
              }
              renderItem={({ item }) => (
                <MessageRow
                  message={item}
                  canRetry={chat.canRetry}
                  onRetry={chat.retry}
                />
              )}
            />
          ) : null}
          <View
            pointerEvents="box-none"
            style={[styles.composerOverlay, { paddingBottom: insets.bottom }]}
            onLayout={({ nativeEvent }) =>
              setComposerHeight(nativeEvent.layout.height)
            }
          >
            <MessageComposer canSend={chat.canSend} onSend={chat.send} />
          </View>
        </View>
      </KeyboardAvoidingView>
      <LinearGradient
        pointerEvents="none"
        colors={["rgba(8,10,12,0.95)", "rgba(8,10,12,0)"]}
        style={[styles.statusShade, { height: insets.top + 8 }]}
      />
      <View
        pointerEvents="box-none"
        style={[styles.header, { paddingTop: insets.top + 8 }]}
      >
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
                colors={["rgba(38,40,43,0.94)", "rgba(13,16,20,0.86)"]}
                style={styles.titleSurface}
              />
            }
          />
          <Text style={styles.title}>Chat</Text>
        </View>
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { flex: 1 },
  messages: { zIndex: 1 },
  composerOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 2,
  },
  statusShade: { position: "absolute", top: 0, left: 0, right: 0 },
  header: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    paddingBottom: 8,
    flexDirection: "row",
    alignItems: "center",
  },
  back: {
    marginLeft: 20,
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
    backgroundColor: "rgba(34,37,40,0.9)",
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
