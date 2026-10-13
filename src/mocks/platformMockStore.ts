import type {
  BudgetTarget,
  BudgetType,
  CarbonAsset,
  CarbonAssetWriteInput,
  CarbonActivityRecord,
  CarbonAccountingTask,
  CarbonMarketConfig,
  CarbonSnapshot,
  DataCollectionSource,
  EmissionSource,
  EfficiencyTarget,
  EnergyBalanceRecord,
  EnergyActivityRecord,
  EnergyConversionRelation,
  EnergyCostRecord,
  EnergyFlowRecord,
  EnergyType,
  KeyDevice,
  OperationMetric,
  OptimizationStrategy,
  StrategyState,
} from '../types/platformDomain';
import { DEMO_ORGANIZATION_ID } from './demoOrganization';

const months = 12;
const spread = (annual: number) => {
  const weights = [0.076, 0.073, 0.078, 0.081, 0.084, 0.086, 0.087, 0.086, 0.083, 0.081, 0.082, 0.083];
  const values = weights.map((weight) => Number((annual * weight).toFixed(2)));
  values[months - 1] = Number((annual - values.slice(0, -1).reduce((sum, value) => sum + value, 0)).toFixed(2));
  return values;
};

const seedEnergyTypes: EnergyType[] = [
  { energyTypeId: 'energy-electricity', analysisCategory: '电力', energyTypeName: '外购电力', measurementUnit: 'kWh', standardCoalFactor: 0.1229, standardCoalFactorUnit: 'kgce/kWh', factorSource: '公共参数', enabled: true },
  { energyTypeId: 'energy-natural-gas', analysisCategory: '化石燃料', energyTypeName: '天然气', measurementUnit: 'Nm³', standardCoalFactor: 1.33, standardCoalFactorUnit: 'kgce/Nm³', factorSource: '公共参数', enabled: true },
  { energyTypeId: 'energy-coal', analysisCategory: '化石燃料', energyTypeName: '原煤', measurementUnit: 't', standardCoalFactor: 714.3, standardCoalFactorUnit: 'kgce/t', factorSource: '企业实测', enabled: true },
  { energyTypeId: 'energy-steam', analysisCategory: '热力', energyTypeName: '外购蒸汽', measurementUnit: 'GJ', standardCoalFactor: 34.12, standardCoalFactorUnit: 'kgce/GJ', factorSource: '公共参数', enabled: true },
  { energyTypeId: 'energy-waste-heat', analysisCategory: '回收能源', energyTypeName: '回收余热', measurementUnit: 'GJ', standardCoalFactor: 34.12, standardCoalFactorUnit: 'kgce/GJ', factorSource: '企业配置', enabled: true },
];
let energyTypes = seedEnergyTypes.map((item) => ({ ...item }));

const seedEnergyRecords: EnergyActivityRecord[] = [
  { energyRecordId: 'er-clinker-power', energyUnitId: 'eu-clinker-line-1', energyTypeId: 'energy-electricity', energyRole: '能源消费', entryMode: 'monthly', year: 2026, annualPhysicalAmount: 34_280_000, physicalUnit: 'kWh', standardCoalAmount: 4212, monthlyStandardCoalAmounts: spread(4212) },
  { energyRecordId: 'er-clinker-coal', energyUnitId: 'eu-clinker-line-1', energyTypeId: 'energy-coal', energyRole: '能源消费', entryMode: 'monthly', year: 2026, annualPhysicalAmount: 2800, physicalUnit: 't', standardCoalAmount: 2000, monthlyStandardCoalAmounts: spread(2000) },
  { energyRecordId: 'er-grinding-power', energyUnitId: 'eu-cement-grinding-line', energyTypeId: 'energy-electricity', energyRole: '能源消费', entryMode: 'monthly', year: 2026, annualPhysicalAmount: 10_374_000, physicalUnit: 'kWh', standardCoalAmount: 1275, monthlyStandardCoalAmounts: spread(1275) },
  { energyRecordId: 'er-utilities-gas', energyUnitId: 'eu-utilities', energyTypeId: 'energy-natural-gas', energyRole: '能源消费', entryMode: 'monthly', year: 2026, annualPhysicalAmount: 2_448_120, physicalUnit: 'Nm³', standardCoalAmount: 3256, monthlyStandardCoalAmounts: spread(3256) },
  { energyRecordId: 'er-utilities-steam', energyUnitId: 'eu-utilities', energyTypeId: 'energy-steam', energyRole: '能源消费', entryMode: 'monthly', year: 2026, annualPhysicalAmount: 56_770, physicalUnit: 'GJ', standardCoalAmount: 1937, monthlyStandardCoalAmounts: spread(1937) },
  { energyRecordId: 'er-office-power', energyUnitId: 'eu-office', energyTypeId: 'energy-electricity', energyRole: '能源消费', entryMode: 'monthly', year: 2026, annualPhysicalAmount: 5_207_000, physicalUnit: 'kWh', standardCoalAmount: 640, monthlyStandardCoalAmounts: spread(640) },
  { energyRecordId: 'er-recovered-heat', energyUnitId: 'eu-waste-heat-power', energyTypeId: 'energy-waste-heat', energyRole: '回收能源', entryMode: 'monthly', year: 2026, annualPhysicalAmount: 32_825, physicalUnit: 'GJ', standardCoalAmount: 1120, monthlyStandardCoalAmounts: spread(1120) },
  { energyRecordId: 'er-output-power', energyUnitId: 'eu-waste-heat-power', energyTypeId: 'energy-electricity', energyRole: '能源产出', entryMode: 'monthly', year: 2026, annualPhysicalAmount: 7_810_000, physicalUnit: 'kWh', standardCoalAmount: 960, monthlyStandardCoalAmounts: spread(960) },
  { energyRecordId: 'er-export-power', energyUnitId: 'eu-waste-heat-power', energyTypeId: 'energy-electricity', energyRole: '外供能源', entryMode: 'monthly', year: 2026, annualPhysicalAmount: 2_766_000, physicalUnit: 'kWh', standardCoalAmount: 340, monthlyStandardCoalAmounts: spread(340) },
];
let energyRecords = seedEnergyRecords.map((item) => ({ ...item, monthlyStandardCoalAmounts: [...item.monthlyStandardCoalAmounts] }));

const seedEnergyConversionRelations: EnergyConversionRelation[] = [
  { conversionRelationId: 'ecr-waste-heat-power', conversionScene: '余热发电', conversionEnergyUnitId: 'eu-waste-heat-power', inputEnergyRecordIds: ['er-recovered-heat'], outputEnergyRecordIds: ['er-output-power'], conversionEfficiency: 0.857, calculationState: '可计算' },
  { conversionRelationId: 'ecr-gas-boiler', conversionScene: '锅炉产汽/产热', conversionEnergyUnitId: 'eu-gas-boiler', inputEnergyRecordIds: ['er-utilities-gas'], outputEnergyRecordIds: ['er-utilities-steam'], conversionEfficiency: 0.887, calculationState: '可计算' },
];
let energyConversionRelations = seedEnergyConversionRelations.map((item) => ({ ...item, inputEnergyRecordIds: [...item.inputEnergyRecordIds], outputEnergyRecordIds: [...item.outputEnergyRecordIds] }));

const energyBalanceRecords: EnergyBalanceRecord[] = [
  { energyBalanceRecordId: 'ebr-clinker', energyUnitId: 'eu-clinker-line-1', year: 2026, sourceEnergyRecordIds: ['er-clinker-power', 'er-clinker-coal'], effectiveUtilizationAmount: 5760, recoveredAmount: 260, externalOutputAmount: 0 },
  { energyBalanceRecordId: 'ebr-grinding', energyUnitId: 'eu-cement-grinding-line', year: 2026, sourceEnergyRecordIds: ['er-grinding-power'], effectiveUtilizationAmount: 1185, recoveredAmount: 0, externalOutputAmount: 0 },
  { energyBalanceRecordId: 'ebr-utilities', energyUnitId: 'eu-utilities', year: 2026, sourceEnergyRecordIds: ['er-utilities-gas', 'er-utilities-steam'], effectiveUtilizationAmount: 4750, recoveredAmount: 120, externalOutputAmount: 0 },
  { energyBalanceRecordId: 'ebr-office', energyUnitId: 'eu-office', year: 2026, sourceEnergyRecordIds: ['er-office-power'], effectiveUtilizationAmount: 602, recoveredAmount: 0, externalOutputAmount: 0 },
];

