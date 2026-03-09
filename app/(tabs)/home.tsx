import { MaterialIcons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import * as Linking from "expo-linking";
import {
  ExpoSpeechRecognitionModule,
  useSpeechRecognitionEvent,
} from "expo-speech-recognition";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import Loading from "../../components/Loading";
import ProductCard from "../../components/ProductCard";
import { toast } from "../../components/Toast";
import { apiFetch, identifyPlant } from "../../lib/api";
import { Product } from "../../lib/types";
import { showAlert, showConfirm } from "../../components/Alert";
import { useSearchStore } from "../../store/searchStore";

const { width } = Dimensions.get("window");

interface Category {
  id: number;
  name: string;
  slug: string;
  imageUrl?: string;
}

export default function HomeScreen() {
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
  const voiceResultRef = useRef<string | null>(null);

  useSpeechRecognitionEvent("result", (event) => {
    const transcript = event.results[0]?.transcript?.trim();
    if (transcript && event.isFinal) {
      voiceResultRef.current = transcript;
    }
  });
  useSpeechRecognitionEvent("end", () => {
    setListening(false);
    const text = voiceResultRef.current;
    if (text) {
      voiceResultRef.current = null;
      submitSearchAndGoToShop(text);
      router.replace("/(tabs)/shop");
      closeSearch();
    }
  });
  useSpeechRecognitionEvent("error", (event) => {
    setListening(false);
    voiceResultRef.current = null;
    const err = String(event.error || "");
    if (err !== "aborted" && err !== "no-speech") {
      toast("Voice recognition failed. Please try again.", "error");
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

  const handleScanPlant = useCallback(async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      showAlert(
        "Camera permission",
        "Please allow camera access to scan plants."
      );
      return;
    }
    showConfirm("Scan plant", "Choose image source", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Camera",
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
        text: "Gallery",
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
        router.replace("/(tabs)/shop");
      } else {
        toast("Could not identify plant. Try a clearer photo.", "error");
      }
    } catch (err) {
      console.error("Plant identification error:", err);
      toast("Identification failed. Please try again.", "error");
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
      toast("Speech recognition is not available on this device.", "error");
      return;
    }
    // Request microphone first - this triggers the system permission dialog
    const micResult = await ExpoSpeechRecognitionModule.requestMicrophonePermissionsAsync();
    if (!micResult.granted) {
      showConfirm(
        "Microphone access required",
        "Voice search needs microphone access. Please enable it in Settings.",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Open Settings", onPress: () => Linking.openSettings() },
        ]
      );
      return;
    }
    // On iOS, also request speech recognition permission
    const speechResult = await ExpoSpeechRecognitionModule.requestSpeechRecognizerPermissionsAsync?.();
    if (speechResult && !speechResult.granted) {
      showConfirm(
        "Speech recognition required",
        "Voice search needs speech recognition. Please enable it in Settings.",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Open Settings", onPress: () => Linking.openSettings() },
        ]
      );
      return;
    }
    voiceResultRef.current = null;
    setListening(true);
    ExpoSpeechRecognitionModule.start({
      lang: "en-US",
      interimResults: true,
      continuous: false,
    });
  }, [listening]);

  const loadFeaturedProducts = async () => {
    try {
      const response = await apiFetch("/products/featured");
      if (response.ok) {
        const data = await response.json();
        // console.log(data);
        setFeaturedProducts(data.data);
        // console.log(featuredProducts);
      }
    } catch (error) {
      console.error("Error loading featured products:", error);
    }
  };

  const loadCategories = async () => {
    try {
      const response = await apiFetch("/categories");
      if (response.ok) {
        const data = await response.json();
        setCategories(Array.isArray(data) ? data.slice(0, 6) : []);
      }
    } catch (error) {
      console.error("Error loading categories:", error);
    }
  };

  const renderCategoryCard = (category: Category, index: number) => (
    <Animated.View
      key={category.id}
      entering={FadeInDown.delay(index * 100).duration(400)}
    >
      <TouchableOpacity
        className="w-[110px] items-center bg-white rounded-2xl p-5 mr-4 active:opacity-90"
        style={{
          shadowColor: "#059669",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.06,
          shadowRadius: 8,
          elevation: 3,
        }}
        onPress={() => router.push(`/category/${category.slug}`)}
      >
        <View
          className="w-16 h-16 rounded-2xl justify-center items-center mb-3"
          style={{ backgroundColor: "rgba(5, 150, 105, 0.08)" }}
        >
          <MaterialIcons name="local-florist" size={30} color="#059669" />
        </View>
        <Text
          className="text-[13px] font-semibold text-gray-800 text-center"
          numberOfLines={1}
        >
          {category.name.substring(0,5)}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );

  return (
    <View className="flex-1 bg-gray-50">
      {/* Fixed status bar overlay - matches gradient top so light status bar icons stay visible when scrolled */}
      <View
        style={{ height: insets.top, backgroundColor: "#065f46" }}
        className="absolute top-0 left-0 right-0 z-10"
        pointerEvents="none"
      />
      <ScrollView
        className="flex-1"
        style={{ backgroundColor: "transparent" }}
        contentContainerStyle={{ paddingTop: 0 }}
        showsVerticalScrollIndicator={false}
      >
      {/* Hero gradient block - extends to very top with smooth shading */}
      <LinearGradient
        colors={["#065f46", "#047857", "#059669", "#10b981"]}
        locations={[0, 0.3, 0.65, 1]}
        style={{ paddingTop: insets.top, paddingBottom: 32, paddingHorizontal: 20 }}
        className="pb-10 rounded-b-[32px] overflow-hidden"
      >
        {/* Search bar - frosted glass style */}
        <View className="flex-row gap-3 mb-6">
          <View
            className="flex-1 flex-row items-center rounded-2xl px-4 h-14"
            style={{
              backgroundColor: "rgba(255,255,255,0.95)",
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.08,
              shadowRadius: 12,
              elevation: 4,
            }}
          >
            <TouchableOpacity
              className="flex-1 flex-row items-center"
              onPress={() => openSearch()}
              activeOpacity={0.8}
            >
              <MaterialIcons name="search" size={22} color="#059669" />
              <Text className="ml-3 text-base text-gray-500 flex-1">
                Search for plants...
              </Text>
            </TouchableOpacity>
            <View className="flex-row items-center border-l border-gray-200 pl-3 ml-1">
              <TouchableOpacity
                onPress={handleScanPlant}
                disabled={scanning}
                className="p-2 rounded-full active:bg-gray-100"
              >
                {scanning ? (
                  <ActivityIndicator size="small" color="#059669" />
                ) : (
                  <MaterialIcons name="document-scanner" size={22} color="#059669" />
                )}
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleVoiceSearch}
                disabled={scanning}
                className="p-2 ml-1 rounded-full active:bg-gray-100"
              >
                <MaterialIcons
                  name="mic"
                  size={22}
                  color={listening ? "#DC2626" : "#059669"}
                />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Hero content */}
        <Animated.View entering={FadeInUp.duration(500)} style={{ maxWidth: width - 40 }}>
          <Text className="text-[34px] font-extrabold text-white mb-2 leading-[42px] tracking-tight">
            Bring Nature
          </Text>
          <Text className="text-[34px] font-extrabold mb-4 leading-[42px] tracking-tight">
            Into Your{" "}
            <Text style={{ color: "#d1fae5", textShadowColor: "rgba(0,0,0,0.15)", textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 4 }}>
              Home
            </Text>
          </Text>
          <Text className="text-[15px] mb-8 leading-6 max-w-[90%]" style={{ color: "rgba(255,255,255,0.92)" }}>
            Discover hand-picked plants to transform your space. Fresh greenery, delivered with care.
          </Text>
          <TouchableOpacity
            className="flex-row items-center justify-center bg-white py-4 px-8 rounded-2xl gap-2 active:opacity-90"
            style={{
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.15,
              shadowRadius: 8,
              elevation: 4,
            }}
            onPress={() => router.push("/(tabs)/shop")}
          >
            <Text className="text-base font-bold" style={{ color: "#047857" }}>Shop Plants</Text>
            <MaterialIcons name="arrow-forward" size={20} color="#047857" />
          </TouchableOpacity>
        </Animated.View>

        {/* Decorative circles for depth */}
        <View
          className="absolute rounded-full"
          style={{ top: 80, right: -40, width: 120, height: 120, backgroundColor: "rgba(255,255,255,0.1)" }}
        />
        <View
          className="absolute rounded-full"
          style={{ bottom: 60, left: -24, width: 80, height: 80, backgroundColor: "rgba(255,255,255,0.08)" }}
        />
      </LinearGradient>

      {/* Categories Section */}
      {categories.length > 0 && (
        <View className="mt-10 px-4">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-[22px] font-bold text-gray-900">
              Shop by Category
            </Text>
            <TouchableOpacity onPress={() => router.push("/(tabs)/shop")}>
              <Text className="text-sm text-green-600 font-semibold">
                See All
              </Text>
            </TouchableOpacity>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingRight: 16, gap: 12 }}
          >
            {categories.map((category, index) =>
              renderCategoryCard(category, index)
            )}
          </ScrollView>
        </View>
      )}

      {/* Featured Products */}
      <View className="mt-10 px-4 pb-8">
        <View className="flex-row justify-between items-center mb-4">
          <Text className="text-[22px] font-bold text-gray-900">
            Featured Plants
          </Text>
          <TouchableOpacity onPress={() => router.push("/(tabs)/shop")}>
            <Text className="text-sm text-green-600 font-semibold">
              See All
            </Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <Loading fullScreen={false} />
        ) : Array.isArray(featuredProducts) && featuredProducts.length > 0 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingRight: 16 }}
          >
            {featuredProducts.map((product, index) => (
              <View key={product.id} className="w-[180px] mr-3">
                <ProductCard
                  product={product}
                  onPress={() =>
                    router.push({
                      pathname: "/product/[id]",
                      params: { id: product.slug.toString() },
                    })
                  }
                  index={index}
                />
              </View>
            ))}
          </ScrollView>
        ) : (
          <View className="py-10 items-center">
            <MaterialIcons name="inventory-2" size={48} color="#D1D5DB" />
            <Text className="text-base text-gray-500 mt-3">
              No featured products available
            </Text>
          </View>
        )}
      </View>

      {/* Benefits Section */}
      {/* <Animated.View entering={FadeInUp.delay(300).duration(400)} className="bg-white mt-8 mx-4 mb-8 p-6 rounded-[20px] shadow-lg">
        <Text className="text-2xl font-bold text-gray-900 mb-2 text-center">Why Choose Growman</Text>
        <Text className="text-sm text-gray-500 mb-6 text-center">
          We're passionate about helping you create a greener, healthier living space
        </Text>

        <View className="gap-5">
          <View className="items-center">
            <View className="w-16 h-16 rounded-full bg-green-100 justify-center items-center mb-3">
              <MaterialIcons name="verified" size={28} color="#059669" />
            </View>
            <Text className="text-base font-bold text-gray-900 mb-1">Quality Guaranteed</Text>
            <Text className="text-[13px] text-gray-500 text-center">
              Each plant is carefully selected and nurtured
            </Text>
          </View>

          <View className="items-center">
            <View className="w-16 h-16 rounded-full bg-green-100 justify-center items-center mb-3">
              <MaterialIcons name="local-shipping" size={28} color="#059669" />
            </View>
            <Text className="text-base font-bold text-gray-900 mb-1">Nationwide Delivery</Text>
            <Text className="text-[13px] text-gray-500 text-center">
              We ship with care to anywhere in the country
            </Text>
          </View>

          <View className="items-center">
            <View className="w-16 h-16 rounded-full bg-green-100 justify-center items-center mb-3">
              <MaterialIcons name="support-agent" size={28} color="#059669" />
            </View>
            <Text className="text-base font-bold text-gray-900 mb-1">Expert Advice</Text>
            <Text className="text-[13px] text-gray-500 text-center">
              Our specialists are available to help you
            </Text>
          </View>
        </View>
      </Animated.View> */}
    </ScrollView>
    </View>
  );
}
