import React, { useState, useRef, useEffect } from 'react';
import { Image, StyleSheet, Text, View, TextInput, TouchableOpacity, ActivityIndicator, ScrollView, Pressable } from 'react-native';
import config from '@/config';
import { Ionicons } from '@expo/vector-icons'; // For search and profile icons
import AntDesign from '@expo/vector-icons/AntDesign';
import { useRouter, useLocalSearchParams } from 'expo-router';
import GetLocation from '@/components/GetLocation';
import { getSupplierData } from '@/utiles/auth';

export default function Header() {
  const [isSearchMode, setIsSearchMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false); // New state for loading indicator
  const [supplierData, setSupplierDataState] = useState(null);
  const debounceTimeout = useRef(null); // Reference to store the timeout ID
  const router = useRouter();




  useEffect(() => {
    // Fetch supplier data when the component is mounted
    const fetchSupplierData = async () => {
      const data = await getSupplierData();
      setSupplierDataState(data); // Set the supplier data in state
    };

    fetchSupplierData(); // Call the function to fetch data
  }, []);
  
  const fetchProducts = async (query) => {
    if (!query) return;

    setIsLoading(true); // Show loading indicator when fetching data
    try {
      const response = await fetch(`${config.SEARCH_URL}/searchProducts/getMatchingProducts?word=${query}`);
      const data = await response.json();
      console.log('API Response:', data); // Log the response
      setSearchResults(data.results); // Assuming data.results holds the list of search results
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setIsLoading(false); // Hide loading indicator after fetch completes
    }
  };

  const handleSearchChange = (text) => {
    console.log('Search Query:', text); // Log the query as the user types
    setSearchQuery(text);

    // Clear the previous timeout
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }

    // Set a new timeout
    debounceTimeout.current = setTimeout(() => {
      fetchProducts(text); // Fetch products after delay
    }, 1000); // 1000ms delay
  };

  const toggleSearchMode = () => {
    setIsSearchMode(!isSearchMode);
    if (isSearchMode) {
      setSearchQuery(''); // Reset search query when exiting search mode
      setSearchResults([]); // Clear search results
    }
  };

  // Function to handle navigation when an item is clicked
  const handleProductClick = (productId, category) => {
    // Navigate to product detail page with productId and category
    setSearchQuery(''); // Reset search query when exiting search mode
    setIsSearchMode(!isSearchMode);
    setSearchResults([]); // Clear search results
    router.push(`/productDetail/${productId}/${category}`);
  };
  



  return (
    <View style={styles.mainContainer}>
     
      <View style={styles.container}>
        {!isSearchMode && (
          <Pressable style={styles.imageSection} onPress={() => router.push('/')}>
            <Image source={require('@/assets/images/logo.png')} style={styles.reactLogo}  />
            <Text style={styles.geoLocation}>  <GetLocation /> </Text>
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
        {!isSearchMode && <TouchableOpacity onPress={toggleSearchMode} style={styles.searchIcon}>
          <Ionicons name={isSearchMode ? 'close' : 'search'} size={24} color="#333" />
        </TouchableOpacity>}

        {/* Only show the profile icon when not in search mode */}
        {!isSearchMode && (
          <TouchableOpacity onPress={() => router.push('/Checkout')} style={styles.profileIcon}>
            <AntDesign name="shoppingcart" size={24} color="black" />
          </TouchableOpacity>
        )}
        </View>
      </View>
      {
    isSearchMode && (
    <ScrollView style={styles.resultList}>
      {
        !isLoading && searchResults.length > 0 ? (
          searchResults.map((item) => (
            <TouchableOpacity
              key={item.product_id.toString()}
              style={styles.resultItem}
              onPress={() => handleProductClick(item.product_id, item.category)} // On click, navigate
            >
              <Image
                source={{ uri: (JSON.parse(item.imageUrl)[0]).toString().replace('dl=0', 'raw=1') }}
                style={styles.image}
                resizeMode="stretch"
              />
              <Text style={styles.resultText}>{item.product_name}</Text>
            </TouchableOpacity>
          ))
        ) : (
          <Text style={styles.noResultsText}>No results found</Text>
        )
      }
    </ScrollView>
  )
}

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
    elevation: 5, // Add shadow for Android
    shadowColor: '#000', // Shadow for iOS
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
   alignItems: 'center'
  },

  reactLogo: {
    height: 60,
    width: 50,
  },
  title: {
    fontSize: 20,
    color: '#333',
    fontWeight: '600',
    flex: 1, // Ensures title takes available space before the search button
    textAlign: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%', // Take full width for the search bar
    paddingHorizontal: 15,
  },
  geoLocation: {
    backgroundColor: '#fff',
    width: 250,
    fontSize: 10,
    marginTop: 0
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
  },
  resultList: {
    marginTop: 10,
    width: '100%',
    backgroundColor: '#fff',
    marginStart: 0,
    maxHeight: 200,
    overflow: 'scroll',
    paddingBottom: 10, // Add padding to prevent results from touching the bottom
  },
  resultItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderColor: '#ddd',
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center'
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
  loader: {
    marginTop: 20,
    alignSelf: 'center', // Center the loader horizontally
  },
});