const energyFlowRecords: EnergyFlowRecord[] = [
  { energyFlowRecordId: 'efr-power-input', year: 2026, flowName: '外购电力', flowStage: '能源输入', sourceName: '企业边界', targetName: '厂内电力池', energyTypeId: 'energy-electricity', standardCoalAmount: 6127, dataMode: '系统计算', sourceRecordIds: ['er-clinker-power', 'er-grinding-power', 'er-office-power'] },
  { energyFlowRecordId: 'efr-gas-input', year: 2026, flowName: '天然气输入', flowStage: '能源输入', sourceName: '企业边界', targetName: '燃气锅炉/生产单元', energyTypeId: 'energy-natural-gas', standardCoalAmount: 3256, dataMode: '系统计算', sourceRecordIds: ['er-utilities-gas'] },
  { energyFlowRecordId: 'efr-coal-input', year: 2026, flowName: '原煤输入', flowStage: '能源输入', sourceName: '企业边界', targetName: '熟料生产线', energyTypeId: 'energy-coal', standardCoalAmount: 2000, dataMode: '系统计算', sourceRecordIds: ['er-clinker-coal'] },
  { energyFlowRecordId: 'efr-steam-input', year: 2026, flowName: '外购蒸汽', flowStage: '能源输入', sourceName: '企业边界', targetName: '厂内蒸汽管网', energyTypeId: 'energy-steam', standardCoalAmount: 1937, dataMode: '系统计算', sourceRecordIds: ['er-utilities-steam'] },
  { energyFlowRecordId: 'efr-waste-heat-recovery', year: 2026, flowName: '回收余热', flowStage: '能源回收', sourceName: '熟料烧成', targetName: '余热发电系统', energyTypeId: 'energy-waste-heat', standardCoalAmount: 1120, dataMode: '关系计算', sourceRecordIds: ['er-recovered-heat'] },
  { energyFlowRecordId: 'efr-waste-power-output', year: 2026, flowName: '余热发电', flowStage: '能源转换', sourceName: '余热发电系统', targetName: '厂内电力池', energyTypeId: 'energy-electricity', standardCoalAmount: 960, dataMode: '关系计算', sourceRecordIds: ['er-output-power', 'ecr-waste-heat-power'] },
  { energyFlowRecordId: 'efr-power-distribution', year: 2026, flowName: '厂内电力分配', flowStage: '能源分配', sourceName: '厂内电力池', targetName: '各一级用能单元', energyTypeId: 'energy-electricity', standardCoalAmount: 7087, dataMode: '自动归集', sourceRecordIds: ['er-clinker-power', 'er-grinding-power', 'er-office-power', 'er-output-power'] },
  { energyFlowRecordId: 'efr-power-use', year: 2026, flowName: '厂内电力利用', flowStage: '能源利用', sourceName: '各一级用能单元', targetName: '终端设备', energyTypeId: 'energy-electricity', standardCoalAmount: 6747, dataMode: '自动归集', sourceRecordIds: ['er-clinker-power', 'er-grinding-power', 'er-office-power'] },
  { energyFlowRecordId: 'efr-power-export', year: 2026, flowName: '能源外供', flowStage: '外部输出', sourceName: '厂内电力池', targetName: '企业外部', energyTypeId: 'energy-electricity', standardCoalAmount: 340, dataMode: '自动识别', sourceRecordIds: ['er-output-power'] },
  { energyFlowRecordId: 'efr-gas-distribution', year: 2026, flowName: '天然气分配', flowStage: '能源分配', sourceName: '天然气总表', targetName: '燃气锅炉/生产单元', energyTypeId: 'energy-natural-gas', standardCoalAmount: 3036, dataMode: '自动归集', sourceRecordIds: ['er-utilities-gas'] },
  { energyFlowRecordId: 'efr-gas-use', year: 2026, flowName: '天然气终端利用', flowStage: '能源利用', sourceName: '生产单元', targetName: '终端设备', energyTypeId: 'energy-natural-gas', standardCoalAmount: 1316, dataMode: '自动归集', sourceRecordIds: ['er-utilities-gas'] },
  { energyFlowRecordId: 'efr-gas-unallocated', year: 2026, flowName: '天然气未分配', flowStage: '未分配', sourceName: '天然气总表', targetName: '待核查', energyTypeId: 'energy-natural-gas', standardCoalAmount: 220, dataMode: '系统计算', sourceRecordIds: ['er-utilities-gas'] },
  { energyFlowRecordId: 'efr-coal-distribution', year: 2026, flowName: '原煤分配', flowStage: '能源分配', sourceName: '原煤输入', targetName: '熟料烧成', energyTypeId: 'energy-coal', standardCoalAmount: 2000, dataMode: '自动归集', sourceRecordIds: ['er-clinker-coal'] },
  { energyFlowRecordId: 'efr-coal-use', year: 2026, flowName: '原煤终端利用', flowStage: '能源利用', sourceName: '熟料烧成', targetName: '回转窑', energyTypeId: 'energy-coal', standardCoalAmount: 2000, dataMode: '自动归集', sourceRecordIds: ['er-clinker-coal'] },
  { energyFlowRecordId: 'efr-steam-conversion', year: 2026, flowName: '锅炉产汽', flowStage: '能源转换', sourceName: '燃气锅炉', targetName: '厂内蒸汽管网', energyTypeId: 'energy-steam', standardCoalAmount: 1720, dataMode: '关系计算', sourceRecordIds: ['er-utilities-gas', 'ecr-gas-boiler'] },
  { energyFlowRecordId: 'efr-steam-distribution', year: 2026, flowName: '蒸汽分配', flowStage: '能源分配', sourceName: '厂内蒸汽管网', targetName: '各一级用能单元', energyTypeId: 'energy-steam', standardCoalAmount: 3657, dataMode: '自动归集', sourceRecordIds: ['er-utilities-steam', 'ecr-gas-boiler'] },
  { energyFlowRecordId: 'efr-steam-use', year: 2026, flowName: '蒸汽终端利用', flowStage: '能源利用', sourceName: '各一级用能单元', targetName: '用热点', energyTypeId: 'energy-steam', standardCoalAmount: 3537, dataMode: '自动归集', sourceRecordIds: ['er-utilities-steam'] },
  { energyFlowRecordId: 'efr-steam-unallocated', year: 2026, flowName: '蒸汽未分配', flowStage: '未分配', sourceName: '厂内蒸汽管网', targetName: '待核查', energyTypeId: 'energy-steam', standardCoalAmount: 120, dataMode: '系统计算', sourceRecordIds: ['er-utilities-steam'] },
];

const seedEnergyCosts: EnergyCostRecord[] = [
  { energyCostId: 'ec-electricity', energyTypeId: 'energy-electricity', year: 2026, currencyUnit: '万元', monthlyCosts: spread(2331.04) },
  { energyCostId: 'ec-coal', energyTypeId: 'energy-coal', year: 2026, currencyUnit: '万元', monthlyCosts: spread(240.8) },
  { energyCostId: 'ec-gas', energyTypeId: 'energy-natural-gas', year: 2026, currencyUnit: '万元', monthlyCosts: spread(795.64) },
  { energyCostId: 'ec-steam', energyTypeId: 'energy-steam', year: 2026, currencyUnit: '万元', monthlyCosts: spread(386.04) },
];
let energyCosts = seedEnergyCosts.map((item) => ({ ...item, monthlyCosts: [...item.monthlyCosts] }));

