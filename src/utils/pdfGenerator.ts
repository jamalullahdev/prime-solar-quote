import * as Print from 'expo-print';
import { Platform } from 'react-native';
import { Quotation, BatteryOption, ProductionData } from '../types';
import { formatCurrency, calculateProductionData } from './solarCalculations';
import { LOGO_BASE64 } from '../assets/logoBase64';

export function generateQuotationHTML(
  quotation: Quotation,
  selectedBattery?: BatteryOption | null
): string {
  const customerName = quotation.customer.name || 'Valued Customer';
  const customerAddress = quotation.customer.address
    ? ` (${quotation.customer.address}${quotation.customer.city ? ', ' + quotation.customer.city : ''})`
    : quotation.customer.city
    ? ` (${quotation.customer.city})`
    : '';

  const customerTitle = customerName.toLowerCase().startsWith('mr')
    ? `${customerName} sb${customerAddress}`
    : `Mr. ${customerName} sb${customerAddress}`;

  const systemTypeLabel =
    quotation.systemType === 'HYBRID'
      ? 'Hybrid'
      : quotation.systemType === 'ON_GRID'
      ? 'On-Grid'
      : 'Off-Grid';

  const isGrandHybrid =
    quotation.formatKind === 'GRAND_HYBRID' ||
    quotation.lineItems.length > 10 ||
    quotation.templateId.includes('grand');

  const isSimpleHybrid =
    quotation.formatKind === 'SIMPLE_HYBRID' ||
    (!isGrandHybrid && quotation.systemType === 'HYBRID');

  const combinedTotal = selectedBattery
    ? quotation.grandTotal + selectedBattery.rate
    : quotation.grandTotal;

  // Calculate live Production Data
  const prodData: ProductionData =
    quotation.productionData ||
    calculateProductionData(
      quotation.panelCount || 0,
      parseFloat(quotation.panelWattage) || 625,
      parseFloat(quotation.capacityKw) || 10,
      isGrandHybrid ? quotation.grandTotal : combinedTotal
    );

  const capacityKwUpper = (quotation.capacityKw || '10').toUpperCase().replace('KW', '');

  // Helper to render table rows
  const renderRow = (item: any, idx: number) => `
    <tr>
      <td style="text-align: center; padding: 6px 4px; border: 1px solid #000; font-size: 11px;">${
        item.srNo < 10 ? '0' + item.srNo : item.srNo || idx + 1
      }</td>
      <td style="text-align: left; padding: 6px 7px; border: 1px solid #000; font-size: 11px; font-weight: 600;">${
        item.description || ''
      }</td>
      <td style="text-align: center; padding: 6px 4px; border: 1px solid #000; font-size: 11px;">${
        item.qty || ''
      }</td>
      <td style="text-align: center; padding: 6px 4px; border: 1px solid #000; font-size: 11px;">${
        item.rate ? formatCurrency(item.rate) : ''
      }</td>
      <td style="text-align: center; padding: 6px 5px; border: 1px solid #000; font-size: 11px; font-weight: bold;">${
        item.total ? formatCurrency(item.total) : ''
      }</td>
      <td style="text-align: left; padding: 6px 7px; border: 1px solid #000; font-size: 10.5px;">${
        item.remarks || ''
      }</td>
    </tr>
  `;

  // Production Data Table HTML
  const productionTableHtml = `
    <div class="section-header-p2" style="margin-top: 5mm; margin-bottom: 2mm;">
      ${capacityKwUpper}KW SYSTEM PRODUCTION DATA:
    </div>
    <table class="production-table">
      <tbody>
        <tr>
          <td class="prod-cell-label">Daily Production</td>
          <td class="prod-cell-val">${prodData.dailyUnitsText}</td>
        </tr>
        <tr>
          <td class="prod-cell-label">Monthly Production</td>
          <td class="prod-cell-val">${prodData.monthlyUnitsText}</td>
        </tr>
        <tr>
          <td class="prod-cell-label">Monthly Savings</td>
          <td class="prod-cell-val">${prodData.monthlySavingsText}</td>
        </tr>
        <tr>
          <td class="prod-cell-label">Return of Investment (ROI)</td>
          <td class="prod-cell-val">${prodData.roiMonthsText}</td>
        </tr>
      </tbody>
    </table>
  `;

  // Battery options mini-table HTML (Simple Hybrid Page 2)
  const batteryTableRowsHtml = (quotation.batteryOptions || [])
    .map((b) => {
      const specs = `${b.ampHours ? b.ampHours + ' ' : ''}${b.voltage || '51.2V'}`;
      const desc = b.brand.toLowerCase().includes('battery')
        ? b.brand
        : `${b.brand} ${b.capacityKwh} kWh Lithium Battery ${specs}`;
      return `
      <tr>
        <td style="text-align: left; padding: 6px 8px; border: 1px solid #000; font-size: 11px; font-weight: 600;">${desc}</td>
        <td style="text-align: center; padding: 6px 8px; border: 1px solid #000; font-size: 11px; font-weight: bold;">${formatCurrency(
          b.rate
        )}</td>
        <td style="text-align: left; padding: 6px 8px; border: 1px solid #000; font-size: 11px;">${
          b.warranty || '5 Years Official Warranty'
        }</td>
      </tr>
    `;
    })
    .join('');

  // Mode of Payment Block
  const paymentTermsHtml = `
    <div class="section-header-p2">${isGrandHybrid ? 'SCHEDULE OF PAYMENT:' : 'MODE OF PAYMENT:'}</div>
    <ul class="bullet-list">
      <li><strong>${quotation.paymentTerms?.advancePercent || 70}% Advance:</strong> Upon confirmation of order and procurement kickoff.</li>
      <li><strong>${quotation.paymentTerms?.onDumpingPercent || 20}% Upon Material Dumping:</strong> Upon delivery of primary equipment (Panels, Inverter, Structure) at site.</li>
      <li><strong>${quotation.paymentTerms?.onCompletionPercent || 10}% Upon Completion:</strong> Upon successful installation, testing, and handover of system.</li>
    </ul>
  `;

  // Handle multi-page vs single page table splitting
  let page1RowsHtml = '';
  let page2RowsHtml = '';
  const totalItems = quotation.lineItems.length;

  if (isGrandHybrid && totalItems > 10) {
    page1RowsHtml = quotation.lineItems.slice(0, 10).map(renderRow).join('');
    page2RowsHtml = quotation.lineItems.slice(10).map(renderRow).join('');
  } else {
    page1RowsHtml = quotation.lineItems.map(renderRow).join('');
  }

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8" />
      <style>
        @page {
          size: A4;
          margin: 0;
        }
        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
          font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
        }
        body {
          background-color: #ffffff;
          color: #1a1a1a;
          -webkit-print-color-adjust: exact;
        }
        .page-container {
          width: 210mm;
          min-height: 297mm;
          padding: 8mm;
          position: relative;
          page-break-after: always;
          background: #ffffff;
          margin: 0 auto;
        }
        .page-frame {
          width: 100%;
          min-height: 280mm;
          border: 1.5px solid #000000;
          padding: 6mm 7mm;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          position: relative;
          overflow: hidden;
        }
        /* Centered Watermark Background Logo (Prominent 0.09 Opacity) */
        .watermark-bg {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 390px;
          opacity: 0.09;
          pointer-events: none;
          z-index: 0;
        }
        .content-layer {
          position: relative;
          z-index: 1;
        }
        /* Top Header Block */
        .header-block {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2mm;
        }
        .logo-container {
          display: flex;
          align-items: center;
        }
        .logo-img {
          height: 72px;
          max-width: 220px;
          object-fit: contain;
        }
        .company-contacts {
          text-align: right;
          font-size: 8.5px;
          line-height: 1.45;
          font-weight: 700;
          color: #1A1A1A;
        }
        .company-contacts .link {
          color: #1E6FD9;
          text-decoration: none;
        }
        /* Two-tone Signature Divider Bar */
        .two-tone-bar {
          width: 100%;
          height: 5.5px;
          display: flex;
          margin-bottom: 4mm;
        }
        .two-tone-navy {
          width: 70%;
          height: 100%;
          background-color: #0B2A4A;
        }
        .two-tone-orange {
          width: 30%;
          height: 100%;
          background-color: #F5921E;
        }
        /* Title Block */
        .title-block {
          text-align: center;
          margin-bottom: 3.5mm;
        }
        .title-main {
          font-size: 16px;
          font-weight: 900;
          letter-spacing: 1.5px;
          text-transform: uppercase;
          color: #000000;
          margin-bottom: 2px;
        }
        .title-customer {
          font-size: 13px;
          font-weight: 700;
          color: #1a1a1a;
          margin-bottom: 2px;
        }
        .title-system {
          font-size: 13px;
          font-weight: 700;
          color: #0B2A4A;
        }
        /* Quotation Line Items Table */
        table.quotation-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 2mm;
        }
        table.quotation-table th {
          border: 1px solid #000000;
          padding: 6.5px 5px;
          font-size: 11px;
          font-weight: 800;
          text-align: center;
          background-color: #ffffff;
        }
        /* Total Row */
        .total-row td {
          border: 1px solid #000000;
          padding: 6.5px 5px;
          font-size: 12px;
          font-weight: 900;
        }
        .highlighted-battery-line {
          font-size: 12px;
          font-weight: 800;
          margin-top: 3.5mm;
          margin-bottom: 2mm;
          color: #000000;
        }
        .highlight-yellow {
          background-color: #FFF200;
          padding: 2px 7px;
          border-radius: 2px;
        }
        /* Page 2 Sections */
        .section-header-p2 {
          font-size: 12.5px;
          font-weight: 900;
          text-transform: uppercase;
          color: #000000;
          margin-top: 3.5mm;
          margin-bottom: 2mm;
          border-bottom: 1px solid #CBD5E1;
          padding-bottom: 2px;
        }
        .bullet-list {
          list-style-type: disc;
          padding-left: 20px;
          margin-bottom: 3.5mm;
          font-size: 11px;
          line-height: 1.6;
        }
        .bullet-list li {
          margin-bottom: 3px;
        }
        .bullet-list strong {
          color: #0B2A4A;
        }
        /* Production Data Table */
        table.production-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 3mm;
        }
        table.production-table td {
          border: 1px solid #000000;
          padding: 6.5px 9px;
          font-size: 11px;
        }
        .prod-cell-label {
          width: 48%;
          font-weight: 700;
          color: #000000;
        }
        .prod-cell-val {
          width: 52%;
          color: #000000;
          font-weight: 500;
        }
        .footer-spacer {
          margin-top: auto;
        }
      </style>
    </head>
    <body>
      <!-- ================= PAGE 1 ================= -->
      <div class="page-container">
        <div class="page-frame">
          <!-- Big Centered Watermark Emblem Logo -->
          <img src="${LOGO_BASE64}" class="watermark-bg" alt="" />

          <div class="content-layer">
            <!-- Header Block -->
            <div class="header-block">
              <div class="logo-container">
                <img src="${LOGO_BASE64}" class="logo-img" alt="Prime Solar Energy" />
              </div>
              <div class="company-contacts">
                <div>Office 07, Alpha Avenue,</div>
                <div>DHA Bahawalpur.</div>
                <div>☎ +92 301 0333 822</div>
                <div>☎ +92 301 8962 414</div>
                <div>✉ <span class="link">info@primesolarenergy.org</span></div>
                <div>🌐 <span class="link">www.primesolarenergy.org</span></div>
              </div>
            </div>

            <!-- Two Tone Bar -->
            <div class="two-tone-bar">
              <div class="two-tone-navy"></div>
              <div class="two-tone-orange"></div>
            </div>

            <!-- Title Block -->
            <div class="title-block">
              <div class="title-main">QUOTATION</div>
              <div class="title-customer">${customerTitle}</div>
              <div class="title-system">${quotation.capacityKw} kW ${systemTypeLabel} Solar System</div>
            </div>

            <!-- Line Items Grid Table (Page 1) -->
            <table class="quotation-table">
              <thead>
                <tr>
                  <th style="width: 6%;">Sr.</th>
                  <th style="width: 38%; text-align: left; padding-left: 7px;">Description</th>
                  <th style="width: 10%;">Qty</th>
                  <th style="width: 14%;">Rate</th>
                  <th style="width: 15%;">Total</th>
                  <th style="width: 17%; text-align: left; padding-left: 7px;">Remarks</th>
                </tr>
              </thead>
              <tbody>
                ${page1RowsHtml}
                ${
                  !isGrandHybrid || totalItems <= 10
                    ? `
                  <tr class="total-row">
                    <td colspan="4" style="text-align: center; font-size: 12px; font-weight: 900;">Total</td>
                    <td style="text-align: center; font-size: 12px; font-weight: 900; color: #0B2A4A;">${formatCurrency(
                      quotation.grandTotal
                    )}</td>
                    <td style="text-align: center; font-size: 9.5px; line-height: 1.2;">
                      <strong>Valid Till</strong><br/>
                      <span>${quotation.validTill || '25/09/2026'}</span>
                    </td>
                  </tr>
                `
                    : ''
                }
              </tbody>
            </table>

            ${
              isSimpleHybrid && selectedBattery
                ? `
              <div class="highlighted-battery-line">
                Total Quotation with ${selectedBattery.brand} ${
                    selectedBattery.capacityKwh ? selectedBattery.capacityKwh + ' kWh ' : ''
                  }Lithium Battery: 
                <span class="highlight-yellow">Rs. ${formatCurrency(combinedTotal)}</span>
              </div>
            `
                : ''
            }

            ${
              !isGrandHybrid && quotation.systemType === 'ON_GRID' && totalItems <= 10
                ? `
              ${paymentTermsHtml}
              ${productionTableHtml}
            `
                : ''
            }
          </div>

          <!-- Footer Bar -->
          <div class="footer-spacer content-layer">
            <div class="two-tone-bar" style="margin-bottom: 0;">
              <div class="two-tone-navy"></div>
              <div class="two-tone-orange"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- ================= PAGE 2 (For Hybrid or Multi-page Quotes) ================= -->
      ${
        isGrandHybrid || isSimpleHybrid || totalItems > 10
          ? `
      <div class="page-container">
        <div class="page-frame">
          <!-- Big Centered Watermark Emblem Logo -->
          <img src="${LOGO_BASE64}" class="watermark-bg" alt="" />

          <div class="content-layer">
            <!-- Header Block -->
            <div class="header-block">
              <div class="logo-container">
                <img src="${LOGO_BASE64}" class="logo-img" alt="Prime Solar Energy" />
              </div>
              <div class="company-contacts">
                <div>Office 07, Alpha Avenue,</div>
                <div>DHA Bahawalpur.</div>
                <div>☎ +92 301 0333 822</div>
                <div>☎ +92 301 8962 414</div>
                <div>✉ <span class="link">info@primesolarenergy.org</span></div>
                <div>🌐 <span class="link">www.primesolarenergy.org</span></div>
              </div>
            </div>

            <!-- Two Tone Bar -->
            <div class="two-tone-bar">
              <div class="two-tone-navy"></div>
              <div class="two-tone-orange"></div>
            </div>

            ${
              isGrandHybrid && totalItems > 10
                ? `
              <!-- Continuation Table on Page 2 -->
              <table class="quotation-table">
                <tbody>
                  ${page2RowsHtml}
                  <tr class="total-row">
                    <td colspan="4" style="text-align: center; font-size: 12px; font-weight: 900;">Total</td>
                    <td style="text-align: center; font-size: 12px; font-weight: 900; color: #0B2A4A;">${formatCurrency(
                      quotation.grandTotal
                    )}</td>
                    <td style="text-align: center; font-size: 9.5px; line-height: 1.2;">
                      <strong>Valid Till</strong><br/>
                      <span>${quotation.validTill || '25/09/2026'}</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            `
                : ''
            }

            ${
              isSimpleHybrid && quotation.batteryOptions && quotation.batteryOptions.length > 0
                ? `
              <!-- Additional Rates for Simple Hybrid (Page 2) -->
              <div class="section-header-p2">ADDITIONAL RATES (LITHIUM-ION BATTERIES):</div>
              <table class="quotation-table" style="margin-top: 1.5mm; margin-bottom: 3.5mm;">
                <thead>
                  <tr>
                    <th style="width: 50%; text-align: left; padding-left: 8px;">Description</th>
                    <th style="width: 25%;">Rate (Rs)</th>
                    <th style="width: 25%; text-align: left; padding-left: 8px;">Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  ${batteryTableRowsHtml}
                </tbody>
              </table>
            `
                : ''
            }

            <!-- Mode / Schedule of Payment -->
            ${paymentTermsHtml}

            <!-- Universal Production Data Table -->
            ${productionTableHtml}
          </div>

          <!-- Footer Bar -->
          <div class="footer-spacer content-layer">
            <div class="two-tone-bar" style="margin-bottom: 0;">
              <div class="two-tone-navy"></div>
              <div class="two-tone-orange"></div>
            </div>
          </div>
        </div>
      </div>
      `
          : ''
      }
    </body>
    </html>
  `;
}

export async function generateQuotationPDF(
  quotation: Quotation,
  selectedBattery?: BatteryOption | null
): Promise<string> {
  const htmlContent = generateQuotationHTML(quotation, selectedBattery);

  if (Platform.OS === 'web') {
    return '';
  }

  const { uri } = await Print.printToFileAsync({
    html: htmlContent,
    width: 595,
    height: 842,
  });

  return uri;
}
