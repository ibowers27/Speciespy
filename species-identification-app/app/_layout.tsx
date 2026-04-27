/**
 * Root layout for the app, setting up navigation and theming.
 * Uses React Navigation for stack navigation and supports dark mode theming.
 * The "(tabs)" screen is the main entry point, and a "modal" screen is available for authentication.
*/
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { useColorScheme } from 'react-native';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal', headerShown:false }} />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}