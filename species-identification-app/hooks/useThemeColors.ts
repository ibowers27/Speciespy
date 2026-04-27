/**
 * Implements colors from /constants/theme.ts and adapts to light/dark mode
 * Access colors with colors.primary, colors.text, etc.
 * https://docs.expo.dev/guides/color-schemes/
 */

import { Colors } from '@/constants/theme';
import { useColorScheme } from 'react-native';

export function useThemeColors() {
  const scheme = useColorScheme() ?? 'light';
  return Colors[scheme];
}