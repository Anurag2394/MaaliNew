import * as React from 'react';
import { Searchbar } from 'react-native-paper';
import { Image, StyleSheet, Text, View } from 'react-native';


export default function SearchComponent() {
  const [searchQuery, setSearchQuery] = React.useState('');

  return (
    <Searchbar
      placeholder="Search"
      onChangeText={setSearchQuery}
      value={searchQuery}
      style= {styles.searchBar}
    />
  );
};



const styles = StyleSheet.create({
  searchBar: {
    borderRadius: 10,
    height: 50,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: 'transparent'
  }
});