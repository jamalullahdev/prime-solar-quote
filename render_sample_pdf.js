const fs = require('fs');
const path = require('path');

// Read logo image as base64
const logoPath = path.join(__dirname, 'assets', 'logo.png');
const logoBuffer = fs.readFileSync(logoPath);
const LOGO_BASE64 = `data:image/png;base64,${logoBuffer.toString('base64')}`;

function formatCurrency(amount) {
  if (amount === null || amount === undefined || isNaN(amount)) return '0';
  return Math.round(amount).toLocaleString('en-US');
}

function calculateProductionData(panelCount, panelWattage = 625, capacityKwFallback = 10, grandTotal = 0) {
  const totalWattage = panelCount > 0 && panelWattage > 0 ? panelCount * panelWattage : capacityKwFallback * 1000;
  const panelKw = totalWattage / 1000;
  const dailyUnits = Math.round(panelKw * 5);
  const monthlyUnits = Math.round(dailyUnits * 30);
  const monthlySavings = Math.round(monthlyUnits * 65);

  const lowSavings = Math.round(monthlySavings * 0.98);
  const highSavings = Math.round(monthlySavings * 1.025);

  const paybackMonths = monthlySavings > 0 && grandTotal > 0 ? Math.round(grandTotal / monthlySavings) : 18;
  const lowPayback = Math.max(10, Math.round(paybackMonths * 0.9));
  const highPayback = Math.max(lowPayback + 2, Math.round(paybackMonths * 1.05));

  return {
    dailyUnitsText: `${dailyUnits} units approx.`,
    monthlyUnitsText: `${monthlyUnits.toLocaleString('en-US')} units approx.`,
    monthlySavingsText: `Rs ${formatCurrency(lowSavings)} – ${formatCurrency(highSavings)}`,
    roiMonthsText: `${lowPayback} – ${highPayback} months`,
  };
}

