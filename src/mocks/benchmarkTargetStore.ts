export interface BenchmarkTarget {
  targetId: string;
  objectType: 'enterprise' | 'unit' | 'product' | 'device';
  objectId: string;
  metricCode: string;
  year: number;
  energyUnitId: string | null;
  value: number;
  metricName?: string;
  unit?: string;
  direction?: 'low' | 'high';
  monthlyTargets?: number[];
}

const seedTargets: BenchmarkTarget[] = [
  { targetId: 'target-enterprise-2026', objectType: 'enterprise', objectId: 'enterprise', metricCode: 'energy_per_added_value', year: 2026, energyUnitId: null, value: 0.12 },
  { targetId: 'target-unit-a-2026', objectType: 'unit', objectId: 'eu-clinker-line-1', metricCode: 'energy_per_product', year: 2026, energyUnitId: 'eu-clinker-line-1', value: 90 },
  // 生产车间B的电力、天然气与产量口径计算结果约为 52—58 kgce/t，目标保持同一指标量级。
  { targetId: 'target-unit-b-2026', objectType: 'unit', objectId: 'eu-cement-grinding-line', metricCode: 'energy_per_product', year: 2026, energyUnitId: 'eu-cement-grinding-line', value: 52 },
  { targetId: 'target-product-a-2026', objectType: 'product', objectId: 'product-a', metricCode: 'energy_per_product', year: 2026, energyUnitId: null, value: 52 },
  { targetId: 'target-product-b-2026', objectType: 'product', objectId: 'product-b', metricCode: 'energy_per_product', year: 2026, energyUnitId: null, value: 26 },
  { targetId: 'target-product-c-2026', objectType: 'product', objectId: 'product-c', metricCode: 'energy_per_product', year: 2026, energyUnitId: null, value: 60 },
];

let targets = seedTargets.map((target) => ({ ...target }));
let sequence = 100;

export function benchmarkTargetKey(
  objectType: BenchmarkTarget['objectType'],
  objectId: string,
  metricCode: string,
  year: number,
  energyUnitId: string | null = null,
) {
  return `${objectType}:${objectId}:${metricCode}:${year}:${energyUnitId ?? 'all'}`;
}

export function getBenchmarkTarget(
  objectType: BenchmarkTarget['objectType'],
  objectId: string,
  metricCode: string,
  year: number,
  energyUnitId: string | null = null,
) {
  return targets.find((target) =>
    benchmarkTargetKey(target.objectType, target.objectId, target.metricCode, target.year, target.energyUnitId)
    === benchmarkTargetKey(objectType, objectId, metricCode, year, energyUnitId)) ?? null;
}

export function saveBenchmarkTarget(input: Omit<BenchmarkTarget, 'targetId'>) {
  const current = getBenchmarkTarget(input.objectType, input.objectId, input.metricCode, input.year, input.energyUnitId);
  if (current) {
    targets = targets.map((target) => target.targetId === current.targetId ? { ...input, targetId: current.targetId } : target);
    return { ok: true as const, targetId: current.targetId };
  }
  sequence += 1;
  const targetId = `target-${sequence}`;
  targets.push({ ...input, targetId });
  return { ok: true as const, targetId };
}

export function countBenchmarkTargets(objectType: BenchmarkTarget['objectType'], objectId: string, year?: number) {
  return targets.filter((target) => target.objectType === objectType && target.objectId === objectId && (year === undefined || target.year === year)).length;
}

export function listBenchmarkTargets() {
  return targets.map((target) => ({
    ...target,
    monthlyTargets: target.monthlyTargets ? [...target.monthlyTargets] : undefined,
  }));
}

export function resetBenchmarkTargetStore() {
  targets = seedTargets.map((target) => ({ ...target }));
  sequence = 100;
}


