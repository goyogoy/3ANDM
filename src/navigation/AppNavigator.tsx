import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';
import { useTheme } from '../context/ThemeContext';

import ScannerScreen from '../screens/ScannerScreen';
import SearchScreen from '../screens/SearchScreen';
import ProductScreen from '../screens/ProductScreen';
import HistoryScreen from '../screens/HistoryScreen';
import FavoritesScreen from '../screens/FavoritesScreen';
import SettingsScreen from '../screens/SettingsScreen';
import DashboardScreen from '../screens/DashboardScreen';
import CompareScreen from '../screens/CompareScreen';

export type SearchStackParamList = {
  SearchHome: undefined;
  Product: { code: string; product?: any };
};

export type SearchStackProps<T extends keyof SearchStackParamList> =
  import('@react-navigation/native-stack').NativeStackScreenProps<SearchStackParamList, T>;

const Tab = createBottomTabNavigator();
const ScannerStack = createNativeStackNavigator();
const SearchStack = createNativeStackNavigator();
const HistoryStack = createNativeStackNavigator();
const FavoritesStack = createNativeStackNavigator();
const SettingsStack = createNativeStackNavigator();

function ScannerStackNavigator() {
  return (
    <ScannerStack.Navigator>
      <ScannerStack.Screen name="ScannerHome" component={ScannerScreen} options={{ headerShown: false }} />
      <ScannerStack.Screen name="ProductScan" component={ProductScreen} options={{ title: 'Produit' }} />
    </ScannerStack.Navigator>
  );
}

function SearchStackNavigator() {
  return (
    <SearchStack.Navigator>
      <SearchStack.Screen name="SearchHome" component={SearchScreen} options={{ title: 'Recherche' }} />
      <SearchStack.Screen name="Product" component={ProductScreen} options={{ title: 'Produit' }} />
    </SearchStack.Navigator>
  );
}

function HistoryStackNavigator() {
  return (
    <HistoryStack.Navigator>
      <HistoryStack.Screen name="HistoryHome" component={HistoryScreen} options={{ title: 'Historique' }} />
      <HistoryStack.Screen name="ProductHistory" component={ProductScreen} options={{ title: 'Produit' }} />
      <HistoryStack.Screen name="Compare" component={CompareScreen} options={{ title: 'Comparateur' }} />
      <HistoryStack.Screen name="Dashboard" component={DashboardScreen} options={{ title: 'Dashboard' }} />
    </HistoryStack.Navigator>
  );
}

function FavoritesStackNavigator() {
  return (
    <FavoritesStack.Navigator>
      <FavoritesStack.Screen name="FavoritesHome" component={FavoritesScreen} options={{ title: 'Favoris' }} />
      <FavoritesStack.Screen name="ProductFavorites" component={ProductScreen} options={{ title: 'Produit' }} />
    </FavoritesStack.Navigator>
  );
}

function SettingsStackNavigator() {
  return (
    <SettingsStack.Navigator>
      <SettingsStack.Screen name="SettingsHome" component={SettingsScreen} options={{ title: 'Paramètres' }} />
    </SettingsStack.Navigator>
  );
}

export default function AppNavigator() {
  const { colors } = useTheme();
  return (
    <NavigationContainer>
      <Tab.Navigator screenOptions={{
        headerShown: false,
        tabBarStyle: { backgroundColor: colors.tabBar, borderTopColor: colors.border },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: { fontSize: 11 },
      }}>
        <Tab.Screen name="ScannerTab" component={ScannerStackNavigator} options={{ title: 'Scanner', tabBarIcon: () => <Text style={{ fontSize: 20 }}>📷</Text> }} />
        <Tab.Screen name="RechercheTab" component={SearchStackNavigator} options={{ title: 'Recherche', tabBarIcon: () => <Text style={{ fontSize: 20 }}>🔍</Text> }} />
        <Tab.Screen name="HistoryTab" component={HistoryStackNavigator} options={{ title: 'Historique', tabBarIcon: () => <Text style={{ fontSize: 20 }}>📋</Text> }} />
        <Tab.Screen name="FavoritesTab" component={FavoritesStackNavigator} options={{ title: 'Favoris', tabBarIcon: () => <Text style={{ fontSize: 20 }}>❤️</Text> }} />
        <Tab.Screen name="SettingsTab" component={SettingsStackNavigator} options={{ title: 'Paramètres', tabBarIcon: () => <Text style={{ fontSize: 20 }}>⚙️</Text> }} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
