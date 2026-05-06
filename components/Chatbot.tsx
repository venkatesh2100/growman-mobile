import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'expo-router';
import {
  ActivityIndicator,
  Image,
  Keyboard,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { identifyPlant } from '../lib/api';
import { sendChatMessage, type ChatProductRec } from '../lib/chatApi';
import { UI } from '../lib/ui';
import { showAlert, showConfirm } from './Alert';
import { toast } from './Toast';
import MarkdownRenderer from './product/MarkdownRenderer';
import { setChatbotOpener } from '../lib/chatbotOpener';

interface Message {
  id: string;
  role: 'user' | 'dootha';
  content: string;
  products?: ChatProductRec[];
}

const DEFAULT_MESSAGE: Message = {
  id: '1',
  role: 'dootha',
  content:
    "Hi! I'm **Dootha**, your Growman plant assistant. Ask about care, pests, light, or watering — I can suggest products from our store too.",
};

export default function Chatbot() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    setChatbotOpener((message?: string) => {
      setIsOpen(true);
      if (message && message.trim()) {
        setInput(message.trim());
      }
    });
    return () => setChatbotOpener(null);
  }, []);
  const [messages, setMessages] = useState<Message[]>([DEFAULT_MESSAGE]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const showSub = Keyboard.addListener(showEvent, (e) => {
      setKeyboardHeight(e.endCoordinates.height + 16);
    });
    const hideSub = Keyboard.addListener(hideEvent, () => {
      setKeyboardHeight(0);
    });
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  useEffect(() => {
    if (isOpen && scrollViewRef.current) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages, isOpen]);

  useEffect(() => {
    if (keyboardHeight > 0 && scrollViewRef.current) {
      setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [keyboardHeight]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
    };

    const prior = messages;
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const { response, products } = await sendChatMessage(userMessage.content, prior);

      const doothaMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'dootha',
        content: response,
        products: products.length > 0 ? products : undefined,
      };

      setMessages((prev) => [...prev, doothaMessage]);
    } catch (error) {
      console.error('Chat error:', error);
      toast('Failed to get response. Please try again.', 'error');
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'dootha',
        content: "I'm having trouble connecting. Please try again in a moment.",
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleScanPlant = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      showAlert(
        'Camera permission',
        'Please allow camera access to scan plants.'
      );
      return;
    }

    showConfirm('Scan plant', 'Choose image source', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Camera',
        onPress: async () => {
          const result = await ImagePicker.launchCameraAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
          });
          if (!result.canceled && result.assets[0]) {
            await identifyAndSendToChat(result.assets[0].uri);
          }
        },
      },
      {
        text: 'Gallery',
        onPress: async () => {
          const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
          });
          if (!result.canceled && result.assets[0]) {
            await identifyAndSendToChat(result.assets[0].uri);
          }
        },
    },
    ]);
  };

  const identifyAndSendToChat = async (uri: string) => {
    setScanning(true);
    try {
      const data = await identifyPlant(uri);
      const name =
        data.bestMatch ||
        data.results?.[0]?.species?.scientificName ||
        data.results?.[0]?.species?.commonNames?.[0];
      if (name) {
        setInput(`What is ${name} and how do I care for it?`);
        toast('Plant identified! Edit the message and send.', 'success');
      } else {
        toast('Could not identify plant. Try a clearer photo.', 'error');
      }
    } catch (err) {
      console.error('Plant identification error:', err);
      toast('Identification failed. Please try again.', 'error');
    } finally {
      setScanning(false);
    }
  };

  const openProduct = (p: ChatProductRec) => {
    const id = p.slug || String(p.id);
    router.push({ pathname: '/product/[id]', params: { id } });
    setIsOpen(false);
  };

  const renderMessage = (message: Message, index: number) => {
    const isUser = message.role === 'user';

    return (
      <Animated.View
        key={message.id}
        entering={FadeInDown.delay(index * 50).duration(300)}
        className={`mb-3 ${isUser ? 'items-end' : 'items-start'}`}>
        <View
          className={`max-w-[85%] p-3 rounded-2xl ${
            isUser ? 'bg-emerald-700 rounded-br-md' : 'bg-white border border-emerald-100 rounded-bl-md'
          }`}>
          {isUser ? (
            <Text className="text-[15px] leading-5 text-white">{message.content}</Text>
          ) : (
            <MarkdownRenderer content={message.content} />
          )}
          {message.products && message.products.length > 0 && (
            <View className="mt-3">
              <Text className="text-xs font-semibold text-emerald-800 mb-2">Suggested for you</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
                {message.products.map((product) => (
                  <Pressable
                    key={product.id}
                    onPress={() => openProduct(product)}
                    className="w-[124px] rounded-2xl overflow-hidden bg-emerald-50/80 border border-emerald-100 active:opacity-90">
                    {product.imageUrl ? (
                      <Image
                        source={{ uri: product.imageUrl }}
                        className="w-full h-[88px] bg-gray-100"
                        resizeMode="cover"
                      />
                    ) : (
                      <View className="w-full h-[88px] bg-emerald-100 items-center justify-center">
                        <MaterialIcons name="eco" size={28} color={UI.color.primary} />
                      </View>
                    )}
                    <View className="p-2">
                      <Text className="text-[11px] font-semibold text-emerald-950" numberOfLines={2}>
                        {product.name}
                      </Text>
                      <Text className="text-xs font-bold mt-0.5" style={{ color: UI.color.primary }}>
                        ₹{Math.round(product.price)}
                      </Text>
                    </View>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          )}
        </View>
      </Animated.View>
    );
  };

  return (
    <>
      {/* Opens from tab bar Chat tab via openChatbot() */}
      <Modal
        visible={isOpen}
        animationType="fade"
        transparent
        statusBarTranslucent
        navigationBarTranslucent
        onRequestClose={() => setIsOpen(false)}>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View className="flex-1 bg-white">
            {/* Keep nav button area white on 3-button Android, while dimming content above it */}
            <View
              pointerEvents="none"
              className="absolute left-0 right-0 top-0 bg-black/45"
              style={{ bottom: insets.bottom }}
            />
            <View className="flex-1 bg-white rounded-t-3xl mt-[88px] border border-emerald-100 overflow-hidden">
              <View
                className="flex-row justify-between items-center px-4 py-3 border-b border-emerald-100"
                style={{ backgroundColor: UI.color.canvas }}>
                <View className="flex-row items-center gap-3">
                  <View
                    className="w-10 h-10 rounded-full items-center justify-center"
                    style={{ backgroundColor: 'rgba(5, 150, 105, 0.12)' }}>
                    <MaterialIcons name="smart-toy" size={UI.icon.md} color={UI.color.primary} />
                  </View>
                  <View>
                    <Text className="text-base font-bold text-emerald-950">Dootha</Text>
                    <Text className="text-xs text-gray-500">Growman assistant</Text>
                  </View>
                </View>
                <TouchableOpacity onPress={() => setIsOpen(false)} hitSlop={12} className="p-2 rounded-xl active:bg-emerald-50">
                  <MaterialIcons name="close" size={UI.icon.lg} color={UI.color.ink} />
                </TouchableOpacity>
              </View>

              <ScrollView
                ref={scrollViewRef}
                className="flex-1"
                style={{ backgroundColor: UI.color.canvasAlt }}
                contentContainerStyle={{ padding: 16, paddingBottom: 24 + insets.bottom }}
                keyboardShouldPersistTaps="handled"
                keyboardDismissMode="on-drag"
                showsVerticalScrollIndicator={false}>
                {messages.map((message, index) => renderMessage(message, index))}
                {isLoading && (
                  <View className="mb-2 items-start">
                    <View className="max-w-[80%] px-4 py-3 rounded-2xl rounded-bl-md bg-white border border-emerald-100 flex-row items-center gap-2">
                      <ActivityIndicator size="small" color={UI.color.primary} />
                      <Text className="text-sm text-gray-600">Thinking…</Text>
                    </View>
                  </View>
                )}
              </ScrollView>

              <View
                className="flex-row px-3 py-3 border-t border-emerald-100 bg-white gap-2 items-end"
                style={{ paddingBottom: keyboardHeight > 0 ? 12 + keyboardHeight : 12 + insets.bottom }}>
                <TouchableOpacity
                  onPress={handleScanPlant}
                  disabled={scanning}
                  className="w-11 h-11 rounded-2xl items-center justify-center"
                  style={{ backgroundColor: 'rgba(5, 150, 105, 0.12)' }}>
                  {scanning ? (
                    <ActivityIndicator size="small" color={UI.color.primary} />
                  ) : (
                    <MaterialIcons name="photo-camera" size={UI.icon.md} color={UI.color.primaryDark} />
                  )}
                </TouchableOpacity>
                <TextInput
                  className="flex-1 min-h-[44px] max-h-[100px] rounded-2xl px-4 py-3 text-[15px] text-gray-900 border border-emerald-100"
                  style={{ backgroundColor: UI.color.canvasAlt }}
                  placeholder="Ask about plants or care…"
                  value={input}
                  onChangeText={setInput}
                  placeholderTextColor="#9CA3AF"
                  multiline
                  maxLength={500}
                  onSubmitEditing={handleSend}
                  returnKeyType="send"
                  blurOnSubmit={false}
                />
                <TouchableOpacity
                  className={`w-11 h-11 rounded-2xl justify-center items-center ${
                    !input.trim() || isLoading ? 'bg-gray-200' : ''
                  }`}
                  style={input.trim() && !isLoading ? { backgroundColor: UI.color.primary } : undefined}
                  onPress={handleSend}
                  disabled={!input.trim() || isLoading}>
                  <MaterialIcons name="send" size={20} color={input.trim() && !isLoading ? '#FFFFFF' : '#9CA3AF'} />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </>
  );
}
