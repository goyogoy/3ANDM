/*
 * NAVIGATION PRINCIPALE
 * Stack Navigator global
 */

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// Screens
import SearchScreen from '../screens/SearchScreen';
import ProductScreen from '../screens/ProductScreen';

/**
 * Typage des routes
 */
export type RootStackParamList = {
  Search: undefined;
  Product: { code: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Search">
        <Stack.Screen name="Search" component={SearchScreen} options={{ title: 'Recherche' }} />
        <Stack.Screen name="Product" component={ProductScreen} options={{ title: 'Produit' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}