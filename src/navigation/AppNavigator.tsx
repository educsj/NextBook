import React from 'react';
import { View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { useIsDark } from '../hooks/useIsDark';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { RootStackParamList, TabParamList } from '../types/navigation';
import { HomeScreen } from '../screens/HomeScreen';
import { ScannerScreen } from '../screens/ScannerScreen';
import { RandomizerScreen } from '../screens/RandomizerScreen';
import { BookDetailScreen } from '../screens/BookDetailScreen';
import { SettingsScreen } from '../screens/SettingsScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

function AddFabIcon() {
  return (
    <View
      style={{
        width: 52,
        height: 52,
        borderRadius: 26,
        backgroundColor: '#4f46e5',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
        elevation: 6,
        shadowColor: '#4f46e5',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 6,
      }}
    >
      <Ionicons name="add" size={28} color="white" />
    </View>
  );
}

function TabNavigator() {
  const isDark = useIsDark();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#818cf8',
        tabBarInactiveTintColor: isDark ? '#64748b' : '#9ca3af',
        tabBarStyle: {
          borderTopWidth: 1,
          borderTopColor: isDark ? '#1e293b' : '#f3f4f6',
          backgroundColor: isDark ? '#0f172a' : '#ffffff',
          paddingBottom: insets.bottom + 4,
          paddingTop: 4,
          height: 60 + insets.bottom,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '500',
        },
      }}
    >
      <Tab.Screen
        name="Estante"
        component={HomeScreen}
        options={{
          tabBarLabel: t('tabs.shelf'),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="book-outline" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Scanner"
        component={ScannerScreen}
        options={{
          tabBarLabel: () => null,
          tabBarIcon: () => <AddFabIcon />,
        }}
      />
      <Tab.Screen
        name="Sorteador"
        component={RandomizerScreen}
        options={{
          tabBarLabel: t('tabs.randomizer'),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="shuffle-outline" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

export function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Tabs" component={TabNavigator} />
        <Stack.Screen
          name="BookDetail"
          component={BookDetailScreen}
          options={{ animation: 'slide_from_right' }}
        />
        <Stack.Screen
          name="Settings"
          component={SettingsScreen}
          options={{ animation: 'slide_from_right' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
