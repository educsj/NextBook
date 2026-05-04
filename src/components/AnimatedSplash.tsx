import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withDelay,
  runOnJS,
  Easing,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

interface Props {
  onFinish: () => void;
}

export function AnimatedSplash({ onFinish }: Props) {
  const { t } = useTranslation();
  const bookScale = useSharedValue(0.3);
  const bookOpacity = useSharedValue(0);
  const textOpacity = useSharedValue(0);
  const containerOpacity = useSharedValue(1);

  const bookStyle = useAnimatedStyle(() => ({
    transform: [{ scale: bookScale.value }],
    opacity: bookOpacity.value,
  }));

  const textStyle = useAnimatedStyle(() => ({
    opacity: textOpacity.value,
    transform: [{ translateY: withTiming(textOpacity.value === 0 ? 10 : 0) }],
  }));

  const containerStyle = useAnimatedStyle(() => ({
    opacity: containerOpacity.value,
  }));

  useEffect(() => {
    bookScale.value = withTiming(1, { duration: 500, easing: Easing.out(Easing.back(1.5)) });
    bookOpacity.value = withTiming(1, { duration: 400 });
    textOpacity.value = withDelay(400, withTiming(1, { duration: 400 }));
    containerOpacity.value = withDelay(
      1800,
      withTiming(0, { duration: 500 }, (finished) => {
        if (finished) runOnJS(onFinish)();
      }),
    );
  }, []);

  return (
    <Animated.View style={[StyleSheet.absoluteFill, styles.container, containerStyle]}>
      <Animated.View style={[styles.iconWrapper, bookStyle]}>
        <Ionicons name="library" size={72} color="white" />
      </Animated.View>
      <Animated.View style={textStyle}>
        <Text style={styles.title}>Next Book</Text>
        <Text style={styles.subtitle}>{t('splash.subtitle')}</Text>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    zIndex: 999,
    backgroundColor: '#4f46e5',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
  },
  iconWrapper: {
    width: 120,
    height: 120,
    borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    color: 'white',
    fontSize: 32,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  subtitle: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 4,
  },
});
