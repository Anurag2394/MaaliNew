import React, { useState, useEffect } from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons'; 
import Constants from 'expo-constants';
import config from '@/config';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getSupplierData, setSupplierData } from '@/utiles/auth';

export default function GetLocation() {
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [address, setAddress] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState<boolean>(true); // Default to false to hide on first launch
  const [suppliers, setSuppliers]= useState([]);
  const fadeAnim = useState(new Animated.Value(0))[0]; // For fade-in effect
  const isWeb = Constants.platform?.ios === undefined && Constants.platform?.android === undefined;
// Replace with your OpenCage Geocoding API key
   const OPEN_CAGE_API_KEY = '174ea5a27c68446aba60e697d724daa4'; 

  // Function to request location permission
  const requestLocationPermission = async (): Promise<boolean> => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      setErrorMsg('Permission to access location was denied');
      return false;
    }
    return true;
  };


  // Function to send location data to the backend
  const getNearbySuppliers = async (latitude: number, longitude: number, region: string ) => {
    try {
      const response = await fetch(`${config.BASE_URL}/productCatalog/getNearBySuppliers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          lat:latitude,
          long:longitude,
          region
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch suppliers');
      }

      const data = await response.json();
      setSuppliers(data.results); // Assuming the API returns a list of suppliers
       await setSupplierData(data.results);
       setModalVisible(false)
    } catch (error) {
      setErrorMsg('Error fetching nearby suppliers');
    }
  };

  // Function to reverse geocode the location
  const reverseGeocodeLocation = async (latitude: number, longitude: number) => {
    try {

      if (isWeb) {
        // Use OpenCage API for reverse geocoding in the browser
        const response = await fetch(`https://api.opencagedata.com/geocode/v1/json?q=${latitude}+${longitude}&key=${OPEN_CAGE_API_KEY}`);
        const data = await response.json();
        if (data.results.length > 0) {
          const result = data.results[0];
          const address = `${result.formatted}`;
          setAddress(address);
          const region = result.components.state; // Use the state component as region
          getNearbySuppliers(latitude, longitude, region);
        } else {
          setErrorMsg('Address could not be found');
        }
      } else {
      const [result] = await Location.reverseGeocodeAsync({ latitude, longitude });
      if (result) {
        const address = `${result.formattedAddress}`;
        setAddress(address);
        getNearbySuppliers(latitude, longitude, result.region)

      } else {
        setErrorMsg('Address could not be found');
      }
    } }catch (error) {
      setErrorMsg('Error fetching address');
    }
  };

  // Function to get current location with high accuracy
const getLocation = async () => {
  const hasPermission = await requestLocationPermission();
  if (hasPermission) {
    try {
      if (isWeb) {
        // For web, use the browser's geolocation API
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const { latitude, longitude } = position.coords;
            setLocation({ latitude, longitude });
            await reverseGeocodeLocation(latitude, longitude);
            setModalVisible(false); // Hide modal after getting location
          },
          (error) => {
            setErrorMsg('Error getting location: ' + error.message);
          },
          { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
        );
      } else {
        // For native devices, use expo-location
        const { coords } = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
          timeInterval: 5000,
          distanceInterval: 1,
        });

        setLocation({ latitude: coords.latitude, longitude: coords.longitude });
        await reverseGeocodeLocation(coords.latitude, coords.longitude);
        setModalVisible(false); // Hide modal after getting location
      }
    } catch (error) {
      setErrorMsg('Error getting location');
    }
  }
};

  // Check if the user has already interacted with the modal (granted/denied location permissions)
  const checkModalStatus = async () => {
    const modalStatus = await AsyncStorage.getItem('locationModalShown');
    if (!modalStatus) {
      setModalVisible(true); // Show modal if the user has not interacted with it yet
    }
  };

  // Set modal as closed in AsyncStorage when the user closes it
  const handleCloseModal = async () => {
    await AsyncStorage.setItem('locationModalShown', 'true');
    setModalVisible(false);
  };

  // Fade-in effect for modal
  useEffect(() => {
    checkModalStatus(); // Check if modal should be shown on app load
    if (modalVisible) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }).start();
    } else {
      fadeAnim.setValue(0); // Reset opacity when modal is hidden
    }
  }, [modalVisible]); // Only trigger the fade animation when modalVisible changes



  return (
    <View style={styles.container}>
      {/* Modal for requesting location */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={handleCloseModal} // Close modal on back press
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

            <TouchableOpacity onPress={handleCloseModal} style={styles.closeButton}>
              <Text style={styles.buttonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
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
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f7f7f7', // Light grey background
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)', // Darker overlay for modal
  },
  modalContent: {
    backgroundColor: '#4C6E91', // Professional blue background
    padding: 40,
    borderRadius: 25,
    alignItems: 'center',
    width: '85%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 15 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 10, // Floating effect on Android
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
    color: '#e0e0e0', // Light grey for message
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
    backgroundColor: '#5E81AC', // Softer blue button
    paddingVertical: 16,
    paddingHorizontal: 60,
    borderRadius: 40,
    marginVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 5, // Adds shadow to the button
  },
  closeButton: {
    backgroundColor: '#FF7043', // Red button to close
    paddingVertical: 16,
    paddingHorizontal: 60,
    borderRadius: 40,
    marginTop: 10,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 5, // Adds shadow to the button
  },
  buttonText: {
    fontSize: 18,
    color: '#ffffff',
    fontWeight: '600',
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
