/**
 * ProductScreen — Fiche produit détaillée
 *
 * Affiche toutes les informations d'un produit :
 * - Photo, nom, marque, quantité
 * - Nutri-Score visuel avec code couleur (A→E)
 * - Groupe NOVA avec sa signification (exigé section 3.2)
 * - Tableau nutritionnel complet pour 100g
 * - Liste des ingrédients
 * - Allergènes mis en évidence
 * - Alerte visuelle + haptique si allergène configuré détecté
 * - Bouton "Ajouter aux favoris"
 * - Bouton "Comparer avec un autre produit"
 * - Sauvegarde automatique dans l'historique
 */

import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator, Image, ScrollView,
  StyleSheet, Text, TouchableOpacity, View,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../context/ThemeContext';
import { usePreferences } from '../context/PreferencesContext';
import { useProduct } from '../hooks/useProduct';
import { nutriColors, novaDescriptions } from '../utils/productHelpers';
import { saveToHistory, isFavorite, saveFavorite, removeFavorite } from '../utils/storage';

// Mapping allergènes FR → mots-clés détectés dans allergens_tags de l'API
const ALLERGEN_MAP: Record<string, string[]> = {
  gluten: ['gluten', 'wheat', 'rye', 'barley', 'spelt', 'kamut'],
  lait: ['milk', 'dairy', 'lactose', 'lait', 'cream', 'butter'],
  oeufs: ['egg', 'oeuf', 'eggs'],
  arachides: ['peanut', 'arachide', 'groundnut'],
  fruits_a_coque: ['nut', 'almond', 'hazelnut', 'walnut', 'cashew', 'pistachio', 'pecan'],
  soja: ['soy', 'soja', 'soybean'],
  poisson: ['fish', 'poisson', 'cod', 'salmon', 'tuna'],
  crustaces: ['crustacean', 'shrimp', 'crab', 'lobster', 'prawn'],
  sesame: ['sesame'],
  sulfites: ['sulphite', 'sulfite', 'sulphur', 'sulfur'],
  celeri: ['celery', 'celeri', 'celeriac'],
  moutarde: ['mustard', 'moutarde'],
  lupin: ['lupin', 'lupine'],
};


// Mapping régimes alimentaires → tags incompatibles dans l'API (labels_tags + ingredients_analysis_tags)
const DIET_MAP: Record<string, { label: string; bad: string[] }> = {
  vegetarien:  { label: 'Végétarien',  bad: ['non-vegetarian', 'meat', 'poultry'] },
  vegan:       { label: 'Végan',       bad: ['non-vegan', 'non-vegetarian', 'milk', 'eggs', 'honey'] },
  sans_gluten: { label: 'Sans gluten', bad: ['gluten', 'wheat', 'barley', 'rye'] },
  halal:       { label: 'Halal',       bad: ['non-halal', 'pork', 'alcohol', 'wine', 'beer'] },
  casher:      { label: 'Casher',      bad: ['non-kosher', 'pork', 'shellfish'] },
};

// Tableau nutritionnel complet exigé section 3.2
const NUTRIMENTS_TABLE = [
  { key: 'energy-kcal_100g', label: 'Énergie', unit: 'kcal' },
  { key: 'fat_100g', label: 'Graisses', unit: 'g' },
  { key: 'saturated-fat_100g', label: 'dont saturées', unit: 'g' },
  { key: 'carbohydrates_100g', label: 'Glucides', unit: 'g' },
  { key: 'sugars_100g', label: 'dont sucres', unit: 'g' },
  { key: 'fiber_100g', label: 'Fibres', unit: 'g' },
  { key: 'proteins_100g', label: 'Protéines', unit: 'g' },
  { key: 'salt_100g', label: 'Sel', unit: 'g' },
];

