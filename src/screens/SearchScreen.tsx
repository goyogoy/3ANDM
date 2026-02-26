/*
 * ÉCRAN DE RECHERCHE
 * Barre de recherche
 * Liste des produits
 */

import React, { useState } from 'react';
import {
  View,
  TextInput,
  FlatList,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';

import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { searchProducts } from '../utils/openFoodApi';

type Props = NativeStackScreenProps<RootStackParamList, 'Search'>;

export default function SearchScreen({ navigation }: Props) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);

  // Lancer la recherche
  const handleSearch = async (text: string) => {
    setQuery(text);
    if (text.length < 2) return;

    try {
      const data = await searchProducts(text);
      setResults(data.products || []);
    } catch (e) {
      console.warn(e);
    }
  };

  // Render d'un produit dans la liste
  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.item}
      onPress={() => navigation.navigate('Product', { code: item.code })}
    >
      {item.image_small_url && (
        <Image source={{ uri: item.image_small_url }} style={styles.image} />
      )}

      <View style={{ flex: 1 }}>
        <Text style={styles.title}>{item.product_name || 'Sans nom'}</Text>
        <Text style={styles.brand}>{item.brands}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <TextInput
        placeholder="Rechercher un aliment..."
        value={query}
        onChangeText={handleSearch}
        style={styles.input}
      />

      <FlatList
        data={results}
        keyExtractor={(item) => item.code}
        renderItem={renderItem}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  input: {
    margin: 10,
    padding: 12,
    borderWidth: 1,
    borderRadius: 8,
  },
  item: {
    flexDirection: 'row',
    padding: 10,
    borderBottomWidth: 1,
  },
  image: {
    width: 60,
    height: 60,
    marginRight: 10,
  },
  title: { fontWeight: 'bold' },
  brand: { color: '#666' },
});