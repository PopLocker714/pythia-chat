import { IBMPlexMono_400Regular } from "@expo-google-fonts/ibm-plex-mono/400Regular";
import { PlayfairDisplay_400Regular } from "@expo-google-fonts/playfair-display/400Regular";
import { useFonts } from "expo-font";
import { StatusBar } from "expo-status-bar";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { AppProviders } from "./src/app/AppProviders";
import { chat } from "./src/app/runtime";
import { ChatScreen } from "./src/chat/ui/ChatScreen";

export default function App() {
  const [fontsLoaded, fontError] = useFonts({
    IBMPlexMono_400Regular,
    PlayfairDisplay_400Regular,
  });
  if (fontError) throw fontError;
  if (!fontsLoaded)
    return (
      <View style={styles.loading}>
        <StatusBar style="light" />
        <ActivityIndicator color="#B9C3C8" />
      </View>
    );
  return (
    <AppProviders>
      <StatusBar style="light" />
      <ChatScreen runtime={chat} />
    </AppProviders>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    backgroundColor: "#080A0C",
    alignItems: "center",
    justifyContent: "center",
  },
});