export default function ProductScreen({ route, navigation }: any) {
  const { colors } = useTheme();
  const { preferences } = usePreferences();
  const { code, product: cachedProduct } = route.params;
  const { product, loading, error } = useProduct(code, cachedProduct);
  const [favorite, setFavorite] = useState(false);

  // Sauvegarde dans l'historique + vérification favori
  useEffect(() => {
    if (product) saveToHistory({ ...product, code });
    isFavorite(code).then(setFavorite);
  }, [product]);

  const toggleFavorite = async () => {
    if (favorite) { await removeFavorite(code); setFavorite(false); }
    else { await saveFavorite({ ...product, code }); setFavorite(true); }
  };

  // Écran de chargement
  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Chargement du produit...</Text>
      </View>
    );
  }

  // Écran d'erreur
  if (error || !product) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Text style={{ fontSize: 48, marginBottom: 16 }}>😕</Text>
        <Text style={[styles.errorTitle, { color: colors.text }]}>Produit introuvable</Text>
        <Text style={[styles.errorText, { color: colors.textSecondary }]}>
          {error || 'Ce produit n\'est pas dans la base Open Food Facts.'}
        </Text>
        <TouchableOpacity
          style={[styles.retryBtn, { backgroundColor: colors.primary }]}
          onPress={() => navigation.goBack()}
        >
          <Text style={{ color: '#fff', fontWeight: '700' }}>↩ Rescanner</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const nutriments = product.nutriments || {};
  const nutriScore = product.nutriscore_grade?.toLowerCase();
  const nova = product.nova_group;
  const allergensTags: string[] = product.allergens_tags ?? [];

  // Détection des allergènes configurés par l'utilisateur
  const detectedAllergens = preferences.allergens.filter(a => {
    const keywords = ALLERGEN_MAP[a] ?? [a];
    return allergensTags.some((tag: string) =>
      keywords.some(kw => tag.toLowerCase().includes(kw))
    );
  });


  // Détection régimes incompatibles via labels_tags et ingredients_analysis_tags
  const productTags = [
    ...(product.labels_tags ?? []),
    ...(product.ingredients_analysis_tags ?? []),
  ].map((t: string) => t.toLowerCase());

  const incompatibleDiets = preferences.diets.filter(diet => {
    const info = DIET_MAP[diet];
    if (!info) return false;
    return info.bad.some(bad => productTags.some(t => t.includes(bad)));
  });

  // Retour haptique si allergène détecté (bonus sujet)
  if (detectedAllergens.length > 0) {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingBottom: 80 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Photo du produit */}
      {product.image_url
        ? <Image source={{ uri: product.image_url }} style={styles.image} resizeMode="cover" />
        : (
          <View style={[styles.image, styles.placeholder, { backgroundColor: colors.surfaceAlt }]}>
            <Text style={{ fontSize: 48 }}>🍽️</Text>
            <Text style={{ color: colors.textMuted, marginTop: 8 }}>Aucune image disponible</Text>
          </View>
        )
      }

      {/* Nom, marque, quantité — exigé section 3.2 */}
      <View style={styles.header}>
        <Text style={[styles.name, { color: colors.text }]}>
          {product.product_name || 'Produit sans nom'}
        </Text>
        {product.brands ? (
          <Text style={[styles.brand, { color: colors.textSecondary }]}>{product.brands}</Text>
        ) : null}
        {product.quantity ? (
          <Text style={[styles.quantity, { color: colors.textMuted }]}>{product.quantity}</Text>
        ) : null}
      </View>

      {/* Alerte allergène — visuelle + haptique (exigé section 4.2) */}
      {detectedAllergens.length > 0 && (
        <View style={styles.allergenAlert}>
          <Text style={styles.allergenAlertTitle}>⚠️ Allergène détecté !</Text>
          <Text style={styles.allergenAlertBody}>
            Ce produit contient : {detectedAllergens.map(a => a.replace('_', ' ')).join(', ')}
          </Text>
        </View>
      )}


      {/* Alerte régime alimentaire incompatible — exigé section 4.2 */}
      {incompatibleDiets.length > 0 && (
        <View style={styles.dietAlert}>
          <Text style={styles.dietAlertTitle}>🚫 Régime incompatible</Text>
          <Text style={styles.dietAlertBody}>
            Ce produit ne correspond pas à votre régime : {incompatibleDiets.map(d => DIET_MAP[d]?.label).join(', ')}
          </Text>
        </View>
      )}

      {/* Boutons actions */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.actionBtn, {
            backgroundColor: favorite ? '#FEE2E2' : colors.surface,
            borderColor: favorite ? '#e74c3c' : colors.border,
          }]}
          onPress={toggleFavorite}
        >
          <Text style={{ color: favorite ? '#e74c3c' : colors.textSecondary, fontWeight: '700', fontSize: 14 }}>
            {favorite ? '❤️ Favori' : '🤍 Ajouter aux favoris'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={() => navigation.navigate('Compare', { product1: { ...product, code } })}
        >
          <Text style={{ color: colors.textSecondary, fontWeight: '700', fontSize: 14 }}>⚖️ Comparer</Text>
        </TouchableOpacity>
      </View>

      {/* Nutri-Score — badge coloré A→E (exigé section 3.2) */}
      {nutriScore && (
        <View style={[styles.block, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Nutri-Score</Text>
          <View style={styles.nutriScoreRow}>
            {['a', 'b', 'c', 'd', 'e'].map(g => (
              <View
                key={g}
                style={[
                  styles.nutriScoreStep,
                  {
                    backgroundColor: g === nutriScore ? nutriColors[g] : colors.surfaceAlt,
                    opacity: g === nutriScore ? 1 : 0.4,
                    transform: [{ scale: g === nutriScore ? 1.15 : 1 }],
                  }
                ]}
              >
                <Text style={[styles.nutriScoreStepText, { color: g === nutriScore ? '#fff' : colors.textMuted }]}>
                  {g.toUpperCase()}
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* NOVA — groupe avec signification (exigé section 3.2) */}
      {nova && (
        <View style={[styles.block, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Groupe NOVA</Text>
          <View style={styles.novaRow}>
            <View style={[styles.novaBadge, { backgroundColor: ['#2ecc71','#f1c40f','#e67e22','#e74c3c'][nova - 1] }]}>
              <Text style={styles.novaBadgeText}>{nova}</Text>
            </View>
            <Text style={[styles.novaDesc, { color: colors.text }]}>{novaDescriptions[nova]}</Text>
          </View>
        </View>
      )}

      {/* Tableau nutritionnel complet (exigé section 3.2) */}
      <View style={[styles.block, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Valeurs nutritionnelles (pour 100g)</Text>
        {NUTRIMENTS_TABLE.map(({ key, label, unit }, i) => {
          const value = nutriments[key];
          const isSubItem = label.startsWith('dont');
          return (
            <View
              key={key}
              style={[
                styles.nutriRow,
                { borderTopColor: colors.border, backgroundColor: i % 2 === 0 ? colors.surfaceAlt + '40' : 'transparent' }
              ]}
            >
              <Text style={[
                styles.nutriLabel,
                { color: isSubItem ? colors.textSecondary : colors.text, paddingLeft: isSubItem ? 16 : 0 }
              ]}>
                {label}
              </Text>
              <Text style={[styles.nutriValue, { color: colors.text }]}>
                {value !== undefined && value !== null ? `${Number(value).toFixed(1)} ${unit}` : '—'}
              </Text>
            </View>
          );
        })}
      </View>

      {/* Ingrédients (exigé section 3.2) */}
      <View style={[styles.block, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Ingrédients</Text>
        <Text style={[styles.ingredients, { color: colors.text }]}>
          {product.ingredients_text || 'Ingrédients non disponibles pour ce produit.'}
        </Text>
      </View>

      {/* Allergènes déclarés — mis en évidence (exigé section 3.2) */}
      <View style={[styles.block, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Allergènes déclarés</Text>
        {allergensTags.length > 0 ? (
          <View style={styles.allergenTags}>
            {allergensTags.map((tag: string, i: number) => (
              <View key={i} style={[styles.allergenTag, { backgroundColor: '#FEE2E2' }]}>
                <Text style={{ color: '#9B1C1C', fontWeight: '700', fontSize: 12 }}>
                  {tag.replace('en:', '').replace('-', ' ').toUpperCase()}
                </Text>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.noAllergen}>
            <Text style={{ color: '#166534', fontWeight: '700' }}>✓ Aucun allergène déclaré</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  loadingText: { marginTop: 16, fontSize: 15 },
  errorTitle: { fontSize: 20, fontWeight: '700', marginBottom: 8, textAlign: 'center' },
  errorText: { fontSize: 14, textAlign: 'center', lineHeight: 20, marginBottom: 24 },
  retryBtn: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  image: { width: '100%', height: 240 },
  placeholder: { justifyContent: 'center', alignItems: 'center' },
  header: { paddingHorizontal: 16, paddingVertical: 16, gap: 4 },
  name: { fontSize: 22, fontWeight: '800', lineHeight: 28 },
  brand: { fontSize: 15, fontWeight: '500' },
  quantity: { fontSize: 13 },
  allergenAlert: {
    marginHorizontal: 16, marginBottom: 12,
    backgroundColor: '#FEF2F2', borderLeftWidth: 4,
    borderLeftColor: '#EF4444', borderRadius: 10, padding: 14,
  },
  allergenAlertTitle: { color: '#991B1B', fontWeight: '800', fontSize: 15, marginBottom: 6 },
  allergenAlertBody: { color: '#7F1D1D', fontSize: 13, lineHeight: 18 },
  actions: { flexDirection: 'row', gap: 10, paddingHorizontal: 16, marginBottom: 12 },
  actionBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, borderWidth: 1, alignItems: 'center' },
  block: { marginHorizontal: 16, marginBottom: 12, borderRadius: 14, borderWidth: 1, padding: 16, overflow: 'hidden' },
  sectionTitle: { fontWeight: '700', marginBottom: 12, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1 },
  nutriScoreRow: { flexDirection: 'row', gap: 8, justifyContent: 'center', paddingVertical: 8 },
  nutriScoreStep: { width: 44, height: 44, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  nutriScoreStepText: { fontWeight: '900', fontSize: 16 },
  novaRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  novaBadge: { width: 48, height: 48, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  novaBadgeText: { color: '#fff', fontSize: 22, fontWeight: '900' },
  novaDesc: { flex: 1, fontSize: 14, lineHeight: 20 },
  nutriRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, paddingHorizontal: 4, borderTopWidth: 1 },
  nutriLabel: { fontSize: 14 },
  nutriValue: { fontSize: 14, fontWeight: '700' },
  ingredients: { fontSize: 13, lineHeight: 20 },
  allergenTags: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  allergenTag: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20 },
  dietAlert: {
    marginHorizontal: 16, marginBottom: 12,
    backgroundColor: '#FFF7ED', borderLeftWidth: 4,
    borderLeftColor: '#F97316', borderRadius: 10, padding: 14,
  },
  dietAlertTitle: { color: '#9A3412', fontWeight: '800', fontSize: 15, marginBottom: 6 },
  dietAlertBody: { color: '#7C2D12', fontSize: 13, lineHeight: 18 },
  noAllergen: { backgroundColor: '#F0FDF4', padding: 12, borderRadius: 8, alignItems: 'center' },
});
