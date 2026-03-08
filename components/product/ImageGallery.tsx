import { MaterialIcons } from '@expo/vector-icons';
import React, { useCallback, useState } from 'react';
import { Image, ScrollView, TouchableOpacity, View } from 'react-native';

interface ImageGalleryProps {
  images?: string[];
}

export default function ImageGallery({ images }: ImageGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const safeImages = images ?? [];
  const hasImages = safeImages.length > 0;
  const mainImage = hasImages ? safeImages[currentIndex] : undefined;

  const handleThumbnailClick = useCallback((index: number) => {
    if (!hasImages) return;
    setCurrentIndex(index);
  }, [hasImages]);

  const handlePrev = useCallback(() => {
    if (!hasImages) return;
    setCurrentIndex((prev) => (prev - 1 + safeImages.length) % safeImages.length);
  }, [hasImages, safeImages.length]);

  const handleNext = useCallback(() => {
    if (!hasImages) return;
    setCurrentIndex((prev) => (prev + 1) % safeImages.length);
  }, [hasImages, safeImages.length]);

  return (
    <View className="relative">
      {/* Main Image */}
      <View className="relative aspect-square overflow-hidden rounded-lg mb-4">
        {mainImage ? (
          <Image
            source={{ uri: mainImage }}
            className="w-full h-full"
            resizeMode="cover"
          />
        ) : (
          <View className="w-full h-full bg-gray-100 rounded-lg items-center justify-center">
            <MaterialIcons name="image" size={48} color="#9CA3AF" />
          </View>
        )}
      </View>

      {/* Thumbnail Navigation */}
      {safeImages.length > 1 && (
        <View className="relative">
          <TouchableOpacity
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-5 rounded-full shadow-md p-1 z-10 bg-white"
            onPress={handlePrev}
            disabled={!hasImages}>
            <MaterialIcons name="chevron-left" size={20} color="#374151" />
          </TouchableOpacity>
          <TouchableOpacity
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-5 rounded-full shadow-md p-1 z-10 bg-white"
            onPress={handleNext}
            disabled={!hasImages}>
            <MaterialIcons name="chevron-right" size={20} color="#374151" />
          </TouchableOpacity>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="gap-3">
            <View className="flex-row gap-3 px-8">
              {safeImages.map((img, idx) => (
                <TouchableOpacity
                  key={idx}
                  onPress={() => handleThumbnailClick(idx)}
                  className={`relative aspect-square w-20 rounded-lg overflow-hidden border-2 ${
                    currentIndex === idx
                      ? 'border-green-500'
                      : 'border-transparent opacity-80'
                  }`}>
                  <Image
                    source={{ uri: img }}
                    className="w-full h-full"
                    resizeMode="cover"
                  />
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>
      )}
    </View>
  );
}

