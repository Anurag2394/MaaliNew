import React, { useEffect, useState } from 'react';
import { View, FlatList, Image, Text, StyleSheet, TouchableOpacity } from 'react-native';
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

const ProductList = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedSizes, setSelectedSizes] = useState<{ [key: string]: string }>({});
  const [cart, setCart] = useState<{ [key: string]: { quantity: number; price: number; discount: number } }>({});
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

  // Add item to cart and make API call
  const addToCart = async (product: Product, size: string) => {
    const selectedPrice = product.price[size];
    const selectedDiscount = 0; // Assuming no discount for simplicity
    const phoneNumber = 7417422095; // Replace with actual user phone number
    
    const payload = {
      phone_number: phoneNumber,
      product_id: product.productId,
      quantity: 1, // Default quantity
      price: selectedPrice,
      discount: selectedDiscount,
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
      console.log(data, 'Cart item added');
      
      // Update the cart state
      setCart((prevCart) => ({
        ...prevCart,
        [product.productId]: {
          quantity: (prevCart[product.productId]?.quantity || 0) + 1,
          price: selectedPrice,
          discount: selectedDiscount,
        },
      }));
    } catch (error) {
      console.error('Error adding to cart:', error);
    }
  };

  // Increment item quantity in cart
  const incrementQuantity = async (productId: string) => {
    try {
      const updatedQuantity = (cart[productId]?.quantity || 0) + 1;
      const phoneNumber = 7417422095; // Replace with actual user phone number

      const payload = {
        phone_number: phoneNumber,
        product_id: productId,
        quantity: updatedQuantity,
      };

      const response = await fetch('http://192.168.29.14:8002/cart/updateItemQuantity', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      console.log(data, 'Quantity updated');

      // If the API call is successful, update the cart state
      setCart((prevCart) => ({
        ...prevCart,
        [productId]: {
          ...prevCart[productId],
          quantity: updatedQuantity,
        },
      }));
    } catch (error) {
      console.error('Error incrementing quantity:', error);
    }
  };

  // Decrement item quantity in cart
  const decrementQuantity = async (productId: string) => {
    try {
      const updatedQuantity = Math.max((cart[productId]?.quantity || 0) - 1, 0);
      const phoneNumber = 7417422095; // Replace with actual user phone number

      const payload = {
        phone_number: phoneNumber,
        product_id: productId,
        quantity: updatedQuantity,
      };

      const response = await fetch('http://192.168.29.14:8002/cart/updateItemQuantity', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      console.log(data, 'Quantity updated');

      // If the API call is successful, update the cart state
      setCart((prevCart) => ({
        ...prevCart,
        [productId]: {
          ...prevCart[productId],
          quantity: updatedQuantity,
        },
      }));

      // If quantity reaches 0, remove the item from the cart
      if (updatedQuantity === 0) {
        const updatedCart = { ...cart };
        delete updatedCart[productId];
        setCart(updatedCart);
      }
    } catch (error) {
      console.error('Error decrementing quantity:', error);
    }
  };

  const renderProduct = ({ item }: { item: Product }) => {
    const selectedSize = selectedSizes[item.productId] || 'Regular';
    const isInCart = cart[item.productId]?.quantity > 0;

    return (
      <View style={styles.productContainer}>
        <Image source={{ uri: item.images[0].replace('dl=0', 'raw=1') }} style={styles.image} />
        <Text style={styles.title}>{item.productName}</Text>
        <View style={styles.sizeContainer}>
          {['Regular', 'Large', 'XL'].map((size) => (
            <TouchableOpacity
              key={size}
              style={[styles.sizeButton, selectedSize === size && styles.selectedSizeButton]}
              onPress={() => setSelectedSizes(prev => ({ ...prev, [item.productId]: size }))}>
              <Text style={styles.sizeButtonText}>{size}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text style={styles.price}>{`${item.currency} ${item.price[selectedSize]}`}</Text>

        <View style={styles.actionsContainer}>
          {/* Show "Add to Cart" button only if the item is not already in the cart */}
          {!isInCart && (
            <TouchableOpacity style={styles.addToCartButton} onPress={() => addToCart(item, selectedSize)}>
              <Text style={styles.addToCartText}>Add to Cart</Text>
            </TouchableOpacity>
          )}
          
          {/* Quantity Adjuster */}
          {isInCart && (
            <View style={styles.quantityContainer}>
              <TouchableOpacity onPress={() => decrementQuantity(item.productId)}>
                <Text style={styles.quantityButton}>-</Text>
              </TouchableOpacity>
              <Text style={styles.quantityText}>{cart[item.productId]?.quantity}</Text>
              <TouchableOpacity onPress={() => incrementQuantity(item.productId)}>
                <Text style={styles.quantityButton}>+</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
    <FlatList
      data={products}
      keyExtractor={(item) => item.productId}
      renderItem={renderProduct}
      numColumns={2}
      columnWrapperStyle={styles.row}
    />
  );
};

const styles = StyleSheet.create({
  row: {
    justifyContent: 'space-between',
  },
  productContainer: {
    flex: 1,
    alignItems: 'center',
    padding: 10,
    margin: 10,
    backgroundColor: '#fff',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  image: {
    width: 100,
    height: 100,
    borderRadius: 10,
    marginBottom: 10,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  sizeContainer: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  sizeButton: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    padding: 5,
    marginHorizontal: 5,
  },
  selectedSizeButton: {
    backgroundColor: '#ddd',
  },
  sizeButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  price: {
    fontSize: 14,
    color: 'green',
    marginBottom: 5,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  addToCartButton: {
    backgroundColor: '#007BFF',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 5,
  },
  addToCartText: {
    color: '#fff',
    fontSize: 14,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quantityButton: {
    fontSize: 18,
    fontWeight: 'bold',
    padding: 5,
  },
  quantityText: {
    fontSize: 16,
    marginHorizontal: 10,
  },
});

export default ProductList;
