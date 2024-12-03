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
  const [quantity, setQuantity] = useState(1);
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

  // Modify Cart Quantity (increment or decrement)
  const modifyCart = useCallback(async (product: Product, size: string, action: 'increment' | 'decrement') => {
    // Fetch the current quantity for the selected product and size from the cart state
    const currentQuantity = cart[product.productId]?.quantity || 1;
    let newQuantity = currentQuantity;

    if (action === 'increment') {
      newQuantity += 1;
    } else if (action === 'decrement' && currentQuantity > 1) {
      newQuantity -= 1;
    }

    // Ensure selected size exists and is valid
    const selectedSize = selectedSizes[product.productId] || 'Regular';
    const selectedPrice = product.price[selectedSize];

    // Update the cart with the new quantity for the specific product and size
    setCart((prevCart) => ({
      ...prevCart,
      [product.productId]: {
        quantity: newQuantity,
        price: selectedPrice,
        discount: 0,  // Set discount if needed
      },
    }));

    // Optionally update the local `quantity` state to reflect the current quantity for the modal
    setQuantity(newQuantity); // This will update the `quantity` state that can be displayed in the modal
  }, [cart, selectedSizes]);

  // Handle Add to Cart Action
  const handleAddToCart = async (product: Product) => {
    // Get the selected size (default to 'Regular' if not selected)
    const size = selectedSizes[product.productId] || 'Regular';

    const selectedPrice = product.price[size];
    const selectedDiscount = 0; // Set discount if needed

    const currentQuantity = cart[product.productId]?.quantity || 1; // Use the quantity from the cart state
    const payload = {
      phone_number: 7417422095,  // Make sure to fetch this from user session or state
      product_id: product.productId,
      quantity: currentQuantity,  // Use the dynamically updated quantity
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

      if (response.ok) {
        // Successfully added to cart, update the state
        setCart((prevCart) => ({
          ...prevCart,
          [product.productId]: {
            quantity: currentQuantity,  // Update the quantity correctly based on your cart logic
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

  const renderProduct = ({ item }: { item: Product }) => {
    console.log(item,'item!!!!', cart)
    //const isInCart = cart[item.productId]?.quantity > 0;

    const navigateToProductDetail = () => {
      router.push(`/productDetail/${item.productId}/${item.category}`);
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
          {/* {isInCart && (
            <View style={styles.ribbon}>
              <Text style={styles.ribbonText}>Added to Cart</Text>
            </View>
          )} */}
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
              style={[styles.modalContainer, { opacity: fadeOutAnimation }]}
            >
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

                      <Text>{cart[currentProduct.productId]?.quantity || 1}</Text> {/* Display the updated quantity from the cart state */}

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
    borderRadius: 10,
  },
  ribbon: {
    position: 'absolute',
    top: 0,
    left: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 5,
    borderRadius: 5,
  },
  ribbonText: {
    color: '#fff',
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
  },
  rating: {
    marginRight: 5,
  },
  reviewCount: {
    fontSize: 12,
    color: '#888',
  },
  actionsContainer: {
    marginTop: 10,
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  addToCartButton: {
    backgroundColor: '#28a745',
    padding: 10,
    borderRadius: 5,
  },
  addToCartText: {
    color: '#fff',
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
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  sizeContainer: {
    flexDirection: 'row',
    marginBottom: 15,
  },
  sizeButton: {
    padding: 10,
    borderWidth: 1,
    marginRight: 10,
    borderRadius: 5,
  },
  selectedSizeButton: {
    backgroundColor: '#28a745',
    color: '#fff'
  },
  sizeButtonText: {
    fontSize: 16,
  },
  price: {
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default ProductList;
