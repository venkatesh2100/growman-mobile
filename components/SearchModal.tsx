import { MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Linking from 'expo-linking';
import { useRouter } from 'expo-router';
import { ExpoSpeechRecognitionModule, useSpeechRecognitionEvent } from 'expo-speech-recognition';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { apiFetch, identifyPlant } from '../lib/api';
import { sendChatMessage, type ChatProductRec } from '../lib/chatApi';
import { UI } from '../lib/ui';
import { useSearchStore } from '../store/searchStore';
import { showConfirm } from './Alert';
import MarkdownRenderer from './product/MarkdownRenderer';
import { toast } from './Toast';

const CATALOG_SUGGESTIONS = ['Monstera', 'Snake plant', 'Succulents', 'Indoor plants', 'Fertilizer'];

const DOOTHA_PROMPTS = [
  'Best plants for low light?',
  'How often to water succulents?',
  'Yellow leaves — what to do?',
  'Pet-safe indoor plants',
];

type ChatMsg = {
  id: string;
  role: 'user' | 'dootha';
  content: string;
  products?: ChatProductRec[];
};

export default function SearchModal() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);
  const voiceResultRef = useRef<string | null>(null);
  const { showSearchModal, closeSearch, submitSearchAndGoToShop, initialSearchQuery } = useSearchStore();
  const [query, setQuery] = useState(initialSearchQuery);
  const [scanning, setScanning] = useState(false);
  const [listening, setListening] = useState(false);
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [aiLoading, setAiLoading] = useState(false);

  useSpeechRecognitionEvent('result', (event) => {
    const transcript = event.results[0]?.transcript?.trim();
    if (transcript && event.isFinal) {
      voiceResultRef.current = transcript;
    }
  });

  useSpeechRecognitionEvent('end', () => {
    setListening(false);
    const text = voiceResultRef.current;
    voiceResultRef.current = null;
    if (text) {
      setQuery(text);
    }
  });

  useSpeechRecognitionEvent('error', (event) => {
    setListening(false);
    voiceResultRef.current = null;
    const err = String(event.error || '');
    if (err !== 'aborted' && err !== 'no-speech') {
      toast('Voice recognition failed. Try again.', 'error');
    }
  });

  useEffect(() => {
    if (showSearchModal) {
      setQuery(initialSearchQuery);
      setMessages([]);
    }
  }, [showSearchModal, initialSearchQuery]);

  // useEffect(() => {
  //   if (!showSearchModal) return;
  //   StatusBar.setBarStyle('dark-content', true);
  //   if (Platform.OS === 'android') {
  //     StatusBar.setBackgroundColor(UI.color.surface);
  //     StatusBar.setTranslucent(false);
  //   }
  // }, [showSearchModal]);

  useEffect(() => {
    if (!showSearchModal || messages.length === 0) return;
    const t = setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 120);
    return () => clearTimeout(t);
  }, [messages, showSearchModal, aiLoading]);

  const handleClose = () => closeSearch();

  const handleCatalogSearch = () => {
    const q = query.trim();
    if (!q) return;
    submitSearchAndGoToShop(q);
    router.replace('/(tabs)/shop');
  };

  const handleVoicePress = useCallback(async () => {
    if (listening) {
      ExpoSpeechRecognitionModule.stop();
      return;
    }
    const isAvailable = await ExpoSpeechRecognitionModule.isRecognitionAvailable();
    if (!isAvailable) {
      toast('Speech recognition is not available on this device.', 'error');
      return;
    }
    const micResult = await ExpoSpeechRecognitionModule.requestMicrophonePermissionsAsync();
    if (!micResult.granted) {
      showConfirm('Microphone access required', 'Voice search needs microphone access.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Open Settings', onPress: () => Linking.openSettings() },
      ]);
      return;
    }
    const speechResult = await ExpoSpeechRecognitionModule.requestSpeechRecognizerPermissionsAsync?.();
    if (speechResult && !speechResult.granted) {
      showConfirm('Speech recognition required', 'Enable speech recognition in Settings.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Open Settings', onPress: () => Linking.openSettings() },
      ]);
      return;
    }
    voiceResultRef.current = null;
    setListening(true);
    ExpoSpeechRecognitionModule.start({
      lang: 'en-US',
      interimResults: true,
      continuous: false,
    });
  }, [listening]);

  const sendToDootha = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || aiLoading) return;

    const userMessage: ChatMsg = {
      id: `u-${Date.now()}`,
      role: 'user',
      content: trimmed,
    };
    const prior = messages;
    setMessages((prev) => [...prev, userMessage]);
    setQuery('');
    setAiLoading(true);
    try {
      const { response, products } = await sendChatMessage(trimmed, prior);
      setMessages((prev) => [
        ...prev,
        {
          id: `d-${Date.now()}`,
          role: 'dootha',
          content: response,
          products: products.length > 0 ? products : undefined,
        },
      ]);
    } catch {
      toast('Could not reach Dootha. Try again.', 'error');
      setMessages((prev) => [
        ...prev,
        {
          id: `d-${Date.now()}`,
          role: 'dootha',
          content: "I'm having trouble connecting. Please try again in a moment.",
        },
      ]);
    } finally {
      setAiLoading(false);
    }
  };

  const identifyAndSearch = async (uri: string) => {
    setScanning(true);
    try {
      const data = await identifyPlant(uri);
      const name =
        data.bestMatch ||
        data.results?.[0]?.species?.scientificName ||
        data.results?.[0]?.species?.commonNames?.[0];
      if (name) {
        setQuery(name);
        submitSearchAndGoToShop(name);
        router.replace('/(tabs)/shop');
        closeSearch();
      } else {
        toast('Could not identify plant. Try another photo.', 'error');
      }
    } catch {
      toast('Identification failed. Try again.', 'error');
    } finally {
      setScanning(false);
    }
  };

  const handleScanPlant = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      toast('Camera access is needed to scan plants.', 'error');
      return;
    }
    showConfirm('Scan plant', 'Choose a source', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Camera',
        onPress: async () => {
          const result = await ImagePicker.launchCameraAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.85,
          });
          if (!result.canceled && result.assets[0]) await identifyAndSearch(result.assets[0].uri);
        },
      },
      {
        text: 'Gallery',
        onPress: async () => {
          const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.85,
          });
          if (!result.canceled && result.assets[0]) await identifyAndSearch(result.assets[0].uri);
        },
      },
    ]);
  };

  const openProduct = (p: ChatProductRec) => {
    const id = p.slug || String(p.id);
    router.push({ pathname: '/product/[id]', params: { id } });
    closeSearch();
  };

  return (
    <Modal
      visible={showSearchModal}
      animationType="fade"
      presentationStyle="fullScreen"
      statusBarTranslucent={false}
      onRequestClose={handleClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1"
        style={{ backgroundColor: UI.color.canvas }}>
        <Animated.View entering={FadeIn.duration(220)} className="flex-1">
          <View
            className="border-b border-emerald-100 bg-white px-3 flex-row items-center"
            style={{ paddingTop: insets.top + 8, paddingBottom: 12 }}>
            <TouchableOpacity onPress={handleClose} className="p-2 rounded-xl active:bg-emerald-50" hitSlop={12}>
              <MaterialIcons name="arrow-back" size={UI.icon.lg} color={UI.color.ink} />
            </TouchableOpacity>
            <View
              className="flex-1 flex-row items-center rounded-2xl px-2.5 border border-emerald-100 bg-white ml-1"
              style={{ minHeight: 48 }}>
              <MaterialIcons name="search" size={UI.icon.md} color={UI.color.primary} />
              <TextInput
                className="flex-1 text-base text-gray-900 ml-1.5 py-2"
                placeholder="Search catalog or ask Dootha…"
                placeholderTextColor="#9CA3AF"
                value={query}
                onChangeText={setQuery}
                autoFocus
                returnKeyType="search"
                onSubmitEditing={() => handleCatalogSearch()}
                autoCapitalize="sentences"
                autoCorrect
              />
              <TouchableOpacity
                onPress={handleVoicePress}
                className={`p-2 rounded-xl ${listening ? 'bg-red-50' : 'active:bg-emerald-50'}`}
                accessibilityLabel={listening ? 'Stop voice' : 'Voice search'}>
                <MaterialIcons
                  name="mic"
                  size={UI.icon.md}
                  color={listening ? '#DC2626' : UI.color.primaryDark}
                />
              </TouchableOpacity>
              {query.length > 0 && (
                <TouchableOpacity onPress={() => setQuery('')} className="p-1.5">
                  <MaterialIcons name="close" size={20} color={UI.color.muted} />
                </TouchableOpacity>
              )}
            </View>
          </View>

          <View className="flex-row px-3 pb-3 bg-white border-b border-emerald-50 gap-2">
            <TouchableOpacity
              onPress={handleCatalogSearch}
              disabled={!query.trim()}
              className={`flex-1 flex-row items-center justify-center py-3 rounded-2xl gap-2 ${
                query.trim() ? 'bg-emerald-700' : 'bg-gray-200'
              }`}>
              <MaterialIcons name="shopping-bag" size={20} color={query.trim() ? '#fff' : '#9CA3AF'} />
              <Text className={`text-sm font-semibold ${query.trim() ? 'text-white' : 'text-gray-400'}`}>
                Search shop
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => sendToDootha(query)}
              disabled={!query.trim() || aiLoading}
              className={`flex-1 flex-row items-center justify-center py-3 rounded-2xl gap-2 border ${
                query.trim() && !aiLoading ? 'bg-emerald-50 border-emerald-200' : 'bg-gray-100 border-gray-200'
              }`}>
              <MaterialIcons
                name="auto-awesome"
                size={20}
                color={query.trim() && !aiLoading ? UI.color.primaryDark : '#9CA3AF'}
              />
              <Text
                className={`text-sm font-semibold ${
                  query.trim() && !aiLoading ? 'text-emerald-950' : 'text-gray-400'
                }`}>
                Ask Dootha
              </Text>
            </TouchableOpacity>
          </View>
          <ScrollView
            ref={scrollRef}
            className="flex-1"
            contentContainerStyle={{ paddingBottom: insets.bottom + 24, paddingHorizontal: 16, paddingTop: 16 }}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            showsVerticalScrollIndicator={false}>
            {messages.length > 0 && (
              <View className="mb-4">
                <Text className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Conversation</Text>
                {messages.map((m) => (
                  <View key={m.id} className={`mb-3 ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
                    <View
                      className={`max-w-[92%] rounded-2xl px-3.5 py-2.5 ${
                        m.role === 'user'
                          ? 'bg-emerald-700 rounded-br-md'
                          : 'bg-white border border-emerald-100 rounded-bl-md'
                      }`}>
                      {m.role === 'user' ? (
                        <Text className="text-[15px] leading-5 text-white">{m.content}</Text>
                      ) : (
                        <MarkdownRenderer content={m.content} />
                      )}
                    </View>
                    {m.role === 'dootha' && m.products && m.products.length > 0 && (
                      <View className="mt-2 w-full">
                        <Text className="text-xs font-semibold text-emerald-800 mb-2">Related products</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
                          {m.products.map((p) => (
                            <Pressable
                              key={p.id}
                              onPress={() => openProduct(p)}
                              className="w-[132px] rounded-2xl overflow-hidden bg-white border border-emerald-100 active:opacity-90"
                              style={{
                                shadowColor: '#14532D',
                                shadowOffset: { width: 0, height: 2 },
                                shadowOpacity: 0.08,
                                shadowRadius: 6,
                                elevation: 3,
                              }}>
                              {p.imageUrl ? (
                                <Image
                                  source={{ uri: p.imageUrl }}
                                  className="w-full h-[96px] bg-gray-100"
                                  resizeMode="cover"
                                />
                              ) : (
                                <View className="w-full h-[96px] bg-emerald-50 items-center justify-center">
                                  <MaterialIcons name="eco" size={32} color={UI.color.primary} />
                                </View>
                              )}
                              <View className="p-2">
                                <Text className="text-[12px] font-semibold text-emerald-950" numberOfLines={2}>
                                  {p.name}
                                </Text>
                                <Text className="text-sm font-bold mt-0.5" style={{ color: UI.color.primary }}>
                                  ₹{Math.round(p.price)}
                                </Text>
                              </View>
                            </Pressable>
                          ))}
                        </ScrollView>
                      </View>
                    )}
                  </View>
                ))}
                {aiLoading && (
                  <View className="items-start mb-2">
                    <View className="rounded-2xl bg-white border border-emerald-100 px-4 py-3 flex-row items-center gap-2">
                      <ActivityIndicator size="small" color={UI.color.primary} />
                      <Text className="text-sm text-gray-600">Dootha is thinking…</Text>
                    </View>
                  </View>
                )}
              </View>
            )}

            <View className="mb-4">
              <View className="flex-row items-center gap-2 mb-2">
                <View className="w-8 h-8 rounded-full bg-emerald-100 items-center justify-center">
                  <MaterialIcons name="smart-toy" size={20} color={UI.color.primary} />
                </View>
                <View>
                  <Text className="text-sm font-bold text-emerald-950">Dootha</Text>
                  <Text className="text-xs text-gray-500">Care tips & product ideas</Text>
                </View>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                {DOOTHA_PROMPTS.map((p) => (
                  <TouchableOpacity
                    key={p}
                    onPress={() => sendToDootha(p)}
                    disabled={aiLoading}
                    className="px-4 py-2.5 rounded-full bg-white border border-emerald-200 active:bg-emerald-50">
                    <Text className="text-sm font-medium text-emerald-900" numberOfLines={2}>
                      {p}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <Text className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Popular searches</Text>
            <View className="flex-row flex-wrap gap-2 mb-6">
              {CATALOG_SUGGESTIONS.map((s) => (
                <TouchableOpacity
                  key={s}
                  onPress={() => {
                    setQuery(s);
                    submitSearchAndGoToShop(s);
                    router.replace('/(tabs)/shop');
                    closeSearch();
                  }}
                  className="px-4 py-2.5 rounded-full bg-white border border-emerald-100 active:bg-emerald-50">
                  <Text className="text-sm font-medium text-emerald-900">{s}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View className="rounded-2xl border border-emerald-100 bg-white p-4" style={{ marginBottom: 8 }}>
              <Text className="text-sm font-semibold text-emerald-950 mb-1">Identify from a photo</Text>
              <Text className="text-xs text-gray-600 mb-3">We&apos;ll search the catalog by plant name.</Text>
              <TouchableOpacity
                onPress={handleScanPlant}
                disabled={scanning}
                className="flex-row items-center justify-center gap-2 py-3.5 rounded-xl bg-emerald-700 active:opacity-90">
                {scanning ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <MaterialIcons name="photo-camera" size={22} color="#fff" />
                    <Text className="text-base font-semibold text-white">Camera or gallery</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
