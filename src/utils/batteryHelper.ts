export interface BatterySpec {
  capacityKwh: number;
  ah: string;
  voltage: string;
  defaultWarranty: string;
  defaultRate: number;
}

export const POPULAR_BATTERY_BRANDS = [
  'YJC',
  'Dyness',
  'Pylontech',
  'Narada',
  'Inverex',
  'Huawei',
  'Chint',
  'Felicity',
];

export const STANDARD_BATTERY_SIZES: number[] = [5, 10, 16];

export function getStandardBatterySpecs(kwh: number | string): BatterySpec {
  const num = typeof kwh === 'string' ? parseFloat(kwh) || 5 : kwh;

  if (num === 5) {
    return {
      capacityKwh: 5,
      ah: '100Ah',
      voltage: '51.2V',
      defaultWarranty: '5 Years Official Warranty',
      defaultRate: 230000,
    };
  }

  if (num === 10) {
    return {
      capacityKwh: 10,
      ah: '200Ah',
      voltage: '51.2V',
      defaultWarranty: '5 Years Official Warranty',
      defaultRate: 420000,
    };
  }

  if (num === 16) {
    return {
      capacityKwh: 16,
      ah: '314Ah',
      voltage: '51.2V',
      defaultWarranty: '7 Years Official Warranty',
      defaultRate: 635000,
    };
  }

  // Custom sizing according to client voltage (51.2V nominal)
  const calcAh = Math.round((num * 1000) / 51.2);
  return {
    capacityKwh: num,
    ah: `${calcAh}Ah`,
    voltage: '51.2V',
    defaultWarranty: num >= 15 ? '7 Years Official Warranty' : '5 Years Official Warranty',
    defaultRate: Math.round(num * 40000),
  };
}

export function formatBatteryDescription(
  brand: string,
  capacityKwh: number | string,
  customAh?: string,
  customVoltage?: string
): string {
  const cleanBrand = (brand || 'YJC').trim();
  const specs = getStandardBatterySpecs(capacityKwh);
  const ah = customAh && customAh.trim() ? customAh.trim() : specs.ah;
  const voltage = customVoltage && customVoltage.trim() ? customVoltage.trim() : specs.voltage;
  const cleanKwh = specs.capacityKwh;

  return `${cleanBrand} ${cleanKwh} kWh Lithium Battery ${ah} ${voltage}`;
}

export function isBatteryDescription(description: string): boolean {
  if (!description) return false;
  const lower = description.toLowerCase();
  return (
    lower.includes('battery') ||
    lower.includes('lithium') ||
    (lower.includes('kwh') && lower.includes('ah'))
  );
}

export function parseBatteryDescription(description: string): {
  brand: string;
  capacityKwh: number;
  ah: string;
  voltage: string;
  isRecognized: boolean;
} {
  if (!description) {
    return { brand: 'YJC', capacityKwh: 5, ah: '100Ah', voltage: '51.2V', isRecognized: false };
  }

  // Match e.g. "YJC 16 kWh Lithium Battery 314Ah 51.2V" or "Dyness 5 kWh Lithium Battery 100Ah 51.2V"
  const regex = /^\s*([A-Za-z0-9\/\s\-]+?)\s+(\d+(?:\.\d+)?)\s*kWh\s*(?:Lithium\s+Battery)?\s*(\d+Ah)?\s*(\d+\.?\d*V)?/i;
  const match = description.match(regex);

  if (match) {
    const rawBrand = match[1]?.trim() || 'YJC';
    const kwh = parseFloat(match[2]) || 5;
    const stdSpecs = getStandardBatterySpecs(kwh);
    const ah = match[3] || stdSpecs.ah;
    const voltage = match[4] || stdSpecs.voltage;

    return {
      brand: rawBrand,
      capacityKwh: kwh,
      ah,
      voltage,
      isRecognized: true,
    };
  }

  // Fallback: check if standard size is mentioned
  let fallbackKwh = 5;
  if (description.includes('16')) fallbackKwh = 16;
  else if (description.includes('10')) fallbackKwh = 10;
  else if (description.includes('5')) fallbackKwh = 5;

  const std = getStandardBatterySpecs(fallbackKwh);
  const firstWord = description.split(' ')[0] || 'YJC';

  return {
    brand: firstWord,
    capacityKwh: fallbackKwh,
    ah: std.ah,
    voltage: std.voltage,
    isRecognized: isBatteryDescription(description),
  };
}
