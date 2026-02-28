import React, { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { getHistory } from '../utils/storage';
import { nutriColors } from '../utils/productHelpers';

const nutriToNum = (g?: string) => ({ a: 5, b: 4, c: 3, d: 2, e: 1 }[g?.toLowerCase() ?? ''] ?? 0);
const numToNutri = (n: number) => n >= 4.5 ? 'a' : n >= 3.5 ? 'b' : n >= 2.5 ? 'c' : n >= 1.5 ? 'd' : 'e';

export default function DashboardScreen() {
  const { colors } = useTheme();
  const [history, setHistory] = useState<any[]>([]);

  useFocusEffect(useCallback(() => { getHistory().then(setHistory); }, []));

  const scored = history.filter(h => h.nutriscore_grade);

  if (scored.length === 0) {
    return (
      <View style={[styles.empty, { backgroundColor: colors.background }]}>
        <Text style={[styles.emptyTitle, { color: colors.text }]}>Pas encore de données</Text>
        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>Scannez des produits pour voir votre score évoluer.</Text>
      </View>
    );
  }

  const avg = scored.reduce((s: number, h: any) => s + nutriToNum(h.nutriscore_grade), 0) / scored.length;
  const globalGrade = numToNutri(avg);
  const best = scored.reduce((b: any, h: any) => nutriToNum(h.nutriscore_grade) > nutriToNum(b.nutriscore_grade) ? h : b, scored[0]);
  const worst = scored.reduce((w: any, h: any) => nutriToNum(h.nutriscore_grade) < nutriToNum(w.nutriscore_grade) ? h : w, scored[0]);

  const weekMap = new Map<string, number[]>();
  history.forEach((entry: any) => {
    if (!entry.nutriscore_grade || !entry.scannedAt) return;
    const d = new Date(entry.scannedAt);
    const week = `S${Math.ceil(d.getDate() / 7)}/${d.getMonth() + 1}`;
    if (!weekMap.has(week)) weekMap.set(week, []);
    weekMap.get(week)!.push(nutriToNum(entry.nutriscore_grade));
  });
  const weekEntries = Array.from(weekMap.entries()).slice(-5);

  return (
    <ScrollView style={{ backgroundColor: colors.background }} contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
      <View style={[styles.scoreCard, { backgroundColor: colors.surface }]}>
        <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>VOTRE SCORE NUTRITIONNEL GLOBAL</Text>
        <View style={styles.scoreRow}>
          <View style={[styles.bigBadge, { backgroundColor: nutriColors[globalGrade] }]}>
            <Text style={styles.bigBadgeText}>{globalGrade.toUpperCase()}</Text>
          </View>
          <View style={{ flex: 1, marginLeft: 16 }}>
            <Text style={[styles.avgNumber, { color: colors.text }]}>{avg.toFixed(1)}/5</Text>
            <Text style={[styles.avgDesc, { color: colors.textSecondary }]}>Basé sur {scored.length} produit{scored.length > 1 ? 's' : ''}</Text>
          </View>
        </View>
      </View>

      <View style={styles.statsRow}>
        {[
          { label: 'Scannés', value: String(history.length) },
          { label: 'Meilleur', value: best?.nutriscore_grade?.toUpperCase() ?? '—', color: nutriColors[best?.nutriscore_grade ?? ''] },
          { label: 'Pire', value: worst?.nutriscore_grade?.toUpperCase() ?? '—', color: nutriColors[worst?.nutriscore_grade ?? ''] },
        ].map(stat => (
          <View key={stat.label} style={[styles.statCard, { backgroundColor: colors.surface }]}>
            <Text style={[styles.statValue, { color: stat.color ?? colors.text }]}>{stat.value}</Text>
            <Text style={[styles.statLabel, { color: colors.textMuted }]}>{stat.label}</Text>
          </View>
        ))}
      </View>

      {weekEntries.length > 0 && (
        <View style={[styles.chartCard, { backgroundColor: colors.surface }]}>
          <Text style={[styles.chartTitle, { color: colors.text }]}>Évolution par semaine</Text>
          <View style={styles.chart}>
            {weekEntries.map(([week, vals]) => {
              const a = vals.reduce((x: number, y: number) => x + y, 0) / vals.length;
              const pct = (a / 5) * 100;
              return (
                <View key={week} style={styles.bar}>
                  <Text style={[styles.barVal, { color: colors.textSecondary }]}>{a.toFixed(1)}</Text>
                  <View style={[styles.barFill, { height: `${pct}%`, backgroundColor: nutriColors[numToNutri(a)] }]} />
                  <Text style={[styles.barLabel, { color: colors.textMuted }]}>{week}</Text>
                </View>
              );
            })}
          </View>
        </View>
      )}

      <View style={[styles.distCard, { backgroundColor: colors.surface }]}>
        <Text style={[styles.chartTitle, { color: colors.text }]}>Répartition des scans</Text>
        {(['a', 'b', 'c', 'd', 'e'] as const).map(grade => {
          const count = scored.filter((h: any) => h.nutriscore_grade === grade).length;
          const pct = (count / scored.length) * 100;
          return (
            <View key={grade} style={styles.distRow}>
              <View style={[styles.smallBadge, { backgroundColor: nutriColors[grade] }]}>
                <Text style={styles.smallBadgeText}>{grade.toUpperCase()}</Text>
              </View>
              <View style={[styles.distBar, { backgroundColor: colors.surfaceAlt }]}>
                <View style={[styles.distFill, { width: `${pct}%`, backgroundColor: nutriColors[grade] }]} />
              </View>
              <Text style={[styles.distCount, { color: colors.textMuted }]}>{count}</Text>
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '700', textAlign: 'center' },
  emptyText: { fontSize: 14, textAlign: 'center' },
  scoreCard: { margin: 16, borderRadius: 16, padding: 20 },
  sectionLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 0.8, marginBottom: 14 },
  scoreRow: { flexDirection: 'row', alignItems: 'center' },
  bigBadge: { width: 56, height: 56, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  bigBadgeText: { color: '#fff', fontWeight: '900', fontSize: 28 },
  avgNumber: { fontSize: 36, fontWeight: '900' },
  avgDesc: { fontSize: 13, marginTop: 4 },
  statsRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 10, marginBottom: 10 },
  statCard: { flex: 1, borderRadius: 12, padding: 14, alignItems: 'center', gap: 4 },
  statValue: { fontSize: 20, fontWeight: '800' },
  statLabel: { fontSize: 10, textAlign: 'center' },
  chartCard: { marginHorizontal: 16, borderRadius: 16, padding: 16, marginBottom: 12 },
  chartTitle: { fontSize: 15, fontWeight: '700', marginBottom: 16 },
  chart: { flexDirection: 'row', height: 120, alignItems: 'flex-end', gap: 8 },
  bar: { flex: 1, alignItems: 'center', height: '100%', justifyContent: 'flex-end', gap: 4 },
  barFill: { width: '100%', borderRadius: 4, minHeight: 4 },
  barVal: { fontSize: 10 },
  barLabel: { fontSize: 9 },
  distCard: { marginHorizontal: 16, borderRadius: 16, padding: 16 },
  distRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  smallBadge: { width: 24, height: 24, borderRadius: 4, alignItems: 'center', justifyContent: 'center' },
  smallBadgeText: { color: '#fff', fontWeight: '900', fontSize: 12 },
  distBar: { flex: 1, height: 10, borderRadius: 5, overflow: 'hidden' },
  distFill: { height: '100%', borderRadius: 5 },
  distCount: { width: 24, textAlign: 'right', fontSize: 12 },
});
