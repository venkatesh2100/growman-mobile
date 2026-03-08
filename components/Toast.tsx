import React, { useEffect, useState } from 'react';
import { Animated, Text, TouchableOpacity, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

export interface Toast {
  id: string;
  message: string;
  type?: 'success' | 'error' | 'info';
}

let toastIdCounter = 0;
const listeners: ((toasts: Toast[]) => void)[] = [];
let toasts: Toast[] = [];

function notify() {
listeners.forEach((listener) => listener([...toasts]));
}

export function toast(message: string, type: 'success' | 'error' | 'info' = 'success') {
  const id = `toast-${++toastIdCounter}`;
  toasts.push({ id, message, type });
  notify();

  // Auto remove after 3 seconds
  setTimeout(() => {
    toasts = toasts.filter((t) => t.id !== id);
    notify();
  }, 3000);
}

export function useToast() {
  const [toastList, setToastList] = useState<Toast[]>([]);

  useEffect(() => {
    const listener = (newToasts: Toast[]) => {
      setToastList(newToasts);
    };
    listeners.push(listener);
    setToastList([...toasts]);

    return () => {
      const index = listeners.indexOf(listener);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    };
  }, []);

  return toastList;
}

export function ToastContainer() {
  const toastList = useToast();

  if (toastList.length === 0) return null;

  const removeToast = (id: string) => {
    toasts = toasts.filter((t) => t.id !== id);
    notify();
  };

  return (
    <View className="absolute top-12 right-4 left-4 z-[9999] gap-2">
      {toastList.map((toastItem) => (
        <ToastItem key={toastItem.id} toast={toastItem} onRemove={removeToast} />
      ))}
    </View>
  );
}

function ToastItem({ toast: toastItem, onRemove }: { toast: Toast; onRemove: (id: string) => void }) {
  const slideAnim = React.useRef(new Animated.Value(-100)).current;
  const opacityAnim = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 50,
        friction: 7,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleRemove = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: -100,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onRemove(toastItem.id);
    });
  };

  const getIcon = () => {
    switch (toastItem.type) {
      case 'success':
        return 'check-circle';
      case 'error':
        return 'error';
      case 'info':
        return 'info';
      default:
        return 'check-circle';
    }
  };

  const getColor = () => {
    switch (toastItem.type) {
      case 'success':
        return '#10B981';
      case 'error':
        return '#EF4444';
      case 'info':
        return '#3B82F6';
      default:
        return '#10B981';
    }
  };

  return (
    <Animated.View
      style={{
        backgroundColor: getColor(),
        transform: [{ translateX: slideAnim }],
        opacity: opacityAnim,
      }}
      className="flex-row items-center px-4 py-3 rounded-xl min-h-[48px] shadow-lg">
      <MaterialIcons name={getIcon()} size={20} color="#FFFFFF" className="mr-3" />
      <Text className="flex-1 text-sm font-semibold text-white" numberOfLines={2}>
        {toastItem.message}
      </Text>
      <TouchableOpacity onPress={handleRemove} className="ml-3 p-1">
        <MaterialIcons name="close" size={18} color="#FFFFFF" />
      </TouchableOpacity>
    </Animated.View>
  );
}
