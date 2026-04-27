/**
 * Modal for logging in or signing up users. Provides input validation and error handling for authentication processes.
 * Validates if password length, uppercase, lowercase, number, and special character are present.
 * Utilizes Firebase Authentication for user management and Expo Router for navigation.
 */
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import React, { useState } from 'react';
import { View, TextInput, Pressable, Alert, StyleSheet } from 'react-native';
import { signUp, signIn } from '../firebase/fbauth';
import { useRouter } from 'expo-router';
import { useThemeColors } from '@/hooks/useThemeColors';
 
export default function LoginModal() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const router = useRouter();
  const colors = useThemeColors();
 
  // Returns an error message if the password is too weak
  const validatePassword = (password: string): string | null => {
    if (password.length < 8) return 'Password must be at least 8 characters';
    if (!/[A-Z]/.test(password)) return 'Password must include an uppercase letter';
    if (!/[a-z]/.test(password)) return 'Password must include a lowercase letter';
    if (!/[0-9]/.test(password)) return 'Password must include a number';
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) return 'Password must include a special character';
    return null;
  };
 
  // Handles login or sign up
  const handleSubmit = async () => {
    if (!email.trim()) {
      Alert.alert('Error', 'Please enter your email address');
      return;
    }
 
    if (!isLogin) {
      const passwordError = validatePassword(password);
      if (passwordError) {
        Alert.alert('Weak Password', passwordError);
        return;
      }
    }
 
    try {
      if (isLogin) {
        await signIn(email, password);
      } else {
        await signUp(email, password);
      }
      router.back();
    } catch (err: any) {
      Alert.alert('Error', err.message);
    }
  };
 
  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title" style={styles.title}>
        {isLogin ? 'Login' : 'Sign Up'}
      </ThemedText>
      <TextInput
        style={[styles.input, { color: colors.text, borderBottomColor: colors.inputBorder }]}
        placeholder="Email"
        placeholderTextColor={colors.placeholder}
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        style={[styles.input, { color: colors.text, borderBottomColor: colors.inputBorder }]}
        placeholder="Password"
        placeholderTextColor={colors.placeholder}
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />
      <Pressable
        style={[styles.button, { backgroundColor: colors.primary }]}
        onPress={handleSubmit}
      >
        <ThemedText type="subtitle" style={[styles.buttonText, { color: colors.primaryText }]}>
          {isLogin ? 'Login' : 'Sign Up'}
        </ThemedText>
      </Pressable>
      <Pressable
        style={styles.link}
        onPress={() => setIsLogin(!isLogin)}
      >
        <ThemedText type="subtitle">
          {isLogin ? 'or Sign Up' : 'or Login'}
        </ThemedText>
      </Pressable>
    </ThemedView>
  );
}
 
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  title: {
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    width: '100%',
    borderBottomWidth: 1,
    marginBottom: 15,
    paddingVertical: 5,
    paddingHorizontal: 10,
  },
  button: {
    padding: 12,
    borderRadius: 8,
    marginTop: 10,
    alignItems: 'center',
  },
  buttonText: {
    fontWeight: 'bold',
  },
  link: {
    marginTop: 15,
    alignItems: 'center',
  },
});