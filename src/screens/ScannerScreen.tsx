import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  FlatList,
  ActivityIndicator,
  Alert,
  Image,
  Animated,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useDatabase } from '@nozbe/watermelondb/hooks';
import { searchBookByISBN, searchBooksByTitle, ApiError } from '../services/bookSearchService';
import { addBook } from '../database/bookActions';
import type { BookData } from '../types/book';
import type { TabScreenProps } from '../types/navigation';

type Mode = 'scanner' | 'manual';

export function ScannerScreen(_props: TabScreenProps<'Scanner'>) {
  const database = useDatabase();
  const [permission, requestPermission] = useCameraPermissions();
  const [mode, setMode] = useState<Mode>('scanner');
  const [scanned, setScanned] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [manualInput, setManualInput] = useState('');
  const [result, setResult] = useState<BookData | null>(null);
  const [suggestions, setSuggestions] = useState<BookData[]>([]);
  const [notFound, setNotFound] = useState(false);
  const [showManualForm, setShowManualForm] = useState(false);
  const [formTitle, setFormTitle] = useState('');
  const [formAuthor, setFormAuthor] = useState('');
  const [formPages, setFormPages] = useState('');
  const [formIsbn, setFormIsbn] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scanLineAnim = useRef(new Animated.Value(0)).current;

  function resetState() {
    setResult(null);
    setSuggestions([]);
    setManualInput('');
    setScanned(false);
    setNotFound(false);
    setShowManualForm(false);
    setFormTitle('');
    setFormAuthor('');
    setFormPages('');
    setFormIsbn('');
  }

  function openManualForm(prefillIsbn?: string) {
    setFormIsbn(prefillIsbn ?? '');
    setNotFound(false);
    setShowManualForm(true);
  }

  useEffect(() => {
    if (mode !== 'scanner' || !permission?.granted) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(scanLineAnim, { toValue: 1, duration: 1800, useNativeDriver: true }),
        Animated.timing(scanLineAnim, { toValue: 0, duration: 1800, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [mode, permission?.granted]);

  async function performSearch(query: string) {
    const cleaned = query.replace(/-/g, '');
    const isISBN = /^\d{10,13}$/.test(cleaned);

    setLoading(true);
    setResult(null);
    setSuggestions([]);
    setNotFound(false);
    setShowManualForm(false);

    try {
      if (isISBN) {
        const book = await searchBookByISBN(cleaned);
        if (book) {
          setResult(book);
        } else {
          setFormIsbn(cleaned);
          setNotFound(true);
        }
      } else {
        const books = await searchBooksByTitle(query);
        if (books.length > 0) {
          setResult(books[0]);
          setSuggestions(books.slice(1));
        } else {
          setNotFound(true);
        }
      }
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.type === 'offline') {
          Alert.alert('Sem conexão', 'Verifique sua internet e tente novamente.');
        } else if (error.type === 'rate_limit') {
          // Silencioso
        } else {
          Alert.alert('Erro', error.message);
        }
      } else {
        Alert.alert('Erro', 'Falha ao buscar livro. Verifique sua conexão.');
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleBarcodeScan({ data }: { type: string; data: string }) {
    if (scanned || loading) return;
    setScanned(true);
    setLoading(true);
    setNotFound(false);
    setShowManualForm(false);
    try {
      const book = await searchBookByISBN(data);
      if (book) {
        setResult(book);
      } else {
        setFormIsbn(data);
        setNotFound(true);
      }
    } catch (error) {
      const isOffline = error instanceof ApiError && error.type === 'offline';
      Alert.alert(
        isOffline ? 'Sem conexão' : 'Erro',
        error instanceof ApiError ? error.message : 'Falha ao buscar livro.',
        [{ text: 'OK', onPress: () => setScanned(false) }],
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleAddBook() {
    if (!result) return;
    setSaving(true);
    try {
      await addBook(database, result);
      Alert.alert('Adicionado!', `"${result.title}" foi adicionado à sua estante.`);
      resetState();
    } catch {
      Alert.alert('Erro', 'Não foi possível salvar o livro.');
    } finally {
      setSaving(false);
    }
  }

  async function handleAddManual() {
    if (!formTitle.trim()) {
      Alert.alert('Campo obrigatório', 'Digite o título do livro.');
      return;
    }
    setSaving(true);
    try {
      await addBook(database, {
        title: formTitle.trim(),
        author: formAuthor.trim() || 'Autor desconhecido',
        isbn: formIsbn.trim() || undefined,
        totalPages: formPages ? parseInt(formPages, 10) : undefined,
        readPages: 0,
        isRead: false,
        isSynced: false,
      });
      Alert.alert('Adicionado!', `"${formTitle.trim()}" foi adicionado à sua estante.`);
      resetState();
    } catch {
      Alert.alert('Erro', 'Não foi possível salvar o livro.');
    } finally {
      setSaving(false);
    }
  }

  function selectSuggestion(item: BookData) {
    const oldResult = result;
    setResult(item);
    setSuggestions((prev) => {
      const next = prev.filter((s) => s !== item);
      return oldResult ? [oldResult, ...next] : next;
    });
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50 dark:bg-slate-900" edges={['top']}>
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View className="px-4 pt-2 pb-3">
          <Text className="text-2xl font-bold text-gray-900 dark:text-white mb-3">Adicionar Livro</Text>

          <View className="flex-row bg-gray-100 dark:bg-slate-800 rounded-2xl p-1">
            {(['scanner', 'manual'] as Mode[]).map((m) => (
              <TouchableOpacity
                key={m}
                onPress={() => { setMode(m); resetState(); }}
                className={`flex-1 h-9 flex-row items-center justify-center gap-1.5 rounded-xl ${mode === m ? 'bg-white dark:bg-slate-700' : ''}`}
                style={mode === m ? { elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2 } : {}}
              >
                <Ionicons
                  name={m === 'scanner' ? 'camera-outline' : 'pencil-outline'}
                  size={15}
                  color={mode === m ? '#4f46e5' : '#6b7280'}
                />
                <Text className={`text-sm font-medium ${mode === m ? 'text-indigo-600' : 'text-gray-500'}`}>
                  {m === 'scanner' ? 'Scanner ISBN' : 'Busca Manual'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <ScrollView contentContainerClassName="px-4 pb-10 flex-grow" keyboardShouldPersistTaps="handled">

          {/* ── Scanner / busca manual ────────────────────────────────── */}
          {!showManualForm && (
            <>
              {mode === 'scanner' ? (
                <View>
                  {!permission?.granted ? (
                    <View className="items-center py-12">
                      <Text className="text-gray-500 dark:text-slate-400 text-center mb-4">
                        Permissão de câmera necessária para escanear ISBN.
                      </Text>
                      <TouchableOpacity className="bg-indigo-600 px-6 py-3 rounded-2xl" onPress={requestPermission}>
                        <Text className="text-white font-semibold">Permitir Câmera</Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <View>
                      <View className="rounded-2xl overflow-hidden mb-4" style={{ height: 280 }}>
                        <CameraView
                          style={{ flex: 1 }}
                          facing="back"
                          enableTorch={torchOn}
                          barcodeScannerSettings={{ barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e'] }}
                          onBarcodeScanned={scanned ? undefined : handleBarcodeScan}
                        />

                        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' }} pointerEvents="none">
                          <View style={{ width: 256, height: 80 }}>
                            <View style={{ position: 'absolute', top: 0, left: 0, width: 22, height: 22, borderTopWidth: 3, borderLeftWidth: 3, borderColor: '#fff', borderTopLeftRadius: 6 }} />
                            <View style={{ position: 'absolute', top: 0, right: 0, width: 22, height: 22, borderTopWidth: 3, borderRightWidth: 3, borderColor: '#fff', borderTopRightRadius: 6 }} />
                            <View style={{ position: 'absolute', bottom: 0, left: 0, width: 22, height: 22, borderBottomWidth: 3, borderLeftWidth: 3, borderColor: '#fff', borderBottomLeftRadius: 6 }} />
                            <View style={{ position: 'absolute', bottom: 0, right: 0, width: 22, height: 22, borderBottomWidth: 3, borderRightWidth: 3, borderColor: '#fff', borderBottomRightRadius: 6 }} />
                            <Animated.View
                              style={{
                                position: 'absolute', left: 4, right: 4, height: 2,
                                backgroundColor: '#6366f1', borderRadius: 1,
                                transform: [{ translateY: scanLineAnim.interpolate({ inputRange: [0, 1], outputRange: [4, 72] }) }],
                                opacity: 0.85,
                              }}
                            />
                          </View>
                          <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11, marginTop: 10 }}>
                            Aponte para o código de barras do livro
                          </Text>
                        </View>

                        <TouchableOpacity
                          onPress={() => setTorchOn((v) => !v)}
                          style={{
                            position: 'absolute', top: 12, right: 12, width: 38, height: 38, borderRadius: 19,
                            backgroundColor: torchOn ? '#fbbf24' : 'rgba(0,0,0,0.45)',
                            alignItems: 'center', justifyContent: 'center',
                          }}
                        >
                          <Ionicons name={torchOn ? 'flash' : 'flash-outline'} size={18} color={torchOn ? '#1f2937' : 'white'} />
                        </TouchableOpacity>

                        {loading && (
                          <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.5)' }}>
                            <ActivityIndicator size="large" color="white" />
                            <Text className="text-white mt-2">Buscando livro...</Text>
                          </View>
                        )}
                      </View>

                      {scanned && !loading && !result && !notFound && (
                        <TouchableOpacity
                          className="bg-gray-200 dark:bg-slate-700 rounded-2xl h-11 items-center justify-center mb-4"
                          onPress={() => setScanned(false)}
                        >
                          <Text className="text-gray-700 dark:text-slate-300 font-medium">Escanear novamente</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  )}
                </View>
              ) : (
                <View className="mt-2">
                  <Text className="text-gray-600 dark:text-slate-400 text-sm mb-2">
                    Digite o ISBN (10 ou 13 dígitos) ou título do livro:
                  </Text>
                  <View className="flex-row gap-2">
                    <View className="flex-1 flex-row items-center border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-2xl px-4 h-11">
                      <TextInput
                        className="flex-1 text-gray-800 dark:text-white"
                        placeholder="Ex: 9780441013593 ou Duna"
                        placeholderTextColor="#9ca3af"
                        value={manualInput}
                        onChangeText={setManualInput}
                        onSubmitEditing={() => performSearch(manualInput)}
                        returnKeyType="search"
                      />
                      {loading && <ActivityIndicator size="small" color="#4f46e5" />}
                    </View>
                    <TouchableOpacity
                      style={{ backgroundColor: '#4f46e5', paddingHorizontal: 16, borderRadius: 16, height: 44, alignItems: 'center', justifyContent: 'center', opacity: loading ? 0.7 : 1 }}
                      onPress={() => performSearch(manualInput)}
                      disabled={loading}
                    >
                      <Ionicons name="search" size={20} color="white" />
                    </TouchableOpacity>
                  </View>
                  <Text className="text-gray-400 text-xs mt-1.5 ml-1">
                    Pressione Enter ou o botão para pesquisar.
                  </Text>
                </View>
              )}
            </>
          )}

          {/* ── Banner: não encontrado ────────────────────────────────── */}
          {notFound && !showManualForm && !result && (
            <View
              className="bg-amber-50 dark:bg-slate-800 border border-amber-200 dark:border-slate-600 rounded-2xl p-4 mt-4"
            >
              <View className="flex-row items-center mb-2">
                <Ionicons name="search-outline" size={18} color="#d97706" />
                <Text className="text-amber-700 dark:text-amber-400 font-semibold ml-2">
                  Livro não encontrado
                </Text>
              </View>
              <Text className="text-amber-600 dark:text-slate-400 text-sm mb-4">
                Nenhuma das fontes disponíveis encontrou este livro. Você pode cadastrá-lo manualmente.
              </Text>

              <TouchableOpacity
                style={{ backgroundColor: '#4f46e5', borderRadius: 14, height: 44, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 }}
                onPress={() => openManualForm(formIsbn)}
              >
                <Ionicons name="create-outline" size={18} color="white" />
                <Text className="text-white font-semibold">Cadastrar manualmente</Text>
              </TouchableOpacity>

              <TouchableOpacity
                className="mt-2 h-9 items-center justify-center"
                onPress={resetState}
              >
                <Text className="text-gray-400 text-sm">Cancelar</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* ── Formulário de cadastro manual ─────────────────────────── */}
          {showManualForm && (
            <View
              className="bg-white dark:bg-slate-800 rounded-2xl p-4 mt-2"
              style={{ elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2 }}
            >
              <View className="flex-row items-center mb-4">
                <Ionicons name="create-outline" size={18} color="#6366f1" />
                <Text className="text-indigo-600 font-semibold ml-2 uppercase tracking-wide text-xs">
                  Cadastro Manual
                </Text>
              </View>

              {/* Título */}
              <Text className="text-gray-700 dark:text-slate-300 text-sm font-medium mb-1">
                Título <Text className="text-red-400">*</Text>
              </Text>
              <View className="border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700 rounded-xl px-3 h-11 justify-center mb-3">
                <TextInput
                  className="text-gray-800 dark:text-white"
                  placeholder="Ex: Dom Quixote"
                  placeholderTextColor="#9ca3af"
                  value={formTitle}
                  onChangeText={setFormTitle}
                  returnKeyType="next"
                />
              </View>

              {/* Autor */}
              <Text className="text-gray-700 dark:text-slate-300 text-sm font-medium mb-1">
                Autor <Text className="text-gray-400 font-normal">(opcional)</Text>
              </Text>
              <View className="border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700 rounded-xl px-3 h-11 justify-center mb-3">
                <TextInput
                  className="text-gray-800 dark:text-white"
                  placeholder="Ex: Miguel de Cervantes"
                  placeholderTextColor="#9ca3af"
                  value={formAuthor}
                  onChangeText={setFormAuthor}
                  returnKeyType="next"
                />
              </View>

              {/* Páginas + ISBN lado a lado */}
              <View className="flex-row gap-3 mb-4">
                <View className="flex-1">
                  <Text className="text-gray-700 dark:text-slate-300 text-sm font-medium mb-1">
                    Páginas <Text className="text-gray-400 font-normal">(opcional)</Text>
                  </Text>
                  <View className="border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700 rounded-xl px-3 h-11 justify-center">
                    <TextInput
                      className="text-gray-800 dark:text-white"
                      placeholder="Ex: 320"
                      placeholderTextColor="#9ca3af"
                      value={formPages}
                      onChangeText={setFormPages}
                      keyboardType="numeric"
                      returnKeyType="next"
                    />
                  </View>
                </View>
                <View className="flex-1">
                  <Text className="text-gray-700 dark:text-slate-300 text-sm font-medium mb-1">
                    ISBN <Text className="text-gray-400 font-normal">(opcional)</Text>
                  </Text>
                  <View className="border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700 rounded-xl px-3 h-11 justify-center">
                    <TextInput
                      className="text-gray-800 dark:text-white"
                      placeholder="Ex: 9788535914849"
                      placeholderTextColor="#9ca3af"
                      value={formIsbn}
                      onChangeText={setFormIsbn}
                      keyboardType="numeric"
                      returnKeyType="done"
                    />
                  </View>
                </View>
              </View>

              <TouchableOpacity
                style={{ backgroundColor: '#4f46e5', borderRadius: 16, height: 44, alignItems: 'center', justifyContent: 'center', opacity: saving ? 0.7 : 1 }}
                onPress={handleAddManual}
                disabled={saving}
              >
                {saving
                  ? <ActivityIndicator color="white" />
                  : <Text className="text-white font-semibold">Adicionar à Estante</Text>
                }
              </TouchableOpacity>

              <TouchableOpacity className="mt-2 h-9 items-center justify-center" onPress={resetState}>
                <Text className="text-gray-400 text-sm">Cancelar</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* ── Card do resultado principal ───────────────────────────── */}
          {result && (
            <View className="bg-white dark:bg-slate-800 rounded-2xl p-4 mt-4" style={{ elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2 }}>
              <Text className="text-xs text-indigo-500 font-semibold mb-3 uppercase tracking-wide">
                Livro encontrado
              </Text>
              <View className="flex-row">
                {result.coverUrl ? (
                  <Image source={{ uri: result.coverUrl }} style={{ width: 76, height: 114, borderRadius: 10 }} resizeMode="cover" />
                ) : (
                  <View style={{ width: 76, height: 114, borderRadius: 10, backgroundColor: '#e0e7ff', alignItems: 'center', justifyContent: 'center' }}>
                    <Ionicons name="book-outline" size={28} color="#6366f1" />
                  </View>
                )}
                <View className="flex-1 ml-3 justify-center">
                  <Text className="text-gray-900 dark:text-white font-bold text-base" numberOfLines={3}>{result.title}</Text>
                  <Text className="text-gray-500 dark:text-slate-400 text-sm mt-1">{result.author}</Text>
                  {result.totalPages ? (
                    <Text className="text-gray-400 dark:text-slate-500 text-xs mt-1">{result.totalPages} páginas</Text>
                  ) : null}
                  {result.isbn ? (
                    <Text className="text-gray-400 dark:text-slate-500 text-xs">ISBN: {result.isbn}</Text>
                  ) : null}
                </View>
              </View>

              <TouchableOpacity
                style={{ backgroundColor: '#4f46e5', borderRadius: 16, height: 44, alignItems: 'center', justifyContent: 'center', marginTop: 16, opacity: saving ? 0.7 : 1 }}
                onPress={handleAddBook}
                disabled={saving}
              >
                {saving
                  ? <ActivityIndicator color="white" />
                  : <Text className="text-white font-semibold">Adicionar à Estante</Text>
                }
              </TouchableOpacity>

              <TouchableOpacity className="mt-2 h-9 items-center justify-center" onPress={resetState}>
                <Text className="text-gray-400 text-sm">Cancelar</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* ── Sugestões ─────────────────────────────────────────────── */}
          {suggestions.length > 0 && (
            <View className="mt-4">
              <Text className="text-gray-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wide mb-3">
                Outras edições ou relacionados
              </Text>
              <FlatList
                data={suggestions}
                horizontal
                showsHorizontalScrollIndicator={false}
                keyExtractor={(item, index) => item.isbn ?? `${item.title}-${index}`}
                contentContainerStyle={{ paddingBottom: 4 }}
                renderItem={({ item }) => (
                  <TouchableOpacity onPress={() => selectSuggestion(item)} style={{ width: 84, marginRight: 12 }}>
                    {item.coverUrl ? (
                      <Image source={{ uri: item.coverUrl }} style={{ width: 84, height: 126, borderRadius: 8 }} resizeMode="cover" />
                    ) : (
                      <View style={{ width: 84, height: 126, borderRadius: 8, backgroundColor: '#e0e7ff', alignItems: 'center', justifyContent: 'center' }}>
                        <Ionicons name="book-outline" size={24} color="#6366f1" />
                      </View>
                    )}
                    <Text style={{ fontSize: 10, color: '#374151', marginTop: 5, lineHeight: 13 }} numberOfLines={2}>{item.title}</Text>
                    <Text style={{ fontSize: 9, color: '#9ca3af', marginTop: 1 }} numberOfLines={1}>{item.author}</Text>
                  </TouchableOpacity>
                )}
              />
            </View>
          )}

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
