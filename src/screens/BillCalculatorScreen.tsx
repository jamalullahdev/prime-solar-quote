import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { neomorph } from '../theme/neomorph';
import { usePrimeStore } from '../store/primeStore';
import Header from '../components/Header';
import NeumorphicCard from '../components/NeumorphicCard';
import { calculateSolarSizing, formatCurrency } from '../utils/solarCalculations';

export default function BillCalculatorScreen({ navigation }: any) {
  const calculatorSettings = usePrimeStore((state) => state.calculatorSettings);
  const updateCalculatorSettings = usePrimeStore((state) => state.updateCalculatorSettings);

  const [billInput, setBillInput] = useState('65000');
  const [showSettings, setShowSettings] = useState(false);

  // Settings Temp State
  const [tariffInput, setTariffInput] = useState(calculatorSettings.ratePerUnitPkr.toString());
  const [yieldInput, setYieldInput] = useState(calculatorSettings.unitsPerKwPerDay.toString());
  const [panelWattInput, setPanelWattInput] = useState((calculatorSettings.defaultPanelWattage || 585).toString());

  const numericBill = parseFloat(billInput.replace(/,/g, '')) || 0;
  const sizing = calculateSolarSizing(numericBill, calculatorSettings);

  const handleSaveSettings = () => {
    updateCalculatorSettings({
      ratePerUnitPkr: parseFloat(tariffInput) || 45,
      unitsPerKwPerDay: parseFloat(yieldInput) || 4.5,
      defaultPanelWattage: parseFloat(panelWattInput) || 585,
    });
    setShowSettings(false);
  };

  const handleProceedToQuotation = () => {
    navigation.navigate('TemplatePicker', {
      prefillKw: sizing.recommendedKw.toString(),
      prefillRoi: sizing.roi,
      prefillPanels: sizing.panelCount,
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header
        title="Solar Sizing Calculator"
        showBack
        onBack={() => navigation.goBack()}
        rightAction={
          <TouchableOpacity
            style={styles.settingsIconBtn}
            onPress={() => setShowSettings(true)}
            activeOpacity={0.8}
          >
            <Ionicons name="settings-outline" size={20} color={colors.primaryContainer} />
          </TouchableOpacity>
        }
      />

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Bill Input Card */}
        <NeumorphicCard style={styles.inputCard}>
          <Text style={styles.inputTitle}>MONTHLY ELECTRICITY BILL</Text>
          <Text style={styles.inputSubtitle}>
            Enter the average WAPDA/MEPCO/LESCO monthly bill in Pakistani Rupees (PKR)
          </Text>

          <View style={styles.inputRow}>
            <Text style={styles.currencyPrefix}>Rs.</Text>
            <TextInput
              style={styles.largeInput}
              keyboardType="numeric"
              placeholder="e.g. 65,000"
              placeholderTextColor="#94A3B8"
              value={billInput}
              onChangeText={setBillInput}
            />
          </View>
        </NeumorphicCard>

        {/* Live Calculation Results */}
        <View style={styles.resultsHeader}>
          <Text style={styles.resultsHeading}>RECOMMENDED SOLAR SYSTEM</Text>
        </View>

        {/* Primary Recommended kW Card */}
        <NeumorphicCard style={styles.primaryResultCard}>
          <View style={styles.primaryResultContent}>
            <View>
              <Text style={styles.primaryLabel}>Recommended Capacity</Text>
              <Text style={styles.primaryKw}>{sizing.recommendedKw} kW</Text>
              <Text style={styles.primaryPanels}>
                {sizing.panelCount} × {calculatorSettings.defaultPanelWattage || 585}W Tier-1 Bifacial Panels
              </Text>
            </View>
            <View style={styles.solarIconBadge}>
              <Ionicons name="sunny" size={32} color="#FFFFFF" />
            </View>
          </View>
        </NeumorphicCard>

        {/* Detailed Breakdown Grid */}
        <View style={styles.breakdownGrid}>
          {/* Card 1: Estimated Units */}
          <NeumorphicCard style={styles.metricCard}>
            <View style={styles.metricHeader}>
              <Ionicons name="flash-outline" size={18} color={colors.primaryContainer} />
              <Text style={styles.metricTitle}>MONTHLY GENERATION</Text>
            </View>
            <Text style={styles.metricValue}>
              ~{Math.round(sizing.recommendedKw * calculatorSettings.unitsPerKwPerDay * 30)} Units
            </Text>
            <Text style={styles.metricSub}>Covers ~{sizing.estimatedMonthlyUnits} units consumed</Text>
          </NeumorphicCard>

          {/* Card 2: Monthly Savings */}
          <NeumorphicCard style={styles.metricCard}>
            <View style={styles.metricHeader}>
              <Ionicons name="trending-up" size={18} color={colors.secondaryContainer} />
              <Text style={styles.metricTitle}>ESTIMATED SAVINGS</Text>
            </View>
            <Text style={[styles.metricValue, { color: colors.secondaryContainer }]}>
              Rs. {formatCurrency(sizing.estimatedMonthlySavingsPkr)} /mo
            </Text>
            <Text style={styles.metricSub}>
              Rs. {formatCurrency(sizing.estimatedYearlySavingsPkr)} /year
            </Text>
          </NeumorphicCard>

          {/* Card 3: Payback Period */}
          <NeumorphicCard style={styles.metricCardFull}>
            <View style={styles.metricHeader}>
              <Ionicons name="time-outline" size={18} color={colors.primaryContainer} />
              <Text style={styles.metricTitle}>ESTIMATED PAYBACK PERIOD</Text>
            </View>
            <Text style={styles.metricValue}>{sizing.paybackPeriodYears} Years</Text>
            <Text style={styles.metricSub}>
              100% investment pays off in approximately {Math.round(sizing.paybackPeriodYears * 12)} months
            </Text>
          </NeumorphicCard>
        </View>

        {/* Proceed Action Button */}
        <TouchableOpacity
          style={styles.proceedBtn}
          onPress={handleProceedToQuotation}
          activeOpacity={0.85}
        >
          <Text style={styles.proceedBtnText}>Use {sizing.recommendedKw} kW → Create Quotation</Text>
          <Ionicons name="arrow-forward" size={20} color="#FFFFFF" style={{ marginLeft: 8 }} />
        </TouchableOpacity>
      </ScrollView>

      {/* Settings Dialog Modal */}
      <Modal visible={showSettings} transparent animationType="fade" onRequestClose={() => setShowSettings(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Calculator Settings</Text>
              <TouchableOpacity onPress={() => setShowSettings(false)}>
                <Ionicons name="close" size={22} color={colors.onSurface} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <View style={styles.settingField}>
                <Text style={styles.settingLabel}>Tariff Rate (Rs. / Unit)</Text>
                <TextInput
                  style={styles.settingInput}
                  keyboardType="numeric"
                  value={tariffInput}
                  onChangeText={setTariffInput}
                  placeholder="45"
                />
              </View>

              <View style={styles.settingField}>
                <Text style={styles.settingLabel}>Solar Yield (Units / kW / Day)</Text>
                <TextInput
                  style={styles.settingInput}
                  keyboardType="numeric"
                  value={yieldInput}
                  onChangeText={setYieldInput}
                  placeholder="4.5"
                />
              </View>

              <View style={styles.settingField}>
                <Text style={styles.settingLabel}>Default Panel Wattage (W)</Text>
                <TextInput
                  style={styles.settingInput}
                  keyboardType="numeric"
                  value={panelWattInput}
                  onChangeText={setPanelWattInput}
                  placeholder="585"
                />
              </View>
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowSettings(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveSettingsBtn} onPress={handleSaveSettings}>
                <Text style={styles.saveSettingsText}>Save Settings</Text>
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
  },
  settingsIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E6E9EE',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  inputCard: {
    padding: 18,
    borderRadius: 20,
    marginBottom: 20,
  },
  inputTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.primaryContainer,
    letterSpacing: 0.8,
  },
  inputSubtitle: {
    fontSize: 12,
    color: colors.outline,
    marginTop: 4,
    marginBottom: 14,
    lineHeight: 16,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E6E9EE',
    borderRadius: 14,
    paddingHorizontal: 16,
    height: 58,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  currencyPrefix: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.primaryContainer,
    marginRight: 8,
  },
  largeInput: {
    flex: 1,
    fontSize: 24,
    fontWeight: '800',
    color: colors.primaryContainer,
  },
  resultsHeader: {
    marginBottom: 10,
    paddingHorizontal: 4,
  },
  resultsHeading: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.onSurfaceVariant,
    letterSpacing: 1,
  },
  primaryResultCard: {
    backgroundColor: colors.primaryContainer,
    borderRadius: 20,
    padding: 20,
    marginBottom: 14,
    shadowColor: '#0B2A4A',
    shadowOffset: { width: 5, height: 5 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 6,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  primaryResultContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  primaryLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#AEC8F0',
    textTransform: 'uppercase',
  },
  primaryKw: {
    fontSize: 34,
    fontWeight: '900',
    color: '#FFFFFF',
    marginTop: 2,
  },
  primaryPanels: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.secondaryContainer,
    marginTop: 4,
  },
  solarIconBadge: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.secondaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#D47E19',
    shadowOpacity: 0.5,
    shadowRadius: 6,
    elevation: 4,
  },
  breakdownGrid: {
    gap: 12,
    marginBottom: 24,
  },
  metricCard: {
    padding: 16,
    borderRadius: 16,
  },
  metricCardFull: {
    padding: 16,
    borderRadius: 16,
  },
  metricHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  metricTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.onSurfaceVariant,
    marginLeft: 6,
    letterSpacing: 0.6,
  },
  metricValue: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.primaryContainer,
    marginTop: 2,
  },
  metricSub: {
    fontSize: 12,
    color: colors.outline,
    marginTop: 2,
    fontWeight: '500',
  },
  proceedBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.secondaryContainer,
    height: 56,
    borderRadius: 16,
    shadowColor: '#D47E19',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 8,
    elevation: 6,
  },
  proceedBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.primaryContainer,
  },
  modalBody: {
    gap: 14,
    marginBottom: 20,
  },
  settingField: {
    gap: 6,
  },
  settingLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.onSurfaceVariant,
  },
  settingInput: {
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    paddingHorizontal: 14,
    height: 44,
    fontSize: 15,
    fontWeight: '600',
    color: colors.onSurface,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  cancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  cancelBtnText: {
    color: colors.outline,
    fontWeight: '700',
  },
  saveSettingsBtn: {
    backgroundColor: colors.primaryContainer,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
  },
  saveSettingsText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
