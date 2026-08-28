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
import Animated, {
  FadeInDown,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { identifyPlant } from '../lib/api';
import { sendChatMessage, type ChatOrderRec, type ChatProductRec } from '../lib/chatApi';
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
  orders?: ChatOrderRec[];
}

const DEFAULT_MESSAGE: Message = {
  id: '1',
  role: 'dootha',
  content:
    "Hi! I'm **Dootha**, your Growman plant assistant. Ask about care, pests, light, or watering — I can suggest products from our store too.",
};

const PRODUCT_CARD_WIDTH = 112;
const PRODUCT_IMAGE_HEIGHT = 92;
const PRODUCT_ROW_HEIGHT = 168;

function orderStatusColors(status: string) {
  const s = status.toLowerCase();
  if (s.includes('delivered')) return { bg: '#DCFCE7', text: '#166534' };
  if (s.includes('ship') || s.includes('delivery')) return { bg: '#DBEAFE', text: '#1E40AF' };
  if (s.includes('pending')) return { bg: '#FEE2E2', text: '#991B1B' };
  return { bg: '#FEF3C7', text: '#92400E' };
}

const THINKING_DOTS = [0, 160, 320];

function ThinkingDot({ delay }: { delay: number }) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 420, easing: Easing.out(Easing.cubic) }),
          withTiming(0, { duration: 420, easing: Easing.in(Easing.cubic) })
        ),
        -1,
        false
      )
    );
  }, [delay, progress]);

  const dotStyle = useAnimatedStyle(() => ({
    opacity: 0.35 + progress.value * 0.65,
    transform: [{ translateY: -progress.value * 4 }, { scale: 0.88 + progress.value * 0.12 }],
  }));

  return (
    <Animated.View
      style={[
        { width: 7, height: 7, borderRadius: 999, backgroundColor: UI.color.primary },
        dotStyle,
      ]}
    />
  );
}

function ThinkingIndicator() {
  const shimmer = useSharedValue(0.45);

  useEffect(() => {
    shimmer.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 900, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.45, { duration: 900, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );
  }, [shimmer]);

  const labelStyle = useAnimatedStyle(() => ({
    opacity: shimmer.value,
  }));

  return (
    <Animated.View entering={FadeInDown.duration(220)} className="mb-2 items-start">
      <View className="max-w-[80%] px-4 py-3 rounded-2xl rounded-bl-md bg-white border border-emerald-100 flex-row items-center gap-3">
        {/* <Image
          source={require('../assets/images/icon-transparent.png')}
          style={{ width: 22, height: 22, opacity: 0.85 }}
          resizeMode="contain"
          accessibilityElementsHidden
          importantForAccessibility="no"
        /> */}
        <View className="flex-row items-center gap-1.5">
          {THINKING_DOTS.map((delay) => (
            <ThinkingDot key={delay} delay={delay} />
          ))}
        </View>
        <Animated.Text className="text-sm text-gray-500 ml-0.5" style={labelStyle}>
          Thinking
        </Animated.Text>
      </View>
    </Animated.View>
  );
}

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
      const { response, products, orders } = await sendChatMessage(userMessage.content, prior);

      const doothaMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'dootha',
        content: response,
        products: products.length > 0 ? products : undefined,
        orders: orders.length > 0 ? orders : undefined,
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
        </View>
        {!isUser && message.orders && message.orders.length > 0 && (
          <View className="mt-2 self-stretch gap-2">
            {message.orders.map((order) => {
              const badge = orderStatusColors(order.status);
              return (
                <Pressable
                  key={order.id}
                  onPress={() => {
                    router.push('/orders');
                    setIsOpen(false);
                  }}
                  className="flex-row overflow-hidden rounded-2xl border border-emerald-100 bg-white active:opacity-90">
                  {order.imageUrl ? (
                    <Image
                      source={{ uri: order.imageUrl }}
                      style={{ width: 76, height: 76, backgroundColor: '#F3F4F6' }}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={{ width: 76, height: 76 }} className="items-center justify-center bg-emerald-50">
                      <MaterialIcons name="local-shipping" size={28} color={UI.color.primary} />
                    </View>
                  )}
                  <View className="flex-1 justify-center px-3 py-2">
                    <View className="flex-row items-center justify-between gap-2">
                      <Text className="text-sm font-bold text-emerald-950">Order #{order.id}</Text>
                      <View className="rounded-full px-2 py-0.5" style={{ backgroundColor: badge.bg }}>
                        <Text style={{ color: badge.text, fontSize: 10, fontWeight: '700' }}>{order.status}</Text>
                      </View>
                    </View>
                    <Text className="mt-1 text-xs leading-4 text-gray-600" numberOfLines={2}>
                      {order.itemPreview}
                    </Text>
                    <Text className="mt-1 text-xs font-bold" style={{ color: UI.color.primary }}>
                      ₹{Math.round(order.amount)} · {order.createdAt}
                      {order.expectedDeliveryDate ? ` · ETA ${order.expectedDeliveryDate}` : ''}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
            <Pressable onPress={() => { router.push('/orders'); setIsOpen(false); }} className="py-1">
              <Text className="text-center text-xs font-semibold" style={{ color: UI.color.primaryDark }}>
                View all orders →
              </Text>
            </Pressable>
          </View>
        )}
        {!isUser && message.products && message.products.length > 0 && (
          <View className="mt-2 self-stretch">
            <Text className="text-xs font-semibold text-emerald-800 mb-2">Suggested for you</Text>
            <ScrollView
              horizontal
              nestedScrollEnabled
              showsHorizontalScrollIndicator={false}
              style={{ height: PRODUCT_ROW_HEIGHT }}
              contentContainerStyle={{ gap: 10, alignItems: 'flex-start' }}>
              {message.products.map((product) => (
                <Pressable
                  key={product.id}
                  onPress={() => openProduct(product)}
                  className="rounded-2xl overflow-hidden bg-emerald-50/80 border border-emerald-100 active:opacity-90"
                  style={{ width: PRODUCT_CARD_WIDTH, height: PRODUCT_ROW_HEIGHT - 4 }}>
                  {product.imageUrl ? (
                    <Image
                      source={{ uri: product.imageUrl }}
                      style={{ width: PRODUCT_CARD_WIDTH, height: PRODUCT_IMAGE_HEIGHT, backgroundColor: '#F3F4F6' }}
                      resizeMode="cover"
                    />
                  ) : (
                    <View
                      style={{ width: PRODUCT_CARD_WIDTH, height: PRODUCT_IMAGE_HEIGHT }}
                      className="bg-emerald-100 items-center justify-center">
                      <MaterialIcons name="eco" size={24} color={UI.color.primary} />
                    </View>
                  )}
                  <View className="flex-1 justify-center px-2 py-1.5">
                    <Text className="text-[11px] font-semibold text-emerald-950 leading-[14px]" numberOfLines={2}>
                      {product.name}
                    </Text>
                    <Text className="text-[11px] font-bold mt-0.5" style={{ color: UI.color.primary }}>
                      ₹{Math.round(product.price)}
                    </Text>
                  </View>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        )}
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
                  <Image
                    source={require('../assets/images/icon-transparent.png')}
                    className="w-10 h-10"
                    resizeMode="contain"
                    accessibilityLabel="Dootha"
                  />
                  <View>
                    <Text className="text-lg" style={{ fontFamily: UI.font.display, color: UI.color.ink }}>
                      Dootha
                    </Text>
                    <Text className="text-xs text-gray-500">Growman plant assistant</Text>
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
                {isLoading ? <ThinkingIndicator /> : null}
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
