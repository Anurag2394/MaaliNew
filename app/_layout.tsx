import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { PaperProvider } from 'react-native-paper';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { useColorScheme } from '@/hooks/useColorScheme';
import HeaderComponent from '@/components/HeaderComponent';

import Login from '@/components/login';
import { getToken } from '@/utiles/auth'; // Assuming you have a function to check login status

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const checkLoginStatus = async () => {
      const userSession = await getToken();  // You need to implement this check
      console.log(userSession, '###');
      setIsLoggedIn(!!userSession); // Update state based on session
    };

    if (loaded) {
      checkLoginStatus();
      SplashScreen.hideAsync();
    }
  }, [loaded]);

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

  // If the user is logged in, show the main app screens
  return (
    <PaperProvider>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <HeaderComponent />
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
