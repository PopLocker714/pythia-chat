import { Image, StyleSheet, useWindowDimensions, View } from "react-native";

export function ChatPlanet() {
  const { width } = useWindowDimensions();
  const size = width - 48;
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Image
        source={require("../../../assets/planet.png")}
        accessible={false}
        resizeMode="contain"
        style={[
          styles.planet,
          { width: size, height: size, bottom: -size / 2 },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  planet: { position: "absolute", alignSelf: "center" },
});
