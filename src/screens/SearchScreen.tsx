import React, { useState, useMemo } from 'react';
import {View,TextInput,FlatList,Text,StyleSheet,TouchableOpacity,Image,ActivityIndicator,} from 'react-native';
import debounce from 'lodash.debounce';

import { SearchStackProps } from '../navigation/AppNavigator'; 
import { searchProducts } from '../utils/openFoodApi';
import { nutriColors } from '../utils/productHelpers';

// Utilisation du type exporté depuis AppNavigator
type Props = SearchStackProps<'SearchHome'>;

export default function SearchScreen({ navigation }: Props) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Recherche API
  const fetchResults = async (text: string) => {
    if (text.length < 2) {
      setResults([]);
      return;
    }

    try {
      setLoading(true);
      const data = await searchProducts(text);
      setResults(data.products || []);
    } catch (e) {
      console.warn(e);
    } finally {
      setLoading(false);
    }
  };

  //Debounce
  const debouncedSearch = useMemo(
    () => debounce(fetchResults, 450),
    []
  );

  const handleChange = (text: string) => {
    setQuery(text);
    debouncedSearch(text);
  };

  // Render produit
  const renderItem = ({ item }: { item: any }) => {
    const nutri = item.nutriscore_grade?.toLowerCase();

    return (
      <TouchableOpacity
        style={styles.item}
        // Cette ligne fonctionnera maintenant car 'Product' est dans le même SearchStack
        onPress={() => navigation.navigate('Product', { code: item.code })}
      >
        {/* Image */}
        {item.image_small_url ? (
          <Image source={{ uri: item.image_small_url }} style={styles.image} />
        ) : (
          <View style={[styles.image, styles.placeholder]} />
        )}

        {/* Infos produit */}
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>
            {item.product_name || 'Produit sans nom'}
          </Text>
          <Text style={styles.brand}>{item.brands}</Text>
        </View>

        {/* NutriScore badge */}
        {nutri && nutriColors[nutri] && (
          <View
            style={[
              styles.nutriBadge,
              { backgroundColor: nutriColors[nutri] },
            ]}
          >
            <Text style={styles.nutriText}>{nutri.toUpperCase()}</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Barre de recherche */}
      <TextInput
        placeholder="Rechercher par nom ou marque..."
        value={query}
        onChangeText={handleChange}
        style={styles.input}
        autoCapitalize="none"
      />

      {/* Loader */}
      {loading && <ActivityIndicator style={{ marginVertical: 10 }} />}

      {/* Liste résultats */}
      <FlatList
        data={results}
        keyExtractor={(item) => item.code}
        renderItem={renderItem}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={
          !loading && query.length > 1 ? (
            <Text style={styles.empty}>Aucun résultat</Text>
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' }, // Ajout fond blanc par défaut

  input: {
    margin: 12,
    padding: 12,
    borderWidth: 1,
    borderRadius: 10,
    borderColor: '#ddd',
  },

  item: {
    flexDirection: 'row',
    padding: 12,
    borderBottomWidth: 1,
    borderColor: '#eee',
    alignItems: 'center',
  },

  image: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 10,
  },

  placeholder: {
    backgroundColor: '#eee',
  },

  title: { fontWeight: 'bold' },
  brand: { color: '#666', fontSize: 12 },

  nutriBadge: {
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },

  nutriText: {
    color: 'white',
    fontWeight: 'bold',
  },

  empty: {
    textAlign: 'center',
    marginTop: 20,
    color: '#888',
  },
});