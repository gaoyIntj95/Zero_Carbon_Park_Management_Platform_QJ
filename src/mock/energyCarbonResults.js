import { enterprises } from './masterData.js'
import { businessDataRecords, energyFlowRelations, energyNodes } from './dataManagementStore.js'

export const RESULT_PERIOD = { periodType:'MONTH', period:'2026-07' }

const latest = (enterpriseId, dataItemCode, period=RESULT_PERIOD.period) => businessDataRecords.find(record => record.enterpriseId === enterpriseId && record.dataItemCode === dataItemCode && record.period === period)
const official = record => Boolean(record && record.dataStatus === '正式' && record.qualityStatus === '正常')
const number = value => Number(value || 0)
const enterprise = enterpriseId => enterprises.find(item => item.enterpriseId === enterpriseId)
const cleanRateSeed = { 'ent-001':88.1, 'ent-002':84.7, 'ent-003':91.2, 'ent-004':79.6, 'ent-005':82.4, 'ent-006':76.8 }
const outputFor = enterpriseId => businessDataRecords.filter(record => record.enterpriseId === enterpriseId && record.dataItemCode === 'OP_PRODUCT_OUTPUT' && record.period === RESULT_PERIOD.period && official(record))

export const enterpriseEnergyResults = enterprises.map(item => {
  const records = ['ENERGY_ELECTRICITY','ENERGY_HEAT','ENERGY_NATURAL_GAS'].map(code => latest(item.enterpriseId, code)).filter(Boolean)
  const total = latest(item.enterpriseId, 'ENERGY_TOTAL')
  const rawTotal = records.reduce((sum, record) => sum + number(record.value), 0)
  const energyConsumption = records.map(record => ({ energyType:record.dataItemCode.replace('ENERGY_','').toLowerCase(), physicalAmount:number(record.value), unit:record.unit, standardCoalAmount:rawTotal ? Number((number(total?.value) * number(record.value) / rawTotal).toFixed(3)) : 0 }))
  const isOfficial = official(total) && records.every(official)
  const cleanEnergyAmount = Number((number(total?.value) * (cleanRateSeed[item.enterpriseId] || 0) / 100).toFixed(3))
  const output = outputFor(item.enterpriseId).reduce((sum, record) => sum + number(record.value), 0)
  const industrialValue = number(latest(item.enterpriseId, 'OP_INDUSTRIAL_VALUE')?.value)
  return { resultId:`energy-result-${item.enterpriseId}-${RESULT_PERIOD.period}`, enterpriseId:item.enterpriseId, periodType:RESULT_PERIOD.periodType, period:RESULT_PERIOD.period, energyConsumption, totalStandardCoal:number(total?.value), cleanEnergyAmount, cleanEnergyRatio:cleanRateSeed[item.enterpriseId] || null, productOutput:output, outputValue:industrialValue, energyIntensity:industrialValue ? Number((number(total?.value) / industrialValue).toFixed(4)) : null, productEnergyIntensity:output ? Number((number(total?.value) / output).toFixed(4)) : null, outputValueEnergyIntensity:industrialValue ? Number((number(total?.value) / industrialValue).toFixed(4)) : null, yearOnYear:{ value:item.enterpriseId === 'ent-004' ? 8.2 : -2.4, unit:'%' }, monthOnMonth:{ value:item.enterpriseId === 'ent-005' ? 4.1 : -1.7, unit:'%' }, dataStatus:isOfficial?'official':'pending', updatedAt:total?.updatedAt || '2026-08-25 10:30' }
})

