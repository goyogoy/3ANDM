import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator, NativeStackScreenProps } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

// Import de tes écrans
import SearchScreen from '../screens/SearchScreen';
import ProductScreen from '../screens/ProductScreen';
import SettingsScreen from '../screens/SettingsScreen';
import HistoryScreen from '../screens/HistoryScreen';
import ScannerScreen from '../screens/ScannerScreen';

// Typage des routes pour les Stacks
export type SearchStackParamList = {
  SearchHome: undefined;
  Product: { code: string };
};

export type SettingsStackParamList = {
  SettingsHome: undefined;
};

export type SearchStackProps<T extends keyof SearchStackParamList> = 
  NativeStackScreenProps<SearchStackParamList, T>;

const SearchStack = createNativeStackNavigator<SearchStackParamList>();
const Tab = createBottomTabNavigator();
const SettingsStack = createNativeStackNavigator<SettingsStackParamList>();
const HistoryStack = createNativeStackNavigator();
const ScannerStack = createNativeStackNavigator();


// Stack pour l'onglet Recherche
function SearchStackNavigator() {
  return (
    <SearchStack.Navigator>
      <SearchStack.Screen 
        name="SearchHome" 
        component={SearchScreen} 
        options={{ title: 'Recherche' }} 
      />
      <SearchStack.Screen 
        name="Product" 
        component={ProductScreen} 
        options={{ title: 'Détails du Produit' }} 
      />
    </SearchStack.Navigator>
  );
}

// Stack pour l'onglet Paramètres
function SettingsStackNavigator() {
  return (
    <SettingsStack.Navigator>
      <SettingsStack.Screen name="SettingsHome" component={SettingsScreen} options={{ title: 'Paramètres' }} />
    </SettingsStack.Navigator>
  );
}

function HistoryStackNavigator() {
  return (
    <HistoryStack.Navigator>
        <HistoryStack.Screen name="HistoryHome" component={HistoryScreen} options={{ title: 'Historique' }} />
    </HistoryStack.Navigator>
  );
}

function ScannerStackNavigator() {
    return (
        <ScannerStack.Navigator>
            <ScannerStack.Screen name="ScannerHome" component={ScannerScreen} options={{ title: 'Scanner' }} />
        </ScannerStack.Navigator>
    );
}

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Tab.Navigator screenOptions={{ headerShown: false }}>
        <Tab.Screen name="RechercheTab" component={SearchStackNavigator} options={{ title: 'Recherche' }} />
        <Tab.Screen name="SettingsTab" component={SettingsStackNavigator} options={{ title: 'Paramètres' }} />
        <Tab.Screen name="HistoryTab" component={HistoryStackNavigator} options={{ title: 'Historique' }} />
        <Tab.Screen name="ScannerTab" component={ScannerStackNavigator} options={{ title: 'Scanner' }} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}