/**
 * This file defines the layout for the tab-based navigation in the app. 
 * It uses Expo Router's Tabs component to create a bottom tab navigator with three tabs: 
 * Home, Explore, and Identify. Each tab is associated with a screen and has a custom icon. 
 * The active tab's color is determined by the current color scheme (light or dark mode).
 */
import { Tabs } from 'expo-router';
import React from 'react';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from 'react-native';

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        headerShown: false,
        tabBarButton: HapticTab,
      }}>
        {/* Home tab - landing page with quickstart guide or user dashboard w/ stats and quick actions */}
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="house.fill" color={color} />,
        }}
      />
      {/* Explore tab - map view and list view of community posts */}
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Explore',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="map.fill" color={color} />,
        }}
      />
      {/* Identify tab - camera for species identification */}
      <Tabs.Screen
        name="identify"
        options={{
          title: 'Identify',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="camera.fill" color={color} />,
        }}
      />
    </Tabs>
  );
}
