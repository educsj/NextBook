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
  Modal,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { useDatabase } from '@nozbe/watermelondb/hooks';
import type { RootStackScreenProps } from '../types/navigation';
import { useBook } from '../hooks/useBook';
import { updateBookDetails, deleteBook, lendBook, returnBook } from '../database/bookActions';
import { CelebrationModal } from '../components/CelebrationModal';
import { useTranslation } from 'react-i18next';

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
  const { t } = useTranslation();
  const database = useDatabase();
  const insets = useSafeAreaInsets();
  const { book, loading } = useBook(route.params.bookId);

  const [readPages, setReadPages] = useState('');
  const [totalPages, setTotalPages] = useState('');
  const [rating, setRating] = useState<number | null>(null);
  const [notes, setNotes] = useState('');
  const [publisher, setPublisher] = useState('');
  const [genre, setGenre] = useState('');
  const [saving, setSaving] = useState(false);

  const [loanModalVisible, setLoanModalVisible] = useState(false);
  const [loanName, setLoanName] = useState('');
  const [loanSaving, setLoanSaving] = useState(false);
  const [localCover, setLocalCover] = useState<string | null>(null);
  const [celebrationVisible, setCelebrationVisible] = useState(false);

  useEffect(() => {
    if (book) {
      setReadPages(String(book.readPages));
      setTotalPages(book.totalPages ? String(book.totalPages) : '');
      setRating(book.rating);
      setNotes(book.notes ?? '');
      setPublisher(book.publisher ?? '');
      setGenre(book.genre ?? '');
    }
  }, [book?.id]);

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
  const parsedTotal = parseInt(totalPages, 10) || null;
  const progress =
    parsedTotal && parsedTotal > 0
      ? Math.min((parsedPages / parsedTotal) * 100, 100)
      : 0;

  async function applyPickedImage(uri: string) {
    const filename = uri.split('/').pop() || `cover_${Date.now()}.jpg`;
    const permanentUri = FileSystem.documentDirectory + filename;
    await FileSystem.copyAsync({ from: uri, to: permanentUri });
    setLocalCover(permanentUri);
    await database.write(async () => {
      await book!.update((b) => { b.coverUrl = permanentUri; });
    });
  }

  async function handlePickFromGallery() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permissão necessária', 'Permita o acesso à galeria para trocar a capa.');
      return;
    }
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.6 });
    if (!res.canceled && res.assets[0]) {
      await applyPickedImage(res.assets[0].uri);
    }
  }

  async function handleTakePhoto() {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permissão necessária', 'Permita o acesso à câmera para fotografar a capa.');
      return;
    }
    const res = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.6 });
    if (!res.canceled && res.assets[0]) {
      await applyPickedImage(res.assets[0].uri);
    }
  }

  function handlePickCover() {
    Alert.alert(
      'Alterar capa',
      'Como deseja escolher a imagem?',
      [
        { text: 'Tirar Foto', onPress: handleTakePhoto },
        { text: 'Escolher da Galeria', onPress: handlePickFromGallery },
        { text: 'Cancelar', style: 'cancel' },
      ],
    );
  }

  async function handleSave() {
    if (!book) return;
    setSaving(true);
    
    const parsedPages = parseInt(readPages, 10) || 0;
    const parsedTotal = parseInt(totalPages, 10) || null;
    const isNowRead = parsedTotal !== null && parsedPages >= parsedTotal && !book.isRead;
    const justCompleted = isNowRead;
    
    try {
      await updateBookDetails(database, book, {
        readPages: parsedPages,
        totalPages: parsedTotal,
        rating,
        notes,
        isRead: parsedTotal !== null && parsedPages >= parsedTotal,
        publisher,
        genre,
      });
      if (justCompleted) {
        setCelebrationVisible(true);
      } else {
        navigation.goBack();
      }
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

  async function handleLend() {
    if (!loanName.trim()) return;
    setLoanSaving(true);
    try {
      await lendBook(database, book!, loanName);
      setLoanModalVisible(false);
      setLoanName('');
    } catch {
      Alert.alert('Erro', 'Não foi possível registrar o empréstimo.');
    } finally {
      setLoanSaving(false);
    }
  }

  async function handleReturn() {
    Alert.alert(
      'Marcar como devolvido',
      `"${book!.title}" foi devolvido por ${book!.borrowedTo}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sim, devolvido!',
          onPress: async () => {
            await returnBook(database, book!);
          },
        },
      ],
    );
  }

  const borrowedDate = book.borrowedAt
    ? new Date(book.borrowedAt).toLocaleDateString('pt-BR')
    : null;

  return (
    <View className="flex-1 bg-gray-50 dark:bg-slate-900">
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        {/* ── Header imersivo ── */}
        <View style={{ paddingTop: insets.top, paddingBottom: 40, paddingHorizontal: 16, alignItems: 'center', overflow: 'hidden', minHeight: 280 }}>
          {/* Fundo borrado com a capa */}
          {(localCover ?? book.coverUrl) ? (
            <Image
              source={{ uri: localCover ?? book.coverUrl! }}
              style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, width: '100%', height: '100%' }}
              blurRadius={40}
              resizeMode="cover"
            />
          ) : (
            <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#4f46e5' }} />
          )}
          {/* Overlay escuro */}
          <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.45)' }} />

          {/* Botão voltar */}
          <TouchableOpacity
            style={{ alignSelf: 'flex-start', marginBottom: 20, padding: 4 }}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>

          {/* Capa com sombra 3D e botão de editar */}
          <TouchableOpacity
            onPress={handlePickCover}
            style={{
              elevation: 15,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 10 },
              shadowOpacity: 0.3,
              shadowRadius: 15,
              borderRadius: 12,
            }}
            activeOpacity={0.85}
          >
            {(localCover ?? book.coverUrl) ? (
              <Image
                source={{ uri: localCover ?? book.coverUrl! }}
                style={{ width: 128, height: 192, borderRadius: 12 }}
                resizeMode="cover"
              />
            ) : (
              <View style={{ width: 128, height: 192, borderRadius: 12, backgroundColor: '#6366f1', alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name="book-outline" size={48} color="white" />
              </View>
            )}
            {/* Ícone de editar sobreposto */}
            <View style={{ position: 'absolute', bottom: 8, right: 8, backgroundColor: 'rgba(0,0,0,0.55)', borderRadius: 12, padding: 5 }}>
              <Ionicons name="camera-outline" size={14} color="white" />
            </View>
          </TouchableOpacity>
        </View>

        <View style={{ paddingHorizontal: 16, marginTop: -24 }}>
          {/* Card principal */}
          <View className="bg-white dark:bg-slate-800 rounded-3xl p-4 mb-4" style={{ elevation: 2 }}>
            <Text className="text-xl font-bold text-gray-900 dark:text-white">{book.title}</Text>
            <Text className="text-gray-500 dark:text-slate-400 mt-1">{book.author}</Text>
            {book.isbn && (
              <Text className="text-gray-400 dark:text-slate-500 text-xs mt-1">ISBN: {book.isbn}</Text>
            )}
            <View className="flex-row items-center gap-2 mt-3 flex-wrap">
              <View style={{ backgroundColor: book.isRead ? '#dcfce7' : (parsedPages === 0 ? '#e0e7ff' : '#fef3c7'), borderRadius: 99, paddingHorizontal: 10, paddingVertical: 4 }}>
                <Text style={{ color: book.isRead ? '#15803d' : (parsedPages === 0 ? '#4338ca' : '#92400e'), fontSize: 12, fontWeight: '600' }}>
                  {book.isRead ? t('detail.status_read') : (parsedPages === 0 ? t('detail.status_want') : t('detail.status_reading'))}
                </Text>
              </View>
              {book.borrowedTo && (
                <View style={{ backgroundColor: '#fef3c7', borderRadius: 99, paddingHorizontal: 10, paddingVertical: 4, flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Ionicons name="person-outline" size={12} color="#d97706" />
                  <Text style={{ color: '#d97706', fontSize: 12, fontWeight: '600' }}>
                    {t('detail.borrowed_to', { name: book.borrowedTo })}
                  </Text>
                </View>
              )}
            </View>
            {book.borrowedTo && borrowedDate && (
              <Text className="text-gray-400 text-xs mt-1">{t('detail.borrowed_since', { date: borrowedDate })}</Text>
            )}
          </View>

          {/* Progresso */}
          {!book.isRead && (
            <View className="bg-white dark:bg-slate-800 rounded-3xl p-4 mb-4" style={{ elevation: 2 }}>
              <Text className="text-gray-800 dark:text-gray-100 font-semibold mb-3">{t('detail.progress')}</Text>
              <View className="flex-row items-center gap-3 mb-3">
                <TextInput
                  className="border border-gray-200 dark:border-slate-600 rounded-2xl px-3 h-11 w-24 text-center text-gray-800 dark:text-gray-100"
                  keyboardType="numeric"
                  value={readPages}
                  onChangeText={setReadPages}
                  maxLength={5}
                />
                <Text className="text-gray-500 dark:text-slate-400 text-sm">de</Text>
                <TextInput
                  className="border border-gray-200 dark:border-slate-600 rounded-2xl px-3 h-11 w-24 text-center text-gray-800 dark:text-gray-100"
                  keyboardType="numeric"
                  value={totalPages}
                  onChangeText={setTotalPages}
                  maxLength={5}
                  placeholder="?"
                  placeholderTextColor="#9ca3af"
                />
                <Text className="text-gray-500 dark:text-slate-400 text-sm">páginas</Text>
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
          <View className="bg-white dark:bg-slate-800 rounded-3xl p-4 mb-4" style={{ elevation: 2 }}>
            <Text className="text-gray-800 dark:text-gray-100 font-semibold mb-3">{t('detail.rating')}</Text>
            <StarRating value={rating} onChange={setRating} />
            {rating !== null && (
              <Pressable onPress={() => setRating(null)} className="mt-2">
                <Text className="text-gray-400 text-xs">{t('detail.remove_rating')}</Text>
              </Pressable>
            )}
          </View>

          {/* Notas */}
          <View className="bg-white dark:bg-slate-800 rounded-3xl p-4 mb-4" style={{ elevation: 2 }}>
            <Text className="text-gray-800 dark:text-gray-100 font-semibold mb-3">{t('detail.notes')}</Text>
            <TextInput
              className="text-gray-700 dark:text-gray-200 text-sm leading-5 min-h-24"
              placeholder={t('detail.notes_placeholder')}
              placeholderTextColor="#9ca3af"
              multiline
              value={notes}
              onChangeText={setNotes}
              textAlignVertical="top"
            />
          </View>

          {/* Editora & Gênero */}
          <View className="bg-white dark:bg-slate-800 rounded-3xl p-4 mb-4" style={{ elevation: 2 }}>
            <Text className="text-gray-800 dark:text-gray-100 font-semibold mb-3">{t('detail.details')}</Text>
            <Text className="text-gray-500 dark:text-slate-400 text-xs mb-1 ml-1">{t('detail.publisher')}</Text>
            <TextInput
              className="border border-gray-200 dark:border-slate-600 rounded-2xl px-4 h-11 text-gray-800 dark:text-gray-100 text-sm mb-3"
              placeholder={t('detail.publisher_placeholder')}
              placeholderTextColor="#9ca3af"
              value={publisher}
              onChangeText={setPublisher}
            />
            <Text className="text-gray-500 dark:text-slate-400 text-xs mb-1 ml-1">{t('detail.genre')}</Text>
            <TextInput
              className="border border-gray-200 dark:border-slate-600 rounded-2xl px-4 h-11 text-gray-800 dark:text-gray-100 text-sm"
              placeholder={t('detail.genre_placeholder')}
              placeholderTextColor="#9ca3af"
              value={genre}
              onChangeText={setGenre}
            />
          </View>

          {/* Empréstimo */}
          {book.borrowedTo ? (
            <TouchableOpacity
              className="rounded-3xl h-12 items-center justify-center mb-3 flex-row gap-2"
              style={{ backgroundColor: '#fef3c7', elevation: 1 }}
              onPress={handleReturn}
            >
              <Ionicons name="checkmark-circle-outline" size={18} color="#d97706" />
              <Text style={{ color: '#d97706', fontWeight: '600' }}>{t('detail.returned')}</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              className="rounded-3xl h-12 items-center justify-center mb-3 flex-row gap-2"
              style={{ backgroundColor: '#fff7ed', elevation: 1 }}
              onPress={() => setLoanModalVisible(true)}
            >
              <Ionicons name="person-add-outline" size={18} color="#ea580c" />
              <Text style={{ color: '#ea580c', fontWeight: '600' }}>{t('detail.lend')}</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            className="bg-indigo-600 rounded-3xl h-12 items-center justify-center mb-3"
            onPress={handleSave}
            style={{ opacity: saving ? 0.7 : 1 }}
            disabled={saving}
          >
            {saving
              ? <ActivityIndicator color="white" />
              : <Text className="text-white font-semibold">{t('detail.save')}</Text>
            }
          </TouchableOpacity>

          <TouchableOpacity
            className="rounded-3xl h-12 items-center justify-center border border-red-200"
            onPress={handleDelete}
          >
            <Text className="text-red-500 font-medium">{t('detail.delete')}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Modal de celebração */}
      <CelebrationModal
        visible={celebrationVisible}
        bookTitle={book.title}
        onClose={() => { setCelebrationVisible(false); navigation.goBack(); }}
      />

      {/* Modal de empréstimo */}
      <Modal
        visible={loanModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setLoanModalVisible(false)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 24 }}>
          <View style={{ backgroundColor: 'white', borderRadius: 24, padding: 24 }}>
            <Text style={{ fontSize: 17, fontWeight: '700', color: '#111827', marginBottom: 4 }}>
              {t('detail.lend_modal_title')}
            </Text>
            <Text style={{ fontSize: 13, color: '#6b7280', marginBottom: 16 }}>
              {t('detail.lend_modal_subtitle', { title: book.title })}
            </Text>
            <TextInput
              style={{
                borderWidth: 1,
                borderColor: '#e5e7eb',
                borderRadius: 16,
                paddingHorizontal: 16,
                height: 48,
                fontSize: 15,
                color: '#111827',
                marginBottom: 16,
              }}
              placeholder={t('detail.lend_name_placeholder')}
              placeholderTextColor="#9ca3af"
              value={loanName}
              onChangeText={setLoanName}
              autoFocus
              returnKeyType="done"
              onSubmitEditing={handleLend}
            />
            <TouchableOpacity
              style={{
                backgroundColor: '#4f46e5',
                borderRadius: 14,
                height: 48,
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 8,
                opacity: loanSaving || !loanName.trim() ? 0.6 : 1,
              }}
              onPress={handleLend}
              disabled={loanSaving || !loanName.trim()}
            >
              {loanSaving
                ? <ActivityIndicator color="white" />
                : <Text style={{ color: 'white', fontWeight: '600', fontSize: 15 }}>{t('detail.lend_confirm')}</Text>
              }
            </TouchableOpacity>
            <TouchableOpacity
              style={{ height: 40, alignItems: 'center', justifyContent: 'center' }}
              onPress={() => { setLoanModalVisible(false); setLoanName(''); }}
            >
              <Text style={{ color: '#9ca3af', fontSize: 14 }}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}
