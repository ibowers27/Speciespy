import { View, type ViewProps, useColorScheme } from 'react-native';
import { useThemeColors } from '@/hooks/useThemeColors';


export type ThemedViewProps = ViewProps & {
  lightColor?: string;
  darkColor?: string;
};

export function ThemedView({ style, lightColor, darkColor, ...otherProps }: ThemedViewProps) {
  const colors = useThemeColors();
  const scheme = useColorScheme() ?? 'light';
  
  const backgroundColor = (scheme === 'dark' ? darkColor : lightColor) ?? colors.background;

  return <View style={[{ backgroundColor }, style]} {...otherProps} />;
}
