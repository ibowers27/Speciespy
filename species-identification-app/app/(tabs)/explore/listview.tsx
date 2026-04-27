/**
 * List view screen for the Explore tab. Displays a scrollable list of recent posts with photos, species names, scientific name,
 * poster, and comment and like counts.
 * Tapping on a post navigates to the discussion screen for that post.
 * Fetches posts in real-time using Firestore subscriptions.
 */
import React, { useState, useEffect } from 'react';
import { View, FlatList, Image, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { subscribeToPosts } from '@/services/postService';
import { useThemeColors } from '@/hooks/useThemeColors';

export default function PhotoListScreen() {
  const router = useRouter();
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const colors = useThemeColors();

  // Subscribe to real-time post updates
  useEffect(() => {
    const unsubscribe = subscribeToPosts((fetchedPosts) => {
      setPosts(fetchedPosts);
      setLoading(false);
    });
    return unsubscribe;
  }, []);
 
  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ marginTop: 10, color: colors.text }}>Loading posts...</Text>
      </View>
    );
  }
 
  if (posts.length === 0) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <Text style={[styles.emptyText, { color: colors.text }]}>No posts yet!</Text>
        <Text style={[styles.emptySubtext, { color: colors.textMuted }]}>
          Be the first to identify a species
        </Text>
      </View>
    );
  }
 
  return (
    <>
      <Stack.Screen options={{ title: 'List View' }} />
      <FlatList
        style={{ backgroundColor: colors.background }}
        data={posts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.row, {
              backgroundColor: colors.card,
              borderColor: colors.cardBorder,
            }]}
            onPress={() =>
              router.push({
                pathname: '/explore/discussion',
                params: { postId: item.id },
              })
            }
          >
            <Image
              source={{ uri: item.imageUrl }}
              style={[styles.photo, { backgroundColor: colors.cardBorder }]}
            />
            <View style={styles.info}>
              <Text style={[styles.commonName, { color: colors.text }]}>
                {item.commonName}
              </Text>
              <Text style={[styles.scientificName, { color: colors.textSecondary }]}>
                {item.scientificName}
              </Text>
              <Text style={[styles.userName, { color: colors.textMuted }]}>
                by {item.userName}
              </Text>
              <View style={styles.stats}>
                <Text style={[styles.stat, { color: colors.textMuted }]}>
                  💬 {item.commentCount || 0}
                </Text>
                <Text style={[styles.stat, { color: colors.textMuted }]}>
                  ❤️ {item.likes || 0}
                </Text>
              </View>
            </View>
            <Text style={[styles.arrow, { color: colors.cardBorder }]}>›</Text>
          </TouchableOpacity>
        )}
      />
    </>
  );
}
 
const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
  },
  photo: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 12,
  },
  info: {
    flex: 1,
  },
  commonName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  scientificName: {
    fontSize: 13,
    fontStyle: 'italic',
    marginBottom: 2,
  },
  userName: {
    fontSize: 12,
    marginBottom: 4,
  },
  stats: {
    flexDirection: 'row',
    gap: 10,
  },
  stat: {
    fontSize: 13,
  },
  arrow: {
    fontSize: 24,
    marginLeft: 8,
  },
});