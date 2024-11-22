import React, { useEffect, useState } from 'react';
import { ScrollView, View, Text, TextInput, Alert, TouchableOpacity, StyleSheet, Image } from 'react-native';
import config from '@/config';

const CheckoutPage = () => {
  const [items, setItems] = useState([]);
  const [phoneNumber, setPhoneNumber] = useState(7417422095);  // Assuming you get the phone number from some state or context
  const [user, setUser] = useState({
    name: '',
    email: '',
    address: '',
  });
  const [subtotal, setSubtotal] = useState(0);  // To store subtotal fetched from API
  const [loading, setLoading] = useState(false);

  // Fetch cart details and calculate subtotal on mount
  
  const fetchCartDetails = async () => {
    try {
      setLoading(true);  // Start loading
  
      // Fetch cart details
      const response = await fetch(`${config.CART_URL}/cart/getCartDetails`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phone_number: phoneNumber }), // Sending phone_number as body parameter
      });
  
      // Check if the response is ok (status 200-299)
      if (!response.ok) {
        throw new Error('Failed to fetch cart details');
      }
  
      const data = await response.json();
  
      if (data.results) {
        // Check if results is a string and parse it
        const parsedProducts = typeof data.results === 'string' ? JSON.parse(data.results) : data.results;
        setItems(parsedProducts);
      }
  
      // Now fetch the subtotal from the calculateSubtotal API
      const subtotalResponse = await fetch(`${config.CART_URL}/cartCalculations/calculateSubtotal`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phone_number: phoneNumber }),  // Sending phone_number as body parameter for subtotal
      });
  
      // Check if the response is ok (status 200-299)
      if (!subtotalResponse.ok) {
        throw new Error('Failed to fetch subtotal');
      }
      const subtotalData = await subtotalResponse.json();
  
      // Log subtotalData for debugging
      console.log('subtotalData:', subtotalData);
  
      if (subtotalData && subtotalData.results) {
        // Handle the string with Decimal values and convert to a proper object
        let cardTotal = typeof subtotalData.results === 'string' ? subtotalData.results : JSON.stringify(subtotalData.results);
  
        // Replace Decimal('value') with just the value as a number (string)
        cardTotal = cardTotal.replace(/Decimal\(['"]?([0-9\.]+)['"]?\)/g, (match, p1) => p1);
  
        // Now parse the modified string as JSON
        cardTotal = JSON.parse(cardTotal.replace(/'/g, '"')); // Convert single quotes to double quotes for valid JSON
  
        console.log('Parsed subtotalData:', cardTotal); // Check the structure of the data
  
        if (cardTotal && cardTotal.subtotal) {
          const total = parseFloat(cardTotal.subtotal);
          setSubtotal(total);  // Set the subtotal value
          console.log('Subtotal:', total); // Log the subtotal
        } else {
          console.error('Subtotal not found in response');
        }
      } else {
        console.error('Invalid subtotalData structure or missing results');
      }
  
      setLoading(false);  // Stop loading
    } catch (error) {
      console.error('Error fetching cart details or subtotal:', error);
      setLoading(false);  // Stop loading on error
      Alert.alert('Error', 'Something went wrong while fetching the data.');
    }
  };
  
  
  



  useEffect(() => {
    // Call the fetchCartDetails function when the component mounts or when phoneNumber changes
    fetchCartDetails();
  }, [phoneNumber]); 

  // Handle checkout
  const handleCheckout = () => {
    if (!user.name || !user.email || !user.address) {
      Alert.alert('Error', 'Please fill out all the fields.');
      return;
    }
    // You would typically send this data to a backend here
    Alert.alert('Checkout successful!');
  };

  // Clear cart functionality
  const handleClearCart = () => {
    fetch(`${config.CART_URL}/cart/clearCart`, {
      method: 'POST',  // Assuming this is a POST request to clear the cart
    })
      .then(response => response.text())  // Parse the response as text
      .then(data => {
        if (data === "success") {
          setItems([]); // Clear the cart items from the state
          setSubtotal(0); // Reset subtotal as cart is cleared
          Alert.alert('Success', 'Your cart has been cleared.');
        } else {
          Alert.alert('Error', 'There was an issue clearing your cart.');
        }
      })
      .catch(error => {
        console.error('Error clearing cart:', error);
        Alert.alert('Error', 'Failed to clear the cart.');
      });
  };

  // Handle remove item from cart
  const handleRemoveItem = (itemId) => {
    fetch(`${config.CART_URL}/cart/removeItemFromCart`, {
      method: 'POST',
      headers: {    
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ product_id: itemId, phone_number: phoneNumber, soft_delete: 1 }), // Sending the item ID to remove
    })
      .then(data => {
        if (data.status == 200) {
          // Item was successfully removed, so let's re-fetch the cart details
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
  

  // Log the items after they are updated
  useEffect(() => {
    console.log('Updated Items:', items);
  }, [items]);  // This hook runs whenever `items` is updated

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
            <View style={styles.itemContainer}>
            <View key={item.id} style={styles.item}>
              <Image
              source={{ uri: item.image_url.replace('dl=0', 'raw=1') }}  // Replace to ensure correct URL format
              style={styles.itemImage}  // Added styling for image
            />
              <Text style={styles.itemText}>{item.product_name} x {item.quantity}</Text>
              <Text style={styles.itemText}>${(item.price * item.quantity).toFixed(2)}</Text>
              </View>
              <TouchableOpacity
                style={styles.removeButton}
                onPress={() => handleRemoveItem(item.product_id)}
              >
                <Text style={styles.removeButtonText}>Remove</Text>
              </TouchableOpacity>
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

      {/* Checkout Button */}
      <TouchableOpacity style={styles.checkoutButton} onPress={handleCheckout}>
        <Text style={styles.checkoutButtonText}>Proceed to Checkout</Text>
      </TouchableOpacity>

      {/* Clear Cart Button */}
      <TouchableOpacity style={styles.clearCartButton} onPress={handleClearCart}>
        <Text style={styles.clearCartButtonText}>Clear Cart</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  header: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#333',
  },
  section: {
    marginBottom: 20,
  },
  sectionHeader: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#555',
  },
  itemContainer: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  item: {
    display: 'flex',
    flexDirection: 'row',
    marginBottom: 15,
    alignItems: 'center',
    justifyContent: 'center'
  },
  itemImage: {
    width: 50,    // Adjust width as needed
    height: 50,   // Adjust height as needed
    borderRadius: 5, // Optional: for rounded corners
    marginRight: 10, // Optional: add space between image and text
  },
  itemText: {
    fontSize: 16,
    color: '#333',
  },
  input: {
    height: 45,
    borderColor: '#ccc',
    borderWidth: 1,
    marginBottom: 15,
    paddingHorizontal: 10,
    borderRadius: 5,
    backgroundColor: '#f9f9f9',
  },
  total: {
    marginBottom: 25,
    alignItems: 'flex-end',
  },
  totalText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  checkoutButton: {
    backgroundColor: '#28a745',
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
  },
  checkoutButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  clearCartButton: {
    backgroundColor: '#dc3545',
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
    marginTop: 10,
  },
  clearCartButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  removeButton: {
    backgroundColor: '#f44336',
    padding: 5,
    height: 28,
    borderRadius: 5,
  },
  removeButtonText: {
    color: '#fff',
    fontSize: 12,
  },
});

export default CheckoutPage;
