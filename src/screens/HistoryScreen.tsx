import React, { useCallback, useState } from 'react';
import { Alert, FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { getHistory, deleteFromHistory, clearHistory } from '../utils/storage';
import { nutriColors } from '../utils/productHelpers';

export default function HistoryScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation<any>();
  const [history, setHistory] = useState<any[]>([]);

  useFocusEffect(useCallback(() => { getHistory().then(setHistory); }, []));

  const handleDelete = (item: any) => {
    Alert.alert('Supprimer', `Retirer "${item.product_name ?? 'ce produit'}" ?`, [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Supprimer', style: 'destructive', onPress: async () => {
        await deleteFromHistory(item.code);
        setHistory(prev => prev.filter((p: any) => p.code !== item.code));
      }},
    ]);
  };

  const handleClear = () => {
    Alert.alert('Vider', "Supprimer tout l'historique ?", [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Vider', style: 'destructive', onPress: async () => { await clearHistory(); setHistory([]); } },
    ]);
  };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  if (history.length === 0) {
    return (
      <View style={[styles.empty, { backgroundColor: colors.background }]}>
        <Text style={[styles.emptyTitle, { color: colors.text }]}>Aucun scan pour l'instant</Text>
        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>Scannez un produit pour démarrer votre historique.</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={history}
        keyExtractor={(item, idx) => item.code ?? `h-${idx}`}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={[styles.count, { color: colors.textSecondary }]}>{history.length} produit{history.length > 1 ? 's' : ''}</Text>
            <TouchableOpacity onPress={handleClear}>
              <Text style={{ color: colors.error, fontSize: 13, fontWeight: '600' }}>Tout effacer</Text>
            </TouchableOpacity>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => navigation.navigate('ProductHistory', { code: item.code, product: item })}
            activeOpacity={0.7}
          >
            {item.image_url
              ? <Image source={{ uri: item.image_url }} style={styles.image} />
              : <View style={[styles.image, { backgroundColor: colors.surfaceAlt, justifyContent: 'center', alignItems: 'center' }]}><Text style={{ fontSize: 22 }}>🍽️</Text></View>
            }
            <View style={styles.info}>
              <Text style={[styles.name, { color: colors.text }]} numberOfLines={2}>{item.product_name ?? 'Produit inconnu'}</Text>
              <Text style={[styles.date, { color: colors.textMuted }]}>{formatDate(item.scannedAt)}</Text>
            </View>
            <View style={styles.right}>
              {item.nutriscore_grade && (
                <View style={[styles.badge, { backgroundColor: nutriColors[item.nutriscore_grade.toLowerCase()] }]}>
                  <Text style={styles.badgeText}>{item.nutriscore_grade.toUpperCase()}</Text>
                </View>
              )}
              <TouchableOpacity onPress={() => handleDelete(item)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Text style={{ color: colors.error, fontSize: 16 }}>🗑️</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        )}
        contentContainerStyle={{ paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '700', textAlign: 'center' },
  emptyText: { fontSize: 14, textAlign: 'center', lineHeight: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 },
  count: { fontSize: 13 },
  card: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, marginVertical: 6, borderRadius: 12, borderWidth: 1, padding: 12, gap: 12 },
  image: { width: 56, height: 56, borderRadius: 8 },
  info: { flex: 1, gap: 4 },
  name: { fontSize: 14, fontWeight: '600' },
  date: { fontSize: 11 },
  right: { alignItems: 'center', gap: 8 },
  badge: { width: 28, height: 28, borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
  badgeText: { color: '#fff', fontWeight: '900', fontSize: 14 },
});
