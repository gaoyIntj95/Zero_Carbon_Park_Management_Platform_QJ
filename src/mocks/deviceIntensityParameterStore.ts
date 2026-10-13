export type DeviceIntensityMetricCode = 'compressed-air-electricity' | 'boiler-standard-coal' | 'device-output-energy' | 'custom-device-work';
export type DeviceMetricTemplateId = 'unit-output-energy';
export type DeviceMetricCalculationMethod = 'ratio';

export interface MetricDataSource {
  source: 'device-energy' | 'operation-data' | 'energy-conversion';
  energyTypeId?: string;
  metricCode?: string;
  recordType?: string;
  name: string;
  unit: string;
}

export interface DeviceIntensityTemplateConfig {
  templateId: DeviceMetricTemplateId;
  metricCode: DeviceIntensityMetricCode;
  metricName: string;
  calculationMethod: DeviceMetricCalculationMethod;
  numerator: MetricDataSource;
  denominator: MetricDataSource;
  resultUnit: string;
  factor?: number;
  // Legacy fields remain readable by existing benchmark fixtures.
  energyTypeId?: string;
  denominatorName?: string;
  denominatorUnit?: string;
  metricUnit?: string;
  formula?: string;
}

export interface DeviceIntensityParameter {
  deviceId: string;
  year: number;
  metricCode: DeviceIntensityMetricCode;
  value: number;
  unit: string;
  source?: string;
  monthlyValues?: Array<number | null>;
  monthlyReportedMonths?: boolean[];
  entryMode?: 'monthly' | 'annual-fallback';
  annualValue?: number;
}

export interface DeviceIntensityTemplateAssignment {
  deviceId: string;
  year: number;
  metricCode: DeviceIntensityMetricCode;
  config: DeviceIntensityTemplateConfig;
}

export const DEVICE_METRIC_TEMPLATES: Array<Pick<DeviceIntensityTemplateConfig, 'templateId' | 'calculationMethod'> & { label: string; legacyMetricCode: DeviceIntensityMetricCode }> = [
  { templateId: 'unit-output-energy', label: '单位产出能耗', calculationMethod: 'ratio', legacyMetricCode: 'device-output-energy' },
];

const migratedAssignments: DeviceIntensityTemplateAssignment[] = [
  { deviceId: 'v11-device-62', year: 2026, metricCode: 'compressed-air-electricity', config: { templateId: 'unit-output-energy', metricCode: 'compressed-air-electricity', metricName: '单位产出能耗', calculationMethod: 'ratio', numerator: { source: 'device-energy', energyTypeId: 'v11-energy-electricity', name: '电力消耗', unit: 'kWh' }, denominator: { source: 'operation-data', metricCode: 'compressed_air_output', name: '供气量', unit: 'Nm³' }, resultUnit: 'kWh/Nm³', factor: 1, energyTypeId: 'v11-energy-electricity', denominatorName: '供气量', denominatorUnit: 'Nm³', metricUnit: 'kWh/Nm³', formula: '电力消耗 ÷ 供气量' } },
  { deviceId: 'v11-device-79', year: 2026, metricCode: 'compressed-air-electricity', config: { templateId: 'unit-output-energy', metricCode: 'compressed-air-electricity', metricName: '单位产出能耗', calculationMethod: 'ratio', numerator: { source: 'device-energy', energyTypeId: 'v11-energy-electricity', name: '电力消耗', unit: 'kWh' }, denominator: { source: 'operation-data', metricCode: 'compressed_air_output', name: '供气量', unit: 'Nm³' }, resultUnit: 'kWh/Nm³', factor: 1, energyTypeId: 'v11-energy-electricity', denominatorName: '供气量', denominatorUnit: 'Nm³', metricUnit: 'kWh/Nm³', formula: '电力消耗 ÷ 供气量' } },
  { deviceId: 'v11-device-82', year: 2026, metricCode: 'boiler-standard-coal', config: { templateId: 'unit-output-energy', metricCode: 'boiler-standard-coal', metricName: '单位产出能耗', calculationMethod: 'ratio', numerator: { source: 'device-energy', energyTypeId: 'v11-energy-natural-gas', name: '折标综合能耗', unit: 'kgce' }, denominator: { source: 'operation-data', metricCode: 'steam_output', name: '蒸汽产量', unit: 't' }, resultUnit: 'kgce/t', factor: 1000, energyTypeId: 'v11-energy-natural-gas', denominatorName: '蒸汽产量', denominatorUnit: 't', metricUnit: 'kgce/t', formula: '折标综合能耗 × 1000 ÷ 蒸汽产量' } },
  { deviceId: 'v11-device-81', year: 2026, metricCode: 'device-output-energy', config: { templateId: 'unit-output-energy', metricCode: 'device-output-energy', metricName: '单位产出能耗', calculationMethod: 'ratio', numerator: { source: 'device-energy', energyTypeId: 'v11-energy-electricity', name: '设备耗电量', unit: 'kWh' }, denominator: { source: 'operation-data', metricCode: 'power_generation_output', name: '发电量', unit: 'kWh' }, resultUnit: 'kWh/kWh', factor: 1, metricUnit: 'kWh/kWh', formula: '设备耗电量 ÷ 发电量' } },
]; 

