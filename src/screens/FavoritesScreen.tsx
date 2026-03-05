/**
 * FavoritesScreen — Gestion des produits favoris
 *
 * Fonctionnalités :
 * - Onglets de filtrage par catégorie
 * - Catégories par défaut : Sans catégorie, Petit-déjeuner, Snacks sains, À éviter
 * - Création et suppression de catégories personnalisées
 * - Déplacement de produit d'une catégorie à une autre
 * - Persistance AsyncStorage
 */

import React, { useCallback, useState } from 'react';
import {
  Alert, FlatList, ScrollView, StyleSheet, Text,
  TextInput, TouchableOpacity, View,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { getFavorites, removeFavorite, deleteCategory, saveFavorite } from '../utils/storage';
import ProductCard from '../components/ProductCard';

// Catégories proposées par défaut (sujet section 4.4)
const DEFAULT_CATEGORIES = ['Sans catégorie', 'Petit-déjeuner', 'Snacks sains', 'À éviter'];

export default function FavoritesScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation<any>();
  const [favorites, setFavorites] = useState<any[]>([]);
  const [activeCategory, setActiveCategory] = useState('Tout');
  const [showNewCat, setShowNewCat] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [movingProduct, setMovingProduct] = useState<any>(null);

  useFocusEffect(
    useCallback(() => {
      getFavorites().then(setFavorites);
    }, [])
  );

  // Toutes les catégories utilisées + par défaut
  const usedCategories = Array.from(new Set(favorites.map((f: any) => f.category)));
  const allCategories = Array.from(new Set([...DEFAULT_CATEGORIES, ...usedCategories]));
  const tabs = ['Tout', ...allCategories];
  const displayed = activeCategory === 'Tout' ? favorites : favorites.filter((f: any) => f.category === activeCategory);

  const handleRemove = (item: any) => {
    Alert.alert('Retirer', `Retirer "${item.product_name}" des favoris ?`, [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Retirer',
        style: 'destructive',
        onPress: async () => {
          await removeFavorite(item.code);
          setFavorites(prev => prev.filter((f: any) => f.code !== item.code));
        },
      },
    ]);
  };

  const handleDeleteCategory = (cat: string) => {
    if (DEFAULT_CATEGORIES.includes(cat)) {
      Alert.alert('Info', 'Les catégories par défaut ne peuvent pas être supprimées.');
      return;
    }
    Alert.alert('Supprimer', `Supprimer la catégorie "${cat}" et ses produits ?`, [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: async () => {
          await deleteCategory(cat);
          setFavorites(prev => prev.filter((f: any) => f.category !== cat));
          setActiveCategory('Tout');
        },
      },
    ]);
  };

  // Déplacer un produit vers une autre catégorie
  const handleMove = async (product: any, newCat: string) => {
    await saveFavorite({ ...product }, newCat);
    const updated = await getFavorites();
    setFavorites(updated);
    setMovingProduct(null);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>

      {/* Onglets catégories */}
      <View style={{ borderBottomWidth: 1, borderBottomColor: colors.border }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabs}>
          {tabs.map(cat => (
            <TouchableOpacity
              key={cat}
              style={[styles.tab, { backgroundColor: activeCategory === cat ? colors.primary : colors.surfaceAlt }]}
              onPress={() => setActiveCategory(cat)}
            >
              <Text style={[styles.tabText, { color: activeCategory === cat ? '#fff' : colors.textSecondary }]}>
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
          {/* Bouton créer catégorie */}
          <TouchableOpacity
            style={[styles.tab, { backgroundColor: colors.primaryLight }]}
            onPress={() => setShowNewCat(true)}
          >
            <Text style={[styles.tabText, { color: colors.primary }]}>＋ Nouvelle</Text>
          </TouchableOpacity>
        </ScrollView>

        {/* Bouton supprimer catégorie active */}
        {activeCategory !== 'Tout' && !DEFAULT_CATEGORIES.includes(activeCategory) && (
          <TouchableOpacity style={{ paddingHorizontal: 16, paddingBottom: 8 }} onPress={() => handleDeleteCategory(activeCategory)}>
            <Text style={{ color: colors.error, fontSize: 12 }}>🗑️ Supprimer cette catégorie</Text>
          </TouchableOpacity>
        )}

        {/* Formulaire nouvelle catégorie */}
        {showNewCat && (
          <View style={[styles.newCatForm, { borderTopColor: colors.border }]}>
            <TextInput
              style={[styles.newCatInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surface }]}
              placeholder="Nom de la catégorie..."
              placeholderTextColor={colors.textMuted}
              value={newCatName}
              onChangeText={setNewCatName}
              autoFocus
            />
            <TouchableOpacity
              style={[styles.newCatBtn, { backgroundColor: colors.primary }]}
              onPress={() => {
                if (newCatName.trim()) {
                  setActiveCategory(newCatName.trim());
                  setNewCatName('');
                  setShowNewCat(false);
                }
              }}
            >
              <Text style={{ color: '#fff', fontWeight: '600' }}>Créer</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Modal déplacement de catégorie */}
      {movingProduct && (
        <View style={[styles.moveModal, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.moveTitle, { color: colors.text }]}>Déplacer vers :</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {tabs.filter(t => t !== 'Tout' && t !== movingProduct.category).map(cat => (
              <TouchableOpacity key={cat} style={[styles.moveCat, { backgroundColor: colors.primary }]} onPress={() => handleMove(movingProduct, cat)}>
                <Text style={{ color: '#fff', fontSize: 12, fontWeight: '600' }}>{cat}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          <TouchableOpacity onPress={() => setMovingProduct(null)}>
            <Text style={{ color: colors.error, textAlign: 'center', marginTop: 8 }}>Annuler</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Liste produits */}
      {displayed.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>❤️</Text>
          <Text style={[styles.emptyTitle, { color: colors.text }]}>
            {activeCategory === 'Tout' ? 'Aucun favori' : `Aucun produit dans "${activeCategory}"`}
          </Text>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            Ajoutez des produits depuis leur fiche.
          </Text>
        </View>
      ) : (
        <FlatList
          data={displayed}
          keyExtractor={(item, idx) => item.code ?? `fav-${idx}`}
          renderItem={({ item }) => (
            <View>
              <ProductCard
                product={item}
                subtitle={item.category}
                onPress={() => navigation.navigate('ProductFavorites', { code: item.code, product: item })}
                onDelete={() => handleRemove(item)}
              />
              {/* Bouton déplacer */}
              <TouchableOpacity
                style={[styles.moveBtn, { backgroundColor: colors.surfaceAlt }]}
                onPress={() => setMovingProduct(item)}
              >
                <Text style={{ color: colors.textSecondary, fontSize: 11 }}>📂 Déplacer vers une autre catégorie</Text>
              </TouchableOpacity>
            </View>
          )}
          contentContainerStyle={{ paddingBottom: 30 }}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  tabs: { paddingHorizontal: 12, paddingVertical: 10, gap: 8 },
  tab: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20 },
  tabText: { fontSize: 13, fontWeight: '600' },
  newCatForm: { flexDirection: 'row', gap: 10, padding: 12, borderTopWidth: 1 },
  newCatInput: { flex: 1, borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, fontSize: 14 },
  newCatBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, justifyContent: 'center' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 12 },
  emptyIcon: { fontSize: 48 },
  emptyTitle: { fontSize: 18, fontWeight: '700', textAlign: 'center' },
  emptyText: { fontSize: 14, textAlign: 'center' },
  moveBtn: { marginHorizontal: 28, marginTop: -2, marginBottom: 4, paddingVertical: 6, borderRadius: 8, alignItems: 'center' },
  moveModal: { margin: 16, padding: 16, borderRadius: 12, borderWidth: 1 },
  moveTitle: { fontWeight: '700', marginBottom: 10 },
  moveCat: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, marginRight: 8 },
});
