import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Switch,
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
import { TemplateDefinition, TemplateColumn, LineItem, SystemType, PaymentTerms } from '../types';
import { DEFAULT_COLUMNS } from '../data/seedTemplates';
import {
  getStandardBatterySpecs,
  formatBatteryDescription,
  isBatteryDescription,
  parseBatteryDescription,
  POPULAR_BATTERY_BRANDS,
  STANDARD_BATTERY_SIZES,
} from '../utils/batteryHelper';
import { formatCurrency } from '../utils/solarCalculations';

export default function TemplateBuilderScreen({ route, navigation }: any) {
  const templates = usePrimeStore((state) => state.templates);
  const saveTemplate = usePrimeStore((state) => state.saveTemplate);

  const duplicateTemplateId = route?.params?.duplicateTemplateId;
  const editTemplateId = route?.params?.editTemplateId;

  const baseTemplate =
    templates.find((t) => t.id === (editTemplateId || duplicateTemplateId)) || null;

  const isEditingBuiltIn = !!(editTemplateId && baseTemplate?.isBuiltIn);

  const [name, setName] = useState(
    editTemplateId
      ? baseTemplate?.name || ''
      : duplicateTemplateId
      ? `${baseTemplate?.name || 'Custom'} (Copy)`
      : ''
  );
  const [description, setDescription] = useState(baseTemplate?.description || '');
  const [systemType, setSystemType] = useState<SystemType>(baseTemplate?.systemTypeDefault || 'HYBRID');
  const [hasBattery, setHasBattery] = useState(baseTemplate?.hasBatterySection ?? false);
  const [hasPaymentTerms, setHasPaymentTerms] = useState(baseTemplate?.hasPaymentTermsSection ?? true);
  const [hasRoi, setHasRoi] = useState(baseTemplate?.hasRoiSection ?? true);

  const [columns, setColumns] = useState<TemplateColumn[]>(
    baseTemplate?.columns ? [...baseTemplate.columns] : [...DEFAULT_COLUMNS]
  );

  const [lineItems, setLineItems] = useState<LineItem[]>(
    baseTemplate?.defaultLineItems
      ? baseTemplate.defaultLineItems.map((item) => ({ ...item }))
      : [
          {
            id: 'li-new-1',
            srNo: 1,
            description: 'JA / Jinko 620/625 Watt N-Type Bifacial Mono Perc Tier 1',
            qty: '18',
            rate: null,
            total: 466875,
            remarks: '15 Years Production Warranty',
          },
          {
            id: 'li-new-2',
            srNo: 2,
            description: 'Solis / GoodWe Hybrid Inverter 10 kW IP66',
            qty: '01',
            rate: null,
            total: 405000,
            remarks: '5 Years Official Warranty',
          },
        ]
  );

  // Default Payment Terms
  const [advancePercent, setAdvancePercent] = useState('70');
  const [dumpingPercent, setDumpingPercent] = useState('20');
  const [completionPercent, setCompletionPercent] = useState('10');

  // Permission Modal State
  const [showPermissionModal, setShowPermissionModal] = useState(false);

  // Battery Quick Modal State
  const [showBatteryModal, setShowBatteryModal] = useState(false);
  const [batteryBrand, setBatteryBrand] = useState('YJC');
  const [batteryKwh, setBatteryKwh] = useState('5');
  const [batteryAh, setBatteryAh] = useState('100Ah');
  const [batteryVoltage, setBatteryVoltage] = useState('51.2V');
  const [batteryQty, setBatteryQty] = useState('01');
  const [batteryRate, setBatteryRate] = useState('230000');
  const [batteryRemarks, setBatteryRemarks] = useState('5 Years Official Warranty');

  const handleAddLineItem = () => {
    const nextSr = lineItems.length + 1;
    const newItem: LineItem = {
      id: `li_${Date.now()}_${nextSr}`,
      srNo: nextSr,
      description: '',
      qty: '01',
      rate: null,
      total: 0,
      remarks: '',
      isEditableDescription: true,
    };
    setLineItems([...lineItems, newItem]);
  };

  const handleOpenAddBattery = () => {
    setBatteryBrand('YJC');
    setBatteryKwh('5');
    const specs = getStandardBatterySpecs(5);
    setBatteryAh(specs.ah);
    setBatteryVoltage(specs.voltage);
    setBatteryRemarks(specs.defaultWarranty);
    setBatteryRate(specs.defaultRate.toString());
    setBatteryQty('01');
    setShowBatteryModal(true);
  };

  const handleSelectBatteryKwh = (kwh: number) => {
    setBatteryKwh(kwh.toString());
    const specs = getStandardBatterySpecs(kwh);
    setBatteryAh(specs.ah);
    setBatteryVoltage(specs.voltage);
    setBatteryRemarks(specs.defaultWarranty);
    setBatteryRate(specs.defaultRate.toString());
  };

  const handleInsertBatteryItem = () => {
    const desc = formatBatteryDescription(batteryBrand, batteryKwh, batteryAh, batteryVoltage);
    const nextSr = lineItems.length + 1;
    const numRate = parseFloat(batteryRate) || null;
    const numQty = parseFloat(batteryQty) || 1;
    const newBatteryItem: LineItem = {
      id: `li_bat_${Date.now()}_${nextSr}`,
      srNo: nextSr,
      description: desc,
      qty: batteryQty || '01',
      rate: numRate,
      total: numRate ? Math.round(numRate * numQty) : 0,
      remarks: batteryRemarks,
      isEditableDescription: true,
    };
    setLineItems([...lineItems, newBatteryItem]);
    setShowBatteryModal(false);
  };

  const handleRemoveLineItem = (index: number) => {
    const updated = lineItems
      .filter((_, idx) => idx !== index)
      .map((item, idx) => ({
        ...item,
        srNo: idx + 1,
      }));
    setLineItems(updated);
  };

  const handleUpdateLineItem = (index: number, field: keyof LineItem, value: any) => {
    const updated = [...lineItems];
    const item = { ...updated[index], [field]: value };
    if (field === 'qty' || field === 'rate') {
      const numQty = parseFloat(item.qty) || 0;
      const numRate = typeof item.rate === 'number' ? item.rate : parseFloat(item.rate || '0') || 0;
      item.total = Math.round(numQty * numRate);
    }
    updated[index] = item;
    setLineItems(updated);
  };

  // Triggers Save Flow
  const handleInitiateSave = () => {
    if (!name.trim()) {
      if (Platform.OS === 'web') {
        window.alert('Please enter a name for this quotation format.');
      } else {
        Alert.alert('Missing Name', 'Please enter a name for this quotation format.');
      }
      return;
    }

    if (isEditingBuiltIn) {
      // Prompt for Master Permission
      setShowPermissionModal(true);
    } else {
      // Save directly
      executeSave(false);
    }
  };

  const executeSave = async (asNewCustomCopy: boolean = false) => {
    setShowPermissionModal(false);

    const templateId =
      asNewCustomCopy || !editTemplateId
        ? `template_custom_${Date.now()}`
        : editTemplateId;

    const isBuiltInFlag = asNewCustomCopy ? false : (baseTemplate?.isBuiltIn ?? false);

    const newTemplate: TemplateDefinition = {
      id: templateId,
      name: asNewCustomCopy ? `${name.trim()} (Custom Copy)` : name.trim(),
      description: description.trim(),
      formatKind: baseTemplate?.formatKind || 'CUSTOM',
      systemTypeDefault: systemType,
      columns,
      defaultLineItems: lineItems,
      hasBatterySection: hasBattery,
      hasPaymentTermsSection: hasPaymentTerms,
      hasRoiSection: hasRoi,
      isBuiltIn: isBuiltInFlag,
      createdAt: baseTemplate?.createdAt || Date.now(),
    };

    await saveTemplate(newTemplate);

    if (Platform.OS === 'web') {
      window.alert('Format changes saved successfully!');
    } else {
      Alert.alert('Saved', 'Quotation format saved successfully!');
    }

    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header
        title={editTemplateId ? (isEditingBuiltIn ? 'Edit Master Format' : 'Edit Custom Format') : 'New Format Builder'}
        showBack
        onBack={() => navigation.goBack()}
        rightAction={
          <TouchableOpacity style={styles.saveHeaderBtn} onPress={handleInitiateSave}>
            <Text style={styles.saveHeaderText}>Save</Text>
          </TouchableOpacity>
        }
      />

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Built-in Notice Badge */}
        {isEditingBuiltIn && (
          <View style={styles.builtInWarningCard}>
            <Ionicons name="shield-checkmark" size={20} color="#0B2A4A" style={{ marginRight: 8 }} />
            <View style={{ flex: 1 }}>
              <Text style={styles.builtInWarningTitle}>Master Default Template</Text>
              <Text style={styles.builtInWarningSub}>
                Changes saved to this master format will become the default starting configuration for all future {name} quotations.
              </Text>
            </View>
          </View>
        )}

        {/* Format Details Card */}
        <NeumorphicCard style={styles.card}>
          <Text style={styles.sectionTitle}>FORMAT DETAILS</Text>

          <NeumorphicInput
            label="Template Name *"
            placeholder="e.g. Simple Hybrid System or Commercial 50kW"
            value={name}
            onChangeText={setName}
            containerStyle={{ marginBottom: 14 }}
          />

          <NeumorphicInput
            label="Description"
            placeholder="Brief explanation of this quotation setup..."
            value={description}
            onChangeText={setDescription}
            containerStyle={{ marginBottom: 14 }}
          />

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Default System Type</Text>
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

        {/* Default Equipment & Line Items */}
        <NeumorphicCard style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.sectionTitle}>DEFAULT LINE ITEMS ({lineItems.length})</Text>
            <View style={{ flexDirection: 'row', gap: 6 }}>
              <TouchableOpacity
                style={[styles.addRowBtn, { backgroundColor: colors.secondaryContainer }]}
                onPress={handleOpenAddBattery}
                activeOpacity={0.8}
              >
                <Ionicons name="battery-charging" size={15} color="#FFFFFF" style={{ marginRight: 3 }} />
                <Text style={styles.addRowText}>+ Battery</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.addRowBtn} onPress={handleAddLineItem} activeOpacity={0.8}>
                <Ionicons name="add" size={16} color="#FFFFFF" style={{ marginRight: 2 }} />
                <Text style={styles.addRowText}>+ Item</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={{ gap: 10 }}>
            {lineItems.map((item, idx) => {
              const isBattery = isBatteryDescription(item.description);

              return (
                <View
                  key={item.id || idx}
                  style={[
                    styles.lineItemBox,
                    isBattery && styles.batteryLineItemBox,
                  ]}
                >
                  <View style={styles.lineItemTop}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <View style={[styles.srBadge, isBattery && { backgroundColor: colors.secondaryContainer }]}>
                        <Text style={styles.srBadgeText}>
                          {item.srNo < 10 ? '0' + item.srNo : item.srNo}
                        </Text>
                      </View>
                      {isBattery && (
                        <View style={styles.batteryBadge}>
                          <Text style={styles.batteryBadgeText}>BATTERY</Text>
                        </View>
                      )}
                    </View>

                    <TouchableOpacity onPress={() => handleRemoveLineItem(idx)}>
                      <Ionicons name="trash-outline" size={18} color={colors.error} />
                    </TouchableOpacity>
                  </View>

                  <TextInput
                    style={[styles.itemDescInput, isBattery && { fontWeight: '700' }]}
                    placeholder="Item description..."
                    value={item.description}
                    onChangeText={(val) => handleUpdateLineItem(idx, 'description', val)}
                  />

                  <View style={styles.itemInputsRow}>
                    <View style={{ width: '25%' }}>
                      <Text style={styles.microLabel}>Qty</Text>
                      <TextInput
                        style={styles.microInput}
                        placeholder="1"
                        value={item.qty}
                        onChangeText={(val) => handleUpdateLineItem(idx, 'qty', val)}
                      />
                    </View>
                    <View style={{ flex: 1, marginHorizontal: 6 }}>
                      <Text style={styles.microLabel}>Default Total (Rs)</Text>
                      <TextInput
                        style={[styles.microInput, { fontWeight: '700', color: colors.primaryContainer }]}
                        placeholder="0"
                        keyboardType="numeric"
                        value={item.total?.toString() || '0'}
                        onChangeText={(val) => handleUpdateLineItem(idx, 'total', parseFloat(val) || 0)}
                      />
                    </View>
                    <View style={{ width: '38%' }}>
                      <Text style={styles.microLabel}>Remarks / Warranty</Text>
                      <TextInput
                        style={styles.microInput}
                        placeholder="Warranty..."
                        value={item.remarks}
                        onChangeText={(val) => handleUpdateLineItem(idx, 'remarks', val)}
                      />
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        </NeumorphicCard>

        {/* Default Payment Terms Section */}
        <NeumorphicCard style={styles.card}>
          <Text style={styles.sectionTitle}>DEFAULT PAYMENT TERMS (%)</Text>
          <View style={styles.termsInputsRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.microLabel}>Advance %</Text>
              <TextInput
                style={styles.microInput}
                keyboardType="numeric"
                value={advancePercent}
                onChangeText={setAdvancePercent}
              />
            </View>
            <View style={{ flex: 1, marginHorizontal: 8 }}>
              <Text style={styles.microLabel}>Dumping %</Text>
              <TextInput
                style={styles.microInput}
                keyboardType="numeric"
                value={dumpingPercent}
                onChangeText={setDumpingPercent}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.microLabel}>Completion %</Text>
              <TextInput
                style={styles.microInput}
                keyboardType="numeric"
                value={completionPercent}
                onChangeText={setCompletionPercent}
              />
            </View>
          </View>
        </NeumorphicCard>
      </ScrollView>

      {/* 🔒 Master Permission Safeguard Modal */}
      <Modal visible={showPermissionModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.permissionCard}>
            <View style={styles.permissionIconCircle}>
              <Ionicons name="shield-checkmark-outline" size={32} color="#0B2A4A" />
            </View>
            <Text style={styles.permissionTitle}>Update Master Default Format?</Text>
            <View style={styles.permissionBadge}>
              <Text style={styles.permissionBadgeText}>🔒 MASTER TEMPLATE PERMISSION</Text>
            </View>

            <Text style={styles.permissionBodyText}>
              You are about to save changes to the official default format <strong>"{name}"</strong>. All future quotations generated with this format will use these updated equipment items, quantities, and terms.
            </Text>

            <View style={{ gap: 10, width: '100%', marginTop: 8 }}>
              <TouchableOpacity
                style={styles.saveMasterBtn}
                onPress={() => executeSave(false)}
                activeOpacity={0.85}
              >
                <Ionicons name="checkmark-circle" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                <Text style={styles.saveMasterBtnText}>Update Master Default Format</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.saveCopyBtn}
                onPress={() => executeSave(true)}
                activeOpacity={0.85}
              >
                <Ionicons name="copy-outline" size={18} color={colors.primaryContainer} style={{ marginRight: 6 }} />
                <Text style={styles.saveCopyBtnText}>Save as New Custom Copy</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setShowPermissionModal(false)}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Battery Quick Insert Modal */}
      <Modal visible={showBatteryModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.batteryModalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Insert Standard Battery into Format</Text>
              <TouchableOpacity onPress={() => setShowBatteryModal(false)}>
                <Ionicons name="close-circle" size={24} color={colors.outline} />
              </TouchableOpacity>
            </View>

            <View style={{ gap: 10 }}>
              <Text style={styles.microLabel}>Select Capacity:</Text>
              <View style={{ flexDirection: 'row', gap: 6 }}>
                {STANDARD_BATTERY_SIZES.map((kwh) => (
                  <TouchableOpacity
                    key={kwh}
                    style={[styles.kwhChip, batteryKwh === kwh.toString() && styles.kwhChipActive]}
                    onPress={() => handleSelectBatteryKwh(kwh)}
                  >
                    <Text style={[styles.kwhChipText, batteryKwh === kwh.toString() && styles.kwhChipTextActive]}>
                      {kwh} kWh
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.microLabel}>Brand Name:</Text>
              <TextInput
                style={styles.configInput}
                value={batteryBrand}
                onChangeText={setBatteryBrand}
                placeholder="e.g. YJC, Dyness"
              />

              <Text style={styles.microLabel}>Default Rate (Rs):</Text>
              <TextInput
                style={styles.configInput}
                keyboardType="numeric"
                value={batteryRate}
                onChangeText={setBatteryRate}
              />

              <View style={styles.previewBox}>
                <Text style={styles.previewBoxText}>
                  {formatBatteryDescription(batteryBrand, batteryKwh, batteryAh, batteryVoltage)}
                </Text>
              </View>

              <TouchableOpacity
                style={styles.insertBatteryBtn}
                onPress={handleInsertBatteryItem}
                activeOpacity={0.85}
              >
                <Text style={styles.insertBatteryBtnText}>Insert Battery into Format</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    paddingBottom: 40,
    maxWidth: 640,
    width: '100%',
    alignSelf: 'center',
    gap: 14,
  },
  saveHeaderBtn: {
    backgroundColor: colors.primaryContainer,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 8,
  },
  saveHeaderText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13,
  },
  builtInWarningCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E0E7FF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1.5,
    borderColor: '#C7D2FE',
  },
  builtInWarningTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0B2A4A',
  },
  builtInWarningSub: {
    fontSize: 11,
    color: '#1E293B',
    marginTop: 2,
    lineHeight: 15,
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
  fieldGroup: {
    marginTop: 6,
  },
  fieldLabel: {
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
  lineItemBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  batteryLineItemBox: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FCD34D',
    borderWidth: 1.5,
  },
  lineItemTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  srBadge: {
    backgroundColor: colors.primaryContainer,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
  },
  srBadgeText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 11,
  },
  batteryBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  batteryBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#B45309',
  },
  itemDescInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingHorizontal: 10,
    height: 38,
    fontSize: 13,
    fontWeight: '600',
    color: colors.onSurface,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    marginBottom: 8,
  },
  itemInputsRow: {
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
  termsInputsRow: {
    flexDirection: 'row',
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
    maxWidth: 460,
    width: '100%',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#0B2A4A',
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
    backgroundColor: '#E0E7FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  permissionTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: 4,
  },
  permissionBadge: {
    backgroundColor: '#E0E7FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginBottom: 10,
  },
  permissionBadgeText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#0B2A4A',
    letterSpacing: 0.8,
  },
  permissionBodyText: {
    fontSize: 13,
    color: '#334155',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 14,
  },
  saveMasterBtn: {
    height: 46,
    backgroundColor: '#0B2A4A',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveMasterBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  saveCopyBtn: {
    height: 46,
    backgroundColor: '#E6E9EE',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  saveCopyBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primaryContainer,
  },
  cancelBtn: {
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.outline,
  },
  batteryModalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    maxWidth: 440,
    width: '100%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.primaryContainer,
  },
  kwhChip: {
    flex: 1,
    paddingVertical: 8,
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  kwhChipActive: {
    backgroundColor: '#FEF3C7',
    borderColor: colors.secondaryContainer,
  },
  kwhChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.onSurface,
  },
  kwhChipTextActive: {
    color: '#92400E',
    fontWeight: '800',
  },
  configInput: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    paddingHorizontal: 10,
    height: 38,
    fontSize: 13,
    fontWeight: '600',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  previewBox: {
    backgroundColor: '#FFFBEB',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FCD34D',
  },
  previewBoxText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#92400E',
  },
  insertBatteryBtn: {
    height: 44,
    backgroundColor: colors.secondaryContainer,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  insertBatteryBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
