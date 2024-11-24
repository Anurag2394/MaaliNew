import React, { useEffect, useState } from 'react';
import { StyleSheet, View, ActivityIndicator } from 'react-native';
import config from '../../config';
import { List } from 'react-native-paper';
import { useRouter } from 'expo-router'; // useRouter from expo-router

type Child = {
  title: string;
  imageUrl: string;
  price: number;
  description: string;
};

type Category = {
  title: string;
  children?: Array<string>; // Array of subcategory names (as strings)
};

type SubCategoryData = string[]; // Array of strings representing subcategories

const CategoryScreen: React.FC = () => {
  const [categories, setCategories] = useState<Array<Category>>([]);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [subCategories, setSubCategories] = useState<{ [key: string]: SubCategoryData }>({}); // Mapping category to subcategories
  const [isLoading, setIsLoading] = useState<boolean>(false); // Loading state for category API
  const [subCategoryLoading, setSubCategoryLoading] = useState<{ [key: string]: boolean }>({}); // Loading state for subcategories per category
  const router = useRouter(); // useRouter hook for navigation

  useEffect(() => {
    const fetchCategories = async () => {
      setIsLoading(true); // Start loading categories
      try {
        const response = await fetch(`${config.BASE_URL}/productCatalog/getCategories`);
        const data = await response.json();
        
        if (typeof data.results === 'string') {
          const parsedCategories = JSON.parse(data.results);
          setCategories(parsedCategories);
          console.log('Fetched Categories:', parsedCategories); // Debug: Log the fetched categories
        }

      } catch (err) {
        console.error('Failed to fetch categories:', err);
      } finally {
        setIsLoading(false); // Stop loading categories
      }
    };

    fetchCategories();
  }, []);

  const fetchSubCategories = async (category: string) => {
    setSubCategoryLoading(prev => ({ ...prev, [category]: true })); // Set loading for this category
    try {
      const response = await fetch(`${config.BASE_URL}/productCatalog/getSubCategoriesByCategory`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ category }), // Send the category as an object in the request body
      });
      const data = await response.json();

      console.log('Fetched subcategory data:', data); // Add this log to inspect the data

      if (typeof data.results === 'string') {
        const subCategoryData: SubCategoryData = JSON.parse(data.results);
        setSubCategories(prevState => ({
          ...prevState,
          [category]: subCategoryData
        }));
        console.log(`Subcategories for ${category}:`, subCategoryData); // Debug: Log the fetched subcategories
      }
    } catch (err) {
      console.error(`Failed to fetch subcategories for ${category}:`, err);
    } finally {
      setSubCategoryLoading(prev => ({ ...prev, [category]: false })); // Stop loading for this category
    }
  };

  const handlePress = (index: number, category: string) => {
    setExpanded(expanded === index ? null : index);
    
    // Fetch subcategories for the category when it's expanded
    if (expanded !== index && !subCategoryLoading[category]) {
      fetchSubCategories(category);
    }
  };

  const navigateToProduct = (productName: string) => {
    router.push({
      pathname: '/Product',
      params: { product: productName },
    });
  };

  // Log categories if they're empty
  if (!categories.length) {
    console.log('No categories loaded');
    return null;
  }

  return (
    <View style={styles.container}>
      {/* Loader for categories */}
      {isLoading ? (
        <ActivityIndicator size="large" color="#0000ff" />
      ) : (
        categories.map((category, index) => (
          <List.Section key={index}>
            <List.Accordion
              title={category.title}
              expanded={expanded === index}
              onPress={() => handlePress(index, category.title)}
              left={(props) => <List.Icon {...props} icon="folder" />}
              style={styles.accordion}
              titleStyle={styles.accordionTitle}
              disabled={isLoading || subCategoryLoading[category.title]} // Disable accordion when loading
            >
              {/* Check if subcategories are loading */}
              {subCategoryLoading[category.title] ? (
                <ActivityIndicator size="small" color="#0000ff" />
              ) : (
                // If subCategories[category.title] exists and is an array, render the subcategories
                (subCategories[category.title] || []).length > 0 ? (
                  (JSON.parse(((subCategories[category.title])[0]).children)|| []).map((item, idx) => {
                    console.log(`Rendering subcategory: ${item}`); // Log each subcategory being rendered
                    return (
                      <List.Item
                        key={idx}
                        title={item}  // Displaying the subcategory name
                        style={styles.listItem}
                        titleStyle={styles.listItemTitle}
                        onPress={() => navigateToProduct(item)} // Navigate to the product page
                      />
                    );
                  })
                ) : (
                  <View style={styles.noSubcategories}>
                    <List.Item
                      title="No subcategories available"
                      style={styles.listItem}
                      titleStyle={styles.listItemTitle}
                    />
                  </View>
                )
              )}
            </List.Accordion>
          </List.Section>
        ))
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'stretch',
    padding: 16,
  },
  accordion: {
    backgroundColor: 'green',
    marginBottom: 0,
    borderRadius: 0,
  },
  accordionTitle: {
    color: '#fff',
    fontWeight: 'bold',
    textTransform: 'capitalize',
  },
  listItem: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  listItemTitle: {
    color: '#555',
  },
  noSubcategories: {
    marginTop: 10,
  },
});

export default CategoryScreen;
