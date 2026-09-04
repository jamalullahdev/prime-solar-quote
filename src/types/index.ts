export type SystemType = 'HYBRID' | 'ON_GRID' | 'OFF_GRID';

export type FormatKind = 'SIMPLE_HYBRID' | 'GRAND_HYBRID' | 'ON_GRID' | 'CUSTOM';

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
  voltage?: string; // default "51.2V"
  ampHours?: string; // e.g. "100Ah", "200Ah", "314Ah"
  rate: number;
  warranty: string;
}

export interface PaymentTerms {
  advancePercent: number; // default 70
  onDumpingPercent: number; // default 20
  onCompletionPercent: number; // default 10
}

export interface ReturnOnInvestment {
  dailyProductionUnits: string; // e.g. "100 units approx."
  monthlyProductionUnits: string; // e.g. "3,000 units approx."
  monthlySavingsPkr: string; // e.g. "Rs 195,000 – 200,000"
  paybackPeriodMonths: string; // e.g. "18 – 20 months"
}

export interface ProductionData {
  dailyUnitsText: string; // e.g. "100 units approx."
  monthlyUnitsText: string; // e.g. "3,000 units approx."
  monthlySavingsText: string; // e.g. "Rs 195,000 – 200,000"
  roiMonthsText: string; // e.g. "18 – 20 months"
}

export interface TemplateDefinition {
  id: string;
  name: string;
  description?: string;
  formatKind?: FormatKind;
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
  formatKind?: FormatKind;
  customer: Customer;
  capacityKw: string; // e.g. "10", "20"
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
  productionData?: ProductionData;
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
  ratePerUnitPkr: number; // default 65.0 Rs/unit
  unitsPerKwPerDay: number; // default 5.0 units/kW/day
  roundToNearestKw: number; // default 0.5 kW
  defaultPanelWattage: number; // default 625 W
}
