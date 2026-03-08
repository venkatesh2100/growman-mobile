import { MaterialIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    ScrollView,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import ProductCard from '../../components/ProductCard';
import { apiFetch } from '../../lib/api';
import { Product } from '../../lib/types';

interface Subcategory {
  id: number;
  name: string;
  slug: string;
}

export default function CategoryScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [products, setProducts] = useState<Product[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [categoryName, setCategoryName] = useState('');

  useEffect(() => {
    if (slug) {
      loadCategoryData();
    }
  }, [slug]);

  useEffect(() => {
    if (selectedSubcategory && slug) {
      loadSubcategoryProducts(selectedSubcategory);
    } else if (slug) {
      loadCategoryProducts();
    }
  }, [selectedSubcategory, slug]);

  const loadCategoryData = async () => {
    try {
      setLoading(true);
      await Promise.all([loadCategoryInfo(), loadSubcategories(), loadCategoryProducts()]);
    } finally {
      setLoading(false);
    }
  };

  const loadCategoryInfo = async () => {
    try {
      const response = await apiFetch(`/categories/${slug}`);
      if (response.ok) {
        const data = await response.json();
        setCategoryName(data.name || slug);
      }
    } catch (error) {
      console.error('Error loading category info:', error);
    }
  };

  const loadSubcategories = async () => {
    try {
      const response = await apiFetch(`/categories/${slug}/subcategories`);
      if (response.ok) {
        const data = await response.json();
        setSubcategories(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Error loading subcategories:', error);
    }
  };

  const loadCategoryProducts = async () => {
    try {
      const response = await apiFetch(`/categories/${slug}/products?page=1&pageSize=50`);
      if (response.ok) {
        const data = await response.json();
        setProducts(Array.isArray(data) ? data : data.data || []);
      }
    } catch (error) {
      console.error('Error loading category products:', error);
    }
  };

  const loadSubcategoryProducts = async (subSlug: string) => {
    try {
      setLoading(true);
      const response = await apiFetch(`/categories/${slug}/subcategories/${subSlug}/products?page=1&pageSize=50`);
      if (response.ok) {
        const data = await response.json();
        setProducts(Array.isArray(data) ? data : data.data || []);
      }
    } catch (error) {
      console.error('Error loading subcategory products:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderSubcategory = (subcategory: Subcategory, index: number) => (
    <Animated.View
      key={subcategory.id}
      entering={FadeInDown.delay(index * 50).duration(300)}>
      <TouchableOpacity
        className={`px-4 py-2 rounded-[20px] mr-2 ${selectedSubcategory === subcategory.slug ? 'bg-green-600' : 'bg-gray-100'}`}
        onPress={() =>
          setSelectedSubcategory(
            selectedSubcategory === subcategory.slug ? null : subcategory.slug
          )
        }>
        <Text className={`text-sm font-medium ${selectedSubcategory === subcategory.slug ? 'text-white' : 'text-gray-900'}`}>
          {subcategory.name}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );

  const renderProduct = ({ item, index }: { item: Product; index: number }) => (
    <View className="w-[48%]">
      <ProductCard
        product={item}
        onPress={() => router.push({ pathname: '/product/[id]', params: { id: item.id.toString() } })}
        index={index}
      />
    </View>
  );

  if (loading && products.length === 0) {
    return (
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" color="#059669" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50" style={{ paddingTop: insets.top }}>
      {/* Subcategories Filter */}
      {subcategories.length > 0 && (
        <View className="bg-white py-3 border-b border-gray-200">
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}>
            <TouchableOpacity
              className={`px-4 py-2 rounded-[20px] mr-2 ${selectedSubcategory === null ? 'bg-green-600' : 'bg-gray-100'}`}
              onPress={() => setSelectedSubcategory(null)}>
              <Text className={`text-sm font-medium ${selectedSubcategory === null ? 'text-white' : 'text-gray-900'}`}>
                All
              </Text>
            </TouchableOpacity>
            {subcategories.map((subcategory, index) => renderSubcategory(subcategory, index))}
          </ScrollView>
        </View>
      )}

      {/* Products Count */}
      {!loading && (
        <View className="px-4 py-3">
          <Text className="text-sm text-gray-500">
            {products.length} {products.length === 1 ? 'product' : 'products'} found
          </Text>
        </View>
      )}

      {/* Products List */}
      {products.length === 0 && !loading ? (
        <View className="flex-1 justify-center items-center p-8">
          <MaterialIcons name="inventory-2" size={64} color="#D1D5DB" />
          <Text className="text-xl font-semibold text-gray-900 mt-4">No products found</Text>
          <Text className="text-sm text-gray-500 mt-2 text-center">
            {selectedSubcategory
              ? 'Try selecting a different subcategory'
              : 'Check back later for new products'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={products}
          renderItem={renderProduct}
          keyExtractor={(item) => item.id.toString()}
          numColumns={2}
          contentContainerStyle={{ padding: 8 }}
          columnWrapperStyle={{ justifyContent: 'space-between', paddingHorizontal: 8 }}
          showsVerticalScrollIndicator={false}
          refreshing={loading}
          onRefresh={loadCategoryData}
        />
      )}
    </View>
  );
}


