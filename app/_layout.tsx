import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { PaperProvider } from 'react-native-paper';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { useColorScheme } from '@/hooks/useColorScheme';
import HeaderComponent from '@/components/HeaderComponent';
import SearchComponent from '@/components/SearchComponent';
import Login from '@/components/login';
import { getUserSession } from '@/utiles/auth'; // Assuming you have a function to check login status

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
      const userSession = await getUserSession();  // You need to implement this check
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
          <Login 
            loginHandler= {(value) => setIsLoggedIn(value)}
          />
        </ThemeProvider>
      </PaperProvider>
    );
  }

  // If the user is logged in, show the main app screens
  return (
    <PaperProvider>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <HeaderComponent />
        <SearchComponent />
        <Stack>
          <Stack.Screen name="Maali" />
          <Stack.Screen name="product" />
          <Stack.Screen name='checkout' />
          <Stack.Screen name="+not-found"/>
        </Stack>
      </ThemeProvider>
    </PaperProvider>
  );
}