const seedOperationMetrics: OperationMetric[] = [
  { operationMetricId: 'om-product-a', energyUnitId: 'eu-clinker-line-1', year: 2026, metricCategory: '产量指标', entryMode: 'monthly', metricName: '产品A产量', metricUnit: 't', annualValue: 1_365_000 },
  { operationMetricId: 'om-product-b', energyUnitId: 'eu-cement-grinding-line', year: 2026, metricCategory: '产量指标', entryMode: 'monthly', metricName: '产品B产量', metricUnit: 't', annualValue: 1_920_000 },
  { operationMetricId: 'om-added-value', energyUnitId: null, year: 2026, metricCategory: '经济指标', entryMode: 'annual', metricName: '工业增加值', metricUnit: '万元', annualValue: 31_680 },
];
let operationMetrics = seedOperationMetrics.map((item) => ({ ...item }));

const seedEmissionSources: EmissionSource[] = [
  { emissionSourceId: 'es-natural-gas', carbonTaskId: 'ct-2026', organizationBoundary: '企业法人边界', emissionCategory: '化石燃料燃烧排放', emissionGroup: '化石燃料燃烧排放', sourceType: '固定燃烧源', sourceName: '天然气燃烧（锅炉房）', greenhouseGasSpecies: ['CO₂'], activityValue: 120000, activityUnit: 'Nm³', activityData: '120,000 Nm³', activityDataSource: '数据管理·能源消费', factorName: '天然气固定燃烧参数组', emissionFactorId: 'pf-ng', recordGenerationType: 'system', sourceModule: '数据管理—能源数据', sourceRecordId: 'ENERGY-2026-001', factorObjectId: 'pf-ng', factorVersionId: '2026-v2', createdBy: '系统', createdAt: '2026-06-30 09:30:00', recommendedActivityDataSources: ['企业能源平衡表'], confirmedActivityDataSources: ['企业能源平衡表'], customActivityDataSources: [], evidenceFiles: [{ evidenceFileId: 'ev-001', fileName: '企业能源平衡表_2026.xlsx', activityDataSource: '企业能源平衡表' }], evidenceStatus: '已完成', relatedEnergyRecordId: 'er-utilities-gas', emissionAmount: 258.48, entryMode: 'system' },
  { emissionSourceId: 'es-diesel', carbonTaskId: 'ct-2026', organizationBoundary: '企业法人边界', emissionCategory: '化石燃料燃烧排放', emissionGroup: '化石燃料燃烧排放', sourceType: '移动燃烧源', sourceName: '柴油燃烧（厂内车辆）', greenhouseGasSpecies: ['CO₂'], activityValue: 15.6, activityUnit: 't', activityData: '15.6 t', activityDataSource: '数据管理·能源消费', factorName: '柴油移动燃烧参数组', emissionFactorId: 'pf-diesel', recordGenerationType: 'system', sourceModule: '数据管理—能源数据', sourceRecordId: 'ENERGY-2026-002', factorObjectId: 'pf-diesel', factorVersionId: '2026-v2', createdBy: '系统', createdAt: '2026-06-30 09:31:00', recommendedActivityDataSources: ['企业能源平衡表'], confirmedActivityDataSources: ['企业能源平衡表'], customActivityDataSources: [], evidenceFiles: [{ evidenceFileId: 'ev-002', fileName: '车辆燃料台账_2026.xlsx', activityDataSource: '企业能源平衡表' }], evidenceStatus: '已完成', emissionAmount: 49.47, entryMode: 'system' },
  { emissionSourceId: 'es-clinker', carbonTaskId: 'ct-2026', organizationBoundary: '企业法人边界', emissionCategory: '生产过程排放', emissionGroup: '生产过程排放', sourceType: '生产过程排放源', sourceName: '碳酸盐原料分解（工艺系统）', greenhouseGasSpecies: ['CO₂'], activityValue: 400, activityUnit: 't', activityData: '原料消耗量：400 t', activityDataSource: '核算清单·在线录入', factorName: '工业过程碳酸盐分解参数组', emissionFactorId: 'pf-process', recordGenerationType: 'manual', sourceModule: '核算清单—在线录入', sourceRecordId: 'CARBON-2026-001', factorObjectId: 'pf-process', factorVersionId: '2026-v1', createdBy: '管理员', createdAt: '2026-06-30 10:00:00', recommendedActivityDataSources: ['原料消耗表', '财务报表（原料购买量或购买额）'], confirmedActivityDataSources: ['原料消耗表'], customActivityDataSources: [], evidenceFiles: [{ evidenceFileId: 'ev-003', fileName: '碳酸盐原料消耗表_2026.xlsx', activityDataSource: '原料消耗表' }], evidenceStatus: '已完成', emissionAmount: 175.6, entryMode: 'manual' },
  { emissionSourceId: 'es-water', carbonTaskId: 'ct-2026', organizationBoundary: '企业法人边界', emissionCategory: '废弃物处理处置排放', emissionGroup: '废弃物处理处置排放', sourceType: '废水处理排放源', sourceName: '工业废水处理系统', greenhouseGasSpecies: ['CH₄', 'N₂O'], activityValue: 104137.8542, activityUnit: '人·天/年', activityData: '104,137.8542 人·天/年', activityDataSource: '人力资源·考勤汇总表', factorName: '工业废水处理排放因子', emissionFactorId: 'pf-waste', recordGenerationType: 'system', sourceModule: '数据管理—运营数据', sourceRecordId: 'OPERATION-2026-004', factorObjectId: 'pf-waste', factorVersionId: '2026-v2', createdBy: '系统', createdAt: '2026-06-30 09:32:00', recommendedActivityDataSources: ['人力资源考勤汇总表', 'BOD适用地区缺省值', '工业修正因子依据'], confirmedActivityDataSources: ['人力资源考勤汇总表'], customActivityDataSources: [], evidenceFiles: [], evidenceStatus: '待补充', emissionAmount: 32.8, entryMode: 'system' },
  { emissionSourceId: 'es-r134a', carbonTaskId: 'ct-2026', organizationBoundary: '企业法人边界', emissionCategory: '逸散排放', emissionGroup: '逸散排放', sourceType: '制冷剂逸散源', sourceName: '制冷剂R134a补充（制冷系统）', greenhouseGasSpecies: ['HFCs（R134a）'], activityValue: 120, activityUnit: 'kg', activityData: '120 kg', activityDataSource: '核算清单·在线录入', factorName: 'R134a全球变暖潜势', emissionFactorId: 'pf-r134a', recordGenerationType: 'manual', sourceModule: '核算清单—在线录入', sourceRecordId: 'CARBON-2026-002', factorObjectId: 'pf-r134a', factorVersionId: 'AR5', createdBy: '管理员', createdAt: '2026-06-30 10:05:00', recommendedActivityDataSources: ['监测报表'], confirmedActivityDataSources: [], customActivityDataSources: [], evidenceFiles: [], evidenceStatus: '待确认', emissionAmount: 171.6, entryMode: 'manual' },
  { emissionSourceId: 'es-electricity', carbonTaskId: 'ct-2026', organizationBoundary: '企业法人边界', emissionCategory: '购入的电力与热力产生的排放', emissionGroup: '购入电力与热力产生的排放', sourceType: '购入电力', sourceName: '外购电力（企业整体）', greenhouseGasSpecies: ['CO₂e（综合因子）'], activityValue: 18600, activityUnit: 'MWh', activityData: '18,600 MWh', activityDataSource: '数据管理·能源消费', factorName: '外购电力排放因子（全国）', emissionFactorId: 'pf-power', recordGenerationType: 'system', sourceModule: '数据管理—能源数据', sourceRecordId: 'ENERGY-2026-003', factorObjectId: 'pf-power', factorVersionId: '2026-v1', createdBy: '系统', createdAt: '2026-06-30 09:33:00', recommendedActivityDataSources: ['企业能源平衡表', '财务报表', '采购发票或凭证'], confirmedActivityDataSources: ['企业能源平衡表'], customActivityDataSources: [], evidenceFiles: [{ evidenceFileId: 'ev-004', fileName: '电费结算单_2026.pdf', activityDataSource: '企业能源平衡表' }], evidenceStatus: '已完成', relatedEnergyRecordId: 'er-clinker-power', emissionAmount: 10607.58, entryMode: 'system' },
  { emissionSourceId: 'es-steam', carbonTaskId: 'ct-2026', organizationBoundary: '企业法人边界', emissionCategory: '购入的电力与热力产生的排放', emissionGroup: '购入电力与热力产生的排放', sourceType: '购入热力', sourceName: '外购热力（企业整体）', greenhouseGasSpecies: ['CO₂'], activityValue: 12500, activityUnit: 'GJ', activityData: '12,500 GJ', activityDataSource: '数据管理·能源消费', factorName: '外购热力排放因子', emissionFactorId: 'pf-heat', recordGenerationType: 'system', sourceModule: '数据管理—能源数据', sourceRecordId: 'ENERGY-2026-004', factorObjectId: 'pf-heat', factorVersionId: '2026-v1', createdBy: '系统', createdAt: '2026-06-30 09:34:00', recommendedActivityDataSources: ['企业能源平衡表', '财务报表', '采购发票或凭证'], confirmedActivityDataSources: ['采购发票或凭证'], customActivityDataSources: [], evidenceFiles: [{ evidenceFileId: 'ev-005', fileName: '热力采购发票_2026.pdf', activityDataSource: '采购发票或凭证' }], evidenceStatus: '已完成', relatedEnergyRecordId: 'er-utilities-steam', emissionAmount: 1387.5, entryMode: 'system' },
  { emissionSourceId: 'es-transport', carbonTaskId: 'ct-2026', organizationBoundary: '企业法人边界', emissionCategory: '交通运输产生的排放', emissionGroup: '其他间接排放', sourceType: '上游运输', sourceName: '原材料公路运输', greenhouseGasSpecies: ['CO₂e（综合因子）'], activityValue: 2500000, activityUnit: 't·km', activityData: '2,500,000 t·km', activityDataSource: '核算清单·在线录入', factorName: '公路货运排放因子', emissionFactorId: 'pf-transport', recordGenerationType: 'manual', sourceModule: '核算清单—在线录入', sourceRecordId: 'CARBON-2026-003', factorObjectId: 'pf-transport', factorVersionId: '2026-v2', createdBy: '管理员', createdAt: '2026-06-30 10:08:00', recommendedActivityDataSources: ['财务报表（可选）', '运输合同', '物流运单', '过磅单'], confirmedActivityDataSources: ['运输合同'], customActivityDataSources: [], evidenceFiles: [{ evidenceFileId: 'ev-006', fileName: '原材料运输合同_2026.pdf', activityDataSource: '运输合同' }], evidenceStatus: '已完成', emissionAmount: 297.5, entryMode: 'manual' },
];
let emissionSources = seedEmissionSources.map((item) => ({ ...item })).map((item) => {
  if (item.emissionSourceId === 'es-electricity') {
    return { ...item, evidenceFiles: [...item.evidenceFiles, { evidenceFileId: 'ev-004-2', fileName: '购电发票汇总_2026.pdf', activityDataSource: item.confirmedActivityDataSources[0] }] };
  }
  if (item.emissionSourceId === 'es-steam') {
    return { ...item, evidenceFiles: [...item.evidenceFiles, { evidenceFileId: 'ev-005-2', fileName: '热力采购合同_2026.pdf', activityDataSource: item.confirmedActivityDataSources[0] }] };
  }
  return item;
});
let nextEmissionSourceId = 100;
let nextCarbonActivityRecordId = 1;

