import { createAnnualStore } from './annualData';
import { listEnergyUnits } from './energyUnitMockStore';
import { countBenchmarkTargets, resetBenchmarkTargetStore } from './benchmarkTargetStore';
import { resetProductMasterStore } from './productMasterStore';
import { countDeviceIntensityTemplates, resetDeviceIntensityParameters } from './deviceIntensityParameterStore';

export type AnalysisCategory =
  | '电力'
  | '热力'
  | '化石燃料'
  | '可再生及替代能源'
  | '回收能源'
  | '产出能源'
  | '其他能源';

export type EnergyRole = '能源消费' | '回收能源' | '能源产出' | '外供能源';
export type ScopeLevel = '企业' | '一级用能单元' | '二级用能单元';
export type EnergyRecordScopeType = 'enterprise' | 'energyUnit' | 'device';
export type ConversionOutputType = '锅炉产汽/产热' | '余热发电' | '空压产气/压缩空气' | '回收利用' | '直接外供' | '其他转换';
export type ConversionInputMode = 'linked' | 'manual' | 'recovery' | 'none' | 'direct';

export interface V11EnergyType {
  energyTypeId: string;
  analysisCategory: AnalysisCategory;
  energyTypeName: string;
  measurementUnit: string;
  standardCoalFactor: number;
  standardCoalFactorUnit: string;
  remark: string;
}

export interface V11EnergyRecord {
  energyRecordId: string;
  year: number;
  energyRole: EnergyRole;
  scopeLevel: ScopeLevel;
  scopeType?: EnergyRecordScopeType;
  scopeId?: string | null;
  energyUnitId: string | null;
  energyTypeId: string;
  entryMode: 'monthly' | 'annual';
  monthlyAmounts: number[];
  /** 标记实际已取得的月份；金额为 0 也可视为已填报。 */
  monthlyReportedMonths?: boolean[];
  /** 月度不完整时补录的全年台账总量。 */
  annualAmount: number;
  /** 回收能源来源的具体设备或工艺，可选；能源消费记录不使用。 */
  sourceDeviceId?: string;
  /** 没有设备档案时记录具体来源工艺。 */
  sourceProcess?: string;
  /** 回收能源来源介质，例如烟气、冷却水、热风。 */
  sourceMedium?: string;
}

export interface V11EnergyCost {
  energyCostId: string;
  year: number;
  energyTypeId: string;
  monthlyCosts: number[];
  monthlyReportedMonths?: boolean[];
  annualCost?: number;
}

export interface V11ConversionOutput {
  /** 新版维护口径：内部可供由产出扣减外供和已确认损失生成。 */
  flowManaged?: boolean;
  monthlyOutputReported?: boolean[];
  monthlyInputReported?: boolean[];
  monthlyLossReported?: boolean[];
  /** 损失备注（选填）；沿用旧字段名以保留历史说明。 */
  lossBasis?: string;
  conversionOutputId: string;
  year: number;
  recordType: ConversionOutputType;
  conversionEnergyUnitId: string | null;
  inputMode: ConversionInputMode;
  inputEnergyRecordId?: string;
  inputAnalysisCategory?: AnalysisCategory;
  inputEnergyTypeId?: string;
  inputAmount?: number;
  inputUnit?: string;
  recoverySourceEnergyUnitId?: string;
  recoveryEnergyName?: string;
  recoveryAmount?: number | null;
  recoveryUnit?: string;
  outputAnalysisCategory?: AnalysisCategory;
  outputEnergyTypeId?: string;
  outputEnergyName?: string;
  outputUnit?: string;
  outputAmount?: number;
  internalAmount?: number;
  /** 产出能源的主要内部使用去向；一期先支持一个主要去向单元。 */
  outputTargetEnergyUnitId?: string;
  externalAmount: number;
  lossAmount?: number;
  /** 月度转换量；存在时优先用于月度能流分析，不以年度值平均摊分。 */
  monthlyInputAmounts?: number[];
  monthlyOutputAmounts?: number[];
  monthlyInternalAmounts?: number[];
  monthlyExternalAmounts?: number[];
  monthlyLossAmounts?: number[];
  receiver?: string;
  remark: string;
}

/** 能源供能台账。供能来源可以是企业级能源记录，也可以是转换产出。 */
export interface V11ExternalSupplyRecord {
  monthlyReported?: boolean[];
  externalSupplyId: string;
  year: number;
  inputEnergyRecordId?: string;
  conversionOutputId?: string;
  energyTypeId?: string;
  amount: number;
  unit?: string;
  monthlyAmounts?: number[];
  receiver?: string;
  /** 原型阶段保存已选择的凭证文件名；正式接入文件服务后替换为附件元数据。 */
  evidenceNames?: string[];
  remark: string;
}

export interface V11OperationMetric {
  operationMetricId: string;
  metricCode: string;
  productId: string | null;
  year: number;
  scopeLevel: ScopeLevel;
  energyUnitId: string | null;
  metricCategory: '产量指标' | '经济指标' | '运行指标';
  aggregationMethod: '月度求和' | '年度单值';
  metricName: string;
  metricUnit: string;
  entryMode: 'monthly' | 'annual';
  monthlyValues: number[];
  monthlyReportedMonths?: boolean[];
  annualValue: number;
}

export interface V11KeyDevice {
  deviceId: string;
  deviceName: string;
  deviceType: string;
  energyUnitId: string;
  mainEnergyTypeId: string;
  outputBasis?: string;
  remark: string;
}

export type V11EnergyTypeReferenceKind = 'energyRecords' | 'energyCosts' | 'keyDevices' | 'conversionOutputs' | 'energyUnitRelations';
export interface V11EnergyTypeReferenceSummary {
  kind: V11EnergyTypeReferenceKind;
  label: string;
  count: number;
  path: string;
}

const seedEnergyTypes: V11EnergyType[] = [
  { energyTypeId: 'v11-energy-electricity', analysisCategory: '电力', energyTypeName: '电力', measurementUnit: 'kWh', standardCoalFactor: 0.1229, standardCoalFactorUnit: 'kgce/kWh', remark: '' },
  { energyTypeId: 'v11-energy-steam', analysisCategory: '热力', energyTypeName: '蒸汽', measurementUnit: 'GJ', standardCoalFactor: 0.0341, standardCoalFactorUnit: 'tce/GJ', remark: '' },
  { energyTypeId: 'v11-energy-coal', analysisCategory: '化石燃料', energyTypeName: '原煤', measurementUnit: 't', standardCoalFactor: 0.7143, standardCoalFactorUnit: 'tce/t', remark: '' },
  { energyTypeId: 'v11-energy-bituminous-coal', analysisCategory: '化石燃料', energyTypeName: '烟煤', measurementUnit: 't', standardCoalFactor: 0.79174, standardCoalFactorUnit: 'tce/t', remark: '' },
  { energyTypeId: 'v11-energy-petcoke', analysisCategory: '化石燃料', energyTypeName: '石油焦', measurementUnit: 't', standardCoalFactor: 1.05775, standardCoalFactorUnit: 'tce/t', remark: '' },
  { energyTypeId: 'v11-energy-natural-gas', analysisCategory: '化石燃料', energyTypeName: '天然气', measurementUnit: 'Nm³', standardCoalFactor: 1.32836, standardCoalFactorUnit: 'kgce/Nm³', remark: '' },
  { energyTypeId: 'v11-energy-rdf', analysisCategory: '可再生及替代能源', energyTypeName: 'RDF', measurementUnit: 't', standardCoalFactor: 0, standardCoalFactorUnit: 'tce/t', remark: '' },
  { energyTypeId: 'v11-energy-biomass', analysisCategory: '可再生及替代能源', energyTypeName: '生物质燃料', measurementUnit: 't', standardCoalFactor: 0.5, standardCoalFactorUnit: 'tce/t', remark: '' },
  { energyTypeId: 'v11-energy-waste-heat', analysisCategory: '回收能源', energyTypeName: '余热', measurementUnit: 'GJ', standardCoalFactor: 0.0341, standardCoalFactorUnit: 'tce/GJ', remark: '' },
  { energyTypeId: 'v11-energy-waste-pressure', analysisCategory: '回收能源', energyTypeName: '余压', measurementUnit: 'tce', standardCoalFactor: 1, standardCoalFactorUnit: 'tce/tce', remark: '生产过程余压按可回收折标量登记' },
  { energyTypeId: 'v11-energy-compressed-air', analysisCategory: '其他能源', energyTypeName: '压缩空气', measurementUnit: 'Nm³', standardCoalFactor: 0.04, standardCoalFactorUnit: 'kgce/Nm³', remark: '内部能源介质；参考值，企业可按实测耗电量/产气量修正' },
  { energyTypeId: 'v11-energy-washed-clean-coal', analysisCategory: '化石燃料', energyTypeName: '洗精煤', measurementUnit: 't', standardCoalFactor: 0.9, standardCoalFactorUnit: 'tce/t', remark: '' },
  { energyTypeId: 'v11-energy-washed-mid-coal', analysisCategory: '化石燃料', energyTypeName: '洗中煤', measurementUnit: 't', standardCoalFactor: 0.2857, standardCoalFactorUnit: 'tce/t', remark: '' },
  { energyTypeId: 'v11-energy-coke', analysisCategory: '化石燃料', energyTypeName: '焦炭', measurementUnit: 't', standardCoalFactor: 0.9714, standardCoalFactorUnit: 'tce/t', remark: '' },
  { energyTypeId: 'v11-energy-coal-tar', analysisCategory: '化石燃料', energyTypeName: '煤焦油', measurementUnit: 't', standardCoalFactor: 1.1429, standardCoalFactorUnit: 'tce/t', remark: '' },
  { energyTypeId: 'v11-energy-crude-oil', analysisCategory: '化石燃料', energyTypeName: '原油', measurementUnit: 't', standardCoalFactor: 1.4286, standardCoalFactorUnit: 'tce/t', remark: '' },
  { energyTypeId: 'v11-energy-fuel-oil', analysisCategory: '化石燃料', energyTypeName: '燃料油', measurementUnit: 't', standardCoalFactor: 1.4286, standardCoalFactorUnit: 'tce/t', remark: '' },
  { energyTypeId: 'v11-energy-gasoline', analysisCategory: '化石燃料', energyTypeName: '汽油', measurementUnit: 't', standardCoalFactor: 1.4714, standardCoalFactorUnit: 'tce/t', remark: '' },
  { energyTypeId: 'v11-energy-kerosene', analysisCategory: '化石燃料', energyTypeName: '煤油', measurementUnit: 't', standardCoalFactor: 1.4714, standardCoalFactorUnit: 'tce/t', remark: '' },
  { energyTypeId: 'v11-energy-lng', analysisCategory: '化石燃料', energyTypeName: '液化天然气', measurementUnit: 't', standardCoalFactor: 1.7572, standardCoalFactorUnit: 'tce/t', remark: '' },
  { energyTypeId: 'v11-energy-lpg', analysisCategory: '化石燃料', energyTypeName: '液化石油气', measurementUnit: 't', standardCoalFactor: 1.7143, standardCoalFactorUnit: 'tce/t', remark: '' },
  { energyTypeId: 'v11-energy-refinery-dry-gas', analysisCategory: '化石燃料', energyTypeName: '炼厂干气', measurementUnit: 't', standardCoalFactor: 1.5714, standardCoalFactorUnit: 'tce/t', remark: '' },
  { energyTypeId: 'v11-energy-blast-furnace-gas', analysisCategory: '化石燃料', energyTypeName: '高炉煤气', measurementUnit: 'Nm³', standardCoalFactor: 0.1286, standardCoalFactorUnit: 'kgce/Nm³', remark: '' },
  { energyTypeId: 'v11-energy-crude-benzene', analysisCategory: '化石燃料', energyTypeName: '粗苯', measurementUnit: 't', standardCoalFactor: 1.4286, standardCoalFactorUnit: 'tce/t', remark: '' },
  { energyTypeId: 'v11-energy-anthracite', analysisCategory: '化石燃料', energyTypeName: '无烟煤', measurementUnit: 't', standardCoalFactor: 0.83647, standardCoalFactorUnit: 'tce/t', remark: '' },
  { energyTypeId: 'v11-energy-lignite', analysisCategory: '化石燃料', energyTypeName: '褐煤', measurementUnit: 't', standardCoalFactor: 0.49301, standardCoalFactorUnit: 'tce/t', remark: '' },
  { energyTypeId: 'v11-energy-other-washed-coal', analysisCategory: '化石燃料', energyTypeName: '其他洗煤', measurementUnit: 't', standardCoalFactor: 0.52454, standardCoalFactorUnit: 'tce/t', remark: '' },
  { energyTypeId: 'v11-energy-formed-coal', analysisCategory: '化石燃料', energyTypeName: '型煤', measurementUnit: 't', standardCoalFactor: 0.59575, standardCoalFactorUnit: 'tce/t', remark: '' },
  { energyTypeId: 'v11-energy-other-petroleum', analysisCategory: '化石燃料', energyTypeName: '其他石油制品', measurementUnit: 't', standardCoalFactor: 1.37132, standardCoalFactorUnit: 'tce/t', remark: '' },
  { energyTypeId: 'v11-energy-coke-oven-gas', analysisCategory: '化石燃料', energyTypeName: '焦炉煤气', measurementUnit: 'Nm³', standardCoalFactor: 0.5932, standardCoalFactorUnit: 'kgce/Nm³', remark: '' },
  { energyTypeId: 'v11-energy-basic-oxygen-furnace-gas', analysisCategory: '化石燃料', energyTypeName: '转炉煤气', measurementUnit: 'Nm³', standardCoalFactor: 0.2714, standardCoalFactorUnit: 'kgce/Nm³', remark: '' },
  { energyTypeId: 'v11-energy-other-coal-gas', analysisCategory: '化石燃料', energyTypeName: '其他煤气', measurementUnit: 'Nm³', standardCoalFactor: 0.17859, standardCoalFactorUnit: 'kgce/Nm³', remark: '' },
  { energyTypeId: 'v11-output-electricity', analysisCategory: '产出能源', energyTypeName: '电力（产出）', measurementUnit: 'kWh', standardCoalFactor: 0.1229, standardCoalFactorUnit: 'kgce/kWh', remark: '' },
  { energyTypeId: 'v11-output-steam', analysisCategory: '产出能源', energyTypeName: '蒸汽（产出）', measurementUnit: 'GJ', standardCoalFactor: 0.0341, standardCoalFactorUnit: 'tce/GJ', remark: '' },
  { energyTypeId: 'v11-output-hot-water', analysisCategory: '产出能源', energyTypeName: '热水（产出）', measurementUnit: 'GJ', standardCoalFactor: 0.0341, standardCoalFactorUnit: 'tce/GJ', remark: '' },
  { energyTypeId: 'v11-output-compressed-air', analysisCategory: '产出能源', energyTypeName: '压缩空气（产出）', measurementUnit: 'Nm³', standardCoalFactor: 0.04, standardCoalFactorUnit: 'kgce/Nm³', remark: '' },
  { energyTypeId: 'v11-output-cold', analysisCategory: '产出能源', energyTypeName: '冷量（产出）', measurementUnit: 'GJ', standardCoalFactor: 0.0341, standardCoalFactorUnit: 'tce/GJ', remark: '原型默认按热量口径折标，企业可按实际口径调整。' },
];

