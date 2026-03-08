import { MaterialIcons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  FlatList,
  Modal,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

interface Option {
  label: string;
  value: string;
}

interface SelectFieldProps {
  value: string;
  onValueChange: (value: string) => void;
  options: Option[];
  placeholder?: string;
  className?: string;
}

export default function SelectField({
  value,
  onValueChange,
  options,
  placeholder = 'Select...',
  className = '',
}: SelectFieldProps) {
  const [open, setOpen] = useState(false);

  const displayText = value || placeholder;
  const isPlaceholder = !value;

  return (
    <>
      <TouchableOpacity
        onPress={() => setOpen(true)}
        activeOpacity={0.7}
        className={`w-full px-4 py-2 flex-row items-center justify-between border border-gray-300 rounded-lg ${className}`}
        style={{ minHeight: 44 }}>
        <Text
          className={`text-base flex-1 ${isPlaceholder ? 'text-gray-500' : 'text-gray-900'}`}
          numberOfLines={1}>
          {displayText}
        </Text>
        <MaterialIcons name="keyboard-arrow-down" size={24} color="#6B7280" />
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="slide">
        <View className="flex-1 justify-end">
          <TouchableOpacity
            className="absolute inset-0 bg-black/50"
            activeOpacity={1}
            onPress={() => setOpen(false)}
          />
          <View className="bg-white rounded-t-2xl max-h-[60%]">
            <View className="flex-row justify-between items-center p-4 border-b border-gray-200">
              <Text className="text-lg font-semibold text-gray-900">Select</Text>
              <TouchableOpacity onPress={() => setOpen(false)}>
                <MaterialIcons name="close" size={24} color="#111827" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={options}
              keyExtractor={(item) => item.value}
              renderItem={({ item }) => (
                <TouchableOpacity
                  className={`px-4 py-3 ${item.value === value ? 'bg-green-50' : ''}`}
                  onPress={() => {
                    onValueChange(item.value);
                    setOpen(false);
                  }}>
                  <Text
                    className={`text-base ${item.value === value ? 'text-green-600 font-medium' : 'text-gray-900'}`}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
    </>
  );
}
