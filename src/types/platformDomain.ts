export interface EnergyActivityRecord {
  energyRecordId: string;
  energyUnitId: string;
  energyTypeId: string;
  energyRole: '能源消费' | '回收能源' | '能源产出' | '外供能源';
  entryMode: 'monthly' | 'annual';
  year: number;
  annualPhysicalAmount: number;
  physicalUnit: string;
  standardCoalAmount: number;
  monthlyStandardCoalAmounts: number[];
}

export interface EnergyType {
  energyTypeId: string;
  analysisCategory: '电力' | '热力' | '化石燃料' | '可再生及替代能源' | '回收能源' | '产出能源' | '其他能源';
  energyTypeName: string;
  measurementUnit: string;
  standardCoalFactor: number;
  standardCoalFactorUnit: string;
  factorSource: '公共参数' | '企业实测' | '企业配置';
  enabled: boolean;
}

export interface EnergyConversionRelation {
  conversionRelationId: string;
  conversionScene: string;
  conversionEnergyUnitId: string;
  inputEnergyRecordIds: string[];
  outputEnergyRecordIds: string[];
  conversionEfficiency: number | null;
  calculationState: '可计算' | '待补充输入';
}

export interface EnergyBalanceRecord {
  energyBalanceRecordId: string;
  energyUnitId: string;
  year: number;
  sourceEnergyRecordIds: string[];
  effectiveUtilizationAmount: number;
  recoveredAmount: number;
  externalOutputAmount: number;
}

export interface EnergyFlowRecord {
  energyFlowRecordId: string;
  year: number;
  flowName: string;
  flowStage: '能源输入' | '能源回收' | '能源转换' | '能源分配' | '能源利用' | '外部输出' | '未分配';
  sourceName: string;
  targetName: string;
  energyTypeId: string;
  standardCoalAmount: number;
  dataMode: '系统计算' | '关系计算' | '自动归集' | '自动识别';
  sourceRecordIds: string[];
}

export interface EfficiencyTarget {
  efficiencyTargetId: string;
  energyUnitId: string;
  metricName: string;
  targetValue: number;
  metricUnit: string;
  effectiveYear: number;
  evaluationDirection: 'lowerIsBetter' | 'higherIsBetter';
  targetBasis: string;
}

export interface EnergyCostRecord {
  energyCostId: string;
  energyTypeId: string;
  year: number;
  currencyUnit: '万元';
  monthlyCosts: number[];
}

export interface OperationMetric {
  operationMetricId: string;
  energyUnitId: string | null;
  year: number;
  metricCategory: '产量指标' | '经济指标';
  entryMode: 'monthly' | 'annual';
  metricName: string;
  metricUnit: string;
  annualValue: number;
}

export interface KeyDevice {
  deviceId: string;
  deviceName: string;
  deviceType: string;
  energyUnitId: string;
  mainEnergyTypeId: string | null;
  remark: string;
}

export interface CarbonSnapshot {
  carbonSnapshotId: string;
  carbonTaskId: string;
  year: number;
  version: number;
  totalEmission: number;
  directEmission: number;
  purchasedEnergyEmission: number;
  otherIndirectEmission: number;
  monthlyEmissions: number[];
  sourceItems: EmissionSource[];
  /** 正式版本固化的手动活动数据，避免草稿变更影响历史清单。 */
  activityRecords?: CarbonActivityRecord[];
}

export interface CarbonAccountingTask {
  carbonTaskId: string;
  taskName: string;
  year: number;
  organizationName: string;
  industry: string;
  standardName: string;
  organizationBoundary: string;
  status: 'draft' | 'confirmed' | 'pending';
  currentSnapshotId?: string;
}

export interface CarbonActivityRecord {
  activityRecordId: string;
  emissionSourceId: string;
  carbonTaskId: string;
  year: number;
  /** 当前原型支持年度录入；月度/季度录入可直接扩展 period。 */
  period: string;
  value: number;
  unit: string;
  dataSource: string;
  sourceReference?: string;
  evidenceFileIds: string[];
  status: 'draft' | 'confirmed' | 'void';
  createdBy: string;
  createdAt: string;
}

