import React, { useEffect, useState } from 'react';
import { Image, StyleSheet, Text, ScrollView, View, Pressable } from 'react-native';
import config from '@/config';
import { ThemedView } from '@/components/ThemedView';
import { useRouter } from 'expo-router'; // useRouter from expo-router

interface Category {
  imageUrl: string;
  title: string;
}

const CircleText: React.FC = () => {
  const [categories, setCategories] = useState<Array<Category>>([]); // State to hold categories
  const [error, setError] = useState(false); // State for error handling
  const router = useRouter(); // useRouter hook for navigation

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch(`${config.BASE_URL}/productCatalog/getHomePageScrollerData`);
        const data = await response.json();
    
        
        // Ensure results is a valid JSON string before parsing
        if (typeof data.results === 'string') {
          const parsedCategories = JSON.parse(data.results);
          setCategories(parsedCategories);
        }
      } catch (err) {
        console.error('Failed to fetch categories:', err);
      }
    };

    fetchCategories();
  }, []); // Runs once when component mounts

  const navigateToProduct = (productName: string) => {
    router.push({
      pathname: '/Product',
      params: { product: productName },
    });
  };

  console.log(categories, '&&&&'); // Debug output
  if (!categories.length) return null; // Check if categories array is empty

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      {categories.map((category, index) => (
        <Pressable key={index} style={styles.itemContainer} onPress={() => navigateToProduct(category.title)}>
          <Image
            source={{ uri: category.imageUrl.replace('dl=0', 'raw=1') }} // Modify URL for direct access
            style={styles.plant}
            onError={() => setError(true)} // Handle image loading error
          />
          {error && <Text>Error loading image</Text>}
          <Text>{category.title}</Text>
        </Pressable>
      ))}
    </ScrollView>
  );
};

export default CircleText;

const styles = StyleSheet.create({
  itemContainer: {
    alignItems: 'center',
    margin: 8,
    backgroundColor: 'transparent',
  },
  plant: {
    height: 70,
    width: 70,
    borderRadius: 35,
  },
});
