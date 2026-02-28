import React, { useCallback, useState } from 'react';
import { Alert, FlatList, Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { getFavorites, removeFavorite, deleteCategory } from '../utils/storage';
import { nutriColors } from '../utils/productHelpers';

export default function FavoritesScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation<any>();
  const [favorites, setFavorites] = useState<any[]>([]);
  const [activeCategory, setActiveCategory] = useState('Tout');
  const [showNewCat, setShowNewCat] = useState(false);
  const [newCatName, setNewCatName] = useState('');

  useFocusEffect(useCallback(() => { getFavorites().then(setFavorites); }, []));

  const categories = ['Tout', ...Array.from(new Set(favorites.map((f: any) => f.category)))];
  const displayed = activeCategory === 'Tout' ? favorites : favorites.filter((f: any) => f.category === activeCategory);

  const handleRemove = (item: any) => {
    Alert.alert('Retirer', `Retirer "${item.product_name}" des favoris ?`, [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Retirer', style: 'destructive', onPress: async () => {
        await removeFavorite(item.code);
        setFavorites(prev => prev.filter((f: any) => f.code !== item.code));
      }},
    ]);
  };

  const handleDeleteCategory = (cat: string) => {
    Alert.alert('Supprimer', `Supprimer la catégorie "${cat}" ?`, [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Supprimer', style: 'destructive', onPress: async () => {
        await deleteCategory(cat);
        setFavorites(prev => prev.filter((f: any) => f.category !== cat));
        setActiveCategory('Tout');
      }},
    ]);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={{ borderBottomWidth: 1, borderBottomColor: colors.border }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabs}>
          {categories.map(cat => (
            <TouchableOpacity key={cat} style={[styles.tab, { backgroundColor: activeCategory === cat ? colors.primary : colors.surfaceAlt }]} onPress={() => setActiveCategory(cat)}>
              <Text style={[styles.tabText, { color: activeCategory === cat ? '#fff' : colors.textSecondary }]}>{cat}</Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity style={[styles.tab, { backgroundColor: colors.primaryLight }]} onPress={() => setShowNewCat(true)}>
            <Text style={[styles.tabText, { color: colors.primary }]}>＋</Text>
          </TouchableOpacity>
        </ScrollView>
        {activeCategory !== 'Tout' && (
          <TouchableOpacity style={{ paddingHorizontal: 16, paddingBottom: 8 }} onPress={() => handleDeleteCategory(activeCategory)}>
            <Text style={{ color: colors.error, fontSize: 12 }}>Supprimer la catégorie</Text>
          </TouchableOpacity>
        )}
        {showNewCat && (
          <View style={[styles.newCatForm, { borderTopColor: colors.border }]}>
            <TextInput style={[styles.newCatInput, { color: colors.text, borderColor: colors.border }]} placeholder="Nom de la catégorie..." placeholderTextColor={colors.textMuted} value={newCatName} onChangeText={setNewCatName} autoFocus />
            <TouchableOpacity style={[styles.newCatBtn, { backgroundColor: colors.primary }]} onPress={() => { if (newCatName.trim()) { setActiveCategory(newCatName.trim()); setNewCatName(''); setShowNewCat(false); } }}>
              <Text style={{ color: '#fff', fontWeight: '600' }}>Créer</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
      {displayed.length === 0 ? (
        <View style={styles.empty}>
          <Text style={[styles.emptyTitle, { color: colors.text }]}>Aucun favori</Text>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>Ajoutez des produits depuis leur fiche.</Text>
        </View>
      ) : (
        <FlatList
          data={displayed}
          keyExtractor={(item, idx) => item.code ?? `fav-${idx}`}
          renderItem={({ item }) => (
            <TouchableOpacity style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={() => navigation.navigate('ProductFavorites', { code: item.code, product: item })} activeOpacity={0.7}>
              {item.image_url ? <Image source={{ uri: item.image_url }} style={styles.image} /> : <View style={[styles.image, { backgroundColor: colors.surfaceAlt, justifyContent: 'center', alignItems: 'center' }]}><Text style={{ fontSize: 22 }}>🍽️</Text></View>}
              <View style={styles.info}>
                <Text style={[styles.name, { color: colors.text }]} numberOfLines={2}>{item.product_name ?? 'Produit inconnu'}</Text>
                <Text style={[styles.cat, { color: colors.textMuted }]}>{item.category}</Text>
              </View>
              <View style={styles.right}>
                {item.nutriscore_grade && <View style={[styles.badge, { backgroundColor: nutriColors[item.nutriscore_grade.toLowerCase()] }]}><Text style={styles.badgeText}>{item.nutriscore_grade.toUpperCase()}</Text></View>}
                <TouchableOpacity onPress={() => handleRemove(item)}><Text style={{ color: colors.error, fontSize: 16 }}>🗑️</Text></TouchableOpacity>
              </View>
            </TouchableOpacity>
          )}
          contentContainerStyle={{ paddingBottom: 24 }}
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
  emptyTitle: { fontSize: 18, fontWeight: '700', textAlign: 'center' },
  emptyText: { fontSize: 14, textAlign: 'center' },
  card: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, marginVertical: 6, borderRadius: 12, borderWidth: 1, padding: 12, gap: 12 },
  image: { width: 56, height: 56, borderRadius: 8 },
  info: { flex: 1, gap: 4 },
  name: { fontSize: 14, fontWeight: '600' },
  cat: { fontSize: 11 },
  right: { alignItems: 'center', gap: 8 },
  badge: { width: 28, height: 28, borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
  badgeText: { color: '#fff', fontWeight: '900', fontSize: 14 },
});