const seedEnergyRecords: V11EnergyRecord[] = [
  { energyRecordId: 'v11-er-30', year: 2026, scopeLevel: '企业', energyUnitId: null, energyRole: '能源消费', energyTypeId: 'v11-energy-electricity', entryMode: 'monthly', annualAmount: 0, monthlyAmounts: [12710000,12555000,13082000,13330000,13578000,13795000,14012000,13888000,13671000,13609000,13826000,14229000] },
  { energyRecordId: 'v11-er-31', year: 2026, scopeLevel: '一级用能单元', energyUnitId: 'eu-clinker-line-1', energyRole: '能源消费', energyTypeId: 'v11-energy-coal', entryMode: 'monthly', annualAmount: 0, monthlyAmounts: [6900,6700,7050,7200,7300,7400,7520,7460,7350,7280,7420,8160] },
  { energyRecordId: 'v11-er-32', year: 2026, scopeLevel: '一级用能单元', energyUnitId: 'eu-clinker-line-1', energyRole: '能源消费', energyTypeId: 'v11-energy-rdf', entryMode: 'monthly', annualAmount: 0, monthlyAmounts: [1600,1550,1680,1750,1800,1850,1900,1880,1820,1780,1850,1940] },
  { energyRecordId: 'v11-er-33', year: 2026, scopeLevel: '一级用能单元', energyUnitId: 'eu-cement-grinding-line', energyRole: '能源消费', energyTypeId: 'v11-energy-electricity', entryMode: 'monthly', annualAmount: 0, monthlyAmounts: [2991723,2942409,3041037,3090351,3149528,3188980,3228431,3215280,3172542,3129803,3188980,3287608] },
  { energyRecordId: 'v11-er-34', year: 2026, scopeLevel: '企业', energyUnitId: null, energyRole: '能源消费', energyTypeId: 'v11-energy-coal', entryMode: 'monthly', annualAmount: 0, monthlyAmounts: [7060,6858,7212,7365,7466,7568,7690,7629,7517,7445,7588,8332] },
  { energyRecordId: 'v11-er-35', year: 2026, scopeLevel: '企业', energyUnitId: null, energyRole: '能源消费', energyTypeId: 'v11-energy-rdf', entryMode: 'monthly', annualAmount: 0, monthlyAmounts: [1600,1550,1680,1750,1800,1850,1900,1880,1820,1780,1850,1940] },
  { energyRecordId: 'v11-er-36', year: 2026, scopeLevel: '二级用能单元', energyUnitId: 'eu-gas-boiler', energyRole: '能源消费', energyTypeId: 'v11-energy-natural-gas', entryMode: 'monthly', annualAmount: 0, monthlyAmounts: [112000,108000,118000,121000,126000,129000,132000,131000,128000,125000,127000,136000] },
  { energyRecordId: 'v11-er-51', year: 2026, scopeLevel: '二级用能单元', energyUnitId: 'eu-compressed-air', energyRole: '能源消费', energyTypeId: 'v11-energy-electricity', entryMode: 'monthly', annualAmount: 0, monthlyAmounts: [146000,140000,151000,154000,159000,163000,168000,165000,160000,157000,164000,171000] },
  { energyRecordId: 'v11-er-49', year: 2026, scopeLevel: '二级用能单元', energyUnitId: 'eu-waste-heat-power', energyRole: '回收能源', energyTypeId: 'v11-energy-waste-heat', entryMode: 'monthly', annualAmount: 0, sourceDeviceId: 'v11-device-74', sourceProcess: '烘干/固化段', monthlyAmounts: [6500,6200,7000,7200,7400,7600,7800,7600,7200,7000,7600,5900] },
  // 回收能源来源示例：这些是中央能源记录，后续可被能源直接利用与转换记录关联。
  { energyRecordId: 'v11-er-recovery-device-70', year: 2026, scopeLevel: '二级用能单元', energyUnitId: 'eu-waste-heat-utilization', energyRole: '回收能源', energyTypeId: 'v11-energy-waste-heat', entryMode: 'monthly', annualAmount: 0, sourceDeviceId: 'v11-device-70', sourceProcess: '冷却系统', monthlyAmounts: [1250,1180,1320,1380,1450,1510,1580,1540,1460,1390,1500,1620] },
  { energyRecordId: 'v11-er-recovery-device-62', year: 2026, scopeLevel: '二级用能单元', energyUnitId: 'eu-compressed-air', energyRole: '回收能源', energyTypeId: 'v11-energy-waste-heat', entryMode: 'monthly', annualAmount: 0, sourceDeviceId: 'v11-device-62', monthlyAmounts: [980,930,1040,1090,1160,1210,1280,1240,1170,1110,1200,1300] },
  { energyRecordId: 'v11-er-recovery-device-82', year: 2026, scopeLevel: '二级用能单元', energyUnitId: 'eu-gas-boiler', energyRole: '回收能源', energyTypeId: 'v11-energy-waste-heat', entryMode: 'monthly', annualAmount: 0, sourceDeviceId: 'v11-device-82', sourceProcess: '排烟', monthlyAmounts: [1680,1590,1780,1860,1950,2040,2140,2080,1980,1880,2020,2200] },
  { energyRecordId: 'v11-er-recovery-pressure', year: 2026, scopeLevel: '二级用能单元', energyUnitId: 'eu-pressure-recovery', energyRole: '回收能源', energyTypeId: 'v11-energy-waste-pressure', entryMode: 'monthly', annualAmount: 0, sourceDeviceId: 'v11-device-84', sourceProcess: '压缩空气管网泄压与工艺余压', monthlyAmounts: [3.0,3.1,3.2,3.3,3.4,3.5,3.6,3.5,3.4,3.3,3.4,3.7] },
  { energyRecordId: 'v11-er-37', year: 2026, scopeLevel: '一级用能单元', energyUnitId: 'eu-clinker-line-1', energyRole: '能源消费', energyTypeId: 'v11-energy-electricity', entryMode: 'monthly', annualAmount: 0, monthlyAmounts: [8800000,8610000,8910000,9020000,9120000,9230000,9340000,9240000,9130000,9020000,9230000,10260000] },
  { energyRecordId: 'v11-er-38', year: 2026, scopeLevel: '一级用能单元', energyUnitId: 'eu-clinker-line-1', energyRole: '能源消费', energyTypeId: 'v11-energy-steam', entryMode: 'monthly', annualAmount: 0, monthlyAmounts: [2500,2500,2500,2500,2500,2500,2500,2500,2500,2500,2500,2500] },
  { energyRecordId: 'v11-er-39', year: 2026, scopeLevel: '一级用能单元', energyUnitId: 'eu-cement-grinding-line', energyRole: '能源消费', energyTypeId: 'v11-energy-natural-gas', entryMode: 'monthly', annualAmount: 0, monthlyAmounts: [25000,25000,25000,25000,25000,25000,25000,25000,25000,25000,25000,25000] },
  { energyRecordId: 'v11-er-43', year: 2026, scopeLevel: '一级用能单元', energyUnitId: 'eu-office', energyRole: '能源消费', energyTypeId: 'v11-energy-electricity', entryMode: 'monthly', annualAmount: 0, monthlyAmounts: [240000,235000,245000,250000,255000,260000,265000,260000,255000,250000,260000,260000] },
  { energyRecordId: 'v11-er-52', year: 2026, scopeLevel: '一级用能单元', energyUnitId: 'eu-public-support', energyRole: '能源消费', energyTypeId: 'v11-energy-electricity', entryMode: 'monthly', annualAmount: 0, monthlyAmounts: [185000,180000,190000,195000,202000,208000,214000,210000,204000,198000,206000,220000] },
  { energyRecordId: 'v11-er-44', year: 2026, scopeLevel: '企业', energyUnitId: null, energyRole: '能源消费', energyTypeId: 'v11-energy-natural-gas', entryMode: 'monthly', annualAmount: 0, monthlyAmounts: [137000,133000,143000,146000,151000,154000,157000,156000,153000,150000,152000,161000] },
  { energyRecordId: 'v11-er-45', year: 2026, scopeLevel: '企业', energyUnitId: null, energyRole: '能源消费', energyTypeId: 'v11-energy-steam', entryMode: 'monthly', annualAmount: 0, monthlyAmounts: [1000,1000,1000,1000,1000,1000,1000,1000,1000,1000,1000,1000] },
  { energyRecordId: 'v11-er-device-60', year: 2026, scopeLevel: '二级用能单元', scopeType: 'device', scopeId: 'v11-device-60', energyUnitId: 'eu-raw-material', energyRole: '能源消费', energyTypeId: 'v11-energy-electricity', entryMode: 'monthly', annualAmount: 0, monthlyAmounts: [252000,248000,260000,265000,271000,276000,282000,279000,274000,270000,278000,285000] },
  { energyRecordId: 'v11-er-device-62', year: 2026, scopeLevel: '二级用能单元', scopeType: 'device', scopeId: 'v11-device-62', energyUnitId: 'eu-compressed-air', energyRole: '能源消费', energyTypeId: 'v11-energy-electricity', entryMode: 'monthly', annualAmount: 0, monthlyAmounts: [92000,88000,95000,97000,101000,104000,108000,106000,102000,99000,105000,110000] },
  { energyRecordId: 'v11-er-device-63', year: 2026, scopeLevel: '一级用能单元', scopeType: 'device', scopeId: 'v11-device-63', energyUnitId: 'eu-clinker-line-1', energyRole: '能源消费', energyTypeId: 'v11-energy-electricity', entryMode: 'monthly', annualAmount: 0, monthlyAmounts: [115000,112000,118000,120000,123000,125000,128000,126000,124000,121000,126000,130000] },
  { energyRecordId: 'v11-er-device-64', year: 2026, scopeLevel: '一级用能单元', scopeType: 'device', scopeId: 'v11-device-64', energyUnitId: 'eu-clinker-line-1', energyRole: '能源消费', energyTypeId: 'v11-energy-natural-gas', entryMode: 'monthly', annualAmount: 0, monthlyAmounts: [42000,40000,43500,44800,46200,47000,48100,47600,46500,45500,46800,47200] },
  { energyRecordId: 'v11-er-device-66', year: 2026, scopeLevel: '二级用能单元', scopeType: 'device', scopeId: 'v11-device-66', energyUnitId: 'eu-raw-material', energyRole: '能源消费', energyTypeId: 'v11-energy-electricity', entryMode: 'monthly', annualAmount: 0, monthlyAmounts: [94000,90000,97000,99000,101000,103000,105000,104000,101000,100000,103000,107000] },
  { energyRecordId: 'v11-er-device-70', year: 2026, scopeLevel: '一级用能单元', scopeType: 'device', scopeId: 'v11-device-70', energyUnitId: 'eu-cement-grinding-line', energyRole: '能源消费', energyTypeId: 'v11-energy-electricity', entryMode: 'monthly', annualAmount: 0, monthlyAmounts: [185000,182000,190000,194000,198000,201000,205000,203000,199000,196000,202000,210000] },
  { energyRecordId: 'v11-er-device-74', year: 2026, scopeLevel: '二级用能单元', scopeType: 'device', scopeId: 'v11-device-74', energyUnitId: 'eu-production-processing', energyRole: '能源消费', energyTypeId: 'v11-energy-electricity', entryMode: 'monthly', annualAmount: 0, monthlyAmounts: [126000,123000,130000,133000,136000,138000,142000,140000,137000,134000,139000,141000] },
  { energyRecordId: 'v11-er-device-78', year: 2026, scopeLevel: '一级用能单元', scopeType: 'device', scopeId: 'v11-device-78', energyUnitId: 'eu-utilities', energyRole: '能源消费', energyTypeId: 'v11-energy-electricity', entryMode: 'monthly', annualAmount: 0, monthlyAmounts: [72000,70000,73500,75000,77000,78500,80000,79200,77500,76000,78000,81000] },
  { energyRecordId: 'v11-er-device-79', year: 2026, scopeLevel: '二级用能单元', scopeType: 'device', scopeId: 'v11-device-79', energyUnitId: 'eu-compressed-air', energyRole: '能源消费', energyTypeId: 'v11-energy-electricity', entryMode: 'monthly', annualAmount: 0, monthlyAmounts: [106000,103000,110000,112000,115000,118000,120000,119000,116000,114000,0,0], monthlyReportedMonths: [true,true,true,true,true,true,true,true,true,true,false,false] },
  { energyRecordId: 'v11-er-device-81', year: 2026, scopeLevel: '二级用能单元', scopeType: 'device', scopeId: 'v11-device-81', energyUnitId: 'eu-waste-heat-power', energyRole: '能源消费', energyTypeId: 'v11-energy-electricity', entryMode: 'monthly', annualAmount: 0, monthlyAmounts: [54000,52000,56000,57000,58000,59000,60000,59500,58000,57000,59000,61000] },
  { energyRecordId: 'v11-er-device-82', year: 2026, scopeLevel: '二级用能单元', scopeType: 'device', scopeId: 'v11-device-82', energyUnitId: 'eu-gas-boiler', energyRole: '能源消费', energyTypeId: 'v11-energy-natural-gas', entryMode: 'monthly', annualAmount: 0, monthlyAmounts: [78000,75000,81000,83500,86000,88000,90000,89500,87000,85000,88000,93000] },
];

