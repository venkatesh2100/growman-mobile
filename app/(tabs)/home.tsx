import { MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import * as Linking from 'expo-linking';
import { useFocusEffect, useRouter } from 'expo-router';
import {
  ExpoSpeechRecognitionModule,
  useSpeechRecognitionEvent,
} from 'expo-speech-recognition';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  NativeScrollEvent,
  NativeSyntheticEvent,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { showAlert, showConfirm } from '../../components/Alert';
import DeliveryLocationRow from '../../components/DeliveryLocationRow';
import ProductCard from '../../components/ProductCard';
import { ProductCardSkeleton } from '../../components/skeletons/ProductCardSkeleton';
import StoreLocatorMap from '../../components/StoreLocatorMap';
import { toast } from '../../components/Toast';
import { apiFetch, identifyPlant } from '../../lib/api';
import { openChatbot } from '../../lib/chatbotOpener';
import { Product } from '../../lib/types';
import { UI } from '../../lib/ui';
import { useLocationPrompt } from '../../lib/useLocationPrompt';
import { useAuthStore } from '../../store/authStore';
import { useCartStore } from '../../store/cartStore';
import { useSearchStore } from '../../store/searchStore';
import { getFirstName, useUserStore } from '../../store/userStore';

interface Category {
  id: number;
  name: string;
  slug: string;
  imageUrl?: string;
}

type Banner = {
  key: string;
  eyebrow: string;
  headline: string;
  highlight: string;
  sub: string;
  cta: string;
  /** Top → bottom: light (status / dark icons) → deep accent (headline area). */
  colors: readonly [string, string, string, string];
  ink: string;
};

const BANNERS: Banner[] = [
  {
    key: 'nature',
    eyebrow: 'Indoor plants',
    headline: 'Bring Nature',
    highlight: 'Home',
    sub: 'Hand-picked plants, delivered with care.',
    cta: 'Shop plants',
    colors: ['#ecfdf5', '#6ee7b7', '#059669', '#064e3b'],
    ink: '#064e3b',
  },
  {
    key: 'fresh',
    eyebrow: 'New this week',
    headline: 'Fresh',
    highlight: 'Greenery',
    sub: 'New arrivals every week. Indoor & outdoor favourites.',
    cta: 'Explore new',
    colors: ['#f0fdf4', '#86efac', '#16a34a', '#14532d'],
    ink: '#14532d',
  },
  {
    key: 'care',
    eyebrow: 'Beginner friendly',
    headline: 'Care',
    highlight: 'Made Easy',
    sub: 'Low-maintenance picks, pots, and expert tips.',
    cta: 'Easy-care picks',
    colors: ['#f0fdfa', '#5eead4', '#0d9488', '#134e4a'],
    ink: '#134e4a',
  },
  {
    key: 'deal',
    eyebrow: 'Limited time',
    headline: 'Deals',
    highlight: 'You’ll Love',
    sub: 'Great prices on bundles and bestsellers.',
    cta: 'View offers',
    colors: ['#f7fee7', '#d9f99d', '#65a30d', '#3f6212'],
    ink: '#3f6212',
  },
];

const CARE_TIPS: { icon: React.ComponentProps<typeof MaterialIcons>['name']; tip: string }[] = [
  { icon: 'opacity', tip: 'Check soil moisture before watering — most indoor plants prefer to dry out slightly between waterings.' },
  { icon: 'wb-sunny', tip: 'Rotate your plants a quarter turn every week so all sides get even light.' },
  { icon: 'spa', tip: 'Wipe dust off leaves monthly so your plant can photosynthesise efficiently.' },
  { icon: 'local-florist', tip: 'Yellowing lower leaves are usually normal ageing, not a sign of trouble.' },
];

function dayOfYear() {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const diff = now.getTime() - start.getTime();
  return Math.floor(diff / 86400000);
}

function greetingForHour(hour: number) {
  if (hour < 5) return 'Good night';
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  if (hour < 21) return 'Good evening';
  return 'Good night';
}

export default function HomeScreen() {
  const { width: windowWidth } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const openSearch = useSearchStore((s) => s.openSearch);
  const submitSearchAndGoToShop = useSearchStore((s) => s.submitSearchAndGoToShop);
  const closeSearch = useSearchStore((s) => s.closeSearch);
  const cartCount = useCartStore((s) => s.getTotalQuantity());
  const token = useAuthStore((s) => s.token);
  const user = useUserStore((s) => s.user);
  const getLocationLabel = useUserStore((s) => s.getLocationLabel);
  const detectAndSaveLocation = useUserStore((s) => s.detectAndSaveLocation);

  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [listening, setListening] = useState(false);
  const [bannerIndex, setBannerIndex] = useState(0);
  const [activeCategorySlug, setActiveCategorySlug] = useState<string | null>(null);
  const [locating, setLocating] = useState(false);
  const voiceResultRef = useRef<string | null>(null);

  useLocationPrompt(true);

  const displayName = token && user?.name?.trim() ? getFirstName(user.name) : 'Growman';
  const locationLabel = getLocationLabel();

  const handleLocationPress = () => {
    if (token) {
      router.push('/saved-addresses');
      return;
    }
    setLocating(true);
    void detectAndSaveLocation()
      .then((addr) => {
        if (addr) toast('Location updated', 'success');
      })
      .catch(() => toast('Could not detect location', 'error'))
      .finally(() => setLocating(false));
  };

  const bannerWidth = windowWidth;
  const bannerBottomRadius = 24;
  const dotsRowHeight = 22;
  const carouselHeight = Math.max(160, Math.min(200, Math.round(windowWidth * 0.44)));
  const carouselCompact = carouselHeight < 210;

  const greeting = useMemo(() => greetingForHour(new Date().getHours()), []);
  const careTip = useMemo(() => CARE_TIPS[dayOfYear() % CARE_TIPS.length], []);

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

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([loadFeaturedProducts(), loadCategories()]);
    } finally {
      setRefreshing(false);
    }
  }, []);

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
    <View style={{ width: bannerWidth, height: carouselHeight, overflow: 'hidden' }}>
      <LinearGradient
        colors={[...item.colors]}
        locations={[0, 0.22, 0.52, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={{
          flex: 1,
          paddingTop: carouselCompact ? 4 : 8,
          paddingBottom: carouselCompact ? 8 : 12,
          paddingHorizontal: 20,
          overflow: 'hidden',
        }}>
        <Image
          source={require('../../assets/images/icon-transparent.png')}
          style={{
            position: 'absolute',
            right: carouselCompact ? -18 : -12,
            bottom: carouselCompact ? -28 : -20,
            width: carouselCompact ? 148 : 168,
            height: carouselCompact ? 148 : 168,
            opacity: 0.22,
            transform: [{ rotate: '-12deg' }],
          }}
          resizeMode="contain"
          accessibilityElementsHidden
          importantForAccessibility="no"
        />
        <Animated.View
          entering={FadeInUp.delay(80).duration(400)}
          style={{ flex: 1, maxWidth: bannerWidth - 72, justifyContent: 'space-between' }}>
          <View>
            <View
              className="self-start px-2 py-0.5 rounded-full mb-1.5"
              style={{ backgroundColor: 'rgba(255,255,255,0.55)' }}>
              <Text
                className="text-[10px] font-bold tracking-wider uppercase"
                style={{ color: item.ink }}>
                {item.eyebrow}
              </Text>
            </View>
            <Text
              className={`${carouselCompact ? 'text-[22px] leading-7' : 'text-[26px] leading-8'} mb-0`}
              style={{ color: item.ink, fontFamily: UI.font.displayBlack }}>
              {item.headline}
            </Text>
            <Text
              className={`${carouselCompact ? 'text-[22px] leading-7 mb-1' : 'text-[26px] leading-8 mb-1.5'}`}
              style={{
                color: item.ink,
                fontFamily: UI.font.displayBoldItalic,
                textShadowColor: 'rgba(0,0,0,0.14)',
                textShadowOffset: { width: 0, height: 1 },
                textShadowRadius: 3,
              }}>
              {item.highlight}
            </Text>
            <Text
              className={`${carouselCompact ? 'text-[12px] leading-4' : 'text-[13px] leading-[18px]'} pr-2`}
              style={{ color: 'rgba(255,255,255,0.94)' }}
              numberOfLines={2}>
              {item.sub}
            </Text>
          </View>
          <TouchableOpacity
            className={`flex-row items-center self-start bg-white/95 rounded-xl gap-1.5 active:opacity-90 ${carouselCompact ? 'py-2 px-4 mt-2' : 'py-2.5 px-5 mt-3'}`}
            style={{
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.12,
              shadowRadius: 8,
              elevation: 4,
            }}
            onPress={() => router.push('/(tabs)/shop')}>
            <Text className={`${carouselCompact ? 'text-xs' : 'text-sm'} font-bold`} style={{ color: UI.color.primaryDark }}>
              {item.cta}
            </Text>
            <MaterialIcons name="arrow-forward" size={carouselCompact ? 16 : 18} color={UI.color.primaryDark} />
          </TouchableOpacity>
        </Animated.View>
      </LinearGradient>
    </View>
  );

  const quickActions: {
    icon: React.ComponentProps<typeof MaterialIcons>['name'];
    label: string;
    onPress: () => void;
    tint: 'primary' | 'accent';
  }[] = [
    { icon: 'center-focus-weak', label: 'Scan plant', onPress: handleScanPlant, tint: 'accent' },
    { icon: 'receipt-long', label: 'My orders', onPress: () => router.push('/orders'), tint: 'primary' },
    { icon: 'favorite-border', label: 'Wishlist', onPress: () => router.push('/wishlist'), tint: 'primary' },
    {
      icon: 'auto-awesome',
      label: 'Ask Dootha',
      onPress: () => openChatbot('Hi Dootha, I need plant care advice.'),
      tint: 'accent',
    },
  ];

  return (
    <View className="flex-1" style={{ backgroundColor: UI.color.canvasAlt }}>
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 28 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={UI.color.primary} />
        }>
        <Animated.View entering={FadeInDown.duration(380)} className="mb-1">
          <View
            style={{
              borderBottomLeftRadius: bannerBottomRadius,
              borderBottomRightRadius: bannerBottomRadius,
              overflow: 'hidden',
              backgroundColor: activeColors[0],
            }}>
            <View
              className="px-5 z-[2]"
              style={{
                paddingTop: insets.top + 10,
                paddingBottom: 14,
                backgroundColor: activeColors[0],
              }}>
              {/* Brand row */}
              <View className="flex-row items-center justify-between mb-2">
                <View className="flex-row items-center gap-1.5 flex-1 mr-2">
                  <Image
                    source={require('../../assets/images/icon-transparent.png')}
                    className="w-10 h-10"
                    resizeMode="contain"
                    accessibilityLabel="Growman logo"
                  />
                  <View className="flex-1">
                    <Text className="text-[11px] leading-3" style={{ color: 'rgba(6,78,59,0.65)' }}>
                      {greeting}
                    </Text>
                    <Text
                      className="text-[16px] leading-4"
                      style={{ color: '#064e3b', fontFamily: UI.font.displayBold }}
                      numberOfLines={1}>
                      {displayName}
                    </Text>
                    <DeliveryLocationRow
                      label={locationLabel}
                      loading={locating}
                      ink="#064e3b"
                      onPress={handleLocationPress}
                    />
                  </View>
                </View>
                <View className="flex-row items-center gap-2">
                  <TouchableOpacity
                    onPress={() => router.push('/notifications')}
                    className="w-9 h-9 rounded-full items-center justify-center"
                    style={{ backgroundColor: 'rgba(255,255,255,0.55)' }}
                    accessibilityLabel="Notifications">
                    <MaterialIcons name="notifications-none" size={19} color="#064e3b" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => router.push('/(tabs)/cart')}
                    className="w-9 h-9 rounded-full items-center justify-center"
                    style={{ backgroundColor: 'rgba(255,255,255,0.55)' }}
                    accessibilityLabel="Cart">
                    <MaterialIcons name="shopping-bag" size={18} color="#064e3b" />
                    {cartCount > 0 && (
                      <View
                        className="absolute -top-1 -right-1 rounded-full items-center justify-center px-1"
                        style={{ backgroundColor: UI.color.accent, minWidth: 16, height: 16 }}>
                        <Text className="text-white text-[9px] font-bold">
                          {cartCount > 9 ? '9+' : cartCount}
                        </Text>
                      </View>
                    )}
                  </TouchableOpacity>
                </View>
              </View>

              {/* Search row */}
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
                      color={listening ? '#dc2626' : UI.color.primaryDark}
                    />
                  </TouchableOpacity>
                </View>
              </View>
            </View>

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
              style={{ height: carouselHeight, overflow: 'hidden' }}
              getItemLayout={(_, index) => ({
                length: bannerWidth,
                offset: bannerWidth * index,
                index,
              })}
            />
            <View
              pointerEvents="none"
              style={{
                height: dotsRowHeight,
                flexDirection: 'row',
                justifyContent: 'center',
                alignItems: 'center',
                gap: 8,
                backgroundColor: activeColors[3],
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
        </Animated.View>

        {/* Quick actions */}
        <View className="px-4 mt-5">
          <View className="flex-row justify-between">
            {quickActions.map((action) => {
              const isDootha = action.label === 'Ask Dootha';
              const color = action.tint === 'accent' ? UI.color.accent : UI.color.primary;
              return (
                <TouchableOpacity
                  key={action.label}
                  onPress={action.onPress}
                  activeOpacity={0.75}
                  className="items-center"
                  style={{ width: '23%' }}>
                  <View
                    className="w-14 h-14 rounded-full items-center justify-center mb-1.5"
                    style={{
                      backgroundColor: UI.color.surface,
                      borderWidth: 1.5,
                      borderColor: color,
                    }}>
                    <MaterialIcons name={action.icon} size={22} color={color} />
                    {isDootha && (
                      <View
                        className="absolute rounded-full"
                        style={{
                          top: -1,
                          right: -1,
                          width: 10,
                          height: 10,
                          backgroundColor: UI.color.accent,
                          borderWidth: 2,
                          borderColor: UI.color.surface,
                        }}
                      />
                    )}
                  </View>
                  <Text
                    className="text-[11px] font-semibold text-center"
                    style={{ color: UI.color.ink }}
                    numberOfLines={1}>
                    {action.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Categories */}
        {/* {(loading || categories.length > 0) && (
          <View className="mt-6 px-4">
            <View className="flex-row justify-between items-center mb-3">
              <Text className="text-xl" style={{ color: UI.color.ink, fontFamily: UI.font.display }}>
                Shop by category
              </Text>
              <TouchableOpacity onPress={() => router.push('/(tabs)/shop')} hitSlop={8}>
                <Text className="text-sm font-semibold" style={{ color: UI.color.primary }}>
                  See all
                </Text>
              </TouchableOpacity>
            </View>
            {loading ? (
              <View className="flex-row gap-3">
                {[0, 1, 2, 3].map((i) => (
                  <View key={i} className="items-center" style={{ width: 68 }}>
                    <View className="w-16 h-16 rounded-2xl bg-gray-200" />
                  </View>
                ))}
              </View>
            ) : (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 14, paddingRight: 8 }}>
                <TouchableOpacity
                  onPress={() => {
                    setActiveCategorySlug(null);
                    router.push('/(tabs)/shop');
                  }}
                  activeOpacity={0.8}
                  className="items-center"
                  style={{ width: 68 }}>
                  <View
                    className="w-16 h-16 rounded-2xl items-center justify-center mb-1.5"
                    style={{
                      backgroundColor: activeCategorySlug === null ? UI.color.primary : UI.color.surface,
                      borderWidth: activeCategorySlug === null ? 0 : 1,
                      borderColor: UI.color.border,
                    }}>
                    <MaterialIcons
                      name="apps"
                      size={24}
                      color={activeCategorySlug === null ? '#FFFFFF' : UI.color.primary}
                    />
                  </View>
                  <Text
                    className="text-xs font-semibold text-center"
                    style={{ color: UI.color.ink }}
                    numberOfLines={1}>
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
                      activeOpacity={0.8}
                      className="items-center"
                      style={{ width: 68 }}>
                      <View
                        className="w-16 h-16 rounded-2xl items-center justify-center mb-1.5 overflow-hidden"
                        style={{
                          backgroundColor: active ? UI.color.primary : UI.color.surface,
                          borderWidth: active ? 0 : 1,
                          borderColor: UI.color.border,
                        }}>
                        <MaterialIcons
                          name="local-florist"
                          size={24}
                          color={active ? '#FFFFFF' : UI.color.primary}
                        />
                      </View>
                      <Text
                        className="text-xs font-semibold text-center"
                        style={{ color: active ? UI.color.ink : '#6B7280' }}
                        numberOfLines={1}>
                        {cat.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            )}
          </View>
        )} */}

        {/* Featured plants */}
        <View className="mt-7 px-4">
          <View className="flex-row justify-between items-center mb-3">
            <View>
              <Text className="text-xl" style={{ color: UI.color.ink, fontFamily: UI.font.display }}>
                Featured plants
              </Text>
              <Text className="text-xs" style={{ color: UI.color.muted }}>
                Curated picks, in season
              </Text>
            </View>
            <TouchableOpacity onPress={() => router.push('/(tabs)/shop')} hitSlop={8}>
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
            <View
              className="py-10 items-center rounded-2xl bg-white"
              style={{ borderWidth: 1, borderColor: UI.color.border }}>
              <MaterialIcons name="inventory-2" size={40} color="#D1D5DB" />
              <Text className="text-sm mt-2" style={{ color: UI.color.muted }}>
                No featured products yet
              </Text>
            </View>
          )}
        </View>

        {/* Care tip of the day */}
        <View className="mt-7 px-4">
          <View
            className="flex-row items-center rounded-2xl p-4"
            style={{ backgroundColor: UI.color.primaryLight }}>
            <View
              className="w-11 h-11 rounded-full items-center justify-center mr-3"
              style={{ backgroundColor: UI.color.surface }}>
              <MaterialIcons name={careTip.icon} size={22} color={UI.color.primary} />
            </View>
            <View className="flex-1">
              <Text className="text-[11px] font-bold uppercase tracking-wider mb-0.5" style={{ color: UI.color.primaryDark }}>
                Care tip of the day
              </Text>
              <Text
                className="text-[13.5px] leading-5"
                style={{ color: UI.color.ink, fontFamily: UI.font.displayItalic }}>
                {careTip.tip}
              </Text>
            </View>
          </View>
        </View>

        {/* Trust strip */}
        <View className="mt-7 px-4 flex-row gap-3">
          {[
            // { icon: 'local-shipping' as const, title: 'Free delivery', sub: 'On every order' },
            // { icon: 'verified' as const, title: 'Plant health', sub: 'Quality checked' },
            // { icon: 'auto-awesome' as const, title: 'Expert care', sub: 'Ask Dootha AI' },
          ].map((item) => (
            <View
              key={item.title}
              className="flex-1 items-center rounded-2xl bg-white px-2 py-4"
              style={{ borderWidth: 1, borderColor: UI.color.border }}>
              <MaterialIcons name={item.icon} size={20} color={UI.color.primary} />
              <Text className="text-[12px] font-semibold mt-1.5 text-center" style={{ color: UI.color.ink }}>
                {item.title}
              </Text>
              <Text className="text-[10px] mt-0.5 text-center" style={{ color: UI.color.muted }}>
                {item.sub}
              </Text>
            </View>
          ))}
        </View>

        <StoreLocatorMap />

        {/* Footer — closes the page on a quiet, signed note */}
        <View className="mt-10 mx-4 mb-2 items-center rounded-3xl overflow-hidden">
          <LinearGradient
            colors={['#f0fdf4', '#dcfce7']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ width: '100%', alignItems: 'center', paddingVertical: 32, paddingHorizontal: 24 }}>
            {/* <Image
              source={require('../../assets/images/icon.png')}
              className="w-12 rounded-md h-12 mb-4"
              resizeMode="contain"
              accessibilityLabel="Growman logo"
            /> */}
            <Text
              className="text-[28px]"
              style={{ color: UI.color.ink, fontFamily: UI.font.displayBoldItalic }}>
              #Growman
            </Text>
            <Text
              className="text-[13px] mt-1.5 text-center"
              style={{ color: UI.color.primaryDark, fontFamily: UI.font.displayItalic }}>
              Rooted in care, grown for you.
            </Text>

            {/* <View className="flex-row items-center gap-3 mt-6">
              {(['instagram', 'twitter', 'facebook'] as const).map((platform) => (
                <View
                  key={platform}
                  className="w-8 h-8 rounded-full items-center justify-center"
                  style={{ backgroundColor: 'rgba(5,150,105,0.12)' }}>
                  <MaterialIcons
                    name={
                      platform === 'instagram'
                        ? 'camera-alt'
                        : platform === 'twitter'
                          ? 'alternate-email'
                          : 'facebook'
                    }
                    size={15}
                    color={UI.color.primaryDark}
                  />
                </View>
              ))}
            </View> */}

            <View className="w-10 h-px my-5" style={{ backgroundColor: 'rgba(5,150,105,0.25)' }} />

            <Text className="text-[11px]" style={{ color: UI.color.muted }}>
              Growman · v2.0 ·
            </Text>
          </LinearGradient>
        </View>
      </ScrollView>
    </View>
  );
}
