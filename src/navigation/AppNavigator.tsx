import React from 'react';
import { Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import type { RootStackParamList, TabParamList } from '../types/navigation';
import { HomeScreen } from '../screens/HomeScreen';
import { ScannerScreen } from '../screens/ScannerScreen';
import { RandomizerScreen } from '../screens/RandomizerScreen';
import { BookDetailScreen } from '../screens/BookDetailScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

function TabIcon({ icon, focused }: { icon: string; focused: boolean }) {
  return <Text style={{ fontSize: 22, opacity: focused ? 1 : 0.5 }}>{icon}</Text>;
}

function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#4f46e5',
        tabBarInactiveTintColor: '#9ca3af',
        tabBarStyle: {
          borderTopWidth: 1,
          borderTopColor: '#f3f4f6',
          paddingBottom: 4,
          paddingTop: 4,
          height: 60,
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
          tabBarIcon: ({ focused }) => <TabIcon icon="📚" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Scanner"
        component={ScannerScreen}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon icon="📷" focused={focused} />,
          tabBarLabel: 'Adicionar',
        }}
      />
      <Tab.Screen
        name="Sorteador"
        component={RandomizerScreen}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon icon="🎲" focused={focused} />,
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
      </Stack.Navigator>
    </NavigationContainer>
  );
}
