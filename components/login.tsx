import React, { useState } from 'react';
import { View, TextInput, Button, Text, StyleSheet, Alert, TouchableOpacity, ImageBackground } from 'react-native';
import config from '@/config';
import { useNavigation } from '@react-navigation/native';
import axios from 'axios';

const Login = (props) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const navigation = useNavigation();

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
        Alert.alert('Success', 'You are now logged in!');
        props.loginHandler(true)
      } else {
        Alert.alert('Error', 'Invalid OTP. Please try again.');
      }
    } catch (error) {
      Alert.alert('Error', 'Please enter valid OTP.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkip = () => {
     props.loginHandler(true)
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
  signupText: {
    marginTop: 20,
    fontSize: 14,
    color: '#fff',
  },
  signupLink: {
    color: '#6DBE45', // Earthy green tone for links
  },
  backgroundImage: {
    opacity: 0.6, // Add some opacity to the background to make text stand out
    borderRadius: 10,
  },
});

export default Login;