// 对标值必须与产品产量口径一致。园区综合能耗和产品产量都以“万”为数量级
// 存储，因此相除后直接得到对应单位能耗，无需再做 1,000 倍换算。
const benchmarkStandard = {
  '单晶硅棒':{ unit:'tce/t', level2:5.20, advanced:4.80, benchmark:4.40 },
  '单晶硅片':{ unit:'tce/万片', level2:.018, advanced:.016, benchmark:.014 },
  '光伏电池':{ unit:'tce/GWh', level2:5.40, advanced:4.90, benchmark:4.50 },
  '储能电池':{ unit:'tce/GWh', level2:15.00, advanced:13.00, benchmark:11.00 },
}
export const enterpriseEfficiencyBenchmarkResults = enterpriseEnergyResults.flatMap(result => {
  const company = enterprise(result.enterpriseId), outputs = outputFor(result.enterpriseId)
  const productRows = outputs.length ? outputs : [{ productId:`product-${result.enterpriseId}`, productName:company?.mainProducts || '主要产品', value:result.productOutput || 0 }]
  return productRows.map(output => {
    const standard = benchmarkStandard[output.productName]
    const actual = result.dataStatus === 'official' && standard && number(output.value) > 0 ? Number((result.totalStandardCoal / number(output.value)).toFixed(3)) : null
    const resultCode = actual == null ? 'pending' : actual <= standard.benchmark ? 'advanced' : actual <= standard.level2 ? 'compliant' : 'not_compliant'
    const pendingReason = actual != null ? null : result.dataStatus !== 'official' ? '待确认数据' : !number(output.value) ? '待补产量' : !standard ? '待配标准' : '待补数据'
    return { resultId:`benchmark-${result.enterpriseId}-${output.productId}`, enterpriseId:result.enterpriseId, periodType:RESULT_PERIOD.periodType, period:RESULT_PERIOD.period, objectType:'product', objectId:output.productId, objectName:output.productName, indicatorName:'产品单位能耗', actualValue:actual, unit:standard?.unit || '—', standardName:'企业产品单位能耗二级限额', standardLevel:resultCode === 'advanced' ? 'benchmark' : resultCode === 'compliant' ? 'level2' : resultCode === 'not_compliant' ? 'not_compliant' : 'pending', benchmarkValue:standard?.level2 ?? null, advancedValue:standard?.advanced ?? null, benchmarkReference:standard?.benchmark ?? null, gapRate:actual == null ? null : Number(((actual - standard.level2) / standard.level2 * 100).toFixed(1)), result:resultCode, pendingReason, standardVersion:'2026-园区产品对标标准Mock', dataStatus:result.dataStatus === 'official' && actual != null ? 'official' : 'pending', updatedAt:result.updatedAt }
  })
})

export const enterpriseEnergyFlowResults = enterpriseEnergyResults.map(result => {
  const relations = energyFlowRelations.filter(flow => flow.targetNodeId === `node-consumer-${result.enterpriseId}`)
  const input = result.totalStandardCoal
  const recovered = Number((input * (result.cleanEnergyRatio || 0) / 100 * .08).toFixed(3))
  const loss = Number((input * .052).toFixed(3))
  return { resultId:`flow-result-${result.enterpriseId}-${RESULT_PERIOD.period}`, enterpriseId:result.enterpriseId, periodType:RESULT_PERIOD.periodType, period:RESULT_PERIOD.period, energyType:'综合能源', inputAmount:input, convertedAmount:Number((input * .94).toFixed(3)), distributedAmount:Number((input * .91).toFixed(3)), recoveredAmount:recovered, externalSupplyAmount:Number((input * .12).toFixed(3)), effectiveUseAmount:Number((input - loss).toFixed(3)), lossAmount:loss, energyUtilizationRate:Number(((input - loss) / Math.max(input, 1) * 100).toFixed(1)), balanceStatus:result.dataStatus === 'official' ? 'official' : 'pending', dataStatus:result.dataStatus, updatedAt:result.updatedAt, flowDetailReference:`/enterprise-profile?enterpriseId=${result.enterpriseId}&tab=energy-flow`, relationCount:relations.length }
})

