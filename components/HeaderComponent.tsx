import React, { useState } from 'react';
import { Image, StyleSheet, Text, View, TextInput, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons'; // For search and profile icons

export default function Header() {
  const [isSearchMode, setIsSearchMode] = useState(false); // State to toggle between header and search mode
  const [searchQuery, setSearchQuery] = useState(''); // State to hold the search query

  // Toggle search mode
  const toggleSearchMode = () => {
    setIsSearchMode(!isSearchMode);
    if (isSearchMode) {
      setSearchQuery(''); // Reset search query when exiting search mode
    }
  };

  return (
    <View style={styles.container}>
      {/* Only show logo and title when not in search mode */}
      {!isSearchMode && (
        <>
          <Image source={require('@/assets/images/logo.png')} style={styles.reactLogo} />
          <Text style={styles.title}></Text>
        </>
      )}

      {/* Full width search bar when in search mode */}
      {isSearchMode && (
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search..."
            value={searchQuery}
            onChangeText={(text) => setSearchQuery(text)}
          />
          <TouchableOpacity onPress={toggleSearchMode} style={styles.searchButton}>
            <Ionicons name="close" size={10} color="white" />
          </TouchableOpacity>
        </View>
      )}

      {/* Only show the profile icon when not in search mode */}
      {!isSearchMode && (
        <TouchableOpacity onPress={() => alert('Profile or options clicked')} style={styles.profileIcon}>
          <Ionicons name="person-circle-outline" size={30} color="#333" />
        </TouchableOpacity>
      )}

      {/* Always show the search icon in the header */}
      <TouchableOpacity onPress={toggleSearchMode} style={styles.searchIcon}>
        <Ionicons name={isSearchMode ? 'close' : 'search'} size={24} color="#333" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 25,
    padding: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    elevation: 5, // Add shadow for Android
    shadowColor: '#000', // Shadow for iOS
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  reactLogo: {
    height: 50,
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
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    paddingLeft: 15,
    fontSize: 16,
    backgroundColor: 'transparent',
    borderRadius: 25,
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
});
