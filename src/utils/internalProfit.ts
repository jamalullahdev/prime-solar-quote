import { Quotation, LineItem } from '../types';
import { formatCurrency } from './solarCalculations';
import { LOGO_BASE64 } from '../assets/logoBase64';

export interface InternalProfitAnalytics {
  totalQuotedPrice: number;
  totalRealCost: number;
  netProfit: number;
  profitMarginPercent: number;
}

export function calculateQuotationProfit(quotation: Quotation): InternalProfitAnalytics {
  const totalQuotedPrice = quotation.grandTotal || 0;

  const totalRealCost = (quotation.lineItems || []).reduce((sum, item) => {
    if (item.costTotal !== null && item.costTotal !== undefined && !isNaN(item.costTotal)) {
      return sum + item.costTotal;
    }
    // If no cost is explicitly entered for this item, default cost is 0
    return sum;
  }, 0);

  const netProfit = totalQuotedPrice - totalRealCost;
  const profitMarginPercent =
    totalQuotedPrice > 0 ? Math.round((netProfit / totalQuotedPrice) * 1000) / 10 : 0;

  return {
    totalQuotedPrice,
    totalRealCost,
    netProfit,
    profitMarginPercent,
  };
}

export function generateInternalProfitHTML(quotation: Quotation): string {
  const analytics = calculateQuotationProfit(quotation);
  const customerName = quotation.customer.name || 'Valued Customer';
  const capacityKw = quotation.capacityKw || '10';

  const rowsHtml = (quotation.lineItems || [])
    .map((item: LineItem, idx: number) => {
      const quoted = item.total || 0;
      const cost = item.costTotal || 0;
      const itemProfit = quoted - cost;
      const itemMargin = quoted > 0 ? Math.round((itemProfit / quoted) * 100) : 0;

      return `
      <tr>
        <td style="text-align: center; padding: 8px 5px; border: 1px solid #CBD5E1; font-size: 13px; font-weight: bold;">
          ${item.srNo < 10 ? '0' + item.srNo : item.srNo || idx + 1}
        </td>
        <td style="text-align: left; padding: 8px 10px; border: 1px solid #CBD5E1; font-size: 13px;">
          <strong>${item.description || ''}</strong>
          ${item.remarks ? `<br/><span style="font-size: 11px; color: #64748B;">${item.remarks}</span>` : ''}
        </td>
        <td style="text-align: center; padding: 8px 5px; border: 1px solid #CBD5E1; font-size: 13px;">
          ${item.qty || '1'}
        </td>
        <td style="text-align: right; padding: 8px 10px; border: 1px solid #CBD5E1; font-size: 13px; font-weight: bold; color: #0F172A;">
          Rs. ${formatCurrency(quoted)}
        </td>
        <td style="text-align: right; padding: 8px 10px; border: 1px solid #CBD5E1; font-size: 13px; font-weight: bold; color: #DC2626; background-color: #FEF2F2;">
          Rs. ${formatCurrency(cost)}
        </td>
        <td style="text-align: right; padding: 8px 10px; border: 1px solid #CBD5E1; font-size: 13px; font-weight: bold; color: #059669; background-color: #ECFDF5;">
          Rs. ${formatCurrency(itemProfit)}
        </td>
        <td style="text-align: center; padding: 8px 6px; border: 1px solid #CBD5E1; font-size: 12px; font-weight: bold; color: #0284C7;">
          ${itemMargin}%
        </td>
      </tr>
    `;
    })
    .join('');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8" />
      <title>CONFIDENTIAL - Internal Profit Sheet - ${customerName}</title>
      <style>
        @page { size: A4; margin: 8mm; }
        * { box-sizing: border-box; margin: 0; padding: 0; font-family: Arial, sans-serif; }
        body { background-color: #F8FAFC; color: #0F172A; padding: 20px; }
        .sheet-container {
          background: #FFFFFF;
          border: 2px solid #DC2626;
          border-radius: 12px;
          padding: 24px;
          max-width: 900px;
          margin: 0 auto;
          position: relative;
        }
        .confidential-watermark {
          position: absolute;
          top: 45%;
          left: 50%;
          transform: translate(-50%, -50%) rotate(-30deg);
          font-size: 52px;
          font-weight: 900;
          color: rgba(220, 38, 38, 0.08);
          pointer-events: none;
          letter-spacing: 4px;
          text-align: center;
          white-space: nowrap;
        }
        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 2px solid #E2E8F0;
          padding-bottom: 14px;
          margin-bottom: 16px;
        }
        .confidential-badge {
          background-color: #FEE2E2;
          border: 1px solid #F87171;
          color: #B91C1C;
          font-size: 12px;
          font-weight: 800;
          padding: 4px 10px;
          border-radius: 6px;
          display: inline-block;
          margin-bottom: 6px;
          letter-spacing: 1px;
        }
        .title { font-size: 20px; font-weight: 800; color: #0F172A; }
        .meta { font-size: 13px; color: #64748B; margin-top: 4px; }
        .kpi-grid {
          display: flex;
          gap: 12px;
          margin-bottom: 20px;
        }
        .kpi-card {
          flex: 1;
          padding: 14px;
          border-radius: 10px;
          border: 1px solid #E2E8F0;
          background-color: #F8FAFC;
        }
        .kpi-label { font-size: 11px; font-weight: 700; color: #64748B; text-transform: uppercase; margin-bottom: 4px; }
        .kpi-val { font-size: 18px; font-weight: 900; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        th {
          background-color: #0B2A4A;
          color: #FFFFFF;
          font-size: 12px;
          font-weight: bold;
          padding: 8px 6px;
          border: 1px solid #0B2A4A;
          text-align: center;
        }
        .total-row td {
          border: 2px solid #0B2A4A;
          padding: 10px 8px;
          font-size: 14px;
          font-weight: 900;
        }
        .warning-footer {
          background-color: #FEF3C7;
          border: 1px solid #FDE68A;
          padding: 10px 14px;
          border-radius: 8px;
          font-size: 12px;
          color: #92400E;
          font-weight: 600;
          text-align: center;
        }
      </style>
    </head>
    <body>
      <div class="sheet-container">
        <div class="confidential-watermark">STRICTLY CONFIDENTIAL<br/>NOT FOR CUSTOMER</div>
        
        <div class="header">
          <div>
            <div class="confidential-badge">🔒 STRICTLY CONFIDENTIAL - INTERNAL ONLY</div>
            <div class="title">Cost & Net Profit Breakdown</div>
            <div class="meta">Customer: <strong>${customerName}</strong> | System: <strong>${capacityKw} kW Solar</strong> | Quote: <strong>${quotation.quotationNumber}</strong></div>
          </div>
          <div style="text-align: right;">
            <div style="font-size: 11px; color: #64748B;">Date: ${new Date().toLocaleDateString('en-GB')}</div>
            <div style="font-size: 12px; font-weight: bold; color: #0B2A4A;">Prime Solar Energy</div>
          </div>
        </div>

        <!-- 4 KPI Summary Cards -->
        <div class="kpi-grid">
          <div class="kpi-card" style="border-left: 4px solid #0B2A4A;">
            <div class="kpi-label">Quoted Revenue</div>
            <div class="kpi-val" style="color: #0B2A4A;">Rs. ${formatCurrency(analytics.totalQuotedPrice)}</div>
          </div>
          <div class="kpi-card" style="border-left: 4px solid #DC2626;">
            <div class="kpi-label">Total Real Cost</div>
            <div class="kpi-val" style="color: #DC2626;">Rs. ${formatCurrency(analytics.totalRealCost)}</div>
          </div>
          <div class="kpi-card" style="border-left: 4px solid #059669; background-color: #F0FDF4;">
            <div class="kpi-label">Estimated Net Profit</div>
            <div class="kpi-val" style="color: #059669;">Rs. ${formatCurrency(analytics.netProfit)}</div>
          </div>
          <div class="kpi-card" style="border-left: 4px solid #0284C7; background-color: #F0F9FF;">
            <div class="kpi-label">Profit Margin</div>
            <div class="kpi-val" style="color: #0284C7;">${analytics.profitMarginPercent}%</div>
          </div>
        </div>

        <!-- Itemized Breakdown Table -->
        <table>
          <thead>
            <tr>
              <th style="width: 5%;">Sr.</th>
              <th style="width: 38%; text-align: left; padding-left: 10px;">Item Description</th>
              <th style="width: 7%;">Qty</th>
              <th style="width: 14%; text-align: right;">Quoted (Rs)</th>
              <th style="width: 14%; text-align: right; background-color: #991B1B;">Real Cost (Rs)</th>
              <th style="width: 14%; text-align: right; background-color: #065F46;">Net Profit (Rs)</th>
              <th style="width: 8%;">Margin</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
            <tr class="total-row">
              <td colspan="3" style="text-align: center; background-color: #F1F5F9;">TOTALS</td>
              <td style="text-align: right; color: #0B2A4A; background-color: #F1F5F9;">Rs. ${formatCurrency(analytics.totalQuotedPrice)}</td>
              <td style="text-align: right; color: #DC2626; background-color: #FEF2F2;">Rs. ${formatCurrency(analytics.totalRealCost)}</td>
              <td style="text-align: right; color: #059669; background-color: #ECFDF5;">Rs. ${formatCurrency(analytics.netProfit)}</td>
              <td style="text-align: center; color: #0284C7; background-color: #F0F9FF;">${analytics.profitMarginPercent}%</td>
            </tr>
          </tbody>
        </table>

        <div class="warning-footer">
          ⚠️ WARNING: This document contains proprietary procurement rates and profit margins for Prime Solar Energy. Do NOT forward or share this sheet with customers.
        </div>
      </div>
    </body>
    </html>
  `;
}
