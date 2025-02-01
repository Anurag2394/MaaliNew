import { router } from 'expo-router';
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Card, List } from 'react-native-paper';

const ProfileScreen = () => {
  return (
    <ScrollView style={styles.container}>
      {/* Wallet Section */}
      <Card style={[styles.card, { backgroundColor: '#E3F2FD' }]}> {/* Light Blue Card */}
        <Card.Title 
          title="Wallet" 
          subtitle="Balance: $500" 
          left={(props) => <List.Icon {...props} icon="wallet" color="#0D47A1" />} // Blue icon
          titleStyle={styles.cardTitle}
          subtitleStyle={styles.cardSubtitle}
        />
      </Card>

      {/* Phone Number Section */}
      <Card style={[styles.card, { backgroundColor: '#FFEBEE' }]}> {/* Light Red Card */}
        <Card.Title 
          title="Phone Number" 
          subtitle="+123 456 7890" 
          left={(props) => <List.Icon {...props} icon="phone" color="#D32F2F" />} // Red icon
          titleStyle={styles.cardTitle}
          subtitleStyle={styles.cardSubtitle}
        />
      </Card>

      {/* View Summary Section */}
      <TouchableOpacity style={styles.viewSummaryButton} onPress={() => router.push('/ViewSummary')}>
        <Text style={styles.viewSummaryText}>View Summary</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9f9f9', // Light grey background for the main screen
    paddingTop: 20,
  },
  card: {
    marginVertical: 10,
    marginHorizontal: 15,
    borderRadius: 10,
    elevation: 5, // Shadow effect for cards
    borderColor: '#e0e0e0',
    borderWidth: 1,
    paddingVertical: 15, // Add padding inside the card for spacing
    paddingHorizontal: 10,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333', // Dark text color for the card title
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#666', // Lighter color for the card subtitle
  },
  viewSummaryButton: {
    marginVertical: 20,
    marginHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#007bff', // Blue color for the button
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewSummaryText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
});

export default ProfileScreen;
