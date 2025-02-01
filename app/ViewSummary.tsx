import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ScrollView } from 'react-native';
import { Card, List } from 'react-native-paper';
import mockOrders from '../app/(tabs)/mockData'; // Importing mock order data
import { router } from 'expo-router';

const ViewSummary = () => {
  return (
    <ScrollView style={styles.container}>
      {/* Previous Orders Section */}
      <Card style={styles.card}>
        <Card.Title title="Previous Orders" left={(props) => <List.Icon {...props} icon="history" />} />
        <FlatList
          data={mockOrders}
          renderItem={({ item }) => (
            <View style={[styles.orderItem, getOrderSpacing(item.status)]}>
              <Text style={styles.orderDate}>Date: {item.date}</Text>
              <Text style={[styles.orderStatus, getStatusStyle(item.status)]}>Status: {item.status}</Text>
              {item.items.map((product, index) => (
                <View key={index} style={styles.productSummary}>
                  <Text style={styles.productName}>{product.name}</Text>
                  <Text style={styles.productPrice}>{product.quantity} x {product.price}</Text>
                </View>
              ))}
              {/* Get Help Button (styled as a link) */}
              <TouchableOpacity onPress={() => router.push('/GetHelpScreen')} style={styles.getHelpContainer}>
                <Text style={styles.getHelpLink}>Need Help?</Text>
              </TouchableOpacity>
            </View>
          )}
          keyExtractor={(item) => item.id}
        />
      </Card>
    </ScrollView>
  );
};

// Helper function to apply color to order status
const getStatusStyle = (status) => {
  switch (status) {
    case 'Delivered':
      return { color: '#28a745' }; // Green for Delivered
    case 'Pending':
      return { color: '#ffc107' }; // Yellow for Pending
    case 'Cancelled':
      return { color: '#dc3545' }; // Red for Cancelled
    default:
      return { color: '#6c757d' }; // Grey for unknown status
  }
};

// Helper function to apply dynamic spacing based on status
const getOrderSpacing = (status) => {
  switch (status) {
    case 'Delivered':
      return { paddingBottom: 20 }; // More space after delivered orders
    case 'Pending':
      return { paddingBottom: 15 }; // Moderate space for pending orders
    case 'Cancelled':
      return { paddingBottom: 30 }; // More space after cancelled orders (highlight)
    default:
      return { paddingBottom: 10 }; // Default space for unknown statuses
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa', // Soft light gray background for a clean feel
    paddingTop: 20,
  },
  card: {
    marginVertical: 12,
    marginHorizontal: 18,
    borderRadius: 8,
    backgroundColor: '#fff',
    elevation: 3, // Slight shadow to give depth
    borderColor: '#e0e0e0',
    borderWidth: 1,
  },
  orderItem: {
    paddingVertical: 18,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  orderDate: {
    fontSize: 16,
    fontWeight: '500', // Slightly lighter weight for the date
    color: '#495057', // Dark gray for text
  },
  orderStatus: {
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 5,
  },
  productSummary: {
    marginTop: 12,
  },
  productName: {
    fontSize: 16,
    fontWeight: '600', // Make the product name stand out more
    color: '#212529', // Darker color for product name
  },
  productPrice: {
    fontSize: 14,
    color: '#868e96', // Light gray for price
    marginTop: 4,
  },
  getHelpContainer: {
    marginTop: 15,
    alignItems: 'center',
  },
  getHelpLink: {
    fontSize: 15,
    color: '#007bff',
    textDecorationLine: 'underline',
    fontWeight: '500', // Slightly lighter weight to feel more modern
  },
});

export default ViewSummary;