// 查询页使用的公辅系统归属数据，统一维护在能源数据 Tab，避免分析页自行拼接。
seedEnergyRecords.push(
  { energyRecordId: 'v11-er-captive-power', year: 2026, scopeLevel: '二级用能单元', scopeType: 'energyUnit', scopeId: 'eu-captive-power', energyUnitId: 'eu-captive-power', energyRole: '能源消费', energyTypeId: 'v11-energy-coal', entryMode: 'monthly', annualAmount: 0, monthlyAmounts: [160,158,162,165,166,168,170,169,167,165,168,172] },
  { energyRecordId: 'v11-er-46', year: 2026, scopeLevel: seedEnergyRecords[1].scopeLevel, energyUnitId: 'eu-utilities', energyRole: seedEnergyRecords[0].energyRole, energyTypeId: 'v11-energy-electricity', entryMode: 'monthly', annualAmount: 0, monthlyAmounts: [2100000,2050000,2150000,2200000,2250000,2300000,2350000,2320000,2280000,2240000,2300000,2400000] },
  // 锅炉产汽已经通过转换记录进入能流；这里仅维护扣除外供后的一级分配结果，避免同一批蒸汽重复计入。
  { energyRecordId: 'v11-er-47', year: 2026, scopeLevel: seedEnergyRecords[1].scopeLevel, energyUnitId: 'eu-utilities', energyRole: seedEnergyRecords[0].energyRole, energyTypeId: 'v11-energy-steam', entryMode: 'monthly', annualAmount: 0, monthlyAmounts: [2400,2200,2500,2550,2750,2950,3000,2850,2650,2550,2750,2850] },
  { energyRecordId: 'v11-er-48', year: 2026, scopeLevel: seedEnergyRecords[1].scopeLevel, energyUnitId: 'eu-utilities', energyRole: seedEnergyRecords[0].energyRole, energyTypeId: 'v11-energy-compressed-air', entryMode: 'monthly', annualAmount: 0, monthlyAmounts: [490000,482000,504000,516000,528000,540000,552000,540000,528000,516000,538000,574000] },
);

const historyScaling: Record<number, number> = {
  2022: 0.865,
  2023: 0.902,
  2024: 0.936,
  2025: 0.969,
};
const historySourceRecords = seedEnergyRecords.filter((record) => record.year === 2026 && record.scopeType !== 'device');

// 历史年度沿用 2026 年已确认的能源结构和季节性，并体现产能逐年提升后的合理增长。
seedEnergyRecords.push(...historySourceRecords.flatMap((source) => {
  return Object.entries(historyScaling).map(([year, factor]) => ({
    ...source,
    energyRecordId: `${source.energyRecordId}-${year}`,
    year: Number(year),
    monthlyAmounts: source.monthlyAmounts.map((amount) => Math.round(amount * factor)),
  }));
}));

const seedEnergyCosts: V11EnergyCost[] = [
  { energyCostId: 'v11-cost-40', year: 2026, energyTypeId: 'v11-energy-electricity', monthlyCosts: [310,306,318,325,330,334,339,336,331,329,335,345] },
  { energyCostId: 'v11-cost-41', year: 2026, energyTypeId: 'v11-energy-coal', monthlyCosts: [78,75,80,82,83,84,86,85,84,83,85,93] },
  { energyCostId: 'v11-cost-42', year: 2026, energyTypeId: 'v11-energy-rdf', monthlyCosts: [13,12.5,13.4,14,14.5,14.8,15.2,15,14.6,14.2,14.8,15.5] },
  { energyCostId: 'v11-cost-43', year: 2026, energyTypeId: 'v11-energy-natural-gas', monthlyCosts: [32.4,31.6,33.8,34.7,36.1,36.8,37.9,37.4,36.6,35.9,36.7,39.2] },
  { energyCostId: 'v11-cost-44', year: 2026, energyTypeId: 'v11-energy-steam', monthlyCosts: [5.1,5.1,5.2,5.2,5.3,5.3,5.4,5.3,5.3,5.2,5.3,5.4] },
];

const seedConversionOutputs: V11ConversionOutput[] = [
  { conversionOutputId: 'v11-output-200', flowManaged: true, year: 2026, recordType: '余热发电', conversionEnergyUnitId: 'eu-waste-heat-power', inputMode: 'recovery', inputEnergyRecordId: 'v11-er-49', recoverySourceEnergyUnitId: 'eu-production-processing', recoveryEnergyName: '余热', recoveryAmount: 85000, recoveryUnit: 'GJ', monthlyInputAmounts: [6500,6200,7000,7200,7400,7600,7800,7600,7200,7000,7600,5900], outputAnalysisCategory: '电力', outputEnergyTypeId: 'v11-energy-electricity', outputEnergyName: '电力', outputUnit: 'kWh', outputAmount: 18300000, monthlyOutputAmounts: [1400000,1350000,1450000,1500000,1550000,1600000,1650000,1600000,1500000,1450000,1600000,1650000], internalAmount: 16300000, monthlyInternalAmounts: [1300000,1250000,1300000,1350000,1400000,1450000,1450000,1450000,1350000,1300000,1400000,1300000], externalAmount: 2000000, monthlyExternalAmounts: [100000,100000,150000,150000,150000,150000,200000,150000,150000,150000,200000,350000], lossAmount: 0, receiver: '恒远精密制造有限公司', remark: '生产加工过程余热经能源回收系统转换为电力。' },
  { conversionOutputId: 'v11-output-201', year: 2026, recordType: '锅炉产汽/产热', conversionEnergyUnitId: 'eu-gas-boiler', inputMode: 'linked', inputEnergyRecordId: 'v11-er-36', outputAnalysisCategory: '热力', outputEnergyTypeId: 'v11-energy-steam', outputEnergyName: '蒸汽', outputUnit: 'GJ', outputAmount: 52000, monthlyOutputAmounts: [4000,3800,4200,4300,4500,4600,4700,4500,4300,4200,4400,4500], internalAmount: 50000, monthlyInternalAmounts: [3900,3700,4050,4150,4350,4450,4500,4350,4150,4050,4200,4150], externalAmount: 2000, monthlyExternalAmounts: [100,100,150,150,150,150,200,150,150,150,200,350], lossAmount: 0, receiver: '宏盛食品有限公司', remark: '天然气经锅炉系统转换为蒸汽。' },
  { conversionOutputId: 'v11-output-202', year: 2026, recordType: '回收利用', conversionEnergyUnitId: 'eu-waste-heat-utilization', inputMode: 'recovery', inputEnergyRecordId: 'v11-er-recovery-device-70', recoverySourceEnergyUnitId: 'eu-cement-grinding-line', recoveryEnergyName: '余热', recoveryAmount: 17180, recoveryUnit: 'GJ', monthlyInputAmounts: [1250,1180,1320,1380,1450,1510,1580,1540,1460,1390,1500,1620], outputAnalysisCategory: '热力', outputEnergyTypeId: 'v11-energy-steam', outputEnergyName: '蒸汽', outputUnit: 'GJ', outputAmount: 12500, monthlyOutputAmounts: [900,850,950,1000,1050,1100,1150,1120,1060,1020,1100,1200], internalAmount: 12260, monthlyInternalAmounts: [880,830,930,980,1030,1080,1130,1100,1040,1000,1080,1180], externalAmount: 0, monthlyExternalAmounts: [0,0,0,0,0,0,0,0,0,0,0,0], lossAmount: 240, monthlyLossAmounts: [20,20,20,20,20,20,20,20,20,20,20,20], outputTargetEnergyUnitId: 'eu-production-processing', receiver: '', remark: '1#注塑机冷却系统产生的余热，经余热回收利用系统转换为蒸汽（余热回收来源），供生产加工区域厂内使用。' },
  { conversionOutputId: 'v11-output-captive-power', year: 2026, recordType: '其他转换', conversionEnergyUnitId: 'eu-captive-power', inputMode: 'linked', inputEnergyRecordId: 'v11-er-captive-power', inputAnalysisCategory: '化石燃料', inputEnergyTypeId: 'v11-energy-coal', inputAmount: 1990, inputUnit: 't', monthlyInputAmounts: [160,158,162,165,166,168,170,169,167,165,168,172], outputAnalysisCategory: '电力', outputEnergyTypeId: 'v11-energy-electricity', outputEnergyName: '电力', outputUnit: 'kWh', outputAmount: 9910000, monthlyOutputAmounts: [800000,810000,810000,820000,820000,830000,840000,840000,830000,820000,830000,860000], internalAmount: 9910000, monthlyInternalAmounts: [800000,810000,810000,820000,820000,830000,840000,840000,830000,820000,830000,860000], externalAmount: 0, monthlyExternalAmounts: [0,0,0,0,0,0,0,0,0,0,0,0], lossAmount: 0, outputTargetEnergyUnitId: 'eu-clinker-line-1', receiver: '', remark: '企业自备燃料发电机组，产出电力全部供厂内使用。' },
  { conversionOutputId: 'v11-output-pressure-recovery', year: 2026, recordType: '回收利用', conversionEnergyUnitId: 'eu-pressure-recovery', inputMode: 'recovery', inputEnergyRecordId: 'v11-er-recovery-pressure', recoverySourceEnergyUnitId: 'eu-utilities', recoveryEnergyName: '余压', recoveryAmount: 40.4, recoveryUnit: 'tce', monthlyInputAmounts: [3.0,3.1,3.2,3.3,3.4,3.5,3.6,3.5,3.4,3.3,3.4,3.7], outputAnalysisCategory: '其他能源', outputEnergyTypeId: 'v11-energy-compressed-air', outputEnergyName: '压缩空气', outputUnit: 'Nm³', outputAmount: 808000, monthlyOutputAmounts: [60000,62000,64000,66000,68000,70000,72000,70000,68000,66000,68000,74000], internalAmount: 808000, monthlyInternalAmounts: [60000,62000,64000,66000,68000,70000,72000,70000,68000,66000,68000,74000], externalAmount: 0, monthlyExternalAmounts: [0,0,0,0,0,0,0,0,0,0,0,0], lossAmount: 0, outputTargetEnergyUnitId: 'eu-utilities', receiver: '', remark: '动力中心生产过程余压经回收系统转换为厂内压缩空气。' },
];

