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
import {
  formatCurrency,
  calculateProductionData,
} from '../utils/solarCalculations';
import {
  getStandardBatterySpecs,
  formatBatteryDescription,
  isBatteryDescription,
  parseBatteryDescription,
  POPULAR_BATTERY_BRANDS,
  STANDARD_BATTERY_SIZES,
} from '../utils/batteryHelper';

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

  // Battery Configurator Modal State
  const [showBatteryModal, setShowBatteryModal] = useState(false);
  const [editingBatteryIndex, setEditingBatteryIndex] = useState<number | null>(null);
  const [batteryBrand, setBatteryBrand] = useState('YJC');
  const [batteryKwh, setBatteryKwh] = useState('5');
  const [batteryAh, setBatteryAh] = useState('100Ah');
  const [batteryVoltage, setBatteryVoltage] = useState('51.2V');
  const [batteryQty, setBatteryQty] = useState('01');
  const [batteryRate, setBatteryRate] = useState('230000');
  const [batteryTotal, setBatteryTotal] = useState('230000');
  const [batteryRemarks, setBatteryRemarks] = useState('5 Years Official Warranty');
  const [isCustomKwh, setIsCustomKwh] = useState(false);

  // Internal Profit & Cost Safeguard & Modal State
  const [showProfitPermissionModal, setShowProfitPermissionModal] = useState(false);
  const [showProfitSheetModal, setShowProfitSheetModal] = useState(false);
  const [tempCostItems, setTempCostItems] = useState<{ [key: number]: number }>({});

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

  // Real Cost Total Calculation
  const totalRealCost = lineItems.reduce((sum, item) => sum + (item.costTotal || 0), 0);
  const netEstimatedProfit = grandTotal - totalRealCost;
  const profitMarginPercent =
    grandTotal > 0 ? Math.round((netEstimatedProfit / grandTotal) * 1000) / 10 : 0;

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
      costTotal: 0,
    };
    setLineItems([...lineItems, newItem]);
  };

  const handleOpenAddBattery = () => {
    setEditingBatteryIndex(null);
    setBatteryBrand('YJC');
    setBatteryKwh('5');
    setIsCustomKwh(false);
    const specs = getStandardBatterySpecs(5);
    setBatteryAh(specs.ah);
    setBatteryVoltage(specs.voltage);
    setBatteryRemarks(specs.defaultWarranty);
    setBatteryQty('01');
    setBatteryRate(specs.defaultRate.toString());
    setBatteryTotal(specs.defaultRate.toString());
    setShowBatteryModal(true);
  };

  const handleOpenEditBattery = (index: number) => {
    const item = lineItems[index];
    if (!item) return;
    setEditingBatteryIndex(index);
    const parsed = parseBatteryDescription(item.description);
    setBatteryBrand(parsed.brand || 'YJC');
    setBatteryKwh(parsed.capacityKwh.toString());
    setBatteryAh(parsed.ah || '100Ah');
    setBatteryVoltage(parsed.voltage || '51.2V');
    setIsCustomKwh(!STANDARD_BATTERY_SIZES.includes(parsed.capacityKwh));
    setBatteryQty(item.qty || '01');
    const numQty = parseFloat(item.qty) || 1;
    const numTotal = item.total || 0;
    const derivedRate =
      item.rate || (numTotal > 0 && numQty > 0 ? Math.round(numTotal / numQty) : 0);
    setBatteryRate(derivedRate.toString());
    setBatteryTotal(numTotal.toString());
    setBatteryRemarks(item.remarks || '5 Years Official Warranty');
    setShowBatteryModal(true);
  };

  const handleSelectKwhSize = (kwh: number) => {
    setIsCustomKwh(false);
    setBatteryKwh(kwh.toString());
    const specs = getStandardBatterySpecs(kwh);
    setBatteryAh(specs.ah);
    setBatteryVoltage(specs.voltage);
    setBatteryRemarks(specs.defaultWarranty);
    setBatteryRate(specs.defaultRate.toString());
    const numQty = parseFloat(batteryQty) || 1;
    setBatteryTotal((specs.defaultRate * numQty).toString());
  };

  const handleCustomKwhChange = (text: string) => {
    setBatteryKwh(text);
    const num = parseFloat(text);
    if (!isNaN(num) && num > 0) {
      const specs = getStandardBatterySpecs(num);
      setBatteryAh(specs.ah);
      setBatteryVoltage(specs.voltage);
      const numQty = parseFloat(batteryQty) || 1;
      setBatteryRate(specs.defaultRate.toString());
      setBatteryTotal((specs.defaultRate * numQty).toString());
    }
  };

  const handleRateChange = (text: string) => {
    setBatteryRate(text);
    const numRate = parseFloat(text) || 0;
    const numQty = parseFloat(batteryQty) || 1;
    setBatteryTotal(Math.round(numRate * numQty).toString());
  };

  const handleQtyChange = (text: string) => {
    setBatteryQty(text);
    const numQty = parseFloat(text) || 1;
    const numRate = parseFloat(batteryRate) || 0;
    setBatteryTotal(Math.round(numRate * numQty).toString());
  };

  const handleSaveBatteryConfig = () => {
    const formattedDesc = formatBatteryDescription(
      batteryBrand,
      batteryKwh,
      batteryAh,
      batteryVoltage
    );
    const numQty = batteryQty.trim() || '01';
    const numRate = parseFloat(batteryRate) || null;
    const numTotal =
      parseFloat(batteryTotal) ||
      (numRate ? Math.round(numRate * (parseFloat(numQty) || 1)) : 0);
    const finalRemarks = batteryRemarks.trim();

    if (editingBatteryIndex !== null) {
      const updated = [...lineItems];
      updated[editingBatteryIndex] = {
        ...updated[editingBatteryIndex],
        description: formattedDesc,
        qty: numQty,
        rate: numRate,
        total: numTotal,
        remarks: finalRemarks,
      };
      setLineItems(updated);
    } else {
      const nextSr = lineItems.length + 1;
      const newBatteryItem: LineItem = {
        id: `li_bat_${Date.now()}_${nextSr}`,
        srNo: nextSr,
        description: formattedDesc,
        qty: numQty,
        rate: numRate,
        total: numTotal,
        remarks: finalRemarks,
        isEditableDescription: true,
        costTotal: numTotal > 0 ? Math.round(numTotal * 0.85) : 0,
      };
      setLineItems([...lineItems, newBatteryItem]);
    }

    setShowBatteryModal(false);
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

  // Internal Profit Handlers
  const handleOpenProfitPermissionModal = () => {
    setShowProfitPermissionModal(true);
  };

  const handleUnlockProfitSheet = () => {
    setShowProfitPermissionModal(false);
    const initialMap: { [key: number]: number } = {};
    lineItems.forEach((item, idx) => {
      initialMap[idx] = item.costTotal || 0;
    });
    setTempCostItems(initialMap);
    setShowProfitSheetModal(true);
  };

  const handleUpdateTempCost = (index: number, val: number) => {
    setTempCostItems((prev) => ({ ...prev, [index]: val }));
  };

  const handleApplyMarginToAll = (marginPercent: number) => {
    const multiplier = 1 - marginPercent / 100;
    const updatedMap: { [key: number]: number } = {};
    lineItems.forEach((item, idx) => {
      const quoted = item.total || 0;
      updatedMap[idx] = Math.round(quoted * multiplier);
    });
    setTempCostItems(updatedMap);
  };

  const handleSaveProfitSheet = () => {
    const updated = lineItems.map((item, idx) => ({
      ...item,
      costTotal: tempCostItems[idx] !== undefined ? tempCostItems[idx] : item.costTotal || 0,
    }));
    setLineItems(updated);
    setShowProfitSheetModal(false);
  };

  // Temp totals inside Profit Modal
  const modalTempCostTotal = Object.values(tempCostItems).reduce(
    (sum, c) => sum + (c || 0),
    0
  );
  const modalTempNetProfit = grandTotal - modalTempCostTotal;
  const modalTempMargin =
    grandTotal > 0 ? Math.round((modalTempNetProfit / grandTotal) * 1000) / 10 : 0;

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

  const modalLiveDescription = formatBatteryDescription(
    batteryBrand,
    batteryKwh,
    batteryAh,
    batteryVoltage
  );

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

        {/* Itemized Quotation Line Items Grid */}
        <NeumorphicCard style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.sectionTitle}>LINE ITEMS ({lineItems.length})</Text>
            <View style={{ flexDirection: 'row', gap: 6 }}>
              <TouchableOpacity
                style={[styles.addRowBtn, { backgroundColor: colors.secondaryContainer }]}
                onPress={handleOpenAddBattery}
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
              const isBattery = isBatteryDescription(item.description);

              return (
                <View
                  key={item.id || index}
                  style={[
                    styles.lineItemRowCard,
                    isBattery && styles.batteryRowCard,
                  ]}
                >
                  {/* Row Header */}
                  <View style={styles.lineItemRowHeader}>
                    <View style={[styles.srBadge, isBattery && { backgroundColor: colors.secondaryContainer }]}>
                      <Text style={styles.srBadgeText}>
                        {item.srNo < 10 ? '0' + item.srNo : item.srNo}
                      </Text>
                    </View>

                    {isBattery && (
                      <View style={styles.batteryBadge}>
                        <Ionicons name="flash" size={12} color="#D97706" style={{ marginRight: 2 }} />
                        <Text style={styles.batteryBadgeText}>BATTERY</Text>
                      </View>
                    )}

                    <TextInput
                      style={[
                        styles.descInput,
                        { flex: 1, marginLeft: 6 },
                        isBattery && { fontWeight: '700', color: '#1E293B' },
                      ]}
                      value={item.description}
                      onChangeText={(v) => handleUpdateRow(index, 'description', v)}
                      placeholder="Item Description..."
                    />

                    {isBattery && (
                      <TouchableOpacity
                        style={styles.editBatteryIconBtn}
                        onPress={() => handleOpenEditBattery(index)}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <Ionicons name="options-outline" size={18} color={colors.secondaryContainer} />
                      </TouchableOpacity>
                    )}

                    <TouchableOpacity
                      style={styles.deleteRowBtn}
                      onPress={() => handleDeleteRow(index)}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Ionicons name="trash-outline" size={18} color={colors.error} />
                    </TouchableOpacity>
                  </View>

                  {/* Row Inputs */}
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

        {/* 🔒 Internal Cost & Profit Analyzer Card (Permission-Gated) */}
        <NeumorphicCard style={styles.internalProfitCard}>
          <View style={styles.internalProfitHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <View style={styles.lockBadge}>
                <Ionicons name="lock-closed" size={12} color="#DC2626" />
                <Text style={styles.lockBadgeText}>INTERNAL ONLY</Text>
              </View>
              <Text style={styles.internalCardTitle}>Profit & Cost Sheet</Text>
            </View>

            <TouchableOpacity
              style={styles.openProfitBtn}
              onPress={handleOpenProfitPermissionModal}
              activeOpacity={0.85}
            >
              <Ionicons name="calculator-outline" size={15} color="#FFFFFF" style={{ marginRight: 4 }} />
              <Text style={styles.openProfitBtnText}>Calculate Profit</Text>
            </TouchableOpacity>
          </View>

          {totalRealCost > 0 ? (
            <View style={styles.profitSnapshotRow}>
              <View style={styles.profitSnapshotItem}>
                <Text style={styles.snapshotLabel}>Real Cost</Text>
                <Text style={[styles.snapshotVal, { color: '#DC2626' }]}>
                  Rs. {formatCurrency(totalRealCost)}
                </Text>
              </View>
              <View style={styles.profitSnapshotItem}>
                <Text style={styles.snapshotLabel}>Net Profit</Text>
                <Text style={[styles.snapshotVal, { color: '#059669' }]}>
                  Rs. {formatCurrency(netEstimatedProfit)}
                </Text>
              </View>
              <View style={styles.profitSnapshotItem}>
                <Text style={styles.snapshotLabel}>Margin</Text>
                <Text style={[styles.snapshotVal, { color: '#0284C7' }]}>
                  {profitMarginPercent}%
                </Text>
              </View>
            </View>
          ) : (
            <Text style={styles.profitHintText}>
              🔒 Calculate your procurement costs and estimate exact net profit margin without exposing it to customers.
            </Text>
          )}
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

      {/* Advanced Battery Configurator Modal */}
      <Modal visible={showBatteryModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View style={styles.modalIconBox}>
                  <Ionicons name="battery-charging" size={20} color="#FFFFFF" />
                </View>
                <View>
                  <Text style={styles.modalTitle}>
                    {editingBatteryIndex !== null ? 'Edit Battery Item' : 'Add Lithium Battery'}
                  </Text>
                  <Text style={styles.modalSub}>
                    Auto-formats specs according to standard client rules
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={() => setShowBatteryModal(false)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="close-circle" size={26} color={colors.outline} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 480 }} showsVerticalScrollIndicator={false}>
              {/* Step 1: Battery Capacity (kWh) */}
              <View style={styles.configSection}>
                <Text style={styles.configLabel}>1. SELECT CAPACITY (kWh)</Text>
                <View style={styles.chipRow}>
                  {STANDARD_BATTERY_SIZES.map((kwh) => {
                    const isSelected = !isCustomKwh && batteryKwh === kwh.toString();
                    const std = getStandardBatterySpecs(kwh);
                    return (
                      <TouchableOpacity
                        key={kwh}
                        style={[styles.kwhChip, isSelected && styles.kwhChipActive]}
                        onPress={() => handleSelectKwhSize(kwh)}
                      >
                        <Text style={[styles.kwhChipText, isSelected && styles.kwhChipTextActive]}>
                          {kwh} kWh
                        </Text>
                        <Text style={[styles.kwhChipSub, isSelected && styles.kwhChipSubActive]}>
                          {std.ah}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                  <TouchableOpacity
                    style={[styles.kwhChip, isCustomKwh && styles.kwhChipActive]}
                    onPress={() => setIsCustomKwh(true)}
                  >
                    <Text style={[styles.kwhChipText, isCustomKwh && styles.kwhChipTextActive]}>
                      Custom
                    </Text>
                    <Text style={[styles.kwhChipSub, isCustomKwh && styles.kwhChipSubActive]}>
                      kWh / Ah
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Custom Sizing Inputs */}
                {isCustomKwh && (
                  <View style={styles.customRow}>
                    <View style={{ flex: 1, marginRight: 6 }}>
                      <Text style={styles.microLabel}>Custom kWh</Text>
                      <TextInput
                        style={styles.configInput}
                        keyboardType="numeric"
                        value={batteryKwh}
                        onChangeText={handleCustomKwhChange}
                        placeholder="e.g. 15 or 32"
                      />
                    </View>
                    <View style={{ flex: 1, marginLeft: 6 }}>
                      <Text style={styles.microLabel}>Ah Rating</Text>
                      <TextInput
                        style={styles.configInput}
                        value={batteryAh}
                        onChangeText={setBatteryAh}
                        placeholder="e.g. 300Ah"
                      />
                    </View>
                  </View>
                )}
              </View>

              {/* Step 2: Battery Brand / Company */}
              <View style={styles.configSection}>
                <Text style={styles.configLabel}>2. BRAND / COMPANY NAME</Text>
                <View style={styles.chipRow}>
                  {POPULAR_BATTERY_BRANDS.slice(0, 5).map((brand) => {
                    const isSelected = batteryBrand.toLowerCase() === brand.toLowerCase();
                    return (
                      <TouchableOpacity
                        key={brand}
                        style={[styles.brandChip, isSelected && styles.brandChipActive]}
                        onPress={() => setBatteryBrand(brand)}
                      >
                        <Text
                          style={[
                            styles.brandChipText,
                            isSelected && styles.brandChipTextActive,
                          ]}
                        >
                          {brand}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
                <TextInput
                  style={[styles.configInput, { marginTop: 8 }]}
                  value={batteryBrand}
                  onChangeText={setBatteryBrand}
                  placeholder="Or type custom brand name (e.g. YJC, Dyness, Narada)..."
                />
              </View>

              {/* Step 3: Quantity & Pricing */}
              <View style={styles.configSection}>
                <Text style={styles.configLabel}>3. QUANTITY & RATE (Rs.)</Text>
                <View style={styles.customRow}>
                  <View style={{ width: '30%', marginRight: 8 }}>
                    <Text style={styles.microLabel}>Qty</Text>
                    <TextInput
                      style={styles.configInput}
                      value={batteryQty}
                      onChangeText={handleQtyChange}
                      placeholder="01"
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.microLabel}>Unit Rate (Rs.)</Text>
                    <TextInput
                      style={styles.configInput}
                      keyboardType="numeric"
                      value={batteryRate}
                      onChangeText={handleRateChange}
                      placeholder="e.g. 230000"
                    />
                  </View>
                </View>
                <View style={styles.totalPreviewBox}>
                  <Text style={styles.totalPreviewLabel}>Calculated Battery Total:</Text>
                  <Text style={styles.totalPreviewVal}>
                    Rs. {formatCurrency(parseFloat(batteryTotal) || 0)}
                  </Text>
                </View>
              </View>

              {/* Step 4: Warranty / Remarks */}
              <View style={styles.configSection}>
                <Text style={styles.configLabel}>4. WARRANTY / REMARKS</Text>
                <View style={styles.chipRow}>
                  {['5 Years Official Warranty', '7 Years Official Warranty', '10 Years Official Warranty'].map(
                    (w) => {
                      const isSelected = batteryRemarks === w;
                      return (
                        <TouchableOpacity
                          key={w}
                          style={[styles.warrantyChip, isSelected && styles.warrantyChipActive]}
                          onPress={() => setBatteryRemarks(w)}
                        >
                          <Text
                            style={[
                              styles.warrantyChipText,
                              isSelected && styles.warrantyChipTextActive,
                            ]}
                          >
                            {w.replace(' Official Warranty', ' Yrs')}
                          </Text>
                        </TouchableOpacity>
                      );
                    }
                  )}
                </View>
                <TextInput
                  style={[styles.configInput, { marginTop: 8 }]}
                  value={batteryRemarks}
                  onChangeText={setBatteryRemarks}
                  placeholder="Remarks / Warranty..."
                />
              </View>

              {/* Real-time Line Item Preview Box */}
              <View style={styles.livePreviewCard}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                  <Ionicons name="checkmark-circle" size={16} color="#059669" style={{ marginRight: 4 }} />
                  <Text style={styles.livePreviewTitle}>QUOTATION TABLE PREVIEW</Text>
                </View>
                <Text style={styles.livePreviewDesc}>{modalLiveDescription}</Text>
                <View style={styles.livePreviewDetails}>
                  <Text style={styles.livePreviewDetailItem}>Qty: {batteryQty || '01'}</Text>
                  <Text style={styles.livePreviewDetailItem}>
                    Total: Rs. {formatCurrency(parseFloat(batteryTotal) || 0)}
                  </Text>
                  <Text style={styles.livePreviewDetailItem}>Remarks: {batteryRemarks}</Text>
                </View>
              </View>
            </ScrollView>

            {/* Modal Bottom Buttons */}
            <View style={styles.modalBottomRow}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setShowBatteryModal(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalSubmitBtn}
                onPress={handleSaveBatteryConfig}
                activeOpacity={0.85}
              >
                <Ionicons name="checkmark" size={18} color="#FFFFFF" style={{ marginRight: 4 }} />
                <Text style={styles.modalSubmitText}>
                  {editingBatteryIndex !== null ? 'Update Battery' : 'Add to Table'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* 🔒 1. Internal Profit Permission Prompt Modal */}
      <Modal visible={showProfitPermissionModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxWidth: 440, borderColor: '#F87171', borderWidth: 2 }]}>
            <View style={{ alignItems: 'center', marginBottom: 12 }}>
              <View style={styles.permissionIconCircle}>
                <Ionicons name="shield-checkmark" size={32} color="#DC2626" />
              </View>
              <Text style={styles.permissionTitle}>Owner Permission Required</Text>
              <View style={styles.permissionBadge}>
                <Text style={styles.permissionBadgeText}>🔒 CONFIDENTIAL INTERNAL REPORT</Text>
              </View>
            </View>

            <Text style={styles.permissionBodyText}>
              You are about to view the real procurement costs and net profit calculation for this project.
            </Text>
            <View style={styles.permissionWarningBox}>
              <Ionicons name="alert-circle" size={18} color="#B45309" style={{ marginRight: 6 }} />
              <Text style={styles.permissionWarningText}>
                This data is strictly for Prime Solar internal review and will NEVER be shown to customers.
              </Text>
            </View>

            <View style={styles.modalBottomRow}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setShowProfitPermissionModal(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalSubmitBtn, { backgroundColor: '#DC2626' }]}
                onPress={handleUnlockProfitSheet}
                activeOpacity={0.85}
              >
                <Ionicons name="lock-open-outline" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                <Text style={styles.modalSubmitText}>Unlock Sheet</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* 🔒 2. Internal Profit & Cost Calculator Sheet Modal */}
      <Modal visible={showProfitSheetModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxWidth: 580, maxHeight: '90%' }]}>
            {/* Sheet Header */}
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View style={[styles.modalIconBox, { backgroundColor: '#DC2626' }]}>
                  <Ionicons name="analytics" size={20} color="#FFFFFF" />
                </View>
                <View>
                  <Text style={[styles.modalTitle, { color: '#0F172A' }]}>
                    Internal Cost & Profit Sheet
                  </Text>
                  <Text style={styles.modalSub}>
                    Enter real purchase costs to calculate exact net margin
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={() => setShowProfitSheetModal(false)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="close-circle" size={26} color={colors.outline} />
              </TouchableOpacity>
            </View>

            {/* KPI Summary Cards */}
            <View style={styles.profitKpiGrid}>
              <View style={[styles.profitKpiCard, { borderColor: '#0B2A4A' }]}>
                <Text style={styles.profitKpiLabel}>Quoted Total</Text>
                <Text style={[styles.profitKpiVal, { color: '#0B2A4A' }]}>
                  Rs. {formatCurrency(grandTotal)}
                </Text>
              </View>
              <View style={[styles.profitKpiCard, { borderColor: '#DC2626' }]}>
                <Text style={styles.profitKpiLabel}>Total Cost</Text>
                <Text style={[styles.profitKpiVal, { color: '#DC2626' }]}>
                  Rs. {formatCurrency(modalTempCostTotal)}
                </Text>
              </View>
              <View style={[styles.profitKpiCard, { borderColor: '#059669', backgroundColor: '#F0FDF4' }]}>
                <Text style={styles.profitKpiLabel}>Net Profit</Text>
                <Text style={[styles.profitKpiVal, { color: '#059669' }]}>
                  Rs. {formatCurrency(modalTempNetProfit)}
                </Text>
              </View>
              <View style={[styles.profitKpiCard, { borderColor: '#0284C7', backgroundColor: '#F0F9FF' }]}>
                <Text style={styles.profitKpiLabel}>Margin</Text>
                <Text style={[styles.profitKpiVal, { color: '#0284C7' }]}>
                  {modalTempMargin}%
                </Text>
              </View>
            </View>

            {/* Quick Auto-Estimate Shortcuts */}
            <View style={styles.shortcutRow}>
              <Text style={styles.shortcutTitle}>Auto-Set Cost:</Text>
              <TouchableOpacity
                style={styles.shortcutChip}
                onPress={() => handleApplyMarginToAll(15)}
              >
                <Text style={styles.shortcutChipText}>15% Profit Margin</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.shortcutChip}
                onPress={() => handleApplyMarginToAll(20)}
              >
                <Text style={styles.shortcutChipText}>20% Profit Margin</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.shortcutChip}
                onPress={() => handleApplyMarginToAll(0)}
              >
                <Text style={styles.shortcutChipText}>Reset to 0</Text>
              </TouchableOpacity>
            </View>

            {/* Line-by-Line Cost Inputs */}
            <ScrollView style={{ maxHeight: 320 }} showsVerticalScrollIndicator={false}>
              <View style={{ gap: 8 }}>
                {lineItems.map((item, idx) => {
                  const quoted = item.total || 0;
                  const itemCost = tempCostItems[idx] || 0;
                  const itemProfit = quoted - itemCost;

                  return (
                    <View key={item.id || idx} style={styles.costItemRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.costItemDesc} numberOfLines={1}>
                          {item.srNo < 10 ? '0' + item.srNo : item.srNo}. {item.description}
                        </Text>
                        <Text style={styles.costItemMeta}>
                          Quoted: <strong>Rs. {formatCurrency(quoted)}</strong> (Qty: {item.qty || '1'})
                        </Text>
                      </View>

                      {/* Cost Input */}
                      <View style={{ width: 140, marginLeft: 8 }}>
                        <Text style={styles.microLabel}>Real Cost (Rs.)</Text>
                        <TextInput
                          style={[styles.costInput, { color: '#DC2626' }]}
                          keyboardType="numeric"
                          value={itemCost ? itemCost.toString() : ''}
                          onChangeText={(v) => handleUpdateTempCost(idx, parseFloat(v) || 0)}
                          placeholder="Cost (Rs)"
                        />
                        <Text
                          style={[
                            styles.costItemProfit,
                            { color: itemProfit >= 0 ? '#059669' : '#DC2626' },
                          ]}
                        >
                          Profit: Rs. {formatCurrency(itemProfit)}
                        </Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            </ScrollView>

            {/* Save Buttons */}
            <View style={styles.modalBottomRow}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setShowProfitSheetModal(false)}
              >
                <Text style={styles.modalCancelText}>Close</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalSubmitBtn, { backgroundColor: '#0B2A4A' }]}
                onPress={handleSaveProfitSheet}
                activeOpacity={0.85}
              >
                <Ionicons name="save-outline" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                <Text style={styles.modalSubmitText}>Save Internal Costs</Text>
              </TouchableOpacity>
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
  batteryRowCard: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FCD34D',
    borderWidth: 1.5,
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
  batteryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
    marginLeft: 6,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  batteryBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#B45309',
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
  editBatteryIconBtn: {
    padding: 6,
    marginLeft: 4,
    backgroundColor: '#FEF3C7',
    borderRadius: 8,
  },
  deleteRowBtn: {
    padding: 6,
    marginLeft: 4,
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
  internalProfitCard: {
    padding: 16,
    borderRadius: 18,
    backgroundColor: '#FFF1F2',
    borderWidth: 1.5,
    borderColor: '#FECDD3',
  },
  internalProfitHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lockBadge: {
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
  lockBadgeText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#DC2626',
    letterSpacing: 0.5,
  },
  internalCardTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#9F1239',
  },
  openProfitBtn: {
    backgroundColor: '#DC2626',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  openProfitBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  profitSnapshotRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 10,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#FECDD3',
  },
  profitSnapshotItem: {
    alignItems: 'center',
    flex: 1,
  },
  snapshotLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#9F1239',
    marginBottom: 2,
  },
  snapshotVal: {
    fontSize: 13,
    fontWeight: '900',
  },
  profitHintText: {
    fontSize: 11,
    color: '#9F1239',
    marginTop: 8,
    lineHeight: 15,
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
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    maxWidth: 520,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.28,
    shadowRadius: 14,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  modalIconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: colors.secondaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.primaryContainer,
  },
  modalSub: {
    fontSize: 11,
    color: colors.outline,
  },
  configSection: {
    marginBottom: 14,
  },
  configLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.onSurfaceVariant,
    letterSpacing: 0.6,
    marginBottom: 8,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  kwhChip: {
    flex: 1,
    minWidth: 72,
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 6,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  kwhChipActive: {
    backgroundColor: '#FEF3C7',
    borderColor: colors.secondaryContainer,
  },
  kwhChipText: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.onSurface,
  },
  kwhChipTextActive: {
    color: '#92400E',
  },
  kwhChipSub: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.outline,
    marginTop: 2,
  },
  kwhChipSubActive: {
    color: '#B45309',
  },
  customRow: {
    flexDirection: 'row',
    marginTop: 8,
  },
  configInput: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 40,
    fontSize: 13,
    fontWeight: '600',
    color: colors.onSurface,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  brandChip: {
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  brandChipActive: {
    backgroundColor: colors.primaryContainer,
    borderColor: colors.primaryContainer,
  },
  brandChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.onSurface,
  },
  brandChipTextActive: {
    color: '#FFFFFF',
  },
  totalPreviewBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginTop: 8,
  },
  totalPreviewLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.onSurfaceVariant,
  },
  totalPreviewVal: {
    fontSize: 14,
    fontWeight: '900',
    color: colors.secondaryContainer,
  },
  warrantyChip: {
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  warrantyChipActive: {
    backgroundColor: '#ECFDF5',
    borderColor: '#10B981',
  },
  warrantyChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.onSurface,
  },
  warrantyChipTextActive: {
    color: '#047857',
  },
  livePreviewCard: {
    backgroundColor: '#FFFBEB',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1.5,
    borderColor: '#FCD34D',
    marginTop: 4,
    marginBottom: 8,
  },
  livePreviewTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#92400E',
    letterSpacing: 0.5,
  },
  livePreviewDesc: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1E293B',
    marginBottom: 4,
  },
  livePreviewDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  livePreviewDetailItem: {
    fontSize: 11,
    fontWeight: '600',
    color: '#78350F',
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
    marginBottom: 14,
  },
  permissionWarningText: {
    fontSize: 11,
    color: '#92400E',
    fontWeight: '600',
    flex: 1,
  },
  profitKpiGrid: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  profitKpiCard: {
    flex: 1,
    padding: 8,
    borderRadius: 10,
    borderWidth: 1.5,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
  },
  profitKpiLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#64748B',
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  profitKpiVal: {
    fontSize: 12,
    fontWeight: '900',
  },
  shortcutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 10,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  shortcutTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  shortcutChip: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  shortcutChipText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#0F172A',
  },
  costItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  costItemDesc: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 2,
  },
  costItemMeta: {
    fontSize: 11,
    color: '#64748B',
  },
  costInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingHorizontal: 8,
    height: 32,
    fontSize: 12,
    fontWeight: '700',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  costItemProfit: {
    fontSize: 10,
    fontWeight: '800',
    marginTop: 2,
    textAlign: 'right',
  },
  modalBottomRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
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
  modalSubmitBtn: {
    flex: 1.5,
    height: 44,
    backgroundColor: colors.secondaryContainer,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalSubmitText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
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
