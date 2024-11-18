import React, { useState, useEffect } from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet } from 'react-native';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';

export default function App() {
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [address, setAddress] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState<boolean>(true);

  // Function to request location permission
  const requestLocationPermission = async (): Promise<boolean> => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      setErrorMsg('Permission to access location was denied');
      return false;
    }
    return true;
  };

  // Function to reverse geocode the location
  const reverseGeocodeLocation = async (latitude: number, longitude: number) => {
    try {
      const [result] = await Location.reverseGeocodeAsync({ latitude, longitude });
      if (result) {
        const address = `${result.name}, ${result.city}, ${result.region}, ${result.country}`;
        setAddress(address);
      } else {
        setErrorMsg('Address could not be found');
      }
    } catch (error) {
      setErrorMsg('Error fetching address');
    }
  };

  // Function to get current location with high accuracy
  const getLocation = async () => {
    const hasPermission = await requestLocationPermission();
    if (hasPermission) {
      try {
        // Ensure you are getting the highest accuracy available
        const { coords } = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High, // Highest accuracy
          timeInterval: 5000, // Timeout after 5 seconds if location is not available
          distanceInterval: 1, // Minimum movement in meters to update location
        });

        setLocation({ latitude: coords.latitude, longitude: coords.longitude });
        await reverseGeocodeLocation(coords.latitude, coords.longitude); // Get address after fetching location
        setModalVisible(false); // Hide modal after getting location
      } catch (error) {
        setErrorMsg('Error getting location');
      }
    }
  };

  return (
    <View style={styles.container}>
      {/* Modal for requesting location */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Ionicons name="location-sharp" size={48} color="#5E81AC" />
            <Text style={styles.modalTitle}>We need access to your location</Text>
            <Text style={styles.modalMessage}>
              This helps us provide the best experience tailored to your location.
            </Text>
            {errorMsg && <Text style={styles.error}>{errorMsg}</Text>}
            
            <TouchableOpacity onPress={getLocation} style={styles.getLocationButton}>
              <Text style={styles.buttonText}>Get My Location</Text>
            </TouchableOpacity>
            
            <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeButton}>
              <Text style={styles.buttonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Show the address if available */}
      {address && (
        <View style={styles.addressContainer}>
          <Text style={styles.addressText}>{address}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)', // Dark overlay for modal
  },
  modalContent: {
    backgroundColor: '#ffffff',
    padding: 30,
    borderRadius: 15,
    alignItems: 'center',
    width: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 10, // For Android shadow
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginVertical: 15,
  },
  modalMessage: {
    fontSize: 16,
    color: '#555',
    marginVertical: 10,
    textAlign: 'center',
  },
  error: {
    color: 'red',
    marginTop: 10,
    fontSize: 14,
    textAlign: 'center',
  },
  getLocationButton: {
    backgroundColor: '#4CAF50', // Green button
    paddingVertical: 15,
    paddingHorizontal: 50,
    borderRadius: 30,
    marginVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButton: {
    backgroundColor: '#FF7043', // Red button to close
    paddingVertical: 15,
    paddingHorizontal: 50,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontSize: 16,
    color: 'white',
    fontWeight: '600',
  },
  addressContainer: {
    marginTop: 20,
  },
  addressText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
});
