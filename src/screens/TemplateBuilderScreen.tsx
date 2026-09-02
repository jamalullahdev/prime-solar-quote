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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { usePrimeStore } from '../store/primeStore';
import Header from '../components/Header';
import NeumorphicCard from '../components/NeumorphicCard';
import NeumorphicInput from '../components/NeumorphicInput';
import { TemplateDefinition, TemplateColumn, LineItem, SystemType } from '../types';
import { DEFAULT_COLUMNS } from '../data/seedTemplates';

export default function TemplateBuilderScreen({ route, navigation }: any) {
  const templates = usePrimeStore((state) => state.templates);
  const saveTemplate = usePrimeStore((state) => state.saveTemplate);

  const duplicateTemplateId = route?.params?.duplicateTemplateId;
  const editTemplateId = route?.params?.editTemplateId;

  const baseTemplate =
    templates.find((t) => t.id === (editTemplateId || duplicateTemplateId)) || null;

  const [name, setName] = useState(
    editTemplateId
      ? baseTemplate?.name || ''
      : duplicateTemplateId
      ? `${baseTemplate?.name || 'Custom'} (Copy)`
      : ''
  );
  const [description, setDescription] = useState(baseTemplate?.description || '');
  const [systemType, setSystemType] = useState<SystemType>(baseTemplate?.systemTypeDefault || 'HYBRID');
  const [hasBattery, setHasBattery] = useState(baseTemplate?.hasBatterySection ?? true);
  const [hasPaymentTerms, setHasPaymentTerms] = useState(baseTemplate?.hasPaymentTermsSection ?? true);
  const [hasRoi, setHasRoi] = useState(baseTemplate?.hasRoiSection ?? true);

  const [columns, setColumns] = useState<TemplateColumn[]>(
    baseTemplate?.columns ? [...baseTemplate.columns] : [...DEFAULT_COLUMNS]
  );

  const [lineItems, setLineItems] = useState<LineItem[]>(
    baseTemplate?.defaultLineItems
      ? [...baseTemplate.defaultLineItems]
      : [
          {
            id: 'li-new-1',
            srNo: 1,
            description: 'Tier-1 Bifacial N-Type Solar Panels',
            qty: '18',
            rate: 18500,
            total: 333000,
            remarks: '15 Years Warranty',
          },
          {
            id: 'li-new-2',
            srNo: 2,
            description: 'Solar Inverter IP66 (3-Phase)',
            qty: '1',
            rate: 450000,
            total: 450000,
            remarks: '5 Years Warranty',
          },
        ]
  );

  const handleAddLineItem = () => {
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

  const handleRemoveLineItem = (index: number) => {
    const updated = lineItems.filter((_, idx) => idx !== index).map((item, idx) => ({
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
      const numRate = item.rate || 0;
      item.total = numQty * numRate;
    }
    updated[index] = item;
    setLineItems(updated);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      if (Platform.OS === 'web') {
        window.alert('Please enter a name for this quotation format.');
      } else {
        Alert.alert('Missing Name', 'Please enter a name for this quotation format.');
      }
      return;
    }

    const templateId = editTemplateId || `template_custom_${Date.now()}`;
    const newTemplate: TemplateDefinition = {
      id: templateId,
      name: name.trim(),
      description: description.trim(),
      systemTypeDefault: systemType,
      columns,
      defaultLineItems: lineItems,
      hasBatterySection: hasBattery,
      hasPaymentTermsSection: hasPaymentTerms,
      hasRoiSection: hasRoi,
      isBuiltIn: false,
      createdAt: Date.now(),
    };

    await saveTemplate(newTemplate);
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header
        title={editTemplateId ? 'Edit Format' : 'Template Builder'}
        showBack
        onBack={() => navigation.goBack()}
        rightAction={
          <TouchableOpacity style={styles.saveHeaderBtn} onPress={handleSave}>
            <Text style={styles.saveHeaderText}>Save</Text>
          </TouchableOpacity>
        }
      />

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Format Details Card */}
        <NeumorphicCard style={styles.card}>
          <Text style={styles.sectionTitle}>FORMAT DETAILS</Text>

          <NeumorphicInput
            label="Template Name *"
            placeholder="e.g. Commercial 50kW+ or Tubewell Special"
            value={name}
            onChangeText={setName}
            containerStyle={{ marginBottom: 14 }}
          />

          <NeumorphicInput
            label="Description"
            placeholder="Purpose or notes for this format..."
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

        {/* Section Toggles Card */}
        <NeumorphicCard style={styles.card}>
          <Text style={styles.sectionTitle}>OPTIONAL SECTIONS IN PDF</Text>

          <View style={styles.toggleRow}>
            <View style={{ flex: 1, paddingRight: 10 }}>
              <Text style={styles.toggleTitle}>Battery Options Table</Text>
              <Text style={styles.toggleSub}>Include Lithium-Ion battery reference price list on Page 2</Text>
            </View>
            <Switch
              value={hasBattery}
              onValueChange={setHasBattery}
              trackColor={{ true: colors.secondaryContainer, false: '#CBD5E1' }}
            />
          </View>

          <View style={styles.toggleRow}>
            <View style={{ flex: 1, paddingRight: 10 }}>
              <Text style={styles.toggleTitle}>Payment Terms Section</Text>
              <Text style={styles.toggleSub}>Include 70/20/10 milestone payment terms on Page 2</Text>
            </View>
            <Switch
              value={hasPaymentTerms}
              onValueChange={setHasPaymentTerms}
              trackColor={{ true: colors.secondaryContainer, false: '#CBD5E1' }}
            />
          </View>

          <View style={[styles.toggleRow, { borderBottomWidth: 0 }]}>
            <View style={{ flex: 1, paddingRight: 10 }}>
              <Text style={styles.toggleTitle}>Return on Investment (ROI)</Text>
              <Text style={styles.toggleSub}>Include monthly savings & payback period on Page 2</Text>
            </View>
            <Switch
              value={hasRoi}
              onValueChange={setHasRoi}
              trackColor={{ true: colors.secondaryContainer, false: '#CBD5E1' }}
            />
          </View>
        </NeumorphicCard>

        {/* Default Starter Line Items */}
        <NeumorphicCard style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.sectionTitle}>DEFAULT STARTER LINE ITEMS ({lineItems.length})</Text>
            <TouchableOpacity style={styles.addRowBtn} onPress={handleAddLineItem}>
              <Ionicons name="add" size={16} color="#FFFFFF" style={{ marginRight: 2 }} />
              <Text style={styles.addRowText}>Add Row</Text>
            </TouchableOpacity>
          </View>

          <View style={{ gap: 12 }}>
            {lineItems.map((item, idx) => (
              <View key={item.id || idx} style={styles.lineItemBox}>
                <View style={styles.lineItemTop}>
                  <Text style={styles.lineItemSr}>#{idx + 1}</Text>
                  <TouchableOpacity onPress={() => handleRemoveLineItem(idx)}>
                    <Ionicons name="trash-outline" size={18} color={colors.error} />
                  </TouchableOpacity>
                </View>

                <TextInput
                  style={styles.itemDescInput}
                  placeholder="Item description (e.g. 585W Panels, Inverter...)"
                  value={item.description}
                  onChangeText={(val) => handleUpdateLineItem(idx, 'description', val)}
                />

                <View style={styles.itemInputsRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.microLabel}>Qty</Text>
                    <TextInput
                      style={styles.microInput}
                      placeholder="1"
                      value={item.qty}
                      onChangeText={(val) => handleUpdateLineItem(idx, 'qty', val)}
                    />
                  </View>
                  <View style={{ flex: 1.5, marginLeft: 8 }}>
                    <Text style={styles.microLabel}>Rate (Rs)</Text>
                    <TextInput
                      style={styles.microInput}
                      placeholder="0"
                      keyboardType="numeric"
                      value={item.rate?.toString() || '0'}
                      onChangeText={(val) => handleUpdateLineItem(idx, 'rate', parseFloat(val) || 0)}
                    />
                  </View>
                  <View style={{ flex: 1.5, marginLeft: 8 }}>
                    <Text style={styles.microLabel}>Remarks</Text>
                    <TextInput
                      style={styles.microInput}
                      placeholder="Warranty..."
                      value={item.remarks}
                      onChangeText={(val) => handleUpdateLineItem(idx, 'remarks', val)}
                    />
                  </View>
                </View>
              </View>
            ))}
          </View>
        </NeumorphicCard>

        {/* Bottom Save CTA */}
        <TouchableOpacity style={styles.saveBottomBtn} onPress={handleSave} activeOpacity={0.85}>
          <Text style={styles.saveBottomBtnText}>Save Custom Quotation Format</Text>
        </TouchableOpacity>
      </ScrollView>
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
    gap: 16,
    maxWidth: 640,
    width: '100%',
    alignSelf: 'center',
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
  card: {
    padding: 18,
    borderRadius: 18,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.primaryContainer,
    letterSpacing: 0.8,
    marginBottom: 14,
  },
  fieldGroup: {
    marginTop: 4,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.onSurfaceVariant,
    marginBottom: 8,
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
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  segmentBtnActive: {
    backgroundColor: colors.primaryContainer,
    shadowColor: '#0B2A4A',
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  segmentText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.onSurfaceVariant,
  },
  segmentTextActive: {
    color: '#FFFFFF',
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  toggleTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.onSurface,
  },
  toggleSub: {
    fontSize: 12,
    color: colors.outline,
    marginTop: 2,
    lineHeight: 16,
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
    paddingVertical: 5,
    borderRadius: 8,
  },
  addRowText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  lineItemBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  lineItemTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  lineItemSr: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.primaryContainer,
  },
  itemDescInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingHorizontal: 10,
    height: 38,
    fontSize: 13,
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
    fontSize: 12,
    fontWeight: '600',
    color: colors.onSurface,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  saveBottomBtn: {
    backgroundColor: colors.secondaryContainer,
    height: 54,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#D47E19',
    shadowOpacity: 0.45,
    shadowRadius: 8,
    elevation: 6,
  },
  saveBottomBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
});
