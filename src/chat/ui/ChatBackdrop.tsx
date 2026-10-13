import {
  Dimensions,
  StyleSheet,
  useWindowDimensions,
  View,
} from "react-native";
import Svg, {
  Circle,
  Defs,
  Ellipse,
  LinearGradient,
  RadialGradient,
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
  // Android can shrink the app window for the IME. Keep the artwork screen-high.
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
          <RadialGradient id="planet" cx="38%" cy="20%">
            <Stop offset="0" stopColor="#708091" stopOpacity={0.65} />
            <Stop offset="0.5" stopColor="#29323F" stopOpacity={0.7} />
            <Stop offset="1" stopColor="#080C12" />
          </RadialGradient>
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
        <Ellipse
          cx={205}
          cy={840}
          rx={110}
          ry={117}
          fill="url(#planet)"
          stroke="#84919E"
          strokeOpacity={0.25}
        />
        <Ellipse
          cx={205}
          cy={840}
          rx={150}
          ry={68}
          fill="none"
          stroke="#B9C3C8"
          strokeOpacity={0.18}
          rotation={-28}
          origin="205,840"
        />
        <Ellipse
          cx={205}
          cy={840}
          rx={116}
          ry={135}
          fill="none"
          stroke="#B9C3C8"
          strokeOpacity={0.18}
          rotation={18}
          origin="205,840"
        />
      </Svg>
    </View>
  );
}
