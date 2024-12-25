import React, { useState } from 'react';
import { View, TextInput, Button, Text, StyleSheet, Alert, TouchableOpacity, ImageBackground } from 'react-native';
import config from '@/config';
import GetLocation from './GetLocation';
import { useNavigation } from '@react-navigation/native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage'; 
import { setToken, getToken, removeToken, setAccessToken, getAccessToken, removeAccessToken } from '@/utiles/auth'; 

// Authentication service (move logic to a separate file, e.g., authService.js)
const sendOtp = async (phoneNumber) => {
  try {
    const response = await axios.post(`${config.LOGIN_URL}/account/sendOtp`, { phone_number: phoneNumber });
    return response.data;
  } catch (error) {
    throw error;
  }
};

const verifyOtp = async (phoneNumber, otp) => {
  try {
    const response = await axios.post(`${config.LOGIN_URL}/account/verifyOtp`, { phone_number: phoneNumber, otp });
    return response.data;
  } catch (error) {
    throw error;
  }
};

const refreshAccessToken = async () => {
  try {
    const refreshToken = await getToken();
    if (!refreshToken) {
      console.log('No refresh token found');
      return null;
    }

    const response = await axios.post(`${config.LOGIN_URL}/account/api/token/refresh/`, {
      refresh_token: refreshToken,
    });

    if (response.status === 200) {
      await setAccessToken(response.data.access);
      return response.data.access;
    } else {
      console.log('Failed to refresh token');
      return null;
    }
  } catch (error) {
    console.error('Error refreshing access token:', error);
    return null;
  }
};

const Login = (props) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const navigation = useNavigation();

  // Function to handle saving tokens
  const saveTokens = async (accessToken, refreshToken) => {  
    try {
      await setToken(refreshToken); 
      await setAccessToken(accessToken); 
      console.log('Tokens saved!');
    } catch (error) {
      console.error('Error saving tokens', error);
    }
  };

  // Function to handle OTP send
  const sendOtpHandler = async () => {
    if (!phoneNumber) {
      Alert.alert('Validation Error', 'Please enter a valid phone number.');
      return;
    }

    setIsLoading(true);

    try {
      const response = await sendOtp(phoneNumber);

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

  // Function to handle OTP verification
  const verifyOtpHandler = async () => {
    if (!otp) {
      Alert.alert('Validation Error', 'Please enter the OTP.');
      return;
    }

    setIsLoading(true);

    try {
      const response = await verifyOtp(phoneNumber, otp);

      if (response.status === 200) {
        const { access, refresh } = response.data.results; 
        await saveTokens(access, refresh); 
        Alert.alert('Success', 'You are now logged in!');
        props.loginHandler(true); // Update login state in parent component
      } else {
        Alert.alert('Error', 'Invalid OTP. Please try again.');
      }
    } catch (error) {
      Alert.alert('Error', 'Something went wrong. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  // Function to handle skipping the login flow
  const handleSkip = () => {
    props.loginHandler(true); // Proceed without login
  };

  // Function to handle logout
  const logout = async () => {
    try {
      await removeToken();
      await removeAccessToken();
      console.log('Logged out');
      props.loginHandler(false); // Update parent component to reflect logout
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  return (
    <ImageBackground
      source={require('@/assets/images/plant1.jpg')}
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
            onPress={sendOtpHandler}
            disabled={isLoading}
          >
            <Text style={styles.buttonText}>{isLoading ? 'Sending OTP...' : 'Send OTP'}</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.button, { backgroundColor: isLoading ? '#ccc' : '#4CAF50' }]}
            onPress={verifyOtpHandler}
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
      

        {/* Logout Button (if logged in) */}
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={logout}
        >
          <Text style={styles.logoutText}>Logout</Text>
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
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
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
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
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
    opacity: 0.6,
    borderRadius: 10,
  },
});

export default Login;
