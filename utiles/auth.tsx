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

// Save token to storage
export const setAccessToken = async (token) => {
  await AsyncStorage.setItem('access_token', token); // Save user token
};

// Get token from storage
export const getAccessToken = async () => {
  return await AsyncStorage.getItem('access_token'); // Retrieve user token
};

// Remove token from storage
export const removeAccessToken = async () => {
  await AsyncStorage.removeItem('access_token'); // Remove user token
};


export const getUserAddress = async (): Promise<string | null> => {
  try {
    const address = await AsyncStorage.getItem('userAddress');
    return address; // Returns null if the address is not found
  } catch (error) {
    console.error('Error getting user address from AsyncStorage:', error);
    return null;
  }
};

export const setUserAddress = async (address: string): Promise<void> => {
  try {
    await AsyncStorage.setItem('userAddress', address);
  } catch (error) {
    console.error('Error saving user address to AsyncStorage:', error);
  }
};


export const setSupplierData = async (data) => {
  try {
    // Store the supplier data as a stringified JSON object
    await AsyncStorage.setItem('supplierData', JSON.stringify(data));
  } catch (error) {
    console.error('Error saving supplier data:', error);
  }
};

export const getSupplierData = async () => {
  try {
    const data = await AsyncStorage.getItem('supplierData');
    
    // Log the retrieved data
    console.log('Data retrieved from AsyncStorage:', data);
    
    if (data !== null) {
      // Return the parsed data if it exists
      return JSON.parse(data);
    } else {
      console.log('No supplier data found');
      return null; // Return null if no data is found
    }
  } catch (error) {
    console.error('Error fetching supplier data:', error);
    return null; // Return null in case of error
  }
};

