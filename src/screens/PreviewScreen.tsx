import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  Platform,
  ScrollView,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Print from 'expo-print';
import { colors } from '../theme/colors';
import { usePrimeStore } from '../store/primeStore';
import Header from '../components/Header';
import { generateQuotationPDF, generateQuotationHTML } from '../utils/pdfGenerator';
import { shareQuotationWhatsApp, shareViaSystem } from '../utils/share';
import { Quotation, BatteryOption } from '../types';
import { formatCurrency } from '../utils/solarCalculations';

export default function PreviewScreen({ route, navigation }: any) {
  const quotation: Quotation = route?.params?.quotation;
  const saveQuotation = usePrimeStore((state) => state.saveQuotation);

  const [pdfUri, setPdfUri] = useState<string | null>(null);
  const [htmlContent, setHtmlContent] = useState<string>('');
  const [generating, setGenerating] = useState(true);
  const [saving, setSaving] = useState(false);

  const selectedBattery = quotation?.selectedBatteryId
    ? quotation.batteryOptions.find((b) => b.id === quotation.selectedBatteryId)
    : null;

  useEffect(() => {
    let isMounted = true;
    const generate = async () => {
      if (!quotation) return;
      setGenerating(true);
      try {
        const html = generateQuotationHTML(quotation);
        if (isMounted) {
          setHtmlContent(html);
        }

        if (Platform.OS !== 'web') {
          const uri = await generateQuotationPDF(quotation);
          if (isMounted) {
            setPdfUri(uri);
          }
        }
      } catch (err) {
        console.error('Failed to generate PDF:', err);
      } finally {
        if (isMounted) setGenerating(false);
      }
    };

    generate();
    return () => {
      isMounted = false;
    };
  }, [quotation]);

  const handleSaveToStore = async () => {
    setSaving(true);
    try {
      await saveQuotation(quotation);
      Alert.alert('Success', 'Quotation saved to your offline records!');
    } catch (e) {
      Alert.alert('Error', 'Failed to save quotation.');
    } finally {
      setSaving(false);
    }
  };

  const handleShareWhatsApp = async () => {
    if (Platform.OS === 'web') {
      // On web browser, trigger print/save as PDF or show notice
      await Print.printAsync({ html: htmlContent });
      return;
    }

    if (!pdfUri) {
      const uri = await generateQuotationPDF(quotation);
      setPdfUri(uri);
      await saveQuotation(quotation);
      await shareQuotationWhatsApp(uri, quotation);
    } else {
      await saveQuotation(quotation);
      await shareQuotationWhatsApp(pdfUri, quotation);
    }
  };

  const handleExportSystem = async () => {
    if (Platform.OS === 'web') {
      await Print.printAsync({ html: htmlContent });
    } else if (pdfUri) {
      await Print.printAsync({ uri: pdfUri });
    } else {
      await Print.printAsync({ html: htmlContent });
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header
        title="Quotation Preview"
        showBack
        onBack={() => navigation.goBack()}
        rightAction={
          <TouchableOpacity style={styles.saveHeaderBtn} onPress={handleSaveToStore} disabled={saving}>
            {saving ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.saveHeaderText}>Save</Text>
            )}
          </TouchableOpacity>
        }
      />

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {generating ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.secondaryContainer} />
            <Text style={styles.loadingText}>Generating Branded 2-Page Quotation PDF...</Text>
          </View>
        ) : (
          <View style={styles.previewSummaryCard}>
            {/* Top Badge */}
            <View style={styles.quotationBadgeRow}>
              <View style={styles.solarLogoBadge}>
                <Image
                  source={require('../../assets/logo.png')}
                  style={styles.logoImagePreview}
                  resizeMode="contain"
                />
              </View>
              <View style={{ flex: 1, marginLeft: 14 }}>
                <Text style={styles.previewCustomer}>
                  {quotation.customer.name
                    ? quotation.customer.name.toLowerCase().startsWith('mr')
                      ? `${quotation.customer.name} sb`
                      : `Mr. ${quotation.customer.name} sb`
                    : 'Valued Customer sb'}
                </Text>
                <Text style={styles.previewSystem}>
                  {quotation.capacityKw} kW{' '}
                  {quotation.systemType === 'HYBRID'
                    ? 'Hybrid'
                    : quotation.systemType === 'ON_GRID'
                    ? 'On-Grid'
                    : 'Off-Grid'}{' '}
                  Solar System
                </Text>
              </View>
            </View>

            <View style={styles.cardDivider} />

            {/* Document Details */}
            <View style={styles.docDetailsBox}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Quotation No:</Text>
                <Text style={styles.detailVal}>{quotation.quotationNumber || 'PS-2026-084'}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Line Items:</Text>
                <Text style={styles.detailVal}>{quotation.lineItems?.length || 0} Components</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Grand Total:</Text>
                <Text style={styles.detailValGrand}>Rs. {formatCurrency(quotation.grandTotal)}</Text>
              </View>
              {selectedBattery && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Total with Battery:</Text>
                  <Text style={[styles.detailValGrand, { color: colors.secondaryContainer }]}>
                    Rs. {formatCurrency(quotation.grandTotal + selectedBattery.rate)}
                  </Text>
                </View>
              )}
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Payment Terms:</Text>
                <Text style={styles.detailVal}>70% Advance / 20% Dumping / 10% Handover</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Estimated Savings:</Text>
                <Text style={[styles.detailVal, { color: colors.secondaryContainer, fontWeight: '800' }]}>
                  {quotation.roi?.monthlySavingsPkr || 'Rs. 60,000 / month'}
                </Text>
              </View>
            </View>

            {/* Ready Badge */}
            <View style={styles.pdfReadyBadge}>
              <Ionicons name="checkmark-circle" size={22} color="#10B981" style={{ marginRight: 8 }} />
              <View style={{ flex: 1 }}>
                <Text style={styles.pdfReadyTitle}>Exact 2-Page Branded PDF Ready!</Text>
                <Text style={styles.pdfReadySub}>
                  Includes DHA Bahawalpur header block, two-tone bar, itemized table, and payment/ROI terms.
                </Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Fixed Bottom Share Action Bar */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.systemExportBtn}
          onPress={handleExportSystem}
          disabled={generating}
          activeOpacity={0.8}
        >
          <Ionicons name="print-outline" size={20} color={colors.primaryContainer} style={{ marginRight: 6 }} />
          <Text style={styles.systemExportText}>Print / PDF</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.whatsAppShareBtn}
          onPress={handleShareWhatsApp}
          disabled={generating}
          activeOpacity={0.85}
        >
          <Ionicons name="logo-whatsapp" size={22} color="#FFFFFF" style={{ marginRight: 8 }} />
          <Text style={styles.whatsAppShareText}>
            {Platform.OS === 'web' ? 'Export / Share' : 'Share on WhatsApp'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    padding: 16,
    paddingBottom: 120,
    justifyContent: 'center',
  },
  saveHeaderBtn: {
    backgroundColor: colors.primaryContainer,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
  },
  saveHeaderText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primaryContainer,
    marginTop: 14,
    textAlign: 'center',
  },
  previewSummaryCard: {
    backgroundColor: '#F0F2F5',
    borderRadius: 22,
    padding: 22,
    shadowColor: '#A3B1C6',
    shadowOffset: { width: 6, height: 6 },
    shadowOpacity: 0.55,
    shadowRadius: 10,
    elevation: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.8)',
  },
  quotationBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  solarLogoBadge: {
    width: 54,
    height: 54,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    overflow: 'hidden',
  },
  logoImagePreview: {
    width: 46,
    height: 46,
  },
  previewCustomer: {
    fontSize: 20,
    fontWeight: '900',
    color: colors.primaryContainer,
  },
  previewSystem: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.secondaryContainer,
    marginTop: 2,
  },
  cardDivider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 16,
  },
  docDetailsBox: {
    gap: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 14,
    color: colors.onSurfaceVariant,
    fontWeight: '600',
  },
  detailVal: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.onSurface,
  },
  detailValGrand: {
    fontSize: 18,
    fontWeight: '900',
    color: colors.primaryContainer,
  },
  pdfReadyBadge: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#ECFDF5',
    borderRadius: 14,
    padding: 14,
    marginTop: 20,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  pdfReadyTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#065F46',
  },
  pdfReadySub: {
    fontSize: 12,
    color: '#047857',
    marginTop: 2,
    lineHeight: 16,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#F0F2F5',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 24,
    flexDirection: 'row',
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    shadowColor: '#A3B1C6',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  systemExportBtn: {
    flex: 1,
    height: 52,
    backgroundColor: '#E6E9EE',
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  systemExportText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primaryContainer,
  },
  whatsAppShareBtn: {
    flex: 1.6,
    height: 52,
    backgroundColor: '#25D366',
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#128C7E',
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 5,
  },
  whatsAppShareText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
