import { MaterialIcons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { Animated, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { UI } from '../lib/ui';

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
  const insets = useSafeAreaInsets();

  if (toastList.length === 0) return null;

  const removeToast = (id: string) => {
    toasts = toasts.filter((t) => t.id !== id);
    notify();
  };

  return (
    <View className="absolute left-4 right-4 z-[9999] gap-2.5" style={{ top: insets.top + 10 }}>
      {toastList.map((toastItem) => (
        <ToastItem key={toastItem.id} toast={toastItem} onRemove={removeToast} />
      ))}
    </View>
  );
}

const TOAST_META: Record<
  NonNullable<Toast['type']>,
  { icon: React.ComponentProps<typeof MaterialIcons>['name']; accent: string; tint: string }
> = {
  success: { icon: 'check-circle', accent: UI.color.primary, tint: UI.color.primaryLight },
  error: { icon: 'error-outline', accent: '#DC2626', tint: '#FEF2F2' },
  info: { icon: 'info-outline', accent: '#2563EB', tint: '#EFF6FF' },
};

function ToastItem({ toast: toastItem, onRemove }: { toast: Toast; onRemove: (id: string) => void }) {
  const slideAnim = React.useRef(new Animated.Value(-16)).current;
  const opacityAnim = React.useRef(new Animated.Value(0)).current;
  const meta = TOAST_META[toastItem.type ?? 'success'];

  useEffect(() => {
    Animated.parallel([
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 60,
        friction: 9,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 220,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleRemove = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: -16,
        duration: 160,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 160,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onRemove(toastItem.id);
    });
  };

  return (
    <Animated.View
      style={{
        transform: [{ translateY: slideAnim }],
        opacity: opacityAnim,
        backgroundColor: UI.color.surface,
        borderRadius: 16,
        shadowColor: '#14532D',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.14,
        shadowRadius: 16,
        elevation: 6,
        overflow: 'hidden',
      }}
      className="flex-row items-center min-h-[56px]">
      <View style={{ width: 4, alignSelf: 'stretch', backgroundColor: meta.accent }} />
      <View
        className="w-8 h-8 rounded-full items-center justify-center ml-3"
        style={{ backgroundColor: meta.tint }}>
        <MaterialIcons name={meta.icon} size={17} color={meta.accent} />
      </View>
      <Text
        className="flex-1 text-[13px] ml-2.5 pr-2 my-3"
        style={{ fontFamily: UI.font.bodySemiBold, color: UI.color.ink, lineHeight: 18 }}
        numberOfLines={3}>
        {toastItem.message}
      </Text>
      <TouchableOpacity onPress={handleRemove} className="px-3 self-stretch items-center justify-center" hitSlop={8}>
        <MaterialIcons name="close" size={16} color="#9CA3AF" />
      </TouchableOpacity>
    </Animated.View>
  );
}