const activityRecordFromSource = (source: EmissionSource, id = `car-${nextCarbonActivityRecordId++}`): CarbonActivityRecord => ({
  activityRecordId: id,
  emissionSourceId: source.emissionSourceId,
  carbonTaskId: source.carbonTaskId,
  year: Number((source.sourceRecordId ?? '').match(/20\d{2}/)?.[0] ?? 2026),
  period: 'annual',
  value: Number(source.activityValue ?? 0),
  unit: source.activityUnit || '—',
  dataSource: source.activityDataSource || source.sourceModule || '核算清单·在线录入',
  evidenceFileIds: (source.evidenceFiles ?? []).map((file) => file.evidenceFileId),
  status: source.recordStatus === 'not_applicable' ? 'void' : source.recordStatus === 'confirmed' ? 'confirmed' : 'draft',
  createdBy: source.createdBy || '管理员',
  createdAt: source.createdAt || new Date().toISOString(),
});

let carbonActivityRecords = seedEmissionSources
  .filter((item) => item.entryMode === 'manual' || item.recordGenerationType === 'manual')
  .map((item) => activityRecordFromSource(item));
emissionSources = emissionSources.map((source) => {
  const records = carbonActivityRecords.filter((item) => item.emissionSourceId === source.emissionSourceId);
  return records.length ? { ...source, activityRecordIds: records.map((item) => item.activityRecordId) } : source;
});

const seedCarbonSnapshots: CarbonSnapshot[] = [
  {
    carbonSnapshotId: 'cs-2026-v1',
    carbonTaskId: 'ct-2026',
    year: 2026,
    version: 1,
    totalEmission: 12_980.53,
    directEmission: 687.95,
    purchasedEnergyEmission: 11_995.08,
    otherIndirectEmission: 297.5,
    monthlyEmissions: spread(12_980.53),
    sourceItems: emissionSources.map((item) => ({ ...item })),
  },
  {
    carbonSnapshotId: 'cs-2025-v2',
    carbonTaskId: 'ct-2025',
    year: 2025,
    version: 2,
    totalEmission: 12_683.03,
    directEmission: 687.95,
    purchasedEnergyEmission: 11_995.08,
    otherIndirectEmission: 0,
    monthlyEmissions: spread(12_683.03),
    sourceItems: emissionSources.filter((item) => item.emissionCategory !== '交通运输产生的排放').map((item) => ({
      ...item,
      emissionSourceId: `${item.emissionSourceId}-2025`,
      carbonTaskId: 'ct-2025',
      sourceRecordId: item.sourceRecordId.replace('2026', '2025'),
    })),
  },
];
const seedCarbonTasks: CarbonAccountingTask[] = [
  { carbonTaskId: 'ct-2026', taskName: '2026年度组织温室气体核算', year: 2026, organizationName: 'XX科技有限公司', industry: '通用工业企业', standardName: 'GB/T 32150—2025', organizationBoundary: '企业法人边界', status: 'pending', currentSnapshotId: 'cs-2026-v1' },
  { carbonTaskId: 'ct-2025', taskName: '2025年度组织温室气体核算', year: 2025, organizationName: 'XX科技有限公司', industry: '通用工业企业', standardName: 'GB/T 32150—2025', organizationBoundary: '企业法人边界', status: 'confirmed', currentSnapshotId: 'cs-2025-v2' },
];
let carbonTasks = seedCarbonTasks.map((item) => ({ ...item }));
let carbonSnapshots = seedCarbonSnapshots.map((item) => ({ ...item, monthlyEmissions: [...item.monthlyEmissions], sourceItems: item.sourceItems.map((source) => ({ ...source })) }));
carbonSnapshots = carbonSnapshots.map((item) => ({
  ...item,
  activityRecords: carbonActivityRecords.filter((record) => record.carbonTaskId === item.carbonTaskId).map((record) => ({ ...record, evidenceFileIds: [...record.evidenceFileIds] })),
}));

let budgetTargets: BudgetTarget[] = [
  { budgetTargetId: 'bt-energy-2026', budgetType: 'energy', organizationId: DEMO_ORGANIZATION_ID, energyUnitId: null, year: 2026, targetValue: 120_600, warningThreshold: 0.95, targetUnit: 'tce', description: '年度能源消费预算', version: 1, versionState: '生效', forecastMethod: 'recentAverage', adjustmentReason: 'V2原型初始配置' },
  { budgetTargetId: 'bt-carbon-2026', budgetType: 'carbon', organizationId: DEMO_ORGANIZATION_ID, energyUnitId: null, year: 2026, targetValue: 95_000, warningThreshold: 0.95, targetUnit: 'tCO₂e', description: '年度碳排放预算', version: 1, versionState: '生效', forecastMethod: 'recentAverage', adjustmentReason: 'V2原型初始配置' },
];

