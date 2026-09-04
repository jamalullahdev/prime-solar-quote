import { CalculatorSettings, ReturnOnInvestment, ProductionData } from '../types';

export const DEFAULT_CALCULATOR_SETTINGS: CalculatorSettings = {
  ratePerUnitPkr: 65.0, // Client standard tariff (PKR 65 / unit)
  unitsPerKwPerDay: 5.0, // Client rule: 1kW PV makes 5 units daily
  roundToNearestKw: 0.5,
  defaultPanelWattage: 625, // Standard Tier-1 620/625W panels
};

export interface SolarSystemSizingResult {
  monthlyBillPkr: number;
  estimatedMonthlyUnits: number;
  estimatedDailyUnits: number;
  recommendedKw: number;
  panelCount: number;
  estimatedMonthlySavingsPkr: number;
  estimatedYearlySavingsPkr: number;
  paybackPeriodYears: number;
  roi: ReturnOnInvestment;
  productionData: ProductionData;
}

export function calculateProductionData(
  panelCount: number,
  panelWattage: number = 625,
  capacityKwFallback: number = 10,
  grandTotal: number = 0
): ProductionData {
  // Client rule: Panels kW (not Inverter kW) * 5 units daily
  const totalWattage =
    panelCount > 0 && panelWattage > 0
      ? panelCount * panelWattage
      : capacityKwFallback * 1000;

  const panelKw = totalWattage / 1000;
  const dailyUnits = Math.round(panelKw * 5);
  const monthlyUnits = Math.round(dailyUnits * 30);
  const monthlySavings = Math.round(monthlyUnits * 65);

  const lowSavings = Math.round(monthlySavings * 0.98);
  const highSavings = Math.round(monthlySavings * 1.025);

  const paybackMonths =
    monthlySavings > 0 && grandTotal > 0
      ? Math.round(grandTotal / monthlySavings)
      : Math.round(18);

  const lowPayback = Math.max(10, Math.round(paybackMonths * 0.9));
  const highPayback = Math.max(lowPayback + 2, Math.round(paybackMonths * 1.05));

  return {
    dailyUnitsText: `${dailyUnits} units approx.`,
    monthlyUnitsText: `${monthlyUnits.toLocaleString('en-US')} units approx.`,
    monthlySavingsText: `Rs ${formatCurrency(lowSavings)} – ${formatCurrency(highSavings)}`,
    roiMonthsText: `${lowPayback} – ${highPayback} months`,
  };
}

export function calculateSolarSizing(
  monthlyBillPkr: number,
  settings: CalculatorSettings = DEFAULT_CALCULATOR_SETTINGS
): SolarSystemSizingResult {
  const bill = Math.max(0, monthlyBillPkr);
  const rate = settings.ratePerUnitPkr || 65.0;
  const yieldPerKw = settings.unitsPerKwPerDay || 5.0;
  const step = settings.roundToNearestKw || 0.5;
  const panelWattage = settings.defaultPanelWattage || 625;

  // 1. Calculate Units Consumed (Client reverse formula: Bill / 65)
  const estimatedMonthlyUnits = Math.round(bill / rate);
  const estimatedDailyUnits = estimatedMonthlyUnits / 30.0;

  // 2. Calculate Required Solar kW (Daily Units / 5)
  const rawKw = estimatedDailyUnits / yieldPerKw;
  const recommendedKw = Math.max(step, Math.ceil(rawKw / step) * step);

  // 3. Panel Count Sizing (Total Wattage / 625W)
  const panelCount = Math.ceil((recommendedKw * 1000) / panelWattage);
  const totalPvKw = (panelCount * panelWattage) / 1000;

  // 4. Expected Generation & Financial Savings
  const dailyGenUnits = Math.round(totalPvKw * yieldPerKw);
  const monthlyGenUnits = Math.round(dailyGenUnits * 30);
  const estimatedMonthlySavingsPkr = Math.round(monthlyGenUnits * rate);
  const estimatedYearlySavingsPkr = estimatedMonthlySavingsPkr * 12;

  // 5. Estimated System Cost & Payback Estimation
  const estimatedCapex = recommendedKw * 135000;
  const paybackPeriodYears =
    estimatedYearlySavingsPkr > 0
      ? parseFloat((estimatedCapex / estimatedYearlySavingsPkr).toFixed(1))
      : 1.8;

  const paybackMonths = Math.round(paybackPeriodYears * 12);
  const lowMonths = Math.max(12, Math.round(paybackMonths * 0.9));
  const highMonths = Math.max(lowMonths + 2, Math.round(paybackMonths * 1.1));

  const lowSavings = Math.round(estimatedMonthlySavingsPkr * 0.98);
  const highSavings = Math.round(estimatedMonthlySavingsPkr * 1.025);

  const roi: ReturnOnInvestment = {
    dailyProductionUnits: `${dailyGenUnits} units approx.`,
    monthlyProductionUnits: `${monthlyGenUnits.toLocaleString('en-US')} units approx.`,
    monthlySavingsPkr: `Rs ${formatCurrency(lowSavings)} – ${formatCurrency(highSavings)}`,
    paybackPeriodMonths: `${lowMonths} – ${highMonths} months`,
  };

  const productionData: ProductionData = {
    dailyUnitsText: `${dailyGenUnits} units approx.`,
    monthlyUnitsText: `${monthlyGenUnits.toLocaleString('en-US')} units approx.`,
    monthlySavingsText: `Rs ${formatCurrency(lowSavings)} – ${formatCurrency(highSavings)}`,
    roiMonthsText: `${lowMonths} – ${highMonths} months`,
  };

  return {
    monthlyBillPkr: bill,
    estimatedMonthlyUnits,
    estimatedDailyUnits: parseFloat(estimatedDailyUnits.toFixed(1)),
    recommendedKw,
    panelCount,
    estimatedMonthlySavingsPkr,
    estimatedYearlySavingsPkr,
    paybackPeriodYears,
    roi,
    productionData,
  };
}

export function formatCurrency(amount: number | null | undefined): string {
  if (amount === null || amount === undefined || isNaN(amount)) return '0';
  return Math.round(amount).toLocaleString('en-US');
}
