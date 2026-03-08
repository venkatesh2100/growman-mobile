import React, { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Image,
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
// import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { MaterialIcons } from '@expo/vector-icons';
import { apiFetch } from '../lib/api';
import { toast } from './Toast';

interface Message {
  id: string;
  role: 'user' | 'dootha';
  content: string;
  products?: {
    id: number;
    name: string;
    price: number;
    imageUrl?: string;
  }[];
}

const DEFAULT_MESSAGE: Message = {
  id: '1',
  role: 'dootha',
  content:
    "Hi! I'm Dootha, your plant care assistant. I can help you find the perfect plants, answer care questions, and provide expert advice. How can I help you today?",
};

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([DEFAULT_MESSAGE]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (isOpen && scrollViewRef.current) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages, isOpen]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await apiFetch('/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage.content,
          conversationHistory: messages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const data = await response.json();

      if (!data || !data.response) {
        throw new Error('Invalid response from server');
      }

      const doothaMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'dootha',
        content: data.response,
        products: data.products || [],
      };

      setMessages((prev) => [...prev, doothaMessage]);
    } catch (error) {
      console.error('Chat error:', error);
      toast('Failed to get response. Please try again.', 'error');
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'dootha',
        content: "I'm sorry, I'm having trouble connecting right now. Please try again in a moment.",
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const renderMessage = (message: Message, index: number) => {
    const isUser = message.role === 'user';

    return (
      <Animated.View
        key={message.id}
        entering={FadeInDown.delay(index * 50).duration(300)}
        className={`mb-2 ${isUser ? 'items-end' : 'items-start'}`}>
        <View className={`max-w-[80%] p-3 rounded-2xl ${isUser ? 'bg-green-600 rounded-br-sm' : 'bg-gray-100 rounded-bl-sm'}`}>
          <Text className={`text-[15px] leading-5 ${isUser ? 'text-white' : 'text-gray-900'}`}>
            {message.content}
          </Text>
          {message.products && message.products.length > 0 && (
            <View className="mt-3 gap-2">
              {message.products.map((product) => (
                <TouchableOpacity key={product.id} className="flex-row bg-white rounded-xl p-2 gap-2 border border-gray-200">
                  {product.imageUrl && (
                    <Image
                      source={{ uri: product.imageUrl }}
                      className="w-[60px] h-[60px] rounded-lg bg-gray-100"
                      resizeMode="cover"
                    />
                  )}
                  <View className="flex-1 justify-center">
                    <Text className="text-[13px] font-semibold text-gray-900 mb-1" numberOfLines={2}>
                      {product.name}
                    </Text>
                    <Text className="text-sm font-bold text-green-600">₹{product.price}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </Animated.View>
    );
  };

  return (
    <>
      {/* Chat Button */}
      <TouchableOpacity
        className="absolute bottom-20 right-5 w-14 h-14 rounded-full bg-green-600 justify-center items-center shadow-lg z-[1000]"
        onPress={() => setIsOpen(true)}
        activeOpacity={0.8}>
        <MaterialIcons name="chat" size={24} color="#FFFFFF" />
      </TouchableOpacity>

      {/* Chat Modal */}
      <Modal
        visible={isOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setIsOpen(false)}>
        <KeyboardAvoidingView
          className="flex-1 bg-black/50"
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <View className="flex-1 bg-white rounded-t-3xl mt-[100px]">
            {/* Header */}
            <View className="flex-row justify-between items-center p-4 border-b border-gray-200 bg-gray-50 rounded-t-3xl">
              <View className="flex-row items-center gap-3">
                <View className="w-10 h-10 rounded-full bg-green-100 justify-center items-center">
                  <MaterialIcons name="smart-toy" size={24} color="#059669" />
                </View>
                <View>
                  <Text className="text-base font-bold text-gray-900">Dootha</Text>
                  <Text className="text-xs text-gray-500">Plant Care Assistant</Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => setIsOpen(false)}>
                <MaterialIcons name="close" size={24} color="#111827" />
              </TouchableOpacity>
            </View>

            {/* Messages */}
            <ScrollView
              ref={scrollViewRef}
              className="flex-1"
              contentContainerStyle={{ padding: 16, gap: 12 }}>
              {messages.map((message, index) => renderMessage(message, index))}
              {isLoading && (
                <View className="mb-2 items-start">
                  <View className="max-w-[80%] p-3 rounded-2xl rounded-bl-sm bg-gray-100">
                    <ActivityIndicator size="small" color="#059669" />
                  </View>
                </View>
              )}
            </ScrollView>

            {/* Input */}
            <View className="flex-row p-4 border-t border-gray-200 bg-white gap-3 items-end">
              <TextInput
                className="flex-1 min-h-[44px] max-h-[100px] bg-gray-100 rounded-[22px] px-4 py-3 text-[15px] text-gray-900"
                placeholder="Type your message..."
                value={input}
                onChangeText={setInput}
                placeholderTextColor="#9CA3AF"
                multiline
                maxLength={500}
                onSubmitEditing={handleSend}
                returnKeyType="send"
              />
              <TouchableOpacity
                className={`w-11 h-11 rounded-[22px] justify-center items-center ${(!input.trim() || isLoading) ? 'bg-gray-300' : 'bg-green-600'}`}
                onPress={handleSend}
                disabled={!input.trim() || isLoading}>
                <MaterialIcons name="send" size={20} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}
