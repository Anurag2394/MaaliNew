import React, { useState } from 'react';
import { View, TextInput, Button, Text, StyleSheet, Alert } from 'react-native';
import config from '@/config';
import { useNavigation } from '@react-navigation/native';
import axios from 'axios'; // Add Axios or your preferred HTTP client

const login = () => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false); // Flag to track OTP sent status
  const navigation = useNavigation();

  // Function to send OTP to the phone number
  const sendOtp = async () => {
    if (!phoneNumber) {
      Alert.alert('Validation Error', 'Please enter your phone number.');
      return;
    }

    setIsLoading(true);

    try {
      // Replace with your actual OTP sending API (e.g., Twilio, Firebase)
      const response = await axios.post(`${config.LOGIN_URL}/account/sendOtp`, {
        phone_number: phoneNumber,
      });

      if (response.status === 200) {
        Alert.alert('Success', 'OTP sent to your phone!');
        setOtpSent(true); // Mark OTP as sent
      } else {
        Alert.alert('Error', 'Failed to send OTP. Please try again.');
      }
    } catch (error) {
      Alert.alert('Error', 'Something went wrong. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  // Function to verify the OTP and log in
  const verifyOtp = async () => {
    if (!otp) {
      Alert.alert('Validation Error', 'Please enter the OTP.');
      return;
    }

    setIsLoading(true);

    try {
      // Replace with your actual OTP verification API
      const response = await axios.post(`${config.LOGIN_URL}/account/verifyOtp`, {
        phone_number: phoneNumber,
        otp,
      });

      if (response.status === 200) {
        Alert.alert('Success', 'You are now logged in!');
        navigation.navigate('Home'); // Navigate to the Home screen
      } else {
        Alert.alert('Error', 'Invalid OTP. Please try again.');
      }
    } catch (error) {
      Alert.alert('Error', 'Something went wrong. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  // Function to handle skip
  const handleSkip = () => {
    // Navigate to the Home screen (or any other screen you prefer)
    navigation.navigate('Home');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Login</Text>

      {/* Phone Number Input */}
      {!otpSent ? (
        <TextInput
          style={styles.input}
          placeholder="Enter Phone Number"
          value={phoneNumber}
          onChangeText={setPhoneNumber}
          keyboardType="phone-pad"
          maxLength={15} // Adjust maxLength based on your phone number format
        />
      ) : (
        // OTP Input Section after OTP is sent
        <TextInput
          style={styles.input}
          placeholder="Enter OTP"
          value={otp}
          onChangeText={setOtp}
          keyboardType="number-pad"
          maxLength={6} // Assuming OTP is a 6-digit number
        />
      )}

      {/* Send OTP Button */}
      {!otpSent ? (
        <Button
          title={isLoading ? 'Sending OTP...' : 'Send OTP'}
          onPress={sendOtp}
          disabled={isLoading}
        />
      ) : (
        // Verify OTP Button
        <Button
          title={isLoading ? 'Verifying OTP...' : 'Verify OTP'}
          onPress={verifyOtp}
          disabled={isLoading}
        />
      )}

      {/* Skip Button */}
      <Button
        title="Skip"
        onPress={handleSkip} // Handle skip action
        disabled={isLoading}
      />

      <Text style={styles.signupText}>
        Don't have an account?{' '}
        <Text style={styles.signupLink} onPress={() => navigation.navigate('signUp')}>
          Sign Up
        </Text>
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  input: {
    width: '100%',
    height: 50,
    borderColor: '#ddd',
    borderWidth: 1,
    marginBottom: 15,
    paddingLeft: 10,
    borderRadius: 5,
  },
  signupText: {
    marginTop: 20,
    fontSize: 14,
    color: '#888',
  },
  signupLink: {
    color: '#0066cc',
  },
});

export default login;
