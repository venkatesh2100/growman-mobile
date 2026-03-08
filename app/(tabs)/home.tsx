import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  TextInput,
} from "react-native";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import ProductCard from "../../components/ProductCard";
// import { apiFetch, searchProducts } from '../../lib/api';
import { apiFetch, searchProducts } from "../../lib/api";
import { Product } from "../../lib/types";

const { width } = Dimensions.get("window");

interface Category {
  id: number;
  name: string;
  slug: string;
  imageUrl?: string;
}

type SortBy = 'name' | 'price' | 'newest';

export default function HomeScreen() {
  const router = useRouter();
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<SortBy>('newest');
  useEffect(() => {
    loadData();
  }, []);
   const loadProducts = async () => {
    try {
      setLoading(true);
      const response = await apiFetch('/products?page=1&pageSize=50');
      if (response.ok) {
        const data = await response.json();
        const productsList = Array.isArray(data) ? data : data.data || [];
        setProducts(sortProducts(productsList));
      }
    } catch (error) {
      console.error('Error loading products:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      await Promise.all([loadFeaturedProducts(), loadCategories()]);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery.trim()) {
        handleSearch(searchQuery);
      } else {
        loadProducts();
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

    const handleSearch = async (query: string) => {
    if (!query.trim()) {
      loadProducts();
      return;
    }

    try {
      setSearching(true);
      const result = await searchProducts(query);
      setProducts(sortProducts(result.data));
    } catch (error) {
      console.error('Error searching products:', error);
    } finally {
      setSearching(false);
    }
  };

   const sortProducts = (productsList: Product[]): Product[] => {
    const sorted = [...productsList];
    switch (sortBy) {
      case 'name':
        return sorted.sort((a, b) => a.name.localeCompare(b.name));
      case 'price':
        return sorted.sort((a, b) => a.price - b.price);
      case 'newest':
      default:
        return sorted;
    }
  };

  const handleSortChange = (newSort: SortBy) => {
    setSortBy(newSort);
    setProducts(sortProducts(products));
    setShowFilters(false);
  };
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
        className="w-[100px] items-center bg-white rounded-2xl p-4 mr-3 shadow-md"
        onPress={() => router.push(`/category/${category.slug}`)}
      >
        <View className="w-14 h-14 rounded-full bg-green-100 justify-center items-center mb-2">
          <MaterialIcons name="local-florist" size={32} color="#059669" />
        </View>
        <Text
          className="text-[13px] font-semibold text-gray-900 text-center"
          numberOfLines={1}
        >
          {category.name}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );

  return (
    <ScrollView
      className="flex-1 bg-gray-50"
      showsVerticalScrollIndicator={false}
    >
      <View className="flex-row p-4 bg-green-600 pt-[60px]   gap-3">
        <View className="flex-1 flex-row items-center bg-gray-100 rounded-xl px-4 h-12">
          <MaterialIcons
            name="search"
            size={22}
            color="#6B7280"
            className="mr-3"
          />
          <TextInput
            className="flex-1 text-base text-gray-900"
            placeholder="Search for plants..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#9CA3AF"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <MaterialIcons name="close" size={22} color="#6B7280" />
            </TouchableOpacity>
          )}
        </View>
      </View>
      {/* Hero Section */}
      <Animated.View
        entering={FadeInUp.duration(500)}
        className="bg-green-600 pt-[40px] pb-10 px-5 rounded-b-[30px]"
      >
        <View style={{ maxWidth: width - 40 }}>
          <Text className="text-[36px] font-bold text- mb-4 leading-[44px]">
            Bring Nature{"\n"}Into Your{" "}
            <Text className="text-green-100">Home</Text>
          </Text>
          <Text className="text-base text-green- mb-6 leading-6">
            Discover the perfect plants to transform your space. Our collection
            of hand-picked greenery will breathe life into your home.
          </Text>
          <TouchableOpacity
            className="flex-row items-center justify-center bg-white py-3.5 px-6 rounded-[30px] gap-2"
            onPress={() => router.push("/(tabs)/shop")}
          >
            <Text className="text-base font-semibold text-green-600">
              Shop Plants
            </Text>
            <MaterialIcons name="arrow-forward" size={20} color="#059669" />
          </TouchableOpacity>
        </View>
      </Animated.View>

      {/* Categories Section */}
      {categories.length > 0 && (
        <View className="mt-8 px-4">
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
      <View className="mt-8 px-4">
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
          <View className="py-10 items-center">
            <ActivityIndicator size="large" color="#059669" />
          </View>
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
  );
}