let efficiencyTargets: EfficiencyTarget[] = [
  { efficiencyTargetId: 'et-clinker-2026', energyUnitId: 'eu-clinker-line-1', metricName: '单位熟料综合能耗', targetValue: 90, metricUnit: 'kgce/t', effectiveYear: 2026, evaluationDirection: 'lowerIsBetter', targetBasis: '企业年度节能目标' },
  { efficiencyTargetId: 'et-grinding-2026', energyUnitId: 'eu-cement-grinding-line', metricName: '单位水泥综合能耗', targetValue: 65, metricUnit: 'kgce/t', effectiveYear: 2026, evaluationDirection: 'lowerIsBetter', targetBasis: '企业年度节能目标' },
];

const seedStrategies: OptimizationStrategy[] = [
  { optimizationStrategyId: 'os-clinker', energyUnitId: 'eu-clinker-line-1', metricName: '单位熟料综合能耗', currentValue: 92.6, targetValue: 90, metricUnit: 'kgce/t', recommendation: '优化回转窑风煤配比并跟踪熟料烧成热耗。', expectedSaving: 180, strategyState: '待评估' },
  { optimizationStrategyId: 'os-utilities', energyUnitId: 'eu-utilities', metricName: '公辅系统能源占比', currentValue: 17.3, targetValue: 15, metricUnit: '%', recommendation: '调整空压机联控压力并治理末端泄漏。', expectedSaving: 120, strategyState: '待评估' },
  { optimizationStrategyId: 'os-grinding', energyUnitId: 'eu-cement-grinding-line', metricName: '单位水泥电耗', currentValue: 63.8, targetValue: 65, metricUnit: 'kWh/t', recommendation: '保持当前粉磨系统运行参数并纳入月度复核。', expectedSaving: 60, strategyState: '已采纳' },
];
let strategies = seedStrategies.map((item) => ({ ...item }));

const seedCarbonAssets: CarbonAsset[] = [
  { carbonAssetId: 'ca-quota-2026', complianceCycle: '2026年度', assetType: '碳配额', assetSource: '政府分配', totalAmount: 15_000, eligibleAmount: 6_500, carryoverEligibleAmount: 200, lockedAmount: 0, usedAmount: 8_500, voucherNumber: 'QUOTA-2026-001', bookedAt: '2026-03-15', assetState: '部分使用', remark: '2026年度政府分配配额' },
  { carbonAssetId: 'ca-ccer-2026', complianceCycle: '2026年度', assetType: 'CCER', assetSource: '市场购买', totalAmount: 2_000, eligibleAmount: 1_000, carryoverEligibleAmount: 0, lockedAmount: 0, usedAmount: 0, voucherNumber: 'CCER-2026-018', bookedAt: '2026-06-30', assetState: '可用', remark: '履约储备' },
  { carbonAssetId: 'ca-green-2026', complianceCycle: '2026年度', assetType: '绿证折算减排量', assetSource: '内部转化', totalAmount: 1_200, eligibleAmount: 0, lockedAmount: 0, usedAmount: 0, voucherNumber: 'GEC-2026-003', bookedAt: '2026-07-01', assetState: '待核验', remark: '待确认是否纳入本履约周期可用资产' },
  { carbonAssetId: 'ca-quota-2025', complianceCycle: '2025年度', assetType: '碳配额', assetSource: '政府分配', totalAmount: 14_000, eligibleAmount: 709.9, lockedAmount: 0, usedAmount: 13_290.1, voucherNumber: 'QUOTA-2025-001', bookedAt: '2025-03-10', assetState: '部分使用', remark: '历史履约周期' },
];
let carbonAssets = seedCarbonAssets.map((item) => ({ ...item }));

let carbonMarketConfig: CarbonMarketConfig = {
  carbonMarketConfigId: 'cmc-demo-2026',
  organizationId: DEMO_ORGANIZATION_ID,
  isCovered: true,
  marketName: '全国碳排放权交易市场',
  coveredEntityName: '示范工业企业',
  complianceCycle: '2026年度',
  complianceMethod: '年度配额清缴，符合条件的抵销资产按适用规则使用',
};

const seedKeyDevices: KeyDevice[] = [
  { deviceId: 'device-kiln-01', deviceName: '1#回转窑', deviceType: '回转窑', energyUnitId: 'eu-clinker-line-1', mainEnergyTypeId: 'energy-coal', remark: '熟料烧成核心设备' },
  { deviceId: 'device-mill-01', deviceName: '1#水泥磨', deviceType: '粉磨设备', energyUnitId: 'eu-cement-grinding-line', mainEnergyTypeId: 'energy-electricity', remark: '水泥粉磨主机' },
  { deviceId: 'device-compressor-01', deviceName: '空压机A', deviceType: '空压设备', energyUnitId: 'eu-utilities', mainEnergyTypeId: 'energy-electricity', remark: '公辅系统重点用能设备' },
];
let keyDevices = seedKeyDevices.map((item) => ({ ...item }));

const seedCollectionSources: DataCollectionSource[] = [
  { collectionSourceId: 'dc-energy', sourceName: '能源量数据', sourceType: '数据管理', relatedDomain: 'energyRecords', recordCount: energyRecords.length, lastCollectedAt: '2026-07-28 09:30', collectionState: '正常' },
  { collectionSourceId: 'dc-cost', sourceName: '能源成本', sourceType: '数据管理', relatedDomain: 'energyCosts', recordCount: energyCosts.length, lastCollectedAt: '2026-07-28 09:20', collectionState: '正常' },
  { collectionSourceId: 'dc-operation', sourceName: '运营指标', sourceType: '数据管理', relatedDomain: 'operationMetrics', recordCount: operationMetrics.length, lastCollectedAt: '2026-07-27 18:00', collectionState: '需核验' },
  { collectionSourceId: 'dc-carbon', sourceName: '碳排放正式快照', sourceType: '碳核算', relatedDomain: 'carbonSnapshots', recordCount: carbonSnapshots.length, lastCollectedAt: '2026-07-28 08:40', collectionState: '正常' },
];
let collectionSources = seedCollectionSources.map((item) => ({ ...item }));

let nextAssetId = 100;
let nextEnergyTypeId = 100;
let nextEnergyRecordId = 100;
let nextEnergyCostId = 100;
let nextConversionRelationId = 100;
let nextOperationMetricId = 100;
let nextDeviceId = 100;

const clone = <T extends object>(items: T[]) => items.map((item) => ({ ...item }));

export function listEnergyActivityRecords() {
  return energyRecords.map((item) => ({ ...item, monthlyStandardCoalAmounts: [...item.monthlyStandardCoalAmounts] }));
}
export function listEnergyTypes() { return clone(energyTypes); }
export function getEnergyType(energyTypeId: string) {
  const item = energyTypes.find((energyType) => energyType.energyTypeId === energyTypeId);
  return item ? { ...item } : undefined;
}
export function listEnergyConversionRelations() {
  return energyConversionRelations.map((item) => ({ ...item, inputEnergyRecordIds: [...item.inputEnergyRecordIds], outputEnergyRecordIds: [...item.outputEnergyRecordIds] }));
}
export function listEnergyBalanceRecords() {
  return energyBalanceRecords.map((item) => ({ ...item, sourceEnergyRecordIds: [...item.sourceEnergyRecordIds] }));
}
export function listEnergyFlowRecords() {
  return energyFlowRecords.map((item) => ({ ...item, sourceRecordIds: [...item.sourceRecordIds] }));
}
export function listEnergyCosts() { return energyCosts.map((item) => ({ ...item, monthlyCosts: [...item.monthlyCosts] })); }
export function listOperationMetrics() { return clone(operationMetrics); }
export function listKeyDevices() { return clone(keyDevices); }

