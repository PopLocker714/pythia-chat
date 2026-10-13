import Svg, { Circle, Path, Rect } from "react-native-svg";

type IconName = "back" | "send" | "grid" | "sun" | "moon" | "rising" | "retry";

export function ChatIcon({
  name,
  size = 24,
  color = "white",
}: {
  name: IconName;
  size?: number;
  color?: string;
}) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={1.4}
      strokeLinecap="round"
      strokeLinejoin="round"
      accessible={false}
    >
      {name === "back" ? <Path d="m14 5-7 7 7 7" /> : null}
      {name === "send" || name === "rising" ? (
        <Path d="M12 20V4m-7 7 7-7 7 7" />
      ) : null}
      {name === "sun" ? (
        <>
          <Circle cx="12" cy="12" r="8" />
          <Circle cx="12" cy="12" r="1" fill={color} />
        </>
      ) : null}
      {name === "moon" ? (
        <Path d="M15 3a9 9 0 1 0 0 18A10.2 10.2 0 0 1 15 3Z" />
      ) : null}
      {name === "grid" ? (
        <>
          <Rect x="3" y="3" width="8" height="8" rx="2.5" />
          <Rect x="13" y="3" width="8" height="8" rx="2.5" />
          <Rect x="3" y="13" width="8" height="8" rx="2.5" />
          <Rect x="13" y="13" width="8" height="8" rx="2.5" />
        </>
      ) : null}
      {name === "retry" ? <Path d="M4 9a8 8 0 1 1 1 9M4 3v6h6" /> : null}
    </Svg>
  );
}
