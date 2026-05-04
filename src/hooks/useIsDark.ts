import { useColorScheme } from 'react-native';
import { useThemeStore } from '../store/useThemeStore';

export function useIsDark(): boolean {
  const systemScheme = useColorScheme();
  const { theme } = useThemeStore();
  if (theme === 'dark') return true;
  if (theme === 'light') return false;
  return systemScheme === 'dark';
}