let parameters: DeviceIntensityParameter[] = [
  { deviceId: 'v11-device-62', year: 2026, metricCode: 'compressed-air-electricity', value: 10080000, unit: 'Nm³', source: '设备产出数据—月度供气量', entryMode: 'monthly', annualValue: 10080000, monthlyValues: Array(12).fill(840000), monthlyReportedMonths: Array(12).fill(true) },
  { deviceId: 'v11-device-81', year: 2026, metricCode: 'device-output-energy', value: 18300000, unit: 'kWh', source: '设备产出数据—月度发电量', entryMode: 'monthly', annualValue: 18300000, monthlyValues: [1400000,1350000,1450000,1500000,1550000,1600000,1650000,1600000,1500000,1450000,1600000,1650000], monthlyReportedMonths: Array(12).fill(true) },
];
let templateAssignments = [...migratedAssignments];

export function getDeviceIntensityParameter(deviceId: string, year: number, metricCode: DeviceIntensityMetricCode) { return parameters.find((item) => item.deviceId === deviceId && item.year === year && item.metricCode === metricCode); }
export function saveDeviceIntensityParameter(input: DeviceIntensityParameter) { const index = parameters.findIndex((item) => item.deviceId === input.deviceId && item.year === input.year && item.metricCode === input.metricCode); if (index >= 0) parameters[index] = { ...input }; else parameters.push({ ...input }); return { ok: true as const }; }
export function getDeviceIntensityTemplate(deviceId: string, year: number) { return templateAssignments.find((item) => item.deviceId === deviceId && item.year === year)?.metricCode; }
export function getDeviceIntensityTemplateConfig(deviceId: string, year: number) { return templateAssignments.find((item) => item.deviceId === deviceId && item.year === year)?.config; }
export function countDeviceIntensityTemplates(deviceId: string, year?: number) { return templateAssignments.filter((item) => item.deviceId === deviceId && (year === undefined || item.year === year)).length; }
export function saveDeviceIntensityTemplate(input: DeviceIntensityTemplateAssignment) { const index = templateAssignments.findIndex((item) => item.deviceId === input.deviceId && item.year === input.year); if (index >= 0) templateAssignments[index] = { ...input }; else templateAssignments.push({ ...input }); return { ok: true as const }; }
export function resetDeviceIntensityParameters() { parameters = [{ deviceId: 'v11-device-62', year: 2026, metricCode: 'compressed-air-electricity', value: 10080000, unit: 'Nm³', source: '设备产出数据—月度供气量', entryMode: 'monthly', annualValue: 10080000, monthlyValues: Array(12).fill(840000), monthlyReportedMonths: Array(12).fill(true) }, { deviceId: 'v11-device-81', year: 2026, metricCode: 'device-output-energy', value: 18300000, unit: 'kWh', source: '设备产出数据—月度发电量', entryMode: 'monthly', annualValue: 18300000, monthlyValues: [1400000,1350000,1450000,1500000,1550000,1600000,1650000,1600000,1500000,1450000,1600000,1650000], monthlyReportedMonths: Array(12).fill(true) }]; templateAssignments = [...migratedAssignments]; }

export function deleteDeviceIntensityParameter(deviceId: string, year: number, metricCode: DeviceIntensityMetricCode) { parameters = parameters.filter((item) => item.deviceId !== deviceId || item.year !== year || item.metricCode !== metricCode); }


