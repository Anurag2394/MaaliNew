import React, { useEffect, useState, useCallback } from 'react';
import { View, FlatList, Image, Text, StyleSheet, TouchableOpacity, Modal, Animated, TouchableWithoutFeedback } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { getSupplierData } from '@/utiles/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Rating } from 'react-native-ratings'; // Import Rating component
import config from '@/config';

type Product = {
  _id: { $oid: string };
  productId: string;
  productName: string;
  category: string;
  description: string;
  price: {};
  currency: string;
  quantity: {};
  images: string[]; // Array of image URLs
  ratings: { averageRating: number; numberOfReviews: number }; // Ratings object
  tags: string[];
  quantity_map: {};
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
  const [soldOutMessage, setSoldOutMessage] = useState(''); // To display sold out message

  const { product } = useLocalSearchParams();
  const router = useRouter();

  const queryTags = product || 'plants/cacti';

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const suppliers = await getSupplierData();
        const ids = suppliers.map(s => s.supplier_id);
        const productRequestPayload = { tags: [queryTags], supplier_id: ids };

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
        setProducts([]);
        console.error('Failed to fetch products:', error);
      }
    };

    fetchProducts();
  }, [queryTags]);

  // Modify Cart Quantity (increment or decrement)
  const modifyCart = useCallback(async (product: Product, size: string, action: 'increment' | 'decrement') => {
    console.log(product, size, '&&&&&')
    const currentQuantity = quantity;
    const availableStock = product.quantity[size] || 0; // Get the stock for the selected size
    let newQuantity = currentQuantity;

    if (action === 'increment') {
      // Prevent incrementing if the quantity exceeds available stock
      if (newQuantity < availableStock) {
        newQuantity += 1;
      } else {
        setSoldOutMessage('Sold out');
        return; // Early exit to prevent adding more
      }
    } else if (action === 'decrement' && currentQuantity > 1) {
      newQuantity -= 1;
    }

    const selectedSize = selectedSizes[product.productId] || 'Regular';
    const selectedPrice = product.price[selectedSize];

    setCart((prevCart) => ({
      ...prevCart,
      [product.productId]: {
        quantity: newQuantity,
        price: selectedPrice,
        discount: 0,  // Set discount if needed
      },
    }));

    setQuantity(newQuantity);
  }, [cart, selectedSizes]);


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


  // Handle Add to Cart Action
  const handleAddToCart = async (product: Product) => {
    const size = selectedSizes[product.productId] || 'Regular';
    const selectedPrice = product.price[size];
    const selectedDiscount = 0; // Set discount if needed

    const currentQuantity = cart[product.productId]?.quantity || 1;
    const availableStock = product.quantity[size] || 0; // Get the stock for the selected size

    if (currentQuantity > availableStock) {
      // If trying to add more than available stock, show "sold out"
      setSoldOutMessage('Sold out');
      return; // Stop adding to cart
    }

     const suppliers = await getSupplierData();

    const payload = {
      phone_number: 7417422095,  // Make sure to fetch this from user session or state
      product_id: product.productId,
      quantity: currentQuantity,
      price: selectedPrice,
      discount: selectedDiscount,
      quantityMap: product.quantity_map,
      supplierData: suppliers,
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

      if (data.status === 200) {
        await fetchCartItemCount('7417422095')
        setCart((prevCart) => ({
          ...prevCart,
          [product.productId]: {
            quantity: currentQuantity,
            price: selectedPrice,
            discount: selectedDiscount,
          },
        }));

        // Trigger modal closing animation
        Animated.timing(modalSlideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }).start();

        // Wait for the animation to finish before hiding the modal
        setTimeout(() => {
          setIsModalVisible(false);
        }, 300);

        
      } else {
        console.error('Error adding item to cart:', data.message || 'Unknown error');
      }
    } catch (error) {
      console.error('Error during API call:', error);
    }
  };

  const openModal = (product: Product) => {
    console.log(product, 'Product');
    setCurrentProduct(product);
    const sizes = Object.keys(product.price);
    setIsModalVisible(true);
    setQuantity(1);
    setSelectedSizes((prev) => ({ ...prev, [product.productId]: sizes[0] }));
    modalSlideAnim.setValue(0);

    Animated.timing(modalSlideAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const closeModal = () => {
    Animated.timing(modalSlideAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();

    setTimeout(() => {
      setIsModalVisible(false);
    }, 300);
  };

  const renderProduct = ({ item }: { item: Product }) => {
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
      {products.length > 0 ? (
        <FlatList
          data={products}
          keyExtractor={(item) => item.productId}
          renderItem={renderProduct}
          numColumns={2}
          columnWrapperStyle={styles.row}
        />
      ) : (
        <Text style={styles.noData}>No result Found</Text>
      )}

      {isModalVisible && currentProduct && (
        <Modal visible={isModalVisible} onRequestClose={closeModal} transparent={true} animationType="fade">
          <TouchableWithoutFeedback onPress={closeModal}>
            <Animated.View style={[styles.modalContainer, { opacity: fadeOutAnimation }]}>
              <Animated.View
                style={[
                  styles.modalContent,
                  {
                    transform: [
                      {
                        translateY: modalSlideAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [500, 0],
                        }),
                      },
                    ],
                  },
                ]}
              >
                <Text style={styles.modalTitle}>{currentProduct.productName}</Text>

                <View style={styles.sizeContainer}>
                  {Object.keys(currentProduct.price).map((size) => (
                    <TouchableOpacity
                      key={size}
                      style={[
                        styles.sizeButton,
                        selectedSizes[currentProduct.productId] === size && styles.selectedSizeButton,
                      ]}
                      onPress={() => {
                        setSelectedSizes((prev) => ({ ...prev, [currentProduct.productId]: size }));
                        setQuantity(1);
                        if(currentProduct.quantity[size] === 0) {
                          setSoldOutMessage('Sold Out')
                        } else {
                        setSoldOutMessage(false);
                        }
                      }}
                    >
                      <Text style={styles.sizeButtonText}>{size}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={styles.price}>
                  {`${currentProduct.currency} ${currentProduct.price[selectedSizes[currentProduct.productId] || 'Regular']}`}
                </Text>

                {!soldOutMessage && <View style={styles.quantityContainer}>
                  <TouchableOpacity
                    style={styles.quantityButton}
                    onPress={() => modifyCart(currentProduct, selectedSizes[currentProduct.productId], 'decrement')}
                  >
                    <Text style={styles.quantityText}>-</Text>
                  </TouchableOpacity>
                  <Text style={styles.quantityText}>{quantity}</Text>
                  <TouchableOpacity
                    style={styles.quantityButton}
                    onPress={() => modifyCart(currentProduct, selectedSizes[currentProduct.productId], 'increment')}
                  >
                    <Text style={styles.quantityText}>+</Text>
                  </TouchableOpacity>
                </View>}

               <View style={styles.buttonGroup}> 
                {!soldOutMessage ? <TouchableOpacity
                  style={styles.addToCartButton}
                  onPress={() => handleAddToCart(currentProduct)}
                >
                  <Text style={styles.addToCartText}>Add to Cart</Text>
                </TouchableOpacity> : <Text style={styles.soldOutText}>{soldOutMessage}</Text>}

                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={closeModal}
                >
                  <Text style={styles.closeButtonText}>Close</Text>
                </TouchableOpacity>
                </View>
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
  noData: {
    display: 'flex',
    justifyContent: 'center',
    margin: 100,
    fontSize: 20,
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
  buttonGroup: {
   display: 'flex'
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
    justifyContent: 'space-between',
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
    backgroundColor: 'rgba(0, 0, 0, 0.4)',  // Slightly less opaque background for better visibility
  },
  modalContent: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    width: '50%',  // Reduced width to give a margin on the sides
    shadowColor: '#000',  // Adding shadow to the modal for a floating effect
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 10,
    elevation: 5,  // For Android shadow effect
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  sizeContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    justifyContent: 'space-between',  // Space out size options evenly
  },
  sizeButton: {
    padding: 12,
    borderWidth: 1,
    borderRadius: 10,
    flex: 1,  // Make buttons take equal space
    margin: 5,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f7f7f7',
  },
  selectedSizeButton: {
    backgroundColor: '#28a745',
    borderColor: '#28a745',  // Border color for selected state
  },
  sizeButtonText: {
    fontSize: 16,
    color: '#333',
  },
  price: {
    fontSize: 22,
    fontWeight: 'bold',
    marginLeft: 10,
    marginBottom: 20,
    color: '#333',
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  quantityButton: {
    backgroundColor: '#f0f0f0',
    padding: 10,
    borderRadius: 5,
    marginHorizontal: 10,
  },
  quantityText: {
    fontSize: 18,
    color: '#333',
  },
  soldOutText: {
    color: 'red',
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 10,
  },
  closeButton: {
    backgroundColor: '#d9534f',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 15,
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default ProductList;
function getCartItemCountFromStorage() {
  throw new Error('Function not implemented.');
}

