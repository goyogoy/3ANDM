import React, { useEffect, useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { getProductByCode } from '../utils/openFoodApi';
import { nutriColors, novaDescriptions } from '../utils/productHelpers';
import { saveToHistory, isFavorite, saveFavorite, removeFavorite } from '../utils/storage';
import { useTheme } from '../context/ThemeContext';
import { usePreferences } from '../context/PreferencesContext';

const ALLERGEN_MAP: Record<string, string[]> = {
  gluten: ['gluten', 'wheat', 'rye', 'barley'],
  lait: ['milk', 'dairy', 'lactose', 'lait'],
  oeufs: ['egg', 'oeuf'],
  arachides: ['peanut', 'arachide'],
  fruits_a_coque: ['nut', 'almond', 'hazelnut', 'walnut', 'cashew'],
  soja: ['soy', 'soja'],
  poisson: ['fish', 'poisson'],
  crustaces: ['crustacean', 'shrimp', 'crab'],
  sesame: ['sesame'],
  sulfites: ['sulphite', 'sulfite'],
  celeri: ['celery', 'celeri'],
  moutarde: ['mustard', 'moutarde'],
  lupin: ['lupin'],
};

export default function ProductScreen({ route, navigation }: any) {
  const { colors } = useTheme();
  const { preferences } = usePreferences();
  const { code, product: cachedProduct } = route.params;
  const [product, setProduct] = useState<any>(cachedProduct ?? null);
  const [favorite, setFavorite] = useState(false);

  useEffect(() => {
    const load = async () => {
      let prod = cachedProduct;
      if (!prod) {
        const data = await getProductByCode(code);
        prod = data.product;
        setProduct(prod);
      }
      if (prod) await saveToHistory({ ...prod, code });
    };
    load();
    isFavorite(code).then(setFavorite);
  }, []);

  const toggleFavorite = async () => {
    if (favorite) { await removeFavorite(code); setFavorite(false); }
    else { await saveFavorite({ ...product, code }); setFavorite(true); }
  };

  if (!product) {
    return <View style={[styles.center, { backgroundColor: colors.background }]}><Text style={{ color: colors.textSecondary }}>Chargement...</Text></View>;
  }

  const nutriments = product.nutriments || {};
  const energyKcal = nutriments['energy-kcal_100g'] ?? nutriments.energy_kcal_100g ?? (nutriments.energy_100g ? Math.round(nutriments.energy_100g / 4.184) : null);
  const nutriScore = product.nutriscore_grade?.toLowerCase();
  const nova = product.nova_group;
  const allergensTags: string[] = product.allergens_tags ?? [];
  const detectedAllergens = preferences.allergens.filter(a => {
    const keywords = ALLERGEN_MAP[a] ?? [a];
    return allergensTags.some((tag: string) => keywords.some(kw => tag.toLowerCase().includes(kw)));
  });

  if (detectedAllergens.length > 0) {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={{ paddingBottom: 80 }} showsVerticalScrollIndicator={false}>
      {product.image_url
        ? <Image source={{ uri: product.image_url }} style={styles.image} />
        : <View style={[styles.image, styles.placeholder, { backgroundColor: colors.surfaceAlt }]}><Text style={{ color: colors.textMuted }}>Aucune image</Text></View>
      }
      <Text style={[styles.name, { color: colors.text }]}>{product.product_name || 'Sans nom'}</Text>
      <Text style={[styles.brand, { color: colors.textSecondary }]}>{product.brands}</Text>
      <Text style={[styles.qty, { color: colors.textMuted }]}>{product.quantity}</Text>

      {detectedAllergens.length > 0 && (
        <View style={styles.allergenAlert}>
          <Text style={styles.allergenAlertTitle}>⚠️ Attention — Allergène détecté !</Text>
          <Text style={styles.allergenAlertBody}>Ce produit contient : {detectedAllergens.join(', ')}</Text>
        </View>
      )}

      <View style={styles.actions}>
        <TouchableOpacity style={[styles.actionBtn, { backgroundColor: favorite ? '#FEE2E2' : colors.surface, borderColor: favorite ? '#e74c3c' : colors.border }]} onPress={toggleFavorite}>
          <Text style={{ color: favorite ? '#e74c3c' : colors.textSecondary, fontWeight: '600', fontSize: 13 }}>{favorite ? '❤️ Favori' : '🤍 Ajouter aux favoris'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionBtn, { backgroundColor: colors.surface, borderColor: colors.border }]} onPress={() => navigation.navigate('Compare', { product1: { ...product, code } })}>
          <Text style={{ color: colors.textSecondary, fontWeight: '600', fontSize: 13 }}>⚖️ Comparer</Text>
        </TouchableOpacity>
      </View>

      {nutriScore && (
        <View style={[styles.block, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Nutri-Score</Text>
          <View style={[styles.nutriBadge, { backgroundColor: nutriColors[nutriScore] }]}>
            <Text style={styles.nutriText}>{nutriScore.toUpperCase()}</Text>
          </View>
        </View>
      )}

      {nova && (
        <View style={[styles.block, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Groupe NOVA {nova}</Text>
          <Text style={{ color: colors.text }}>{novaDescriptions[nova]}</Text>
        </View>
      )}

      <View style={[styles.block, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Valeurs nutritionnelles (100g)</Text>
        {([
          ['Énergie', energyKcal !== null ? `${energyKcal} kcal` : '—'],
          ['Graisses', nutriments.fat_100g !== undefined ? `${nutriments.fat_100g} g` : '—'],
          ['dont saturées', nutriments['saturated-fat_100g'] !== undefined ? `${nutriments['saturated-fat_100g']} g` : '—'],
          ['Glucides', nutriments.carbohydrates_100g !== undefined ? `${nutriments.carbohydrates_100g} g` : '—'],
          ['dont sucres', nutriments.sugars_100g !== undefined ? `${nutriments.sugars_100g} g` : '—'],
          ['Fibres', nutriments.fiber_100g !== undefined ? `${nutriments.fiber_100g} g` : '—'],
          ['Protéines', nutriments.proteins_100g !== undefined ? `${nutriments.proteins_100g} g` : '—'],
          ['Sel', nutriments.salt_100g !== undefined ? `${nutriments.salt_100g} g` : '—'],
        ] as [string, string][]).map(([label, value], i) => (
          <View key={label} style={[styles.nutriRow, { borderTopColor: colors.border, backgroundColor: i % 2 === 0 ? colors.surfaceAlt : 'transparent' }]}>
            <Text style={[styles.nutriLabel, { color: label.startsWith('dont') ? colors.textSecondary : colors.text }]}>{label}</Text>
            <Text style={[styles.nutriValue, { color: colors.text }]}>{value}</Text>
          </View>
        ))}
      </View>

      <View style={[styles.block, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Ingrédients</Text>
        <Text style={{ color: colors.text, lineHeight: 20 }}>{product.ingredients_text || 'Non disponible'}</Text>
      </View>

      <View style={[styles.block, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Allergènes</Text>
        {allergensTags.length > 0
          ? <Text style={{ color: colors.error, fontWeight: 'bold' }}>{allergensTags.map((a: string) => a.replace('en:', '')).join(', ').toUpperCase()}</Text>
          : <Text style={{ color: '#2ecc71', fontWeight: 'bold' }}>Aucun allergène déclaré</Text>
        }
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  image: { width: '100%', height: 220, borderRadius: 10, marginBottom: 12 },
  placeholder: { justifyContent: 'center', alignItems: 'center' },
  name: { fontSize: 22, fontWeight: 'bold', paddingHorizontal: 16, marginBottom: 4 },
  brand: { paddingHorizontal: 16, marginBottom: 2 },
  qty: { paddingHorizontal: 16, marginBottom: 12 },
  allergenAlert: { marginHorizontal: 16, marginBottom: 12, backgroundColor: '#FEE2E2', borderLeftWidth: 4, borderLeftColor: '#e74c3c', borderRadius: 8, padding: 12 },
  allergenAlertTitle: { color: '#9B1C1C', fontWeight: '700', fontSize: 14, marginBottom: 4 },
  allergenAlertBody: { color: '#9B1C1C', fontSize: 13 },
  actions: { flexDirection: 'row', gap: 10, paddingHorizontal: 16, marginBottom: 12 },
  actionBtn: { flex: 1, paddingVertical: 12, borderRadius: 10, borderWidth: 1, alignItems: 'center' },
  block: { marginHorizontal: 16, marginBottom: 12, borderRadius: 12, borderWidth: 1, padding: 14 },
  sectionTitle: { fontWeight: '700', marginBottom: 10, fontSize: 13, textTransform: 'uppercase', letterSpacing: 0.5 },
  nutriBadge: { width: 56, height: 56, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  nutriText: { color: '#fff', fontSize: 26, fontWeight: 'bold' },
  nutriRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, paddingHorizontal: 4, borderTopWidth: 1 },
  nutriLabel: { fontSize: 13 },
  nutriValue: { fontSize: 13, fontWeight: '600' },
});
