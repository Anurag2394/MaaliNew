import React, { useEffect, useState, useCallback } from 'react';
import { View, FlatList, Image, Text, StyleSheet, TouchableOpacity, Modal, Animated, TouchableWithoutFeedback } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Rating } from 'react-native-ratings'; // Import Rating component
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
  images: string[]; // Array of image URLs
  ratings: { averageRating: number; numberOfReviews: number }; // Ratings object
  tags: string[];
  dateAdded: string;
  careInstructions: { watering: string; light: string; fertilizing: string };
};

const ProductList = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedSizes, setSelectedSizes] = useState<{ [key: string]: string }>({});
  const [cart, setCart] = useState<{ [key: string]: { quantity: number; price: number; discount: number } }>({});
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [currentProduct, setCurrentProduct] = useState<Product | null>(null);
  const [modalSlideAnim] = useState(new Animated.Value(0)); // For modal sliding animation
  const [fadeOutAnimation] = useState(new Animated.Value(1)); // For fade out of the "Go to Cart" button

  const { product } = useLocalSearchParams();
  const router = useRouter();

  const queryTags = product || 'plants/cacti';

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const productRequestPayload = { tags: queryTags };

        const response = await fetch(`${config.BASE_URL}/productCatalog/getProductsByTags`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(productRequestPayload),
        });

        const data = await response.json();
        if (typeof data.results === 'string') {
          const parsedProducts = JSON.parse(data.results);
          setProducts(parsedProducts);
        }
      } catch (error) {
        console.error('Failed to fetch products:', error);
      }
    };

    fetchProducts();
  }, [queryTags]);

  const modifyCart = useCallback(async (product: Product, size: string, action: 'increment' | 'decrement') => {
    const currentQuantity = cart[product.productId]?.quantity || 0;
    let newQuantity = currentQuantity;

    if (action === 'increment') {
      newQuantity += 1;
    } else if (action === 'decrement' && currentQuantity > 0) {
      newQuantity -= 1;
    }

    // Ensure selected size exists and is valid
    const selectedSize = selectedSizes[product.productId] || 'Regular';
    const selectedPrice = product.price[selectedSize];

    try {
      const payload = {
        phone_number: 7417422095,  // Make sure it's a valid number
        product_id: product.productId,  // Make sure productId is valid
        quantity: newQuantity,
        size: selectedSize
      };

      const response = await fetch('http://192.168.29.14:8002/cart/updateItemQuantity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      setCart((prevCart) => ({
        ...prevCart,
        [product.productId]: {
          quantity: newQuantity,
          price: selectedPrice,  // If needed for UI
          discount: 0,  // As per your logic
        },
      }));
    } catch (error) {
      console.error('Error modifying cart:', error);
    }
  }, [cart]);

  const renderProduct = ({ item }: { item: Product }) => {
    const isInCart = cart[item.productId]?.quantity > 0;

    const openModal = (product: Product) => {
      setCurrentProduct(product);
      setIsModalVisible(true);

      // Reset the slide animation to 0 (bottom) before starting the animation
      modalSlideAnim.setValue(0);

      // Slide up the modal
      Animated.timing(modalSlideAnim, {
        toValue: 1,  // Move modal up to visible position
        duration: 300,
        useNativeDriver: true,  // Ensure smooth animation
      }).start();
    };

    const navigateToProductDetail = () => {
      router.push(`/productDetail/${item.productId}`);
    };

    return (
      <View style={styles.productContainer}>
        <View style={styles.imageContainer}>
          <TouchableOpacity onPress={navigateToProductDetail}>
            <Image
              source={{ uri: (JSON.parse(item.images)[0]).toString().replace('dl=0', 'raw=1') }}
              style={styles.image}
              resizeMode="stretch"
            />
          </TouchableOpacity>
          {isInCart && (
            <View style={styles.ribbon}>
              <Text style={styles.ribbonText}>Added to Cart</Text>
            </View>
          )}
        </View>

        <Text style={styles.title}>{item.productName}</Text>

        <View style={styles.ratingContainer}>
          <Rating
            type="star"
            ratingCount={5}
            imageSize={20}
            readonly
            startingValue={item.ratings.averageRating}
            style={styles.rating}
          />
          <Text style={styles.reviewCount}>{item.ratings.numberOfReviews} reviews</Text>
        </View>

        <View style={styles.actionsContainer}>
          <TouchableOpacity style={styles.addToCartButton} onPress={() => openModal(item)}>
            <Text style={styles.addToCartText}>Add to Cart</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const handleAddToCart = async (product: Product) => {
    // Get the selected size (default to 'Regular' if not selected)
    const size = selectedSizes[product.productId] || 'Regular';

    const selectedPrice = product.price[size];
    const selectedDiscount = 0;

    const payload = {
      phone_number: 7417422095,  // Make sure to fetch this from user session or state
      product_id: product.productId,
      quantity: 1,               // You can replace with dynamically selected quantity
      price: selectedPrice,
      discount: selectedDiscount,
      size: size
    };

    try {
      const response = await fetch('http://192.168.29.14:8002/cart/addItemToCart', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      console.log("API Response:", data);

      if (response.ok) {
        // Successfully added to cart, update the state
        setCart((prevCart) => ({
          ...prevCart,
          [product.productId]: {
            quantity: 1,  // Set the quantity correctly based on your cart logic
            price: selectedPrice,
            discount: selectedDiscount,
          },
        }));

        // Close the modal after adding the item to the cart
        setIsModalVisible(false);
      } else {
        console.error('Error adding item to cart:', data.message || 'Unknown error');
      }
    } catch (error) {
      console.error('Error during API call:', error);
    }
  };

  const closeModal = () => {
    // Slide the modal back down when closing
    Animated.timing(modalSlideAnim, {
      toValue: 0,  // Move modal down to hide it
      duration: 300,
      useNativeDriver: true,
    }).start();

    setTimeout(() => {
      setIsModalVisible(false);  // Set visibility to false after animation completes
    }, 300);
  };

  return (
    <View style={{ flex: 1 }}>
      <FlatList
        data={products}
        keyExtractor={(item) => item.productId}
        renderItem={renderProduct}
        numColumns={2}
        columnWrapperStyle={styles.row}
      />

      {/* Conditionally render the modal based on `isModalVisible` */}
      {isModalVisible && (
        <Modal
          visible={isModalVisible}
          onRequestClose={closeModal}
          transparent={true}
          animationType="fade"
        >
          <TouchableWithoutFeedback onPress={closeModal}>
            <Animated.View
              style={[styles.modalContainer, { opacity: fadeOutAnimation }]}>
              <Animated.View
                style={[
                  styles.modalContent,
                  {
                    transform: [
                      {
                        translateY: modalSlideAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [500, 0], // Slide-up effect
                        }),
                      },
                    ],
                  },
                ]}
              >
                {currentProduct && (
                  <>
                    <Text style={styles.modalTitle}>{currentProduct.productName}</Text>

                    <View style={styles.sizeContainer}>
                      {['Regular', 'Large', 'XL'].map((size) => (
                        <TouchableOpacity
                          key={size}
                          style={[
                            styles.sizeButton,
                            selectedSizes[currentProduct.productId] === size && styles.selectedSizeButton,
                          ]}
                          onPress={() => setSelectedSizes((prev) => ({ ...prev, [currentProduct.productId]: size }))}>
                          <Text style={styles.sizeButtonText}>{size}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>

                    <Text style={styles.price}>
                      {`${currentProduct.currency} ${currentProduct.price[selectedSizes[currentProduct.productId] || 'Regular']}`}
                    </Text>

                    <View style={styles.actionsContainer}>
                      <TouchableOpacity onPress={() => modifyCart(currentProduct, selectedSizes[currentProduct.productId], 'decrement')}>
                        <Text>-</Text>
                      </TouchableOpacity>

                      <Text>{cart[currentProduct.productId]?.quantity || 0}</Text>

                      <TouchableOpacity onPress={() => modifyCart(currentProduct, selectedSizes[currentProduct.productId], 'increment')}>
                        <Text>+</Text>
                      </TouchableOpacity>
                    </View>

                    <TouchableOpacity
                      style={styles.addToCartButton}
                      onPress={() => handleAddToCart(currentProduct)}
                    >
                      <Text style={styles.addToCartText}>Add to Cart</Text>
                    </TouchableOpacity>
                  </>
                )}
              </Animated.View>
            </Animated.View>
          </TouchableWithoutFeedback>
        </Modal>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flex: 1,
    justifyContent: 'space-evenly',
  },
  productContainer: {
    width: '45%',
    marginVertical: 10,
  },
  imageContainer: {
    position: 'relative',
  },
  image: {
    width: '100%',
    height: 150,
    borderRadius: 8,
  },
  ribbon: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: '#ff6f61',
    padding: 5,
    borderRadius: 8,
  },
  ribbonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  title: {
    marginTop: 10,
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  ratingContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginVertical: 5,
  },
  reviewCount: {
    fontSize: 12,
    color: '#888',
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  addToCartButton: {
    backgroundColor: '#ff6f61',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginTop: 10,
  },
  addToCartText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    width: '80%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  sizeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  sizeButton: {
    padding: 10,
    backgroundColor: '#f1f1f1',
    borderRadius: 5,
  },
  selectedSizeButton: {
    backgroundColor: '#ff6f61',
  },
  sizeButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  price: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 15,
  },
});

export default ProductList;
