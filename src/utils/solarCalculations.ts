import { CalculatorSettings, ReturnOnInvestment } from '../types';

export const DEFAULT_CALCULATOR_SETTINGS: CalculatorSettings = {
  ratePerUnitPkr: 45.0, // Blended average PKR/unit
  unitsPerKwPerDay: 4.5, // Daily solar yield factor
  roundToNearestKw: 0.5,
  defaultPanelWattage: 585,
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
}

export function calculateSolarSizing(
  monthlyBillPkr: number,
  settings: CalculatorSettings = DEFAULT_CALCULATOR_SETTINGS
): SolarSystemSizingResult {
  const bill = Math.max(0, monthlyBillPkr);
  const rate = settings.ratePerUnitPkr || 45.0;
  const yieldPerKw = settings.unitsPerKwPerDay || 4.5;
  const step = settings.roundToNearestKw || 0.5;
  const panelWattage = settings.defaultPanelWattage || 585;

  // 1. Calculate Estimated Units consumed
  const estimatedMonthlyUnits = Math.round(bill / rate);
  const estimatedDailyUnits = estimatedMonthlyUnits / 30.0;

  // 2. Calculate Raw kW needed
  const rawKw = estimatedDailyUnits / yieldPerKw;
  const recommendedKw = Math.max(step, Math.ceil(rawKw / step) * step);

  // 3. Panel Count Sizing
  const panelCount = Math.ceil((recommendedKw * 1000) / panelWattage);

  // 4. Expected Generation & Financial Savings
  const dailyGenUnits = Math.round(recommendedKw * yieldPerKw);
  const monthlyGenUnits = Math.round(dailyGenUnits * 30);
  const estimatedMonthlySavingsPkr = Math.round(monthlyGenUnits * rate);
  const estimatedYearlySavingsPkr = estimatedMonthlySavingsPkr * 12;

  // 5. Estimated System Cost & Payback Estimation (~115k/kW for On-Grid, ~135k/kW for Hybrid average)
  const estimatedCapex = recommendedKw * 125000;
  const paybackPeriodYears = estimatedYearlySavingsPkr > 0 
    ? parseFloat((estimatedCapex / estimatedYearlySavingsPkr).toFixed(1)) 
    : 2.8;

  const lowDaily = Math.round(dailyGenUnits * 0.9);
  const highDaily = Math.round(dailyGenUnits * 1.1);
  const lowMonthly = Math.round(monthlyGenUnits * 0.9);
  const highMonthly = Math.round(monthlyGenUnits * 1.1);
  const lowSavings = Math.round(estimatedMonthlySavingsPkr * 0.9);
  const highSavings = Math.round(estimatedMonthlySavingsPkr * 1.1);
  const lowMonths = Math.max(12, Math.round(paybackPeriodYears * 12 * 0.9));
  const highMonths = Math.max(14, Math.round(paybackPeriodYears * 12 * 1.1));

  const roi: ReturnOnInvestment = {
    dailyProductionUnits: `${lowDaily} - ${highDaily} Units`,
    monthlyProductionUnits: `${lowMonthly.toLocaleString()} - ${highMonthly.toLocaleString()} Units`,
    monthlySavingsPkr: `Rs. ${lowSavings.toLocaleString()} - ${highSavings.toLocaleString()}`,
    paybackPeriodMonths: `${lowMonths} - ${highMonths} Months (~${paybackPeriodYears} Years)`,
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
  };
}

export function formatCurrency(amount: number | null | undefined): string {
  if (amount === null || amount === undefined || isNaN(amount)) return '0';
  return Math.round(amount).toLocaleString('en-US');
}