// Keep historical analysis connected to the same conversion chain as the current year.
// Historical input record IDs point to the corresponding scaled energy records above.
const historicalConversionOutputs = Object.entries(historyScaling).flatMap(([year, factor]) =>
  seedConversionOutputs.map((source) => ({
    ...source,
    conversionOutputId: `${source.conversionOutputId}-${year}`,
    year: Number(year),
    inputEnergyRecordId: source.inputEnergyRecordId ? `${source.inputEnergyRecordId}-${year}` : undefined,
    recoveryAmount: source.recoveryAmount == null ? source.recoveryAmount : Math.round(source.recoveryAmount * factor),
    inputAmount: source.inputAmount == null ? source.inputAmount : Math.round(source.inputAmount * factor),
    outputAmount: source.outputAmount == null ? source.outputAmount : Math.round(source.outputAmount * factor),
    internalAmount: source.internalAmount == null ? source.internalAmount : Math.round(source.internalAmount * factor),
    externalAmount: Math.round(source.externalAmount * factor),
    lossAmount: source.lossAmount == null ? source.lossAmount : Math.round(source.lossAmount * factor),
    monthlyInputAmounts: source.monthlyInputAmounts?.map((amount) => Math.round(amount * factor)),
    monthlyOutputAmounts: source.monthlyOutputAmounts?.map((amount) => Math.round(amount * factor)),
    monthlyInternalAmounts: source.monthlyInternalAmounts?.map((amount) => Math.round(amount * factor)),
    monthlyExternalAmounts: source.monthlyExternalAmounts?.map((amount) => Math.round(amount * factor)),
    monthlyLossAmounts: source.monthlyLossAmounts?.map((amount) => Math.round(amount * factor)),
  })),
);
const seedCompressedAirConversion: V11ConversionOutput = {
  conversionOutputId: 'v11-output-compressed-air-2026',
  year: 2026,
  recordType: '空压产气/压缩空气',
  conversionEnergyUnitId: 'eu-compressed-air',
  inputMode: 'linked',
  inputEnergyRecordId: 'v11-er-51',
  inputAnalysisCategory: '电力',
  inputEnergyTypeId: 'v11-energy-electricity',
  inputUnit: 'kWh',
  outputAnalysisCategory: '其他能源',
  outputEnergyTypeId: 'v11-energy-compressed-air',
  outputEnergyName: '压缩空气',
  outputUnit: 'Nm³',
  outputAmount: 5500000,
  monthlyOutputAmounts: [430000,420000,440000,450000,460000,470000,480000,470000,460000,450000,470000,500000],
  internalAmount: 5500000,
  monthlyInternalAmounts: [430000,420000,440000,450000,460000,470000,480000,470000,460000,450000,470000,500000],
  externalAmount: 0,
  monthlyExternalAmounts: Array(12).fill(0),
  lossAmount: 0,
  outputTargetEnergyUnitId: 'eu-utilities',
  receiver: '',
  remark: '空压机电力投入转换为压缩空气，供厂内用气设备使用。',
};
const allSeedConversionOutputs = [...seedConversionOutputs, ...historicalConversionOutputs, seedCompressedAirConversion];

const seedOperations: V11OperationMetric[] = [
  { operationMetricId: 'v11-operation-50', metricCode: 'industrial_added_value', productId: null, year: 2026, scopeLevel: '企业', energyUnitId: null, metricCategory: '经济指标', aggregationMethod: '年度单值', metricName: '工业增加值', metricUnit: '万元', entryMode: 'annual', annualValue: 56000, monthlyValues: [] },
  { operationMetricId: 'v11-operation-55', metricCode: 'product_output', productId: null, year: 2026, scopeLevel: '企业', energyUnitId: null, metricCategory: '产量指标', aggregationMethod: '月度求和', metricName: '企业产品产量', metricUnit: 't', entryMode: 'monthly', annualValue: 0, monthlyValues: [22500,21800,23200,23800,24500,24900,25200,25100,24700,24400,25000,26000] },
  { operationMetricId: 'v11-operation-product-a-enterprise', metricCode: 'product_output', productId: 'product-a', year: 2026, scopeLevel: '一级用能单元', energyUnitId: 'eu-clinker-line-1', metricCategory: '产量指标', aggregationMethod: '年度单值', metricName: '产品产量', metricUnit: 't', entryMode: 'annual', annualValue: 956700, monthlyValues: [] },
  { operationMetricId: 'v11-operation-56', metricCode: 'industrial_output_value', productId: null, year: 2026, scopeLevel: '企业', energyUnitId: null, metricCategory: '经济指标', aggregationMethod: '年度单值', metricName: '工业总产值', metricUnit: '万元', entryMode: 'annual', annualValue: 286000, monthlyValues: [] },
  { operationMetricId: 'v11-operation-51', metricCode: 'product_output', productId: 'product-a', year: 2026, scopeLevel: '一级用能单元', energyUnitId: 'eu-clinker-line-1', metricCategory: '产量指标', aggregationMethod: '月度求和', metricName: '产品产量', metricUnit: 't', entryMode: 'monthly', annualValue: 0, monthlyValues: [76000,73500,78000,79200,80500,81200,82000,81600,80400,79800,81000,83500] },
  { operationMetricId: 'v11-operation-53', metricCode: 'product_output', productId: 'product-b', year: 2026, scopeLevel: '一级用能单元', energyUnitId: 'eu-clinker-line-1', metricCategory: '产量指标', aggregationMethod: '月度求和', metricName: '产品产量', metricUnit: 't', entryMode: 'monthly', annualValue: 0, monthlyValues: [30000,28500,31000,31500,32000,32500,33000,32800,32200,31800,32500,33800] },
  { operationMetricId: 'v11-operation-product-b-annual', metricCode: 'product_output', productId: 'product-b', year: 2026, scopeLevel: '一级用能单元', energyUnitId: 'eu-cement-grinding-line', metricCategory: '产量指标', aggregationMethod: '年度单值', metricName: '产品产量', metricUnit: 't', entryMode: 'annual', annualValue: 1260000, monthlyValues: [] },
  { operationMetricId: 'v11-operation-product-b-monthly', metricCode: 'product_output', productId: 'product-b', year: 2026, scopeLevel: '一级用能单元', energyUnitId: 'eu-cement-grinding-line', metricCategory: '产量指标', aggregationMethod: '月度求和', metricName: '产品产量', metricUnit: 't', entryMode: 'monthly', annualValue: 0, monthlyValues: [7600,7350,7800,7900,8000,7400,8200,8100,8000,7900,8100,8400] },
  { operationMetricId: 'v11-operation-utility-volume', metricCode: 'energy_supply', productId: null, year: 2026, scopeLevel: '一级用能单元', energyUnitId: 'eu-utilities', metricCategory: '运行指标', aggregationMethod: '月度求和', metricName: '动力中心供能量', metricUnit: 'GJ', entryMode: 'monthly', annualValue: 0, monthlyValues: [420,405,438,450,465,480,495,488,472,460,478,510] },
  { operationMetricId: 'v11-operation-office-area', metricCode: 'building_area', productId: null, year: 2026, scopeLevel: '一级用能单元', energyUnitId: 'eu-office', metricCategory: '运行指标', aggregationMethod: '年度单值', metricName: '办公建筑面积', metricUnit: 'm²', entryMode: 'annual', annualValue: 18500, monthlyValues: [] },
  // 仓储物流区域暂不提供“货物吞吐量”，用于展示指标待补充及跳转运营数据的场景。
  // 2025 年保留同一产量口径，用于同比计算；异常应由真实数据变化触发，而不是由断崖式 mock 值制造。
  { operationMetricId: 'v11-operation-product-b-2025-baseline', metricCode: 'product_output', productId: 'product-b', year: 2025, scopeLevel: '一级用能单元', energyUnitId: 'eu-cement-grinding-line', metricCategory: '产量指标', aggregationMethod: '月度求和', metricName: '产品产量', metricUnit: 't', entryMode: 'monthly', annualValue: 0, monthlyValues: [7600,7350,7800,7900,8000,8000,8200,8100,8000,7900,8100,8400] },
];

/** 重点用能设备字典样例：仅保留具有显著用能、独立计量或优化价值的典型设备。 */
const operationHistoryScaling: Record<number, number> = {
  2022: 0.830,
  2023: 0.868,
  2024: 0.910,
  2025: 0.955,
};
// 生产车间B 已提供一份明确的 2025 基线。不要再把 2026 月度记录复制成另一份 2025
// 历史记录，否则同比计算会把同一产量口径重复计入，导致同比被不合理放大。
const operationHistorySources = seedOperations
  .filter((source) => ![
    'v11-operation-product-b-monthly',
    'v11-operation-product-b-2025-baseline',
  ].includes(source.operationMetricId))
  .map(cloneOperation);

// 产量和经营指标的历史增长略快于能源消费，反映产能爬坡及单位能耗逐年改善。
seedOperations.push(...operationHistorySources.flatMap((source) => Object.entries(operationHistoryScaling).map(([year, factor]) => ({
  ...source,
  operationMetricId: `${source.operationMetricId}-${year}`,
  year: Number(year),
  annualValue: source.annualValue ? Math.round(source.annualValue * factor) : 0,
  monthlyValues: source.monthlyValues.map((value) => Math.round(value * factor)),
}))));


const industrialDeviceDictionary: V11KeyDevice[] = [
  { deviceId: 'v11-device-60', deviceName: '1#数控加工中心', deviceType: '加工设备', energyUnitId: 'eu-raw-material', mainEnergyTypeId: 'v11-energy-electricity', outputBasis: '加工件产量', remark: '三轴数控加工，生产车间A重点用电设备' },
  { deviceId: 'v11-device-63', deviceName: '2#数控加工中心', deviceType: '加工设备', energyUnitId: 'eu-clinker-line-1', mainEnergyTypeId: 'v11-energy-electricity', outputBasis: '加工件产量', remark: '五轴数控加工，直属生产车间A' },
  { deviceId: 'v11-device-64', deviceName: '连续式热处理炉', deviceType: '加热/锅炉设备', energyUnitId: 'eu-clinker-line-1', mainEnergyTypeId: 'v11-energy-natural-gas', outputBasis: '热处理件产量', remark: '天然气加热，直属生产车间A' },
  { deviceId: 'v11-device-66', deviceName: '颚式破碎机', deviceType: '加工设备', energyUnitId: 'eu-raw-material', mainEnergyTypeId: 'v11-energy-electricity', outputBasis: '原料处理量', remark: '原料预处理重点设备' },
  { deviceId: 'v11-device-70', deviceName: '1#注塑机', deviceType: '加工设备', energyUnitId: 'eu-cement-grinding-line', mainEnergyTypeId: 'v11-energy-electricity', outputBasis: '注塑件产量', remark: '直属生产车间B的主生产设备' },
  { deviceId: 'v11-device-74', deviceName: '自动喷涂线', deviceType: '表面处理设备', energyUnitId: 'eu-production-processing', mainEnergyTypeId: 'v11-energy-electricity', outputBasis: '喷涂面积', remark: '喷涂及输送联动生产线' },
  { deviceId: 'v11-device-78', deviceName: '冷却水循环泵组', deviceType: '泵类', energyUnitId: 'eu-utilities', mainEnergyTypeId: 'v11-energy-electricity', outputBasis: '循环水量', remark: '直属动力中心的公辅循环设备' },
  { deviceId: 'v11-device-62', deviceName: '1#螺杆空压机', deviceType: '空压设备', energyUnitId: 'eu-compressed-air', mainEnergyTypeId: 'v11-energy-electricity', outputBasis: '供气量', remark: '额定排气量 20m³/min' },
  { deviceId: 'v11-device-79', deviceName: '2#螺杆空压机', deviceType: '空压设备', energyUnitId: 'eu-compressed-air', mainEnergyTypeId: 'v11-energy-electricity', outputBasis: '供气量', remark: '备用及调峰空压设备' },
  { deviceId: 'v11-device-81', deviceName: '余热发电机组', deviceType: '能源转换设备', energyUnitId: 'eu-waste-heat-power', mainEnergyTypeId: 'v11-energy-electricity', outputBasis: '发电量', remark: '余热回收发电辅助用电设备' },
  { deviceId: 'v11-device-82', deviceName: '2t/h天然气蒸汽锅炉', deviceType: '加热/锅炉设备', energyUnitId: 'eu-gas-boiler', mainEnergyTypeId: 'v11-energy-natural-gas', outputBasis: '蒸汽产量', remark: '公辅蒸汽供应设备' },
  { deviceId: 'v11-device-83', deviceName: '自备燃料发电机组', deviceType: '能源转换设备', energyUnitId: 'eu-captive-power', mainEnergyTypeId: 'v11-energy-coal', outputBasis: '发电量', remark: '企业自备电源，燃料投入转换为厂内电力' },
  { deviceId: 'v11-device-84', deviceName: '余压透平回收机组', deviceType: '能源转换设备', energyUnitId: 'eu-pressure-recovery', mainEnergyTypeId: 'v11-energy-waste-pressure', outputBasis: '回收压缩空气量', remark: '动力中心余压回收利用设备' },
];

const seedDevices = industrialDeviceDictionary.map((item) => ({ ...item }));

// 仅将 2026 年余压回收的 12 月投入留空，演示源台账补充流程；历史年度保留原值。
const missingPressureInput = seedEnergyRecords.find((item) => item.energyRecordId === 'v11-er-recovery-pressure')!;
missingPressureInput.monthlyAmounts[11] = 0;
missingPressureInput.monthlyReportedMonths = Array.from({ length: 12 }, (_, index) => index !== 11);

const annualEnergyTypes = createAnnualStore(seedEnergyTypes);
// 列表仅展示企业已维护的品种；完整预设仍保留在各表单下拉中。
const annualListedEnergyTypeIds = createAnnualStore([
  'v11-energy-electricity', 'v11-energy-steam', 'v11-energy-coal',
  'v11-energy-natural-gas', 'v11-energy-rdf', 'v11-energy-biomass', 'v11-energy-compressed-air',
  'v11-energy-waste-heat', 'v11-energy-waste-pressure',
  'v11-output-electricity', 'v11-output-steam', 'v11-output-hot-water', 'v11-output-compressed-air', 'v11-output-cold',
]);
const annualDisabledTypes = createAnnualStore<string>([]);
let energyRecords = seedEnergyRecords.map(cloneRecord);
let energyCosts = seedEnergyCosts.map(cloneCost);
let conversionOutputs: V11ConversionOutput[] = allSeedConversionOutputs.map((item) => ({
  ...item,
  outputTargetEnergyUnitId: item.outputTargetEnergyUnitId
    ?? (item.recordType === '锅炉产汽/产热' || item.recordType === '回收利用' ? 'eu-raw-material' : item.recordType === '余热发电' ? 'eu-production-processing' : undefined),
}));
let externalSupplyRecords: V11ExternalSupplyRecord[] = allSeedConversionOutputs
  .filter((item) => item.recordType === '直接外供' || (item.externalAmount ?? 0) > 0)
  .map((item) => ({
    externalSupplyId: `v11-external-legacy-${item.conversionOutputId}`,
    year: item.year,
    inputEnergyRecordId: item.recordType === '直接外供' ? item.inputEnergyRecordId : undefined,
    conversionOutputId: item.recordType === '直接外供' ? undefined : item.conversionOutputId,
    energyTypeId: item.outputEnergyTypeId ?? (item.recordType === '直接外供' ? undefined : item.inputEnergyTypeId),
    amount: item.recordType === '直接外供' ? item.externalAmount : (item.externalAmount ?? 0),
    unit: item.outputUnit ?? item.inputUnit,
    monthlyAmounts: item.monthlyExternalAmounts ? [...item.monthlyExternalAmounts] : undefined,
    receiver: item.receiver,
    remark: item.remark,
  }));
