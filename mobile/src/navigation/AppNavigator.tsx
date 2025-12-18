import React from 'react';
import { ActivityIndicator, View, TouchableOpacity, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { Sidebar } from '../components';
import { useAuth } from '../context/AuthContext';
import {
  LoginScreen,
  ForgotPasswordScreen,
  DashboardScreen,
  PaymentsScreen,
  AssessmentsScreen,
  ProfileScreen,
  PaymentDetailsScreen,
  AssessmentDetailsScreen,
  LGAScreen,
  InstitutionsScreen,
  InstitutionDetailsScreen,
  ChangePasswordScreen,
  NotificationsScreen,
  HelpSupportScreen,
  AboutScreen,
  ReportsScreen,
  ReportDetailsScreen,
  UsersScreen,
} from '../screens';
import { RootStackParamList, MainTabParamList } from '../types';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

function MainTabs() {
  const { user } = useAuth();
  
  return (
    <Tab.Navigator
      screenOptions={({ route, navigation }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          switch (route.name) {
            case 'Dashboard':
              iconName = focused ? 'grid' : 'grid-outline';
              break;
            case 'Payments':
              iconName = focused ? 'wallet' : 'wallet-outline';
              break;
            case 'Assessments':
              iconName = focused ? 'document-text' : 'document-text-outline';
              break;
            case 'Profile':
              iconName = focused ? 'person' : 'person-outline';
              break;
            default:
              iconName = 'ellipse';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#059669',
        tabBarInactiveTintColor: '#9ca3af',
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopWidth: 1,
          borderTopColor: '#f3f4f6',
          paddingTop: 8,
          paddingBottom: 8,
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '500',
        },
        headerStyle: {
          backgroundColor: '#fff',
        },
        headerTitleStyle: {
          fontWeight: '600',
          color: '#1f2937',
        },
        headerShadowVisible: false,
        headerLeft: () => (
          <View style={styles.headerLeft}>
            <Ionicons
              name="menu"
              size={24}
              color="#1f2937"
              style={{ marginLeft: 16 }}
              onPress={() => (navigation as any).openDrawer()}
            />
            {/* Admin-only dropdown menu */}
            {['super_admin', 'admin', 'officer', 'hon_commissioner', 'system_admin'].includes(user?.role || '') && (
              <TouchableOpacity style={styles.menuButton} onPress={() => (navigation as any).navigate('Users')}>
                <Ionicons name="people" size={20} color="#059669" />
              </TouchableOpacity>
            )}
          </View>
        ),
      })}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{ title: 'Dashboard' }}
      />
      <Tab.Screen
        name="Payments"
        component={PaymentsScreen}
        options={{ title: 'Payments' }}
      />
      <Tab.Screen
        name="Assessments"
        component={AssessmentsScreen}
        options={{ title: 'Assessments' }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ title: 'Profile' }}
      />
    </Tab.Navigator>
  );
}

const Drawer = createDrawerNavigator();

function DrawerGroup() {
  return (
    <Drawer.Navigator
      drawerContent={(props) => <Sidebar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Drawer.Screen name="MainTabs" component={MainTabs} />
    </Drawer.Navigator>
  );
}

export function AppNavigator() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color="#059669" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isAuthenticated ? (
          <>
            <Stack.Screen name="Main" component={DrawerGroup} />
            <Stack.Screen
              name="PaymentDetail"
              component={PaymentDetailsScreen}
              options={{ title: 'Payment Details', headerShown: true }}
            />
            <Stack.Screen
              name="AssessmentDetail"
              component={AssessmentDetailsScreen}
              options={{ title: 'Assessment Details', headerShown: true }}
            />
            <Stack.Screen
              name="LGAList"
              component={LGAScreen}
              options={{ title: 'LGA Performance', headerShown: true }}
            />
            <Stack.Screen
              name="Institutions"
              component={InstitutionsScreen}
              options={{ title: 'Institutions', headerShown: true }}
            />
            <Stack.Screen
              name="InstitutionDetail"
              component={InstitutionDetailsScreen}
              options={{ title: 'Institution Details', headerShown: true }}
            />
            <Stack.Screen
              name="ChangePassword"
              component={ChangePasswordScreen}
              options={{ title: 'Change Password', headerShown: true }}
            />
            <Stack.Screen
              name="Notifications"
              component={NotificationsScreen}
              options={{ title: 'Notifications', headerShown: true }}
            />
            <Stack.Screen
              name="HelpSupport"
              component={HelpSupportScreen}
              options={{ title: 'Help & Support', headerShown: true }}
            />
            <Stack.Screen
              name="About"
              component={AboutScreen}
              options={{ title: 'About', headerShown: true }}
            />
            <Stack.Screen
              name="Reports"
              component={ReportsScreen}
              options={{ title: 'Reports', headerShown: true }}
            />
            <Stack.Screen
              name="ReportDetails"
              component={ReportDetailsScreen}
              options={{ title: 'Report Details', headerShown: true }}
            />
          </>
        ) : (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuButton: {
    marginLeft: 16,
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#f0fdf4',
  },
});

// export { AppNavigator };
