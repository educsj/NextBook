import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { RootStackScreenProps } from '../types/navigation';

// Mock — será substituído por query do WatermelonDB
const MOCK_BOOKS: Record<string, {
  id: string;
  title: string;
  author: string;
  coverUrl: string | null;
  totalPages: number;
  readPages: number;
  isRead: boolean;
  rating: number | null;
  notes: string;
  isbn: string | null;
}> = {
  '1': { id: '1', title: 'O Senhor dos Anéis', author: 'J.R.R. Tolkien', coverUrl: null, totalPages: 1178, readPages: 1178, isRead: true, rating: 5, notes: 'Uma obra-prima da fantasia.', isbn: '9780618640157' },
  '2': { id: '2', title: 'Duna', author: 'Frank Herbert', coverUrl: null, totalPages: 688, readPages: 320, isRead: false, rating: null, notes: '', isbn: '9780441013593' },
  '3': { id: '3', title: 'Foundation', author: 'Isaac Asimov', coverUrl: null, totalPages: 244, readPages: 0, isRead: false, rating: null, notes: '', isbn: null },
};

function StarRating({
  value,
  onChange,
}: {
  value: number | null;
  onChange: (r: number) => void;
}) {
  return (
    <View className="flex-row gap-2">
      {[1, 2, 3, 4, 5].map((star) => (
        <Pressable key={star} onPress={() => onChange(star)}>
          <Text className={`text-3xl ${value !== null && star <= value ? 'text-amber-400' : 'text-gray-200'}`}>
            ★
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

export function BookDetailScreen({ route, navigation }: RootStackScreenProps<'BookDetail'>) {
  const book = MOCK_BOOKS[route.params.bookId];

  const [readPages, setReadPages] = useState(String(book?.readPages ?? 0));
  const [rating, setRating] = useState<number | null>(book?.rating ?? null);
  const [notes, setNotes] = useState(book?.notes ?? '');

  if (!book) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-gray-50">
        <Text className="text-gray-500">Livro não encontrado.</Text>
      </SafeAreaView>
    );
  }

  const progress = book.totalPages > 0
    ? Math.min((Number(readPages) / book.totalPages) * 100, 100)
    : 0;

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['bottom']}>
      <ScrollView contentContainerClassName="pb-10">
        {/* Header com capa */}
        <View className="bg-indigo-600 pt-4 pb-10 px-4 items-center">
          <TouchableOpacity
            className="self-start mb-4"
            onPress={() => navigation.goBack()}
          >
            <Text className="text-white text-base">← Voltar</Text>
          </TouchableOpacity>

          {book.coverUrl ? (
            <Image
              source={{ uri: book.coverUrl }}
              className="w-32 h-48 rounded-xl"
              resizeMode="cover"
            />
          ) : (
            <View className="w-32 h-48 rounded-xl bg-indigo-400 items-center justify-center">
              <Text className="text-6xl">📖</Text>
            </View>
          )}
        </View>

        <View className="px-4 -mt-6">
          {/* Card principal */}
          <View className="bg-white rounded-2xl p-4 mb-4 shadow-sm" style={{ elevation: 2 }}>
            <Text className="text-xl font-bold text-gray-900">{book.title}</Text>
            <Text className="text-gray-500 mt-1">{book.author}</Text>
            {book.isbn && (
              <Text className="text-gray-400 text-xs mt-1">ISBN: {book.isbn}</Text>
            )}

            <View className="flex-row items-center mt-3">
              <View className={`px-3 py-1 rounded-full ${book.isRead ? 'bg-green-100' : 'bg-amber-100'}`}>
                <Text className={`text-xs font-medium ${book.isRead ? 'text-green-700' : 'text-amber-700'}`}>
                  {book.isRead ? '✓ Lido' : '📖 Em leitura'}
                </Text>
              </View>
            </View>
          </View>

          {/* Progresso de leitura */}
          {!book.isRead && (
            <View className="bg-white rounded-2xl p-4 mb-4 shadow-sm" style={{ elevation: 2 }}>
              <Text className="text-gray-800 font-semibold mb-3">Progresso de Leitura</Text>

              <View className="flex-row items-center gap-3 mb-3">
                <TextInput
                  className="border border-gray-200 rounded-xl px-3 h-11 w-24 text-center text-gray-800"
                  keyboardType="numeric"
                  value={readPages}
                  onChangeText={setReadPages}
                  maxLength={5}
                />
                <Text className="text-gray-500 text-sm">de {book.totalPages} páginas</Text>
              </View>

              <View className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <View
                  className="h-full bg-indigo-500 rounded-full"
                  style={{ width: `${progress}%` }}
                />
              </View>
              <Text className="text-indigo-500 text-xs font-medium mt-1 text-right">
                {Math.round(progress)}%
              </Text>
            </View>
          )}

          {/* Avaliação */}
          <View className="bg-white rounded-2xl p-4 mb-4 shadow-sm" style={{ elevation: 2 }}>
            <Text className="text-gray-800 font-semibold mb-3">Avaliação</Text>
            <StarRating value={rating} onChange={setRating} />
            {rating !== null && (
              <Pressable onPress={() => setRating(null)} className="mt-2">
                <Text className="text-gray-400 text-xs">Remover avaliação</Text>
              </Pressable>
            )}
          </View>

          {/* Notas */}
          <View className="bg-white rounded-2xl p-4 mb-4 shadow-sm" style={{ elevation: 2 }}>
            <Text className="text-gray-800 font-semibold mb-3">Notas & Anotações</Text>
            <TextInput
              className="text-gray-700 text-sm leading-5 min-h-24"
              placeholder="Escreva suas anotações sobre o livro..."
              placeholderTextColor="#9ca3af"
              multiline
              value={notes}
              onChangeText={setNotes}
              textAlignVertical="top"
            />
          </View>

          {/* Salvar */}
          <TouchableOpacity
            className="bg-indigo-600 rounded-2xl h-12 items-center justify-center"
            onPress={() => navigation.goBack()}
          >
            <Text className="text-white font-semibold">Salvar Alterações</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