let operations = seedOperations.map(cloneOperation);
const annualDevices = createAnnualStore(seedDevices);
let sequence = 100;

function cloneRecord(item: V11EnergyRecord): V11EnergyRecord {
  const scopeType = item.scopeType
    ?? (item.scopeLevel === '企业' ? 'enterprise' : 'energyUnit');
  return {
    ...item,
    scopeType,
    scopeId: item.scopeId ?? (scopeType === 'enterprise' ? null : item.energyUnitId),
    monthlyAmounts: [...item.monthlyAmounts],
    monthlyReportedMonths: item.monthlyReportedMonths ? [...item.monthlyReportedMonths] : undefined,
  };
}
function cloneCost(item: V11EnergyCost): V11EnergyCost {
  return { ...item, monthlyCosts: [...item.monthlyCosts], monthlyReportedMonths: item.monthlyReportedMonths ? [...item.monthlyReportedMonths] : undefined };
}
function cloneOperation(item: V11OperationMetric): V11OperationMetric {
  return { ...item, monthlyValues: [...item.monthlyValues] };
}

// Balance completion: the source ledger contains level-one allocation while
// only a small part has level-two terminal data. Complete the missing
// terminal path at monthly granularity; annual totals then roll up naturally.
const annualCompletionChildren: Record<string, string[]> = {
  'eu-clinker-line-1': ['eu-raw-material', 'eu-clinker-burning', 'eu-quality-inspection'],
  'eu-cement-grinding-line': ['eu-cement-grinding', 'eu-production-processing', 'eu-packaging'],
  // Conversion systems have their own measured input/output records and must
  // not inherit every energy type from the parent utility center.
  'eu-utilities': ['eu-compressed-air'],
  'eu-office': ['eu-office-hvac'],
};
const energyTypeById = new Map(seedEnergyTypes.map((item) => [item.energyTypeId, item]));
const annualAmount = (record: V11EnergyRecord) => record.annualAmount > 0
  ? record.annualAmount
  : record.monthlyAmounts.reduce((total, value) => total + value, 0);
const linkedConversionInputs = new Set(
  conversionOutputs.map((item) => item.inputEnergyRecordId).filter(Boolean),
);
const completionCandidates = Object.entries(annualCompletionChildren).flatMap(([parentId, children]) => {
  const levelOne = energyRecords.filter((record) => record.year === 2026
    && record.energyUnitId === parentId
    && record.scopeType !== 'device'
    && !linkedConversionInputs.has(record.energyRecordId));
  const byType = new Map<string, number>();
  levelOne.forEach((record) => byType.set(record.energyTypeId,
    (byType.get(record.energyTypeId) ?? 0) + annualAmount(record)));
  const existingByType = new Map<string, number>();
  energyRecords.filter((record) => record.year === 2026
    && record.energyUnitId
    && children.includes(record.energyUnitId)
    && record.scopeType !== 'device'
    && !linkedConversionInputs.has(record.energyRecordId))
    .forEach((record) => existingByType.set(record.energyTypeId,
      (existingByType.get(record.energyTypeId) ?? 0) + annualAmount(record)));
  return [...byType.entries()].flatMap(([energyTypeId, allocatedPhysical]) => {
    const type = energyTypeById.get(energyTypeId);
    if (!type || type.standardCoalFactor <= 0) return [];
    const existingPhysical = existingByType.get(energyTypeId) ?? 0;
    const missingStandard = Math.max(allocatedPhysical - existingPhysical, 0) * type.standardCoalFactor
      / (type.standardCoalFactorUnit.startsWith('kgce') ? 1000 : 1);
    return children.map((childId, index) => ({
      energyRecordId: `v11-er-completion-${parentId}-${energyTypeId}-${index}`,
      parentId,
      childId,
      childCount: children.length,
      energyTypeId,
      missingStandard: missingStandard / children.length,
      factor: type.standardCoalFactor,
      factorUnit: type.standardCoalFactorUnit,
    }));
  });
});
const monthlyMissingByKey = new Map<string, number[]>();
Object.entries(annualCompletionChildren).forEach(([parentId, children]) => {
  const levelOne = energyRecords.filter((record) => record.year === 2026
    && record.energyUnitId === parentId
    && record.scopeType !== 'device'
    && !linkedConversionInputs.has(record.energyRecordId));
  const existing = energyRecords.filter((record) => record.year === 2026
    && record.energyUnitId
    && children.includes(record.energyUnitId)
    && record.scopeType !== 'device'
    && !linkedConversionInputs.has(record.energyRecordId));
  const typeIds = new Set([...levelOne, ...existing].map((record) => record.energyTypeId));
  typeIds.forEach((energyTypeId) => {
    const type = energyTypeById.get(energyTypeId);
    if (!type || type.standardCoalFactor <= 0) return;
    const values = Array.from({ length: 12 }, (_, month) => {
      const allocated = levelOne
        .filter((record) => record.energyTypeId === energyTypeId)
        .reduce((total, record) => total + (record.monthlyAmounts[month] ?? 0), 0);
      const used = existing
        .filter((record) => record.energyTypeId === energyTypeId)
        .reduce((total, record) => total + (record.monthlyAmounts[month] ?? 0), 0);
      return Math.max(allocated - used, 0) * type.standardCoalFactor
        / (type.standardCoalFactorUnit.startsWith('kgce') ? 1000 : 1);
    });
    monthlyMissingByKey.set(`${parentId}|${energyTypeId}`, values);
  });
});
const monthlyBranchStandard = Array.from({ length: 12 }, (_, month) => conversionOutputs.reduce((total, output) => {
  const outputType = energyTypeById.get(output.outputEnergyTypeId ?? '');
  const external = (output.monthlyExternalAmounts?.[month] ?? 0) * (outputType?.standardCoalFactor ?? 0)
    / (outputType?.standardCoalFactorUnit.startsWith('kgce') ? 1000 : 1);
  const recovery = output.inputMode === 'recovery'
    ? (output.monthlyInputAmounts?.[month] ?? 0) * (energyTypeById.get('v11-energy-waste-heat')?.standardCoalFactor ?? 0)
    : 0;
  return total + external + recovery;
}, 0));
const monthlyScale = Array.from({ length: 12 }, (_, month) => {
  const total = [...monthlyMissingByKey.values()].reduce((sum, values) => sum + values[month], 0);
  return total > 0 ? Math.max(total - monthlyBranchStandard[month], 0) / total : 0;
});
const completionRows = completionCandidates.map((row) => ({
  energyRecordId: row.energyRecordId,
  year: 2026,
  scopeLevel: '二级用能单元' as const,
  energyUnitId: row.childId,
  energyRole: '能源消费' as const,
  energyTypeId: row.energyTypeId,
  entryMode: 'monthly' as const,
  annualAmount: 0,
  monthlyAmounts: Array.from({ length: 12 }, (_, month) => {
    const missing = monthlyMissingByKey.get(`${row.parentId}|${row.energyTypeId}`)?.[month] ?? 0;
    return missing / row.childCount * monthlyScale[month]
      / row.factor * (row.factorUnit.startsWith('kgce') ? 1000 : 1);
  }),
}));

function nextId(prefix: string) {
  sequence += 1;
  return `${prefix}-${sequence}`;
}

export function listV11EnergyTypes(year = 2026) {
  const energyTypes = annualEnergyTypes.get(year); return energyTypes.map((item) => ({ ...item })); }
export function listV11ListedEnergyTypeIds(year = 2026) { return [...annualListedEnergyTypeIds.get(year)]; }
export function listV11EnergyTypeReferences(id: string, year = 2026): V11EnergyTypeReferenceSummary[] {
  const devices = annualDevices.get(year);
  const references: V11EnergyTypeReferenceSummary[] = [
    { kind: 'energyUnitRelations', label: '用能单元能源关系', count: listEnergyUnits(year).filter((unit) => unit.energyRelations?.some((relation) => relation.inputEnergyTypeId === id || relation.outputEnergyTypeId === id)).length, path: `/data-management/units?year=${year}` },
    { kind: 'energyRecords', label: '能源数据', count: energyRecords.filter((item) => item.year === year && item.energyTypeId === id).length, path: `/data-management/energy-data?energyTypeId=${encodeURIComponent(id)}&year=${year}` },
    { kind: 'energyCosts', label: '能源成本', count: energyCosts.filter((item) => item.year === year && item.energyTypeId === id).length, path: `/data-management/energy-data?tab=costs&energyTypeId=${encodeURIComponent(id)}&year=${year}` },
    { kind: 'keyDevices', label: '重点设备', count: devices.filter((item) => item.mainEnergyTypeId === id).length, path: `/data-management/devices?energyTypeId=${encodeURIComponent(id)}&year=${year}` },
    { kind: 'conversionOutputs', label: '能源转换回收与外供', count: conversionOutputs.filter((item) => item.year === year && (item.inputEnergyTypeId === id || item.outputEnergyTypeId === id)).length, path: `/data-management/energy-data?tab=recovery&energyTypeId=${encodeURIComponent(id)}&year=${year}` },
  ];
  return references.filter((item) => item.count > 0);
}
export function disableV11EnergyType(id: string, year = 2026) {
  const energyTypes = annualEnergyTypes.get(year);
  if (!energyTypes.some((item) => item.energyTypeId === id)) return { ok: false as const, error: '能源品种不存在。' };
  const ids = annualDisabledTypes.get(year);
  if (!ids.includes(id)) ids.push(id);
  return { ok: true as const };
}
export function enableV11EnergyType(id: string, year = 2026) {
  const energyTypes = annualEnergyTypes.get(year);
  if (!energyTypes.some((item) => item.energyTypeId === id)) return { ok: false as const, error: '能源品种不存在。' };
  const ids = annualDisabledTypes.get(year);
  const index = ids.indexOf(id);
  if (index >= 0) ids.splice(index, 1);
  return { ok: true as const };
}
export function isV11EnergyTypeEnabled(id: string, year = 2026) { return !annualDisabledTypes.get(year).includes(id); }
export function listV11EnergyRecords() { return energyRecords.map(cloneRecord); }
export function listV11EnergyCosts() { return energyCosts.map(cloneCost); }
export function listV11ConversionOutputs() { return conversionOutputs.map(resolveFlowConversion); }

function resolveFlowConversion(raw: V11ConversionOutput): V11ConversionOutput {
  const item = { ...raw, monthlyOutputAmounts: raw.monthlyOutputAmounts?.map((value, i) => raw.monthlyOutputReported?.[i] === false ? 0 : value) };
  if (item.flowManaged) {
    const supplies = externalSupplyRecords.filter((supply) => supply.conversionOutputId === item.conversionOutputId);
    item.externalAmount = supplies.reduce((total, supply) => total + supply.amount, 0);
    item.monthlyExternalAmounts = Array.from({ length: 12 }, (_, i) => supplies.reduce((total, supply) => total + (supply.monthlyAmounts?.[i] ?? 0), 0));
    item.internalAmount = Math.max(0, (item.outputAmount ?? 0) - item.externalAmount - (item.lossAmount ?? 0));
    item.monthlyInternalAmounts = item.monthlyOutputAmounts?.map((value, i) => Math.max(0, value - item.monthlyExternalAmounts![i] - (item.monthlyLossAmounts?.[i] ?? 0)));
  }
  return item;
}

