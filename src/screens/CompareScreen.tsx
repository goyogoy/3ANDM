/**
 * CompareScreen — Comparateur de produits
 *
 * Fonctionnalités :
 * - Affichage côte à côte de deux produits
 * - Critères comparés : Nutri-Score, NOVA, calories, graisses, sucres, sel, fibres, protéines
 * - Code couleur vert (meilleur) / rouge (moins bon) par critère
 * - Résumé du gagnant avec score total
 * - Sélection du 2ème produit depuis l'historique
 */

import React, { useState } from 'react';
import { FlatList, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRoute } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { getHistory } from '../utils/storage';
import { nutriColors, novaDescriptions } from '../utils/productHelpers';
import NutriScoreBadge from '../components/NutriScoreBadge';

// Critères nutritionnels à comparer (lower=true : plus bas = meilleur)
const CRITERIA = [
  { key: 'energy-kcal_100g', label: 'Calories (kcal)', lower: true },
  { key: 'fat_100g', label: 'Graisses (g)', lower: true },
  { key: 'sugars_100g', label: 'Sucres (g)', lower: true },
  { key: 'salt_100g', label: 'Sel (g)', lower: true },
  { key: 'fiber_100g', label: 'Fibres (g)', lower: false },
  { key: 'proteins_100g', label: 'Protéines (g)', lower: false },
];

