import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  Pressable,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDatabase } from '@nozbe/watermelondb/hooks';
import type { RootStackScreenProps } from '../types/navigation';
import { useBook } from '../hooks/useBook';
import { updateBookDetails, deleteBook } from '../database/bookActions';

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
  const database = useDatabase();
  const { book, loading } = useBook(route.params.bookId);

  const [readPages, setReadPages] = useState('');
  const [rating, setRating] = useState<number | null>(null);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  // Sincroniza estado local quando o livro carregar do DB
  useEffect(() => {
    if (book) {
      setReadPages(String(book.readPages));
      setRating(book.rating);
      setNotes(book.notes ?? '');
    }
  }, [book?.id]); // só na montagem (por id, não em cada update reativo)

  if (loading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-gray-50">
        <ActivityIndicator size="large" color="#4f46e5" />
      </SafeAreaView>
    );
  }

  if (!book) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-gray-50">
        <Text className="text-gray-500">Livro não encontrado.</Text>
      </SafeAreaView>
    );
  }

  const parsedPages = parseInt(readPages, 10) || 0;
  const progress =
    book.totalPages && book.totalPages > 0
      ? Math.min((parsedPages / book.totalPages) * 100, 100)
      : 0;

  async function handleSave() {
    if (!book) return;
    setSaving(true);
    try {
      await updateBookDetails(database, book, {
        readPages: parsedPages,
        rating,
        notes,
        isRead: book.totalPages !== null && parsedPages >= book.totalPages,
      });
      navigation.goBack();
    } catch {
      Alert.alert('Erro', 'Não foi possível salvar as alterações.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    Alert.alert(
      'Remover livro',
      `Deseja remover "${book!.title}" da estante?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Remover',
          style: 'destructive',
          onPress: async () => {
            await deleteBook(database, book!);
            navigation.goBack();
          },
        },
      ],
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['bottom']}>
      <ScrollView contentContainerClassName="pb-10">
        <View className="bg-indigo-600 pt-4 pb-10 px-4 items-center">
          <TouchableOpacity className="self-start mb-4" onPress={() => navigation.goBack()}>
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
          {/* Infos principais */}
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

          {/* Progresso */}
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
                <Text className="text-gray-500 text-sm">
                  de {book.totalPages ?? '?'} páginas
                </Text>
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

          <TouchableOpacity
            className="bg-indigo-600 rounded-2xl h-12 items-center justify-center mb-3"
            onPress={handleSave}
            disabled={saving}
          >
            {saving
              ? <ActivityIndicator color="white" />
              : <Text className="text-white font-semibold">Salvar Alterações</Text>
            }
          </TouchableOpacity>

          <TouchableOpacity
            className="rounded-2xl h-12 items-center justify-center border border-red-200"
            onPress={handleDelete}
          >
            <Text className="text-red-500 font-medium">Remover da Estante</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
