import { MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Linking from 'expo-linking';
import {
  ExpoSpeechRecognitionModule,
  useSpeechRecognitionEvent,
} from 'expo-speech-recognition';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { ProductGridSkeleton } from '../../components/skeletons/ProductGridSkeleton';
import ProductCard from '../../components/ProductCard';
import { showConfirm } from '../../components/Alert';
import { toast } from '../../components/Toast';
import { apiFetch, identifyPlant, searchProducts } from '../../lib/api';
import { Product } from '../../lib/types';
import { useSearchStore } from '../../store/searchStore';

type SortBy = 'name' | 'price' | 'newest';

type CategoryRow = { id: number; name: string; slug: string };

function filterProductsByTag(products: Product[], tag: string): Product[] {
  const t = tag.trim().toLowerCase();
  if (!t) return products;
  return products.filter((p) => {
    const inTags = p.tags?.some((x) => x.toLowerCase().includes(t));
    const inName = p.name.toLowerCase().includes(t);
    return inTags || inName;
  });
}

export default function ShopScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const openSearch = useSearchStore((s) => s.openSearch);
  const pendingSearchQuery = useSearchStore((s) => s.pendingSearchQuery);
  const consumePendingQuery = useSearchStore((s) => s.consumePendingQuery);
  const submitSearchAndGoToShop = useSearchStore((s) => s.submitSearchAndGoToShop);
  const closeSearch = useSearchStore((s) => s.closeSearch);

  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [totalHint, setTotalHint] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searching, setSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategorySlug, setActiveCategorySlug] = useState<string | null>(null);
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<SortBy>('newest');
  const [scanning, setScanning] = useState(false);
  const [listening, setListening] = useState(false);
  const voiceResultRef = useRef<string | null>(null);

  useSpeechRecognitionEvent('result', (event) => {
    const transcript = event.results[0]?.transcript?.trim();
    if (transcript && event.isFinal) {
      voiceResultRef.current = transcript;
    }
  });
  useSpeechRecognitionEvent('end', () => {
    setListening(false);
    const text = voiceResultRef.current;
    if (text) {
      voiceResultRef.current = null;
      setSearchQuery(text);
      submitSearchAndGoToShop(text);
      closeSearch();
    }
  });
  useSpeechRecognitionEvent('error', (event) => {
    setListening(false);
    voiceResultRef.current = null;
    const err = String(event.error || '');
    if (err !== 'aborted' && err !== 'no-speech') {
      toast('Voice search failed. Try again.', 'error');
    }
  });

  const sortList = (list: Product[], sort: SortBy): Product[] => {
    const sorted = [...list];
    switch (sort) {
      case 'name':
        return sorted.sort((a, b) => a.name.localeCompare(b.name));
      case 'price':
        return sorted.sort((a, b) => a.price - b.price);
      default:
        return sorted;
    }
  };

  const loadMeta = useCallback(async () => {
    try {
      const [catRes, tagRes] = await Promise.all([apiFetch('/categories'), apiFetch('/tags')]);
      if (catRes.ok) {
        const data = await catRes.json();
        setCategories(Array.isArray(data) ? data : []);
      }
      if (tagRes.ok) {
        const raw = await tagRes.json();
        const list = Array.isArray(raw) ? raw : [];
        const sorted = [...list].sort((a, b) => a.localeCompare(b)).slice(0, 16);
        setTags(sorted);
      }
    } catch (e) {
      console.error('Shop meta load error:', e);
    }
  }, []);

  const runProductLoad = useCallback(async () => {
    const q = searchQuery.trim();

    if (q) {
      setSearching(true);
      try {
        const result = await searchProducts(q, 1, 80);
        let data = result.data;
        if (activeCategorySlug) {
          const cat = categories.find((c) => c.slug === activeCategorySlug);
          if (cat) data = data.filter((p) => p.categoryId === cat.id);
        }
        if (activeTag) data = filterProductsByTag(data, activeTag);
        setProducts(data);
        setTotalHint(result.pagination?.total ?? data.length);
      } finally {
        setSearching(false);
      }
      return;
    }

    if (activeTag && !activeCategorySlug) {
      setSearching(true);
      try {
        const result = await searchProducts(activeTag, 1, 80);
        setProducts(result.data);
        setTotalHint(result.pagination?.total ?? result.data.length);
      } finally {
        setSearching(false);
      }
      return;
    }

    if (activeCategorySlug) {
      setSearching(true);
      try {
        const res = await apiFetch(`/categories/${activeCategorySlug}/products`);
        if (!res.ok) {
          setProducts([]);
          setTotalHint(0);
          return;
        }
        let data: Product[] = await res.json();
        if (!Array.isArray(data)) data = [];
        if (activeTag) data = filterProductsByTag(data, activeTag);
        setProducts(data);
        setTotalHint(data.length);
      } finally {
        setSearching(false);
      }
      return;
    }

    setSearching(true);
    try {
      const response = await apiFetch('/products?page=1&pageSize=50');
      if (response.ok) {
        const json = await response.json();
        const list = Array.isArray(json) ? json : json.data || [];
        setTotalHint(json.pagination?.total ?? list.length);
        setProducts(list);
      }
    } finally {
      setSearching(false);
    }
  }, [searchQuery, activeCategorySlug, activeTag, categories]);

  useEffect(() => {
    loadMeta();
  }, [loadMeta]);

  useEffect(() => {
    const pending = consumePendingQuery();
    if (pending !== null) setSearchQuery(pending);
  }, [pendingSearchQuery]);

  useEffect(() => {
    const t = setTimeout(() => {
      (async () => {
        setLoading(true);
        try {
          await runProductLoad();
        } finally {
          setLoading(false);
        }
      })();
    }, searchQuery.trim() ? 450 : 0);
    return () => clearTimeout(t);
  }, [searchQuery, activeCategorySlug, activeTag, runProductLoad]);

  const displayedProducts = useMemo(() => sortList(products, sortBy), [products, sortBy]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadMeta();
    await runProductLoad();
    setRefreshing(false);
  }, [loadMeta, runProductLoad]);

  const handleSortChange = (newSort: SortBy) => {
    setSortBy(newSort);
    setShowFilters(false);
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
        setSearchQuery(name);
        submitSearchAndGoToShop(name);
      } else {
        toast('Could not identify plant. Try a clearer photo.', 'error');
      }
    } catch {
      toast('Identification failed. Try again.', 'error');
    } finally {
      setScanning(false);
    }
  };

  const handleScanPlant = useCallback(async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      toast('Allow camera access to scan plants.', 'error');
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
  }, []);

  const handleVoiceSearch = useCallback(async () => {
    if (listening) {
      ExpoSpeechRecognitionModule.stop();
      return;
    }
    const isAvailable = await ExpoSpeechRecognitionModule.isRecognitionAvailable();
    if (!isAvailable) {
      toast('Speech recognition is not available.', 'error');
      return;
    }
    const micResult = await ExpoSpeechRecognitionModule.requestMicrophonePermissionsAsync();
    if (!micResult.granted) {
      showConfirm('Microphone', 'Enable microphone for voice search.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Settings', onPress: () => Linking.openSettings() },
      ]);
      return;
    }
    const speechResult = await ExpoSpeechRecognitionModule.requestSpeechRecognizerPermissionsAsync?.();
    if (speechResult && !speechResult.granted) {
      showConfirm('Speech recognition', 'Enable speech recognition in Settings.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Settings', onPress: () => Linking.openSettings() },
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

  const toggleTag = (tag: string) => {
    setActiveTag((prev) => (prev === tag ? null : tag));
  };

  const subtitle = useMemo(() => {
    if (searchQuery.trim()) return `Results for "${searchQuery.trim()}"`;
    if (activeTag && activeCategorySlug) return `${activeTag} · ${categories.find((c) => c.slug === activeCategorySlug)?.name ?? 'Category'}`;
    if (activeTag) return `Tagged: ${activeTag}`;
    if (activeCategorySlug) return categories.find((c) => c.slug === activeCategorySlug)?.name ?? 'Category';
    return 'All plants';
  }, [searchQuery, activeTag, activeCategorySlug, categories]);

  const renderProduct = ({ item, index }: { item: Product; index: number }) => (
    <View className="w-[48%]">
      <ProductCard
        product={item}
        onPress={() => router.push({ pathname: '/product/[id]', params: { id: item.slug.toString() } })}
        index={index}
      />
    </View>
  );

  const showLoader = loading || searching;

  return (
    <View className="flex-1" style={{ backgroundColor: '#F0F7F4' }}>
      <View style={{ paddingTop: insets.top }} className="bg-white border-b border-emerald-100/80">
        <Animated.View entering={FadeInDown.duration(350)} className="px-4 pb-3">
          <View className="flex-row items-center justify-between mb-3">
            <View className="flex-row items-center gap-2 flex-1">
              <MaterialIcons name="storefront" size={26} color="#14532D" />
              <View>
                <Text className="text-xl font-bold text-emerald-950">Shop</Text>
                <Text className="text-xs text-emerald-700/80" numberOfLines={1}>
                  {subtitle}
                </Text>
              </View>
            </View>
            <View className="flex-row items-center gap-1">
              <TouchableOpacity
                onPress={() => router.push('/wishlist')}
                className="w-11 h-11 rounded-2xl bg-emerald-50 items-center justify-center active:opacity-80"
                accessibilityLabel="Wishlist">
                <MaterialIcons name="favorite-border" size={22} color="#14532D" />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setShowFilters(true)}
                className="w-11 h-11 rounded-2xl bg-emerald-50 items-center justify-center active:opacity-80"
                accessibilityLabel="Sort and filters">
                <MaterialIcons name="tune" size={22} color="#14532D" />
              </TouchableOpacity>
            </View>
          </View>

          <View
            className="flex-row items-center rounded-2xl px-3 h-14 border border-emerald-200/80 bg-white"
            style={{
              shadowColor: '#14532D',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.06,
              shadowRadius: 8,
              elevation: 2,
            }}>
            <TouchableOpacity
              className="flex-1 flex-row items-center min-w-0"
              onPress={() => openSearch(searchQuery)}
              activeOpacity={0.85}>
              <MaterialIcons name="search" size={22} color="#059669" />
              <Text
                className={`ml-2 flex-1 text-base ${searchQuery ? 'text-emerald-950' : 'text-gray-500'}`}
                numberOfLines={1}>
                {searchQuery || 'Search for plants...'}
              </Text>
            </TouchableOpacity>
            {searchQuery.length > 0 && (
              <TouchableOpacity
                onPress={() => setSearchQuery('')}
                className="p-2 mr-1"
                hitSlop={8}>
                <MaterialIcons name="close" size={20} color="#6B7280" />
              </TouchableOpacity>
            )}
            <View className="flex-row items-center pl-2 border-l border-emerald-100">
              <TouchableOpacity onPress={handleScanPlant} disabled={scanning} className="p-2 rounded-xl active:bg-emerald-50">
                {scanning ? (
                  <ActivityIndicator size="small" color="#059669" />
                ) : (
                  <MaterialIcons name="photo-camera" size={22} color="#14532D" />
                )}
              </TouchableOpacity>
              <TouchableOpacity onPress={handleVoiceSearch} disabled={scanning} className="p-2 rounded-xl active:bg-emerald-50">
                <MaterialIcons name="mic" size={22} color={listening ? '#DC2626' : '#14532D'} />
              </TouchableOpacity>
            </View>
          </View>

          {tags.length > 0 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              className="mt-3"
              contentContainerStyle={{ gap: 8, paddingRight: 8 }}>
              {tags.map((tag) => {
                const active = activeTag === tag;
                return (
                  <TouchableOpacity
                    key={tag}
                    onPress={() => toggleTag(tag)}
                    className={`px-4 py-2 rounded-full border ${
                      active ? 'bg-emerald-800 border-emerald-800' : 'bg-white border-emerald-200'
                    }`}>
                    <Text className={`text-sm font-semibold ${active ? 'text-white' : 'text-emerald-900'}`}>{tag}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="mt-3"
            contentContainerStyle={{ gap: 8, paddingRight: 8 }}>
            <TouchableOpacity
              onPress={() => {
                setActiveCategorySlug(null);
              }}
              className={`pb-2 px-1 ${activeCategorySlug === null ? 'border-b-2 border-emerald-800' : ''}`}>
              <Text
                className={`text-sm font-semibold ${activeCategorySlug === null ? 'text-emerald-950' : 'text-gray-500'}`}>
                All
              </Text>
            </TouchableOpacity>
            {categories.map((cat) => {
              const active = activeCategorySlug === cat.slug;
              return (
                <TouchableOpacity
                  key={cat.id}
                  onPress={() => setActiveCategorySlug(cat.slug)}
                  className={`pb-2 px-1 ${active ? 'border-b-2 border-emerald-800' : ''}`}>
                  <Text className={`text-sm font-semibold ${active ? 'text-emerald-950' : 'text-gray-500'}`} numberOfLines={1}>
                    {cat.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </Animated.View>
      </View>

      {!showLoader && !refreshing && (
        <View className="px-4 py-2 flex-row items-center justify-between">
          <Text className="text-sm text-emerald-800/80">
            {displayedProducts.length} {displayedProducts.length === 1 ? 'plant' : 'plants'}
            {totalHint != null && totalHint > displayedProducts.length ? ` · ${totalHint}+ listed` : ''}
          </Text>
          <View className="flex-row items-center gap-1">
            <MaterialIcons name="eco" size={16} color="#059669" />
            <Text className="text-xs text-emerald-700">Curated for you</Text>
          </View>
        </View>
      )}

      {showLoader && !refreshing ? (
        <View className="flex-1 px-2 pt-2">
          <ProductGridSkeleton count={6} />
        </View>
      ) : displayedProducts.length === 0 ? (
        <View className="flex-1 justify-center items-center px-8" style={{ marginTop: 24 }}>
          <MaterialIcons name="local-florist" size={56} color="#BBD4C7" />
          <Text className="text-lg font-semibold text-emerald-950 mt-4 text-center">No plants match</Text>
          <Text className="text-sm text-emerald-800/70 mt-2 text-center">
            {searchQuery ? 'Try another search or clear filters' : 'Try a different category or tag'}
          </Text>
          <TouchableOpacity
            className="mt-6 px-6 py-3 rounded-2xl bg-emerald-800"
            onPress={() => {
              setSearchQuery('');
              setActiveTag(null);
              setActiveCategorySlug(null);
            }}>
            <Text className="text-white font-semibold">Reset filters</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={displayedProducts}
          renderItem={renderProduct}
          keyExtractor={(item) => item.id.toString()}
          numColumns={2}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#059669" />}
          contentContainerStyle={{ padding: 8, paddingBottom: insets.bottom + 24 }}
          columnWrapperStyle={{ justifyContent: 'space-between', paddingHorizontal: 8 }}
          showsVerticalScrollIndicator={false}
        />
      )}

      <Modal visible={showFilters} transparent animationType="slide" onRequestClose={() => setShowFilters(false)}>
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white rounded-t-3xl p-6 pb-8" style={{ paddingBottom: insets.bottom + 24 }}>
            <View className="flex-row justify-between items-center mb-6">
              <Text className="text-xl font-bold text-emerald-950">Sort by</Text>
              <TouchableOpacity onPress={() => setShowFilters(false)}>
                <MaterialIcons name="close" size={24} color="#14532D" />
              </TouchableOpacity>
            </View>
            <View className="gap-3">
              {(
                [
                  ['newest', 'Newest first'],
                  ['name', 'Name (A–Z)'],
                  ['price', 'Price (low to high)'],
                ] as const
              ).map(([key, label]) => (
                <TouchableOpacity
                  key={key}
                  className={`flex-row justify-between items-center p-4 rounded-2xl border ${
                    sortBy === key ? 'bg-emerald-50 border-emerald-700' : 'bg-gray-50 border-transparent'
                  }`}
                  onPress={() => handleSortChange(key)}>
                  <Text className={`text-base font-medium ${sortBy === key ? 'text-emerald-900' : 'text-gray-800'}`}>{label}</Text>
                  {sortBy === key && <MaterialIcons name="check" size={22} color="#059669" />}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