function generateHTML(quotation) {
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

  const totalItems = quotation.lineItems.length;
  const isMultiPage = totalItems > 10;

  const prodData = calculateProductionData(
    quotation.panelCount || 0,
    parseFloat(quotation.panelWattage) || 625,
    parseFloat(quotation.capacityKw) || 10,
    quotation.grandTotal
  );

  const capacityKwUpper = (quotation.capacityKw || '10').toUpperCase().replace('KW', '');

  const renderRow = (item, idx) => `
    <tr>
      <td style="text-align: center; padding: 8px 5px; border: 1px solid #000000; font-size: 14px; font-weight: 500;">${
        item.srNo < 10 ? '0' + item.srNo : item.srNo || idx + 1
      }</td>
      <td style="text-align: left; padding: 8px 10px; border: 1px solid #000000; font-size: 14px; font-weight: 400; line-height: 1.4; color: #000000;">${
        item.description || ''
      }</td>
      <td style="text-align: center; padding: 8px 5px; border: 1px solid #000000; font-size: 14px; font-weight: 500;">${
        item.qty || ''
      }</td>
      <td style="text-align: center; padding: 8px 5px; border: 1px solid #000000; font-size: 14px; font-weight: 500;">${
        item.rate ? formatCurrency(item.rate) : ''
      }</td>
      <td style="text-align: center; padding: 8px 6px; border: 1px solid #000000; font-size: 14px; font-weight: bold; color: #000000;">${
        item.total ? formatCurrency(item.total) : ''
      }</td>
      <td style="text-align: left; padding: 8px 8px; border: 1px solid #000000; font-size: 13.5px; font-weight: 400; line-height: 1.35; color: #000000;">${
        item.remarks || ''
      }</td>
    </tr>
  `;

  const productionTableHtml = `
    <div class="section-header-p2" style="margin-top: 5mm; margin-bottom: 2.5mm;">
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
          <td class="prod-cell-val" style="font-weight: bold; color: #0B2A4A;">${prodData.monthlySavingsText}</td>
        </tr>
        <tr>
          <td class="prod-cell-label">Return of Investment (ROI)</td>
          <td class="prod-cell-val">${prodData.roiMonthsText}</td>
        </tr>
      </tbody>
    </table>
  `;

  const paymentTermsHtml = `
    <div class="section-header-p2" style="margin-top: 4mm; margin-bottom: 2.5mm;">MODE OF PAYMENT:</div>
    <ul class="bullet-list">
      <li><strong>${quotation.paymentTerms?.advancePercent || 70}% Advance:</strong> Upon confirmation of order and procurement kickoff.</li>
      <li><strong>${quotation.paymentTerms?.onDumpingPercent || 20}% Upon Material Dumping:</strong> Upon delivery of primary equipment (Panels, Inverter, Structure) at site.</li>
      <li><strong>${quotation.paymentTerms?.onCompletionPercent || 10}% Upon Completion:</strong> Upon successful installation, testing, and handover of system.</li>
    </ul>
  `;

  const totalRowHtml = `
    <tr class="total-row">
      <td colspan="4" style="text-align: center; font-size: 15px; font-weight: bold; letter-spacing: 0.5px;">Total</td>
      <td style="text-align: center; font-size: 15px; font-weight: bold; color: #0B2A4A;">${formatCurrency(
        quotation.grandTotal
      )}</td>
      <td style="text-align: center; font-size: 12px; line-height: 1.4;">
        <strong>Valid Till</strong><br/>
        <span>${quotation.validTill || '25/09/2026'}</span>
      </td>
    </tr>
  `;

  let page1RowsHtml = '';
  let page2RowsHtml = '';

  if (isMultiPage) {
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
      <title>Quotation - ${customerName}</title>
      <style>
        @page {
          size: A4;
          margin: 0;
        }
        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
          font-family: Arial, 'Segoe UI', Calibri, Helvetica, sans-serif;
        }
        body {
          background-color: #CBD5E1;
          color: #1a1a1a;
          padding: 24px 0;
          -webkit-print-color-adjust: exact;
        }
        .page-container {
          width: 210mm;
          min-height: 297mm;
          padding: 8mm;
          position: relative;
          page-break-after: always;
          background: #ffffff;
          margin: 0 auto 24px auto;
          box-shadow: 0 6px 18px rgba(0,0,0,0.18);
        }
        @media print {
          body {
            background-color: #ffffff;
            padding: 0;
          }
          .page-container {
            margin: 0 auto;
            box-shadow: none;
          }
        }
        .page-frame {
          width: 100%;
          min-height: 280mm;
          border: 1px solid #000000;
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
        /* Top Header Block - Spacious & High Resolution */
        .header-block {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 3mm;
        }
        .logo-container {
          display: flex;
          align-items: center;
        }
        .logo-img {
          height: 80px;
          max-width: 240px;
          object-fit: contain;
        }
        .company-contacts {
          text-align: right;
          font-size: 12px;
          line-height: 1.55;
          font-weight: bold;
          color: #000000;
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
          margin-bottom: 4mm;
        }
        .title-main {
          font-size: 19px;
          font-weight: bold;
          letter-spacing: 1.8px;
          text-transform: uppercase;
          color: #000000;
          margin-bottom: 3px;
        }
        .title-customer {
          font-size: 15px;
          font-weight: bold;
          color: #000000;
          margin-bottom: 3px;
        }
        .title-system {
          font-size: 15px;
          font-weight: bold;
          color: #0B2A4A;
        }
        /* Quotation Line Items Table - Clean 14px Typography */
        table.quotation-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 3mm;
        }
        table.quotation-table th {
          border: 1px solid #000000;
          padding: 8px 6px;
          font-size: 14px;
          font-weight: bold;
          text-align: center;
          background-color: #ffffff;
          color: #000000;
        }
        /* Total Row */
        .total-row td {
          border: 1px solid #000000;
          padding: 8.5px 6px;
          font-size: 15px;
          font-weight: bold;
        }
        /* Page 2 Sections */
        .section-header-p2 {
          font-size: 14.5px;
          font-weight: bold;
          text-transform: uppercase;
          color: #000000;
          border-bottom: 1px solid #CBD5E1;
          padding-bottom: 3px;
        }
        .bullet-list {
          list-style-type: disc;
          padding-left: 20px;
          margin-bottom: 4.5mm;
          font-size: 13px;
          line-height: 1.7;
        }
        .bullet-list li {
          margin-bottom: 4px;
        }
        .bullet-list strong {
          color: #0B2A4A;
        }
        /* Production Data Table */
        table.production-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 4mm;
        }
        table.production-table td {
          border: 1px solid #000000;
          padding: 8.5px 12px;
          font-size: 14px;
        }
        .prod-cell-label {
          width: 45%;
          font-weight: bold;
          color: #000000;
        }
        .prod-cell-val {
          width: 55%;
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
                  <th style="width: 38%; text-align: left; padding-left: 8px;">Description</th>
                  <th style="width: 10%;">Qty</th>
                  <th style="width: 14%;">Rate</th>
                  <th style="width: 15%;">Total</th>
                  <th style="width: 17%; text-align: left; padding-left: 8px;">Remarks</th>
                </tr>
              </thead>
              <tbody>
                ${page1RowsHtml}
                ${!isMultiPage ? totalRowHtml : ''}
              </tbody>
            </table>

            ${
              !isMultiPage
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

      <!-- ================= PAGE 2 (When Items > 10) ================= -->
      ${
        isMultiPage
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

            <!-- Continuation Table on Page 2 -->
            <table class="quotation-table">
              <thead>
                <tr>
                  <th style="width: 6%;">Sr.</th>
                  <th style="width: 38%; text-align: left; padding-left: 8px;">Description</th>
                  <th style="width: 10%;">Qty</th>
                  <th style="width: 14%;">Rate</th>
                  <th style="width: 15%;">Total</th>
                  <th style="width: 17%; text-align: left; padding-left: 8px;">Remarks</th>
                </tr>
              </thead>
              <tbody>
                ${page2RowsHtml}
                ${totalRowHtml}
              </tbody>
            </table>

            <!-- Mode of Payment -->
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

// Sample 1: 20kW Grand Hybrid (Mr. Masood style - 12 items including Item 12 Battery in main table)
const sampleGrand = {
  id: 'sample_grand',
  quotationNumber: 'PS-2026-002',
  customer: { name: 'Mr. Masood sb', address: '187, Falcon Complex, Lahore' },
  capacityKw: '20',
  systemType: 'HYBRID',
  formatKind: 'GRAND_HYBRID',
  panelWattage: '625W',
  panelCount: 32,
  validTill: '05/09/2026',
  grandTotal: 4255600,
  paymentTerms: { advancePercent: 70, onDumpingPercent: 20, onCompletionPercent: 10 },
  lineItems: [
    { srNo: 1, description: 'JA / Jinko 620/625 Watt N-Type Bifacial Mono Perc Half-Cut Technology Tier 1', qty: '32', rate: null, total: 860000, remarks: '15 Years Production Warranty' },
    { srNo: 2, description: 'Solis / GoodWe Hybrid Inverter LV 20 kW IP66 (3-Phase)', qty: '01', rate: null, total: 825000, remarks: '5 Years Official Warranty' },
    { srNo: 3, description: 'L3 Frames', qty: '11', rate: null, total: 114500, remarks: '14 Gauge GI' },
    { srNo: 4, description: 'Civil Work with Concrete Blocks', qty: '', rate: null, total: 58500, remarks: 'Concrete Footing of 1 cubic ft.' },
    { srNo: 5, description: 'DC Wire 4mm CopperGat / Newage / GM Cable 1000V XLPO', qty: '280 meters', rate: null, total: 93400, remarks: '' },
    { srNo: 6, description: 'AC Wire 16mm Single Core CopperGat / Newage / GM Cable 600V', qty: '120 meters', rate: null, total: 124700, remarks: '' },
    { srNo: 7, description: 'Transportation, Loading / Unloading Charges', qty: '', rate: null, total: 48500, remarks: 'From Office to Site' },
    { srNo: 8, description: 'Solar Cable Routing, Conduit & Protection Works, PVC Ducts/Trunking, Flexible Conduits, PVC Pipes, Fittings, Installation, Bends, Couplers Sockets, Saddles/Clamps, Nut Bolts, Cable Ties, Washers, Rowl Bolts 3” and Other Required Fixing Accessories', qty: '', rate: null, total: 48000, remarks: 'Proper Routing Segregation, Securing & Mechanical Protection of AC/DC Wires' },
    { srNo: 9, description: '4x 2-Pole DC Breakers 25/32A 1000V, Voltage Protection Device 2-Pole 63A 600V, MC4 Connectors IP66 1000V', qty: '', rate: null, total: 38500, remarks: 'Original CNC / Tomzn' },
    { srNo: 10, description: '1x 4-Pole AC Breakers MCB 63A 600V, 2x 4-Pole Change Over 63A, Metal Distribution Box, Cable Ties 10”', qty: '', rate: null, total: 54500, remarks: 'Original CNC / Tomzn' },
    { srNo: 11, description: 'Survey, Design, Panels Fixation, Installation, Commissioning, Mechanical & Electrical Work', qty: '', rate: null, total: 85000, remarks: '1 Year Free After-sale Services' },
    { srNo: 12, description: 'YJC 16 kWh Lithium Battery 314Ah 51.2V', qty: '03', rate: null, total: 1905000, remarks: '7 Years Official Warranty' },
  ],
};

// Sample 2: 10kW Simple Hybrid (LC Umar Farooq style - 11 items with Item 11 Battery in main table)
const sampleSimple = {
  id: 'sample_simple',
  quotationNumber: 'PS-2026-001',
  customer: { name: 'Mr. LC Umar Farooq sb' },
  capacityKw: '10',
  systemType: 'HYBRID',
  formatKind: 'SIMPLE_HYBRID',
  panelWattage: '625W',
  panelCount: 18,
  validTill: '14/08/2026',
  grandTotal: 1307875,
  paymentTerms: { advancePercent: 70, onDumpingPercent: 20, onCompletionPercent: 10 },
  lineItems: [
    { srNo: 1, description: 'JA 620/625 Watt N-Type Bifacial Mono Perc Half-Cut Technology Tier 1', qty: '18', rate: null, total: 466875, remarks: '15 Years Official Warranty' },
    { srNo: 2, description: 'Solis / GoodWe Hybrid Inverter 10 kW IP66', qty: '01', rate: null, total: 405000, remarks: '5 Years Official Warranty' },
    { srNo: 3, description: 'L2 Frames', qty: '09', rate: null, total: 40500, remarks: '14 Gauge Galvanized Iron' },
    { srNo: 4, description: 'Civil Work with Concrete Blocks', qty: '', rate: null, total: 16500, remarks: 'Concrete Footing of 1 cubic ft.' },
    { srNo: 5, description: 'DC Wire 4mm CopperGat / Newage Cable 1000V XLPO', qty: '140 meters', rate: null, total: 36400, remarks: '' },
    { srNo: 6, description: 'AC Wire 6mm Single Core Copper Cable', qty: '60 meters', rate: null, total: 23100, remarks: '' },
    { srNo: 7, description: 'Electrical & Mechanical Work, Panel Fixation, Labor Charges', qty: '', rate: null, total: 31500, remarks: '1 Year Free After-sale Services' },
    { srNo: 8, description: 'Transportation, Loading / Unloading Charges', qty: '', rate: null, total: 7500, remarks: 'From Office to Site' },
    { srNo: 9, description: 'PVC Ducting, Flexible Pipes, Conduits, PVC Pipes, Fittings, Installation, Bands, Sockets, Nut Bolts, Cable Ties, Washers, Rowl Bolts', qty: '', rate: null, total: 23700, remarks: 'GM / Turkplast' },
    { srNo: 10, description: 'Survey, Design, MC4 Connectors, AC/DC Breakers (CNC, Tomzn), Distribution Box, Voltage Protection Device, Change-Over 63A', qty: '', rate: null, total: 26800, remarks: '' },
    { srNo: 11, description: 'YJC 5 kWh Lithium Battery 100Ah 51.2V', qty: '01', rate: null, total: 230000, remarks: '5 Years Official Warranty' },
  ],
};

const grandHtml = generateHTML(sampleGrand);
const simpleHtml = generateHTML(sampleSimple);

fs.writeFileSync(path.join(__dirname, 'sample_20kW_grand_hybrid.html'), grandHtml, 'utf8');
fs.writeFileSync(path.join(__dirname, 'sample_10kW_simple_hybrid.html'), simpleHtml, 'utf8');

console.log('Successfully re-rendered sample_20kW_grand_hybrid.html and sample_10kW_simple_hybrid.html with unified table and larger text.');
