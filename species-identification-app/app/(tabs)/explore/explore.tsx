/**
 * Explore screen displaying a map with markers for each post. Users can tap on markers to view details and navigate to discussions.
 * Fetches posts in real-time using Firestore subscriptions and displays them on a MapView. Also includes a header button to switch to list view.
 */
import React, { useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { View, StyleSheet, Dimensions, TouchableOpacity, Text } from 'react-native';
import MapView, { Marker, Callout } from 'react-native-maps';
import { useRouter, Stack } from 'expo-router';
import { subscribeToPosts } from '@/services/postService';
import { useThemeColors } from '@/hooks/useThemeColors';
 
export default function ExploreScreen() {
  const [posts, setPosts] = useState<any[]>([]);
  const router = useRouter();
  const colors = useThemeColors();
 
  // Subscribe to posts when the screen is focused, unsubscribe when it loses focus
  useFocusEffect(
    React.useCallback(() => {
      const unsubscribe = subscribeToPosts((fetchedPosts) => {
        setPosts(fetchedPosts);
      });
 
      return () => unsubscribe();
    }, [])
  );
 
  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Explore',
          headerStyle: { backgroundColor: colors.card },
          headerTintColor: colors.text,
          headerRight: () => (
            <TouchableOpacity
              onPress={() => router.push('/explore/listview')}
              style={{ paddingHorizontal: 10 }}
            >
              <Text style={{ color: colors.primary, fontSize: 16, fontWeight: '600' }}>
                List View
              </Text>
            </TouchableOpacity>
          ),
        }}
      />
      <MapView
        style={styles.map}
        initialRegion={{
          latitude: 27.33655,
          longitude: -82.53093,
          latitudeDelta: 0.1,
          longitudeDelta: 0.1,
        }}
      >
        {/* Render a pin for each post that has GPS coordinates */}
        {posts
          .filter(p => p.latitude && p.longitude)
          .map(post => (
            <Marker
              key={post.id}
              coordinate={{
                latitude: post.latitude,
                longitude: post.longitude,
              }}
              pinColor={colors.primary}
            >
              <Callout
                onPress={() => router.push({
                  pathname: '/explore/discussion',
                  params: { postId: post.id }
                })}
              >
                <View style={styles.callout}>
                  <Text style={styles.calloutTitle}>{post.commonName}</Text>
                  <Text style={[styles.calloutSubtitle, { color: colors.textSecondary }]}>
                    by {post.userName}
                  </Text>
                  <Text style={[styles.calloutAction, { color: colors.link }]}>
                    Tap to view →
                  </Text>
                </View>
              </Callout>
            </Marker>
          ))}
      </MapView>
    </View>
  );
}
 
const styles = StyleSheet.create({
  container: { flex: 1 },
  map: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height,
  },
  callout: {
    width: 150,
    padding: 10,
  },
  calloutTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 3,
  },
  calloutSubtitle: {
    fontSize: 12,
    marginBottom: 5,
  },
  calloutAction: {
    fontSize: 12,
    fontWeight: '600',
  },
});