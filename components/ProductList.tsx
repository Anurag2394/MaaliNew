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

  // Modify cart (add, increment, decrement)
  const modifyCart = useCallback(async (product: Product, size: string, action: 'increment' | 'decrement') => {
    const selectedPrice = product.price[size];
    const selectedDiscount = 0;
    const currentQuantity = cart[product.productId]?.quantity || 0;

    let newQuantity = currentQuantity;

    if (action === 'increment') {
      newQuantity += 1;
    } else if (action === 'decrement' && currentQuantity > 0) {
      newQuantity -= 1;
    }

    const payload = {
      phone_number: 7417422095,
      product_id: product.productId,
      quantity: newQuantity,
      price: selectedPrice,
      discount: selectedDiscount,
    };

    try {
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
          price: selectedPrice,
          discount: selectedDiscount,
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

  const handleAddToCart = (product: Product) => {
    setIsItemAdded(true);
    // Trigger the fade-out animation for the "Go to Cart" button after 4 seconds
    setTimeout(() => {
      Animated.timing(fadeOutAnimation, {
        toValue: 0,
        duration: 1000,
        useNativeDriver: true,
      }).start();
    }, 4000);

    // Add the product to the cart
    modifyCart(product, selectedSizes[product.productId] || 'Regular', 'increment');

    // Close the modal after adding the item to the cart
    setIsModalVisible(false);
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
                        onPress={() => router.push('/cart')}>
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
