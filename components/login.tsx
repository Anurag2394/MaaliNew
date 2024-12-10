import React, { useState } from 'react';
import { View, TextInput, Button, Text, StyleSheet, Alert, TouchableOpacity, ImageBackground } from 'react-native';
import config from '@/config';
import { useNavigation } from '@react-navigation/native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage'; // Import AsyncStorage
import { setToken, getToken, removeToken } from '@/utiles/auth'; // Import token functions

const Login = (props) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const navigation = useNavigation();

  // Function to save the tokens securely in AsyncStorage
  const saveTokens = async (accessToken, refreshToken) => {  
    try {
      await setToken(accessToken); // Save only the access token with the same key
      //await AsyncStorage.setItem('refresh_token', refreshToken); // Save refresh token with a separate key
      console.log('Tokens saved!');
    } catch (error) {
      console.error('Error saving tokens', error);
    }
  };

  // Function to retrieve the access token from AsyncStorage
  const getAccessToken = async () => {
    try {
      const token = await getToken(); // Use the utility function to get the token
      return token;
    } catch (error) {
      console.error('Error retrieving access token', error);
      return null;
    }
  };

  // Function to handle sending OTP
  const sendOtp = async () => {
    if (!phoneNumber) {
      Alert.alert('Validation Error', 'Please enter a valid phone number.');
      return;
    }

    setIsLoading(true);

    try {
      const response = await axios.post(`${config.LOGIN_URL}/account/sendOtp`, {
        phone_number: phoneNumber,
      });

      if (response.status === 200) {
        Alert.alert('Success', 'OTP sent to your phone!');
        setOtpSent(true);
      } else {
        Alert.alert('Error', 'Failed to send OTP. Please try again.');
      }
    } catch (error) {
      Alert.alert('Error', 'Something went wrong. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  // Function to handle verifying OTP
  const verifyOtp = async () => {
    if (!otp) {
      Alert.alert('Validation Error', 'Please enter the OTP.');
      return;
    }

    setIsLoading(true);

    try {
      const response = await axios.post(`${config.LOGIN_URL}/account/verifyOtp`, {
        phone_number: phoneNumber,
        otp,
      });

      if (response.status === 200) {
        const { access, refresh } = response.data.results; // Assuming the response contains both tokens
         
        // Save the tokens
        await saveTokens(access, refresh);

        Alert.alert('Success', 'You are now logged in!');
        props.loginHandler(true); // Pass a function to update the parent component state
      } else {
        Alert.alert('Error', 'Invalid OTP. Please try again.');
      }
    } catch (error) {
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Function to handle skipping the login flow (e.g., in case of guest login)
  const handleSkip = () => {
    props.loginHandler(true); // Set login state to true and proceed
  };

  // Function to handle logout (clearing the tokens)
  const logout = async () => {
    try {
      await removeToken(); // Remove the access token using the utility function
      await AsyncStorage.removeItem('refresh_token'); // Remove the refresh token
      console.log('Tokens removed');
      props.loginHandler(false); // Update parent component to reflect user is logged out
    } catch (error) {
      console.error('Error clearing tokens', error);
    }
  };

  return (
    <ImageBackground
      source={require('@/assets/images/plant1.jpg')} // You can replace this with any plant image or gradient
      style={styles.container}
      imageStyle={styles.backgroundImage}
    >
      <View style={styles.overlay}>
        <Text style={styles.title}>Login</Text>

        {/* Phone Number Input */}
        {!otpSent ? (
          <TextInput
            style={styles.input}
            placeholder="Enter Phone Number"
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            keyboardType="phone-pad"
            maxLength={10}
            placeholderTextColor="#fff"
          />
        ) : (
          <TextInput
            style={styles.input}
            placeholder="Enter OTP"
            value={otp}
            onChangeText={setOtp}
            keyboardType="number-pad"
            maxLength={6}
            placeholderTextColor="#fff"
          />
        )}

        {/* Send OTP or Verify OTP Button */}
        {!otpSent ? (
          <TouchableOpacity
            style={[styles.button, { backgroundColor: isLoading ? '#ccc' : '#6DBE45' }]}
            onPress={sendOtp}
            disabled={isLoading}
          >
            <Text style={styles.buttonText}>{isLoading ? 'Sending OTP...' : 'Send OTP'}</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.button, { backgroundColor: isLoading ? '#ccc' : '#4CAF50' }]}
            onPress={verifyOtp}
            disabled={isLoading}
          >
            <Text style={styles.buttonText}>{isLoading ? 'Verifying OTP...' : 'Verify OTP'}</Text>
          </TouchableOpacity>
        )}

        {/* Skip Button */}
        <TouchableOpacity
          style={styles.skipButton}
          onPress={handleSkip}
          disabled={isLoading}
        >
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>

     
      </View>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlay: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)', // Dark overlay to improve text contrast
    paddingHorizontal: 20,
    paddingVertical: 30,
    borderRadius: 10,
    width: '90%',
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 40,
    color: '#fff',
    textAlign: 'center',
  },
  input: {
    width: '100%',
    height: 50,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#fff',
    marginBottom: 15,
    paddingLeft: 15,
    fontSize: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.7)', // Slight transparency for natural look
    color: '#333',
  },
  button: {
    width: '100%',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 15,
  },
  buttonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
  skipButton: {
    marginTop: 10,
  },
  skipText: {
    fontSize: 14,
    color: '#fff',
  },
  logoutButton: {
    marginTop: 20,
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: '#E74C3C',
    borderRadius: 10,
    alignItems: 'center',
  },
  logoutText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  backgroundImage: {
    opacity: 0.6, // Add some opacity to the background to make text stand out
    borderRadius: 10,
  },
});

export default Login;