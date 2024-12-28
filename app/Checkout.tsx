import React, { useEffect, useState } from 'react';
import { ScrollView, View, Text, TextInput, Alert, TouchableOpacity, StyleSheet, Image } from 'react-native';
import config from '@/config';

const CheckoutPage = () => {
  const [items, setItems] = useState([]);
  const [phoneNumber, setPhoneNumber] = useState(7417422095); // Assuming you get the phone number from some state or context
  const [user, setUser] = useState({
    name: '',
    email: '',
    address: '',
  });
  const [subtotal, setSubtotal] = useState(0); // To store subtotal fetched from API
  const [loading, setLoading] = useState(false);

  // Fetch cart details and calculate subtotal on mount
  const fetchCartDetails = async () => {
    try {
      setLoading(true); // Start loading
      const response = await fetch(`${config.CART_URL}/cart/getCartDetails`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phone_number: phoneNumber }), // Sending phone_number as body parameter
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
            body: JSON.stringify({ phone_number: phoneNumber }), // Sending phone_number as body parameter for subtotal
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
          setItems([]); // Clear items if none are fetched
          setSubtotal(0); // Reset subtotal
        }
      }
      setLoading(false); // Stop loading
    } catch (error) {
      console.error('Error fetching cart details or subtotal:', error);
      setLoading(false);
      Alert.alert('Error', 'Something went wrong while fetching the data.');
    }
  };

  useEffect(() => {
    fetchCartDetails();
  }, [phoneNumber]);

  // Handle quantity update
  const handleUpdateQuantity = (itemId, operation, size) => {
    const updatedItems = items.map(item => {
      if (item.product_id === itemId && item.size === size) {
        let updatedQuantity = item.quantity || 0;

        if (operation === 'increment') {
          updatedQuantity += 1;
        } else if (operation === 'decrement' && updatedQuantity > 1) {
          updatedQuantity -= 1;
        } else if (operation === 'decrement' && updatedQuantity === 1) {
          handleRemoveItem(itemId, size);
          return null; // Remove item from list if quantity reaches 0
        }

        // Update the quantity locally
        return { ...item, quantity: updatedQuantity };
      }
      return item;
    }).filter(item => item !== null); // Filter out any null items (those removed from the cart)

    setItems(updatedItems);

    // Call updateCartQuantity with the updated size
    const item = updatedItems.find(item => item.product_id === itemId);
    const quantity1 = item ? item.quantity : 0;  // Default to 0 if the item is not found
    
    updateCartQuantity(itemId, quantity1, size);
  };

  // Update the quantity in the backend
  const updateCartQuantity = (itemId, newQuantity, size) => {
    fetch(`${config.CART_URL}/cart/updateItemQuantity`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        product_id: itemId,
        phone_number: phoneNumber,
        quantity: newQuantity,
        size: size, // Include size in the request body
      }),
    })
      .then(response => response.json())
      .then(data => {
        if (data.status !== 200) {
          Alert.alert('Error', 'Failed to update item quantity.');
        }
      })
      .catch(error => {
        console.error('Error updating quantity:', error);
        Alert.alert('Error', 'Failed to update item quantity.');
      });
  };

  // Handle item removal
  const handleRemoveItem = (itemId, size) => {
    fetch(`${config.CART_URL}/cart/removeItemFromCart`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ product_id: itemId, phone_number: phoneNumber, size:size, soft_delete: 1 }),
    })
      .then(response => response.json())
      .then(data => {
        if (data.status === 200) {
          fetchCartDetails(); // Re-fetch cart details after removing the item
          Alert.alert('Success', 'Item removed from cart.');
        } else {
          Alert.alert('Error', 'There was an issue removing the item.');
        }
      })
      .catch(error => {
        console.error('Error removing item:', error);
        Alert.alert('Error', 'Failed to remove the item.');
      });
  };

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

      {/* Cart Items Section */}
      <View style={styles.section}>
        <Text style={styles.sectionHeader}>Items</Text>
        {items.length === 0 ? (
          <Text>No items in the cart.</Text>
        ) : (
          items.map(item => (
            <View style={styles.itemContainer} key={`${item.product_id}-${item.size}`}>
              <View style={styles.item}>
                <Image
                  source={{ uri: item.image_url.replace('dl=0', 'raw=1') }}
                  style={styles.itemImage}
                />
                <Text>{item.size}</Text>
                <Text style={styles.itemText}>{item.product_name} x {item.quantity}</Text>
                <Text style={styles.itemText}>${(item.price * item.quantity).toFixed(2)}</Text>
              </View>
              <View style={styles.quantityContainer}>
                <TouchableOpacity onPress={() => handleUpdateQuantity(item.product_id, 'decrement', item.size)}>
                  <Text style={styles.quantityButton}>-</Text>
                </TouchableOpacity>
                <Text style={styles.quantityText}>{item.quantity}</Text>
                <TouchableOpacity onPress={() => handleUpdateQuantity(item.product_id, 'increment', item.size)}>
                  <Text style={styles.quantityButton}>+</Text>
                </TouchableOpacity>
              </View>
              
            </View>
          ))
        )}
      </View>

      {/* Shipping Details Section */}
      <View style={styles.section}>
        <Text style={styles.sectionHeader}>Shipping Details</Text>
        <TextInput
          style={styles.input}
          placeholder="Name"
          value={user.name}
          onChangeText={text => setUser({ ...user, name: text })}
        />
        <TextInput
          style={styles.input}
          placeholder="Email"
          value={user.email}
          onChangeText={text => setUser({ ...user, email: text })}
        />
        <TextInput
          style={styles.input}
          placeholder="Address"
          value={user.address}
          onChangeText={text => setUser({ ...user, address: text })}
        />
      </View>

      {/* Total Section */}
      <View style={styles.total}>
        <Text style={styles.totalText}>Total: ${subtotal.toFixed(2)}</Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 15,
    backgroundColor: '#fff',
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  section: {
    marginBottom: 20,
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
    marginBottom: 10,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemImage: {
    width: 60,
    height: 60,
    marginRight: 10,
  },
  itemText: {
    fontSize: 16,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quantityButton: {
    fontSize: 18,
    marginHorizontal: 10,
    padding: 5,
    backgroundColor: '#f0f0f0',
    borderRadius: 5,
  },
  quantityText: {
    fontSize: 16,
  },
  removeButton: {
    marginTop: 10,
    backgroundColor: 'red',
    padding: 10,
    borderRadius: 5,
  },
  removeButtonText: {
    color: '#fff',
    fontSize: 16,
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
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 18,
  },
});

export default CheckoutPage;
