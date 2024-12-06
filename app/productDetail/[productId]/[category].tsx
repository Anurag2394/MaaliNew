import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, FlatList, Alert, ScrollView } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import config from '@/config';

const ProductDetail = () => {
  const { productId } = useLocalSearchParams();
  const { category } = useLocalSearchParams();
  const router = useRouter();

  const validProductId = productId || 'PLT-SUC-SNKP';

  const [product, setProduct] = useState(null);
  const [selectedUnit, setSelectedUnit] = useState('Regular'); // Default size
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [isItemAdded, setIsItemAdded] = useState(false);

  // Fetch product details
  useEffect(() => {
    const fetchProductDetail = async () => {
      try {
        const url = `${config.BASE_URL}/productCatalog/getProductDetails?productId=${validProductId}&category=${category}`;
        const response = await fetch(url, { method: 'GET', headers: { 'Content-Type': 'application/json' } });
        const dataJS = await response.json();
        const parsedResults = dataJS.results;

        if (Array.isArray(parsedResults) && parsedResults.length > 0) {
          const productData = parsedResults[0];

          // Ensure images are parsed as an array
          if (productData.images && typeof productData.images === 'string') {
            productData.images = JSON.parse(productData.images);
          }

          if (productData.images && productData.images[selectedUnit]) {
            setProduct(productData);
          } else {
            throw new Error('No images available for the selected size');
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
  }, [validProductId, selectedUnit]);

  // Add to cart handler
  const handleAddToCart = useCallback(async () => {
    if (product) {
      try {
        const selectedDiscount = 0; // Adjust if needed
        const cartItem = {
          phone_number: 7417422095,  // Replace with actual user session
          product_id: product.productId,
          quantity: quantity,
          price: product.price[selectedUnit],
          discount: selectedDiscount,
          unit: selectedUnit
        };

        const response = await fetch(`http://192.168.29.14:8002/cart/addItemToCart`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(cartItem),
        });

        const data = await response.json();
        if (data.success) {
          setIsItemAdded(true);
        } else {
          Alert.alert('Error', 'Failed to add item to cart.');
        }
      } catch (error) {
        console.error('Failed to add to cart:', error);
        Alert.alert('Error', 'Failed to add item to cart.');
      }
    }
  }, [product, selectedUnit, quantity]);

  // Quantity Increment/Decrement
  const incrementQuantity = useCallback(() => {
    if (product && quantity < product.quantity[selectedUnit]) {
      setQuantity((prev) => prev + 1);
    } else {
      Alert.alert('Stock limit reached', `Only ${product?.quantity[selectedUnit]} items available.`);
    }
  }, [product, selectedUnit, quantity]);

  const decrementQuantity = useCallback(() => {
    if (quantity > 1) {
      setQuantity((prev) => prev - 1);
    }
  }, [quantity]);

  if (!product) return <Text>Loading...</Text>;

  // Get selected unit images
  const selectedUnitImages = product.images[selectedUnit];

  return (
    <ScrollView style={styles.container}>
      {/* Image Slider */}
      <View style={styles.imageSlider}>
        {selectedUnitImages && selectedUnitImages.length > 0 ? (
          <>
            <Image
              source={{ uri: selectedUnitImages[selectedImageIndex]?.replace('dl=0', 'raw=1') }}
              style={styles.mainImage}
              resizeMode="contain"
            />
            <FlatList
              horizontal
              data={selectedUnitImages}
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
        {product.price[selectedUnit] ? `${product.currency} ${parseFloat(product.price[selectedUnit]).toFixed(2)}` : 'Price unavailable'}
      </Text>

      {/* Ratings */}
      <View style={styles.ratingsContainer}>
        <Text style={styles.ratingsText}>
          {product.ratings.averageRating} ({product.ratings.numberOfReviews} reviews)
        </Text>
      </View>

      {/* Size Selector */}
      <View style={styles.sizeContainer}>
        {Object.keys(product.price).map((unit) => (
          <TouchableOpacity
            key={unit}
            style={[styles.sizeButton, selectedUnit === unit && styles.selectedSizeButton]}
            onPress={() => setSelectedUnit(unit)}>
            <Text style={styles.sizeButtonText}>
              {unit} ({product.quantity[unit]} available)
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Quantity Selector */}
      <View style={styles.quantityContainer}>
        <TouchableOpacity
          style={[styles.quantityButton, quantity <= 1 && styles.disabledButton]}
          onPress={decrementQuantity}
          disabled={quantity <= 1}>
          <Text style={styles.quantityButtonText}>-</Text>
        </TouchableOpacity>
        <Text style={styles.quantityText}>{quantity}</Text>
        <TouchableOpacity
          style={[styles.quantityButton, quantity >= product.quantity[selectedUnit] && styles.disabledButton]}
          onPress={incrementQuantity}
          disabled={quantity >= product.quantity[selectedUnit]}>
          <Text style={styles.quantityButtonText}>+</Text>
        </TouchableOpacity>
      </View>

      {/* Add to Cart Button */}
      <TouchableOpacity style={styles.addToCartButton} onPress={handleAddToCart}>
        <Text style={styles.addToCartText}>Add to Cart</Text>
      </TouchableOpacity>

      {/* Item Added confirmation */}
      {isItemAdded && (
        <View style={styles.itemAddedText}>
          <Text style={styles.itemAddedMessage}>Item added to cart!</Text>
          <TouchableOpacity
            style={styles.goToCartButton}
            onPress={() => router.push('/checkout')}>
            <Text style={styles.goToCartText}>Go to Cart</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  imageSlider: {
    marginBottom: 16,
  },
  mainImage: {
    width: '100%',
    height: 400,
  },
  thumbnailContainer: {
    marginRight: 8,
  },
  thumbnail: {
    width: 70,
    height: 70,
  },
  selectedThumbnail: {
    borderWidth: 2,
    borderColor: 'blue',
  },
  productName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginVertical: 8,
  },
  productDescription: {
    fontSize: 16,
    marginVertical: 4,
  },
  price: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'green',
    marginVertical: 4,
  },
  ratingsContainer: {
    marginVertical: 8,
  },
  ratingsText: {
    fontSize: 16,
    color: 'gray',
  },
  sizeContainer: {
    flexDirection: 'row',
    marginVertical: 8,
  },
  sizeButton: {
    padding: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
    marginRight: 8,
  },
  selectedSizeButton: {
    backgroundColor: '#4CAF50',
  },
  sizeButtonText: {
    fontSize: 16,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
  },
  quantityButton: {
    padding: 10,
    backgroundColor: '#ccc',
    borderRadius: 50,
  },
  disabledButton: {
    backgroundColor: '#e0e0e0',
  },
  quantityButtonText: {
    fontSize: 18,
  },
  quantityText: {
    fontSize: 18,
    marginHorizontal: 20,
  },
  addToCartButton: {
    backgroundColor: '#4CAF50',
    padding: 16,
    borderRadius: 4,
    alignItems: 'center',
  },
  addToCartText: {
    color: '#fff',
    fontSize: 18,
  },
  itemAddedText: {
    marginTop: 16,
    alignItems: 'center',
  },
  itemAddedMessage: {
    fontSize: 16,
    color: 'green',
  },
  goToCartButton: {
    backgroundColor: '#ff5722',
    padding: 10,
    borderRadius: 4,
    marginTop: 8,
  },
  goToCartText: {
    color: '#fff',
    fontSize: 16,
  },
});

export default ProductDetail;
