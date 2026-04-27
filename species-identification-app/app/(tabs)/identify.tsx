/**
 * Species identification/camera screen. Handles camera permissions, taking photos, and submitting them for identification and posting.
 * Uses Expo CameraView for the camera interface, and integrates with the createPost function to handle uploading and identification.
 * Provides user feedback throughout the process, including loading states and success/error messages.
 */
import { StyleSheet, View, Text, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import React, { useState, useEffect, useRef } from 'react';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Image } from 'expo-image';
import { IconSymbol } from '@/components/ui/icon-symbol';
import * as Location from 'expo-location';
import { createPost } from '@/services/speciesService';
import { auth } from '@/firebase/fbconfig';
import { useRouter } from 'expo-router';
import { useThemeColors } from '@/hooks/useThemeColors';

export default function CameraIdentify() {
  const [permission, requestPermission] = useCameraPermissions();
  const [cameraFacing, setCameraFacing] = useState<'front' | 'back'>('back');
  const [photo, setPhoto] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const cameraRef = useRef<CameraView>(null);
  const router = useRouter();
  const colors = useThemeColors();

  // Request camera and location permissions per device not per account
  useEffect(() => {
    if (!permission) {
      requestPermission();
    }
 
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Location permission is needed for map pins');
      }
    })();
  }, [permission]);
 
  // Takes a photo from the camera
  const takePhoto = async () => {
    if (cameraRef.current) {
      const result = await cameraRef.current.takePictureAsync();
      setPhoto(result?.uri || null);
    }
  };
 
  // Uploads the photo to Firebase, gets GPS coordinates, and triggers species identification
  const handleSubmit = async () => {
    if (!photo) return;
 
    if (!auth.currentUser) {
      Alert.alert('Not Signed In', 'Please sign in to post');
      return;
    }
 
    setLoading(true);
 
    try {
      // Attempt to get device location for map pin
      let location = null;
      try {
        location = await Location.getCurrentPositionAsync({});
      } catch (e) {
        console.log('Could not get location:', e);
      }
 
      // Upload photo and run species identification
      const result = await createPost(
        photo,
        location?.coords.latitude,
        location?.coords.longitude
      );
 
      setLoading(false);
 
      if (result.confidence > 0) {
        // Identification succeeded
        Alert.alert(
          '🎉 Species Identified!',
          `${result.commonName}\n(${result.scientificName})\n\nConfidence: ${(result.confidence * 100).toFixed(1)}%`,
          [
            {
              text: 'View on Map',
              onPress: () => {
                setPhoto(null);
                router.push('/(tabs)/explore/explore');
              }
            },
            { text: 'Take Another', onPress: () => setPhoto(null) }
          ]
        );
      } else {
        // Photo uploaded but identification failed
        Alert.alert(
          'Photo Posted! 📸',
          'Your photo has been uploaded, but species identification failed. You can still view and comment on it!\n\nThe species will be marked as "To be identified".',
          [
            {
              text: 'View Post',
              onPress: () => {
                setPhoto(null);
                router.push({
                  pathname: '/(tabs)/explore/discussion',
                  params: { postId: result.postId }
                });
              }
            },
            { text: 'Take Another', onPress: () => setPhoto(null) }
          ]
        );
      }
    } catch (error: any) {
      setLoading(false);
      Alert.alert('Error', error.message || 'Failed to upload photo');
      console.error('Upload error:', error);
    }
  };
 
  // No camera permission
  if (!permission?.granted) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.text }}>We need your permission to show the camera</Text>
        <TouchableOpacity
          style={[styles.permissionButton, { backgroundColor: colors.primary }]}
          onPress={requestPermission}
        >
          <Text style={[styles.permissionText, { color: colors.primaryText }]}>
            Grant Permission
          </Text>
        </TouchableOpacity>
      </View>
    );
  }
 
  // Photo preview with retake/submit options
  if (photo) {
    return (
      <View style={styles.previewContainer}>
        <Image source={{ uri: photo }} contentFit="contain" style={styles.preview} />
 
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Uploading photo...</Text>
            <Text style={[styles.loadingText, { fontSize: 12, marginTop: 5 }]}>
              Identifying species...
            </Text>
          </View>
        ) : (
          <View style={styles.previewButtons}>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: colors.retake }]}
              onPress={() => setPhoto(null)}
            >
              <IconSymbol name="arrow.uturn.backward.circle.fill" size={28} color="white" />
              <Text style={styles.actionText}>Retake</Text>
            </TouchableOpacity>
 
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: colors.primary }]}
              onPress={handleSubmit}
            >
              <IconSymbol name="icloud.and.arrow.up.fill" size={28} color="white" />
              <Text style={styles.actionText}>Post</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  }
 
  // Camera
  return (
    <View style={styles.container}>
      <CameraView style={styles.camera} facing={cameraFacing} ref={cameraRef} />
 
      <View style={styles.controls}>
        {/* Flip camera button */}
        <TouchableOpacity
          style={[styles.iconButton, { backgroundColor: colors.overlay }]}
          onPress={() =>
            setCameraFacing((prev) => (prev === 'back' ? 'front' : 'back'))
          }
        >
          <IconSymbol name="arrow.triangle.2.circlepath.camera" size={30} color="white" />
        </TouchableOpacity>
 
        {/* Photo capture button */}
        <TouchableOpacity
          style={[styles.captureButton, { backgroundColor: colors.primary }]}
          onPress={takePhoto}
        />
 
        <View style={{ width: 60 }} />
      </View>
    </View>
  );
}
 
const styles = StyleSheet.create({
  container: { flex: 1 },
  camera: { flex: 1 },
  controls: {
    position: 'absolute',
    bottom: 50,
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  iconButton: {
    padding: 10,
    borderRadius: 50,
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 4,
    borderColor: 'white',
  },
  previewContainer: {
    flex: 1,
    backgroundColor: 'black',
    justifyContent: 'center',
    alignItems: 'center',
  },
  preview: { width: '100%', height: '80%' },
  previewButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '80%',
    marginTop: 20,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 30,
    gap: 8,
  },
  actionText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  permissionButton: {
    marginTop: 15,
    padding: 10,
    borderRadius: 10,
  },
  permissionText: { fontWeight: 'bold' },
  loadingContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  loadingText: {
    color: 'white',
    marginTop: 10,
    fontSize: 16,
  },
});