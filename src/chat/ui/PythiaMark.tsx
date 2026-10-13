import Svg, { Circle, Defs, RadialGradient, Stop } from "react-native-svg";

export function PythiaMark() {
  return (
    <Svg width={36} height={36} viewBox="0 0 36 36" accessible={false}>
      <Defs>
        <RadialGradient id="glow">
          <Stop offset="0" stopColor="#DCE2DD" stopOpacity={0.6} />
          <Stop offset="1" stopColor="#DCE2DD" stopOpacity={0} />
        </RadialGradient>
        <RadialGradient id="sphere" cx="35%" cy="30%">
          <Stop offset="0" stopColor="#FFFFFF" />
          <Stop offset="0.4" stopColor="#CFD3C9" />
          <Stop offset="0.8" stopColor="#555F5B" />
          <Stop offset="1" stopColor="#131B1B" />
        </RadialGradient>
      </Defs>
      <Circle cx={18} cy={18} r={18} fill="url(#glow)" />
      <Circle cx={18} cy={18} r={9} fill="url(#sphere)" />
      <Circle cx={16} cy={14} r={2} fill="#343F3D" opacity={0.45} />
      <Circle cx={21} cy={20} r={3} fill="#293632" opacity={0.5} />
      <Circle cx={13} cy={20} r={1.5} fill="#1C2928" opacity={0.5} />
    </Svg>
  );
}
