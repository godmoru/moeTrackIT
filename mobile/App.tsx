import React, { useEffect } from './_node_modules/@types/react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/context/AuthContext';
import { AppNavigator } from './src/navigation';
import { api } from './src/services/api';

export default function App() {
  useEffect(() => {
    // Initialize API service
    api.init();
  }, []);

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <StatusBar style="dark" />
        <AppNavigator />
      </AuthProvider>
    </SafeAreaProvider>
  );
}
