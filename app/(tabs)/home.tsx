import { MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Linking from 'expo-linking';
import {
  ExpoSpeechRecognitionModule,
  useSpeechRecognitionEvent,
} from 'expo-speech-recognition';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { ProductCardSkeleton } from '../../components/skeletons/ProductCardSkeleton';
import ProductCard from '../../components/ProductCard';
import { toast } from '../../components/Toast';
import { apiFetch, identifyPlant } from '../../lib/api';
import { Product } from '../../lib/types';
import { showAlert, showConfirm } from '../../components/Alert';
import { useSearchStore } from '../../store/searchStore';
import { UI } from '../../lib/ui';

interface Category {
  id: number;
  name: string;
  slug: string;
  imageUrl?: string;
}

type Banner = {
  key: string;
  headline: string;
  highlight: string;
  sub: string;
  cta: string;
  colors: readonly [string, string, string, string];
};

/** Top → bottom: light (status / dark icons) → deep accent (headline area). */
const BANNERS: Banner[] = [
  {
    key: 'nature',
    headline: 'Bring Nature',
    highlight: 'Home',
    sub: 'Hand-picked plants, delivered with care.',
    cta: 'Shop plants',
    colors: ['#ecfdf5', '#6ee7b7', '#059669', '#064e3b'],
  },
  {
    key: 'fresh',
    headline: 'Fresh',
    highlight: 'Greenery',
    sub: 'New arrivals every week. Indoor & outdoor favourites.',
    cta: 'Explore new',
    colors: ['#f0fdf4', '#86efac', '#16a34a', '#14532d'],
  },
  {
    key: 'care',
    headline: 'Care',
    highlight: 'Made Easy',
    sub: 'Low-maintenance picks, pots, and expert tips.',
    cta: 'Easy-care picks',
    colors: ['#f0fdfa', '#5eead4', '#0d9488', '#134e4a'],
  },
  {
    key: 'deal',
    headline: 'Deals',
    highlight: 'You’ll Love',
    sub: 'Great prices on bundles and bestsellers.',
    cta: 'View offers',
    colors: ['#f7fee7', '#d9f99d', '#65a30d', '#3f6212'],
  },
];

export default function HomeScreen() {
  const { width: windowWidth } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const openSearch = useSearchStore((s) => s.openSearch);
  const submitSearchAndGoToShop = useSearchStore((s) => s.submitSearchAndGoToShop);
  const closeSearch = useSearchStore((s) => s.closeSearch);

  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [listening, setListening] = useState(false);
  const [bannerIndex, setBannerIndex] = useState(0);
  const [activeCategorySlug, setActiveCategorySlug] = useState<string | null>(null);
  const voiceResultRef = useRef<string | null>(null);

  const bannerWidth = windowWidth;
  const bannerHeight = Math.min(340, Math.round(windowWidth * 0.92));
  const bannerBottomRadius = 28;
  /** Search row sits above the carousel; only the gradient block swipes horizontally. */
  const searchBlockHeight = insets.top + 8 + 56 + 16;
  const carouselHeight = Math.max(0, bannerHeight - searchBlockHeight);

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
      submitSearchAndGoToShop(text);
      router.replace('/(tabs)/shop');
      closeSearch();
    }
  });
  useSpeechRecognitionEvent('error', (event) => {
    setListening(false);
    voiceResultRef.current = null;
    const err = String(event.error || '');
    if (err !== 'aborted' && err !== 'no-speech') {
      toast('Voice recognition failed. Please try again.', 'error');
    }
  });

  const loadData = async () => {
    try {
      setLoading(true);
      await Promise.all([loadFeaturedProducts(), loadCategories()]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useFocusEffect(
    useCallback(() => {
      setActiveCategorySlug(null);
    }, [])
  );

  const handleScanPlant = useCallback(async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      showAlert('Camera permission', 'Please allow camera access to scan plants.');
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
  }, []);

  const identifyAndSearch = async (uri: string) => {
    setScanning(true);
    try {
      const data = await identifyPlant(uri);
      const name =
        data.bestMatch ||
        data.results?.[0]?.species?.scientificName ||
        data.results?.[0]?.species?.commonNames?.[0];
      if (name) {
        submitSearchAndGoToShop(name);
        router.replace('/(tabs)/shop');
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

  const handleVoiceSearch = useCallback(async () => {
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

  const loadFeaturedProducts = async () => {
    try {
      const response = await apiFetch('/products/featured');
      if (response.ok) {
        const data = await response.json();
        setFeaturedProducts(data.data);
      }
    } catch (error) {
      console.error('Error loading featured products:', error);
    }
  };

  const loadCategories = async () => {
    try {
      const response = await apiFetch('/categories');
      if (response.ok) {
        const data = await response.json();
        setCategories(Array.isArray(data) ? data.slice(0, 8) : []);
      }
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const onBannerScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const x = e.nativeEvent.contentOffset.x;
    const i = Math.round(x / Math.max(bannerWidth, 1));
    setBannerIndex(Math.max(0, Math.min(BANNERS.length - 1, i)));
  };

  const activeColors = BANNERS[bannerIndex]?.colors ?? BANNERS[0].colors;

  const renderBanner = ({ item }: { item: Banner }) => (
    <View style={{ width: bannerWidth, height: carouselHeight }}>
      <LinearGradient
        colors={[...item.colors]}
        locations={[0, 0.22, 0.52, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={{
          flex: 1,
          paddingTop: 12,
          paddingBottom: 44,
          paddingHorizontal: 20,
        }}>
        <Animated.View entering={FadeInUp.delay(80).duration(400)} style={{ maxWidth: bannerWidth - 40 }}>
          <Text   style={{ color: '#064e3b' }} className="text-[30px] font-extrabold text-white mb-1 leading-9 tracking-tight">
            {item.headline}
          </Text>
          <Text className="text-[30px] font-extrabold mb-3 leading-9 tracking-tight">
            <Text style={{ color: '#065f46', textShadowColor: 'rgba(0,0,0,0.2)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 3 }}>
              {item.highlight}
            </Text>
          </Text>
          <Text className="text-[14px] mb-6 leading-5 pr-2" style={{ color: 'rgba(255,255,255,0.92)' }}>
            {item.sub}
          </Text>
          <TouchableOpacity
            className="flex-row items-center self-start bg-white/95 py-3.5 px-6 rounded-2xl gap-2 active:opacity-90"
            style={{
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.12,
              shadowRadius: 8,
              elevation: 4,
            }}
            onPress={() => router.push('/(tabs)/shop')}>
            <Text className="text-base font-bold" style={{ color: UI.color.primaryDark }}>
              {item.cta}
            </Text>
            <MaterialIcons name="arrow-forward" size={20} color={UI.color.primaryDark} />
          </TouchableOpacity>
        </Animated.View>
      </LinearGradient>
    </View>
  );

  return (
    <View className="flex-1" style={{ backgroundColor: UI.color.canvasAlt }}>
      <View
        pointerEvents="none"
        className="absolute top-0 left-0 right-0 z-10"
        // style={{ height: insets.top, backgroundColor: activeColors[0]}}
      />
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInDown.duration(380)} className="mb-1">
          <View
            style={{
              height: bannerHeight,
              borderBottomLeftRadius: bannerBottomRadius,
              borderBottomRightRadius: bannerBottomRadius,
              overflow: 'hidden',
              backgroundColor: activeColors[0],
            }}>
            <View
              className="px-5 z-[2]"
              style={{
                paddingTop: insets.top + 8,
                paddingBottom: 26,
                backgroundColor: activeColors[0],
              }}>
              <View
                className="flex-row items-center rounded-2xl px-3 h-14 border border-white/25"
                style={{ backgroundColor: 'rgba(255,255,255,0.96)' }}>
                <TouchableOpacity
                  className="flex-1 flex-row items-center"
                  onPress={() => openSearch()}
                  activeOpacity={0.85}>
                  <MaterialIcons name="search" size={UI.icon.md} color={UI.color.primary} />
                  <Text className="ml-2 text-base text-gray-500 flex-1">Search for plants...</Text>
                </TouchableOpacity>
                <View className="flex-row items-center border-l border-gray-200 pl-2 ml-1">
                  <TouchableOpacity onPress={handleScanPlant} disabled={scanning} className="p-2 rounded-full">
                    {scanning ? (
                      <ActivityIndicator size="small" color={UI.color.primary} />
                    ) : (
                      <MaterialIcons name="photo-camera" size={UI.icon.md} color={UI.color.primaryDark} />
                    )}
                  </TouchableOpacity>
                  <TouchableOpacity onPress={handleVoiceSearch} disabled={scanning} className="p-2 rounded-full">
                    <MaterialIcons
                      name="mic"
                      size={UI.icon.md}
                      color={listening ? '#fecaca' : UI.color.primaryDark}
                    />
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            <View style={{ height: carouselHeight, position: 'relative' }}>
              <FlatList
                data={BANNERS}
                keyExtractor={(b) => b.key}
                renderItem={renderBanner}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onMomentumScrollEnd={onBannerScrollEnd}
                nestedScrollEnabled
                decelerationRate="fast"
                snapToInterval={bannerWidth}
                snapToAlignment="start"
                disableIntervalMomentum
                style={{ height: carouselHeight }}
                getItemLayout={(_, index) => ({
                  length: bannerWidth,
                  offset: bannerWidth * index,
                  index,
                })}
              />
              <View
                pointerEvents="none"
                style={{
                  position: 'absolute',
                  bottom:8,
                  left: 0,
                  right: 0,
                  flexDirection: 'row',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: 8,
                }}>
                {BANNERS.map((_, i) => {
                  const on = i === bannerIndex;
                  return (
                    <View
                      key={i}
                      style={{
                        height: 7,
                        width: on ? 22 : 7,
                        borderRadius: 999,
                        backgroundColor: on ? '#FFFFFF' : 'rgba(255,255,255,0.42)',
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 1 },
                        shadowOpacity: on ? 0.25 : 0.15,
                        shadowRadius: 3,
                        elevation: on ? 3 : 1,
                      }}
                    />
                  );
                })}
              </View>
            </View>
          </View>
        </Animated.View>

        {categories.length > 0 && (
          <View className="mt-5 px-4">
            <View className="flex-row justify-between items-center mb-2">
              <Text className="text-lg font-bold text-emerald-950">Shop by category</Text>
              <TouchableOpacity onPress={() => router.push('/(tabs)/shop')} hitSlop={8}>
                <Text className="text-sm font-semibold" style={{ color: UI.color.primary }}>
                  See all
                </Text>
              </TouchableOpacity>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              className="mt-1"
              contentContainerStyle={{ gap: 8, paddingRight: 8 }}>
              <TouchableOpacity
                onPress={() => {
                  setActiveCategorySlug(null);
                  router.push('/(tabs)/shop');
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
                    onPress={() => {
                      setActiveCategorySlug(cat.slug);
                      router.push(`/category/${cat.slug}`);
                    }}
                    className={`pb-2 px-1 ${active ? 'border-b-2 border-emerald-800' : ''}`}>
                    <Text
                      className={`text-sm font-semibold ${active ? 'text-emerald-950' : 'text-gray-500'}`}
                      numberOfLines={1}>
                      {cat.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}

        <View className="mt-6 px-4 pb-10">
          <View className="flex-row justify-between items-center mb-3">
            <Text className="text-lg font-bold text-gray-900">Featured plants</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/shop')}>
              <Text className="text-sm font-semibold" style={{ color: UI.color.primary }}>
                See all
              </Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
              {[0, 1, 2].map((i) => (
                <View key={i} style={{ width: Math.min(176, windowWidth * 0.46) }}>
                  <ProductCardSkeleton />
                </View>
              ))}
            </ScrollView>
          ) : Array.isArray(featuredProducts) && featuredProducts.length > 0 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingRight: 8 }}>
              {featuredProducts.map((product, index) => (
                <View key={product.id} style={{ width: Math.min(176, windowWidth * 0.46), marginRight: 12 }}>
                  <ProductCard
                    product={product}
                    onPress={() =>
                      router.push({
                        pathname: '/product/[id]',
                        params: { id: product.slug.toString() },
                      })
                    }
                    index={index}
                  />
                </View>
              ))}
            </ScrollView>
          ) : (
            <View className="py-8 items-center rounded-2xl bg-white border border-gray-100">
              <MaterialIcons name="inventory-2" size={40} color="#D1D5DB" />
              <Text className="text-sm text-gray-500 mt-2">No featured products yet</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
