import React, { useState } from 'react';
import { View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { DatabaseProvider } from '@nozbe/watermelondb/DatabaseProvider';
import { database } from './src/database';
import { AppNavigator } from './src/navigation/AppNavigator';
import { AnimatedSplash } from './src/components/AnimatedSplash';
import { useIsDark } from './src/hooks/useIsDark';
import { useColorScheme } from 'nativewind';

function AppContent() {
  const isDark = useIsDark();
  const [splashDone, setSplashDone] = useState(false);
  const { setColorScheme } = useColorScheme();

  React.useEffect(() => {
    setColorScheme(isDark ? 'dark' : 'light');
  }, [isDark]);

  return (
    <View className="flex-1">
      <AppNavigator />
      <StatusBar style={isDark ? 'light' : 'dark'} />
      {!splashDone && <AnimatedSplash onFinish={() => setSplashDone(true)} />}
    </View>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <DatabaseProvider database={database}>
        <AppContent />
      </DatabaseProvider>
    </GestureHandlerRootView>
  );
}
