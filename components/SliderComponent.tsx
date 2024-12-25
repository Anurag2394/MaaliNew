import React, { useEffect, useRef, useState } from 'react';
import { View, FlatList, Image, StyleSheet, Dimensions, Text, ActivityIndicator } from 'react-native';
import config from '@/config';

interface ImageItem {
  id: string;
  uri: string;
}

const { width } = Dimensions.get('window');

// Fetching slider data from API
const getHomePageSliderData = async (): Promise<ImageItem[]> => {
  try {
    const response = await fetch(`${config.BASE_URL}/productCatalog/getHomePageSliderData`);
    const data = await response.json();
    let parsedProducts = [];
    console.log(data, 'data');

    if (typeof data.results === 'string') {
      parsedProducts = JSON.parse(data.results);
      return parsedProducts.map((item: { slideId: string; Images: string }) => ({
        id: item.slideId,
        uri: item.Images,
      }));
    }
  } catch (error) {
    console.error('Error fetching slider data:', error);
    return [];
  }
};

const SliderComponent: React.FC = () => {
  const [images, setImages] = useState<ImageItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const flatListRef = useRef<FlatList<ImageItem>>(null);

  // Fetch slider data on component mount
  useEffect(() => {
    const fetchSliderData = async () => {
      const sliderData = await getHomePageSliderData();
      setImages(sliderData);
      setLoading(false);
    };

    fetchSliderData();
  }, []);

  // Auto-slide functionality
  useEffect(() => {
    if (images.length > 0) {
      const interval = setInterval(() => {
        setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
      }, 3000);

      return () => clearInterval(interval);
    }
  }, [images]);

  // Scroll to the current index when it changes
  useEffect(() => {
    if (flatListRef.current) {
      flatListRef.current.scrollToIndex({ index: currentIndex, animated: true });
    }
  }, [currentIndex]);

  // Render each image item
  const renderItem = ({ item }: { item: ImageItem }) => {
    // Ensure the image URI is valid before using it
    const imageUri = item.uri ? item.uri.replace('dl=0', 'raw=1') : ''; // Default to empty string if invalid

    return (
      <View style={styles.imageContainer}>
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={styles.image} />
        ) : (
          <Text>No image available</Text> // Fallback if image URI is invalid
        )}
      </View>
    );
  };

  // Show loading spinner while data is being fetched
  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  // If no images are available
  if (images.length === 0) {
    return (
      <View style={styles.container}>
        <Text>No images available.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={images}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        horizontal
        showsHorizontalScrollIndicator={false}
        pagingEnabled
      />
      <View style={styles.pagination}>
        {images.map((_, index) => (
          <Text
            key={index}
            style={[styles.paginationDot, currentIndex === index ? styles.activeDot : styles.inactiveDot]}
          >
            ●
          </Text>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    height: 300,
    marginBottom: 10,
  },
  imageContainer: {
    width: width,
    height: 300,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  pagination: {
    position: 'absolute',
    bottom: 10,
    flexDirection: 'row',
  },
  paginationDot: {
    fontSize: 20,
    color: '#888',
    margin: 3,
  },
  activeDot: {
    color: '#fff',
  },
  inactiveDot: {
    color: '#888',
  },
});

export default SliderComponent;
