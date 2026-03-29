import { MaterialIcons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  FlatList,
  Image,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  TouchableOpacity,
  View,
} from 'react-native';

interface ImageGalleryProps {
  images?: string[];
}

export default function ImageGallery({ images }: ImageGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [slideWidth, setSlideWidth] = useState(0);
  const listRef = useRef<FlatList<string>>(null);

  const safeImages = images ?? [];
  const hasImages = safeImages.length > 0;
  const multi = safeImages.length > 1;

  const handleThumbnailClick = useCallback(
    (index: number) => {
      if (!hasImages || slideWidth <= 0) return;
      setCurrentIndex(index);
      listRef.current?.scrollToOffset({ offset: index * slideWidth, animated: true });
    },
    [hasImages, slideWidth]
  );

  const onMomentumScrollEnd = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (slideWidth <= 0 || safeImages.length === 0) return;
      const x = e.nativeEvent.contentOffset.x;
      const i = Math.round(x / slideWidth);
      setCurrentIndex(Math.max(0, Math.min(safeImages.length - 1, i)));
    },
    [slideWidth, safeImages.length]
  );

  const onHeroLayout = useCallback((w: number) => {
    if (w > 0) setSlideWidth(w);
  }, []);

  const imagesKey = safeImages.join('|');
  useEffect(() => {
    setCurrentIndex(0);
    if (slideWidth > 0) {
      listRef.current?.scrollToOffset({ offset: 0, animated: false });
    }
  }, [imagesKey]);

  return (
    <View>
      <View
        className="relative mb-3 overflow-hidden rounded-2xl bg-gray-100"
        onLayout={(e) => onHeroLayout(e.nativeEvent.layout.width)}>
        {!hasImages ? (
          <View className="aspect-square w-full items-center justify-center">
            <MaterialIcons name="image" size={48} color="#9CA3AF" />
          </View>
        ) : multi && slideWidth > 0 ? (
          <>
            <FlatList
              ref={listRef}
              data={safeImages}
              horizontal
              pagingEnabled
              nestedScrollEnabled
              showsHorizontalScrollIndicator={false}
              keyExtractor={(_, i) => `gallery-${i}`}
              onMomentumScrollEnd={onMomentumScrollEnd}
              decelerationRate="fast"
              snapToInterval={slideWidth}
              snapToAlignment="start"
              disableIntervalMomentum
              getItemLayout={(_, index) => ({
                length: slideWidth,
                offset: slideWidth * index,
                index,
              })}
              style={{ height: slideWidth }}
              renderItem={({ item }) => (
                <View style={{ width: slideWidth, height: slideWidth }}>
                  <Image source={{ uri: item }} className="h-full w-full" resizeMode="cover" />
                </View>
              )}
            />
            <View
              pointerEvents="none"
              className="absolute bottom-3 left-0 right-0 flex-row justify-center gap-1.5 px-4">
              {safeImages.map((_, i) => (
                <View
                  key={i}
                  className="h-1.5 rounded-full"
                  style={{
                    width: i === currentIndex ? 20 : 6,
                    backgroundColor: i === currentIndex ? '#FFFFFF' : 'rgba(255,255,255,0.45)',
                  }}
                />
              ))}
            </View>
          </>
        ) : (
          <View className="aspect-square w-full">
            <Image
              source={{ uri: safeImages[0] }}
              className="h-full w-full"
              resizeMode="cover"
            />
          </View>
        )}
      </View>

      {multi && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 10, paddingHorizontal: 2, paddingBottom: 2 }}>
          {safeImages.map((img, idx) => (
            <TouchableOpacity
              key={idx}
              onPress={() => handleThumbnailClick(idx)}
              className={`relative aspect-square w-[72px] rounded-xl overflow-hidden border-2 ${
                currentIndex === idx ? 'border-emerald-600' : 'border-transparent opacity-85'
              }`}>
              <Image source={{ uri: img }} className="h-full w-full" resizeMode="cover" />
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </View>
  );
}