// Convertit le Nutri-Score en valeur numérique pour comparaison
const nutriToNum = (g?: string): number =>
  ({ a: 5, b: 4, c: 3, d: 2, e: 1 }[g?.toLowerCase() ?? ''] ?? 0);

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

  // Écran de sélection du 2ème produit
  if (picking) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.product1Preview, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.previewLabel, { color: colors.textSecondary }]}>Produit à comparer</Text>
          <Text style={[styles.previewName, { color: colors.text }]} numberOfLines={1}>
            {product1.product_name ?? 'Produit 1'}
          </Text>
        </View>
        <Text style={[styles.pickTitle, { color: colors.text }]}>Choisir le 2ème produit</Text>
        <Text style={[styles.pickSub, { color: colors.textSecondary }]}>Depuis votre historique</Text>
        {history.length === 0 ? (
          <TouchableOpacity style={[styles.loadBtn, { backgroundColor: colors.primary }]} onPress={loadHistory}>
            <Text style={styles.loadBtnText}>📋 Charger l'historique</Text>
          </TouchableOpacity>
        ) : (
          <FlatList
            data={history.filter((h: any) => h.code !== product1.code)}
            keyExtractor={(item, idx) => item.code ?? `c-${idx}`}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.pickCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                onPress={() => { setProduct2(item); setPicking(false); }}
                activeOpacity={0.7}
              >
                {item.image_url && <Image source={{ uri: item.image_url }} style={styles.pickImage} />}
                <View style={{ flex: 1 }}>
                  <Text style={[styles.pickName, { color: colors.text }]} numberOfLines={2}>
                    {item.product_name ?? 'Inconnu'}
                  </Text>
                  <Text style={[{ color: colors.textMuted, fontSize: 11 }]}>{item.brands}</Text>
                </View>
                {item.nutriscore_grade && <NutriScoreBadge grade={item.nutriscore_grade} size="sm" />}
              </TouchableOpacity>
            )}
          />
        )}
      </View>
    );
  }

  if (!product2) return null;

  // Calcul des scores
  const scores = { p1: 0, p2: 0 };

  // Comparaison Nutri-Score
  const ns1 = nutriToNum(product1.nutriscore_grade);
  const ns2 = nutriToNum(product2.nutriscore_grade);
  if (ns1 > ns2) scores.p1++; else if (ns2 > ns1) scores.p2++;

  // Comparaison NOVA (plus bas = moins transformé = meilleur)
  const nova1 = product1.nova_group ?? null;
  const nova2 = product2.nova_group ?? null;
  if (nova1 && nova2 && nova1 !== nova2) {
    if (nova1 < nova2) scores.p1++; else scores.p2++;
  }

  // Comparaison critères nutritionnels
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

  const winner = scores.p1 > scores.p2 ? 'p1' : scores.p2 > scores.p1 ? 'p2' : 'tie';
  const winnerName = winner === 'p1' ? product1.product_name : winner === 'p2' ? product2.product_name : null;
  const totalCriteria = scores.p1 + scores.p2;

  return (
    <ScrollView style={{ backgroundColor: colors.background }} contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>

      {/* En-tête deux colonnes */}
      <View style={[styles.headerRow, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        {[product1, product2].map((p, i) => (
          <View key={i} style={styles.prodHeader}>
            {p.image_url
              ? <Image source={{ uri: p.image_url }} style={styles.prodImage} resizeMode="cover" />
              : <View style={[styles.prodImage, { backgroundColor: colors.surfaceAlt, justifyContent: 'center', alignItems: 'center' }]}><Text style={{ fontSize: 28 }}>🍽️</Text></View>
            }
            {p.nutriscore_grade && <NutriScoreBadge grade={p.nutriscore_grade} size="md" />}
            <Text style={[styles.prodName, { color: colors.text }]} numberOfLines={2}>
              {p.product_name ?? 'Inconnu'}
            </Text>
          </View>
        ))}
      </View>

      {/* Bandeau gagnant */}
      <View style={[styles.winnerBanner, {
        backgroundColor: winner === 'tie' ? colors.surfaceAlt : colors.primaryLight,
        borderColor: winner === 'tie' ? colors.border : colors.primary,
      }]}>
        <Text style={[styles.winnerText, { color: winner === 'tie' ? colors.textSecondary : colors.primary }]}>
          {winner === 'tie'
            ? '🤝 Égalité parfaite !'
            : `🏆 ${winnerName} gagne (${Math.max(scores.p1, scores.p2)}/${totalCriteria} critères)`}
        </Text>
      </View>

      {/* Comparaison Nutri-Score */}
      <View style={{ marginHorizontal: 16, marginBottom: 8 }}>
        <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>NUTRI-SCORE</Text>
        <View style={[styles.compareRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={[styles.cell, ns1 > ns2 && styles.win, ns1 < ns2 && styles.lose]}>
            <NutriScoreBadge grade={product1.nutriscore_grade ?? '?'} size="md" />
          </View>
          <Text style={[styles.rowLabel, { color: colors.textSecondary }]}>Score</Text>
          <View style={[styles.cell, ns2 > ns1 && styles.win, ns2 < ns1 && styles.lose]}>
            <NutriScoreBadge grade={product2.nutriscore_grade ?? '?'} size="md" />
          </View>
        </View>

        {/* Comparaison NOVA */}
        <Text style={[styles.sectionLabel, { color: colors.textSecondary, marginTop: 12 }]}>NOVA (transformation)</Text>
        <View style={[styles.compareRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={[styles.cell,
            nova1 && nova2 && nova1 < nova2 && styles.win,
            nova1 && nova2 && nova1 > nova2 && styles.lose
          ]}>
            <Text style={[styles.cellValue, { color: colors.text }]}>{nova1 ? `NOVA ${nova1}` : '—'}</Text>
            {nova1 && <Text style={{ fontSize: 9, color: colors.textMuted, textAlign: 'center' }}>{novaDescriptions[nova1]?.split(' ').slice(0, 2).join(' ')}</Text>}
          </View>
          <Text style={[styles.rowLabel, { color: colors.textSecondary }]}>Transformation</Text>
          <View style={[styles.cell,
            nova1 && nova2 && nova2 < nova1 && styles.win,
            nova1 && nova2 && nova2 > nova1 && styles.lose
          ]}>
            <Text style={[styles.cellValue, { color: colors.text }]}>{nova2 ? `NOVA ${nova2}` : '—'}</Text>
            {nova2 && <Text style={{ fontSize: 9, color: colors.textMuted, textAlign: 'center' }}>{novaDescriptions[nova2]?.split(' ').slice(0, 2).join(' ')}</Text>}
          </View>
        </View>

        {/* Critères nutritionnels */}
        <Text style={[styles.sectionLabel, { color: colors.textSecondary, marginTop: 12 }]}>VALEURS NUTRITIONNELLES</Text>
        {details.map((row, i) => (
          <View key={i} style={[styles.compareRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={[styles.cell, row.winner === 'p1' && styles.win, row.winner === 'p2' && styles.lose]}>
              <Text style={[styles.cellValue, {
                color: row.winner === 'p1' ? '#1a7a4a' : row.winner === 'p2' ? '#e63946' : colors.text
              }]}>
                {row.v1 !== null ? (row.v1 as number).toFixed(1) : '—'}
              </Text>
            </View>
            <Text style={[styles.rowLabel, { color: colors.textSecondary }]}>{row.label}</Text>
            <View style={[styles.cell, row.winner === 'p2' && styles.win, row.winner === 'p1' && styles.lose]}>
              <Text style={[styles.cellValue, {
                color: row.winner === 'p2' ? '#1a7a4a' : row.winner === 'p1' ? '#e63946' : colors.text
              }]}>
                {row.v2 !== null ? (row.v2 as number).toFixed(1) : '—'}
              </Text>
            </View>
          </View>
        ))}

        {/* Score final */}
        <View style={[styles.scoreRow, { borderColor: colors.border }]}>
          <Text style={[styles.scoreVal, { color: scores.p1 >= scores.p2 ? '#1a7a4a' : '#e63946' }]}>
            {scores.p1} pts
          </Text>
          <Text style={[styles.scoreLabel, { color: colors.textMuted }]}>Score total</Text>
          <Text style={[styles.scoreVal, { color: scores.p2 >= scores.p1 ? '#1a7a4a' : '#e63946' }]}>
            {scores.p2} pts
          </Text>
        </View>
      </View>

      <TouchableOpacity style={[styles.changeBtn, { borderColor: colors.border }]} onPress={loadHistory}>
        <Text style={[styles.changeBtnText, { color: colors.textSecondary }]}>↩️ Changer le 2ème produit</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  product1Preview: { borderRadius: 12, borderWidth: 1, padding: 12, marginBottom: 16 },
  previewLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5, marginBottom: 4 },
  previewName: { fontSize: 15, fontWeight: '700' },
  pickTitle: { fontSize: 20, fontWeight: '700', marginBottom: 4 },
  pickSub: { fontSize: 14, marginBottom: 16 },
  loadBtn: { alignSelf: 'center', paddingHorizontal: 24, paddingVertical: 14, borderRadius: 12, marginTop: 20 },
  loadBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  pickCard: { flexDirection: 'row', alignItems: 'center', padding: 12, marginVertical: 4, borderRadius: 12, borderWidth: 1, gap: 12 },
  pickImage: { width: 48, height: 48, borderRadius: 8 },
  pickName: { fontSize: 14, fontWeight: '600' },
  headerRow: { flexDirection: 'row', padding: 16, marginBottom: 8, borderBottomWidth: 1 },
  prodHeader: { flex: 1, alignItems: 'center', gap: 8, paddingHorizontal: 8 },
  prodImage: { width: 80, height: 80, borderRadius: 12 },
  prodName: { fontSize: 12, fontWeight: '600', textAlign: 'center', lineHeight: 16 },
  winnerBanner: { marginHorizontal: 16, marginBottom: 16, borderWidth: 1, borderRadius: 12, padding: 14, alignItems: 'center' },
  winnerText: { fontSize: 15, fontWeight: '700', textAlign: 'center' },
  sectionLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 0.8, marginBottom: 6 },
  compareRow: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 10, marginBottom: 6, overflow: 'hidden' },
  cell: { width: 90, paddingVertical: 12, alignItems: 'center', gap: 2 },
  win: { backgroundColor: '#D1FAE5' },
  lose: { backgroundColor: '#FEE2E2' },
  rowLabel: { flex: 1, textAlign: 'center', fontSize: 11, paddingHorizontal: 4 },
  cellValue: { fontSize: 14, fontWeight: '700' },
  scoreRow: { flexDirection: 'row', alignItems: 'center', borderTopWidth: 2, paddingTop: 12, marginTop: 8 },
  scoreVal: { flex: 1, fontSize: 22, fontWeight: '900', textAlign: 'center' },
  scoreLabel: { fontSize: 12, textAlign: 'center' },
  changeBtn: { marginHorizontal: 16, marginTop: 12, borderWidth: 1, borderRadius: 10, paddingVertical: 14, alignItems: 'center' },
  changeBtnText: { fontSize: 14 },
});
