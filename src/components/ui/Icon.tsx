import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/theme';

export type IconName = keyof typeof Ionicons.glyphMap;

interface IconProps {
  name: IconName;
  size?: number;
  color?: string;
}

export function Icon({ name, size = 22, color = colors.textPrimary }: IconProps) {
  return <Ionicons name={name} size={size} color={color} />;
}
