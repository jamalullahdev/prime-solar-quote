import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  Platform,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { usePrimeStore } from '../store/primeStore';
import Header from '../components/Header';
import NeumorphicCard from '../components/NeumorphicCard';
import NeumorphicInput from '../components/NeumorphicInput';
import {
  Quotation,
  LineItem,
  SystemType,
  PaymentTerms,
  ProductionData,
} from '../types';
import { PRESET_BATTERY_ITEMS } from '../data/seedTemplates';
import {
  formatCurrency,
  calculateProductionData,
} from '../utils/solarCalculations';

export default function QuotationEditorScreen({ route, navigation }: any) {
  const quotationId = route?.params?.quotationId;
  const passedQuotation = route?.params?.quotation;
  const templateId = route?.params?.templateId || 'template-simple-hybrid';
  const prefillKw = route?.params?.prefillKw || '10';
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
  const [customerAddress, setCustomerAddress] = useState(
    existingQuote?.customer?.address || ''
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

  // Battery Preset Picker Modal State
  const [showBatteryPicker, setShowBatteryPicker] = useState(false);

  // Payment terms
  const [paymentTerms, setPaymentTerms] = useState<PaymentTerms>(
    existingQuote?.paymentTerms || {
      advancePercent: 70,
      onDumpingPercent: 20,
      onCompletionPercent: 10,
    }
  );

  // Live Production Data State
  const [productionData, setProductionData] = useState<ProductionData>(
    existingQuote?.productionData ||
      calculateProductionData(
        prefillPanels || Math.ceil((parseFloat(capacityKw) * 1000) / 625) || 18,
        625,
        parseFloat(capacityKw) || 10,
        existingQuote?.grandTotal || 0
      )
  );

  // Collapsible accordion states
  const [showPaymentSection, setShowPaymentSection] = useState(false);
  const [showProductionSection, setShowProductionSection] = useState(true);

  // Grand Total Calculation
  const subtotal = lineItems.reduce((sum, item) => sum + (item.total || 0), 0);
  const grandTotal = subtotal;

  // Auto-update Production Data when capacity or items change
  useEffect(() => {
    const kw = parseFloat(capacityKw) || 10;
    const panelCount = Math.ceil((kw * 1000) / 625) || 18;
    const newProd = calculateProductionData(panelCount, 625, kw, grandTotal);
    setProductionData(newProd);
  }, [capacityKw, grandTotal]);

  const handleAddRow = () => {
    const nextSr = lineItems.length + 1;
    const newItem: LineItem = {
      id: `li_${Date.now()}_${nextSr}`,
      srNo: nextSr,
      description: '',
      qty: '1',
      rate: null,
      total: 0,
      remarks: '',
      isEditableDescription: true,
    };
    setLineItems([...lineItems, newItem]);
  };

  const handleAddPresetBattery = (preset: typeof PRESET_BATTERY_ITEMS[0]) => {
    const nextSr = lineItems.length + 1;
    const newBatteryItem: LineItem = {
      id: `li_bat_${Date.now()}_${nextSr}`,
      srNo: nextSr,
      description: preset.description,
      qty: preset.qty,
      rate: preset.rate,
      total: preset.total,
      remarks: preset.remarks,
      isEditableDescription: true,
    };
    setLineItems([...lineItems, newBatteryItem]);
    setShowBatteryPicker(false);
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

  const buildQuotationObject = (): Quotation => {
    const kw = parseFloat(capacityKw) || 10;
    const panelCount = Math.ceil((kw * 1000) / 625) || 18;
    const finalProdData = calculateProductionData(panelCount, 625, kw, grandTotal);

    return {
      id: existingQuote?.id || `quote_${Date.now()}`,
      quotationNumber:
        existingQuote?.quotationNumber ||
        `PS-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
      templateId: selectedTemplate.id,
      templateName: selectedTemplate.name,
      formatKind: selectedTemplate.formatKind,
      customer: {
        name: customerName.trim(),
        address: customerAddress.trim(),
      },
      capacityKw: capacityKw.trim(),
      systemType,
      panelBrand: 'JA / Jinko Bifacial Mono Perc Tier 1',
      panelWattage: '625W',
      panelCount,
      inverterBrand: 'Solis / GoodWe IP66',
      lineItems,
      batteryOptions: [],
      paymentTerms,
      roi: {
        dailyProductionUnits: finalProdData.dailyUnitsText,
        monthlyProductionUnits: finalProdData.monthlyUnitsText,
        monthlySavingsPkr: finalProdData.monthlySavingsText,
        paybackPeriodMonths: finalProdData.roiMonthsText,
      },
      productionData: finalProdData,
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
      if (Platform.OS === 'web') {
        window.alert('Please enter a Customer Name.');
      } else {
        Alert.alert('Missing Info', 'Please enter a Customer Name before saving.');
      }
      return;
    }
    const quote = buildQuotationObject();
    await saveQuotation(quote);
    if (Platform.OS === 'web') {
      window.alert('Quotation saved successfully!');
      navigation.navigate('Home');
    } else {
      Alert.alert('Saved', 'Quotation draft saved successfully!', [
        { text: 'OK', onPress: () => navigation.navigate('Home') },
      ]);
    }
  };

  const handlePreview = async () => {
    if (!customerName.trim()) {
      if (Platform.OS === 'web') {
        window.alert('Please enter a Customer Name.');
      } else {
        Alert.alert('Missing Info', 'Please enter a Customer Name before generating preview.');
      }
      return;
    }
    const quote = buildQuotationObject();
    await saveQuotation(quote);
    navigation.navigate('Preview', { quotation: quote });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header
        title={existingQuote ? 'Edit Quotation' : 'New Quotation'}
        subtitle={selectedTemplate.name}
        showBack
        onBack={() => navigation.goBack()}
      />

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Customer & System Details Card */}
        <NeumorphicCard style={styles.card}>
          <Text style={styles.sectionTitle}>CUSTOMER & SYSTEM DETAILS</Text>

          <NeumorphicInput
            label="Customer Name *"
            placeholder="e.g. Mr. LC Umar Farooq or Mr. Masood"
            value={customerName}
            onChangeText={setCustomerName}
            containerStyle={{ marginBottom: 10 }}
          />

          <NeumorphicInput
            label="Location / Reference (Optional)"
            placeholder="e.g. 187, Falcon Complex, Lahore or DHA Bahawalpur"
            value={customerAddress}
            onChangeText={setCustomerAddress}
            containerStyle={{ marginBottom: 10 }}
          />

          <View style={styles.inputsRow}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <NeumorphicInput
                label="Capacity (kW) *"
                placeholder="10"
                keyboardType="numeric"
                value={capacityKw}
                onChangeText={setCapacityKw}
              />
            </View>
            <View style={{ flex: 1, marginLeft: 8 }}>
              <NeumorphicInput
                label="Valid Till *"
                placeholder="25/09/2026"
                value={validTill}
                onChangeText={setValidTill}
              />
            </View>
          </View>

          {/* System Type Selector */}
          <Text style={styles.inputSubLabel}>System Configuration</Text>
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
        </NeumorphicCard>

        {/* Itemized Quotation Line Items Grid (Includes Hardware & Batteries) */}
        <NeumorphicCard style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.sectionTitle}>LINE ITEMS ({lineItems.length})</Text>
            <View style={{ flexDirection: 'row', gap: 6 }}>
              <TouchableOpacity
                style={[styles.addRowBtn, { backgroundColor: colors.secondaryContainer }]}
                onPress={() => setShowBatteryPicker(true)}
                activeOpacity={0.8}
              >
                <Ionicons name="battery-charging" size={15} color="#FFFFFF" style={{ marginRight: 3 }} />
                <Text style={styles.addRowText}>+ Battery</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.addRowBtn} onPress={handleAddRow} activeOpacity={0.8}>
                <Ionicons name="add" size={16} color="#FFFFFF" style={{ marginRight: 2 }} />
                <Text style={styles.addRowText}>+ Item</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={{ gap: 10 }}>
            {lineItems.map((item, index) => {
              const isBatteryItem =
                item.description.toLowerCase().includes('battery') ||
                item.description.toLowerCase().includes('lithium');

              return (
                <View
                  key={item.id || index}
                  style={[
                    styles.lineItemRowCard,
                    isBatteryItem && { backgroundColor: '#FFFDF5', borderColor: '#FDE68A' },
                  ]}
                >
                  <View style={styles.lineItemRowHeader}>
                    <View style={[styles.srBadge, isBatteryItem && { backgroundColor: colors.secondaryContainer }]}>
                      <Text style={styles.srBadgeText}>
                        {item.srNo < 10 ? '0' + item.srNo : item.srNo}
                      </Text>
                    </View>
                    <TextInput
                      style={[styles.descInput, { flex: 1, marginLeft: 8 }, isBatteryItem && { fontWeight: '700' }]}
                      value={item.description}
                      onChangeText={(v) => handleUpdateRow(index, 'description', v)}
                      placeholder="Item Description..."
                    />
                    <TouchableOpacity
                      style={styles.deleteRowBtn}
                      onPress={() => handleDeleteRow(index)}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Ionicons name="trash-outline" size={18} color={colors.error} />
                    </TouchableOpacity>
                  </View>

                  <View style={styles.lineItemInputsRow}>
                    <View style={{ width: '26%' }}>
                      <Text style={styles.microLabel}>Qty</Text>
                      <TextInput
                        style={styles.microInput}
                        value={item.qty}
                        onChangeText={(v) => handleUpdateRow(index, 'qty', v)}
                        placeholder="e.g. 18 or 01"
                      />
                    </View>

                    <View style={{ flex: 1, marginHorizontal: 6 }}>
                      <Text style={styles.microLabel}>Total (Rs.) *</Text>
                      <TextInput
                        style={[styles.microInput, { fontWeight: '700', color: colors.primaryContainer }]}
                        keyboardType="numeric"
                        value={item.total?.toString() || '0'}
                        onChangeText={(v) => handleUpdateRow(index, 'total', parseFloat(v) || 0)}
                        placeholder="Total (Rs)"
                      />
                    </View>

                    <View style={{ width: '38%' }}>
                      <Text style={styles.microLabel}>Remarks</Text>
                      <TextInput
                        style={styles.microInput}
                        value={item.remarks}
                        onChangeText={(v) => handleUpdateRow(index, 'remarks', v)}
                        placeholder="e.g. 15 Yrs Warranty"
                      />
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        </NeumorphicCard>

        {/* Live Quotation Summary Card */}
        <NeumorphicCard style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total Line Items</Text>
            <Text style={styles.summaryVal}>{lineItems.length} Components</Text>
          </View>

          <View style={styles.summaryDivider} />

          <View style={styles.summaryRowGrand}>
            <Text style={styles.grandLabel}>Total Quotation</Text>
            <Text style={styles.grandVal}>Rs. {formatCurrency(grandTotal)}</Text>
          </View>
        </NeumorphicCard>

        {/* Universal Production Data Table Card */}
        <NeumorphicCard style={styles.accordionCard}>
          <TouchableOpacity
            style={styles.accordionHeader}
            onPress={() => setShowProductionSection(!showProductionSection)}
          >
            <View style={styles.accordionTitleGroup}>
              <Ionicons name="sunny" size={20} color={colors.secondaryContainer} />
              <Text style={styles.accordionTitle}>
                {capacityKw.toUpperCase()}kW System Production Data
              </Text>
            </View>
            <Ionicons
              name={showProductionSection ? 'chevron-up' : 'chevron-down'}
              size={20}
              color={colors.outline}
            />
          </TouchableOpacity>

          {showProductionSection && (
            <View style={styles.accordionBody}>
              <Text style={styles.accordionSub}>
                Calculated live based on Tier-1 PV capacity (5 units/kW/day @ Rs. 65/unit):
              </Text>

              <View style={styles.prodDataBox}>
                <View style={styles.prodDataRow}>
                  <Text style={styles.prodDataLabel}>Daily Production:</Text>
                  <Text style={styles.prodDataVal}>{productionData.dailyUnitsText}</Text>
                </View>
                <View style={styles.prodDataRow}>
                  <Text style={styles.prodDataLabel}>Monthly Production:</Text>
                  <Text style={styles.prodDataVal}>{productionData.monthlyUnitsText}</Text>
                </View>
                <View style={styles.prodDataRow}>
                  <Text style={styles.prodDataLabel}>Monthly Savings:</Text>
                  <Text style={[styles.prodDataVal, { color: colors.secondaryContainer, fontWeight: '800' }]}>
                    {productionData.monthlySavingsText}
                  </Text>
                </View>
                <View style={[styles.prodDataRow, { borderBottomWidth: 0 }]}>
                  <Text style={styles.prodDataLabel}>Return of Investment:</Text>
                  <Text style={styles.prodDataVal}>{productionData.roiMonthsText}</Text>
                </View>
              </View>
            </View>
          )}
        </NeumorphicCard>

        {/* Payment Terms Section */}
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
      </ScrollView>

      {/* Preset Battery Quick Selector Modal */}
      <Modal visible={showBatteryPicker} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Lithium Battery to Add</Text>
              <TouchableOpacity onPress={() => setShowBatteryPicker(false)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Ionicons name="close" size={24} color={colors.outline} />
              </TouchableOpacity>
            </View>
            <Text style={styles.modalSub}>
              Tap any battery model below to insert it directly into your itemized quotation table:
            </Text>

            <View style={{ gap: 8, marginTop: 10 }}>
              {PRESET_BATTERY_ITEMS.map((preset, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={styles.presetBatteryCard}
                  onPress={() => handleAddPresetBattery(preset)}
                  activeOpacity={0.7}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={styles.presetName}>{preset.description}</Text>
                    <Text style={styles.presetWarranty}>{preset.remarks}</Text>
                  </View>
                  <Text style={styles.presetRate}>+ Rs. {formatCurrency(preset.total)}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </Modal>

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
    paddingBottom: 110,
    maxWidth: 640,
    width: '100%',
    alignSelf: 'center',
    gap: 14,
  },
  card: {
    padding: 16,
    borderRadius: 18,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.onSurfaceVariant,
    letterSpacing: 0.8,
    marginBottom: 12,
  },
  inputsRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  inputSubLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.outline,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
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
  prodDataBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  prodDataRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  prodDataLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.onSurface,
  },
  prodDataVal: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primaryContainer,
  },
  termsInputsRow: {
    flexDirection: 'row',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    maxWidth: 480,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.primaryContainer,
  },
  modalSub: {
    fontSize: 12,
    color: colors.outline,
    lineHeight: 16,
  },
  presetBatteryCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  presetName: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.onSurface,
  },
  presetWarranty: {
    fontSize: 11,
    color: colors.outline,
    marginTop: 2,
  },
  presetRate: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.secondaryContainer,
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
  saveDraftBtn: {
    flex: 1,
    height: 48,
    backgroundColor: '#E6E9EE',
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  saveDraftText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primaryContainer,
  },
  previewBtn: {
    flex: 1.4,
    height: 48,
    backgroundColor: colors.primaryContainer,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  previewBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