export interface EmissionSource {
  emissionSourceId: string;
  carbonTaskId: string;
  organizationBoundary: string;
  emissionCategory: string;
  emissionGroup: string;
  sourceType: string;
  sourceName: string;
  greenhouseGasSpecies: string[];
  activityValue: number;
  activityUnit: string;
  activityData: string;
  /** @deprecated 仅为历史页面兼容保留；追溯请使用 sourceModule / sourceRecordId。 */
  activityDataSource: string;
  factorName: string;
  emissionFactorId: string;
  recordGenerationType: 'system' | 'manual';
  sourceModule: string;
  sourceRecordId: string;
  factorObjectId: string;
  factorVersionId: string;
  createdBy: string;
  createdAt: string;
  recommendedActivityDataSources: string[];
  confirmedActivityDataSources: string[];
  customActivityDataSources: string[];
  evidenceFiles: { evidenceFileId: string; fileName: string; activityDataSource: string }[];
  evidenceStatus: '待确认' | '待补充' | '已完成';
  supportRemark?: string;
  relatedEnergyRecordId?: string;
  relatedOperationMetricId?: string;
  /** 手动录入时指向 carbon_activity_record；自动接入时为空。 */
  activityRecordIds?: string[];
  calculationFormula?: string;
  recordStatus?: 'draft' | 'confirmed' | 'not_applicable';
  emissionAmount: number;
  entryMode: 'system' | 'manual';
}

export type BudgetType = 'energy' | 'carbon';

export interface BudgetTarget {
  budgetTargetId: string;
  budgetType: BudgetType;
  organizationId: string;
  energyUnitId: string | null;
  year: number;
  targetValue: number;
  monthlyTargetValues?: number[];
  warningThreshold: number;
  targetUnit: 'tce' | 'tCO₂e';
  description: string;
  version: number;
  versionState: '生效' | '历史版本';
  forecastMethod: 'recentAverage' | 'categoryProjection';
  adjustmentReason: string;
}

export type StrategyState = '待评估' | '已采纳' | '已忽略' | '执行中';

export interface OptimizationStrategy {
  optimizationStrategyId: string;
  energyUnitId: string;
  metricName: string;
  currentValue: number;
  targetValue: number;
  metricUnit: string;
  recommendation: string;
  expectedSaving: number;
  strategyState: StrategyState;
}

export type CarbonAssetType = '碳配额' | 'CCER' | '绿证折算减排量';
export type CarbonAssetState = '可用' | '部分使用' | '已用尽' | '待核验';

export interface CarbonAsset {
  carbonAssetId: string;
  complianceCycle: string;
  assetType: CarbonAssetType;
  assetSource: string;
  totalAmount: number;
  eligibleAmount: number;
  carryoverEligibleAmount?: number;
  lockedAmount: number;
  usedAmount: number;
  voucherNumber: string;
  voucherPreviewUrl?: string;
  bookedAt: string;
  assetState: CarbonAssetState;
  remark: string;
}

export interface CarbonAssetWriteInput {
  complianceCycle: string;
  assetType: CarbonAssetType;
  assetSource: string;
  totalAmount: number;
  eligibleAmount: number;
  carryoverEligibleAmount?: number;
  lockedAmount: number;
  usedAmount: number;
  voucherNumber: string;
  voucherPreviewUrl?: string;
  bookedAt: string;
  remark: string;
}

export interface CarbonMarketConfig {
  carbonMarketConfigId: string;
  organizationId: string;
  isCovered: boolean;
  marketName: string;
  coveredEntityName: string;
  complianceCycle: string;
  complianceMethod: string;
}

export type CollectionState = '正常' | '待补传' | '需核验';

export interface DataCollectionSource {
  collectionSourceId: string;
  sourceName: string;
  sourceType: string;
  relatedDomain: string;
  recordCount: number;
  lastCollectedAt: string;
  collectionState: CollectionState;
}