export function saveEnergyType(input: Omit<EnergyType, 'energyTypeId'>, energyTypeId?: string) {
  const duplicate = energyTypes.find((item) => item.energyTypeName.trim() === input.energyTypeName.trim() && item.energyTypeId !== energyTypeId);
  if (duplicate) return { ok: false as const, error: '能源品种名称不能重复。' };
  if (energyTypeId) {
    const index = energyTypes.findIndex((item) => item.energyTypeId === energyTypeId);
    if (index < 0) return { ok: false as const, error: '能源品种不存在。' };
    energyTypes[index] = { ...input, energyTypeId };
    return { ok: true as const, item: { ...energyTypes[index] } };
  }
  const item: EnergyType = { ...input, energyTypeId: `energy-mock-${nextEnergyTypeId++}` };
  energyTypes.push(item);
  return { ok: true as const, item: { ...item } };
}

export function deleteEnergyType(energyTypeId: string) {
  const referenceCount = energyRecords.filter((item) => item.energyTypeId === energyTypeId).length
    + energyCosts.filter((item) => item.energyTypeId === energyTypeId).length
    + keyDevices.filter((item) => item.mainEnergyTypeId === energyTypeId).length;
  if (referenceCount) return { ok: false as const, error: `该能源品种存在 ${referenceCount} 条业务引用，不能删除。` };
  energyTypes = energyTypes.filter((item) => item.energyTypeId !== energyTypeId);
  return { ok: true as const };
}

export function saveEnergyActivityRecord(input: Omit<EnergyActivityRecord, 'energyRecordId'>, energyRecordId?: string) {
  if (energyRecordId) {
    const index = energyRecords.findIndex((item) => item.energyRecordId === energyRecordId);
    if (index < 0) return { ok: false as const, error: '能源量记录不存在。' };
    energyRecords[index] = { ...input, energyRecordId, monthlyStandardCoalAmounts: [...input.monthlyStandardCoalAmounts] };
    return { ok: true as const, item: { ...energyRecords[index], monthlyStandardCoalAmounts: [...energyRecords[index].monthlyStandardCoalAmounts] } };
  }
  const item: EnergyActivityRecord = { ...input, energyRecordId: `er-mock-${nextEnergyRecordId++}`, monthlyStandardCoalAmounts: [...input.monthlyStandardCoalAmounts] };
  energyRecords.push(item);
  return { ok: true as const, item: { ...item, monthlyStandardCoalAmounts: [...item.monthlyStandardCoalAmounts] } };
}

export function deleteEnergyActivityRecord(energyRecordId: string) {
  const carbonReferenceCount = emissionSources.filter((item) => item.relatedEnergyRecordId === energyRecordId).length;
  const conversionReferenceCount = energyConversionRelations.filter((item) => item.inputEnergyRecordIds.includes(energyRecordId) || item.outputEnergyRecordIds.includes(energyRecordId)).length;
  if (carbonReferenceCount || conversionReferenceCount) {
    return { ok: false as const, error: `该记录被碳核算清单 ${carbonReferenceCount} 条、能源转换关系 ${conversionReferenceCount} 条引用，不能删除。` };
  }
  energyRecords = energyRecords.filter((item) => item.energyRecordId !== energyRecordId);
  return { ok: true as const };
}

export function saveEnergyCost(input: Omit<EnergyCostRecord, 'energyCostId'>, energyCostId?: string) {
  const duplicate = energyCosts.find((item) => item.energyTypeId === input.energyTypeId && item.year === input.year && item.energyCostId !== energyCostId);
  if (duplicate) return { ok: false as const, error: '同一能源品种和年度只能维护一条成本记录。' };
  if (energyCostId) {
    const index = energyCosts.findIndex((item) => item.energyCostId === energyCostId);
    if (index < 0) return { ok: false as const, error: '能源成本记录不存在。' };
    energyCosts[index] = { ...input, energyCostId, monthlyCosts: [...input.monthlyCosts] };
    return { ok: true as const, item: { ...energyCosts[index], monthlyCosts: [...energyCosts[index].monthlyCosts] } };
  }
  const item: EnergyCostRecord = { ...input, energyCostId: `ec-mock-${nextEnergyCostId++}`, monthlyCosts: [...input.monthlyCosts] };
  energyCosts.push(item);
  return { ok: true as const, item: { ...item, monthlyCosts: [...item.monthlyCosts] } };
}

export function deleteEnergyCost(energyCostId: string) {
  energyCosts = energyCosts.filter((item) => item.energyCostId !== energyCostId);
  return { ok: true as const };
}

export function saveEnergyConversionRelation(input: Omit<EnergyConversionRelation, 'conversionRelationId'>, conversionRelationId?: string) {
  if (conversionRelationId) {
    const index = energyConversionRelations.findIndex((item) => item.conversionRelationId === conversionRelationId);
    if (index < 0) return { ok: false as const, error: '能源转换关系不存在。' };
    energyConversionRelations[index] = { ...input, conversionRelationId, inputEnergyRecordIds: [...input.inputEnergyRecordIds], outputEnergyRecordIds: [...input.outputEnergyRecordIds] };
    return { ok: true as const, item: { ...energyConversionRelations[index] } };
  }
  const item: EnergyConversionRelation = { ...input, conversionRelationId: `ecr-mock-${nextConversionRelationId++}`, inputEnergyRecordIds: [...input.inputEnergyRecordIds], outputEnergyRecordIds: [...input.outputEnergyRecordIds] };
  energyConversionRelations.push(item);
  return { ok: true as const, item: { ...item } };
}

export function deleteEnergyConversionRelation(conversionRelationId: string) {
  energyConversionRelations = energyConversionRelations.filter((item) => item.conversionRelationId !== conversionRelationId);
  return { ok: true as const };
}

export function saveOperationMetric(input: Omit<OperationMetric, 'operationMetricId'>, operationMetricId?: string) {
  if (operationMetricId) {
    const index = operationMetrics.findIndex((item) => item.operationMetricId === operationMetricId);
    if (index < 0) return { ok: false as const, error: '运营数据记录不存在。' };
    operationMetrics[index] = { ...input, operationMetricId };
    return { ok: true as const, item: { ...operationMetrics[index] } };
  }
  const item: OperationMetric = { ...input, operationMetricId: `om-mock-${nextOperationMetricId++}` };
  operationMetrics.push(item);
  return { ok: true as const, item: { ...item } };
}

export function deleteOperationMetric(operationMetricId: string) {
  const referenceCount = emissionSources.filter((item) => item.relatedOperationMetricId === operationMetricId).length;
  if (referenceCount) return { ok: false as const, error: `该运营数据被碳核算清单 ${referenceCount} 条引用，不能删除。` };
  operationMetrics = operationMetrics.filter((item) => item.operationMetricId !== operationMetricId);
  return { ok: true as const };
}

export function saveKeyDevice(input: Omit<KeyDevice, 'deviceId'>, deviceId?: string) {
  if (deviceId) {
    const index = keyDevices.findIndex((item) => item.deviceId === deviceId);
    if (index < 0) return { ok: false as const, error: '重点设备不存在。' };
    keyDevices[index] = { ...input, deviceId };
    return { ok: true as const, item: { ...keyDevices[index] } };
  }
  const item: KeyDevice = { ...input, deviceId: `device-mock-${nextDeviceId++}` };
  keyDevices.push(item);
  return { ok: true as const, item: { ...item } };
}

