import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  Image,
  Pressable,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import type { TabScreenProps } from '../types/navigation';
import { useBookStore } from '../store/useBookStore';
import type { FilterType, SortOrder } from '../store/useBookStore';
import { useBooks } from '../hooks/useBooks';
import type Book from '../database/Book';
import withObservables from '@nozbe/with-observables';
import { useTranslation } from 'react-i18next';

const FILTERS: { labelKey: string; value: FilterType }[] = [
  { labelKey: 'home.filter_all', value: 'all' },
  { labelKey: 'home.filter_read', value: 'read' },
  { labelKey: 'home.filter_unread', value: 'unread' },
  { labelKey: 'home.filter_borrowed', value: 'borrowed' },
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

function BookListCard({ book, onPress }: { book: Book; onPress: () => void }) {
  const { t } = useTranslation();
  const progress =
    book.totalPages && book.totalPages > 0
      ? (book.readPages / book.totalPages) * 100
      : 0;

  return (
    <TouchableOpacity
      onPress={onPress}
      className="flex-row bg-white dark:bg-slate-800 rounded-2xl mb-3 p-3"
      style={{ elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2 }}
    >
      {book.coverUrl ? (
        <Image
          source={{ uri: book.coverUrl }}
          className="w-14 h-20 rounded-xl bg-gray-100"
          resizeMode="cover"
        />
      ) : (
        <View className="w-14 h-20 rounded-xl bg-indigo-100 items-center justify-center">
          <Ionicons name="book-outline" size={24} color="#a5b4fc" />
        </View>
      )}

      <View className="flex-1 ml-3 justify-between py-0.5">
        <View>
          <Text className="text-gray-900 dark:text-white font-semibold text-sm" numberOfLines={2}>
            {book.title}
          </Text>
          <Text className="text-gray-500 dark:text-slate-400 text-xs mt-0.5">{book.author}</Text>
          <RatingStars rating={book.rating} />
        </View>

        <View>
          {book.borrowedTo ? (
            <View className="flex-row items-center">
              <Ionicons name="person-outline" size={11} color="#f59e0b" />
              <Text className="text-amber-500 text-xs font-semibold ml-1" numberOfLines={1}>
                {t('home.borrowed_for', { name: book.borrowedTo })}
              </Text>
            </View>
          ) : book.isRead ? (
            <View className="flex-row items-center">
              <View className="w-2 h-2 rounded-full bg-green-500 mr-1.5" />
              <Text className="text-green-600 text-xs font-medium">{t('home.status_read')}</Text>
            </View>
          ) : book.readPages === 0 ? (
            <View className="flex-row items-center">
              <View className="w-2 h-2 rounded-full bg-indigo-500 mr-1.5" />
              <Text className="text-indigo-600 text-xs font-medium">{t('home.status_want')}</Text>
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

const EnhancedBookListCard = withObservables(['book'], ({ book }: { book: Book }) => ({
  book: book.observe(),
}))(BookListCard);

function BookGridCard({ book, onPress }: { book: Book; onPress: () => void }) {
  const { t } = useTranslation();
  const progress =
    book.totalPages && book.totalPages > 0
      ? (book.readPages / book.totalPages) * 100
      : 0;

  return (
    <TouchableOpacity
      onPress={onPress}
      className="flex-1 mx-1.5 mb-3 bg-white dark:bg-slate-800 rounded-2xl overflow-hidden"
      style={{ elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2 }}
    >
      <View>
        {book.coverUrl ? (
          <Image
            source={{ uri: book.coverUrl }}
            style={{ width: '100%', aspectRatio: 2 / 3 }}
            resizeMode="cover"
          />
        ) : (
          <View style={{ width: '100%', aspectRatio: 2 / 3 }} className="bg-indigo-100 items-center justify-center">
            <Ionicons name="book-outline" size={36} color="#a5b4fc" />
          </View>
        )}
        {book.borrowedTo && (
          <View
            style={{ position: 'absolute', top: 6, right: 6, backgroundColor: '#f59e0b', borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2 }}
          >
            <Text style={{ color: 'white', fontSize: 9, fontWeight: '700' }}>{t('home.borrowed_badge')}</Text>
          </View>
        )}
      </View>
      <View className="p-2">
        <Text className="text-gray-900 dark:text-white font-semibold text-xs leading-4" numberOfLines={2}>
          {book.title}
        </Text>
        <Text className="text-gray-400 dark:text-slate-500 text-xs mt-0.5" numberOfLines={1}>
          {book.author}
        </Text>
        {book.borrowedTo ? (
          <View className="mt-1.5 flex-row items-center">
            <Ionicons name="person" size={10} color="#d97706" />
            <Text className="text-amber-600 text-[10px] font-bold ml-1" numberOfLines={1}>
              {book.borrowedTo}
            </Text>
          </View>
        ) : (
          <View className="mt-1.5">
            <View className="flex-row items-center justify-between mb-1">
              <View className="flex-row items-center">
                <View className={`w-1.5 h-1.5 rounded-full mr-1 ${book.isRead ? 'bg-green-500' : (book.readPages === 0 ? 'bg-indigo-500' : 'bg-amber-500')}`} />
                <Text className={`text-[10px] font-medium ${book.isRead ? 'text-green-600' : (book.readPages === 0 ? 'text-indigo-600' : 'text-amber-600')}`}>
                  {book.isRead ? t('home.status_read') : (book.readPages === 0 ? t('home.status_want') : t('home.status_reading'))}
                </Text>
              </View>
              {!book.isRead && book.readPages > 0 && (
                <Text className="text-indigo-500 text-[10px] font-bold">{Math.round(progress)}%</Text>
              )}
            </View>
            {!book.isRead && book.readPages > 0 && (
              <View className="h-1 bg-gray-100 rounded-full overflow-hidden">
                <View className="h-full bg-indigo-500 rounded-full" style={{ width: `${progress}%` }} />
              </View>
            )}
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const EnhancedBookGridCard = withObservables(['book'], ({ book }: { book: Book }) => ({
  book: book.observe(),
}))(BookGridCard);

const SORT_OPTIONS: { labelKey: string; value: SortOrder }[] = [
  { labelKey: 'home.sort_recent', value: 'recent' },
  { labelKey: 'home.sort_title_asc', value: 'title_asc' },
  { labelKey: 'home.sort_author_asc', value: 'author_asc' },
  { labelKey: 'home.sort_rating_desc', value: 'rating_desc' },
];

export function HomeScreen({ navigation }: TabScreenProps<'Estante'>) {
  const { t } = useTranslation();
  const { activeFilter, searchQuery, viewMode, sortOrder, setFilter, setSearchQuery, setViewMode, setSortOrder } = useBookStore();
  const { books, loading } = useBooks(activeFilter, searchQuery, sortOrder);
  const [sortModalVisible, setSortModalVisible] = useState(false);

  const isGrid = viewMode === 'grid';

  return (
    <SafeAreaView className="flex-1 bg-gray-50 dark:bg-slate-900" edges={['top']}>
      <View className="px-4 pt-2 pb-3">
        <View className="flex-row items-center justify-between mb-3">
          <Text className="text-2xl font-bold text-gray-900 dark:text-white">{t('home.title')}</Text>
          <View className="flex-row gap-2">
            <TouchableOpacity
              onPress={() => setSortModalVisible(true)}
              className="w-9 h-9 rounded-xl bg-white items-center justify-center"
              style={{ elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 2 }}
            >
              <Ionicons name="swap-vertical-outline" size={20} color={sortOrder !== 'recent' ? '#4f46e5' : '#6b7280'} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setViewMode(isGrid ? 'list' : 'grid')}
              className="w-9 h-9 rounded-xl bg-white items-center justify-center"
              style={{ elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 2 }}
            >
              <Ionicons name={isGrid ? 'list-outline' : 'grid-outline'} size={20} color="#4f46e5" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => navigation.navigate('Settings')}
              className="w-9 h-9 rounded-xl bg-white items-center justify-center"
              style={{ elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 2 }}
            >
              <Ionicons name="settings-outline" size={20} color="#6b7280" />
            </TouchableOpacity>
          </View>
        </View>

        <View className="flex-row items-center bg-white dark:bg-slate-800 rounded-2xl px-3 h-11 mb-3 border border-gray-100 dark:border-slate-700">
          <Ionicons name="search" size={16} color="#9ca3af" style={{ marginRight: 8 }} />
          <TextInput
            className="flex-1 text-gray-800 dark:text-gray-100 text-sm"
            placeholder={t('home.search_placeholder')}
            placeholderTextColor="#9ca3af"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={18} color="#9ca3af" />
            </Pressable>
          )}
        </View>

        <View className="flex-row gap-2">
          {FILTERS.map((f) => (
            <TouchableOpacity
              key={f.value}
              onPress={() => setFilter(f.value)}
              className={`px-4 py-1.5 rounded-full ${
                activeFilter === f.value ? 'bg-indigo-600' : 'bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700'
              }`}
            >
              <Text
                className={`text-xs font-medium ${
                  activeFilter === f.value ? 'text-white' : 'text-gray-600 dark:text-slate-300'
                }`}
              >
                {t(f.labelKey)}
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
          key={isGrid ? 'grid' : 'list'}
          data={books}
          keyExtractor={(item) => item.id}
          numColumns={isGrid ? 2 : 1}
          contentContainerClassName="px-4 pb-6"
          columnWrapperStyle={isGrid ? { marginHorizontal: -6 } : undefined}
          ListEmptyComponent={
            <View className="items-center pt-16 px-6">
              <Ionicons name="library-outline" size={72} color="#c7d2fe" />
              <Text className="text-gray-500 text-sm text-center mt-4">
                {searchQuery ? t('home.empty_search') : t('home.empty_shelf')}
              </Text>
              {!searchQuery && (
                <TouchableOpacity
                  onPress={() => navigation.navigate('Scanner')}
                  className="mt-5 bg-indigo-600 px-6 py-3 rounded-2xl"
                  style={{ elevation: 2 }}
                >
                  <Text className="text-white font-semibold text-sm">
                    {t('home.add_first')}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          }
          renderItem={({ item }) =>
            isGrid ? (
              <EnhancedBookGridCard
                book={item}
                onPress={() => navigation.navigate('BookDetail', { bookId: item.id })}
              />
            ) : (
              <EnhancedBookListCard
                book={item}
                onPress={() => navigation.navigate('BookDetail', { bookId: item.id })}
              />
            )
          }
        />
      )}
      {/* Modal de ordenação */}
      <Modal
        visible={sortModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setSortModalVisible(false)}
      >
        <Pressable
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' }}
          onPress={() => setSortModalVisible(false)}
        >
          <View style={{ backgroundColor: 'white', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 36 }}>
            <Text style={{ fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 16 }}>{t('home.sort_title')}</Text>
            {SORT_OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt.value}
                onPress={() => { setSortOrder(opt.value); setSortModalVisible(false); }}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingVertical: 14,
                  borderBottomWidth: 1,
                  borderBottomColor: '#f3f4f6',
                }}
              >
                <Text style={{ fontSize: 15, color: sortOrder === opt.value ? '#4f46e5' : '#374151', fontWeight: sortOrder === opt.value ? '600' : '400' }}>
                  {t(opt.labelKey)}
                </Text>
                {sortOrder === opt.value && (
                  <Ionicons name="checkmark" size={18} color="#4f46e5" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}
