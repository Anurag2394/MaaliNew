import { StyleSheet, Text, View } from 'react-native'
import SliderComponent from '@/components/SliderComponent'
import CircleText from '@/components/CircleText'
import React from 'react'

type Props = {}

const HomeScreen = (props: Props) => {
  return (
    <View style={styles.container}>
       <View style= {{height:300}}><SliderComponent /></View>
       <View style= {{ height: 100}}><CircleText /></View>
    </View>
  )
}

export default HomeScreen

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent:"flex-start",
    alignItems: 'center'
  }
})