export function deleteKeyDevice(deviceId: string) {
  keyDevices = keyDevices.filter((item) => item.deviceId !== deviceId);
  return { ok: true as const };
}
export function getCarbonMarketConfig() { return { ...carbonMarketConfig }; }
export function saveCarbonMarketConfig(config: CarbonMarketConfig) {
  carbonMarketConfig = { ...config };
  return { ...carbonMarketConfig };
}
export function listEmissionSources() { return clone(emissionSources); }
export function listCarbonActivityRecords() { return clone(carbonActivityRecords); }
export function listCarbonAccountingTasks() { return clone(carbonTasks); }
export function getCarbonAccountingTask(carbonTaskId: string) { return carbonTasks.find((item) => item.carbonTaskId === carbonTaskId) ? { ...carbonTasks.find((item) => item.carbonTaskId === carbonTaskId)! } : undefined; }
export function saveCarbonAccountingTask(task: CarbonAccountingTask) {
  const index = carbonTasks.findIndex((item) => item.carbonTaskId === task.carbonTaskId);
  if (index >= 0) carbonTasks[index] = { ...task };
  else carbonTasks.push({ ...task });
  return { ...task };
}
export function replaceEmissionSourcesForTask(carbonTaskId: string, sources: EmissionSource[]) {
  const replacementSources = sources.filter((item) => item.carbonTaskId === carbonTaskId).map((item) => ({ ...item }));
  const replacementActivityRecords = replacementSources
    .filter((item) => item.entryMode === 'manual' || item.recordGenerationType === 'manual')
    .map((item) => activityRecordFromSource(item));
  const linkedSources = replacementSources.map((item) => {
    const records = replacementActivityRecords.filter((record) => record.emissionSourceId === item.emissionSourceId);
    return records.length ? { ...item, activityRecordIds: records.map((record) => record.activityRecordId) } : item;
  });
  emissionSources = [
    ...emissionSources.filter((item) => item.carbonTaskId !== carbonTaskId),
    ...linkedSources,
  ];
  carbonActivityRecords = [
    ...carbonActivityRecords.filter((item) => item.carbonTaskId !== carbonTaskId),
    ...replacementActivityRecords,
  ];
  return listEmissionSources();
}
export function saveEmissionSource(input: Omit<EmissionSource, 'emissionSourceId'>, emissionSourceId?: string) {
  const duplicate = emissionSources.find((item) => item.carbonTaskId === input.carbonTaskId && item.sourceName.trim() === input.sourceName.trim() && item.emissionSourceId !== emissionSourceId);
  if (duplicate) return { ok: false as const, error: '同一核算年度中排放源名称不能重复。' };
  if (emissionSourceId) {
    const index = emissionSources.findIndex((item) => item.emissionSourceId === emissionSourceId);
    if (index < 0) return { ok: false as const, error: '排放源记录不存在。' };
    emissionSources[index] = { ...input, emissionSourceId };
    carbonActivityRecords = carbonActivityRecords.filter((item) => item.emissionSourceId !== emissionSourceId);
    if (input.entryMode === 'manual' || input.recordGenerationType === 'manual') {
      const activityRecord = activityRecordFromSource(emissionSources[index]);
      carbonActivityRecords.push(activityRecord);
      emissionSources[index] = { ...emissionSources[index], activityRecordIds: [activityRecord.activityRecordId] };
    }
    return { ok: true as const, source: { ...emissionSources[index] } };
  }
  const source: EmissionSource = { ...input, emissionSourceId: `es-mock-${nextEmissionSourceId++}` };
  emissionSources.push(source);
  if (source.entryMode === 'manual' || source.recordGenerationType === 'manual') {
    const activityRecord = activityRecordFromSource(source);
    carbonActivityRecords.push(activityRecord);
    source.activityRecordIds = [activityRecord.activityRecordId];
  }
  return { ok: true as const, source: { ...source } };
}
export function deleteEmissionSource(emissionSourceId: string) {
  const source = emissionSources.find((item) => item.emissionSourceId === emissionSourceId);
  if (!source) return { ok: false as const, error: '排放源记录不存在。' };
  if (source.entryMode === 'system' && source.emissionCategory !== '废弃物处理处置排放') return { ok: false as const, error: '能源关联排放源不提供删除操作。' };
  emissionSources = emissionSources.filter((item) => item.emissionSourceId !== emissionSourceId);
  carbonActivityRecords = carbonActivityRecords.filter((item) => item.emissionSourceId !== emissionSourceId);
  return { ok: true as const };
}
export function listCarbonSnapshots() { return carbonSnapshots.map((item) => ({ ...item, monthlyEmissions: [...item.monthlyEmissions], sourceItems: item.sourceItems.map((source) => ({ ...source })), activityRecords: item.activityRecords?.map((record) => ({ ...record, evidenceFileIds: [...record.evidenceFileIds] })) })); }
export function latestCarbonSnapshot(year = 2026) {
  const snapshot = carbonSnapshots.filter((item) => item.year === year).sort((a, b) => b.version - a.version)[0];
  return snapshot ? { ...snapshot, monthlyEmissions: [...snapshot.monthlyEmissions], sourceItems: snapshot.sourceItems.map((source) => ({ ...source })), activityRecords: snapshot.activityRecords?.map((record) => ({ ...record, evidenceFileIds: [...record.evidenceFileIds] })) } : undefined;
}
export function latestCarbonSnapshotForTask(carbonTaskId: string) {
  const snapshot = carbonSnapshots.filter((item) => item.carbonTaskId === carbonTaskId).sort((a, b) => b.version - a.version)[0];
  return snapshot ? { ...snapshot, monthlyEmissions: [...snapshot.monthlyEmissions], sourceItems: snapshot.sourceItems.map((source) => ({ ...source })), activityRecords: snapshot.activityRecords?.map((record) => ({ ...record, evidenceFileIds: [...record.evidenceFileIds] })) } : undefined;
}
export function publishCarbonSnapshot(carbonTaskId = 'ct-2026', year = 2026) {
  const taskSources = emissionSources.filter((item) => item.carbonTaskId === carbonTaskId);
  const directGroups = new Set(['化石燃料燃烧排放', '生产过程排放', '废弃物处理处置排放', '逸散排放']);
  const purchasedGroup = '购入的电力与热力产生的排放';
  const directEmission = taskSources.filter((item) => directGroups.has(item.emissionGroup)).reduce((sum, item) => sum + item.emissionAmount, 0);
  const purchasedEnergyEmission = taskSources.filter((item) => item.emissionGroup === purchasedGroup).reduce((sum, item) => sum + item.emissionAmount, 0);
  const otherIndirectEmission = taskSources.filter((item) => !directGroups.has(item.emissionGroup) && item.emissionGroup !== purchasedGroup).reduce((sum, item) => sum + item.emissionAmount, 0);
  const totalEmission = Number((directEmission + purchasedEnergyEmission + otherIndirectEmission).toFixed(2));
  const version = Math.max(0, ...carbonSnapshots.filter((item) => item.carbonTaskId === carbonTaskId).map((item) => item.version)) + 1;
  const snapshot: CarbonSnapshot = {
    carbonSnapshotId: `cs-${year}-v${version}`,
    carbonTaskId,
    year,
    version,
    totalEmission,
    directEmission: Number(directEmission.toFixed(2)),
    purchasedEnergyEmission: Number(purchasedEnergyEmission.toFixed(2)),
    otherIndirectEmission: Number(otherIndirectEmission.toFixed(2)),
    monthlyEmissions: spread(totalEmission),
    sourceItems: taskSources.map((item) => ({ ...item })),
    activityRecords: carbonActivityRecords.filter((item) => item.carbonTaskId === carbonTaskId).map((item) => ({ ...item, evidenceFileIds: [...item.evidenceFileIds] })),
  };
  carbonSnapshots.push(snapshot);
  const carbonCollection = collectionSources.find((item) => item.relatedDomain === 'carbonSnapshots');
  if (carbonCollection) carbonCollection.recordCount = carbonSnapshots.length;
  return { ...snapshot, monthlyEmissions: [...snapshot.monthlyEmissions], activityRecords: snapshot.activityRecords?.map((record) => ({ ...record, evidenceFileIds: [...record.evidenceFileIds] })) };
}
export function listBudgetTargets() { return clone(budgetTargets); }
export function getBudgetTarget(type: BudgetType, year = 2026, energyUnitId: string | null = null) {
  const target = budgetTargets.filter((item) => item.budgetType === type && item.year === year && (item.energyUnitId ?? null) === energyUnitId).sort((a, b) => b.version - a.version).find((item) => item.versionState === '生效');
  return target ? { ...target } : undefined;
}
export function saveBudgetTarget(target: BudgetTarget) {
  budgetTargets = budgetTargets.map((item) =>
    item.budgetType === target.budgetType && item.year === target.year && (item.energyUnitId ?? null) === (target.energyUnitId ?? null) && item.versionState === '生效'
      ? { ...item, versionState: '历史版本' }
      : item,
  );
  const latestVersion = Math.max(0, ...budgetTargets.filter((item) => item.budgetType === target.budgetType && item.year === target.year && (item.energyUnitId ?? null) === (target.energyUnitId ?? null)).map((item) => item.version));
  const saved = { ...target, version: latestVersion + 1, versionState: '生效' as const };
  budgetTargets.push(saved);
  return { ...saved };
}
export function listEfficiencyTargets() { return clone(efficiencyTargets); }
export function getEfficiencyTarget(energyUnitId: string, metricName: string, year = 2026) {
  const target = efficiencyTargets.find((item) => item.energyUnitId === energyUnitId && item.metricName === metricName && item.effectiveYear === year);
  return target ? { ...target } : undefined;
}
export function saveEfficiencyTarget(target: EfficiencyTarget) {
  const index = efficiencyTargets.findIndex((item) => item.efficiencyTargetId === target.efficiencyTargetId);
  if (index >= 0) efficiencyTargets[index] = { ...target };
  else efficiencyTargets.push({ ...target });
  return { ...target };
}
export function listOptimizationStrategies() { return clone(strategies); }
export function updateStrategyState(id: string, strategyState: StrategyState) {
  const strategy = strategies.find((item) => item.optimizationStrategyId === id);
  if (strategy) strategy.strategyState = strategyState;
  return strategy ? { ...strategy } : undefined;
}
export function listCarbonAssets(cycle?: string) {
  return clone(cycle ? carbonAssets.filter((item) => item.complianceCycle === cycle) : carbonAssets);
}
export function saveCarbonAsset(input: CarbonAssetWriteInput, carbonAssetId?: string) {
  if (input.lockedAmount + input.usedAmount > input.totalAmount) {
    return { ok: false as const, error: '锁定量与已使用量之和不能超过资产数量。' };
  }
  if (input.eligibleAmount > input.totalAmount - input.usedAmount - input.lockedAmount) {
    return { ok: false as const, error: '本期预计可用量不能超过当前可用余额。' };
  }
  const state: CarbonAsset['assetState'] =
    input.usedAmount >= input.totalAmount ? '已用尽' : input.usedAmount > 0 ? '部分使用' : input.assetType === '绿证折算减排量' ? '待核验' : '可用';
  if (carbonAssetId) {
    const index = carbonAssets.findIndex((item) => item.carbonAssetId === carbonAssetId);
    if (index < 0) return { ok: false as const, error: '碳资产记录不存在。' };
    carbonAssets[index] = { ...input, carbonAssetId, assetState: state };
    return { ok: true as const, asset: { ...carbonAssets[index] } };
  }
  const asset: CarbonAsset = { ...input, carbonAssetId: `ca-mock-${nextAssetId++}`, assetState: state };
  carbonAssets.push(asset);
  return { ok: true as const, asset: { ...asset } };
}
export function deleteCarbonAsset(id: string) {
  const asset = carbonAssets.find((item) => item.carbonAssetId === id);
  if (!asset) return { ok: false as const, error: '碳资产记录不存在。' };
  if (asset.usedAmount > 0 || asset.lockedAmount > 0) return { ok: false as const, error: '该资产存在已使用量或锁定量，不能删除。' };
  carbonAssets = carbonAssets.filter((item) => item.carbonAssetId !== id);
  return { ok: true as const };
}
export function listCollectionSources() { return clone(collectionSources); }
export function collectSourceNow(id: string) {
  const source = collectionSources.find((item) => item.collectionSourceId === id);
  if (!source) return undefined;
  source.lastCollectedAt = '2026-07-28 19:45';
  source.collectionState = '正常';
  return { ...source };
}
export function totalEnergyConsumption(year = 2026) {
  return energyRecords.filter((item) => item.year === year && item.energyRole === '能源消费').reduce((sum, item) => sum + item.standardCoalAmount, 0);
}
export function energyActualMonthly(year = 2026) {
  return energyRecords.filter((item) => item.year === year && item.energyRole === '能源消费').reduce((totals, item) => totals.map((value, index) => value + item.monthlyStandardCoalAmounts[index]), Array(12).fill(0) as number[]);
}
export function totalEnergyCost(year = 2026) {
  return energyCosts.filter((item) => item.year === year).flatMap((item) => item.monthlyCosts).reduce((sum, value) => sum + value, 0);
}

