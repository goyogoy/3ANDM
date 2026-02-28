import React, { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';

export default function ScannerScreen({ navigation }: any) {
  const { colors } = useTheme();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [loading, setLoading] = useState(false);
  const processingRef = useRef(false);

  useFocusEffect(
    useCallback(() => {
      setScanned(false);
      processingRef.current = false;
    }, [])
  );

  const handleBarCodeScanned = async ({ data }: { data: string }) => {
    if (scanned || processingRef.current) return;
    processingRef.current = true;
    setScanned(true);
    setLoading(true);
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      navigation.navigate('ProductScan', { code: data });
    } catch {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Erreur', 'Impossible de lire ce code-barres.', [{
        text: 'Réessayer',
        onPress: () => { setScanned(false); processingRef.current = false; },
      }]);
    } finally {
      setLoading(false);
    }
  };

  if (!permission) {
    return <View style={[styles.centered, { backgroundColor: colors.background }]}><ActivityIndicator size="large" color={colors.primary} /></View>;
  }

  if (!permission.granted) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <Text style={[styles.permTitle, { color: colors.text }]}>Caméra requise</Text>
        <Text style={[styles.permText, { color: colors.textSecondary }]}>L'application a besoin de la caméra pour scanner les codes-barres.</Text>
        <TouchableOpacity style={[styles.permButton, { backgroundColor: colors.primary }]} onPress={requestPermission}>
          <Text style={styles.permButtonText}>Autoriser la caméra</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        style={StyleSheet.absoluteFillObject}
        facing="back"
        barcodeScannerSettings={{ barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e', 'code128'] }}
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
      />
      <View style={styles.overlay}>
        <View style={styles.overlayTop} />
        <View style={styles.overlayMiddle}>
          <View style={styles.overlaySide} />
          <View style={styles.frame}>
            <View style={[styles.corner, styles.cornerTL]} />
            <View style={[styles.corner, styles.cornerTR]} />
            <View style={[styles.corner, styles.cornerBL]} />
            <View style={[styles.corner, styles.cornerBR]} />
          </View>
          <View style={styles.overlaySide} />
        </View>
        <View style={styles.overlayBottom} />
      </View>
      {loading && (
        <View style={styles.loadingBox}>
          <ActivityIndicator color="#fff" />
          <Text style={styles.loadingText}>Recherche du produit...</Text>
        </View>
      )}
      {!loading && !scanned && (
        <View style={styles.instructionsBox}>
          <Text style={styles.instructionsText}>Placez le code-barres dans le cadre</Text>
          <Text style={styles.instructionsSub}>La détection est automatique</Text>
        </View>
      )}
      {scanned && !loading && (
        <View style={styles.rescanBox}>
          <TouchableOpacity style={styles.rescanButton} onPress={() => { setScanned(false); processingRef.current = false; }}>
            <Text style={styles.rescanText}>Scanner un autre produit</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const FRAME = 260, CORNER = 22, THICK = 3;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  permTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 12, textAlign: 'center' },
  permText: { fontSize: 14, textAlign: 'center', lineHeight: 20, marginBottom: 24 },
  permButton: { paddingHorizontal: 24, paddingVertical: 14, borderRadius: 10 },
  permButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
  overlay: { ...StyleSheet.absoluteFillObject },
  overlayTop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' },
  overlayMiddle: { flexDirection: 'row', height: FRAME },
  overlaySide: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' },
  overlayBottom: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' },
  frame: { width: FRAME, height: FRAME },
  corner: { position: 'absolute', width: CORNER, height: CORNER, borderColor: '#2ecc71' },
  cornerTL: { top: 0, left: 0, borderTopWidth: THICK, borderLeftWidth: THICK },
  cornerTR: { top: 0, right: 0, borderTopWidth: THICK, borderRightWidth: THICK },
  cornerBL: { bottom: 0, left: 0, borderBottomWidth: THICK, borderLeftWidth: THICK },
  cornerBR: { bottom: 0, right: 0, borderBottomWidth: THICK, borderRightWidth: THICK },
  loadingBox: { position: 'absolute', bottom: 130, alignSelf: 'center', flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: 'rgba(0,0,0,0.75)', paddingHorizontal: 20, paddingVertical: 14, borderRadius: 12 },
  loadingText: { color: '#fff', fontSize: 14 },
  instructionsBox: { position: 'absolute', bottom: 80, left: 0, right: 0, alignItems: 'center', gap: 6 },
  instructionsText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  instructionsSub: { color: 'rgba(255,255,255,0.65)', fontSize: 13 },
  rescanBox: { position: 'absolute', bottom: 70, alignSelf: 'center' },
  rescanButton: { backgroundColor: 'rgba(255,255,255,0.9)', paddingHorizontal: 28, paddingVertical: 14, borderRadius: 30 },
  rescanText: { color: '#1a1a1a', fontWeight: 'bold', fontSize: 15 },
});
