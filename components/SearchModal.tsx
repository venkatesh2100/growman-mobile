import { MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { identifyPlant } from '../lib/api';
import { useSearchStore } from '../store/searchStore';
import { toast } from './Toast';

export default function SearchModal() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { showSearchModal, closeSearch, submitSearchAndGoToShop, initialSearchQuery } =
    useSearchStore();
  const [query, setQuery] = useState(initialSearchQuery);
  const [scanning, setScanning] = useState(false);

  useEffect(() => {
    if (showSearchModal) {
      setQuery(initialSearchQuery);
    }
  }, [showSearchModal, initialSearchQuery]);

  const handleSubmit = () => {
    submitSearchAndGoToShop(query);
    router.replace('/(tabs)/shop');
  };

  const handleClose = () => {
    closeSearch();
  };

  const handleScanPlant = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Camera permission',
        'Please allow camera access to scan plants.',
        [{ text: 'OK' }]
      );
      return;
    }

    Alert.alert('Scan plant', 'Choose image source', [
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
            await identifyAndSearch(result.assets[0].uri);
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
            await identifyAndSearch(result.assets[0].uri);
          }
        },
      },
    ]);
  };

  const identifyAndSearch = async (uri: string) => {
    setScanning(true);
    try {
      const data = await identifyPlant(uri);
      const name = data.bestMatch ||
        data.results?.[0]?.species?.scientificName ||
        data.results?.[0]?.species?.commonNames?.[0];
      if (name) {
        submitSearchAndGoToShop(name);
        router.replace('/(tabs)/shop');
        closeSearch();
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

  return (
    <Modal
      visible={showSearchModal}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1 bg-white"
      >
        <View
          className="flex-row items-center px-4 gap-3 border-b border-gray-200"
          style={{ paddingTop: insets.top + 12, paddingBottom: 12 }}
        >
          <TouchableOpacity onPress={handleClose} className="p-2 -ml-2">
            <MaterialIcons name="arrow-back" size={24} color="#111827" />
          </TouchableOpacity>
          <View className="flex-1 flex-row items-center bg-gray-100 rounded-xl px-4 h-12">
            <MaterialIcons name="search" size={22} color="#6B7280" />
            <TextInput
              className="flex-1 text-base text-gray-900 ml-3"
              placeholder="Search for plants..."
              value={query}
              onChangeText={setQuery}
              placeholderTextColor="#9CA3AF"
              autoFocus
              returnKeyType="search"
              onSubmitEditing={handleSubmit}
              autoCapitalize="none"
              autoCorrect={false}
            />
            {query.length > 0 && (
              <TouchableOpacity onPress={() => setQuery('')}>
                <MaterialIcons name="close" size={22} color="#6B7280" />
              </TouchableOpacity>
            )}
          </View>
          <TouchableOpacity
            onPress={handleScanPlant}
            disabled={scanning}
            className="w-11 h-11 rounded-xl bg-green-100 justify-center items-center"
          >
            {scanning ? (
              <ActivityIndicator size="small" color="#059669" />
            ) : (
              <MaterialIcons name="photo-camera" size={22} color="#059669" />
            )}
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleSubmit}
            className="bg-green-600 px-4 py-3 rounded-xl"
          >
            <Text className="text-white font-semibold">Search</Text>
          </TouchableOpacity>
        </View>
        <View className="flex-1 justify-center items-center px-8">
          <View className="flex-row items-center gap-2 mb-4">
            <MaterialIcons name="search" size={64} color="#E5E7EB" />
            <MaterialIcons name="photo-camera" size={48} color="#E5E7EB" />
          </View>
          <Text className="text-base text-gray-500 text-center">
            Search for plants or scan with camera to identify
          </Text>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
