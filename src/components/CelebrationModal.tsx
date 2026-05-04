import React, { useEffect } from 'react';
import { Modal, View, Text, TouchableOpacity } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
  withDelay,
  Easing,
} from 'react-native-reanimated';

interface Props {
  visible: boolean;
  bookTitle: string;
  onClose: () => void;
}

const STARS = ['⭐', '🌟', '✨'];

function FloatingStar({ emoji, delay }: { emoji: string; delay: number }) {
  const translateY = useSharedValue(0);
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.5);

  useEffect(() => {
    translateY.value = withDelay(delay, withSequence(
      withTiming(-60, { duration: 900, easing: Easing.out(Easing.quad) }),
      withTiming(-90, { duration: 600 }),
    ));
    opacity.value = withDelay(delay, withSequence(
      withTiming(1, { duration: 300 }),
      withDelay(800, withTiming(0, { duration: 400 })),
    ));
    scale.value = withDelay(delay, withSpring(1, { damping: 6 }));
  }, []);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }, { scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.Text style={[{ fontSize: 28, position: 'absolute' }, style]}>
      {emoji}
    </Animated.Text>
  );
}

export function CelebrationModal({ visible, bookTitle, onClose }: Props) {
  const scale = useSharedValue(0.7);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      scale.value = withSpring(1, { damping: 10, stiffness: 120 });
      opacity.value = withTiming(1, { duration: 250 });
    } else {
      scale.value = withTiming(0.7, { duration: 200 });
      opacity.value = withTiming(0, { duration: 200 });
    }
  }, [visible]);

  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', alignItems: 'center', justifyContent: 'center', padding: 32 }}>
        <Animated.View style={[{
          backgroundColor: 'white',
          borderRadius: 28,
          padding: 32,
          alignItems: 'center',
          width: '100%',
        }, containerStyle]}>
          {/* Estrelas flutuantes */}
          <View style={{ height: 64, alignItems: 'center', justifyContent: 'flex-end', marginBottom: 4 }}>
            <Text style={{ fontSize: 56 }}>🏆</Text>
            {STARS.map((star, i) => (
              <FloatingStar key={i} emoji={star} delay={i * 150} />
            ))}
          </View>

          <Text style={{ fontSize: 22, fontWeight: '800', color: '#111827', marginTop: 12, textAlign: 'center' }}>
            Livro Concluído!
          </Text>
          <Text style={{ fontSize: 13, color: '#6b7280', marginTop: 6, textAlign: 'center', lineHeight: 20 }}>
            Parabéns! Você terminou{'\n'}
            <Text style={{ color: '#4f46e5', fontWeight: '700' }} numberOfLines={2}>
              "{bookTitle}"
            </Text>
          </Text>

          <View style={{ flexDirection: 'row', gap: 8, marginTop: 24, width: '100%' }}>
            <TouchableOpacity
              onPress={onClose}
              style={{ flex: 1, backgroundColor: '#4f46e5', borderRadius: 16, height: 48, alignItems: 'center', justifyContent: 'center' }}
            >
              <Text style={{ color: 'white', fontWeight: '700', fontSize: 15 }}>Incrível! 🎉</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}
