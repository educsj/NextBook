import React from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  Image,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { TabScreenProps } from '../types/navigation';
import { useBookStore } from '../store/useBookStore';
import { useBooks } from '../hooks/useBooks';
import type Book from '../database/Book';

type Filter = 'all' | 'read' | 'unread';

const FILTERS: { label: string; value: Filter }[] = [
  { label: 'Todos', value: 'all' },
  { label: 'Lidos', value: 'read' },
  { label: 'Não lidos', value: 'unread' },
];

function RatingStars({ rating }: { rating: number | null }) {
  if (rating === null) return null;
  return (
    <View className="flex-row mt-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <Text key={star} className={`text-xs ${star <= rating ? 'text-amber-400' : 'text-gray-300'}`}>
          ★
        </Text>
      ))}
    </View>
  );
}

function BookCard({ book, onPress }: { book: Book; onPress: () => void }) {
  const progress =
    book.totalPages && book.totalPages > 0
      ? (book.readPages / book.totalPages) * 100
      : 0;

  return (
    <TouchableOpacity
      onPress={onPress}
      className="flex-row bg-white rounded-2xl mb-3 p-3 shadow-sm"
      style={{ elevation: 2 }}
    >
      {book.coverUrl ? (
        <Image
          source={{ uri: book.coverUrl }}
          className="w-14 h-20 rounded-lg bg-gray-100"
          resizeMode="cover"
        />
      ) : (
        <View className="w-14 h-20 rounded-lg bg-indigo-100 items-center justify-center">
          <Text className="text-2xl">📖</Text>
        </View>
      )}

      <View className="flex-1 ml-3 justify-between py-0.5">
        <View>
          <Text className="text-gray-900 font-semibold text-sm" numberOfLines={2}>
            {book.title}
          </Text>
          <Text className="text-gray-500 text-xs mt-0.5">{book.author}</Text>
          <RatingStars rating={book.rating} />
        </View>

        <View>
          {book.isRead ? (
            <View className="flex-row items-center">
              <View className="w-2 h-2 rounded-full bg-green-500 mr-1.5" />
              <Text className="text-green-600 text-xs font-medium">Lido</Text>
            </View>
          ) : (
            <View>
              <View className="flex-row justify-between mb-1">
                <Text className="text-gray-400 text-xs">
                  {book.readPages}/{book.totalPages ?? '?'} págs
                </Text>
                <Text className="text-indigo-500 text-xs font-medium">
                  {Math.round(progress)}%
                </Text>
              </View>
              <View className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <View
                  className="h-full bg-indigo-500 rounded-full"
                  style={{ width: `${progress}%` }}
                />
              </View>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

export function HomeScreen({ navigation }: TabScreenProps<'Estante'>) {
  const { activeFilter, searchQuery, setFilter, setSearchQuery } = useBookStore();
  const { books, loading } = useBooks(activeFilter, searchQuery);

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
      <View className="px-4 pt-2 pb-3">
        <Text className="text-2xl font-bold text-gray-900 mb-3">Minha Estante</Text>

        <View className="flex-row items-center bg-white rounded-xl px-3 h-11 mb-3 border border-gray-100">
          <Text className="text-gray-400 mr-2">🔍</Text>
          <TextInput
            className="flex-1 text-gray-800 text-sm"
            placeholder="Buscar por título ou autor..."
            placeholderTextColor="#9ca3af"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => setSearchQuery('')}>
              <Text className="text-gray-400 text-lg">×</Text>
            </Pressable>
          )}
        </View>

        <View className="flex-row gap-2">
          {FILTERS.map((f) => (
            <TouchableOpacity
              key={f.value}
              onPress={() => setFilter(f.value)}
              className={`px-4 py-1.5 rounded-full ${
                activeFilter === f.value
                  ? 'bg-indigo-600'
                  : 'bg-white border border-gray-200'
              }`}
            >
              <Text
                className={`text-xs font-medium ${
                  activeFilter === f.value ? 'text-white' : 'text-gray-600'
                }`}
              >
                {f.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#4f46e5" />
        </View>
      ) : (
        <FlatList
          data={books}
          keyExtractor={(item) => item.id}
          contentContainerClassName="px-4 pb-6"
          ListEmptyComponent={
            <View className="items-center pt-16">
              <Text className="text-4xl mb-3">📚</Text>
              <Text className="text-gray-500 text-sm text-center">
                {searchQuery
                  ? 'Nenhum livro encontrado para essa busca.'
                  : 'Sua estante está vazia.\nUse o Scanner para adicionar livros!'}
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <BookCard
              book={item}
              onPress={() => navigation.navigate('BookDetail', { bookId: item.id })}
            />
          )}
        />
      )}
    </SafeAreaView>
  );
}
