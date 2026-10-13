export type EnergyUnitLevel = 'enterprise' | 'level1' | 'level2';

export type EnergyUnitType = '生产单元' | '工序/环节' | '能源转换系统' | '能源转换子系统' | '建筑区域' | '建筑子区域' | '空调服务系统' | '区域空调服务单元' | '其他';
export type ConversionScenario = '锅炉产汽/产热' | '余热发电' | '空压产气/压缩空气' | '回收利用' | '其他转换';

export interface EnergyRelation {
  inputEnergyTypeId: string;
  outputEnergyTypeId: string;
}

export interface EnergyUnit {
  energyUnitId: string;
  organizationId: string;
  energyUnitName: string;
  parentEnergyUnitId: string | null;
  unitLevel: EnergyUnitLevel;
  unitType: EnergyUnitType;
  /** 二级能源转换子系统可参与的能源转换场景；不参与能流关系计算。 */
  conversionScenarios?: ConversionScenario[];
  energyRelations?: EnergyRelation[];
  /** 同一父级下的展示顺序；不参与能源量、能流或工艺关系计算。 */
  displayOrder: number;
  remark?: string;
}

export interface EnergyUnitWriteInput {
  energyUnitName: string;
  unitType: EnergyUnitType;
  conversionScenarios?: ConversionScenario[];
  energyRelations?: EnergyRelation[];
  remark?: string;
}

export interface EnergyUnitReferenceSummary {
  childCount: number;
  energyRecordCount: number;
  operationRecordCount: number;
  deviceCount: number;
  conversionRelationCount: number;
}

export interface EnergyUnitMutationResult {
  ok: boolean;
  unit?: EnergyUnit;
  error?: 'notFound' | 'duplicateName' | 'maxLevel' | 'referenced' | 'invalidOrder' | 'invalidEnergyRelation' | 'invalidHierarchy';
  references?: EnergyUnitReferenceSummary;
}


