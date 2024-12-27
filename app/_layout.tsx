import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { PaperProvider } from 'react-native-paper';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { useColorScheme } from '@/hooks/useColorScheme';
import HeaderComponent from '@/components/HeaderComponent';
import AsyncStorage from '@react-native-async-storage/async-storage';

import Login from '@/components/login';
import { getToken } from '@/utiles/auth'; // Assuming you have a function to check login status

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

// Function to fetch cart item count and store it in AsyncStorage
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

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [cartItemCount, setCartItemCount] = useState(0); // Store the cart item count
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  const [phoneNumber, setPhoneNumber] = useState('7417422095'); // Replace with actual phone number if needed

  // Check if fonts are loaded, and fetch login status
  useEffect(() => {
    const checkLoginStatus = async () => {
      const userSession = await getToken(); // Check user login status (can also include logic to get phone_number from session)
      setIsLoggedIn(!!userSession); // Update login status
      if (userSession) {
        setPhoneNumber(userSession.phoneNumber || '7417422095'); // Replace with phoneNumber if part of session
      }
    };

    if (loaded) {
      checkLoginStatus();
    }
  }, [loaded]);

  // Fetch cart item count as soon as the page loads (after login check)
  useEffect(() => {
    const getCartItemCountFromStorage = async () => {
      try {
        const storedCartItemCount = await AsyncStorage.getItem('cartItemCount');
        if (storedCartItemCount) {
          setCartItemCount(JSON.parse(storedCartItemCount)); // Use the stored value if available
        } else {
          // If not in storage, fetch from API
          const count = await fetchCartItemCount(phoneNumber);
          setCartItemCount(count);
        }
      } catch (error) {
        console.error('Error retrieving cart item count from AsyncStorage:', error);
      }
    };

    // Only fetch cart data when login status is confirmed
    if (isLoggedIn) {
      getCartItemCountFromStorage();
    }
  }, [isLoggedIn, phoneNumber]); // Run when the user logs in or phoneNumber changes

  if (!loaded) {
    return null; // Prevent rendering until fonts are loaded
  }

  // If user is not logged in, show the Login screen
  if (!isLoggedIn) {
    return (
      <PaperProvider>
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          <Login loginHandler={(value) => setIsLoggedIn(value)} />
        </ThemeProvider>
      </PaperProvider>
    );
  }

  console.log(loaded, isLoggedIn,'lo')

  return (
    <PaperProvider>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <HeaderComponent cartItemCount={cartItemCount} />
        <Stack>
          <Stack.Screen 
            name="Maali"
            options={{ title: 'Home', headerShown: false }}  // Custom title for the Home screen
          />
          <Stack.Screen 
            name="product"
            options={{ title: 'Product Details', headerShown: false }}  // Custom title for the product screen
          />
          <Stack.Screen 
            name="checkout" 
            options={{ title: 'Checkout', headerShown: false }}  // Custom title for the checkout screen
          />
          <Stack.Screen 
            name="+not-found"
            options={{ headerShown: false }}  // Hide the header for this screen
          />
        </Stack>
      </ThemeProvider>
    </PaperProvider>
  );
}
