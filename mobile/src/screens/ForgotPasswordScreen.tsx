import React, { useState } from '../../_node_modules/@types/react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { Input, Button } from '../components';
import { api } from '../services/api';
import { RootStackParamList } from '../types';

type ForgotPasswordScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'ForgotPassword'>;
};

export function ForgotPasswordScreen({ navigation }: ForgotPasswordScreenProps) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  async function handleSubmit() {
    if (!email) {
      setError('Please enter your email');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await api.forgotPassword(email);
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Request failed');
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <View style={styles.container}>
        <View style={styles.successContainer}>
          <View style={styles.successIcon}>
            <Ionicons name="mail-outline" size={48} color="#059669" />
          </View>
          <Text style={styles.successTitle}>Check Your Email</Text>
          <Text style={styles.successText}>
            We've sent password reset instructions to {email}
          </Text>
          <Button
            title="Back to Login"
            onPress={() => navigation.navigate('Login')}
            style={{ marginTop: 24 }}
          />
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#1f2937" />
        </TouchableOpacity>

        <View style={styles.header}>
          <Text style={styles.title}>Forgot Password?</Text>
          <Text style={styles.subtitle}>
            Enter your email address and we'll send you instructions to reset
            your password.
          </Text>
        </View>

        <View style={styles.form}>
          {error ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <Input
            label="Email"
            placeholder="Enter your email"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            leftIcon="mail-outline"
            value={email}
            onChangeText={setEmail}
          />

          <Button
            title="Send Reset Link"
            onPress={handleSubmit}
            loading={loading}
            size="lg"
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
  },
  backButton: {
    marginBottom: 24,
  },
  header: {
    marginBottom: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: '#6b7280',
    lineHeight: 22,
  },
  form: {},
  errorContainer: {
    backgroundColor: '#fef2f2',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    color: '#dc2626',
    fontSize: 14,
    textAlign: 'center',
  },
  successContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  successIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#ecfdf5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 8,
  },
  successText: {
    fontSize: 15,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 22,
  },
});
