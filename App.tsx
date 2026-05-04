import { StatusBar } from 'expo-status-bar';
import { DatabaseProvider } from '@nozbe/watermelondb/DatabaseProvider';
import { database } from './src/database';
import { AppNavigator } from './src/navigation/AppNavigator';

export default function App() {
  return (
    <DatabaseProvider database={database}>
      <AppNavigator />
      <StatusBar style="auto" />
    </DatabaseProvider>
  );
}