/** 一次保存关联或本期补充；旧年度数据保留，未填月份与零值分开。 */
export function saveFlowConversion(input: Omit<V11ConversionOutput, 'conversionOutputId'>, id?: string) {
  if (id && conversionOutputs.some((item) => item.conversionOutputId === id && item.year !== input.year)) return { ok: false as const, error: '不能跨年度修改记录，请切换到记录所属年度。' };
  if (!input.conversionEnergyUnitId || !input.outputEnergyTypeId) return { ok: false as const, error: '请选择转换系统和产出能源。' };
  const previous = id ? conversionOutputs.find((item) => item.conversionOutputId === id) : undefined;
  const preservingLegacyInput = previous?.inputMode === 'manual' && input.inputMode === 'manual'
    && input.inputEnergyTypeId === previous.inputEnergyTypeId
    && input.inputAmount === previous.inputAmount && input.inputUnit === previous.inputUnit
    && JSON.stringify(input.monthlyInputAmounts) === JSON.stringify(previous.monthlyInputAmounts);
  if (input.inputEnergyRecordId) {
    const source = energyRecords.find((item) => item.energyRecordId === input.inputEnergyRecordId);
    if (!source || source.year !== input.year) return { ok: false as const, error: '请选择同年度的投入记录。' };
    if (v11RecordScopeType(source) !== 'energyUnit' || !['能源消费', '回收能源'].includes(source.energyRole)) return { ok: false as const, error: '投入必须引用用能单元的能源消费或回收记录，不能引用设备数据。' };
    if (source.scopeLevel !== '二级用能单元' || source.energyUnitId !== input.conversionEnergyUnitId) return { ok: false as const, error: '请选择本用能单元的二级能源消费记录。' };
    if (conversionOutputs.some((item) => item.conversionOutputId !== id && item.year === input.year && item.inputEnergyRecordId === source.energyRecordId)) return { ok: false as const, error: '该投入记录已被使用，不能重复计入转换投入。' };
  } else if (!preservingLegacyInput && (!input.recoveryEnergyName || !input.recoverySourceEnergyUnitId)) return { ok: false as const, error: '无关联投入时，请选择回收来源及回收能源。' };
  const output = listV11EnergyTypes(input.year).find((item) => item.energyTypeId === input.outputEnergyTypeId);
  if (!output) return { ok: false as const, error: '产出能源不存在。' };
  if (conversionOutputs.some((item) => item.conversionOutputId !== id && item.year === input.year && item.conversionEnergyUnitId === input.conversionEnergyUnitId && item.outputEnergyTypeId === input.outputEnergyTypeId)) return { ok: false as const, error: '该系统本年度已有相同能源产出，请编辑已有记录。' };
  const values = [...(input.monthlyInputAmounts ?? []), ...(input.monthlyOutputAmounts ?? []), ...(input.monthlyLossAmounts ?? [])];
  if (values.some((value) => !Number.isFinite(value) || value < 0)) return { ok: false as const, error: '数量必须是非负数。' };
  const newId = id ?? nextId('v11-output');
  const record = { ...input, flowManaged: true, conversionOutputId: newId, outputUnit: output.measurementUnit, outputEnergyName: output.energyTypeName, outputAnalysisCategory: output.analysisCategory };
  const resolved = resolveFlowConversion(record);
  if ((resolved.monthlyOutputAmounts ?? []).some((amount, i) => (resolved.monthlyOutputReported?.[i] ?? true) && amount + 1e-8 < (resolved.monthlyExternalAmounts?.[i] ?? 0) + (resolved.monthlyLossAmounts?.[i] ?? 0))) return { ok: false as const, error: '产出不能小于该月已登记外供与已确认损失。' };
  if (id) {
    const index = conversionOutputs.findIndex((item) => item.conversionOutputId === id);
    if (index < 0) return { ok: false as const, error: '转换记录不存在。' };
    conversionOutputs[index] = record;
  } else conversionOutputs.push(record);
  return { ok: true as const };
}
export function listV11ExternalSupplyRecords() {
  return externalSupplyRecords.map((item) => ({ ...item, monthlyAmounts: item.monthlyAmounts ? [...item.monthlyAmounts] : undefined, evidenceNames: item.evidenceNames ? [...item.evidenceNames] : undefined }));
}
export function listV11OperationMetrics() { return operations.map(cloneOperation); }
export function listV11KeyDevices(year = 2026) {
  const devices = annualDevices.get(year); return devices.map((item) => ({ ...item })); }

export function v11RecordScopeType(record: V11EnergyRecord): EnergyRecordScopeType {
  return record.scopeType
    ?? (record.scopeLevel === '企业' ? 'enterprise' : 'energyUnit');
}

/**
 * 年度总量优先使用已补录的年度台账值；未补录时由已录月度值汇总。
 * 月度缺失不在此处自动分摊，避免将年度数据伪造成月度实测数据。
 */
export function v11EnergyRecordAnnualAmount(record: V11EnergyRecord) {
  const monthlyTotal = record.monthlyAmounts.reduce((sum, value, i) => sum + (record.monthlyReportedMonths?.[i] === false ? 0 : value), 0);
  return record.annualAmount > 0 ? record.annualAmount : monthlyTotal;
}

export function saveV11EnergyType(input: Omit<V11EnergyType, 'energyTypeId'>, id?: string, year = 2026) {
  if (input.energyTypeName.trim() === '回收蒸汽') return { ok: false as const, error: '请使用“蒸汽”能源品种，余热回收来源由投入能源及转换记录维护。' };
  const energyTypes = annualEnergyTypes.get(year);
  if (energyTypes.some((item) => item.energyTypeName.trim() === input.energyTypeName.trim() && item.energyTypeId !== id)) return { ok: false as const, error: '能源品种名称不能重复。' };
  if (id) {
    const index = energyTypes.findIndex((item) => item.energyTypeId === id);
    if (index < 0) return { ok: false as const, error: '能源品种不存在。' };
    energyTypes[index] = { ...input, energyTypeId: id };
    const listedIds = annualListedEnergyTypeIds.get(year);
    if (!listedIds.includes(id)) listedIds.push(id);
    return { ok: true as const };
  }
  const energyTypeId = nextId('v11-energy');
  energyTypes.push({ ...input, energyTypeId });
  annualListedEnergyTypeIds.get(year).push(energyTypeId);
  return { ok: true as const };
}

export function deleteV11EnergyType(id: string, year = 2026) {
  const energyTypes = annualEnergyTypes.get(year);
  const references = listV11EnergyTypeReferences(id, year).reduce((sum, item) => sum + item.count, 0);
  if (references) return { ok: false as const, error: `该能源品种存在 ${references} 条业务引用，不能删除。` };
  const index = energyTypes.findIndex((item) => item.energyTypeId === id);
  if (index >= 0) energyTypes.splice(index, 1);
  const listedIds = annualListedEnergyTypeIds.get(year);
  const listedIndex = listedIds.indexOf(id);
  if (listedIndex >= 0) listedIds.splice(listedIndex, 1);
  return { ok: true as const };
}

export function saveV11EnergyRecord(input: Omit<V11EnergyRecord, 'energyRecordId'>, id?: string) {
  if (id && energyRecords.some((item) => item.energyRecordId === id && item.year !== input.year)) return { ok: false as const, error: '不能跨年度修改记录，请切换到记录所属年度。' };
  if (!listV11EnergyTypes(input.year).some((type) => type.energyTypeId === input.energyTypeId)) return { ok: false as const, error: '请选择本年度的能源品种。' };
  if (input.energyUnitId && !listEnergyUnits(input.year).some((unit) => unit.energyUnitId === input.energyUnitId)) return { ok: false as const, error: '请选择本年度的用能单元。' };
  if (input.scopeType === 'device' && !listV11KeyDevices(input.year).some((device) => device.deviceId === input.scopeId)) return { ok: false as const, error: '请选择本年度的重点设备。' };
  const scopeType = input.scopeType
    ?? (input.scopeLevel === '企业' ? 'enterprise' : 'energyUnit');
  const scopeId = input.scopeId ?? (scopeType === 'enterprise' ? null : input.energyUnitId);
  const monthlyTotal = input.monthlyAmounts.reduce((sum, value, i) => sum + (input.monthlyReportedMonths?.[i] === false ? 0 : value), 0);
  const hasReportedMonth = input.monthlyReportedMonths?.some(Boolean) || monthlyTotal > 0;
  if (!hasReportedMonth && !(input.annualAmount > 0)) {
    return { ok: false as const, error: '请至少填写一个月度数据，或补录年度总量。' };
  }
  if (input.annualAmount > 0 && input.annualAmount < monthlyTotal) {
    return { ok: false as const, error: '年度总量不能小于已填报月份合计。' };
  }
  const normalized = {
    ...input,
    entryMode: hasReportedMonth ? 'monthly' as const : 'annual' as const,
    scopeType,
    scopeId,
  };
  const duplicate = energyRecords.some((item) => {
    const current = cloneRecord(item);
    return item.energyRecordId !== id
      && item.year === input.year
      && item.energyRole === input.energyRole
      && current.scopeType === scopeType
      && current.scopeId === scopeId
      && item.energyTypeId === input.energyTypeId;
  });
  if (duplicate) return { ok: false as const, error: '同一年度、归属对象和能源品种只能维护一条能源消费记录。' };
  if (id) {
    const index = energyRecords.findIndex((item) => item.energyRecordId === id);
    if (index < 0) return { ok: false as const, error: '能源数据不存在。' };
    energyRecords[index] = {
      ...normalized,
      energyRecordId: id,
      monthlyAmounts: [...input.monthlyAmounts],
      monthlyReportedMonths: input.monthlyReportedMonths ? [...input.monthlyReportedMonths] : undefined,
    };
    return { ok: true as const };
  }
  energyRecords.push({
    ...normalized,
    energyRecordId: nextId('v11-er'),
    monthlyAmounts: [...input.monthlyAmounts],
    monthlyReportedMonths: input.monthlyReportedMonths ? [...input.monthlyReportedMonths] : undefined,
  });
  return { ok: true as const };
}

export function deleteV11EnergyRecord(id: string) {
  const count = conversionOutputs.filter((item) => item.inputEnergyRecordId === id).length;
  const externalCount = externalSupplyRecords.filter((item) => item.inputEnergyRecordId === id).length;
  if (count || externalCount) return { ok: false as const, error: `该能源数据被 ${count + externalCount} 条能源转换或外供记录引用，不能删除。` };
  energyRecords = energyRecords.filter((item) => item.energyRecordId !== id);
  return { ok: true as const };
}

export function saveV11EnergyCost(input: Omit<V11EnergyCost, 'energyCostId'>, id?: string) {
  if (id && energyCosts.some((item) => item.energyCostId === id && item.year !== input.year)) return { ok: false as const, error: '不能跨年度修改记录，请切换到记录所属年度。' };
  if (!listV11EnergyTypes(input.year).some((type) => type.energyTypeId === input.energyTypeId)) return { ok: false as const, error: '请选择本年度的能源品种。' };
  if (energyCosts.some((item) => item.energyCostId !== id && item.year === input.year && item.energyTypeId === input.energyTypeId)) return { ok: false as const, error: '同一年度和能源品种只能维护一条成本数据。' };
  if (id) {
    const index = energyCosts.findIndex((item) => item.energyCostId === id);
    if (index < 0) return { ok: false as const, error: '能源成本不存在。' };
    energyCosts[index] = { ...input, energyCostId: id, monthlyCosts: [...input.monthlyCosts], monthlyReportedMonths: input.monthlyReportedMonths ? [...input.monthlyReportedMonths] : undefined };
  } else energyCosts.push({ ...input, energyCostId: nextId('v11-cost'), monthlyCosts: [...input.monthlyCosts], monthlyReportedMonths: input.monthlyReportedMonths ? [...input.monthlyReportedMonths] : undefined });
  return { ok: true as const };
}

export function deleteV11EnergyCost(id: string) {
  energyCosts = energyCosts.filter((item) => item.energyCostId !== id);
}

