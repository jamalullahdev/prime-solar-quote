export type SystemType = 'HYBRID' | 'ON_GRID' | 'OFF_GRID';

export type ColumnType = 'TEXT' | 'NUMBER' | 'CURRENCY' | 'AUTO_CALCULATED';

export interface TemplateColumn {
  key: string;
  label: string;
  type: ColumnType;
  order: number;
}

export interface LineItem {
  id: string;
  srNo: number;
  description: string;
  qty: string;
  rate: number | null;
  total: number | null;
  remarks: string;
  isEditableDescription?: boolean;
  locked?: boolean;
}

export interface BatteryOption {
  id: string;
  brand: string;
  capacityKwh: number;
  rate: number;
  warranty: string;
}

export interface PaymentTerms {
  advancePercent: number; // default 70
  onDumpingPercent: number; // default 20
  onCompletionPercent: number; // default 10
}

export interface ReturnOnInvestment {
  dailyProductionUnits: string; // e.g. "45 - 50 Units"
  monthlyProductionUnits: string; // e.g. "1,350 - 1,500 Units"
  monthlySavingsPkr: string; // e.g. "60,000 - 70,000"
  paybackPeriodMonths: string; // e.g. "24 - 30 Months (2.5 Years)"
}

export interface TemplateDefinition {
  id: string;
  name: string;
  description?: string;
  systemTypeDefault?: SystemType;
  columns: TemplateColumn[];
  defaultLineItems: LineItem[];
  hasBatterySection: boolean;
  hasPaymentTermsSection: boolean;
  hasRoiSection: boolean;
  isBuiltIn: boolean;
  createdAt: number;
}

export interface Customer {
  name: string; // Rendered as "Mr. <name> sb"
  phone?: string;
  address?: string;
  city?: string;
}

export interface Quotation {
  id: string;
  quotationNumber: string; // e.g. "PS-2026-084"
  templateId: string;
  templateName: string;
  customer: Customer;
  capacityKw: string; // e.g. "10", "15"
  systemType: SystemType;
  panelBrand: string;
  panelWattage: string;
  panelCount: number;
  inverterBrand: string;
  lineItems: LineItem[];
  batteryOptions: BatteryOption[];
  selectedBatteryId?: string;
  paymentTerms: PaymentTerms;
  roi: ReturnOnInvestment;
  validTill: string; // e.g. "25/09/2026"
  subtotal: number;
  taxRate: number; // default 0%
  taxAmount: number;
  grandTotal: number;
  notes?: string;
  createdAt: number;
  updatedAt: number;
}

export interface CalculatorSettings {
  ratePerUnitPkr: number; // default 45.0 Rs/unit
  unitsPerKwPerDay: number; // default 4.5 units/kW/day
  roundToNearestKw: number; // default 0.5 kW
  defaultPanelWattage: number; // default 585 W
}
