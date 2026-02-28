import React from 'react';
import { Alert, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { usePreferences } from '../context/PreferencesContext';
import { resetAllData } from '../utils/storage';

const ALLERGENS = [
  { key: 'gluten', label: 'Gluten' }, { key: 'lait', label: 'Lait' },
  { key: 'oeufs', label: 'Œufs' }, { key: 'arachides', label: 'Arachides' },
  { key: 'fruits_a_coque', label: 'Fruits à coque' }, { key: 'soja', label: 'Soja' },
  { key: 'poisson', label: 'Poisson' }, { key: 'crustaces', label: 'Crustacés' },
  { key: 'sesame', label: 'Sésame' }, { key: 'sulfites', label: 'Sulfites' },
  { key: 'celeri', label: 'Céleri' }, { key: 'moutarde', label: 'Moutarde' },
  { key: 'lupin', label: 'Lupin' },
];

const DIETS = [
  { key: 'vegetarien', label: 'Végétarien' }, { key: 'vegan', label: 'Végan' },
  { key: 'sans_gluten', label: 'Sans gluten' }, { key: 'halal', label: 'Halal' },
  { key: 'casher', label: 'Casher' },
];

export default function SettingsScreen() {
  const { colors, isDark, toggleTheme } = useTheme();
  const { preferences, toggleAllergen, toggleDiet } = usePreferences();

  const handleReset = () => {
    Alert.alert('Réinitialiser', 'Supprimer toutes les données ?', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Réinitialiser', style: 'destructive', onPress: async () => { await resetAllData(); Alert.alert('Données effacées'); } },
    ]);
  };

  return (
    <ScrollView style={{ backgroundColor: colors.background }} contentContainerStyle={{ paddingBottom: 60 }} showsVerticalScrollIndicator={false}>
      <Text style={[styles.section, { color: colors.textSecondary }]}>Apparence</Text>
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.row}>
          <Text style={[styles.label, { color: colors.text }]}>Mode sombre</Text>
          <Switch value={isDark} onValueChange={toggleTheme} trackColor={{ false: '#D1D5DB', true: colors.primary }} thumbColor="#fff" />
        </View>
      </View>

      <Text style={[styles.section, { color: colors.textSecondary }]}>Mes allergènes</Text>
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        {ALLERGENS.map((a, i) => (
          <React.Fragment key={a.key}>
            <View style={styles.row}>
              <Text style={[styles.label, { color: colors.text }]}>{a.label}</Text>
              <Switch value={preferences.allergens.includes(a.key)} onValueChange={() => toggleAllergen(a.key)} trackColor={{ false: '#D1D5DB', true: colors.primary }} thumbColor="#fff" />
            </View>
            {i < ALLERGENS.length - 1 && <View style={[styles.divider, { borderColor: colors.border }]} />}
          </React.Fragment>
        ))}
      </View>

      <Text style={[styles.section, { color: colors.textSecondary }]}>Mon régime alimentaire</Text>
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        {DIETS.map((d, i) => (
          <React.Fragment key={d.key}>
            <View style={styles.row}>
              <Text style={[styles.label, { color: colors.text }]}>{d.label}</Text>
              <Switch value={preferences.diets.includes(d.key)} onValueChange={() => toggleDiet(d.key)} trackColor={{ false: '#D1D5DB', true: colors.primary }} thumbColor="#fff" />
            </View>
            {i < DIETS.length - 1 && <View style={[styles.divider, { borderColor: colors.border }]} />}
          </React.Fragment>
        ))}
      </View>

      <Text style={[styles.section, { color: colors.textSecondary }]}>Données</Text>
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <TouchableOpacity style={styles.row} onPress={handleReset}>
          <Text style={[styles.label, { color: colors.error }]}>Réinitialiser toutes les données</Text>
        </TouchableOpacity>
      </View>

      <Text style={[styles.section, { color: colors.textSecondary }]}>À propos</Text>
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.row}><Text style={[styles.label, { color: colors.textSecondary }]}>Application</Text><Text style={{ color: colors.text }}>NutriScan SUPINFO</Text></View>
        <View style={[styles.divider, { borderColor: colors.border }]} />
        <View style={styles.row}><Text style={[styles.label, { color: colors.textSecondary }]}>Version</Text><Text style={{ color: colors.text }}>1.0.0</Text></View>
        <View style={[styles.divider, { borderColor: colors.border }]} />
        <View style={styles.row}><Text style={[styles.label, { color: colors.textSecondary }]}>API</Text><Text style={{ color: colors.text }}>Open Food Facts</Text></View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  section: { fontSize: 12, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase', marginHorizontal: 16, marginTop: 24, marginBottom: 8 },
  card: { marginHorizontal: 16, borderRadius: 14, borderWidth: 1, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14 },
  label: { fontSize: 15, flex: 1 },
  divider: { borderTopWidth: 1, marginHorizontal: 16 },
});
