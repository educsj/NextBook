import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  Easing,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { TabScreenProps } from '../types/navigation';

// Mock — será substituído por query do WatermelonDB
const UNREAD_BOOKS = [
  { id: '2', title: 'Duna', author: 'Frank Herbert', totalPages: 688 },
  { id: '3', title: 'Foundation', author: 'Isaac Asimov', totalPages: 244 },
  { id: '4', title: 'Neuromancer', author: 'William Gibson', totalPages: 271 },
  { id: '5', title: '1984', author: 'George Orwell', totalPages: 328 },
];

export function RandomizerScreen({ navigation }: TabScreenProps<'Sorteador'>) {
  const [selected, setSelected] = useState<(typeof UNREAD_BOOKS)[0] | null>(null);
  const [isSpinning, setIsSpinning] = useState(false);

  const spinAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const spin = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '720deg'],
  });

  function handleDraw() {
    if (isSpinning || UNREAD_BOOKS.length === 0) return;

    setIsSpinning(true);
    setSelected(null);
    fadeAnim.setValue(0);
    spinAnim.setValue(0);

    Animated.sequence([
      Animated.parallel([
        Animated.timing(spinAnim, {
          toValue: 1,
          duration: 1000,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.timing(scaleAnim, {
            toValue: 1.2,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 1,
            duration: 700,
            useNativeDriver: true,
          }),
        ]),
      ]),
    ]).start(() => {
      const picked = UNREAD_BOOKS[Math.floor(Math.random() * UNREAD_BOOKS.length)];
      setSelected(picked);
      setIsSpinning(false);

      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }).start();
    });
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
      <View className="flex-1 px-4 pt-4">
        <Text className="text-2xl font-bold text-gray-900 mb-1">Sorteador</Text>
        <Text className="text-gray-500 text-sm mb-8">
          {UNREAD_BOOKS.length} livros não lidos disponíveis
        </Text>

        {/* Área central do sorteio */}
        <View className="flex-1 items-center justify-center">
          <Animated.View
            style={{ transform: [{ rotate: spin }, { scale: scaleAnim }] }}
          >
            <TouchableOpacity
              onPress={handleDraw}
              disabled={isSpinning}
              className="w-44 h-44 rounded-full bg-indigo-600 items-center justify-center shadow-lg"
              style={{ elevation: 8 }}
            >
              <Text className="text-6xl">{isSpinning ? '🎲' : '📚'}</Text>
              <Text className="text-white font-bold mt-2 text-sm">
                {isSpinning ? 'Sorteando...' : 'Sortear!'}
              </Text>
            </TouchableOpacity>
          </Animated.View>

          {/* Resultado */}
          {selected && (
            <Animated.View
              className="w-full bg-white rounded-2xl p-5 mt-10 shadow-sm"
              style={{ elevation: 3, opacity: fadeAnim }}
            >
              <Text className="text-xs text-indigo-500 font-semibold uppercase tracking-wider mb-2">
                Seu próximo livro é...
              </Text>
              <Text className="text-gray-900 text-xl font-bold">{selected.title}</Text>
              <Text className="text-gray-500 mt-1">{selected.author}</Text>
              <Text className="text-gray-400 text-xs mt-1">{selected.totalPages} páginas</Text>

              <View className="flex-row gap-3 mt-4">
                <TouchableOpacity
                  className="flex-1 bg-indigo-600 rounded-xl h-11 items-center justify-center"
                  onPress={() => navigation.navigate('BookDetail', { bookId: selected.id })}
                >
                  <Text className="text-white font-semibold text-sm">Ver Detalhes</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  className="flex-1 border border-gray-200 rounded-xl h-11 items-center justify-center"
                  onPress={handleDraw}
                >
                  <Text className="text-gray-600 font-semibold text-sm">Sortear outro</Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          )}

          {UNREAD_BOOKS.length === 0 && (
            <View className="items-center mt-10">
              <Text className="text-gray-400 text-center text-sm">
                Não há livros não lidos na estante.{'\n'}Adicione livros para sortear!
              </Text>
            </View>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}
