import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, FlatList, Alert, ScrollView } from 'react-native';
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
  product: object;
};

const ProductDetail = () => {
  const { productId } = useLocalSearchParams();
  const router = useRouter();

  const validProductId = productId || 'PLT-SUC-SNKP';

  const [product, setProduct] = useState<Product | null>(null);
  const [selectedSize, setSelectedSize] = useState<'Regular' | 'Large' | 'XL'>('Regular');
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [isItemAdded, setIsItemAdded] = useState(false);

  useEffect(() => {
    const fetchProductDetail = async () => {
      try {
        const url = `${config.BASE_URL}/productCatalog/getProductDetails?productId=${validProductId}`;
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        const dataJS = await response.json();
        console.log('API Response:', dataJS);

        const parsedResults = dataJS.results;

        if (Array.isArray(parsedResults) && parsedResults.length > 0) {
          const productData = parsedResults[0];

          if (productData.images && typeof productData.images === 'string') {
            try {
              productData.images = JSON.parse(productData.images);
            } catch (err) {
              console.error('Error parsing images array:', err);
              throw new Error('Invalid images format');
            }
          }

          if (Array.isArray(productData.images) && productData.images.length > 0) {
            setProduct(productData);
          } else {
            throw new Error('Product images are missing or empty');
          }
        } else {
          throw new Error('No valid product data found');
        }
      } catch (error) {
        console.error('Failed to fetch product details:', error);
        Alert.alert('Error', 'Failed to load product details.');
      }
    };

    if (validProductId) {
      fetchProductDetail();
    }
  }, [validProductId]);

  const handleAddToCart = useCallback(() => {
    if (product) {
      const availableStock = product.stockQuantity[selectedSize];
      if (quantity > availableStock) {
        Alert.alert('Out of Stock', `Only ${availableStock} items available in ${selectedSize} size.`);
        return;
      }

      console.log('Added to cart:', { ...product, selectedSize, quantity });
      setIsItemAdded(true);
    }
  }, [product, selectedSize, quantity]);

  const incrementQuantity = useCallback(() => {
    if (product) {
      if (quantity < product.stockQuantity[selectedSize]) {
        setQuantity((prev) => prev + 1);
      }
    }
  }, [product, selectedSize, quantity]);

  const decrementQuantity = useCallback(() => {
    if (quantity > 1) {
      setQuantity((prev) => prev - 1);
    }
  }, [quantity]);

  if (!product) return <Text>Loading...</Text>;

  return (
    <ScrollView style={styles.container}>
      {/* Image Slider */}
      <View style={styles.imageSlider}>
        {product.images && product.images.length > 0 ? (
          <>
            <Image
              source={{ uri: product.images[selectedImageIndex].replace('dl=0', 'raw=1') }}
              style={styles.mainImage}
              resizeMode="contain"
            />
            <FlatList
              horizontal
              data={product.images}
              renderItem={({ item, index }) => (
                <TouchableOpacity
                  onPress={() => setSelectedImageIndex(index)}
                  style={[styles.thumbnailContainer, index === selectedImageIndex && styles.selectedThumbnail]}>
                  <Image
                    source={{ uri: item.replace('dl=0', 'raw=1') }}
                    style={styles.thumbnail}
                    resizeMode="contain"
                  />
                </TouchableOpacity>
              )}
              keyExtractor={(item, index) => String(index)}
              showsHorizontalScrollIndicator={false}
            />
          </>
        ) : (
          <Text>No images available</Text>
        )}
      </View>

      {/* Product Details */}
      <Text style={styles.productName}>{product.productName}</Text>
      <Text style={styles.productDescription}>{product.description}</Text>
      <Text style={styles.price}>
  {typeof product.price[selectedSize] === 'number' 
    ? `${product.currency} ${product.price[selectedSize].toFixed(2)}`
    : `${product.currency} Price unavailable`}
</Text>
s

      {/* Ratings and Reviews */}
      <View style={styles.ratingsContainer}>
        <Text style={styles.ratingsText}>
          {product.ratings.averageRating} ({product.ratings.numberOfReviews} reviews)
        </Text>
      </View>

      {/* Size Selector */}
      <View style={styles.sizeContainer}>
        {['Regular', 'Large', 'XL'].map((size) => (
          <TouchableOpacity
            key={size}
            style={[styles.sizeButton, selectedSize === size && styles.selectedSizeButton]}
            onPress={() => setSelectedSize(size as 'Regular' | 'Large' | 'XL')}>
            <Text style={styles.sizeButtonText}>{size}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Quantity Selector */}
      <View style={styles.quantityContainer}>
        <TouchableOpacity style={styles.quantityButton} onPress={decrementQuantity}>
          <Text style={styles.quantityButtonText}>-</Text>
        </TouchableOpacity>
        <Text style={styles.quantityText}>{quantity}</Text>
        <TouchableOpacity style={styles.quantityButton} onPress={incrementQuantity}>
          <Text style={styles.quantityButtonText}>+</Text>
        </TouchableOpacity>
      </View>

      {/* Add to Cart Button */}
      <TouchableOpacity style={styles.addToCartButton} onPress={handleAddToCart}>
        <Text style={styles.addToCartText}>Add to Cart</Text>
      </TouchableOpacity>

      {isItemAdded && (
        <View style={styles.itemAddedText}>
          <Text style={styles.itemAddedMessage}>Item added to cart!</Text>
          <TouchableOpacity
            style={styles.goToCartButton}
            onPress={() => router.push('/Checkout')}>
            <Text style={styles.goToCartText}>Go to Cart</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Go Back Button */}
      <TouchableOpacity style={styles.goBackButton} onPress={() => router.back()}>
        <Text style={styles.goBackText}>Go Back</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  imageSlider: {
    marginBottom: 20,
  },
  mainImage: {
    width: '100%',
    height: 300,
    marginBottom: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  thumbnailContainer: {
    marginHorizontal: 5,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 5,
  },
  selectedThumbnail: {
    borderColor: '#007BFF',
  },
  thumbnail: {
    width: 60,
    height: 60,
    borderRadius: 5,
  },
  productName: {
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  productDescription: {
    fontSize: 16,
    color: '#555',
    marginBottom: 15,
    lineHeight: 24,
  },
  price: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 15,
  },
  ratingsContainer: {
    marginBottom: 15,
  },
  ratingsText: {
    fontSize: 16,
    color: '#888',
  },
  sizeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  sizeButton: {
    padding: 12,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    width: 80,
    alignItems: 'center',
  },
  selectedSizeButton: {
    borderColor: '#007BFF',
  },
  sizeButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  quantityContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  quantityButton: {
    padding: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
  },
  quantityButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  quantityText: {
    fontSize: 18,
    marginHorizontal: 15,
  },
  addToCartButton: {
    backgroundColor: '#007BFF',
    paddingVertical: 15,
    borderRadius: 5,
    marginBottom: 20,
  },
  addToCartText: {
    color: '#fff',
    fontSize: 18,
    textAlign: 'center',
  },
  itemAddedText: {
    textAlign: 'center',
    marginBottom: 20,
  },
  itemAddedMessage: {
    fontSize: 18,
    color: '#333',
    marginBottom: 10,
  },
  goToCartButton: {
    backgroundColor: '#28a745',
    paddingVertical: 10,
    borderRadius: 5,
  },
  goToCartText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
  },
  goBackButton: {
    backgroundColor: '#ccc',
    paddingVertical: 10,
    borderRadius: 5,
    marginTop: 20,
  },
  goBackText: {
    color: '#000',
    fontSize: 16,
    textAlign: 'center',
  },
});

export default ProductDetail;
