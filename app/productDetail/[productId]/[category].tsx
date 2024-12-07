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
  const [selectedUnit, setSelectedUnit] = useState();
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [isItemAdded, setIsItemAdded] = useState(false);

  useEffect(() => {
    const fetchProductDetail = async () => {
      try {
        const url = `${config.BASE_URL}/productCatalog/getProductDetails?productId=${validProductId}&category=${category}`;
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        const dataJS = await response.json();
        const parsedResults = dataJS.results;
        if (Array.isArray(parsedResults) && parsedResults.length > 0) {
          const productData = parsedResults[0];
          const keys = Object.keys(productData.quantity);
          console.log(keys, 'keys');
          setSelectedUnit(keys[0])

       
        console.log(productData, 'productDataproductData', typeof productData.images)

          // Ensure images are properly parsed
          if (productData.images && typeof productData.images === 'string') {

            try {
              productData.images = JSON.parse(productData.images);
            } catch (err) {
              console.error('Error parsing images array:', err);
            }
          }

          // Set the product data if images are available
          if (productData.images && productData.images[selectedUnit]) {
            setProduct(productData);
          } else {
            throw new Error('Product images are missing or empty for the selected unit');
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

  const handleAddToCart = useCallback(async () => {
    if (product) {
      try {
        const selectedDiscount = 0;
        const cartItem = {
          phone_number: 7417422095, // Fetch this from user session or state
          product_id: product.productId,
          quantity: quantity,
          price: product.price[selectedUnit],
          discount: selectedDiscount,
          unit: selectedUnit,
        };

        const response = await fetch(`http://192.168.29.14:8002/cart/addItemToCart`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
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

  const incrementQuantity = useCallback(() => {
    if (product) {
      const availableStock = product.quantity[selectedUnit];
      if (quantity < availableStock) {
        setQuantity((prev) => prev + 1);
      } else {
        Alert.alert('Maximum stock reached', `Only ${availableStock} items available in ${selectedUnit} unit.`);
      }
    }
  }, [product, selectedUnit, quantity]);

  const decrementQuantity = useCallback(() => {
    if (quantity > 1) {
      setQuantity((prev) => prev - 1);
    }
  }, [quantity]);


  console.log(product, 'jojooko')

  if (!product) return <Text>Loading...</Text>;

  // Handle the images for selected unit
  let selectedUnitImages = product.images[selectedUnit];
  selectedUnitImages = JSON.parse(selectedUnitImages)
  console.log(selectedUnitImages[0], selectedUnitImages[selectedImageIndex], '1111111111')
  return (
    <ScrollView style={styles.container}>
      {/* Image Slider */}
      <View style={styles.imageSlider}>
        {selectedUnitImages && selectedUnitImages.length > 0 ? (
          <>
            <Image
              source={{ uri: selectedUnitImages[selectedImageIndex].replace('dl=0', 'raw=1') }}
              style={styles.mainImage}
              resizeMode="contain"
            />
            <FlatList
              horizontal
              data={selectedUnitImages}
              renderItem={({ item, index }) => (
                <TouchableOpacity
                  onPress={() => setSelectedImageIndex(index)}
                  style={[
                    styles.thumbnailContainer,
                    index === selectedImageIndex && styles.selectedThumbnail,
                  ]}>
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
        {typeof product.price[selectedUnit] === 'string'
          ? `${product.currency} ${parseFloat(product.price[selectedUnit]).toFixed(2)}`
          : `${product.currency} Price unavailable`}
      </Text>

      {/* Ratings and Reviews */}
      <View style={styles.ratingsContainer}>
        <Text style={styles.ratingsText}>
          {product.ratings.averageRating} ({product.ratings.numberOfReviews} reviews)
        </Text>
      </View>

      {/* Unit Type Selector */}
      <View style={styles.sizeContainer}>
        {Object.keys(product.price).map((unit) => {
          const availableStock = product.quantity[unit];
          return (
            <TouchableOpacity
              key={unit}
              style={[styles.sizeButton, selectedUnit === unit && styles.selectedSizeButton]}
              onPress={() => setSelectedUnit(unit)}>
              <Text style={styles.sizeButtonText}>
                {unit} ({availableStock} available)
              </Text>
            </TouchableOpacity>
          );
        })}
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
  },
  sizeContainer: {
    flexDirection: 'row',
    marginVertical: 16,
  },
  sizeButton: {
    padding: 8,
    marginRight: 8,
    backgroundColor: '#ddd',
    borderRadius: 4,
  },
  selectedSizeButton: {
    backgroundColor: '#007BFF',
  },
  sizeButtonText: {
    color: '#fff',
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
  },
  quantityButton: {
    padding: 10,
    backgroundColor: '#ddd',
    borderRadius: 4,
  },
  disabledButton: {
    backgroundColor: '#f0f0f0',
  },
  quantityButtonText: {
    fontSize: 20,
  },
  quantityText: {
    fontSize: 20,
    marginHorizontal: 20,
  },
  addToCartButton: {
    backgroundColor: '#28a745',
    padding: 12,
    alignItems: 'center',
    borderRadius: 8,
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
    marginTop: 8,
    padding: 10,
    backgroundColor: '#007BFF',
    borderRadius: 4,
  },
  goToCartText: {
    color: '#fff',
    fontSize: 16,
  },
});

export default ProductDetail;
