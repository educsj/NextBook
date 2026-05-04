import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useDatabase } from '@nozbe/watermelondb/hooks';
import type { RootStackScreenProps } from '../types/navigation';
import Book from '../database/Book';
import { addBook } from '../database/bookActions';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { useThemeStore, type ThemePreference } from '../store/useThemeStore';
import { useTranslation } from 'react-i18next';
import i18n from '../i18n';
import AsyncStorage from '@react-native-async-storage/async-storage';

type ThemeOption = { label: string; value: ThemePreference };
const THEME_OPTIONS: ThemeOption[] = [
  { label: 'Claro', value: 'light' },
  { label: 'Escuro', value: 'dark' },
  { label: 'Sistema', value: 'system' },
];

const THEME_ICONS = {
  light: 'sunny-outline' as const,
  dark: 'moon-outline' as const,
  system: 'phone-portrait-outline' as const,
};

type LangOption = { label: string; value: string };
const LANG_OPTIONS: LangOption[] = [
  { label: 'Português', value: 'pt' },
  { label: 'English', value: 'en' },
];

export function SettingsScreen({ navigation }: RootStackScreenProps<'Settings'>) {
  const database = useDatabase();
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const { theme, setTheme } = useThemeStore();
  const { t, i18n: i18nInstance } = useTranslation();
  const currentLang = i18nInstance.language;

  async function handleExport() {
    setExporting(true);
    try {
      const books = await database.get<Book>('books').query().fetch();
      const data = books.map((b) => ({
        title: b.title,
        author: b.author,
        isbn: b.isbn,
        coverUrl: b.coverUrl,
        totalPages: b.totalPages,
        readPages: b.readPages,
        isRead: b.isRead,
        isSynced: false,
        rating: b.rating,
        notes: b.notes,
        borrowedTo: b.borrowedTo,
        borrowedAt: b.borrowedAt,
        publisher: b.publisher,
        genre: b.genre,
      }));

      const json = JSON.stringify({ version: 1, exportedAt: Date.now(), books: data }, null, 2);
      const path = FileSystem.cacheDirectory + 'nextbook_backup.json';
      await FileSystem.writeAsStringAsync(path, json, { encoding: 'utf8' });

      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(path, { mimeType: 'application/json', dialogTitle: 'Salvar backup do Next Book' });
      } else {
        Alert.alert('Exportado', `Arquivo salvo em: ${path}`);
      }
    } catch (e: any) {
      Alert.alert('Erro', `Não foi possível exportar a biblioteca: ${e.message || 'Erro desconhecido'}`);
    } finally {
      setExporting(false);
    }
  }

  async function handleImport() {
    setImporting(true);
    try {
      const res = await DocumentPicker.getDocumentAsync({
        type: 'application/json',
        copyToCacheDirectory: true,
      });

      if (res.canceled || !res.assets?.[0]) {
        setImporting(false);
        return;
      }

      const content = await FileSystem.readAsStringAsync(res.assets[0].uri, {
        encoding: 'utf8',
      });
      const parsed = JSON.parse(content);

      if (!parsed.books || !Array.isArray(parsed.books)) {
        Alert.alert('Arquivo inválido', 'O arquivo selecionado não é um backup válido do Next Book.');
        return;
      }

      Alert.alert(
        'Importar biblioteca',
        `Foram encontrados ${parsed.books.length} livros. Deseja importar todos? Livros duplicados serão adicionados novamente.`,
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Importar',
            onPress: async () => {
              let count = 0;
              for (const book of parsed.books) {
                try {
                  await addBook(database, {
                    title: book.title ?? 'Sem título',
                    author: book.author ?? 'Autor desconhecido',
                    isbn: book.isbn,
                    coverUrl: book.coverUrl,
                    totalPages: book.totalPages,
                    readPages: book.readPages ?? 0,
                    isRead: book.isRead ?? false,
                    isSynced: false,
                    rating: book.rating,
                    notes: book.notes,
                  });
                  count++;
                } catch {
                  // Ignora livros com falha individual
                }
              }
              Alert.alert('Importação concluída', `${count} livros importados com sucesso!`);
            },
          },
        ],
      );
    } catch (e: any) {
      Alert.alert('Erro', `Não foi possível ler o arquivo de backup: ${e.message || 'Erro desconhecido'}`);
    } finally {
      setImporting(false);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50 dark:bg-slate-900" edges={['top']}>
      <View className="flex-row items-center px-4 pt-2 pb-4">
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 4, marginRight: 12 }}>
          <Ionicons name="arrow-back" size={24} color="#818cf8" />
        </TouchableOpacity>
        <Text className="text-2xl font-bold text-gray-900 dark:text-white">{t('settings.title')}</Text>
      </View>

      <ScrollView contentContainerClassName="px-4 pb-10">
        {/* Aparência */}
        <Text className="text-xs font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-2">
          {t('settings.appearance')}
        </Text>
        <View className="bg-white dark:bg-slate-800 rounded-3xl overflow-hidden mb-6" style={{ elevation: 1 }}>
          <View style={{ flexDirection: 'row', padding: 12, gap: 8 }}>
            {THEME_OPTIONS.map((opt) => {
              const isActive = theme === opt.value;
              return (
                <TouchableOpacity
                  key={opt.value}
                  onPress={() => setTheme(opt.value)}
                  style={{
                    flex: 1,
                    alignItems: 'center',
                    paddingVertical: 12,
                    borderRadius: 16,
                    backgroundColor: isActive ? '#4f46e5' : 'transparent',
                    borderWidth: isActive ? 0 : 1,
                    borderColor: '#e5e7eb',
                  }}
                >
                  <Ionicons
                    name={THEME_ICONS[opt.value]}
                    size={20}
                    color={isActive ? 'white' : '#6b7280'}
                  />
                  <Text style={{ fontSize: 11, marginTop: 4, fontWeight: '600', color: isActive ? 'white' : '#6b7280' }}>
                    {t(`settings.theme_${opt.value}`)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Idioma */}
        <Text className="text-xs font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-2">
          {t('settings.language')}
        </Text>
        <View className="bg-white dark:bg-slate-800 rounded-3xl overflow-hidden mb-6" style={{ elevation: 1 }}>
          <View style={{ flexDirection: 'row', padding: 12, gap: 8 }}>
            {LANG_OPTIONS.map((opt) => {
              const isActive = currentLang === opt.value;
              return (
                <TouchableOpacity
                  key={opt.value}
                  onPress={() => {
                    i18n.changeLanguage(opt.value);
                    AsyncStorage.setItem('@nextbook_language', opt.value);
                  }}
                  style={{
                    flex: 1,
                    alignItems: 'center',
                    paddingVertical: 12,
                    borderRadius: 16,
                    backgroundColor: isActive ? '#4f46e5' : 'transparent',
                    borderWidth: isActive ? 0 : 1,
                    borderColor: '#e5e7eb',
                  }}
                >
                  <Text style={{ fontSize: 20 }}>{opt.value === 'pt' ? '🇧🇷' : '🇺🇸'}</Text>
                  <Text style={{ fontSize: 12, marginTop: 4, fontWeight: '600', color: isActive ? 'white' : '#6b7280' }}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Backup */}
        <Text className="text-xs font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-2">
          {t('settings.backup')}
        </Text>

        <View className="bg-white dark:bg-slate-800 rounded-3xl overflow-hidden mb-6" style={{ elevation: 1 }}>
          <TouchableOpacity
            style={{ flexDirection: 'row', alignItems: 'center', padding: 16, opacity: exporting ? 0.7 : 1 }}
            onPress={handleExport}
            disabled={exporting}
          >
            <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: '#ede9fe', alignItems: 'center', justifyContent: 'center', marginRight: 14 }}>
              {exporting
                ? <ActivityIndicator size="small" color="#7c3aed" />
                : <Ionicons name="cloud-upload-outline" size={20} color="#7c3aed" />
              }
            </View>
            <View className="flex-1">
              <Text className="text-gray-900 dark:text-white font-semibold text-sm">{t('settings.export')}</Text>
              <Text className="text-gray-400 dark:text-slate-500 text-xs mt-0.5">
                {t('settings.export_desc')}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#d1d5db" />
          </TouchableOpacity>

          <View style={{ height: 1, backgroundColor: '#f3f4f6', marginHorizontal: 16 }} />

          <TouchableOpacity
            style={{ flexDirection: 'row', alignItems: 'center', padding: 16, opacity: importing ? 0.7 : 1 }}
            onPress={handleImport}
            disabled={importing}
          >
            <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: '#dcfce7', alignItems: 'center', justifyContent: 'center', marginRight: 14 }}>
              {importing
                ? <ActivityIndicator size="small" color="#16a34a" />
                : <Ionicons name="cloud-download-outline" size={20} color="#16a34a" />
              }
            </View>
            <View className="flex-1">
              <Text className="text-gray-900 dark:text-white font-semibold text-sm">{t('settings.import')}</Text>
              <Text className="text-gray-400 dark:text-slate-500 text-xs mt-0.5">
                {t('settings.import_desc')}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#d1d5db" />
          </TouchableOpacity>
        </View>

        <View className="bg-amber-50 rounded-2xl p-4">
          <View className="flex-row items-center mb-1">
            <Ionicons name="information-circle-outline" size={16} color="#d97706" />
            <Text className="text-amber-700 font-semibold text-xs ml-1">{t('settings.tip_title')}</Text>
          </View>
          <Text className="text-amber-600 text-xs leading-4">
            {t('settings.tip_desc')}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
