import { Image, StyleSheet } from "react-native";

export function PythiaMark() {
  return (
    <Image
      source={require("../../../assets/pythia.png")}
      style={styles.portrait}
      resizeMode="contain"
      accessible={false}
    />
  );
}

const styles = StyleSheet.create({
  portrait: { width: 36, height: 36, borderRadius: 18 },
});