export const enterpriseEnergyOptimizationResults = enterpriseEnergyResults.map(result => {
  const company = enterprise(result.enterpriseId), benchmark = enterpriseEfficiencyBenchmarkResults.find(item => item.enterpriseId === result.enterpriseId && item.result === 'not_compliant'), flow = enterpriseEnergyFlowResults.find(item => item.enterpriseId === result.enterpriseId)
  const priority = benchmark ? '高' : flow?.energyUtilizationRate < 86 ? '中' : '低'
  return { resultId:`optimization-${result.enterpriseId}-${RESULT_PERIOD.period}`, enterpriseId:result.enterpriseId, periodType:RESULT_PERIOD.periodType, period:RESULT_PERIOD.period, problemId:`optimization-problem-${result.enterpriseId}`, targetType:benchmark ? 'process' : 'system', targetId:benchmark?.objectId || `energy-system-${result.enterpriseId}`, targetName:benchmark?.objectName || '企业综合用能系统', problemType:benchmark ? '产品单位能耗偏高' : '能源利用率偏低', problemDescription:benchmark ? `${company?.name || '企业'}存在产品单位能耗高于二级限额的问题` : '能源输入与有效利用之间存在可优化损失', currentValue:benchmark?.actualValue ?? flow?.energyUtilizationRate, referenceValue:benchmark?.benchmarkValue ?? 86, unit:benchmark ? 'tce/t' : '%', energySavingPotential:Number((result.totalStandardCoal * (priority === '高' ? .06 : .03)).toFixed(2)), carbonReductionPotential:Number((result.totalStandardCoal * (priority === '高' ? .012 : .006)).toFixed(2)), recommendation:benchmark ? '复核主要工序能耗、产量分摊和设备运行参数' : '检查输配损失、负荷曲线和可回收能源利用', priority, status:priority === '低' ? '观察中' : '待推进', source:benchmark ? 'benchmark' : 'flow', dataStatus:result.dataStatus, updatedAt:result.updatedAt }
})

export const enterpriseEnergyCarbonBudgetResults = enterpriseEnergyResults.map((result, index) => {
  const energyBudget = [22,19,15,20,17,15][index] || 15
  const carbonBudget = Number((energyBudget * .23).toFixed(2)), energyActual = result.totalStandardCoal
  const scope1 = latest(result.enterpriseId, 'CARBON_SCOPE1'), scope2 = latest(result.enterpriseId, 'CARBON_SCOPE2')
  const carbonActual = official(scope1) && official(scope2) ? Number((number(scope1.value) + number(scope2.value)).toFixed(2)) : null
  const energyForecast = Number((energyActual / 7 * 12).toFixed(2)), carbonForecast = carbonActual == null ? null : Number((carbonActual / 7 * 12).toFixed(2))
  return { resultId:`budget-result-${result.enterpriseId}-2026`, enterpriseId:result.enterpriseId, year:'2026', periodType:RESULT_PERIOD.periodType, period:RESULT_PERIOD.period, energyBudget, energyActual, energyForecast, carbonBudget, carbonActual, carbonForecast, energyExecutionRate:Number((energyActual / energyBudget * 100).toFixed(1)), carbonExecutionRate:carbonActual == null ? null : Number((carbonActual / carbonBudget * 100).toFixed(1)), energyDeviation:Number((energyActual - energyBudget).toFixed(2)), carbonDeviation:carbonActual == null ? null : Number((carbonActual - carbonBudget).toFixed(2)), riskLevel:energyActual / energyBudget > .9 ? 'high' : 'normal', dataStatus:result.dataStatus, updatedAt:result.updatedAt }
})

