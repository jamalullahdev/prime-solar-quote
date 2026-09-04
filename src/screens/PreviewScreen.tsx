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
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Print from 'expo-print';
import { colors } from '../theme/colors';
import { usePrimeStore } from '../store/primeStore';
import Header from '../components/Header';
import { generateQuotationPDF, generateQuotationHTML } from '../utils/pdfGenerator';
import { shareQuotationWhatsApp, shareViaSystem } from '../utils/share';
import { Quotation, LineItem } from '../types';
import { formatCurrency } from '../utils/solarCalculations';
import {
  calculateQuotationProfit,
  generateInternalProfitHTML,
} from '../utils/internalProfit';

export default function PreviewScreen({ route, navigation }: any) {
  const quotation: Quotation = route?.params?.quotation;
  const saveQuotation = usePrimeStore((state) => state.saveQuotation);

  const [pdfUri, setPdfUri] = useState<string | null>(null);
  const [htmlContent, setHtmlContent] = useState<string>('');
  const [generating, setGenerating] = useState(true);
  const [saving, setSaving] = useState(false);

  // 🔒 Internal Profit Permission & View State
  const [showProfitPermissionModal, setShowProfitPermissionModal] = useState(false);
  const [showProfitViewModal, setShowProfitViewModal] = useState(false);

  const profitAnalytics = quotation ? calculateQuotationProfit(quotation) : null;

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

  // 🔒 Export Confidential Internal Sheet
  const handleExportInternalProfitSheet = async () => {
    if (!quotation) return;
    const internalHtml = generateInternalProfitHTML(quotation);
    await Print.printAsync({ html: internalHtml });
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
          <View style={{ gap: 14 }}>
            {/* Customer Quotation Summary Card */}
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
                  <Text style={styles.detailLabel}>Customer Grand Total:</Text>
                  <Text style={styles.detailValGrand}>Rs. {formatCurrency(quotation.grandTotal)}</Text>
                </View>
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

              {/* Customer PDF Ready Banner */}
              <View style={styles.pdfReadyBadge}>
                <Ionicons name="checkmark-circle" size={22} color="#10B981" style={{ marginRight: 8 }} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.pdfReadyTitle}>Exact 2-Page Customer PDF Ready!</Text>
                  <Text style={styles.pdfReadySub}>
                    Unified main table, production data, and official branding ready for sharing.
                  </Text>
                </View>
              </View>
            </View>

            {/* 🔒 Confidential Internal Cost & Profit Sheet Banner */}
            <View style={styles.internalProfitBanner}>
              <View style={styles.internalHeaderRow}>
                <View style={styles.confidentialTag}>
                  <Ionicons name="lock-closed" size={12} color="#DC2626" />
                  <Text style={styles.confidentialTagText}>OWNER ONLY</Text>
                </View>
                <Text style={styles.internalBannerTitle}>Cost & Profit Analyzer</Text>
              </View>

              <Text style={styles.internalBannerSub}>
                View line-by-line procurement costs, gross profit margin, and internal financial breakdown.
              </Text>

              {profitAnalytics && profitAnalytics.totalRealCost > 0 ? (
                <View style={styles.quickProfitBar}>
                  <View style={styles.quickProfitCol}>
                    <Text style={styles.quickProfitLabel}>Real Cost</Text>
                    <Text style={[styles.quickProfitVal, { color: '#DC2626' }]}>
                      Rs. {formatCurrency(profitAnalytics.totalRealCost)}
                    </Text>
                  </View>
                  <View style={styles.quickProfitCol}>
                    <Text style={styles.quickProfitLabel}>Net Profit</Text>
                    <Text style={[styles.quickProfitVal, { color: '#059669' }]}>
                      Rs. {formatCurrency(profitAnalytics.netProfit)}
                    </Text>
                  </View>
                  <View style={styles.quickProfitCol}>
                    <Text style={styles.quickProfitLabel}>Margin</Text>
                    <Text style={[styles.quickProfitVal, { color: '#0284C7' }]}>
                      {profitAnalytics.profitMarginPercent}%
                    </Text>
                  </View>
                </View>
              ) : null}

              <TouchableOpacity
                style={styles.openProfitSheetBtn}
                onPress={() => setShowProfitPermissionModal(true)}
                activeOpacity={0.85}
              >
                <Ionicons name="shield-checkmark-outline" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                <Text style={styles.openProfitSheetBtnText}>View Internal Profit Sheet</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>

      {/* 🔒 1. Permission Prompt Modal */}
      <Modal visible={showProfitPermissionModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.permissionCard}>
            <View style={styles.permissionIconCircle}>
              <Ionicons name="lock-closed" size={32} color="#DC2626" />
            </View>
            <Text style={styles.permissionTitle}>Confidential Owner Data</Text>
            <View style={styles.permissionBadge}>
              <Text style={styles.permissionBadgeText}>🔒 FOR INTERNAL USE ONLY</Text>
            </View>

            <Text style={styles.permissionBodyText}>
              Do you want to unlock the internal cost sheet? This view reveals real equipment costs and net profit margins.
            </Text>

            <View style={styles.permissionWarningBox}>
              <Ionicons name="alert-circle" size={18} color="#B45309" style={{ marginRight: 6 }} />
              <Text style={styles.permissionWarningText}>
                ⚠️ Never send or screenshot this internal cost sheet for customers.
              </Text>
            </View>

            <View style={styles.modalButtonsRow}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setShowProfitPermissionModal(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.unlockBtn}
                onPress={() => {
                  setShowProfitPermissionModal(false);
                  setShowProfitViewModal(true);
                }}
                activeOpacity={0.85}
              >
                <Ionicons name="lock-open-outline" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                <Text style={styles.unlockBtnText}>Unlock & View</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* 🔒 2. Internal Profit Breakdown Modal */}
      <Modal visible={showProfitViewModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.profitModalContainer}>
            {/* Header */}
            <View style={styles.profitModalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View style={styles.profitModalIconBox}>
                  <Ionicons name="analytics" size={22} color="#FFFFFF" />
                </View>
                <View>
                  <Text style={styles.profitModalTitle}>Internal Profit & Margin Sheet</Text>
                  <Text style={styles.profitModalSub}>Prime Solar Energy Internal Accounting</Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={() => setShowProfitViewModal(false)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="close-circle" size={26} color={colors.outline} />
              </TouchableOpacity>
            </View>

            {/* KPI Cards */}
            {profitAnalytics && (
              <View style={styles.kpiRow}>
                <View style={[styles.kpiCard, { borderColor: '#0B2A4A' }]}>
                  <Text style={styles.kpiLabel}>Quoted</Text>
                  <Text style={[styles.kpiVal, { color: '#0B2A4A' }]}>
                    Rs. {formatCurrency(profitAnalytics.totalQuotedPrice)}
                  </Text>
                </View>
                <View style={[styles.kpiCard, { borderColor: '#DC2626' }]}>
                  <Text style={styles.kpiLabel}>Real Cost</Text>
                  <Text style={[styles.kpiVal, { color: '#DC2626' }]}>
                    Rs. {formatCurrency(profitAnalytics.totalRealCost)}
                  </Text>
                </View>
                <View style={[styles.kpiCard, { borderColor: '#059669', backgroundColor: '#F0FDF4' }]}>
                  <Text style={styles.kpiLabel}>Net Profit</Text>
                  <Text style={[styles.kpiVal, { color: '#059669' }]}>
                    Rs. {formatCurrency(profitAnalytics.netProfit)}
                  </Text>
                </View>
                <View style={[styles.kpiCard, { borderColor: '#0284C7', backgroundColor: '#F0F9FF' }]}>
                  <Text style={styles.kpiLabel}>Margin</Text>
                  <Text style={[styles.kpiVal, { color: '#0284C7' }]}>
                    {profitAnalytics.profitMarginPercent}%
                  </Text>
                </View>
              </View>
            )}

            {/* Itemized Breakdown */}
            <ScrollView style={{ maxHeight: 300 }} showsVerticalScrollIndicator={false}>
              <View style={{ gap: 6 }}>
                {(quotation?.lineItems || []).map((item: LineItem, idx: number) => {
                  const quoted = item.total || 0;
                  const cost = item.costTotal || 0;
                  const itemProfit = quoted - cost;
                  const margin = quoted > 0 ? Math.round((itemProfit / quoted) * 100) : 0;

                  return (
                    <View key={item.id || idx} style={styles.breakdownItemRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.breakdownItemTitle} numberOfLines={1}>
                          {item.srNo < 10 ? '0' + item.srNo : item.srNo}. {item.description}
                        </Text>
                        <Text style={styles.breakdownItemSub}>Qty: {item.qty || '1'}</Text>
                      </View>
                      <View style={{ alignItems: 'flex-end', marginLeft: 8 }}>
                        <Text style={styles.breakdownItemQuoted}>Quoted: Rs. {formatCurrency(quoted)}</Text>
                        <Text style={styles.breakdownItemCost}>Cost: Rs. {formatCurrency(cost)}</Text>
                        <Text
                          style={[
                            styles.breakdownItemProfit,
                            { color: itemProfit >= 0 ? '#059669' : '#DC2626' },
                          ]}
                        >
                          Profit: Rs. {formatCurrency(itemProfit)} ({margin}%)
                        </Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            </ScrollView>

            {/* Bottom Actions */}
            <View style={styles.profitModalBottomRow}>
              <TouchableOpacity
                style={styles.exportInternalBtn}
                onPress={handleExportInternalProfitSheet}
                activeOpacity={0.85}
              >
                <Ionicons name="document-text-outline" size={18} color={colors.primaryContainer} style={{ marginRight: 6 }} />
                <Text style={styles.exportInternalBtnText}>Export PDF Sheet</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.closeProfitModalBtn}
                onPress={() => setShowProfitViewModal(false)}
                activeOpacity={0.85}
              >
                <Text style={styles.closeProfitModalBtnText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Fixed Bottom Customer Share Action Bar */}
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
    maxWidth: 640,
    width: '100%',
    alignSelf: 'center',
    gap: 14,
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
    padding: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
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
    fontSize: 19,
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
    marginVertical: 14,
  },
  docDetailsBox: {
    gap: 10,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 13,
    color: colors.onSurfaceVariant,
    fontWeight: '600',
  },
  detailVal: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.onSurface,
  },
  detailValGrand: {
    fontSize: 17,
    fontWeight: '900',
    color: colors.primaryContainer,
  },
  pdfReadyBadge: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#ECFDF5',
    borderRadius: 12,
    padding: 12,
    marginTop: 14,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  pdfReadyTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#065F46',
  },
  pdfReadySub: {
    fontSize: 11,
    color: '#047857',
    marginTop: 2,
    lineHeight: 15,
  },
  internalProfitBanner: {
    backgroundColor: '#FFF1F2',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#FECDD3',
  },
  internalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  confidentialTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFE4E6',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#FDA4AF',
    gap: 3,
  },
  confidentialTagText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#DC2626',
    letterSpacing: 0.5,
  },
  internalBannerTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#9F1239',
  },
  internalBannerSub: {
    fontSize: 12,
    color: '#9F1239',
    lineHeight: 16,
    marginBottom: 10,
  },
  quickProfitBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#FECDD3',
  },
  quickProfitCol: {
    flex: 1,
    alignItems: 'center',
  },
  quickProfitLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#9F1239',
    marginBottom: 2,
  },
  quickProfitVal: {
    fontSize: 13,
    fontWeight: '900',
  },
  openProfitSheetBtn: {
    backgroundColor: '#DC2626',
    height: 44,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  openProfitSheetBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  permissionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 22,
    maxWidth: 440,
    width: '100%',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#F87171',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 10,
  },
  permissionIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  permissionTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0F172A',
    marginBottom: 4,
  },
  permissionBadge: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginBottom: 10,
  },
  permissionBadgeText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#DC2626',
    letterSpacing: 0.8,
  },
  permissionBodyText: {
    fontSize: 13,
    color: '#334155',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 12,
  },
  permissionWarningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FDE68A',
    marginBottom: 16,
    width: '100%',
  },
  permissionWarningText: {
    fontSize: 11,
    color: '#92400E',
    fontWeight: '600',
    flex: 1,
  },
  modalButtonsRow: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  modalCancelBtn: {
    flex: 1,
    height: 44,
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.onSurfaceVariant,
  },
  unlockBtn: {
    flex: 1.4,
    height: 44,
    backgroundColor: '#DC2626',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  unlockBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  profitModalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    maxWidth: 580,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 14,
    elevation: 10,
  },
  profitModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  profitModalIconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#DC2626',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profitModalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  profitModalSub: {
    fontSize: 11,
    color: colors.outline,
  },
  kpiRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  kpiCard: {
    flex: 1,
    padding: 8,
    borderRadius: 10,
    borderWidth: 1.5,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
  },
  kpiLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#64748B',
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  kpiVal: {
    fontSize: 12,
    fontWeight: '900',
  },
  breakdownItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  breakdownItemTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 2,
  },
  breakdownItemSub: {
    fontSize: 11,
    color: '#64748B',
  },
  breakdownItemQuoted: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0B2A4A',
  },
  breakdownItemCost: {
    fontSize: 11,
    fontWeight: '700',
    color: '#DC2626',
  },
  breakdownItemProfit: {
    fontSize: 11,
    fontWeight: '800',
    marginTop: 1,
  },
  profitModalBottomRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  exportInternalBtn: {
    flex: 1.5,
    height: 44,
    backgroundColor: '#E6E9EE',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  exportInternalBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.primaryContainer,
  },
  closeProfitModalBtn: {
    flex: 1,
    height: 44,
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeProfitModalBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.onSurfaceVariant,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    maxWidth: 640,
    width: '100%',
    alignSelf: 'center',
    backgroundColor: '#F0F2F5',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 24,
    flexDirection: 'row',
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
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
