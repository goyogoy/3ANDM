/*
 * FICHE PRODUIT AVANCÉE
 * Image avec placeholder
 * NutriScore visuel
 * NOVA group
 * Tableau nutrition complet
 * Ingrédients + allergènes
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
} from 'react-native';

import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SearchStackProps } from '../navigation/AppNavigator';
import { getProductByCode } from '../utils/openFoodApi';
import { nutriColors, novaDescriptions } from '../utils/productHelpers';

type Props = SearchStackProps<'Product'>;

export default function ProductScreen({ route }: Props) {
  const { code } = route.params;
  const [product, setProduct] = useState<any>(null);

  // Charger produit
  useEffect(() => {
    const load = async () => {
      const data = await getProductByCode(code);
      setProduct(data.product);
    };
    load();
  }, []);

  if (!product) {
    return (
      <View style={styles.center}>
        <Text>Chargement...</Text>
      </View>
    );
  }

  // Récup données utiles
  const nutriments = product.nutriments || {};
  const energyKcal =
  nutriments['energy-kcal_100g'] ??
  nutriments.energy_kcal_100g ??
  (nutriments.energy_100g
    ? Math.round(nutriments.energy_100g / 4.184) // kJ -> kcal
    : null);

  const nutriScore = product.nutriscore_grade?.toLowerCase();
  const nova = product.nova_group;

  // Allergènes (OpenFoodFacts format)
  const allergens: string[] = product.allergens_tags?.map((a: string) => a.replace('en:', '')) ?? [];

  // Mettre en évidence allergènes dans ingrédients
  const highlightIngredients = (text: string) => {
    if (!text || !allergens) return text;

    let result = text;
    allergens.forEach((a: string) => {
      const regex = new RegExp(`(${a})`, 'gi');
      result = result.replace(regex, '**$1**');
    });
    return result;
  };

  return (
    <ScrollView
    style={styles.container}
    contentContainerStyle={{ paddingBottom: 80, flexGrow: 1 }}
    showsVerticalScrollIndicator={false}
    >

      {/* IMAGE */}
      {product.image_url ? (
        <Image source={{ uri: product.image_url }} style={styles.image} />
      ) : (
        <View style={[styles.image, styles.placeholder]}>
          <Text>Aucune image</Text>
        </View>
      )}

      {/* INFOS BASIQUES */}
      <Text style={styles.name}>{product.product_name || 'Sans nom'}</Text>
      <Text style={styles.brand}>{product.brands}</Text>
      <Text style={styles.qty}>{product.quantity}</Text>

      {/* NUTRISCORE */}
      {nutriScore && (
        <View style={styles.block}>
          <Text style={styles.sectionTitle}>Nutri-Score</Text>
          <View
            style={[
              styles.nutriBadge,
              { backgroundColor: nutriColors[nutriScore] },
            ]}
          >
            <Text style={styles.nutriText}>{nutriScore.toUpperCase()}</Text>
          </View>
        </View>
      )}

      {/* NOVA */}
      {nova && (
        <View style={styles.block}>
          <Text style={styles.sectionTitle}>Groupe NOVA {nova}</Text>
          <Text>{novaDescriptions[nova]}</Text>
        </View>
      )}

      {/* TABLEAU NUTRITION */}
      <View style={styles.block}>
        <Text style={styles.sectionTitle}>Valeurs nutritionnelles (100g)</Text>
        <Text>Énergie: {energyKcal ?? '-'} kcal</Text>
        <Text>Graisses: {nutriments.fat_100g ?? '-'} g</Text>
        <Text>Graisses saturées: {nutriments['saturated-fat_100g'] ?? '-'} g</Text>
        <Text>Glucides: {nutriments.carbohydrates_100g ?? '-'} g</Text>
        <Text>Sucres: {nutriments.sugars_100g ?? '-'} g</Text>
        <Text>Fibres: {nutriments.fiber_100g ?? '-'} g</Text>
        <Text>Protéines: {nutriments.proteins_100g ?? '-'} g</Text>
        <Text>Sel: {nutriments.salt_100g ?? '-'} g</Text>
      </View>

      {/* INGRÉDIENTS */}
      <View style={styles.block}>
        <Text style={styles.sectionTitle}>Ingrédients</Text>
        <Text>
          {highlightIngredients(product.ingredients_text) || 'Non disponible'}
        </Text>
      </View>

      {/* ALLERGÈNES */}
      <View style={styles.block}>
        <Text style={styles.sectionTitle}>Allergènes</Text>

        {allergens.length > 0 ? (
            <Text style={styles.allergens}>
            {allergens.join(', ').toUpperCase()}
            </Text>
        ) : (
            <Text style={{ color: '#2ecc71', fontWeight: 'bold' }}>
            Aucun allergène déclaré
            </Text>
        )}
      </View>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  

  image: {
    width: '100%',
    height: 220,
    borderRadius: 10,
    marginBottom: 12,
  },
  placeholder: {
    backgroundColor: '#eee',
    justifyContent: 'center',
    alignItems: 'center',
  },

  name: { fontSize: 22, fontWeight: 'bold' },
  brand: { color: '#666' },
  qty: { color: '#888', marginBottom: 10 },

  block: { marginTop: 16 },
  sectionTitle: { fontWeight: 'bold', marginBottom: 6 },

  nutriBadge: {
    width: 60,
    height: 60,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  nutriText: {
    color: 'white',
    fontSize: 28,
    fontWeight: 'bold',
  },

  allergens: {
    color: '#e74c3c',
    fontWeight: 'bold',
  },
});