export function saveV11ConversionOutput(input: Omit<V11ConversionOutput, 'conversionOutputId'>, id?: string) {
  if (id && conversionOutputs.some((item) => item.conversionOutputId === id && item.year !== input.year)) return { ok: false as const, error: '不能跨年度修改记录，请切换到记录所属年度。' };
  const normalizedInput = {
    ...input,
    // 兼容历史记录：旧调用未提供产出去向时，暂以转换系统作为默认去向。
    outputTargetEnergyUnitId: input.outputTargetEnergyUnitId ?? (input.recordType === '回收利用' ? 'eu-raw-material' : input.recordType !== '直接外供' ? input.conversionEnergyUnitId ?? undefined : undefined),
  };
  const duplicate = conversionOutputs.some((item) =>
    item.conversionOutputId !== id
    && item.year === normalizedInput.year
    && item.recordType === normalizedInput.recordType
    && item.conversionEnergyUnitId === normalizedInput.conversionEnergyUnitId,
  );
  if (duplicate) return { ok: false as const, error: '该年度、该系统的同类业务记录已维护，请编辑已有记录。' };
  const amounts = [
    normalizedInput.outputAmount ?? 0,
    normalizedInput.internalAmount ?? 0,
    normalizedInput.externalAmount,
    normalizedInput.lossAmount ?? 0,
  ];
  if (amounts.some((amount) => !Number.isFinite(amount) || amount < 0)) {
    return { ok: false as const, error: '产出、内部去向、外部输出和损失量不能为负数。' };
  }
  if (normalizedInput.externalAmount > (normalizedInput.outputAmount ?? 0)) {
    return { ok: false as const, error: '外部输出量不能超过能源产出总量。' };
  }
  const monthlyFields = [
    normalizedInput.monthlyInputAmounts,
    normalizedInput.monthlyOutputAmounts,
    normalizedInput.monthlyInternalAmounts,
    normalizedInput.monthlyExternalAmounts,
    normalizedInput.monthlyLossAmounts,
  ].filter((values): values is number[] => Boolean(values));
  if (monthlyFields.some((values) => values.length !== 12 || values.some((value) => !Number.isFinite(value) || value < 0))) {
    return { ok: false as const, error: '转换月度数据必须填写12个月且不能为负数。' };
  }
  if (normalizedInput.monthlyOutputAmounts) {
    for (let index = 0; index < 12; index += 1) {
      const assigned = (normalizedInput.monthlyInternalAmounts?.[index] ?? 0)
        + (normalizedInput.monthlyExternalAmounts?.[index] ?? 0)
        + (normalizedInput.monthlyLossAmounts?.[index] ?? 0);
      if (Math.abs(normalizedInput.monthlyOutputAmounts[index] - assigned) > 1e-8) {
        return { ok: false as const, error: '转换月度产出与内部使用、外供及损失不平衡。' };
      }
    }
  }
  if (normalizedInput.inputMode === 'linked') {
    if (!normalizedInput.inputEnergyRecordId) return { ok: false as const, error: '关联投入模式必须选择上游能源数据记录。' };
    const source = energyRecords.find((item) => item.energyRecordId === normalizedInput.inputEnergyRecordId);
    if (!source) return { ok: false as const, error: '关联的投入能源数据不存在。' };
    if (source.year !== normalizedInput.year) return { ok: false as const, error: '转换记录与投入能源数据必须属于同一年度。' };
    if (!['能源消费', '回收能源'].includes(source.energyRole)) {
      return { ok: false as const, error: '只有能源消费或回收能源记录可以作为转换投入。' };
    }
  }
  if (normalizedInput.inputEnergyRecordId) {
    const source = energyRecords.find((item) => item.energyRecordId === normalizedInput.inputEnergyRecordId);
    const recoveryAlreadyUsed = source?.energyRole === '回收能源'
      && conversionOutputs.some((item) =>
        item.conversionOutputId !== id
        && item.inputEnergyRecordId === normalizedInput.inputEnergyRecordId);
    if (recoveryAlreadyUsed) {
      return { ok: false as const, error: '同一回收能源来源只能关联一条转换记录，避免重复计入能流。' };
    }
  }
  if (normalizedInput.inputMode === 'recovery'
    && (!(normalizedInput.recoveryAmount ?? 0) || !normalizedInput.recoveryEnergyName)) {
    return { ok: false as const, error: '回收能源模式必须填写回收能源品种和投入量。' };
  }
  if (normalizedInput.recordType === '直接外供' && normalizedInput.inputEnergyRecordId) {
    const source = energyRecords.find((item) => item.energyRecordId === normalizedInput.inputEnergyRecordId);
    if (!source) return { ok: false as const, error: '外供来源能源数据不存在。' };
    const sourceAmount = v11EnergyRecordAnnualAmount(source);
    if (normalizedInput.externalAmount > sourceAmount) return { ok: false as const, error: '外供量不能超过来源能源数据的年度总量。' };
  }
  if (normalizedInput.recordType !== '直接外供') {
    if (normalizedInput.outputTargetEnergyUnitId) {
      const targetUnit = listEnergyUnits(input.year).find((unit) => unit.energyUnitId === normalizedInput.outputTargetEnergyUnitId);
      if (!targetUnit || targetUnit.unitLevel === 'enterprise') return { ok: false as const, error: '产出去向必须绑定一级或二级用能单元。' };
    }
    const assigned = (normalizedInput.internalAmount ?? 0) + normalizedInput.externalAmount + (normalizedInput.lossAmount ?? 0);
    if (Math.abs((normalizedInput.outputAmount ?? 0) - assigned) > 1e-8) return { ok: false as const, error: '产出总量与内部使用、外供及损失/未分配量不平衡。' };
  }
  if (id) {
    const index = conversionOutputs.findIndex((item) => item.conversionOutputId === id);
    if (index < 0) return { ok: false as const, error: '能源转换/输出记录不存在。' };
    conversionOutputs[index] = { ...normalizedInput, conversionOutputId: id };
    syncLegacyExternalSupply(normalizedInput, id);
  } else {
    const newId = nextId('v11-output');
    conversionOutputs.push({ ...normalizedInput, conversionOutputId: newId });
    syncLegacyExternalSupply(normalizedInput, newId);
  }
  return { ok: true as const };
}

function syncLegacyExternalSupply(input: Omit<V11ConversionOutput, 'conversionOutputId'>, conversionOutputId: string) {
  if (input.recordType === '直接外供') {
    const existing = externalSupplyRecords.find((item) => item.externalSupplyId === `v11-external-legacy-${conversionOutputId}`);
    const next = {
      externalSupplyId: existing?.externalSupplyId ?? `v11-external-legacy-${conversionOutputId}`,
      year: input.year,
      inputEnergyRecordId: input.inputEnergyRecordId,
      amount: input.externalAmount,
      unit: input.inputUnit,
      monthlyAmounts: input.monthlyExternalAmounts ? [...input.monthlyExternalAmounts] : undefined,
      receiver: input.receiver,
      remark: input.remark,
    } satisfies V11ExternalSupplyRecord;
    if (existing) Object.assign(existing, next);
    else externalSupplyRecords.push(next);
  } else if (input.externalAmount > 0) {
    const existing = externalSupplyRecords.find((item) => item.externalSupplyId === `v11-external-legacy-${conversionOutputId}`);
    const next = {
      externalSupplyId: existing?.externalSupplyId ?? `v11-external-legacy-${conversionOutputId}`,
      year: input.year,
      conversionOutputId,
      energyTypeId: input.outputEnergyTypeId,
      amount: input.externalAmount,
      unit: input.outputUnit,
      monthlyAmounts: input.monthlyExternalAmounts ? [...input.monthlyExternalAmounts] : undefined,
      receiver: input.receiver,
      remark: input.remark,
    } satisfies V11ExternalSupplyRecord;
    if (existing) Object.assign(existing, next);
    else externalSupplyRecords.push(next);
  } else {
    externalSupplyRecords = externalSupplyRecords.filter((item) => item.externalSupplyId !== `v11-external-legacy-${conversionOutputId}`);
  }
}

export function saveV11ExternalSupplyRecord(input: Omit<V11ExternalSupplyRecord, 'externalSupplyId'>, id?: string) {
  if (id && externalSupplyRecords.some((item) => item.externalSupplyId === id && item.year !== input.year)) return { ok: false as const, error: '不能跨年度修改记录，请切换到记录所属年度。' };
  const amounts = [input.amount, ...(input.monthlyAmounts ?? [])];
  if (amounts.some((amount) => !Number.isFinite(amount) || amount < 0)) {
    return { ok: false as const, error: '外供量不能为负数。' };
  }
  if (!input.inputEnergyRecordId && !input.conversionOutputId) {
    return { ok: false as const, error: '外供记录必须关联企业级能源数据或转换产出。' };
  }
  if (input.inputEnergyRecordId && input.conversionOutputId) {
    return { ok: false as const, error: '外供记录只能选择一种来源。' };
  }
  if (input.inputEnergyRecordId) {
    const source = energyRecords.find((record) => record.energyRecordId === input.inputEnergyRecordId);
    if (!source) return { ok: false as const, error: '直接转供来源能源数据不存在。' };
    if (source.year !== input.year) return { ok: false as const, error: '直接转供来源与外供年度不一致。' };
    if (source.scopeType !== 'enterprise' || source.energyUnitId !== null) {
      return { ok: false as const, error: '直接转供只能关联企业级能源输入，不能关联厂内用能单元数据。' };
    }
    const siblingSupplies = externalSupplyRecords.filter((item) =>
      item.inputEnergyRecordId === input.inputEnergyRecordId && item.externalSupplyId !== id,
    );
    const annualExternal = siblingSupplies.reduce((total, item) => total + item.amount, 0) + input.amount;
    if (annualExternal > v11EnergyRecordAnnualAmount(source)) {
      return { ok: false as const, error: '直接转供量不能超过企业级能源输入总量。' };
    }
    if (input.monthlyAmounts) {
      const monthlyOverflow = input.monthlyAmounts.some((amount, index) => {
        const siblingAmount = siblingSupplies.reduce(
          (total, item) => total + (item.monthlyAmounts?.[index] ?? 0),
          0,
        );
        return siblingAmount + amount > (source.monthlyAmounts[index] ?? 0);
      });
      if (monthlyOverflow) return { ok: false as const, error: '直接转供月度合计不能超过对应月份企业级能源输入量。' };
    }
  }
  if (input.conversionOutputId) {
    const conversion = conversionOutputs.find((item) => item.conversionOutputId === input.conversionOutputId);
    if (!conversion) return { ok: false as const, error: '转换产出来源不存在。' };
    if (conversion.year !== input.year) return { ok: false as const, error: '转换产出与外供年度不一致。' };
    const siblingSupplies = externalSupplyRecords.filter((item) =>
      item.conversionOutputId === input.conversionOutputId && item.externalSupplyId !== id,
    );
    const annualExternal = siblingSupplies.reduce((total, item) => total + item.amount, 0) + input.amount;
    const externalCapacity = (conversion.outputAmount ?? 0)
      - (conversion.internalAmount ?? 0)
      - (conversion.lossAmount ?? 0);
    if (annualExternal > externalCapacity) {
      return { ok: false as const, error: '同一转换产出的外供合计不能超过扣除内部使用和损失后的可外供量。' };
    }
    if (input.monthlyAmounts && conversion.monthlyOutputAmounts) {
      const monthlyOverflow = input.monthlyAmounts.some((amount, index) => {
        const siblingAmount = siblingSupplies.reduce(
          (total, item) => total + (item.monthlyAmounts?.[index] ?? 0),
          0,
        );
        const externalCapacity = (conversion.monthlyOutputAmounts?.[index] ?? 0)
          - (conversion.monthlyInternalAmounts?.[index] ?? 0)
          - (conversion.monthlyLossAmounts?.[index] ?? 0);
        return siblingAmount + amount > externalCapacity;
      });
      if (monthlyOverflow) return { ok: false as const, error: '同一转换产出的月度外供合计不能超过扣除内部使用和损失后的可外供量。' };
    }
  }
  if (input.monthlyAmounts && input.monthlyAmounts.length !== 12) {
    return { ok: false as const, error: '外供月度数据必须填写12个月。' };
  }
  const record = { ...input, monthlyAmounts: input.monthlyAmounts ? [...input.monthlyAmounts] : undefined, evidenceNames: input.evidenceNames ? [...input.evidenceNames] : undefined };
  if (id) {
    const index = externalSupplyRecords.findIndex((item) => item.externalSupplyId === id);
    if (index < 0) return { ok: false as const, error: '能源外供记录不存在。' };
    externalSupplyRecords[index] = { ...record, externalSupplyId: id };
  } else externalSupplyRecords.push({ ...record, externalSupplyId: nextId('v11-external') });
  return { ok: true as const };
}

export function deleteV11ExternalSupplyRecord(id: string) {
  const sourceId = externalSupplyRecords.find((item) => item.externalSupplyId === id)?.conversionOutputId;
  const conversion = conversionOutputs.find((item) => item.conversionOutputId === sourceId);
  if (conversion) conversion.flowManaged = true;
  externalSupplyRecords = externalSupplyRecords.filter((item) => item.externalSupplyId !== id);
}

export function saveFlowExternal(input: Omit<V11ExternalSupplyRecord, 'externalSupplyId'>, id?: string) {
  if (id && externalSupplyRecords.some((item) => item.externalSupplyId === id && item.year !== input.year)) return { ok: false as const, error: '不能跨年度修改记录，请切换到记录所属年度。' };
  if (!input.receiver?.trim()) return { ok: false as const, error: '请填写接收方。' };
  if (!input.monthlyAmounts || input.monthlyAmounts.length !== 12 || input.monthlyAmounts.some((v) => !Number.isFinite(v) || v < 0)) return { ok: false as const, error: '外供月度数量必须为非负数。' };
  if (Boolean(input.conversionOutputId) === Boolean(input.inputEnergyRecordId)) return { ok: false as const, error: '请选择一个供能来源。' };
  const conversion = input.conversionOutputId ? listV11ConversionOutputs().find((c) => c.conversionOutputId === input.conversionOutputId) : undefined;
  const source = input.inputEnergyRecordId ? energyRecords.find((r) => r.energyRecordId === input.inputEnergyRecordId && v11RecordScopeType(r) === 'enterprise' && r.energyRole === '能源消费') : undefined;
  if ((!conversion && !source) || (conversion?.year ?? source?.year) !== input.year) return { ok: false as const, error: '供能来源必须属于当前年度。' };
  const unit = conversion?.outputUnit ?? listV11EnergyTypes(input.year).find((t) => t.energyTypeId === source?.energyTypeId)?.measurementUnit;
  if (input.unit !== unit) return { ok: false as const, error: '外供单位必须与来源一致。' };
  const siblings = externalSupplyRecords.filter((s) => s.externalSupplyId !== id && (conversion ? s.conversionOutputId === conversion.conversionOutputId : s.inputEnergyRecordId === source!.energyRecordId));
  for (let i = 0; i < 12; i++) {
    const reported = conversion ? (conversion.monthlyOutputReported?.[i] ?? conversion.monthlyOutputAmounts?.[i] != null) : source!.monthlyReportedMonths?.[i] ?? source!.monthlyAmounts[i] > 0;
    const capacity = conversion ? (conversion.monthlyOutputAmounts?.[i] ?? 0) - (conversion.monthlyLossAmounts?.[i] ?? 0) : source!.monthlyAmounts[i];
    const other = siblings.reduce((sum, s) => sum + (s.monthlyAmounts?.[i] ?? 0), 0);
    if (reported && other + input.monthlyAmounts[i] > capacity + 1e-8) return { ok: false as const, error: `${i + 1}月外供合计超过来源可供量 ${capacity.toLocaleString()} ${unit}。` };
  }
  const record = { ...input, externalSupplyId: id ?? nextId('v11-external'), amount: input.monthlyAmounts.reduce((sum, v) => sum + v, 0), monthlyAmounts: [...input.monthlyAmounts], monthlyReported: input.monthlyReported ? [...input.monthlyReported] : undefined };
  if (id) {
    const index = externalSupplyRecords.findIndex((s) => s.externalSupplyId === id);
    if (index < 0) return { ok: false as const, error: '外供记录不存在。' };
    externalSupplyRecords[index] = record;
  } else externalSupplyRecords.push(record);
  const raw = conversionOutputs.find((c) => c.conversionOutputId === conversion?.conversionOutputId);
  if (raw) raw.flowManaged = true;
  return { ok: true as const };
}


