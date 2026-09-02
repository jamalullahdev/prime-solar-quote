import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { neomorph } from '../theme/neomorph';
import { usePrimeStore } from '../store/primeStore';
import Header from '../components/Header';
import NeumorphicCard from '../components/NeumorphicCard';
import NeumorphicInput from '../components/NeumorphicInput';
import {
  Quotation,
  LineItem,
  SystemType,
  BatteryOption,
  PaymentTerms,
  ReturnOnInvestment,
} from '../types';
import { SEED_BATTERY_OPTIONS } from '../data/seedTemplates';
import { formatCurrency, calculateSolarSizing } from '../utils/solarCalculations';

export default function QuotationEditorScreen({ route, navigation }: any) {
  const quotationId = route?.params?.quotationId;
  const passedQuotation = route?.params?.quotation;
  const templateId = route?.params?.templateId || 'template-simple-hybrid';
  const prefillKw = route?.params?.prefillKw || '10';
  const prefillRoi = route?.params?.prefillRoi;
  const prefillPanels = route?.params?.prefillPanels;

  const templates = usePrimeStore((state) => state.templates);
  const getQuotation = usePrimeStore((state) => state.getQuotation);
  const saveQuotation = usePrimeStore((state) => state.saveQuotation);

  const selectedTemplate =
    templates.find((t) => t.id === templateId) || templates[0];

  const existingQuote = quotationId ? getQuotation(quotationId) : passedQuotation;

  // Form State
  const [customerName, setCustomerName] = useState(
    existingQuote?.customer?.name || ''
  );
  const [capacityKw, setCapacityKw] = useState(
    existingQuote?.capacityKw || prefillKw || '10'
  );
  const [systemType, setSystemType] = useState<SystemType>(
    existingQuote?.systemType || selectedTemplate.systemTypeDefault || 'HYBRID'
  );
  const [validTill, setValidTill] = useState(
    existingQuote?.validTill || '25/09/2026'
  );

  // Line items state
  const [lineItems, setLineItems] = useState<LineItem[]>(
    existingQuote?.lineItems
      ? [...existingQuote.lineItems]
      : selectedTemplate.defaultLineItems
      ? selectedTemplate.defaultLineItems.map((item) => ({ ...item }))
      : []
  );

  // Optional Battery Options state
  const [batteryOptions, setBatteryOptions] = useState<BatteryOption[]>(
    existingQuote?.batteryOptions || SEED_BATTERY_OPTIONS
  );
  const [selectedBatteryId, setSelectedBatteryId] = useState<string | undefined>(
    existingQuote?.selectedBatteryId
  );

  // Payment terms
  const [paymentTerms, setPaymentTerms] = useState<PaymentTerms>(
    existingQuote?.paymentTerms || {
      advancePercent: 70,
      onDumpingPercent: 20,
      onCompletionPercent: 10,
    }
  );

  // ROI State
  const [roi, setRoi] = useState<ReturnOnInvestment>(
    existingQuote?.roi ||
      prefillRoi || {
        dailyProductionUnits: '45 - 50 Units',
        monthlyProductionUnits: '1,350 - 1,500 Units',
        monthlySavingsPkr: 'Rs. 60,000 - 70,000',
        paybackPeriodMonths: '28 - 32 Months (2.6 Years)',
      }
  );

  // Collapsible accordion states
  const [showBatterySection, setShowBatterySection] = useState(
    selectedTemplate.hasBatterySection
  );
  const [showPaymentSection, setShowPaymentSection] = useState(false);
  const [showRoiSection, setShowRoiSection] = useState(false);

  // Auto update line items on capacity change
  useEffect(() => {
    const kw = parseFloat(capacityKw) || 10;
    const calc = calculateSolarSizing(kw * 6000);
    setRoi(calc.roi);

    // Update panel count in line items if first line item is panels
    if (lineItems.length > 0 && lineItems[0].description.toLowerCase().includes('panel')) {
      const updated = [...lineItems];
      updated[0] = {
        ...updated[0],
        qty: calc.panelCount.toString(),
        total: calc.panelCount * (updated[0].rate || 18500),
      };
      setLineItems(updated);
    }
  }, [capacityKw]);

  // Math totals
  const subtotal = lineItems.reduce((sum, item) => sum + (item.total || 0), 0);
  const taxAmount = 0;
  const grandTotal = subtotal + taxAmount;

  const handleAddRow = () => {
    const nextSr = lineItems.length + 1;
    const newItem: LineItem = {
      id: `li_${Date.now()}`,
      srNo: nextSr,
      description: '',
      qty: '1',
      rate: 0,
      total: 0,
      remarks: '',
    };
    setLineItems([...lineItems, newItem]);
  };

  const handleDeleteRow = (index: number) => {
    const updated = lineItems
      .filter((_, idx) => idx !== index)
      .map((item, idx) => ({ ...item, srNo: idx + 1 }));
    setLineItems(updated);
  };

  const handleUpdateRow = (index: number, field: keyof LineItem, val: any) => {
    const updated = [...lineItems];
    const item = { ...updated[index], [field]: val };
    if (field === 'qty' || field === 'rate') {
      const numQty = parseFloat(item.qty) || 0;
      const numRate = typeof val === 'number' ? val : parseFloat(val) || 0;
      item.total = Math.round(numQty * numRate);
    }
    updated[index] = item;
    setLineItems(updated);
  };

  const handleAddBattery = () => {
    const newBat: BatteryOption = {
      id: `bat_${Date.now()}`,
      brand: 'Lithium Battery',
      capacityKwh: 5,
      rate: 250000,
      warranty: '5 Years Official Warranty',
    };
    setBatteryOptions([...batteryOptions, newBat]);
    setShowBatterySection(true);
  };

  const handleDeleteBattery = (id: string) => {
    const updated = batteryOptions.filter((b) => b.id !== id);
    setBatteryOptions(updated);
    if (selectedBatteryId === id) {
      setSelectedBatteryId(undefined);
    }
  };

  const handleUpdateBattery = (id: string, field: keyof BatteryOption, val: any) => {
    const updated = batteryOptions.map((b) => {
      if (b.id === id) {
        return { ...b, [field]: val };
      }
      return b;
    });
    setBatteryOptions(updated);
  };

  const buildQuotationObject = (): Quotation => {
    return {
      id: existingQuote?.id || `quote_${Date.now()}`,
      quotationNumber:
        existingQuote?.quotationNumber ||
        `PS-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
      templateId: selectedTemplate.id,
      templateName: selectedTemplate.name,
      customer: { name: customerName.trim() },
      capacityKw: capacityKw.trim(),
      systemType,
      panelBrand: 'Tier-1 Bifacial N-Type',
      panelWattage: '585W',
      panelCount: Math.ceil((parseFloat(capacityKw) * 1000) / 585) || 18,
      inverterBrand: 'IP66 Hybrid/On-Grid',
      lineItems,
      batteryOptions,
      selectedBatteryId,
      paymentTerms,
      roi,
      validTill,
      subtotal,
      taxRate: 0,
      taxAmount: 0,
      grandTotal,
      createdAt: existingQuote?.createdAt || Date.now(),
      updatedAt: Date.now(),
    };
  };

  const handleSaveDraft = async () => {
    if (!customerName.trim()) {
      Alert.alert('Missing Customer Name', 'Please enter customer name before saving.');
      return;
    }
    const quote = buildQuotationObject();
    await saveQuotation(quote);
    Alert.alert('Saved', 'Quotation draft saved successfully to your offline records!');
  };

  const handlePreview = () => {
    if (!customerName.trim()) {
      Alert.alert('Missing Customer Name', 'Please enter customer name to generate quotation.');
      return;
    }
    const quote = buildQuotationObject();
    navigation.navigate('Preview', { quotation: quote });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header
        title="Quotation Editor"
        showBack
        onBack={() => navigation.goBack()}
        rightAction={
          <TouchableOpacity style={styles.previewHeaderBtn} onPress={handlePreview}>
            <Ionicons name="eye-outline" size={16} color="#FFFFFF" style={{ marginRight: 4 }} />
            <Text style={styles.previewHeaderText}>Preview</Text>
          </TouchableOpacity>
        }
      />

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Customer & System Overview Card */}
        <NeumorphicCard style={styles.card}>
          <Text style={styles.sectionHeader}>CUSTOMER & SYSTEM OVERVIEW</Text>

          <NeumorphicInput
            label="Customer Name *"
            placeholder="e.g. Ahmad Khan"
            value={customerName}
            onChangeText={setCustomerName}
            containerStyle={{ marginBottom: 14 }}
          />

          <View style={styles.row}>
            <NeumorphicInput
              label="Capacity (kW) *"
              placeholder="10"
              keyboardType="numeric"
              value={capacityKw}
              onChangeText={setCapacityKw}
              containerStyle={{ flex: 1, marginRight: 10 }}
            />

            <NeumorphicInput
              label="Valid Till Date"
              placeholder="25/09/2026"
              value={validTill}
              onChangeText={setValidTill}
              containerStyle={{ flex: 1 }}
            />
          </View>

          {/* System Type Segmented Control */}
          <View style={styles.systemTypeGroup}>
            <Text style={styles.fieldLabel}>System Type</Text>
            <View style={styles.segmentedControl}>
              {(['HYBRID', 'ON_GRID', 'OFF_GRID'] as SystemType[]).map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.segmentBtn,
                    systemType === type && styles.segmentBtnActive,
                  ]}
                  onPress={() => setSystemType(type)}
                >
                  <Text
                    style={[
                      styles.segmentText,
                      systemType === type && styles.segmentTextActive,
                    ]}
                  >
                    {type === 'HYBRID' ? 'Hybrid' : type === 'ON_GRID' ? 'On-Grid' : 'Off-Grid'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </NeumorphicCard>

        {/* Dynamic Line-Items Table Card */}
        <NeumorphicCard style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.sectionHeader}>LINE-ITEMS TABLE ({lineItems.length})</Text>
            <TouchableOpacity style={styles.addRowBtn} onPress={handleAddRow} activeOpacity={0.8}>
              <Ionicons name="add" size={16} color="#FFFFFF" style={{ marginRight: 2 }} />
              <Text style={styles.addRowText}>Add Row</Text>
            </TouchableOpacity>
          </View>

          {/* Line items list */}
          <View style={{ gap: 12 }}>
            {lineItems.map((item, idx) => (
              <View key={item.id || idx} style={styles.lineItemRowCard}>
                <View style={styles.lineItemRowHeader}>
                  <View style={styles.srBadge}>
                    <Text style={styles.srBadgeText}>#{idx + 1}</Text>
                  </View>
                  <View style={{ flex: 1, marginLeft: 8 }}>
                    <TextInput
                      style={styles.descInput}
                      placeholder="Item description..."
                      value={item.description}
                      onChangeText={(val) => handleUpdateRow(idx, 'description', val)}
                    />
                  </View>
                  <TouchableOpacity
                    style={styles.deleteRowBtn}
                    onPress={() => handleDeleteRow(idx)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Ionicons name="trash-outline" size={18} color={colors.error} />
                  </TouchableOpacity>
                </View>

                {/* Sub-inputs: Qty, Rate, Total, Remarks */}
                <View style={styles.lineItemInputsRow}>
                  <View style={{ width: '22%' }}>
                    <Text style={styles.microLabel}>Qty</Text>
                    <TextInput
                      style={styles.microInput}
                      value={item.qty}
                      onChangeText={(val) => handleUpdateRow(idx, 'qty', val)}
                      placeholder="1"
                    />
                  </View>

                  <View style={{ width: '36%', marginLeft: 6 }}>
                    <Text style={styles.microLabel}>Rate (Rs)</Text>
                    <TextInput
                      style={styles.microInput}
                      keyboardType="numeric"
                      value={item.rate?.toString() || '0'}
                      onChangeText={(val) => handleUpdateRow(idx, 'rate', val)}
                      placeholder="0"
                    />
                  </View>

                  <View style={{ width: '38%', marginLeft: 6 }}>
                    <Text style={styles.microLabel}>Total (Rs)</Text>
                    <View style={styles.totalDisplayBox}>
                      <Text style={styles.totalDisplayText} numberOfLines={1}>
                        {formatCurrency(item.total)}
                      </Text>
                    </View>
                  </View>
                </View>

                <View style={{ marginTop: 6 }}>
                  <Text style={styles.microLabel}>Remarks / Warranty</Text>
                  <TextInput
                    style={[styles.microInput, { height: 32 }]}
                    placeholder="e.g. 15 Years Official Warranty"
                    value={item.remarks}
                    onChangeText={(val) => handleUpdateRow(idx, 'remarks', val)}
                  />
                </View>
              </View>
            ))}
          </View>
        </NeumorphicCard>

        {/* Grand Total Summary Card */}
        <NeumorphicCard style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal</Text>
            <Text style={styles.summaryVal}>Rs. {formatCurrency(subtotal)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Tax (0%)</Text>
            <Text style={styles.summaryVal}>Rs. 0</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryRowGrand}>
            <Text style={styles.grandLabel}>Grand Total</Text>
            <Text style={styles.grandVal}>Rs. {formatCurrency(grandTotal)}</Text>
          </View>
        </NeumorphicCard>

        {/* Collapsible Section 1: Battery Options */}
        {selectedTemplate.hasBatterySection && (
          <NeumorphicCard style={styles.accordionCard}>
            <View style={styles.accordionHeaderWrapper}>
              <TouchableOpacity
                style={styles.accordionHeader}
                onPress={() => setShowBatterySection(!showBatterySection)}
              >
                <View style={styles.accordionTitleGroup}>
                  <Ionicons name="battery-charging" size={20} color={colors.secondaryContainer} />
                  <Text style={styles.accordionTitle}>Battery Options ({batteryOptions.length})</Text>
                </View>
                <Ionicons
                  name={showBatterySection ? 'chevron-up' : 'chevron-down'}
                  size={20}
                  color={colors.outline}
                />
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.addBatteryBtn} onPress={handleAddBattery} activeOpacity={0.8}>
                <Ionicons name="add" size={16} color="#FFFFFF" style={{ marginRight: 2 }} />
                <Text style={styles.addBatteryText}>+ Add Battery</Text>
              </TouchableOpacity>
            </View>

            {showBatterySection && (
              <View style={styles.accordionBody}>
                <Text style={styles.accordionSub}>
                  Edit battery prices below. Tap the circle icon to select which battery to highlight in the combined total on Page 1 (all battery options will appear in the Page 2 reference table):
                </Text>

                <View style={{ gap: 12 }}>
                  {batteryOptions.map((bat) => {
                    const isSelected = selectedBatteryId === bat.id;
                    return (
                      <View
                        key={bat.id}
                        style={[
                          styles.batteryOptionCard,
                          isSelected && styles.batteryOptionSelected,
                        ]}
                      >
                        {/* Top selection bar */}
                        <View style={styles.batteryCardTop}>
                          <TouchableOpacity
                            style={styles.batterySelectBtn}
                            onPress={() => setSelectedBatteryId(isSelected ? undefined : bat.id)}
                            activeOpacity={0.7}
                          >
                            <Ionicons
                              name={isSelected ? 'radio-button-on' : 'radio-button-off'}
                              size={20}
                              color={isSelected ? colors.secondaryContainer : colors.outline}
                            />
                            <Text style={[styles.batterySelectText, isSelected && styles.batterySelectTextActive]}>
                              {isSelected ? 'Selected for Page 1 Highlight' : 'Tap to Select for Highlight'}
                            </Text>
                          </TouchableOpacity>

                          <TouchableOpacity
                            style={styles.deleteBatteryBtn}
                            onPress={() => handleDeleteBattery(bat.id)}
                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                          >
                            <Ionicons name="trash-outline" size={18} color={colors.error} />
                          </TouchableOpacity>
                        </View>

                        {/* Editable Brand / Name */}
                        <View style={{ marginBottom: 8 }}>
                          <Text style={styles.microLabel}>Battery Brand / Model Description</Text>
                          <TextInput
                            style={styles.batteryInput}
                            value={bat.brand}
                            onChangeText={(v) => handleUpdateBattery(bat.id, 'brand', v)}
                            placeholder="e.g. Dyness or YJC"
                          />
                        </View>

                        {/* Capacity & Price Row */}
                        <View style={styles.batteryInputsRow}>
                          <View style={{ width: '32%' }}>
                            <Text style={styles.microLabel}>Capacity (kWh)</Text>
                            <TextInput
                              style={styles.batteryInput}
                              keyboardType="numeric"
                              value={bat.capacityKwh?.toString() || '5'}
                              onChangeText={(v) => handleUpdateBattery(bat.id, 'capacityKwh', parseFloat(v) || 0)}
                              placeholder="5"
                            />
                          </View>

                          <View style={{ flex: 1, marginLeft: 8 }}>
                            <Text style={styles.microLabel}>Price Rate (Rs.) *</Text>
                            <TextInput
                              style={[styles.batteryInput, { fontWeight: '800', color: colors.primaryContainer }]}
                              keyboardType="numeric"
                              value={bat.rate?.toString() || '0'}
                              onChangeText={(v) => handleUpdateBattery(bat.id, 'rate', parseFloat(v) || 0)}
                              placeholder="250000"
                            />
                          </View>
                        </View>

                        {/* Warranty */}
                        <View style={{ marginTop: 8 }}>
                          <Text style={styles.microLabel}>Warranty / Remarks</Text>
                          <TextInput
                            style={styles.batteryInput}
                            value={bat.warranty}
                            onChangeText={(v) => handleUpdateBattery(bat.id, 'warranty', v)}
                            placeholder="5 Years Official Warranty"
                          />
                        </View>
                      </View>
                    );
                  })}
                </View>
              </View>
            )}
          </NeumorphicCard>
        )}

        {/* Collapsible Section 2: Payment Terms */}
        <NeumorphicCard style={styles.accordionCard}>
          <TouchableOpacity
            style={styles.accordionHeader}
            onPress={() => setShowPaymentSection(!showPaymentSection)}
          >
            <View style={styles.accordionTitleGroup}>
              <Ionicons name="card-outline" size={20} color={colors.primaryContainer} />
              <Text style={styles.accordionTitle}>Payment Terms (70/20/10)</Text>
            </View>
            <Ionicons
              name={showPaymentSection ? 'chevron-up' : 'chevron-down'}
              size={20}
              color={colors.outline}
            />
          </TouchableOpacity>

          {showPaymentSection && (
            <View style={styles.accordionBody}>
              <View style={styles.termsInputsRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.microLabel}>Advance %</Text>
                  <TextInput
                    style={styles.microInput}
                    keyboardType="numeric"
                    value={paymentTerms.advancePercent.toString()}
                    onChangeText={(v) =>
                      setPaymentTerms({ ...paymentTerms, advancePercent: parseInt(v) || 0 })
                    }
                  />
                </View>
                <View style={{ flex: 1, marginHorizontal: 8 }}>
                  <Text style={styles.microLabel}>Dumping %</Text>
                  <TextInput
                    style={styles.microInput}
                    keyboardType="numeric"
                    value={paymentTerms.onDumpingPercent.toString()}
                    onChangeText={(v) =>
                      setPaymentTerms({ ...paymentTerms, onDumpingPercent: parseInt(v) || 0 })
                    }
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.microLabel}>Completion %</Text>
                  <TextInput
                    style={styles.microInput}
                    keyboardType="numeric"
                    value={paymentTerms.onCompletionPercent.toString()}
                    onChangeText={(v) =>
                      setPaymentTerms({ ...paymentTerms, onCompletionPercent: parseInt(v) || 0 })
                    }
                  />
                </View>
              </View>
            </View>
          )}
        </NeumorphicCard>

        {/* Collapsible Section 3: ROI Projection */}
        <NeumorphicCard style={styles.accordionCard}>
          <TouchableOpacity
            style={styles.accordionHeader}
            onPress={() => setShowRoiSection(!showRoiSection)}
          >
            <View style={styles.accordionTitleGroup}>
              <Ionicons name="trending-up" size={20} color={colors.secondaryContainer} />
              <Text style={styles.accordionTitle}>Return on Investment (ROI)</Text>
            </View>
            <Ionicons
              name={showRoiSection ? 'chevron-up' : 'chevron-down'}
              size={20}
              color={colors.outline}
            />
          </TouchableOpacity>

          {showRoiSection && (
            <View style={styles.accordionBody}>
              <NeumorphicInput
                label="Monthly Savings"
                value={roi.monthlySavingsPkr}
                onChangeText={(v) => setRoi({ ...roi, monthlySavingsPkr: v })}
                containerStyle={{ marginBottom: 10 }}
              />
              <NeumorphicInput
                label="Payback Period"
                value={roi.paybackPeriodMonths}
                onChangeText={(v) => setRoi({ ...roi, paybackPeriodMonths: v })}
                containerStyle={{ marginBottom: 10 }}
              />
              <NeumorphicInput
                label="Monthly Production"
                value={roi.monthlyProductionUnits}
                onChangeText={(v) => setRoi({ ...roi, monthlyProductionUnits: v })}
              />
            </View>
          )}
        </NeumorphicCard>
      </ScrollView>

      {/* Fixed Bottom Action Bar */}
      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.saveDraftBtn} onPress={handleSaveDraft} activeOpacity={0.8}>
          <Ionicons name="save-outline" size={18} color={colors.primaryContainer} style={{ marginRight: 6 }} />
          <Text style={styles.saveDraftText}>Save Draft</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.previewBtn} onPress={handlePreview} activeOpacity={0.85}>
          <Ionicons name="eye" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
          <Text style={styles.previewBtnText}>Preview & Share</Text>
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
    gap: 16,
    maxWidth: 640,
    width: '100%',
    alignSelf: 'center',
  },
  previewHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.secondaryContainer,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  previewHeaderText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  card: {
    padding: 16,
    borderRadius: 18,
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.primaryContainer,
    letterSpacing: 0.8,
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 14,
  },
  systemTypeGroup: {
    marginTop: 4,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.onSurfaceVariant,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: '#E6E9EE',
    borderRadius: 12,
    padding: 4,
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  segmentBtnActive: {
    backgroundColor: colors.primaryContainer,
  },
  segmentText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.onSurfaceVariant,
  },
  segmentTextActive: {
    color: '#FFFFFF',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  addRowBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryContainer,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  addRowText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  lineItemRowCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  lineItemRowHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  srBadge: {
    backgroundColor: colors.primaryContainer,
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 6,
  },
  srBadgeText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 11,
  },
  descInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingHorizontal: 10,
    height: 38,
    fontSize: 13,
    fontWeight: '600',
    color: colors.onSurface,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  deleteRowBtn: {
    padding: 6,
    marginLeft: 6,
  },
  lineItemInputsRow: {
    flexDirection: 'row',
  },
  microLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.outline,
    marginBottom: 2,
  },
  microInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingHorizontal: 8,
    height: 34,
    fontSize: 13,
    fontWeight: '600',
    color: colors.onSurface,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  totalDisplayBox: {
    backgroundColor: '#E6E9EE',
    borderRadius: 8,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  totalDisplayText: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.primaryContainer,
  },
  summaryCard: {
    padding: 18,
    borderRadius: 18,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  summaryLabel: {
    fontSize: 14,
    color: colors.onSurfaceVariant,
    fontWeight: '500',
  },
  summaryVal: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.onSurface,
  },
  summaryDivider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 10,
  },
  summaryRowGrand: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  grandLabel: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.primaryContainer,
  },
  grandVal: {
    fontSize: 22,
    fontWeight: '900',
    color: colors.secondaryContainer,
  },
  accordionCard: {
    borderRadius: 18,
    overflow: 'hidden',
  },
  accordionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  accordionTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  accordionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.primaryContainer,
  },
  accordionBody: {
    padding: 16,
    paddingTop: 0,
  },
  accordionSub: {
    fontSize: 12,
    color: colors.outline,
    marginBottom: 10,
  },
  accordionHeaderWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingRight: 14,
  },
  addBatteryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryContainer,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  addBatteryText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  batteryOptionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  batteryOptionSelected: {
    borderColor: colors.secondaryContainer,
    borderWidth: 1.5,
    backgroundColor: '#FFFDF5',
  },
  batteryCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 6,
  },
  batterySelectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  batterySelectText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.outline,
    marginLeft: 6,
  },
  batterySelectTextActive: {
    color: colors.secondaryContainer,
    fontWeight: '800',
  },
  deleteBatteryBtn: {
    padding: 4,
    marginLeft: 8,
  },
  batteryInput: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    paddingHorizontal: 10,
    height: 38,
    fontSize: 13,
    fontWeight: '600',
    color: colors.onSurface,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  batteryInputsRow: {
    flexDirection: 'row',
  },
  termsInputsRow: {
    flexDirection: 'row',
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
    shadowColor: '#A3B1C6',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  saveDraftBtn: {
    flex: 1,
    height: 50,
    backgroundColor: '#E6E9EE',
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  saveDraftText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primaryContainer,
  },
  previewBtn: {
    flex: 1.5,
    height: 50,
    backgroundColor: colors.secondaryContainer,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#D47E19',
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 4,
  },
  previewBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
