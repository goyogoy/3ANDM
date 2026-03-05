/**
 * HistoryScreen — Historique des produits scannés
 *
 * Fonctionnalités :
 * - Liste chronologique inverse des scans
 * - Suppression individuelle ou totale
 * - Accès au Dashboard et au Comparateur depuis cet écran (exigé par le sujet)
 * - Persistance AsyncStorage entre sessions
 */

import React, { useCallback, useState } from 'react';
import { Alert, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { getHistory, deleteFromHistory, clearHistory } from '../utils/storage';
import ProductCard from '../components/ProductCard';
import SectionHeader from '../components/SectionHeader';

export default function HistoryScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation<any>();
  const [history, setHistory] = useState<any[]>([]);

  // Recharge l'historique à chaque fois qu'on revient sur cet écran
  useFocusEffect(
    useCallback(() => {
      getHistory().then(setHistory);
    }, [])
  );

  const handleDelete = (item: any) => {
    Alert.alert(
      'Supprimer',
      `Retirer "${item.product_name ?? 'ce produit'}" de l'historique ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            await deleteFromHistory(item.code);
            setHistory(prev => prev.filter((p: any) => p.code !== item.code));
          },
        },
      ]
    );
  };

  const handleClear = () => {
    Alert.alert("Tout effacer", "Supprimer tout l'historique ?", [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Vider',
        style: 'destructive',
        onPress: async () => {
          await clearHistory();
          setHistory([]);
        },
      },
    ]);
  };

  if (history.length === 0) {
    return (
      <View style={[styles.empty, { backgroundColor: colors.background }]}>
        <Text style={styles.emptyIcon}>📋</Text>
        <Text style={[styles.emptyTitle, { color: colors.text }]}>Aucun scan pour l'instant</Text>
        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
          Scannez un produit pour démarrer votre historique.
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Accès rapide Dashboard + Comparateur — exigé par le sujet section 8 */}
      <View style={styles.quickAccess}>
        <TouchableOpacity
          style={[styles.quickBtn, { backgroundColor: colors.primary }]}
          onPress={() => navigation.navigate('Dashboard')}
        >
          <Text style={styles.quickBtnText}>📊 Mon Dashboard</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.quickBtn, { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 }]}
          onPress={() => Alert.alert('Comparateur', "Ouvrez un produit depuis l'historique puis appuyez sur Comparer.")}
        >
          <Text style={[styles.quickBtnText, { color: colors.textSecondary }]}>⚖️ Comparateur</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={history}
        keyExtractor={(item, idx) => item.code ?? `h-${idx}`}
        ListHeaderComponent={
          <SectionHeader
            title={`${history.length} produit${history.length > 1 ? 's' : ''} scanné${history.length > 1 ? 's' : ''}`}
            actionLabel="Tout effacer"
            onAction={handleClear}
          />
        }
        renderItem={({ item }) => (
          <ProductCard
            product={item}
            onPress={() => navigation.navigate('ProductHistory', { code: item.code, product: item })}
            onDelete={() => handleDelete(item)}
            showDate
          />
        )}
        contentContainerStyle={{ paddingBottom: 30 }}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 12 },
  emptyIcon: { fontSize: 48 },
  emptyTitle: { fontSize: 18, fontWeight: '700', textAlign: 'center' },
  emptyText: { fontSize: 14, textAlign: 'center', lineHeight: 20 },
  quickAccess: { flexDirection: 'row', gap: 10, paddingHorizontal: 16, paddingVertical: 12 },
  quickBtn: { flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: 'center' },
  quickBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
});
