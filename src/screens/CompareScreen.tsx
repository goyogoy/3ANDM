import React, { useState } from 'react';
import { FlatList, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRoute } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { getHistory } from '../utils/storage';
import { nutriColors } from '../utils/productHelpers';

const CRITERIA = [
  { key: 'energy-kcal_100g', label: 'Calories', lower: true },
  { key: 'fat_100g', label: 'Graisses (g)', lower: true },
  { key: 'sugars_100g', label: 'Sucres (g)', lower: true },
  { key: 'salt_100g', label: 'Sel (g)', lower: true },
  { key: 'fiber_100g', label: 'Fibres (g)', lower: false },
  { key: 'proteins_100g', label: 'Protéines (g)', lower: false },
];

const nutriToNum = (g?: string) => ({ a: 5, b: 4, c: 3, d: 2, e: 1 }[g?.toLowerCase() ?? ''] ?? 0);

export default function CompareScreen() {
  const { colors } = useTheme();
  const route = useRoute<any>();
  const { product1 } = route.params;
  const [product2, setProduct2] = useState<any>(null);
  const [picking, setPicking] = useState(true);
  const [history, setHistory] = useState<any[]>([]);

  const loadHistory = async () => {
    const h = await getHistory();
    setHistory(h);
    setProduct2(null);
    setPicking(true);
  };

  if (picking) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={[styles.pickTitle, { color: colors.text }]}>Choisir le produit à comparer</Text>
        <Text style={[styles.pickSub, { color: colors.textSecondary }]}>Sélectionnez depuis votre historique</Text>
        {history.length === 0 ? (
          <TouchableOpacity style={[styles.loadBtn, { backgroundColor: colors.primary }]} onPress={loadHistory}>
            <Text style={styles.loadBtnText}>Charger l'historique</Text>
          </TouchableOpacity>
        ) : (
          <FlatList
            data={history.filter((h: any) => h.code !== product1.code)}
            keyExtractor={(item, idx) => item.code ?? `c-${idx}`}
            renderItem={({ item }) => (
              <TouchableOpacity style={[styles.pickCard, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={() => { setProduct2(item); setPicking(false); }} activeOpacity={0.7}>
                {item.image_url && <Image source={{ uri: item.image_url }} style={styles.pickImage} />}
                <View style={{ flex: 1 }}>
                  <Text style={[styles.pickName, { color: colors.text }]} numberOfLines={2}>{item.product_name ?? 'Inconnu'}</Text>
                </View>
                {item.nutriscore_grade && <View style={[styles.smallBadge, { backgroundColor: nutriColors[item.nutriscore_grade] }]}><Text style={styles.smallBadgeText}>{item.nutriscore_grade.toUpperCase()}</Text></View>}
              </TouchableOpacity>
            )}
          />
        )}
      </View>
    );
  }

  if (!product2) return null;

  const scores = { p1: 0, p2: 0 };
  const details = CRITERIA.map(({ key, label, lower }) => {
    const v1 = product1.nutriments?.[key] ?? null;
    const v2 = product2.nutriments?.[key] ?? null;
    let winner: 'p1' | 'p2' | 'tie' = 'tie';
    if (v1 !== null && v2 !== null && v1 !== v2) {
      const p1wins = lower ? v1 < v2 : v1 > v2;
      winner = p1wins ? 'p1' : 'p2';
      if (p1wins) scores.p1++; else scores.p2++;
    }
    return { label, v1, v2, winner };
  });

  const ns1 = nutriToNum(product1.nutriscore_grade);
  const ns2 = nutriToNum(product2.nutriscore_grade);
  if (ns1 > ns2) scores.p1++; else if (ns2 > ns1) scores.p2++;

  const winner = scores.p1 > scores.p2 ? 'p1' : scores.p2 > scores.p1 ? 'p2' : 'tie';
  const winnerName = winner === 'p1' ? product1.product_name : winner === 'p2' ? product2.product_name : null;

  return (
    <ScrollView style={{ backgroundColor: colors.background }} contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
      <View style={[styles.headerRow, { backgroundColor: colors.surface }]}>
        {[product1, product2].map((p, i) => (
          <View key={i} style={styles.prodHeader}>
            {p.image_url && <Image source={{ uri: p.image_url }} style={styles.prodImage} resizeMode="cover" />}
            {p.nutriscore_grade && <View style={[styles.smallBadge, { backgroundColor: nutriColors[p.nutriscore_grade] }]}><Text style={styles.smallBadgeText}>{p.nutriscore_grade.toUpperCase()}</Text></View>}
            <Text style={[styles.prodName, { color: colors.text }]} numberOfLines={2}>{p.product_name ?? 'Inconnu'}</Text>
          </View>
        ))}
      </View>

      <View style={[styles.winnerBanner, { backgroundColor: winner === 'tie' ? colors.surfaceAlt : colors.primaryLight, borderColor: winner === 'tie' ? colors.border : colors.primary }]}>
        <Text style={[styles.winnerText, { color: winner === 'tie' ? colors.textSecondary : colors.primary }]}>
          {winner === 'tie' ? 'Égalité !' : `${winnerName} gagne (${Math.max(scores.p1, scores.p2)} critères)`}
        </Text>
      </View>

      <View style={{ marginHorizontal: 16 }}>
        {details.map((row, i) => (
          <View key={i} style={[styles.compareRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={[styles.cell, row.winner === 'p1' && styles.win, row.winner === 'p2' && styles.lose]}>
              <Text style={[styles.cellValue, { color: row.winner === 'p1' ? '#1a7a4a' : row.winner === 'p2' ? '#e63946' : colors.text }]}>{row.v1 !== null ? (row.v1 as number).toFixed(1) : '—'}</Text>
            </View>
            <Text style={[styles.rowLabel, { color: colors.textSecondary }]}>{row.label}</Text>
            <View style={[styles.cell, row.winner === 'p2' && styles.win, row.winner === 'p1' && styles.lose]}>
              <Text style={[styles.cellValue, { color: row.winner === 'p2' ? '#1a7a4a' : row.winner === 'p1' ? '#e63946' : colors.text }]}>{row.v2 !== null ? (row.v2 as number).toFixed(1) : '—'}</Text>
            </View>
          </View>
        ))}
        <View style={[styles.scoreRow, { borderColor: colors.border }]}>
          <Text style={[styles.scoreVal, { color: scores.p1 >= scores.p2 ? '#1a7a4a' : '#e63946' }]}>{scores.p1} pts</Text>
          <Text style={[styles.scoreLabel, { color: colors.textMuted }]}>Score</Text>
          <Text style={[styles.scoreVal, { color: scores.p2 >= scores.p1 ? '#1a7a4a' : '#e63946' }]}>{scores.p2} pts</Text>
        </View>
      </View>

      <TouchableOpacity style={[styles.changeBtn, { borderColor: colors.border }]} onPress={loadHistory}>
        <Text style={[styles.changeBtnText, { color: colors.textSecondary }]}>Changer le produit comparé</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  pickTitle: { fontSize: 20, fontWeight: '700', marginBottom: 6 },
  pickSub: { fontSize: 14, marginBottom: 16 },
  loadBtn: { alignSelf: 'center', paddingHorizontal: 24, paddingVertical: 14, borderRadius: 12, marginTop: 20 },
  loadBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  pickCard: { flexDirection: 'row', alignItems: 'center', padding: 12, marginVertical: 4, borderRadius: 12, borderWidth: 1, gap: 12 },
  pickImage: { width: 48, height: 48, borderRadius: 8 },
  pickName: { fontSize: 14, fontWeight: '600' },
  headerRow: { flexDirection: 'row', padding: 16, marginBottom: 8 },
  prodHeader: { flex: 1, alignItems: 'center', gap: 8 },
  prodImage: { width: 80, height: 80, borderRadius: 10, backgroundColor: '#E5E7EB' },
  prodName: { fontSize: 12, fontWeight: '600', textAlign: 'center' },
  smallBadge: { width: 24, height: 24, borderRadius: 4, alignItems: 'center', justifyContent: 'center' },
  smallBadgeText: { color: '#fff', fontWeight: '900', fontSize: 12 },
  winnerBanner: { marginHorizontal: 16, marginBottom: 16, borderWidth: 1, borderRadius: 10, padding: 14, alignItems: 'center' },
  winnerText: { fontSize: 15, fontWeight: '700', textAlign: 'center' },
  compareRow: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 8, marginBottom: 6, overflow: 'hidden' },
  cell: { width: 80, paddingVertical: 10, alignItems: 'center' },
  win: { backgroundColor: '#D1FAE5' },
  lose: { backgroundColor: '#FEE2E2' },
  rowLabel: { flex: 1, textAlign: 'center', fontSize: 12 },
  cellValue: { fontSize: 14, fontWeight: '700' },
  scoreRow: { flexDirection: 'row', alignItems: 'center', borderTopWidth: 2, paddingTop: 12, marginTop: 4 },
  scoreVal: { flex: 1, fontSize: 20, fontWeight: '900', textAlign: 'center' },
  scoreLabel: { fontSize: 13, textAlign: 'center' },
  changeBtn: { marginHorizontal: 16, marginTop: 20, borderWidth: 1, borderRadius: 10, paddingVertical: 14, alignItems: 'center' },
  changeBtnText: { fontSize: 14 },
});
