import React, { useState, useEffect } from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import config from '@/config';
import { getUserAddress, setUserAddress, getSupplierData, setSupplierData,  } from '@/utiles/auth';

export default function GetLocation() {
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [address, setAddress] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState<boolean>(false); // Set modal to hidden by default
  const [userAddress, setGetUserAddress] = useState<string | null>(null);
  const [suppliers, setSuppliers] = useState([]);
  const fadeAnim = useState(new Animated.Value(0))[0]; // For fade-in effect

  const OPEN_CAGE_API_KEY = '174ea5a27c68446aba60e697d724daa4'; // API key for OpenCage Geocoding
  const isWeb = Constants.platform?.ios === undefined && Constants.platform?.android === undefined;

  // Request location permission from the user
  const requestLocationPermission = async (): Promise<boolean> => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      setErrorMsg('Permission to access location was denied');
      return false;
    }
    return true;
  };

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

  // Send location data to the backend to fetch nearby suppliers
  const getNearbySuppliers = async (latitude: number, longitude: number, region: string) => {
    try {
      const response = await fetch(`${config.BASE_URL}/productCatalog/getNearBySuppliers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          lat: latitude,
          long: longitude,
          region,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch suppliers');
      }

      const data = await response.json();
      setSuppliers(data.results);
      await setSupplierData(data.results); // Save the fetched suppliers in storage
      setModalVisible(false); // Hide the modal after data is fetched
    } catch (error) {
      setErrorMsg('Error fetching nearby suppliers');
    }
  };

  // Reverse geocode location (get address from latitude and longitude)
  const reverseGeocodeLocation = async (latitude: number, longitude: number) => {
    try {
      if (isWeb) {
        const response = await fetch(`https://api.opencagedata.com/geocode/v1/json?q=${latitude}+${longitude}&key=${OPEN_CAGE_API_KEY}`);
        const data = await response.json();
        if (data.results.length > 0) {
          const result = data.results[0];
          const address = `${result.formatted}`;
          setAddress(address);
          setUserAddress(address);
          const region = result.components.state;
          getNearbySuppliers(latitude, longitude, region);
          await fetchCartItemCount('7417422095')
        } else {
          setErrorMsg('Address could not be found');
        }
      } else {
        const [result] = await Location.reverseGeocodeAsync({ latitude, longitude });
        if (result) {
          const address = `${result.formattedAddress}`;
          setAddress(address);
          setUserAddress(address);
          getNearbySuppliers(latitude, longitude, result.region);
          await fetchCartItemCount('7417422095')
        } else {
          setErrorMsg('Address could not be found');
        }
      }
    } catch (error) {
      setErrorMsg('Error fetching address');
    }
  };

  // Fetch current location using Expo Location API
  const getLocation = async () => {
    const hasPermission = await requestLocationPermission();
    if (hasPermission) {
      try {
        if (isWeb) {
          navigator.geolocation.getCurrentPosition(
            async (position) => {
              const { latitude, longitude } = position.coords;
              setLocation({ latitude, longitude });
              await reverseGeocodeLocation(latitude, longitude);
              await AsyncStorage.setItem('locationModalShown', 'true');
              setModalVisible(false); // Close the modal once location is fetched
            },
            (error) => {
              setErrorMsg('Error getting location: ' + error.message);
            },
            { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
          );
        } else {
          const { coords } = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.High,
            timeInterval: 5000,
            distanceInterval: 1,
          });

          setLocation({ latitude: coords.latitude, longitude: coords.longitude });
          await reverseGeocodeLocation(coords.latitude, coords.longitude);
          await AsyncStorage.setItem('locationModalShown', 'true');
          setModalVisible(false); // Close the modal once location is fetched
        }
      } catch (error) {
        setErrorMsg('Error getting location');
      }
    }
  };

  // Check if the user has already interacted with the location modal
  const checkModalStatus = async () => {
    const modalStatus = await AsyncStorage.getItem('locationModalShown');
    if (!modalStatus) {
      setModalVisible(true); // Show modal if not interacted before
    }
  };

  // Close modal and set it in AsyncStorage when closed
  const handleCloseModal = async () => {
    await AsyncStorage.setItem('locationModalShown', 'true');
    setModalVisible(false);
  };

  // Fade-in animation for modal
  useEffect(() => {
    const fetchUserAddress = async () => {
      const savedAddress = await getUserAddress();
      setGetUserAddress(savedAddress);
    };

    fetchUserAddress();
    checkModalStatus(); // Check the status of the modal on app load

    if (modalVisible) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }).start();
    } else {
      fadeAnim.setValue(0); // Reset opacity when modal is hidden
    }
  }, [modalVisible]); // Trigger when modal visibility changes

  return (
    <View style={styles.container}>
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={handleCloseModal}
      >
        <Animated.View style={[styles.modalOverlay, { opacity: fadeAnim }]}>
          <View style={styles.modalContent}>
            <Ionicons name="location-sharp" size={90} color="#ffffff" />
            <Text style={styles.modalTitle}>We need access to your location</Text>
            <Text style={styles.modalMessage}>
              Enabling location access helps us deliver the best experience tailored just for you.
            </Text>
            {errorMsg && <Text style={styles.error}>{errorMsg}</Text>}

            <TouchableOpacity onPress={getLocation} style={styles.getLocationButton}>
              <Text style={styles.buttonText}>Allow Location</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </Modal>

      {userAddress ? (
        <View style={styles.addressContainer}>
          <Text style={styles.addressText}>{userAddress}</Text>
        </View>
      ) : (
        <Text>No saved address</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f7f7f7',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#4C6E91',
    padding: 40,
    borderRadius: 25,
    alignItems: 'center',
    width: '85%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 15 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 10,
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: 28,
    fontWeight: '600',
    color: '#ffffff',
    marginVertical: 20,
  },
  modalMessage: {
    fontSize: 18,
    color: '#e0e0e0',
    marginVertical: 20,
    textAlign: 'center',
    lineHeight: 24,
  },
  error: {
    color: 'red',
    marginTop: 15,
    fontSize: 14,
    textAlign: 'center',
  },
  getLocationButton: {
    backgroundColor: '#5E81AC',
    paddingVertical: 16,
    paddingHorizontal: 60,
    borderRadius: 40,
    marginVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 5,
  },
  addressContainer: {
    marginTop: 0,
    backgroundColor: '#fff'
  },
  addressText: {
    fontSize: 10,
    fontWeight: 'bold',
    width: 200,
    color: '#333',
    textAlign: 'center',
  },
});

