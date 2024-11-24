import React, { useEffect, useState } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import config from '@/config';

type Product = {
  _id: { $oid: string };
  productId: string;
  productName: string;
  category: string;
  description: string;
  price: { Regular: number; Large: number; XL: number };
  currency: string;
  stockQuantity: { Regular: number; Large: number; XL: number };
  images: string[];
  ratings: { averageRating: number; numberOfReviews: number };
  tags: string[];
  dateAdded: string;
  careInstructions: { watering: string; light: string; fertilizing: string };
};

const ProductDetail = () => {
  const { productId } = useLocalSearchParams();
  const router = useRouter();
  
  const [product, setProduct] = useState<Product | null>(null);
  const [selectedSize, setSelectedSize] = useState<'Regular' | 'Large' | 'XL'>('Regular');

  useEffect(() => {
    const fetchProductDetail = async () => {
      try {
        const response = await fetch(`${config.BASE_URL}/productCatalog/getProductById/${productId}`);
        const data = await response.json();
        setProduct(data);
      } catch (error) {
        console.error('Failed to fetch product details:', error);
      }
    };

    if (productId) {
      fetchProductDetail();
    }
  }, [productId]);

  const handleAddToCart = (product: Product) => {
    // Logic to add product to cart (same as your current cart modification)
  };

  if (!product) return <Text>Loading...</Text>;

  return (
    <View style={styles.container}>
      <Image
        source={{ uri: product.images[0].replace('dl=0', 'raw=1') }}
        style={styles.image}
        resizeMode="contain"
      />

      <Text style={styles.productName}>{product.productName}</Text>
      <Text style={styles.productDescription}>{product.description}</Text>

      <Text style={styles.price}>
        {`${product.currency} ${product.price[selectedSize]}`}
      </Text>

      <View style={styles.sizeContainer}>
        {['Regular', 'Large', 'XL'].map((size) => (
          <TouchableOpacity
            key={size}
            style={[styles.sizeButton, selectedSize === size && styles.selectedSizeButton]}
            onPress={() => setSelectedSize(size as 'Regular' | 'Large' | 'XL')}
          >
            <Text style={styles.sizeButtonText}>{size}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={styles.addToCartButton} onPress={() => handleAddToCart(product)}>
        <Text style={styles.addToCartText}>Add to Cart</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.goBackButton} onPress={() => router.back()}>
        <Text style={styles.goBackText}>Go Back</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  image: {
    width: '100%',
    height: 300,
    marginBottom: 20,
  },
  productName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  productDescription: {
    fontSize: 16,
    color: '#555',
    marginBottom: 15,
  },
  price: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 15,
  },
  sizeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  sizeButton: {
    paddingVertical: 8,
    paddingHorizontal: 15,
    backgroundColor: '#f0f0f0',
    borderRadius: 5,
  },
  selectedSizeButton: {
    backgroundColor: '#007BFF',
  },
  sizeButtonText: {
    color: '#333',
  },
  addToCartButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: '#007BFF',
    borderRadius: 6,
    alignItems: 'center',
    marginBottom: 20,
  },
  addToCartText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  goBackButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: '#f0f0f0',
    borderRadius: 6,
    alignItems: 'center',
  },
  goBackText: {
    color: '#007BFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default ProductDetail;
