import { MaterialIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { UI } from '../../lib/ui';
import { ProductDetailSkeleton } from '../../components/skeletons/ProductDetailSkeleton';
import AddToCart from '../../components/product/AddToCart';
import ImageGallery from '../../components/product/ImageGallery';
import ProductTabs from '../../components/product/ProductTabs';
import RelatedProducts from '../../components/product/RelatedProducts';
import SizeSelector from '../../components/product/SizeSelector';
import { toast } from '../../components/Toast';
import { apiFetch } from '../../lib/api';
import { Product, ProductSize } from '../../lib/types';
import { useAuthStore } from '../../store/authStore';

export default function ProductDetailScreen() {
  const { id, size } = useLocalSearchParams<{ id: string; size?: string }>();
  const insets = useSafeAreaInsets();
  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [loadingRelated, setLoadingRelated] = useState(false);
  const [selectedSize, setSelectedSize] = useState<ProductSize | null>(null);
  const [loading, setLoading] = useState(true);
  const [inWishlist, setInWishlist] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const { token } = useAuthStore();

  useEffect(() => {
    loadProduct();
  }, [id]);

  useEffect(() => {
    if (product && product.sizes.length > 0) {
      const sizeId = size ? parseInt(size) : product.sizes[0]?.id;
      const foundSize = product.sizes.find((s) => s.id === sizeId) || product.sizes[0];
      setSelectedSize(foundSize);
    }
  }, [product, size]);

  const handleSizeSelect = (newSize: ProductSize) => {
    setSelectedSize(newSize);
    // Update URL params if needed
    router.setParams({ size: String(newSize.id) });
  };

  useEffect(() => {
    if (product?.slug) {
      fetchRelatedProducts();
    }
  }, [product?.slug]);

  useEffect(() => {
    if (!token || !product?.id) {
      setInWishlist(false);
      return;
    }
    const productId = product.id;
    let cancelled = false;
    apiFetch('/wishlist')
      .then((res) => (res.ok ? res.json() : []))
      .then((list: Product[] | unknown) => {
        if (cancelled) return;
        const arr = Array.isArray(list) ? list : [];
        const ids = arr.map((p: Product) => p.id ?? (p as { ID?: number }).ID).filter(Boolean);
        setInWishlist(ids.includes(productId));
      })
      .catch(() => {
        if (!cancelled) setInWishlist(false);
      });
    return () => { cancelled = true; };
  }, [token, product?.id]);

  const toggleWishlist = async () => {
    if (!product) return;
    if (!token) {
      toast('Login to save to wishlist', 'info');
      return;
    }
    setWishlistLoading(true);
    try {
      if (inWishlist) {
        const res = await apiFetch(`/wishlist/${product.id}`, { method: 'DELETE' });
        if (res.ok) {
          setInWishlist(false);
          toast('Removed from wishlist', 'success');
        }
      } else {
        const res = await apiFetch('/wishlist', {
          method: 'POST',
          body: JSON.stringify({ productId: product.id }),
        });
        if (res.ok) {
          setInWishlist(true);
          toast('Added to wishlist', 'success');
        }
      }
    } catch (error) {
      toast('Something went wrong', 'error');
    } finally {
      setWishlistLoading(false);
    }
  };

  const loadProduct = async () => {
    try {
      setLoading(true);
      const response = await apiFetch(`/products/${id}`);
      if (response.ok) {
        const data = await response.json();
        setProduct(data);
      }
    } catch (error) {
      console.error('Error loading product:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRelatedProducts = async () => {
    if (!product?.slug) return;
    try {
      setLoadingRelated(true);
      const response = await apiFetch(`/products/${product.slug}/related`);
      if (response.ok) {
        const data = await response.json();
        const products = Array.isArray(data) ? data : data.products || [];
        setRelatedProducts(products);
      }
    } catch (error) {
      console.error('Error fetching related products:', error);
      setRelatedProducts([]);
    } finally {
      setLoadingRelated(false);
    }
  };

  if (loading) {
    return <ProductDetailSkeleton />;
  }
  if (!product) {
    return (
      <View
        className="flex-1 bg-gray-50 items-center justify-center px-6"
        style={{ paddingTop: insets.top }}>
        <MaterialIcons name="inventory-2" size={48} color="#D1D5DB" />
        <Text className="text-lg font-semibold text-gray-800 mt-4 text-center">Product not found</Text>
        <TouchableOpacity className="mt-6 px-6 py-3 rounded-xl bg-emerald-700" onPress={() => router.back()}>
          <Text className="text-white font-semibold">Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const avgRating =
    product.reviews.length > 0
      ? product.reviews.reduce((acc, review) => acc + review.rating, 0) /
        product.reviews.length
      : 4;

  return (
    <SafeAreaView
      className="flex-1"
      edges={['top']}
      style={{ backgroundColor: UI.color.canvas }}>
      <ScrollView
        className="flex-1"
        style={{ backgroundColor: UI.color.canvas }}
        contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
        showsVerticalScrollIndicator={false}>
      {/* Breadcrumbs */}
      <View className="px-4 pt-3 pb-2">
        <View className="flex-row items-center gap-1 flex-wrap">
          <TouchableOpacity onPress={() => router.push('/(tabs)/home')}>
            <Text className="text-xs text-gray-500">Home</Text>
          </TouchableOpacity>
          <Text className="text-xs text-gray-400">/</Text>
          <TouchableOpacity
            onPress={() => router.push(`/category/${product.category.slug}`)}>
            <Text className="text-xs text-gray-500">{product.category.name}</Text>
          </TouchableOpacity>
          {product.subcategory && (
            <>
              <Text className="text-xs text-gray-400">/</Text>
              <TouchableOpacity
                onPress={() =>
                  router.push(  
                    `/category/${product.category.slug}/${product.subcategory?.slug}`
                  )
                }>
                <Text className="text-xs text-gray-500">{product.subcategory.name}</Text>
              </TouchableOpacity>
            </>
          )}
          <Text className="text-xs text-gray-400">/</Text>
          <Text className="text-xs text-gray-900 font-medium" numberOfLines={1}>
            {product.name}
          </Text>
        </View>
      </View>

      <View className="px-4 py-4">
        {/* Image Gallery */}
        <View className="mb-4">
          <ImageGallery images={selectedSize?.images || (product.imageUrl ? [product.imageUrl] : [])} />
        </View>

        {/* Product Details */}
        <View className="bg-white rounded-2xl p-4 mb-4 border border-emerald-100/80 shadow-sm">
          {/* Title + Wishlist */}
          <View className="flex-row items-start justify-between gap-2 mb-2">
            <Text className="flex-1 text-2xl font-bold text-gray-900">{product.name}</Text>
            <TouchableOpacity
              onPress={toggleWishlist}
              disabled={wishlistLoading}
              className="p-2 -mr-2 rounded-full"
            >
              {wishlistLoading ? (
                <ActivityIndicator size="small" color="#EF4444" />
              ) : (
                <MaterialIcons
                  name={inWishlist ? 'favorite' : 'favorite-border'}
                  size={28}
                  color={inWishlist ? '#EF4444' : '#6B7280'}
                />
              )}
            </TouchableOpacity>
          </View>

          {/* Ratings + Stock */}
          <View className="flex-row items-center gap-2 mb-3">
            <View className="flex-row">
              {[...Array(5)].map((_, i) => (
                <MaterialIcons
                  key={i}
                  name={i < Math.floor(avgRating) ? 'star' : 'star-border'}
                  size={16}
                  color={i < Math.floor(avgRating) ? '#10B981' : '#D1D5DB'}
                />
              ))}
            </View>
            <Text className="text-xs text-gray-600">
              {product.reviews.length || ''} reviews
            </Text>
            <Text className="text-xs text-gray-400">|</Text>
            <Text
              className={`text-xs font-medium ${
                (selectedSize?.stock ?? 0) > 0 ? 'text-green-600' : 'text-red-600'
              }`}>
              {(selectedSize?.stock ?? 0) > 0 ? 'In Stock' : 'Out of Stock'}
            </Text>
          </View>

          {/* Brand */}
          {product.brand && (
            <View className="mb-3">
              <Text className="text-xs text-gray-600">
                Brand: <Text className="font-medium text-green-700">{product.brand.name}</Text>
              </Text>
            </View>
          )}

          {/* Price */}
          <View className="mb-4">
            <View className="flex-row items-baseline gap-2">
              <Text className="text-2xl font-bold text-gray-900">
                ₹{selectedSize?.price.toFixed(0) || product.price?.toFixed(0) || '0'}
              </Text>
              {product.mrp &&
                selectedSize &&
                product.mrp > selectedSize.price && (
                  <>
                    <Text className="text-base text-gray-500 line-through">
                      ₹{product.mrp.toFixed(0)}
                    </Text>
                    <Text className="text-base text-green-600 font-medium">
                      {Math.round((1 - selectedSize.price / product.mrp) * 100)}% off
                    </Text>
                  </>
                )}
            </View>
          </View>

          {/* Description */}
          <Text className="text-sm text-gray-700 mb-4 leading-relaxed">
            {product.shortDescription}
          </Text>

          {/* Size Selector */}
          {product.sizes.length > 0 && selectedSize && (
            <View className="mb-4">
              <Text className="font-semibold text-gray-900 mb-2 text-base">
                Available Sizes:
              </Text>
              <SizeSelector
                sizes={product.sizes}
                selectedSize={selectedSize}
                productSlug={product.slug}
                onSizeSelect={handleSizeSelect}
              />
            </View>
          )}

          {/* Attributes */}
          {product.attributes.length > 0 && (
            <View className="mb-4">
              <Text className="font-semibold text-gray-900 mb-2 text-base">
                Key Features:
              </Text>
              <View className="gap-2">
                {product.attributes.map((attr, idx) => (
                  <View key={idx} className="flex-row items-start">
                    <Text className="text-green-600 mr-2 mt-1">•</Text>
                    <Text className="text-sm text-gray-700 flex-1">
                      <Text className="font-medium">{attr.name}:</Text> {attr.value}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Add to Cart */}
          {selectedSize && (
            <View className="mb-4">
              <AddToCart product={product} selectedSize={selectedSize} />
            </View>
          )}
        </View>

        {/* Benefits */}
        <View className="flex-row gap-3 mb-4">
          {[
            { icon: 'local-shipping', title: 'Free Delivery', sub: 'Delivery in 2-4 days' },
            { icon: 'verified', title: 'Plant Health', sub: 'Quality checked' },
            // { icon: 'assignment-return', title: 'Easy Returns', sub: '10 Day Policy' },
          ].map(({ icon, title, sub }, i) => (
            <View
              key={i}
              className="flex-1 flex-row items-center p-3 rounded-lg border border-gray-100">
              <View className="bg-green-50 p-2 rounded-full mr-2">
                <MaterialIcons name={icon as any} size={18} color="#059669" />
              </View>
              <View className="flex-1">
                <Text className="text-xs font-medium text-gray-900">{title}</Text>
                <Text className="text-[10px] text-gray-500">{sub}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Tabs */}
        <ProductTabs
          fullDescription={product.fullDescription || product.description || ''}
          specifications={product.specifications}
          reviews={product.reviews}
        />

        {/* Related Products */}
        {loadingRelated ? (
          <View className="mt-6">
            <Text className="text-lg font-bold mb-4">Related Products</Text>
            <ActivityIndicator size="small" color="#059669" />
          </View>
        ) : (
          <RelatedProducts products={relatedProducts} />
        )}
      </View>
      </ScrollView>
    </SafeAreaView>
  );
}