export function resetPlatformMockStore() {
  budgetTargets = [
    { budgetTargetId: 'bt-energy-2026', budgetType: 'energy', organizationId: DEMO_ORGANIZATION_ID, energyUnitId: null, year: 2026, targetValue: 120_600, warningThreshold: 0.95, targetUnit: 'tce', description: '年度能源消费预算', version: 1, versionState: '生效', forecastMethod: 'recentAverage', adjustmentReason: 'V2原型初始配置' },
    { budgetTargetId: 'bt-carbon-2026', budgetType: 'carbon', organizationId: DEMO_ORGANIZATION_ID, energyUnitId: null, year: 2026, targetValue: 95_000, warningThreshold: 0.95, targetUnit: 'tCO₂e', description: '年度碳排放预算', version: 1, versionState: '生效', forecastMethod: 'recentAverage', adjustmentReason: 'V2原型初始配置' },
  ];
  emissionSources = seedEmissionSources.map((item) => ({ ...item }));
  nextEmissionSourceId = 100;
  nextCarbonActivityRecordId = 1;
  carbonActivityRecords = seedEmissionSources
    .filter((item) => item.entryMode === 'manual' || item.recordGenerationType === 'manual')
    .map((item) => activityRecordFromSource(item));
  efficiencyTargets = [
    { efficiencyTargetId: 'et-clinker-2026', energyUnitId: 'eu-clinker-line-1', metricName: '单位熟料综合能耗', targetValue: 90, metricUnit: 'kgce/t', effectiveYear: 2026, evaluationDirection: 'lowerIsBetter', targetBasis: '企业年度节能目标' },
    { efficiencyTargetId: 'et-grinding-2026', energyUnitId: 'eu-cement-grinding-line', metricName: '单位水泥综合能耗', targetValue: 65, metricUnit: 'kgce/t', effectiveYear: 2026, evaluationDirection: 'lowerIsBetter', targetBasis: '企业年度节能目标' },
  ];
  strategies = clone(seedStrategies);
  carbonSnapshots = seedCarbonSnapshots.map((item) => ({
    ...item,
    monthlyEmissions: [...item.monthlyEmissions],
    sourceItems: item.sourceItems.map((source) => ({ ...source })),
    activityRecords: item.activityRecords?.map((record) => ({ ...record, evidenceFileIds: [...record.evidenceFileIds] })),
  }));
  carbonTasks = seedCarbonTasks.map((item) => ({ ...item }));
  carbonAssets = clone(seedCarbonAssets);
  keyDevices = clone(seedKeyDevices);
  carbonMarketConfig = {
    carbonMarketConfigId: 'cmc-demo-2026',
    organizationId: DEMO_ORGANIZATION_ID,
    isCovered: true,
    marketName: '全国碳排放权交易市场',
    coveredEntityName: '示范工业企业',
    complianceCycle: '2026年度',
    complianceMethod: '年度配额清缴，符合条件的抵销资产按适用规则使用',
  };
  collectionSources = clone(seedCollectionSources);
  energyTypes = clone(seedEnergyTypes);
  energyRecords = seedEnergyRecords.map((item) => ({ ...item, monthlyStandardCoalAmounts: [...item.monthlyStandardCoalAmounts] }));
  energyConversionRelations = seedEnergyConversionRelations.map((item) => ({ ...item, inputEnergyRecordIds: [...item.inputEnergyRecordIds], outputEnergyRecordIds: [...item.outputEnergyRecordIds] }));
  energyCosts = seedEnergyCosts.map((item) => ({ ...item, monthlyCosts: [...item.monthlyCosts] }));
  operationMetrics = clone(seedOperationMetrics);
  nextAssetId = 100;
  nextEnergyTypeId = 100;
  nextEnergyRecordId = 100;
  nextEnergyCostId = 100;
  nextConversionRelationId = 100;
  nextOperationMetricId = 100;
  nextDeviceId = 100;
}


