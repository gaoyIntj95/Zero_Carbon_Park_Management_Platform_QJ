import type { ConversionScenario, EnergyRelation } from '../../types/energyUnit';
import type { V11EnergyType } from '../../mocks/dataManagementV11Store';

/** 快捷组合仅辅助选择；保存能源品种 ID，不按企业的单元名称推断。 */
export const energyConversionPresets = [
  { input: '余热', output: '电力', example: '利用生产余热发电' },
  { input: '天然气', output: '蒸汽', example: '燃气锅炉产汽' },
  { input: '原煤', output: '蒸汽', example: '燃煤锅炉产汽' },
  { input: '生物质燃料', output: '蒸汽', example: '生物质锅炉产汽' },
  { input: '余热', output: '蒸汽', example: '余热锅炉回收余热产汽' },
  { input: '原煤', output: '电力', example: '燃煤发电' },
  { input: '天然气', output: '电力', example: '燃气发电' },
  { input: '余压', output: '电力', example: '余压回收发电' },
  { input: '余压', output: '压缩空气', example: '回收余压制取压缩空气' },
  { input: '电力', output: '压缩空气', example: '电驱动空压机产气' },
  { input: '电力', output: '蒸汽', example: '电锅炉产汽' },
  { input: '电力', output: '热水', example: '电加热供热' },
  { input: '余热', output: '热水', example: '工业余热供热' },
  { input: '燃料油', output: '蒸汽', example: '燃油锅炉产汽' },
  { input: '焦炉煤气', output: '蒸汽', example: '副产煤气产汽' },
  { input: '高炉煤气', output: '电力', example: '副产煤气发电' },
];

export function energyRelationError(relations: EnergyRelation[] | undefined, types: V11EnergyType[]) {
  if (!Array.isArray(relations) || !relations.length) return '请至少配置一条能源转换关系。';
  const ids = new Set(types.map((type) => type.energyTypeId));
  const seen = new Set<string>();
  for (const [index, relation] of relations.entries()) {
    if (!relation?.inputEnergyTypeId || !relation.outputEnergyTypeId) return `请补全第 ${index + 1} 条关系的投入能源和产出能源。`;
    if (!ids.has(relation.inputEnergyTypeId) || !ids.has(relation.outputEnergyTypeId)) return `第 ${index + 1} 条关系引用了本年度不存在的能源品种，请重新选择。`;
    const input = types.find((type) => type.energyTypeId === relation.inputEnergyTypeId);
    const output = types.find((type) => type.energyTypeId === relation.outputEnergyTypeId);
    const normalizeEnergyName = (name: string) => name.trim().replace(/[（(]产出[）)]$/, '');
    if (relation.inputEnergyTypeId === relation.outputEnergyTypeId || normalizeEnergyName(input!.energyTypeName) === normalizeEnergyName(output!.energyTypeName)) {
      return `第 ${index + 1} 条关系的投入与产出不能是同一种能源。`;
    }
    const key = JSON.stringify([relation.inputEnergyTypeId, relation.outputEnergyTypeId]);
    if (seen.has(key)) return '相同的投入、产出能源组合不能重复添加。';
    seen.add(key);
  }
}

export function conversionScenarioFor(relation: EnergyRelation, types: V11EnergyType[]): ConversionScenario {
  const input = types.find((type) => type.energyTypeId === relation.inputEnergyTypeId);
  const output = types.find((type) => type.energyTypeId === relation.outputEnergyTypeId);
  if (input?.analysisCategory === '回收能源') {
    return input.energyTypeName === '余热' && output?.analysisCategory === '电力' ? '余热发电' : '回收利用';
  }
  if (output?.energyTypeName.includes('压缩空气')) return '空压产气/压缩空气';
  if (output?.analysisCategory === '热力' || output?.energyTypeName.includes('蒸汽') || output?.energyTypeName.includes('热水')) return '锅炉产汽/产热';
  return '其他转换';
}

export function energyConversionFields(relations: EnergyRelation[] | undefined, types: V11EnergyType[]) {
  if (energyRelationError(relations, types)) return undefined;
  return {
    energyRelations: relations!.map((relation) => ({ ...relation })),
    conversionScenarios: [...new Set(relations!.map((relation) => conversionScenarioFor(relation, types)))],
  };
}


