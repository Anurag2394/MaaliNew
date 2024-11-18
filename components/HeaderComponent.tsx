// App.js
import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import GetLocation from '@/components/GetLocation';

 

export default function Header() {
  return (
    <View style={styles.container}>
     <Image
          source={require('@/assets/images/logo.png')}
          style={styles.reactLogo}
        />
      <GetLocation />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 25,
    padding: 10,
    justifyContent: 'space-between',
     flexDirection: 'row',
     alignItems: 'center'
      },
  text: {
    fontSize: 20,
    color: 'blue',
  },
  reactLogo: {
    height: 64,
    width: 45,
  }
});
