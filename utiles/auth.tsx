import * as SecureStore from 'expo-secure-store';

export const getUserSession = async () => {
  try {
    const userSession = await SecureStore.getItemAsync('userSession');
    return userSession ? JSON.parse(userSession) : null;
  } catch (error) {
    console.error("Failed to retrieve user session", error);
    return null;
  }
};
