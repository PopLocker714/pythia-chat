import { StatusBar } from "expo-status-bar";
import { AppProviders } from "./src/app/AppProviders";
import { chat } from "./src/app/runtime";
import { ChatScreen } from "./src/chat/ui/ChatScreen";

export default function App() {
  return (
    <AppProviders>
      <StatusBar style="light" />
      <ChatScreen runtime={chat} />
    </AppProviders>
  );
}
