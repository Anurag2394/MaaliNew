import React, { useEffect, useState } from 'react';
import { View, FlatList, Image, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router'; // Import useSearchParams
import config from '@/config';

type Product = {
  _id: { $oid: string };
  productId: string;
  productName: string;
  category: string;
  description: string;
  price: { Regular: number; Large: number; XL: number };
  currency: string;
  stockQuantity: { Regular: number; Large: number; XL: number };
  images: string[];
  ratings: { averageRating: number; numberOfReviews: number };
  tags: string[];
  dateAdded: string;
  careInstructions: { watering: string; light: string; fertilizing: string };
};

const ProductList = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedSizes, setSelectedSizes] = useState<{ [key: string]: string }>({}); // Store selected size for each product
  const { product } = useLocalSearchParams(); // Get 'product' from query params
  const router = useRouter(); // Use router for navigation

  // If no 'product' query param, default to 'plants/cacti'
  const queryTags = product || 'plants/cacti'; 

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        // Send the request to fetch products based on tags (product in this case)
        const productRequestPayload = { tags: queryTags }; // Use 'product' as tags
        
        const response = await fetch(`${config.BASE_URL}/productCatalog/getProductsByTags`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(productRequestPayload), // Pass the tags in the request body
        });

        const data = await response.json();
        console.log(data, 'data');

        // Assuming `data.results` contains the list of products
        if (typeof data.results === 'string') {
          const parsedProducts = JSON.parse(data.results);
          setProducts(parsedProducts);
        }
      } catch (error) {
        console.error('Failed to fetch products:', error);
      }
    };

    fetchProducts();
  }, [queryTags]); // Dependency on queryTags to refetch when the tags change

  // Navigate to the product page (Checkout)
  const navigateToCheckout = (product: Product) => {
    router.push({ pathname: '/Checkout', query: { productId: product.productId } });
  };

  // Update selected size for a specific product
  const handleSizeChange = (productId: string, size: string) => {
    setSelectedSizes(prev => ({
      ...prev,
      [productId]: size,
    }));
  };

  const renderProduct = ({ item }: { item: Product }) => {
    // Get the selected size for the current product
    const selectedSize = selectedSizes[item.productId] || 'Regular';

    return (
      <View style={styles.productContainer}>
        <Image source={{ uri: item.images[0].replace('dl=0', 'raw=1') }} style={styles.image} />
        <Text style={styles.title}>{item.productName}</Text>
        <View style={styles.sizeContainer}>
          {['Regular', 'Large', 'XL'].map((size) => (
            <TouchableOpacity
              key={size}
              style={[styles.sizeButton, selectedSize === size && styles.selectedSizeButton]}
              onPress={() => handleSizeChange(item.productId, size)} // Set the selected size for the current product
            >
              <Text style={styles.sizeButtonText}>{size}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text style={styles.price}>{`${item.currency} ${item.price[selectedSize]}`}</Text>
        <View style={styles.actionsContainer}>
          <TouchableOpacity style={styles.addToCartButton} onPress={() => navigateToCheckout(item)}>
            <Text style={styles.addToCartText}>Add to Cart</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <FlatList
      data={products}
      keyExtractor={(item) => item.productId}
      renderItem={renderProduct}
      numColumns={2}
      columnWrapperStyle={styles.row}
    />
  );
};

const styles = StyleSheet.create({
  row: {
    justifyContent: 'space-between',
  },
  productContainer: {
    flex: 1,
    alignItems: 'center',
    padding: 10,
    margin: 10,
    backgroundColor: '#fff',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    position: 'relative',
  },
  image: {
    width: 100,
    height: 100,
    borderRadius: 10,
    marginBottom: 10,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  sizeContainer: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  sizeButton: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    padding: 5,
    marginHorizontal: 5,
  },
  selectedSizeButton: {
    backgroundColor: '#ddd',
  },
  sizeButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  price: {
    fontSize: 14,
    color: 'green',
    marginBottom: 5,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  addToCartButton: {
    backgroundColor: '#007BFF',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 5,
  },
  addToCartText: {
    color: '#fff',
    fontSize: 14,
  },
});

export default ProductList;
