// 2025年度数据按绿色能源态势大屏统一；光伏指标使用2024年度数据。
const enterpriseInputs = [
  { enterpriseId:'ent-001', name:'曲靖晶澳光伏科技有限公司', industry:'光伏制造', electricity:88136.44, gas:162.94, gasoline:0.5, diesel:0.06, heat:12800 },
  { enterpriseId:'ent-002', name:'曲靖晶澳太阳能科技有限公司', industry:'光伏制造', electricity:60765.12, gas:100, gasoline:0.6, diesel:0.06, heat:6000 },
  { enterpriseId:'ent-003', name:'曲靖隆基硅材料有限公司', industry:'硅材料制造', electricity:46769.02, gas:100, gasoline:0.55, diesel:0.05, heat:8000 },
  { enterpriseId:'ent-004', name:'曲靖阳光新能源股份有限公司', industry:'新能源制造', electricity:38848.31, gas:80, gasoline:0.45, diesel:0.04, heat:9000 },
  { enterpriseId:'ent-005', name:'云南润阳世纪光伏科技有限公司', industry:'光伏制造', electricity:34164.91, gas:60, gasoline:0.4, diesel:0.04, heat:3500 },
  { enterpriseId:'ent-006', name:'曲靖亿纬锂能有限公司', industry:'新能源电池', electricity:11456.18, gas:660, gasoline:4.65, diesel:0.46, heat:0 },
]

const toWanTce = input => ({
  electricity:input.electricity * 3.233 / 10000,
  gas:input.gas * 11.95 / 10000,
  heat:input.heat * 0.03412 / 10000,
  transport:(input.gasoline * 1.4714 + input.diesel * 1.4571) / 10000,
})

export const dashboardEnterpriseEnergyRows = enterpriseInputs.map(input => {
  const energyBreakdown = toWanTce(input)
  const totalStandardCoal = Object.values(energyBreakdown).reduce((sum, value) => sum + value, 0)
  const scope1 = (input.gas * 20.4 + input.gasoline * 2.985 + input.diesel * 3.159 + input.heat * 0.11) / 10000
  const scope2 = input.electricity * 1.333 / 10000
  return {
    ...input,
    periodType:'YEAR',
    period:'2025',
    energy:totalStandardCoal,
    totalStandardCoal,
    energyIntensity:(scope1 + scope2) / totalStandardCoal,
    emissions:scope1 + scope2,
    scope1,
    scope2,
    energyBreakdown,
    electricityBillionKwh:input.electricity / 10000,
    gasMillionNm3:input.gas / 100,
    heatWanGJ:input.heat / 10000,
    dataStatus:'official',
    accountingStatus:'confirmed',
    mainEmissionSources:['购入电力', ...(input.heat ? ['购入热力'] : []), ...(input.gas ? ['天然气'] : [])],
  }
})

export const dashboardAnnualBaseline = {
  period:'2025年度',
  energy:{
    total:94.073695,
    structure:{ electricity:92.087434, gas:1.543701, heat:0.441314, transport:0.001156 },
    electricityBillionKwh:28.483586,
    gasWanNm3:1291.8,
    heatGJ:129341.79,
  },
  carbon:{
    total:42.02901,
    scope1:4.06039,
    scope2:37.96862,
    intensity:0.4468,
    sources:{ electricity:37.96862, gas:2.635272, heat:1.42276, transport:0.002358 },
  },
  solar:{
    dataYear:'2024',
    installedMW:74.17,
    generationWanKwh:8022.9,
    selfUseWanKwh:6613.7,
    exportedWanKwh:1409.2,
    selfUseRate:82,
  },
}
