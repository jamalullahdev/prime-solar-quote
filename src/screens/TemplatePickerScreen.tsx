import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  AlertButton,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { usePrimeStore } from '../store/primeStore';
import Header from '../components/Header';
import NeumorphicCard from '../components/NeumorphicCard';
import { TemplateDefinition } from '../types';

export default function TemplatePickerScreen({ route, navigation }: any) {
  const templates = usePrimeStore((state) => state.templates);
  const deleteTemplate = usePrimeStore((state) => state.deleteTemplate);

  const prefillKw = route?.params?.prefillKw || '10';
  const prefillRoi = route?.params?.prefillRoi;
  const prefillPanels = route?.params?.prefillPanels;

  const handleSelectTemplate = (template: TemplateDefinition) => {
    navigation.navigate('QuotationEditor', {
      templateId: template.id,
      prefillKw,
      prefillRoi,
      prefillPanels,
    });
  };

  const handleDeleteCustomTemplate = (tmpl: TemplateDefinition) => {
    if (Platform.OS === 'web') {
      if (window.confirm(`Are you sure you want to delete custom format "${tmpl.name}"?`)) {
        deleteTemplate(tmpl.id);
      }
    } else {
      Alert.alert('Confirm Delete', `Delete custom format "${tmpl.name}"?`, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => deleteTemplate(tmpl.id) },
      ]);
    }
  };

  const handleLongPress = (template: TemplateDefinition) => {
    const options: AlertButton[] = [
      {
        text: 'Duplicate Format',
        onPress: () => {
          navigation.navigate('TemplateBuilder', { duplicateTemplateId: template.id });
        },
      },
    ];

    if (!template.isBuiltIn) {
      options.push(
        {
          text: 'Edit Format',
          onPress: () => {
            navigation.navigate('TemplateBuilder', { editTemplateId: template.id });
          },
        },
        {
          text: 'Delete Format',
          style: 'destructive',
          onPress: () => {
            Alert.alert('Confirm Delete', `Delete custom format "${template.name}"?`, [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Delete', style: 'destructive', onPress: () => deleteTemplate(template.id) },
            ]);
          },
        }
      );
    }

    options.push({ text: 'Cancel', style: 'cancel' });

    Alert.alert(template.name, 'Choose action for this quotation format', options);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header
        title="Select Quotation Format"
        showBack
        onBack={() => navigation.goBack()}
      />

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <Text style={styles.subtitle}>
          Choose a quotation template. Quotations are template-driven—you can also create and save your own formats!
        </Text>

        {/* Pinned: Create New Format Card */}
        <TouchableOpacity
          onPress={() => navigation.navigate('TemplateBuilder')}
          activeOpacity={0.85}
        >
          <NeumorphicCard style={styles.createFormatCard}>
            <View style={styles.createFormatIcon}>
              <Ionicons name="add" size={28} color="#FFFFFF" />
            </View>
            <View style={{ flex: 1, marginLeft: 14 }}>
              <Text style={styles.createFormatTitle}>+ Create New Format</Text>
              <Text style={styles.createFormatSub}>
                Build a customized quotation format with your own columns, sections, and default line items
              </Text>
            </View>
          </NeumorphicCard>
        </TouchableOpacity>

        {/* Templates List */}
        <View style={styles.templatesGrid}>
          {templates.map((tmpl) => (
            <TouchableOpacity
              key={tmpl.id}
              onPress={() => handleSelectTemplate(tmpl)}
              onLongPress={() => handleLongPress(tmpl)}
              activeOpacity={0.85}
            >
              <NeumorphicCard style={styles.templateCard}>
                <View style={styles.cardHeader}>
                  <View style={{ flex: 1, paddingRight: 8 }}>
                    <View style={styles.titleBadgeRow}>
                      <Text style={styles.templateTitle}>{tmpl.name}</Text>
                      {!tmpl.isBuiltIn && (
                        <View style={styles.customBadge}>
                          <Text style={styles.customBadgeText}>Custom</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.templateDesc} numberOfLines={2}>
                      {tmpl.description || 'Custom quotation template'}
                    </Text>
                  </View>

                  {!tmpl.isBuiltIn && (
                    <View style={styles.cardActionGroup}>
                      <TouchableOpacity
                        style={styles.cardIconBtn}
                        onPress={() => navigation.navigate('TemplateBuilder', { editTemplateId: tmpl.id })}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <Ionicons name="pencil" size={16} color={colors.primaryContainer} />
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[styles.cardIconBtn, { backgroundColor: '#FEE2E2', borderColor: '#FECACA' }]}
                        onPress={() => handleDeleteCustomTemplate(tmpl)}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <Ionicons name="trash-outline" size={16} color={colors.error} />
                      </TouchableOpacity>
                    </View>
                  )}
                </View>

                <View style={styles.cardFooter}>
                  <View style={styles.tagGroup}>
                    <View style={styles.tag}>
                      <Text style={styles.tagText}>
                        {tmpl.systemTypeDefault || 'HYBRID'}
                      </Text>
                    </View>
                    <View style={styles.tag}>
                      <Text style={styles.tagText}>
                        {tmpl.defaultLineItems?.length || 0} Items
                      </Text>
                    </View>
                    {tmpl.hasBatterySection && (
                      <View style={[styles.tag, { backgroundColor: '#FEF3C7' }]}>
                        <Text style={[styles.tagText, { color: '#92400E' }]}>+ Battery</Text>
                      </View>
                    )}
                  </View>

                  <View style={styles.selectBtn}>
                    <Text style={styles.selectBtnText}>Select</Text>
                    <Ionicons name="chevron-forward" size={16} color={colors.primaryContainer} />
                  </View>
                </View>
              </NeumorphicCard>
            </TouchableOpacity>
          ))}
        </View>
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
    maxWidth: 640,
    width: '100%',
    alignSelf: 'center',
  },
  subtitle: {
    fontSize: 13,
    color: colors.outline,
    lineHeight: 18,
    marginBottom: 16,
  },
  createFormatCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
    borderRadius: 18,
    marginBottom: 18,
    borderWidth: 1.5,
    borderColor: colors.secondaryContainer,
  },
  createFormatIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.secondaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#D47E19',
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 4,
  },
  createFormatTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.primaryContainer,
  },
  createFormatSub: {
    fontSize: 12,
    color: colors.outline,
    marginTop: 2,
    lineHeight: 16,
  },
  templatesGrid: {
    gap: 14,
  },
  templateCard: {
    padding: 16,
    borderRadius: 18,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  titleBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  templateTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.primaryContainer,
  },
  customBadge: {
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  customBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1D4ED8',
  },
  templateDesc: {
    fontSize: 12,
    color: colors.onSurfaceVariant,
    marginTop: 4,
    lineHeight: 17,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingTop: 12,
  },
  tagGroup: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
  },
  tag: {
    backgroundColor: '#E6E9EE',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  tagText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.onSurfaceVariant,
  },
  selectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.primaryContainer,
    marginRight: 2,
  },
  cardActionGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  cardIconBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
});
