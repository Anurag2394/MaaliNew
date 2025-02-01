import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Button } from 'react-native-paper';

const GetHelpScreen = () => {
  // Handle contacting customer care
  const handleContactSupport = () => {
    Alert.alert("Contact Support", "You can reach us at +1 (800) 123-4567.");
  };

  return (
    <ScrollView style={styles.container}>
      {/* Header Section */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Get Help</Text>
        <Text style={styles.headerSubtitle}>For immediate assistance, contact our customer care.</Text>
      </View>

      {/* Customer Care Number */}
      <View style={styles.contactSection}>
        <Text style={styles.contactTitle}>Customer Care</Text>
        <Text style={styles.contactNumber}>+1 (800) 123-4567</Text>
        <Text style={styles.contactDescription}>Call us for any assistance or inquiries.</Text>
      </View>

      {/* Contact Support Button */}
      <TouchableOpacity onPress={handleContactSupport} style={styles.contactButton} >
        <Button mode="contained" style={styles.contactButtonText}>Call Customer Care</Button>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7f7f7',
    padding: 20,
  },
  header: {
    marginBottom: 20,
    textAlign: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 10,
  },
  contactSection: {
    marginTop: 30,
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    elevation: 5,
  },
  contactTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  contactNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007bff',
    marginTop: 10,
  },
  contactDescription: {
    fontSize: 14,
    color: '#555',
    marginTop: 10,
  },
  contactButton: {
    marginTop: 20,
  },
  contactButtonText: {
    backgroundColor: '#28a745',
  },
});

export default GetHelpScreen;
