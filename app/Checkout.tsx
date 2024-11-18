// App.js or CheckoutPage.js
import React, { useState } from 'react';
import { ScrollView, View, Text, TextInput, Button, StyleSheet } from 'react-native';

const CheckoutPage = () => {
  // Sample product items in the cart
  const [items, setItems] = useState([
    { id: 1, name: 'Product 1', price: 20, quantity: 1 },
    { id: 2, name: 'Product 2', price: 15, quantity: 2 },
  ]);
  
  // User details (you can replace with state if needed)
  const [user, setUser] = useState({
    name: '',
    email: '',
    address: '',
  });

  // Calculate total cost
  const calculateTotal = () => {
    return items.reduce((total, item) => total + item.price * item.quantity, 0);
  };

  const handleCheckout = () => {
    alert('Checkout successful!');
    // You would typically send this data to a backend here
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.header}>Checkout</Text>

      <View style={styles.section}>
        <Text style={styles.sectionHeader}>Items</Text>
        {items.map(item => (
          <View key={item.id} style={styles.item}>
            <Text>{item.name} x {item.quantity}</Text>
            <Text>${item.price * item.quantity}</Text>
          </View>
        ))}
      </View>

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

      <View style={styles.total}>
        <Text style={styles.totalText}>Total: ${calculateTotal()}</Text>
      </View>

      <Button title="Checkout" onPress={handleCheckout} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  section: {
    marginBottom: 20,
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  item: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  input: {
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    marginBottom: 10,
    paddingHorizontal: 10,
  },
  total: {
    marginBottom: 20,
    alignItems: 'flex-end',
  },
  totalText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default CheckoutPage;
