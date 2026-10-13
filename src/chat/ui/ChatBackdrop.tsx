import {
  Dimensions,
  StyleSheet,
  useWindowDimensions,
  View,
} from "react-native";
import Svg, {
  Circle,
  Defs,
  LinearGradient,
  Rect,
  Stop,
} from "react-native-svg";

// Static vector treatment; replace with the source artwork once its export is available.
const stars = Array.from({ length: 180 }, (_, index) => ({
  x: (index * 137.508) % 390,
  y: (index * 93.271 + index * index * 0.71) % 844,
  radius: index % 23 === 0 ? 1.4 : 0.45,
  opacity: 0.07 + (index % 6) * 0.025,
}));

export function ChatBackdrop() {
  const { width } = useWindowDimensions();
  const height = Dimensions.get("screen").height;
  return (
    <View
      pointerEvents="none"
      style={StyleSheet.absoluteFill}
      accessible={false}
    >
      <Svg
        width={width}
        height={height}
        viewBox="0 0 390 844"
        preserveAspectRatio="xMidYMax slice"
      >
        <Defs>
          <LinearGradient id="night" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#080A0C" />
            <Stop offset="0.6" stopColor="#0B0F13" />
            <Stop offset="1" stopColor="#222A34" />
          </LinearGradient>
        </Defs>
        <Rect width={390} height={844} fill="url(#night)" />
        {stars.map((star) => (
          <Circle
            key={`${star.x}:${star.y}`}
            cx={star.x}
            cy={star.y}
            r={star.radius}
            opacity={star.opacity}
            fill="white"
          />
        ))}
      </Svg>
    </View>
  );
}
