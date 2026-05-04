import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { searchBookByISBN, searchBooksByTitle } from '../services/googleBooksApi';
import type { BookData } from '../types/book';
import type { TabScreenProps } from '../types/navigation';

type Mode = 'scanner' | 'manual';

export function ScannerScreen(_props: TabScreenProps<'Scanner'>) {
  const [permission, requestPermission] = useCameraPermissions();
  const [mode, setMode] = useState<Mode>('scanner');
  const [scanned, setScanned] = useState(false);
  const [loading, setLoading] = useState(false);
  const [manualInput, setManualInput] = useState('');
  const [result, setResult] = useState<BookData | null>(null);

  useEffect(() => {
    if (!permission?.granted) {
      requestPermission();
    }
  }, []);

  async function handleBarcodeScan({ data }: { type: string; data: string }) {
    if (scanned || loading) return;
    setScanned(true);
    setLoading(true);
    try {
      const book = await searchBookByISBN(data);
      if (book) {
        setResult(book);
      } else {
        Alert.alert('Livro não encontrado', `ISBN ${data} não retornou resultados.`, [
          { text: 'Tentar novamente', onPress: () => setScanned(false) },
        ]);
      }
    } catch {
      Alert.alert('Erro', 'Falha ao buscar livro. Verifique sua conexão.', [
        { text: 'OK', onPress: () => setScanned(false) },
      ]);
    } finally {
      setLoading(false);
    }
  }

  async function handleManualSearch() {
    if (manualInput.trim() === '') return;
    setLoading(true);
    setResult(null);
    try {
      // Detecta se é ISBN (só números) ou título
      const isISBN = /^\d{10,13}$/.test(manualInput.replace(/-/g, ''));
      let book: BookData | null = null;

      if (isISBN) {
        book = await searchBookByISBN(manualInput.replace(/-/g, ''));
      } else {
        const books = await searchBooksByTitle(manualInput);
        book = books[0] ?? null;
      }

      if (book) {
        setResult(book);
      } else {
        Alert.alert('Não encontrado', 'Nenhum livro encontrado com essa busca.');
      }
    } catch {
      Alert.alert('Erro', 'Falha ao buscar livro. Verifique sua conexão.');
    } finally {
      setLoading(false);
    }
  }

  function handleAddBook() {
    if (!result) return;
    // TODO: salvar no WatermelonDB
    Alert.alert('Adicionado!', `"${result.title}" foi adicionado à sua estante.`);
    setResult(null);
    setManualInput('');
    setScanned(false);
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
      <View className="px-4 pt-2 pb-3">
        <Text className="text-2xl font-bold text-gray-900 mb-3">Adicionar Livro</Text>

        {/* Toggle de modo */}
        <View className="flex-row bg-gray-100 rounded-xl p-1">
          {(['scanner', 'manual'] as Mode[]).map((m) => (
            <TouchableOpacity
              key={m}
              onPress={() => { setMode(m); setResult(null); setScanned(false); }}
              className={`flex-1 h-9 items-center justify-center rounded-lg ${mode === m ? 'bg-white shadow-sm' : ''}`}
              style={mode === m ? { elevation: 1 } : {}}
            >
              <Text className={`text-sm font-medium ${mode === m ? 'text-indigo-600' : 'text-gray-500'}`}>
                {m === 'scanner' ? '📷 Scanner ISBN' : '✏️ Busca Manual'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <ScrollView contentContainerClassName="px-4 pb-10 flex-grow">
        {mode === 'scanner' ? (
          <View>
            {!permission?.granted ? (
              <View className="items-center py-12">
                <Text className="text-gray-500 text-center mb-4">
                  Permissão de câmera necessária para escanear ISBN.
                </Text>
                <TouchableOpacity
                  className="bg-indigo-600 px-6 py-3 rounded-xl"
                  onPress={requestPermission}
                >
                  <Text className="text-white font-semibold">Permitir Câmera</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View>
                <View className="rounded-2xl overflow-hidden mb-4" style={{ height: 280 }}>
                  <CameraView
                    style={{ flex: 1 }}
                    facing="back"
                    barcodeScannerSettings={{ barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e'] }}
                    onBarcodeScanned={scanned ? undefined : handleBarcodeScan}
                  />
                  {loading && (
                    <View className="absolute inset-0 bg-black/50 items-center justify-center">
                      <ActivityIndicator size="large" color="white" />
                      <Text className="text-white mt-2">Buscando livro...</Text>
                    </View>
                  )}
                  {/* Guia de escaneamento */}
                  <View className="absolute inset-0 items-center justify-center pointer-events-none">
                    <View className="w-64 h-20 border-2 border-white/80 rounded-lg" />
                  </View>
                </View>
                {scanned && !loading && !result && (
                  <TouchableOpacity
                    className="bg-gray-200 rounded-xl h-11 items-center justify-center mb-4"
                    onPress={() => setScanned(false)}
                  >
                    <Text className="text-gray-700 font-medium">Escanear novamente</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>
        ) : (
          <View className="mt-2">
            <Text className="text-gray-600 text-sm mb-2">
              Digite o ISBN (10 ou 13 dígitos) ou título do livro:
            </Text>
            <View className="flex-row gap-2">
              <TextInput
                className="flex-1 border border-gray-200 bg-white rounded-xl px-4 h-11 text-gray-800"
                placeholder="Ex: 9780441013593 ou Duna"
                placeholderTextColor="#9ca3af"
                value={manualInput}
                onChangeText={setManualInput}
                onSubmitEditing={handleManualSearch}
                returnKeyType="search"
              />
              <TouchableOpacity
                className="bg-indigo-600 px-4 rounded-xl h-11 items-center justify-center"
                onPress={handleManualSearch}
                disabled={loading}
              >
                {loading
                  ? <ActivityIndicator size="small" color="white" />
                  : <Text className="text-white font-semibold">Buscar</Text>
                }
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Resultado da busca */}
        {result && (
          <View className="bg-white rounded-2xl p-4 mt-4 shadow-sm" style={{ elevation: 2 }}>
            <Text className="text-xs text-indigo-500 font-semibold mb-2 uppercase tracking-wide">
              Livro encontrado
            </Text>
            <Text className="text-gray-900 font-bold text-base">{result.title}</Text>
            <Text className="text-gray-500 text-sm mt-0.5">{result.author}</Text>
            {result.totalPages && (
              <Text className="text-gray-400 text-xs mt-1">{result.totalPages} páginas</Text>
            )}
            {result.isbn && (
              <Text className="text-gray-400 text-xs">ISBN: {result.isbn}</Text>
            )}

            <TouchableOpacity
              className="bg-indigo-600 rounded-xl h-11 items-center justify-center mt-4"
              onPress={handleAddBook}
            >
              <Text className="text-white font-semibold">Adicionar à Estante</Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="mt-2 h-9 items-center justify-center"
              onPress={() => { setResult(null); setScanned(false); }}
            >
              <Text className="text-gray-400 text-sm">Cancelar</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
