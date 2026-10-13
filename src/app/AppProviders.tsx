import { type PropsWithChildren, useEffect } from "react";
import { AppState } from "react-native";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Provider } from "react-redux";
import { chat } from "./runtime";

function ChatLifecycle() {
  useEffect(() => {
    if (AppState.currentState === "active") chat.controller.start();
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") chat.controller.start();
      else chat.controller.stop();
    });
    return () => {
      subscription.remove();
      chat.controller.stop();
    };
  }, []);
  return null;
}

export function AppProviders({ children }: PropsWithChildren) {
  return (
    <Provider store={chat.store}>
      <SafeAreaProvider>
        <KeyboardProvider preload={false}>
          <ChatLifecycle />
          {children}
        </KeyboardProvider>
      </SafeAreaProvider>
    </Provider>
  );
}
