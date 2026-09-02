import * as Sharing from 'expo-sharing';
import { Linking, Alert, Platform } from 'react-native';
import { Quotation } from '../types';
import { formatCurrency } from './solarCalculations';

export async function shareQuotationWhatsApp(
  pdfUri: string,
  quotation: Quotation
): Promise<void> {
  const customerName = quotation.customer.name || 'Valued Customer';
  const capacity = quotation.capacityKw || '10';
  const systemType =
    quotation.systemType === 'HYBRID'
      ? 'Hybrid'
      : quotation.systemType === 'ON_GRID'
      ? 'On-Grid'
      : 'Off-Grid';
  const totalStr = formatCurrency(quotation.grandTotal);

  const pitchMessage = `*Assalam-o-Alaikum ${customerName} sb,*

Thank you for choosing *Prime Solar Energy (DHA Bahawalpur)*. 

Please find attached your customized *${capacity} kW ${systemType} Solar System Quotation*.

📊 *Quotation Summary:*
• System Size: *${capacity} kW (${quotation.panelCount || 18} Tier-1 Bifacial Panels)*
• Total Investment: *Rs. ${totalStr}*
• Estimated Monthly Savings: *${quotation.roi?.monthlySavingsPkr || 'Rs. 55,000 - 65,000'}*
• Estimated Payback: *${quotation.roi?.paybackPeriodMonths || '2.8 Years'}*

📍 *Prime Solar Energy*
Office 07, Alpha Avenue, DHA Bahawalpur
📞 +92 301 0333 822 | +92 301 8962 414
🌐 www.primesolarenergy.org`;

  try {
    const isSharingAvailable = await Sharing.isAvailableAsync();
    if (isSharingAvailable) {
      await Sharing.shareAsync(pdfUri, {
        mimeType: 'application/pdf',
        dialogTitle: `Share Quotation for ${customerName}`,
        UTI: 'com.adobe.pdf',
      });
    } else {
      Alert.alert('Notice', 'Sharing is not available on this device.');
    }
  } catch (err) {
    console.error('Error sharing PDF:', err);
    Alert.alert('Share Error', 'Could not open share dialog.');
  }
}

export async function shareViaSystem(pdfUri: string): Promise<void> {
  try {
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(pdfUri, {
        mimeType: 'application/pdf',
        dialogTitle: 'Export Prime Solar Quotation PDF',
      });
    }
  } catch (e) {
    Alert.alert('Notice', 'Could not open system export.');
  }
}
