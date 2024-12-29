import React, { useState, useRef, useEffect } from 'react';
import { Image, StyleSheet, Text, View, TextInput, TouchableOpacity, ScrollView, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons'; // For search and profile icons
import AntDesign from '@expo/vector-icons/AntDesign';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import GetLocation from '@/components/GetLocation';
import config from '@/config';
import { getSupplierData } from '@/utiles/auth';

export default function Header() {
  const [isSearchMode, setIsSearchMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [supplierData, setSupplierDataState] = useState(null);
  const [cartCount, setCartCount] = useState(0); // Track cart count
  const debounceTimeout = useRef(null); // Reference for debouncing
  const router = useRouter();

  // Ref to store the previous cartCount value
  const prevCartCountRef = useRef();

  useEffect(() => {
    // Fetch supplier data when the component is mounted
    const fetchSupplierData = async () => {
      const data = await getSupplierData();
      setSupplierDataState(data);
    };

    // Fetch cart count from AsyncStorage when the component is mounted
    const fetchCartCount = async () => {
      const storedCartItemCount = await AsyncStorage.getItem('cartItemCount');
      if (storedCartItemCount) {
        setCartCount(JSON.parse(storedCartItemCount)); // Set the cart count from AsyncStorage
      }
    };

    fetchSupplierData();
    fetchCartCount();
  }, []);

  const fetchProducts = async (query) => {
    if (!query) return;

    setIsLoading(true);
    try {
      const response = await fetch(`${config.SEARCH_URL}/searchProducts/getMatchingProducts?word=${query}`);
      const data = await response.json();
      setSearchResults(data.results);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchChange = (text) => {
    setSearchQuery(text);

    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }

    debounceTimeout.current = setTimeout(() => {
      fetchProducts(text);
    }, 1000);
  };

  const toggleSearchMode = () => {
    setIsSearchMode(!isSearchMode);
    if (isSearchMode) {
      setSearchQuery('');
      setSearchResults([]);
    }
  };

  useEffect(() => {
    // Update AsyncStorage whenever cartCount changes
    const updateCartCountInAsyncStorage = async () => {
      await AsyncStorage.setItem('cartItemCount', JSON.stringify(cartCount));
    };

    updateCartCountInAsyncStorage();
  }, [cartCount]); // Run this effect when cartCount changes

  useEffect(() => {
    if (prevCartCountRef.current !== undefined) {
      if (cartCount > prevCartCountRef.current) {
        console.log('Cart item count has increased!', cartCount);
        const fetchCartCount = async () => {
          const storedCartItemCount = await AsyncStorage.getItem('cartItemCount');
          if (storedCartItemCount) {
            setCartCount(JSON.parse(storedCartItemCount)); // Set the cart count from AsyncStorage
          }
        };
        fetchCartCount();
      }
    }

    // Update the ref to store the current cartCount for the next render
    prevCartCountRef.current = cartCount;
  }, [cartCount]);

  // Function to handle navigation when an item is clicked
  const handleProductClick = (productId, category) => {
    setSearchQuery('');
    setIsSearchMode(!isSearchMode);
    setSearchResults([]);
    router.push(`/productDetail/${productId}/${category}`);
  };

  return (
    <View style={styles.mainContainer}>
      <View style={styles.container}>
        {!isSearchMode && (
          <Pressable style={styles.imageSection} onPress={() => router.push('/')}>
            <Image source={require('@/assets/images/logo.png')} style={styles.reactLogo} />
            <Text style={styles.geoLocation}>
              <GetLocation />
            </Text>
          </Pressable>
        )}

        {isSearchMode && (
          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="Search..."
              value={searchQuery}
              onChangeText={handleSearchChange}
            />
            <TouchableOpacity onPress={toggleSearchMode} style={styles.searchButton}>
              <Ionicons name="close" size={10} color="white" />
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.rightSection}>
          {!isSearchMode && (
            <TouchableOpacity onPress={toggleSearchMode} style={styles.searchIcon}>
              <Ionicons name={isSearchMode ? 'close' : 'search'} size={24} color="#333" />
            </TouchableOpacity>
          )}

          {/* Show the cart icon with a badge */}
          {!isSearchMode && (
            <TouchableOpacity onPress={() => router.push('/Checkout')} style={styles.profileIcon}>
              <AntDesign name="shoppingcart" size={24} color="black" />
              {cartCount > 0 && (
                <View style={styles.cartBadge}>
                  <Text style={styles.cartBadgeText}>{cartCount}</Text>
                </View>
              )}
            </TouchableOpacity>
          )}
        </View>
      </View>

      {isSearchMode && (
        <ScrollView style={styles.resultList}>
          {!isLoading && searchResults.length > 0 ? (
            searchResults.map((item) => (
              <TouchableOpacity
                key={item.product_id.toString()}
                style={styles.resultItem}
                onPress={() => handleProductClick(item.product_id, item.category)}
              >
                <Image
                  source={{
                    uri: (JSON.parse(item.imageUrl)[0]).toString().replace('dl=0', 'raw=1'),
                  }}
                  style={styles.image}
                  resizeMode="stretch"
                />
                <Text style={styles.resultText}>{item.product_name}</Text>
              </TouchableOpacity>
            ))
          ) : (
            <Text style={styles.noResultsText}>No results found</Text>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    marginTop: 10,
    shadowRadius: 2,
  },
  rightSection: {
    display: 'flex',
    alignItems: 'center',
    flexDirection: 'row',
  },
  image: {
    width: 50,
    height: 50,
    borderRadius: 10,
    marginRight: 10,
  },
  imageSection: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
  },
  reactLogo: {
    height: 60,
    width: 50,
  },
  title: {
    fontSize: 20,
    color: '#333',
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 15,
  },
  geoLocation: {
    backgroundColor: '#fff',
    width: 250,
    fontSize: 10,
    marginTop: 0,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 16,
    backgroundColor: 'transparent',
    borderRadius: 25,
  },
  mainContainer: {
    backgroundColor: '#fff',
  },
  searchButton: {
    padding: 10,
    backgroundColor: '#4CAF50',
    borderRadius: 50,
    marginLeft: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchIcon: {
    padding: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileIcon: {
    marginLeft: 10,
    position: 'relative',
  },
  resultList: {
    marginTop: 10,
    width: '100%',
    backgroundColor: '#fff',
    maxHeight: 200,
    paddingBottom: 10,
  },
  resultItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderColor: '#ddd',
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
  },
  resultText: {
    fontSize: 16,
    color: '#333',
  },
  noResultsText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#777',
    marginTop: 20,
  },
  cartBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: 'red',
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cartBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
});