/** 清除指定期间的单元产出及损失，保留投入引用、单元和独立外供记录。 */
export function deleteFlowConversionData(id: string, month?: number) {
  const row = conversionOutputs.find((item) => item.conversionOutputId === id);
  if (!row || (month != null && (!Number.isInteger(month) || month < 1 || month > 12))) return;
  const index = month == null ? null : month - 1;
  row.flowManaged = true;
  row.monthlyOutputReported = Array.from({ length: 12 }, (_, i) => index !== null && i !== index && (row.monthlyOutputReported?.[i] ?? row.monthlyOutputAmounts?.[i] != null));
  row.monthlyOutputAmounts = Array.from({ length: 12 }, (_, i) => row.monthlyOutputReported![i] ? row.monthlyOutputAmounts?.[i] ?? 0 : 0);
  row.outputAmount = row.monthlyOutputAmounts.reduce((total, value) => total + value, 0);
  row.monthlyLossReported = Array.from({ length: 12 }, (_, i) => index !== null && i !== index && (row.monthlyLossReported?.[i] ?? row.monthlyLossAmounts?.[i] != null));
  row.monthlyLossAmounts = Array.from({ length: 12 }, (_, i) => row.monthlyLossReported![i] ? row.monthlyLossAmounts?.[i] ?? 0 : 0);
  row.lossAmount = row.monthlyLossAmounts.reduce((total, value) => total + value, 0);
  if (index === null) row.lossBasis = undefined;
}

export function deleteFlowExternalData(id: string, month?: number) {
  if (month == null) { deleteV11ExternalSupplyRecord(id); return; }
  if (!Number.isInteger(month) || month < 1 || month > 12) return;
  const row = externalSupplyRecords.find((item) => item.externalSupplyId === id);
  if (!row) return;
  row.monthlyReported = Array.from({ length: 12 }, (_, i) => i !== month - 1 && (row.monthlyReported?.[i] ?? row.monthlyAmounts?.[i] != null));
  row.monthlyAmounts = Array.from({ length: 12 }, (_, i) => row.monthlyReported![i] ? row.monthlyAmounts?.[i] ?? 0 : 0);
  row.amount = row.monthlyAmounts.reduce((total, value) => total + value, 0);
  if (!row.monthlyReported.some(Boolean)) deleteV11ExternalSupplyRecord(id);
  const conversion = conversionOutputs.find((item) => item.conversionOutputId === row.conversionOutputId);
  if (conversion) conversion.flowManaged = true;
}

/** 改换来源时将所选月份另存，其他月份继续使用原来源及单位。 */
export function saveFlowExternalMonth(input: Omit<V11ExternalSupplyRecord, 'externalSupplyId'>, index: number, id?: string) {
  if (!Number.isInteger(index) || index < 0 || index > 11) return { ok: false as const, error: '请选择有效月份。' };
  const previous = externalSupplyRecords.find((item) => item.externalSupplyId === id);
  if (id && !previous) return { ok: false as const, error: '外供记录不存在。' };
  const sourceChanged = previous && (previous.conversionOutputId !== input.conversionOutputId || previous.inputEnergyRecordId !== input.inputEnergyRecordId);
  if (!sourceChanged) return saveFlowExternal(input, id);
  const monthlyAmounts = Array.from({ length: 12 }, (_, i) => i === index ? input.monthlyAmounts?.[i] ?? 0 : 0);
  const result = saveFlowExternal({ ...input, monthlyAmounts, monthlyReported: Array.from({ length: 12 }, (_, i) => i === index), amount: monthlyAmounts[index] });
  if (result.ok && previous.monthlyAmounts) deleteFlowExternalData(id!, index + 1);
  return result;
}

export function flowExternalIssue(item: V11ExternalSupplyRecord, month: number) {
  const i = month - 1;
  const c = listV11ConversionOutputs().find((row) => row.conversionOutputId === item.conversionOutputId);
  const r = energyRecords.find((row) => row.energyRecordId === item.inputEnergyRecordId);
  const reported = c ? c.monthlyOutputReported?.[i] ?? c.monthlyOutputAmounts?.[i] != null : r?.monthlyReportedMonths?.[i] ?? (r?.monthlyAmounts[i] ?? 0) > 0;
  if (!reported) return '来源本期数据待补录';
  const capacity = c ? (c.monthlyOutputAmounts?.[i] ?? 0) - (c.monthlyLossAmounts?.[i] ?? 0) : r?.monthlyAmounts[i] ?? 0;
  const sum = externalSupplyRecords.filter((s) => c ? s.conversionOutputId === c.conversionOutputId : s.inputEnergyRecordId === r?.energyRecordId).reduce((total, s) => total + (s.monthlyAmounts?.[i] ?? 0), 0);
  return sum > capacity + 1e-8 ? '外供合计超出来源可供量' : '';
}

export function deleteV11ConversionOutput(id: string) {
  externalSupplyRecords = externalSupplyRecords.filter((item) => item.conversionOutputId !== id);
  conversionOutputs = conversionOutputs.filter((item) => item.conversionOutputId !== id);
}

export function saveV11OperationMetric(input: Omit<V11OperationMetric, 'operationMetricId'>, id?: string) {
  if (id && operations.some((item) => item.operationMetricId === id && item.year !== input.year)) return { ok: false as const, error: '不能跨年度修改记录，请切换到记录所属年度。' };
  if (input.energyUnitId && !listEnergyUnits(input.year).some((unit) => unit.energyUnitId === input.energyUnitId)) return { ok: false as const, error: '请选择本年度的用能单元。' };
  if (input.metricCode === 'product_output' && input.scopeLevel === '二级用能单元') {
    return { ok: false as const, error: '最终产品产量仅支持企业或一级生产用能单元维护。' };
  }
  if (input.metricCode === 'product_output' && input.energyUnitId) {
    const unit = listEnergyUnits(input.year).find((item) => item.energyUnitId === input.energyUnitId);
    if (unit?.unitLevel !== 'level1' || unit.unitType !== '生产单元') {
      return { ok: false as const, error: '产品产量只能关联一级生产用能单元。' };
    }
  }
  if (input.metricCode === 'product_output' && input.energyUnitId === null) {
    const enterpriseRecords = operations.filter((item) => item.operationMetricId !== id && item.year === input.year && item.metricCode === 'product_output' && item.energyUnitId === null);
    const legacyRecord = enterpriseRecords.find((item) => item.productId === null);
    if (legacyRecord && input.productId) {
      operations[operations.findIndex((item) => item.operationMetricId === legacyRecord.operationMetricId)] = { ...input, operationMetricId: legacyRecord.operationMetricId, monthlyValues: [...input.monthlyValues], monthlyReportedMonths: input.monthlyReportedMonths ? [...input.monthlyReportedMonths] : undefined };
      return { ok: true as const };
    }
    if (enterpriseRecords.length) return { ok: false as const, error: '企业层级每个年度只能维护一款主产品产量。' };
  }
  if (input.metricCode === 'product_output' && input.productId) {
    const productRecords = operations.filter((item) => item.operationMetricId !== id && item.year === input.year && item.metricCode === 'product_output' && item.productId === input.productId);
    const hasEnterpriseRecord = productRecords.some((item) => item.energyUnitId === null);
    const hasUnitRecord = productRecords.some((item) => item.energyUnitId !== null);
    if ((input.energyUnitId === null && hasUnitRecord) || (input.energyUnitId !== null && hasEnterpriseRecord)) {
      return { ok: false as const, error: '同一产品同一年度只能维护企业汇总口径或用能单元拆分口径，不能同时维护。' };
    }
  }
  const duplicate = operations.some((item) =>
    item.operationMetricId !== id
    && item.year === input.year
    && item.energyUnitId === input.energyUnitId
    && item.metricCode === input.metricCode
    && item.productId === input.productId);
  if (duplicate) return { ok: false as const, error: '相同年度、归属范围和指标名称的记录已存在。' };
  if (id) {
    const index = operations.findIndex((item) => item.operationMetricId === id);
    if (index < 0) return { ok: false as const, error: '运营数据不存在。' };
    operations[index] = { ...input, operationMetricId: id, monthlyValues: [...input.monthlyValues], monthlyReportedMonths: input.monthlyReportedMonths ? [...input.monthlyReportedMonths] : undefined };
  } else operations.push({ ...input, operationMetricId: nextId('v11-operation'), monthlyValues: [...input.monthlyValues], monthlyReportedMonths: input.monthlyReportedMonths ? [...input.monthlyReportedMonths] : undefined });
  return { ok: true as const };
}

export function deleteV11OperationMetric(id: string) {
  operations = operations.filter((item) => item.operationMetricId !== id);
}

export function saveV11KeyDevice(input: Omit<V11KeyDevice, 'deviceId'>, id?: string, year = 2026) {
  if (!listEnergyUnits(year).some((unit) => unit.energyUnitId === input.energyUnitId)) return { ok: false as const, error: '请选择本年度的用能单元。' };
  if (!listV11EnergyTypes(year).some((type) => type.energyTypeId === input.mainEnergyTypeId)) return { ok: false as const, error: '请选择本年度的能源品种。' };
  const devices = annualDevices.get(year);
  if (devices.some((item) => item.deviceId !== id && item.deviceName.trim() === input.deviceName.trim())) return { ok: false as const, error: '重点设备名称不能重复。' };
  if (id) {
    const index = devices.findIndex((item) => item.deviceId === id);
    if (index < 0) return { ok: false as const, error: '重点设备不存在。' };
    devices[index] = { ...input, deviceId: id };
  } else devices.push({ ...input, deviceId: nextId('v11-device') });
  return { ok: true as const };
}

export function inspectV11KeyDeviceDeletion(id: string, year = 2026) {
  const energyRecordCount = energyRecords.filter((item) => {
    const record = cloneRecord(item);
    return record.year === year && record.scopeType === 'device' && record.scopeId === id;
  }).length;
  const targetCount = countBenchmarkTargets('device', id, year);
  const indicatorBindingCount = countDeviceIntensityTemplates(id, year);
  const recoverySourceCount = energyRecords.filter((item) => item.year === year && item.energyRole === '回收能源' && item.sourceDeviceId === id).length;
  const references = { energyRecordCount, recoverySourceCount, benchmarkTargetCount: targetCount, indicatorBindingCount };
  if (energyRecordCount || recoverySourceCount || targetCount || indicatorBindingCount) {
    return {
      ok: false as const,
      error: '该重点设备已关联能源数据、指标配置或指标目标，暂不能删除。请先处理关联数据。',
      references,
    };
  }
  return { ok: true as const, references };
}

export function deleteV11KeyDevice(id: string, year = 2026) {
  const devices = annualDevices.get(year);
  const inspection = inspectV11KeyDeviceDeletion(id, year);
  if (!inspection.ok) return inspection;
  const index = devices.findIndex((item) => item.deviceId === id);
  if (index >= 0) devices.splice(index, 1);
  return { ok: true as const };
}

export function v11ScopeName(energyUnitId: string | null, year = 2026) {
  return energyUnitId ? listEnergyUnits(year).find((item) => item.energyUnitId === energyUnitId)?.energyUnitName ?? '未知单元' : '全厂';
}

export function resetDataManagementV11Store() {
  annualEnergyTypes.reset();
  annualListedEnergyTypeIds.reset();
  annualDisabledTypes.reset();
  energyRecords = seedEnergyRecords.map(cloneRecord);
  energyCosts = seedEnergyCosts.map(cloneCost);
  conversionOutputs = allSeedConversionOutputs.map((item) => ({
    ...item,
    outputTargetEnergyUnitId: item.outputTargetEnergyUnitId
      ?? (item.recordType === '锅炉产汽/产热' || item.recordType === '回收利用' ? 'eu-raw-material' : item.recordType === '余热发电' ? 'eu-production-processing' : undefined),
  }));
  externalSupplyRecords = allSeedConversionOutputs
    .filter((item) => item.recordType === '直接外供' || (item.externalAmount ?? 0) > 0)
    .map((item) => ({
      externalSupplyId: `v11-external-legacy-${item.conversionOutputId}`,
      year: item.year,
      inputEnergyRecordId: item.recordType === '直接外供' ? item.inputEnergyRecordId : undefined,
      conversionOutputId: item.recordType === '直接外供' ? undefined : item.conversionOutputId,
      energyTypeId: item.outputEnergyTypeId ?? item.inputEnergyTypeId,
      amount: item.externalAmount ?? 0,
      unit: item.outputUnit ?? item.inputUnit,
      monthlyAmounts: item.monthlyExternalAmounts ? [...item.monthlyExternalAmounts] : undefined,
      receiver: item.receiver,
      remark: item.remark,
    }));
  operations = seedOperations.map(cloneOperation);
  annualDevices.reset();
  sequence = 100;
  resetProductMasterStore();
  resetDeviceIntensityParameters();
  resetBenchmarkTargetStore();
}


