import React, { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ScrollView, View, Text, TextInput, Alert, TouchableOpacity, StyleSheet, Image } from 'react-native';
import config from '@/config';
import { Button } from 'react-native-paper';

const CheckoutPage = () => {
  const [items, setItems] = useState([]);
  const [phoneNumber, setPhoneNumber] = useState(7417422095);
  const [user, setUser] = useState({
    name: '',
    email: '',
    address: '',
  });
  const [subtotal, setSubtotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [soldOut, setSoldOut] = useState('');
  const [soldOutSize, setSoldOutSize] = useState('');
  const [insufficentStock, setInsufficentStock] = useState({ itemId: null, size: null });
  const [overlayLoader, setOverlayLoader] = useState(false); // State to manage loader visibility
  const router = useRouter();

  const fetchCartDetails = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${config.CART_URL}/cart/getCartDetails`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phone_number: phoneNumber }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch cart details');
      }

      const data = await response.json();

      if (data.results) {
        const parsedProducts = typeof data.results === 'string' ? JSON.parse(data.results) : data.results;
        if (parsedProducts.length > 0) {
          setItems(parsedProducts);

          const subtotalResponse = await fetch(`${config.CART_URL}/cartCalculations/calculateSubtotal`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ phone_number: phoneNumber }),
          });

          if (!subtotalResponse.ok) {
            throw new Error('Failed to fetch subtotal');
          }

          const subtotalData = await subtotalResponse.json();

          let cardTotal = typeof subtotalData.results === 'string' ? subtotalData.results : JSON.stringify(subtotalData.results);
          cardTotal = cardTotal.replace(/Decimal\(['"]?([0-9\.]+)['"]?\)/g, (match, p1) => p1);
          cardTotal = JSON.parse(cardTotal.replace(/'/g, '"'));

          if (cardTotal && cardTotal.subtotal) {
            const total = parseFloat(cardTotal.subtotal);
            setSubtotal(total);
          }
        } else {
          setItems([]);
          setSubtotal(0);
        }
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching cart details or subtotal:', error);
      setLoading(false);
      Alert.alert('Error', 'Something went wrong while fetching the data.');
    }
  };

  const clearCart = async () => {
    try {
      setOverlayLoader(true); // Show loader when clearing cart
      const response = await fetch(`${config.CART_URL}/cart/clearCart`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone_number: phoneNumber,
          soft_delete: 1, // Assuming 1 is the value for soft deletion
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to clear cart');
      }

      const data = await response.json();

      if (data.status === 200) {
        Alert.alert('Success', 'Cart has been cleared.');
        AsyncStorage.setItem('cartItemCount', JSON.stringify(0));

        setItems([]); // Empty the items array after successful cart clear

        setSubtotal(0); // Reset the subtotal
      } else {
        Alert.alert('Error', 'Failed to clear the cart.');
      }
    } catch (error) {
      console.error('Error clearing cart:', error);
      Alert.alert('Error', 'Something went wrong while clearing the cart.');
    } finally {
      setOverlayLoader(false); // Hide loader after operation is complete
    }
  };

  useEffect(() => {
    fetchCartDetails();
  }, [phoneNumber]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.header}>Checkout</Text>

      <View style={styles.section}>
        <Text style={styles.sectionHeader}>Items</Text>
        { <Button  onPress={clearCart}>Clear Cart</Button>}
        {items.length === 0 ? (
          <Text>No items in the cart.</Text>
        ) : (
          items.map(item => (
            <View style={styles.itemContainer} key={`${item.product_id}-${item.size}`}>
              {/* Wrap the item in TouchableOpacity to handle navigation */}
              <TouchableOpacity
                onPress={() => router.push(`/productDetail/${item.product_id}/${item.category}/${item.sub_category}`)}
                style={styles.item} // You can style this TouchableOpacity as needed
              >
                <Image
                  source={{ uri: item.image_url.replace('dl=0', 'raw=1') }}
                  style={styles.itemImage}
                />
                <View style={styles.itemDetails}>
                  <Text style={styles.itemName}>{item.product_name}</Text>
                  <Text style={styles.itemSize}>Size: {item.size}</Text>
                  <Text style={styles.itemPrice}>₹{(item.price * item.quantity).toFixed(2)}</Text>
                </View>
              </TouchableOpacity>

              {/* Sold Out message */}
              {item.available_quantity === 0 ? (
                <View style={styles.soldout}>Sold Out</View>
              ) : (
                <View style={styles.stockContainer}>
                  <View style={styles.quantityContainer}>
                    <TouchableOpacity onPress={() => handleUpdateQuantity(item.product_id, 'decrement', item.size)}>
                      <Text style={styles.quantityButton}>-</Text>
                    </TouchableOpacity>
                    <Text style={styles.quantityText}>{item.quantity >= item.available_quantity ? item.available_quantity : item.quantity}</Text>
                    <TouchableOpacity onPress={() => handleUpdateQuantity(item.product_id, 'increment', item.size)}>
                      <Text style={styles.quantityButton}>+</Text>
                    </TouchableOpacity>
                  </View>
                  <View>{item.quantity >= item.available_quantity && <Text style={styles.insufficientStockText}>Insufficient stock. Added available quantity: <Text>{item.available_quantity}</Text></Text>}</View>
                </View>
              )}
            </View>
          ))
        )}
      </View>

      {/* Overlay Loader */}
      {overlayLoader && (
        <View style={styles.overlay}>
          <Text style={styles.loaderText}>Updating...</Text>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 15,
    backgroundColor: '#fff',
  },
  Button: {
    display: 'flex',
    alignItems: 'flex-end',
    backgroundColor: '#000' ,
    padding: 10,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  section: {
    marginBottom: 20,
  },
  soldout: {
    color: 'red'
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  itemContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    padding: 10,
    borderRadius: 10,
    backgroundColor: '#f9f9f9',
    elevation: 2,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemImage: {
    width: 50,
    height: 50,
    marginRight: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff',
  },
  itemDetails: {
    flexDirection: 'column',
    justifyContent: 'center',
  },
  itemName: {
    fontSize: 14,
    fontWeight: 'bold',
    width: 158
  },
  itemSize: {
    fontSize: 14,
    color: '#666',
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stockContainer: {
    flexDirection: 'column',
    width: 100
  },
  quantityButton: {
    fontSize: 20,
    marginHorizontal: 15,
    padding: 5,
    backgroundColor: '#f0f0f0',
    borderRadius: 5,
  },
  quantityText: {
    fontSize: 16,
  },
  removeButton: {
    marginTop: 10,
    backgroundColor: '#e74c3c',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 5,
    alignItems: 'center',
  },
  removeButtonText: {
    color: '#fff',
    fontSize: 14,
  },
  total: {
    marginTop: 20,
    alignItems: 'flex-end',
  },
  totalText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  input: {
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    marginBottom: 10,
    paddingLeft: 10,
    fontSize: 16,
    borderRadius: 5,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 18,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  loaderText: {
    fontSize: 24,
    color: '#fff',
    fontWeight: 'bold',
  },
  insufficientStockText: {
    color: 'red',
    fontSize: 12,
    marginTop: 5,
  },
});

export default CheckoutPage;
