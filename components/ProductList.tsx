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
  const [isItemAdded, setIsItemAdded] = useState(false);
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
  
    // Debugging log to check the payload
    const payload = {
      phone_number: 7417422095,  // Make sure it's a valid number
      product_id: product.productId,  // Make sure productId is valid
      quantity: newQuantity,
    };
  
    console.log("Payload being sent:", payload);
  
    try {
      const response = await fetch('http://192.168.29.43:8002/cart/updateItemQuantity', {
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

      // Slide the modal up
      Animated.timing(modalSlideAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    };
   
    const navigateToProductDetail = () => {
      router.push(`/productDetail/${item.productId}`);
    };


    return (
      <View style={styles.productContainer}>
        <View style={styles.imageContainer} >
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

        {/* Display the star rating */}
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
    setIsItemAdded(true);
  
    // Trigger the fade-out animation for the "Go to Cart" button after 4 seconds
    setTimeout(() => {
      Animated.timing(fadeOutAnimation, {
        toValue: 0,
        duration: 1000,
        useNativeDriver: true,
      }).start();
    }, 4000);
  
    // Get the selected size (default to 'Regular' if not selected)
    const size = selectedSizes[product.productId] || 'Regular';
    
    // Get the price for the selected size
    const selectedPrice = product.price[size];
    
    // Set discount to 0 (You can modify this logic as per your requirements)
    const selectedDiscount = 0;
  
    // Log the values of the payload before making the API request
    console.log("Payload being sent to API:", {
      phone_number: 7417422095,  // Make sure to dynamically fetch this
      product_id: product.productId,
      quantity: 1,               // You can modify this if you allow quantity to be changed
      price: selectedPrice,
      discount: selectedDiscount
    });
  
    // Define the payload for the API request
    const payload = {
      phone_number: 7417422095,  // Make sure to fetch this from user session or state
      product_id: product.productId,
      quantity: 1,               // You can replace with dynamically selected quantity
      price: selectedPrice,
      discount: selectedDiscount,
    };
  
    try {
      // Make the API call to add the item to the cart
      const response = await fetch('http://192.168.29.43:8002/cart/addItemToCart', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
  
      // Log the response to check the API result
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
    Animated.timing(modalSlideAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();

    setTimeout(() => {
      setIsModalVisible(false); // Hide modal after animation
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
                        outputRange: [500, 0], // Slide up effect
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

                  <View style={styles.quantityContainer}>
                    <TouchableOpacity onPress={() => modifyCart(currentProduct, selectedSizes[currentProduct.productId] || 'Regular', 'decrement')}>
                      <Text style={styles.quantityButton}>-</Text>
                    </TouchableOpacity>
                    <Text style={styles.quantityText}>{cart[currentProduct.productId]?.quantity || 0}</Text>
                    <TouchableOpacity onPress={() => modifyCart(currentProduct, selectedSizes[currentProduct.productId] || 'Regular', 'increment')}>
                      <Text style={styles.quantityButton}>+</Text>
                    </TouchableOpacity>
                  </View>

                  <TouchableOpacity style={styles.addToCartButton} onPress={() => handleAddToCart(currentProduct)}>
                    <Text style={styles.addToCartText}>Add to Cart</Text>
                  </TouchableOpacity>

                  {isItemAdded && (
                    <View style={styles.itemAddedText}>
                      <Text>Item added to cart!</Text>
                      <TouchableOpacity
                        style={styles.goToCartButton}
                        onPress={() => router.push('/Checkout')}>
                        <Text style={styles.goToCartText}>Go to Cart</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </>
              )}
            </Animated.View>
          </Animated.View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  productContainer: {
    flex: 1,
    margin: 10,
    alignItems: 'center',
  },
  imageContainer: {
    position: 'relative',
  },
  image: {
    width: 150,
    height: 150,
  },
  ribbon: {
    position: 'absolute',
    top: 0,
    left: 0,
    backgroundColor: 'red',
    padding: 5,
    borderRadius: 5,
  },
  ribbonText: {
    color: 'white',
    fontSize: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 10,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 5,
  },
  rating: {
    marginRight: 5,
  },
  reviewCount: {
    fontSize: 12,
    color: 'gray',
  },
  actionsContainer: {
    marginTop: 10,
  },
  addToCartButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 5,
  },
  addToCartText: {
    color: 'white',
    fontWeight: 'bold',
  },
  row: {
    justifyContent: 'space-around',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 20,
    width: '100%',
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  sizeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 10,
  },
  sizeButton: {
    padding: 10,
    backgroundColor: '#f0f0f0',
    borderRadius: 5,
  },
  selectedSizeButton: {
    backgroundColor: '#4CAF50',
  },
  sizeButtonText: {
    fontSize: 16,
    color: '#000',
  },
  price: {
    fontSize: 18,
    fontWeight: 'bold',
    marginVertical: 10,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 10,
  },
  quantityButton: {
    fontSize: 24,
    fontWeight: 'bold',
    paddingHorizontal: 10,
  },
  quantityText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginHorizontal: 20,
  },
  itemAddedText: {
    marginTop: 10,
    alignItems: 'center',
  },
  goToCartButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 5,
  },
  goToCartText: {
    color: 'white',
    fontWeight: 'bold',
  },
});

export default ProductList;
