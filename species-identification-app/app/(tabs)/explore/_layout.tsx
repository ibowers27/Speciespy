// Layout for the Explore tab, which contains the species list and details screens. Sets up a stack navigator for these screens.
import { Stack } from "expo-router";

export default function ExploreLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
      }}
    />
  );
}