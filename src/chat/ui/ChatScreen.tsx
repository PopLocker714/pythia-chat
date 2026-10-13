import { FlashList } from "@shopify/flash-list";
import { useState } from "react";
import {
  ActivityIndicator,
  Button,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSelector } from "react-redux";
import { MAX_MESSAGE_LENGTH, messageKey } from "../model/message";
import type { ChatRuntime } from "../model/runtime";

export function ChatScreen({ runtime }: { runtime: ChatRuntime }) {
  const history = runtime.api.useHistoryQuery();
  const messages = useSelector(runtime.selectors.selectMessages);
  const canSend = useSelector(runtime.selectors.selectCanSend);
  const canRetry = useSelector(runtime.selectors.selectCanRetry);
  const [text, setText] = useState("");
  return (
    <SafeAreaView style={styles.screen}>
      <Text style={styles.heading}>Pythia</Text>
      <KeyboardAvoidingView behavior="padding" style={styles.content}>
        {history.isLoading ? <ActivityIndicator /> : null}
        {history.isError ? (
          <Button
            title="Retry loading history"
            onPress={() => history.refetch()}
          />
        ) : null}
        <FlashList
          data={messages}
          keyExtractor={messageKey}
          maintainVisibleContentPosition={{
            autoscrollToBottomThreshold: 0.2,
            startRenderingFromBottom: true,
          }}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => (
            <View style={styles.message}>
              <Text style={styles.text}>
                {item.status === "generating"
                  ? "Pythia is thinking…"
                  : item.text}
              </Text>
              {"clientMessageId" in item && item.status === "failed" ? (
                <Button
                  title="Not sent · Retry"
                  disabled={!canRetry}
                  onPress={() => runtime.controller.retry(item.clientMessageId)}
                />
              ) : null}
            </View>
          )}
        />
        <View style={styles.composer}>
          <TextInput
            style={styles.input}
            placeholder="Ask Pythia"
            placeholderTextColor="#888"
            value={text}
            onChangeText={setText}
            maxLength={MAX_MESSAGE_LENGTH}
            multiline
            accessibilityLabel="Message"
          />
          <Button
            title="Send"
            disabled={!canSend || !text.trim()}
            onPress={() => {
              if (runtime.controller.send(text)) setText("");
            }}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#101012" },
  content: { flex: 1 },
  heading: { color: "white", fontSize: 24, textAlign: "center", padding: 16 },
  text: { color: "white", fontSize: 16 },
  message: { padding: 16 },
  composer: { flexDirection: "row", padding: 12, alignItems: "center" },
  input: {
    flex: 1,
    color: "white",
    borderWidth: 1,
    borderColor: "#555",
    borderRadius: 12,
    padding: 12,
    maxHeight: 120,
  },
});
