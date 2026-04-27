/**
 * Home screen showing different content based on authentication state.
 * If logged out, shows a welcome message and prompts to sign in or create an account along with a quickstart guide.
 * If logged in, shows a personalized welcome, logout button, quick stats about the user's activity (posts and comments received),
 * links to main features like the explore, discussion, and camera tabs. Also shows a feed of the user's recent posts with quick access to view them.
 */
import React, { useState, useEffect } from 'react';
import { Image } from 'expo-image';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { HelloWave } from '@/components/hello-wave';
import ParallaxScrollView from '@/components/parallax-scroll-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Link, useRouter } from 'expo-router';
import { auth } from '@/firebase/fbconfig';
import { logOut } from '@/firebase/fbauth';
import { onAuthStateChanged } from 'firebase/auth';
import { subscribeToPosts } from '@/services/postService';
import { useThemeColors } from '@/hooks/useThemeColors';
import { useNavigation, CommonActions } from '@react-navigation/native';

export default function HomeScreen() {
  const [user, setUser] = useState<any>(null);
  const [userPosts, setUserPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const navigation = useNavigation();
  const colors = useThemeColors();

  // Listen for auth state changes (login/logout)
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return unsubscribe;
  }, []);
 
  // Subscribe to posts and filter for the current user's posts
  useEffect(() => {
    if (user) {
      const unsubscribe = subscribeToPosts((posts) => {
        const myPosts = posts.filter(p => p.userId === user.uid);
        setUserPosts(myPosts);
      });
      return unsubscribe;
    }
  }, [user]);
 
  /** Prompts the user to confirm logout, then resets navigation to the home tab */
  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await logOut();
              navigation.dispatch(
                CommonActions.reset({
                  index: 0,
                  routes: [{ name: '(tabs)', state: { routes: [{ name: 'index' }] } }],
                })
              );
            } catch (error: any) {
              Alert.alert('Error', error.message);
            }
          }
        }
      ]
    );
  };
 
  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: colors.text }}>Loading...</Text>
      </View>
    );
  }
 
  // Authenticated view
  if (user) {
    return (
      <ParallaxScrollView
        headerBackgroundColor={{ light: '#A1CEDC', dark: '#1D3D47' }}
        headerImage={
          <Image
            source={require('@/assets/images/home-page-leaf.png')}
            style={styles.headerImage}
          />
        }>
 
        {/* Brand logo and app name */}
        <ThemedView style={styles.brandHeader}>
          <Image
            source={require('@/assets/images/species-identification-logo.png')}
            style={styles.logo}
          />
          <Text style={[styles.appName, { color: colors.primary }]}>Speciespy</Text>
        </ThemedView>
 
        {/* User greeting card with logout button */}
        <ThemedView style={[styles.userHeader, {
          backgroundColor: colors.cardHighlight,
          borderColor: colors.primary,
        }]}>
          <View style={styles.userInfo}>
            <Text style={[styles.greeting, { color: colors.textMuted }]}>Welcome back!</Text>
            <Text style={[styles.userName, { color: colors.text }]}>
              {user.displayName || user.email?.split('@')[0] || 'User'}
            </Text>
          </View>
          <TouchableOpacity
            onPress={handleLogout}
            style={[styles.logoutButton, { backgroundColor: colors.danger }]}
          >
            <Text style={[styles.logoutText, { color: colors.dangerText }]}>Logout</Text>
          </TouchableOpacity>
        </ThemedView>
 
        {/* Stats cards showing post count and total comments received */}
        <View style={styles.statsContainer}>
          <View style={[styles.statCard, { backgroundColor: colors.primary }]}>
            <Text style={[styles.statNumber, { color: colors.primaryText }]}>
              {userPosts.length}
            </Text>
            <Text style={[styles.statLabel, { color: colors.primaryText }]}>Species Posted</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.primary }]}>
            <Text style={[styles.statNumber, { color: colors.primaryText }]}>
              {userPosts.reduce((sum, p) => sum + (p.commentCount || 0), 0)}
            </Text>
            <Text style={[styles.statLabel, { color: colors.primaryText }]}>
              Comments Received
            </Text>
          </View>
        </View>
 
        {/* Quick action navigation cards */}
        <ThemedView style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>Quick Actions</ThemedText>
 
          <TouchableOpacity
            style={[styles.actionCard, {
              backgroundColor: colors.card,
              borderColor: colors.cardBorder,
            }]}
            onPress={() => router.push('/(tabs)/identify')}
          >
            <Text style={styles.actionIcon}>📷</Text>
            <View style={styles.actionContent}>
              <Text style={[styles.actionTitle, { color: colors.text }]}>
                Identify New Species
              </Text>
              <Text style={[styles.actionSubtitle, { color: colors.textSecondary }]}>
                Take a photo and get instant identification
              </Text>
            </View>
            <Text style={[styles.actionArrow, { color: colors.cardBorder }]}>›</Text>
          </TouchableOpacity>
 
          <TouchableOpacity
            style={[styles.actionCard, {
              backgroundColor: colors.card,
              borderColor: colors.cardBorder,
            }]}
            onPress={() => router.push('/(tabs)/explore/explore')}
          >
            <Text style={styles.actionIcon}>🗺️</Text>
            <View style={styles.actionContent}>
              <Text style={[styles.actionTitle, { color: colors.text }]}>Explore Map</Text>
              <Text style={[styles.actionSubtitle, { color: colors.textSecondary }]}>
                See species identified in your area
              </Text>
            </View>
            <Text style={[styles.actionArrow, { color: colors.cardBorder }]}>›</Text>
          </TouchableOpacity>
 
          <TouchableOpacity
            style={[styles.actionCard, {
              backgroundColor: colors.card,
              borderColor: colors.cardBorder,
            }]}
            onPress={() => router.push('/(tabs)/explore/listview')}
          >
            <Text style={styles.actionIcon}>📋</Text>
            <View style={styles.actionContent}>
              <Text style={[styles.actionTitle, { color: colors.text }]}>Recent Posts</Text>
              <Text style={[styles.actionSubtitle, { color: colors.textSecondary }]}>
                Browse community identifications
              </Text>
            </View>
            <Text style={[styles.actionArrow, { color: colors.cardBorder }]}>›</Text>
          </TouchableOpacity>
        </ThemedView>
 
        {/* Preview of user's most recent posts */}
        {userPosts.length > 0 && (
          <ThemedView style={styles.section}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              Your Recent Posts
            </ThemedText>
            {userPosts.slice(0, 3).map((post) => (
              <TouchableOpacity
                key={post.id}
                style={[styles.recentPostCard, {
                  backgroundColor: colors.card,
                  borderColor: colors.cardBorder,
                }]}
                onPress={() => router.push({
                  pathname: '/(tabs)/explore/discussion',
                  params: { postId: post.id }
                })}
              >
                <Image source={{ uri: post.imageUrl }} style={styles.recentPostImage} />
                <View style={styles.recentPostInfo}>
                  <Text style={[styles.recentPostTitle, { color: colors.text }]}>
                    {post.commonName}
                  </Text>
                  <Text style={[styles.recentPostMeta, { color: colors.textMuted }]}>
                    💬 {post.commentCount || 0} comments
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </ThemedView>
        )}
      </ParallaxScrollView>
    );
  }
 
  // Unauthenticated view
  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#A1CEDC', dark: '#1D3D47' }}
      headerImage={
        <Image
          source={require('@/assets/images/home-page-leaf.png')}
          style={styles.headerImage}
        />
      }>
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">Welcome to Speciespy!</ThemedText>
        <HelloWave />
      </ThemedView>
      <ThemedView style={styles.stepContainer}>
        <Link href="/modal">
          <ThemedText
            type="subtitle"
            style={{ textDecorationLine: 'underline', color: colors.primary }}
          >
            Step 1: Create an Account or Login
          </ThemedText>
        </Link>
      </ThemedView>
      <ThemedView style={styles.stepContainer}>
        <ThemedText type="subtitle">
          {"Step 2: Explore your community's identified species"}
        </ThemedText>
        <ThemedText>
          {`Click the "Explore" tab at the bottom of the screen to see species identified by other users in your community.`}
        </ThemedText>
      </ThemedView>
      <ThemedView style={styles.stepContainer}>
        <ThemedText type="subtitle">Step 3: Identify your first species</ThemedText>
        <ThemedText>
          {`When you're ready, take your first photo using the identify tab with the camera icon.`}
        </ThemedText>
      </ThemedView>
    </ParallaxScrollView>
  );
}
 
const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepContainer: {
    gap: 8,
    marginBottom: 8,
  },
  headerImage: {
    height: '100%',
    width: '100%',
    position: 'absolute',
  },
  brandHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    marginBottom: 10,
    gap: 12,
  },
  logo: {
    width: 50,
    height: 50,
  },
  appName: {
    fontSize: 28,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  userHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
    borderWidth: 1,
  },
  userInfo: {
    flex: 1,
  },
  greeting: {
    fontSize: 12,
    marginBottom: 2,
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  logoutButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 8,
  },
  logoutText: {
    fontWeight: '600',
    fontSize: 14,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 12,
    textAlign: 'center',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    marginBottom: 15,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1,
  },
  actionIcon: {
    fontSize: 32,
    marginRight: 15,
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 3,
  },
  actionSubtitle: {
    fontSize: 13,
  },
  actionArrow: {
    fontSize: 24,
  },
  recentPostCard: {
    flexDirection: 'row',
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 1,
  },
  recentPostImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
  },
  recentPostInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  recentPostTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  recentPostMeta: {
    fontSize: 13,
  },
});