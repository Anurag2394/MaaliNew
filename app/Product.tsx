// App.js
import React from 'react';
import { SafeAreaView, StyleSheet } from 'react-native';
import ProductList from '@/components/ProductList';

const Product = () => {
  return (
    <SafeAreaView style={styles.container}>
      <ProductList />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
});

export default Product;