export const enterpriseCarbonResults = enterprises.map(item => {
  const scope1 = latest(item.enterpriseId, 'CARBON_SCOPE1'), scope2 = latest(item.enterpriseId, 'CARBON_SCOPE2'), approved = official(scope1) && official(scope2), totalEmission = approved ? Number((number(scope1.value) + number(scope2.value)).toFixed(2)) : null
  return { resultId:`carbon-result-${item.enterpriseId}-${RESULT_PERIOD.period}`, enterpriseId:item.enterpriseId, periodType:RESULT_PERIOD.periodType, period:RESULT_PERIOD.period, scope1:approved ? number(scope1.value) : null, scope2:approved ? number(scope2.value) : null, totalEmission, carbonIntensity:totalEmission == null ? null : Number((totalEmission / Math.max(number(latest(item.enterpriseId, 'ENERGY_TOTAL')?.value), .01)).toFixed(4)), mainEmissionSources:scope2 ? ['购入电力','购入热力'].filter((_, index) => index === 0 || number(latest(item.enterpriseId, 'ENERGY_HEAT')?.value) > 0) : [], accountingStandard:'GHG Protocol / 企业组织碳核算Mock', factorVersion:'EF-2026-01', accountingStatus:approved ? 'confirmed' : 'pending', reportStatus:approved ? '编制中' : '待补数据', verificationStatus:approved ? '待核查' : '待补充', dataStatus:approved ? 'official' : 'pending', updatedAt:scope1?.updatedAt || '2026-08-25 10:30' }
})

const resultMonths = ['2026-01','2026-02','2026-03','2026-04','2026-05','2026-06','2026-07']
const aggregateOfficial = (period, codes) => businessDataRecords.filter(record => record.period === period && codes.includes(record.dataItemCode) && official(record)).reduce((sum, record) => sum + number(record.value), 0)
export const parkEnergyResultSeries = [
  { label:'综合能耗', color:'#2f6f4e', values:resultMonths.map(period => aggregateOfficial(period, ['ENERGY_TOTAL'])) },
  { label:'绿色电力消费', color:'#4c91a7', values:resultMonths.map(period => Number((aggregateOfficial(period, ['ENERGY_ELECTRICITY']) * .18).toFixed(2))) },
]
export const parkCarbonResultSeries = [
  { label:'总排放', color:'#b2762d', values:resultMonths.map(period => aggregateOfficial(period, ['CARBON_SCOPE1','CARBON_SCOPE2'])) },
  { label:'范围一', color:'#a95b4a', values:resultMonths.map(period => aggregateOfficial(period, ['CARBON_SCOPE1'])) },
  { label:'范围二', color:'#6c8d7a', values:resultMonths.map(period => aggregateOfficial(period, ['CARBON_SCOPE2'])) },
]
const energyTypeTotals = type => enterpriseEnergyResults.reduce((sum, result) => sum + number(result.energyConsumption.find(item => item.energyType === type)?.standardCoalAmount), 0)
const energyTotal = enterpriseEnergyResults.reduce((sum, result) => sum + number(result.totalStandardCoal), 0)
export const parkEnergyResultStructure = [
  { label:'电力', value:Number((energyTypeTotals('electricity') / Math.max(energyTotal, 1) * 100).toFixed(1)), color:'#2f6f4e' },
  { label:'热力', value:Number((energyTypeTotals('heat') / Math.max(energyTotal, 1) * 100).toFixed(1)), color:'#7ea58b' },
  { label:'天然气', value:Number((energyTypeTotals('natural_gas') / Math.max(energyTotal, 1) * 100).toFixed(1)), color:'#c79c58' },
  { label:'其他', value:0, color:'#a9b4ac' },
]
export const parkCarbonResultStructure = [
  { label:'范围一', value:Number((enterpriseCarbonResults.reduce((sum, item) => sum + number(item.scope1), 0) / Math.max(enterpriseCarbonResults.reduce((sum, item) => sum + number(item.totalEmission), 0), 1) * 100).toFixed(1)), color:'#b2762d' },
  { label:'范围二', value:Number((enterpriseCarbonResults.reduce((sum, item) => sum + number(item.scope2), 0) / Math.max(enterpriseCarbonResults.reduce((sum, item) => sum + number(item.totalEmission), 0), 1) * 100).toFixed(1)), color:'#6c8d7a' },
]

export const resultForEnterprise = (results, enterpriseId) => results.filter(item => item.enterpriseId === enterpriseId)
export const officialResults = results => results.filter(item => item.dataStatus === 'official')
