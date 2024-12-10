import AsyncStorage from '@react-native-async-storage/async-storage';

// Save token to storage
export const setToken = async (token) => {
  await AsyncStorage.setItem('refresh_token', token); // Save user token
};

// Get token from storage
export const getToken = async () => {
  return await AsyncStorage.getItem('refresh_token'); // Retrieve user token
};

// Remove token from storage
export const removeToken = async () => {
  await AsyncStorage.removeItem('refresh_token'); // Remove user token
};
