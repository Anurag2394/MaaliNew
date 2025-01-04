import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, FlatList, Alert, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { getSupplierData } from '@/utiles/auth';
import config from '@/config';

const ProductDetail = () => {
  const { productId } = useLocalSearchParams();
  const { category } = useLocalSearchParams();
  const { subCategory } = useLocalSearchParams();
  const router = useRouter();

  const validProductId = productId || 'PLT-SUC-SNKP';
  const [product, setProduct] = useState(null);
  const [selectedUnit, setSelectedUnit] = useState('');
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [isItemAdded, setIsItemAdded] = useState(false);
  const [careInstructions, setCareInstructions] = useState({});
  const [soldOutMessage, setSoldOutMessage] = useState(''); // To display sold out message
  const [insufficientStock, setInsufficientStock] = useState(false)


  const fetchProductDetail = async () => {
    const suppliers = await getSupplierData();
    const ids = suppliers.map(s => s.supplier_id);
    const encodedIds = encodeURIComponent(JSON.stringify(ids));
    try {
      const url = `${config.BASE_URL}/productCatalog/getProductDetails?productId=${validProductId}&category=${subCategory}&sub_category=${category}&supplier_id=${encodedIds}`;
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
        setSelectedUnit(keys[0]); // Set default unit to the first one

        // Ensure images are properly parsed
        if (productData.images && typeof productData.images === 'string') {
          try {
            productData.images = JSON.parse(productData.images);
          } catch (err) {
            console.error('Error parsing images array:', err);
          }
        }

        // Ensure all images exist for the selected unit
        if (productData.images && typeof productData.images === 'object') {
          setProduct(productData);
        } else {
          throw new Error('Product images are missing or empty for the selected unit');
        }
      } else {
        throw new Error('No valid product data found');
      }
    } catch (error) {
      console.error('Failed to fetch product details:', error);
      Alert.alert('Error', 'No Product Found.');
    }
  };

  // Fetch product details once
  useEffect(() => {

    if (validProductId) {
      fetchProductDetail();
    }
  }, [validProductId]); // Dependency on selectedUnit to change images when unit changes


  const fetchCartItemCount = async (phoneNumber: string) => {
    try {
      const response = await fetch('http://192.168.29.14:8002/cart/getCartItemCount', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone_number: phoneNumber,  // Send phone_number in the request body
        }),
      });
  
      if (!response.ok) {
        throw new Error('Failed to fetch cart item count');
      }
  
      const data = await response.json();
      const cartItemCount = data.results || 0;
  
      // Store the cart item count in AsyncStorage
      await AsyncStorage.setItem('cartItemCount', JSON.stringify(cartItemCount));
  
      return cartItemCount;
    } catch (error) {
      console.error('Error fetching cart item count:', error);
      return 0;  // Return 0 in case of an error
    }
  };

  // Handle Add to Cart
  const handleAddToCart = useCallback(async () => {
    if (product) {
      try {
        const selectedDiscount = 0;
        const suppliers = await getSupplierData();
        const cartItem = {
          phone_number: 7417422095, // Fetch this from user session or state
          product_id: product.productId,
          quantity: quantity,
          price: product.price[selectedUnit],
          discount: selectedDiscount,
          quantityMap: product.quantity_map,
          supplierData: suppliers,
          size: selectedUnit,
        };

        const response = await fetch(`http://192.168.29.14:8002/cart/addItemToCart`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(cartItem),
        });

        const data = await response.json();
        if (data.status === 200) {
          await fetchCartItemCount('7417422095')
          await fetchProductDetail()
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

  // Quantity Handling
  const incrementQuantity = useCallback(() => {
    if (product) {
      const availableStock = product.quantity[selectedUnit];
      if (quantity < availableStock) {
        setQuantity((prev) => prev + 1);
      }  else {
        setInsufficientStock(true);
        return; // Early exit to prevent adding more
      }
    }
  }, [product, selectedUnit, quantity]);

  const decrementQuantity = useCallback(() => {
    if (quantity > 1) {
      setQuantity((prev) => prev - 1);
    } 
        setInsufficientStock(false);
        
  }, [quantity]);

  // Reset the selected image index whenever the selected unit changes
  useEffect(() => {
    setSelectedImageIndex(0); // Reset to the first image when changing the unit
  }, [selectedUnit]);

  // Fallback loading state
  if (!product) return <Text>Loading...</Text>;

  // Handle the images for selected unit
  let selectedUnitImages = product.images[selectedUnit];
  selectedUnitImages = JSON.parse(selectedUnitImages) || []; // Ensure it's an array

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
              onPress={() => {
                setSelectedUnit(unit);
                setQuantity(1);
              }
              }

            >
              <Text style={styles.sizeButtonText}>
                {unit}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    

      {/* Quantity Selector */}
      {product.quantity[selectedUnit] !== 0 &&<View style={styles.quantityContainer}>
        <TouchableOpacity style={styles.quantityButton} onPress={decrementQuantity}>
          <Text style={styles.quantityButtonText}>-</Text>
        </TouchableOpacity>
        <Text style={styles.quantityText}>{quantity}</Text>
        <TouchableOpacity style={styles.quantityButton} onPress={incrementQuantity}>
          <Text style={styles.quantityButtonText}>+</Text>
        </TouchableOpacity>
      </View>}
      <View>{insufficientStock && <Text style={styles.insufficientStockText}>Insufficient stock. Added available quantity: <Text>{product.quantity[selectedUnit]}</Text> </Text>}</View>
      {/* Add to Cart Button */}
      {product.quantity[selectedUnit] !== 0 ? <TouchableOpacity style={styles.addToCartButton} onPress={handleAddToCart}>
        <Text style={styles.addToCartText}>Add to Cart</Text>
      </TouchableOpacity> : <Text style={styles.soldOutText}>Sold Out</Text>}



      {/* {isItemAdded && (
        <View style={styles.itemAddedText}>
          <Text style={styles.itemAddedMessage}>Item added to cart!</Text>
          <TouchableOpacity
            style={styles.goToCartButton}
            onPress={() => router.push('/Checkout')}>
            <Text style={styles.goToCartText}>Go to Cart</Text>
          </TouchableOpacity>
        </View>
      )} */}

      <View style={styles.careInstructionContainer}>
        <Text style={styles.careInstructionHeader}>Care Instructions</Text>
        {Object.keys(product.instructions).map((item, index) => {
          return (
            <View key={index} style={styles.careInstructionItem}>
              <Text style={styles.careInstructionLabel}>{item}:</Text>
              <Text style={styles.careInstructionText}>{product.instructions[item]}</Text>
            </View>
          );
        })}
      </View>

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
  soldOutText: {
    color: 'red',
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 10,
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
    borderRadius: 8,
  },
  goToCartText: {
    color: '#fff',
    fontSize: 16,
  },
  careInstructionContainer: {
    marginVertical: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  careInstructionHeader: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 12,
  },
  careInstructionItem: {
    marginBottom: 10,
  },
  careInstructionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#555',
  },
  careInstructionText: {
    fontSize: 14,
    color: '#777',
    marginTop: 4,
    lineHeight: 20,
  },
  insufficientStockText: {
    color: 'red',
    fontSize: 12,
    marginTop: 5,
    marginBottom: 5
  }, 
});



export default ProductDetail;
