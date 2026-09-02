import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { neomorph } from '../theme/neomorph';
import { usePrimeStore } from '../store/primeStore';
import Header from '../components/Header';
import NeumorphicCard from '../components/NeumorphicCard';
import { formatCurrency } from '../utils/solarCalculations';
import { Quotation } from '../types';

export default function HomeScreen({ navigation }: any) {
  const quotations = usePrimeStore((state) => state.quotations);
  const deleteQuotation = usePrimeStore((state) => state.deleteQuotation);
  const loadState = usePrimeStore((state) => state.loadState);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadState();
  }, []);

  const filteredQuotes = quotations.filter((q) => {
    const term = searchQuery.toLowerCase();
    const customer = q.customer?.name?.toLowerCase() || '';
    const system = q.systemType?.toLowerCase() || '';
    const capacity = q.capacityKw?.toString() || '';
    return customer.includes(term) || system.includes(term) || capacity.includes(term);
  });

  const totalValue = quotations.reduce((sum, q) => sum + (q.grandTotal || 0), 0);

  const handleOpenQuote = (quote: Quotation) => {
    navigation.navigate('QuotationEditor', { quotationId: quote.id });
  };

  const handleLongPressQuote = (quote: Quotation) => {
    Alert.alert(
      'Quotation Options',
      `Manage quotation for ${quote.customer.name || 'Customer'}`,
      [
        {
          text: 'Edit / View',
          onPress: () => handleOpenQuote(quote),
        },
        {
          text: 'Duplicate',
          onPress: () => {
            const duplicated: Quotation = {
              ...quote,
              id: `quote_${Date.now()}`,
              quotationNumber: `PS-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
              customer: { ...quote.customer, name: `${quote.customer.name} (Copy)` },
              createdAt: Date.now(),
              updatedAt: Date.now(),
            };
            navigation.navigate('QuotationEditor', { quotation: duplicated });
          },
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            Alert.alert('Confirm Delete', 'Are you sure you want to delete this quotation?', [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Delete', style: 'destructive', onPress: () => deleteQuotation(quote.id) },
            ]);
          },
        },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header
        title="Prime Solar Quotations"
        rightAction={
          <TouchableOpacity
            style={styles.calcTriggerBtn}
            onPress={() => navigation.navigate('BillCalculator')}
            activeOpacity={0.8}
          >
            <Ionicons name="calculator" size={18} color={colors.secondaryContainer} style={{ marginRight: 4 }} />
            <Text style={styles.calcTriggerText}>Calculator</Text>
          </TouchableOpacity>
        }
      />

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Search Bar */}
        <View style={styles.searchWrapper}>
          <Ionicons name="search" size={18} color={colors.outline} style={{ marginRight: 8 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search customer, kW size, or date..."
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={18} color={colors.outline} />
            </TouchableOpacity>
          )}
        </View>

        {/* Overview Header & Quick Stats */}
        <View style={styles.overviewSection}>
          <View>
            <Text style={styles.sectionHeader}>OVERVIEW</Text>
            <Text style={styles.displayHeading}>Recent Quotations</Text>
          </View>
          <TouchableOpacity
            style={styles.newQuoteBtnDesktop}
            onPress={() => navigation.navigate('TemplatePicker')}
            activeOpacity={0.85}
          >
            <Ionicons name="add" size={18} color="#FFFFFF" style={{ marginRight: 4 }} />
            <Text style={styles.newQuoteBtnText}>New Quotation</Text>
          </TouchableOpacity>
        </View>

        {/* Quick Sizing Banner Card */}
        <TouchableOpacity
          style={styles.bannerCard}
          onPress={() => navigation.navigate('BillCalculator')}
          activeOpacity={0.88}
        >
          <View style={{ flex: 1 }}>
            <Text style={styles.bannerTitle}>Bill-to-kW Sizing Tool</Text>
            <Text style={styles.bannerSub}>
              Enter electricity bill amount in Rs. to instantly calculate recommended kW size & savings!
            </Text>
          </View>
          <View style={styles.bannerIconBox}>
            <Ionicons name="flash" size={24} color="#FFFFFF" />
          </View>
        </TouchableOpacity>

        {/* Total Pipeline Counter */}
        {quotations.length > 0 && (
          <View style={styles.statsRow}>
            <NeumorphicCard style={styles.statBox}>
              <Text style={styles.statLabel}>Total Quotes</Text>
              <Text style={styles.statValue}>{quotations.length}</Text>
            </NeumorphicCard>
            <NeumorphicCard style={styles.statBox}>
              <Text style={styles.statLabel}>Pipeline Value</Text>
              <Text style={[styles.statValue, { color: colors.secondaryContainer }]}>
                Rs. {formatCurrency(totalValue)}
              </Text>
            </NeumorphicCard>
          </View>
        )}

        {/* Quotations List */}
        {filteredQuotes.length > 0 ? (
          <View style={styles.quotesGrid}>
            {filteredQuotes.map((quote) => (
              <TouchableOpacity
                key={quote.id}
                onPress={() => handleOpenQuote(quote)}
                onLongPress={() => handleLongPressQuote(quote)}
                activeOpacity={0.85}
              >
                <NeumorphicCard style={styles.quoteCard}>
                  <View style={styles.quoteCardTop}>
                    <View style={{ flex: 1, paddingRight: 8 }}>
                      <Text style={styles.customerName} numberOfLines={1}>
                        {quote.customer?.name
                          ? quote.customer.name.toLowerCase().startsWith('mr')
                            ? `${quote.customer.name} sb`
                            : `Mr. ${quote.customer.name} sb`
                          : 'Valued Customer sb'}
                      </Text>
                      <Text style={styles.quoteNumber}>{quote.quotationNumber || 'PS-Quote'}</Text>
                    </View>
                    <View style={styles.dateBadge}>
                      <Text style={styles.dateText}>
                        {new Date(quote.createdAt).toLocaleDateString('en-GB', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.systemTypeRow}>
                    <Ionicons name="flash" size={18} color={colors.secondaryContainer} style={{ marginRight: 6 }} />
                    <Text style={styles.systemTypeText}>
                      {quote.capacityKw || '10'} kW{' '}
                      {quote.systemType === 'HYBRID'
                        ? 'Hybrid'
                        : quote.systemType === 'ON_GRID'
                        ? 'On-Grid'
                        : 'Off-Grid'}
                    </Text>
                  </View>

                  <View style={styles.cardDivider} />

                  <View style={styles.quoteCardBottom}>
                    <Text style={styles.totalLabel}>Total Value</Text>
                    <Text style={styles.totalValue}>Rs. {formatCurrency(quote.grandTotal)}</Text>
                  </View>
                </NeumorphicCard>
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <NeumorphicCard style={styles.emptyCard}>
            <Ionicons name="document-text-outline" size={48} color={colors.outline} />
            <Text style={styles.emptyTitle}>No Quotations Found</Text>
            <Text style={styles.emptySub}>
              {searchQuery
                ? 'Try a different search keyword'
                : 'Tap the + button below to create your first branded solar quotation!'}
            </Text>
            <TouchableOpacity
              style={styles.createFirstBtn}
              onPress={() => navigation.navigate('TemplatePicker')}
            >
              <Text style={styles.createFirstText}>+ Create New Quotation</Text>
            </TouchableOpacity>
          </NeumorphicCard>
        )}
      </ScrollView>

      {/* Floating Action Button (FAB) */}
      <TouchableOpacity
        style={[neomorph.fab, styles.fabPosition]}
        onPress={() => navigation.navigate('TemplatePicker')}
        activeOpacity={0.85}
      >
        <Ionicons name="add" size={32} color="#FFFFFF" />
      </TouchableOpacity>
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
    paddingBottom: 100,
    maxWidth: 640,
    width: '100%',
    alignSelf: 'center',
  },
  calcTriggerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E6E9EE',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  calcTriggerText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primaryContainer,
  },
  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E6E9EE',
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 48,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: colors.onSurface,
    fontWeight: '500',
  },
  overviewSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
    flexWrap: 'wrap',
    gap: 8,
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.onSurfaceVariant,
    letterSpacing: 1.2,
  },
  displayHeading: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.primaryContainer,
    marginTop: 2,
  },
  newQuoteBtnDesktop: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.secondaryContainer,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: '#D47E19',
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 4,
  },
  newQuoteBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  bannerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryContainer,
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#0B2A4A',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 5,
  },
  bannerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  bannerSub: {
    fontSize: 12,
    color: '#CBD5E1',
    lineHeight: 16,
  },
  bannerIconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.secondaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  statBox: {
    flex: 1,
    padding: 14,
    borderRadius: 16,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.onSurfaceVariant,
    textTransform: 'uppercase',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.primaryContainer,
    marginTop: 4,
  },
  quotesGrid: {
    gap: 14,
  },
  quoteCard: {
    padding: 16,
    borderRadius: 18,
  },
  quoteCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  customerName: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.primaryContainer,
  },
  quoteNumber: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.outline,
    marginTop: 2,
  },
  dateBadge: {
    backgroundColor: '#E6E9EE',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  dateText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.onSurfaceVariant,
  },
  systemTypeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  systemTypeText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.onSurfaceVariant,
  },
  cardDivider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 12,
  },
  quoteCardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 13,
    color: colors.outline,
    fontWeight: '600',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '900',
    color: colors.primaryContainer,
  },
  emptyCard: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.primaryContainer,
    marginTop: 12,
  },
  emptySub: {
    fontSize: 13,
    color: colors.outline,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
    paddingHorizontal: 20,
  },
  createFirstBtn: {
    marginTop: 16,
    backgroundColor: colors.primaryContainer,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 12,
  },
  createFirstText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  fabPosition: {
    position: 'absolute',
    bottom: 24,
    right: 20,
  },
});
