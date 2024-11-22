import AsyncStorage from '@react-native-async-storage/async-storage';

export const getUserSession = async () => {
  try {
    const session = await AsyncStorage.getItem('user_session'); // Retrieve session data from AsyncStorage
    if (session) {
      return JSON.parse(session); // Parse and return session if it exists
    }
    return null; // Return null if session doesn't exist
  } catch (error) {
    console.error("Error retrieving user session:", error);
    return null; // Return null in case of error
  }
};
