export const facilityTypes = ['公共供能', '新能源发电', '能源转换', '储能', '回收利用', '外供设施']
export const publicSubject = '园区公共能源运营有限公司'
export const operatingStates = ['运行中', '试运行', '检修中', '停用']
const rated = (label, value, unit) => ({ label, value, unit })

export function createPublicFacilitySeed() {
  return [
    { id:'qj-pv-001', code:'QJ-PV-001', name:'南海子公共光伏一期', type:'新能源发电', subject:publicSubject, operator:publicSubject, location:'南海子片区公共厂房屋顶', commissionedAt:'2026-01-01', status:'运行中', management:'园区公共', capacities:[rated('装机容量',10,'MWp')], condition:'直流侧标称装机容量', changes:[{at:'2026-01-01',action:'纳入园区公共设施台账',actor:'园区管理员'}] },
    { id:'qj-storage-001', code:'QJ-ES-001', name:'园区公共储能站', type:'储能', subject:publicSubject, operator:publicSubject, location:'南海子片区综合能源站', commissionedAt:'2026-02-15', status:'运行中', management:'园区公共', capacities:[rated('额定功率',5,'MW'),rated('额定能量',10,'MWh')], condition:'额定工况；功率与能量分别统计', changes:[{at:'2026-02-15',action:'纳入园区公共设施台账',actor:'园区管理员'}] },
    { id:'qj-heat-001', code:'QJ-HT-001', name:'园区集中供热站', type:'公共供能', subject:publicSubject, operator:publicSubject, location:'园区东部供热中心', commissionedAt:'2025-11-01', status:'运行中', management:'园区公共', capacities:[rated('设计供热能力',40,'t/h')], condition:'蒸汽额定工况', changes:[{at:'2025-11-01',action:'纳入园区公共设施台账',actor:'园区管理员'}] },
    { id:'qj-transformer-001', code:'QJ-TR-001', name:'园区公共变配电站', type:'能源转换', subject:publicSubject, operator:publicSubject, location:'园区北侧变电站', commissionedAt:'2025-08-01', status:'运行中', management:'园区公共', capacities:[rated('额定容量',20,'MVA')], condition:'主变铭牌额定容量', changes:[{at:'2025-08-01',action:'纳入园区公共设施台账',actor:'园区管理员'}] },
    { id:'qj-recovery-001', code:'QJ-RH-001', name:'园区余热回收中心', type:'回收利用', subject:publicSubject, operator:publicSubject, location:'循环经济园公共能源区', commissionedAt:'2026-04-01', status:'试运行', management:'园区公共', capacities:[rated('设计回收能力',8,'t/h')], condition:'按额定蒸汽回收工况', changes:[{at:'2026-04-01',action:'纳入园区公共设施台账',actor:'园区管理员'}] },
    { id:'qj-steam-001', code:'QJ-ST-001', name:'园区蒸汽外供站', type:'外供设施', subject:publicSubject, operator:publicSubject, location:'园区南侧外供接口', commissionedAt:'2026-03-01', status:'检修中', management:'园区公共', capacities:[rated('设计外供能力',30,'t/h')], condition:'按额定蒸汽外供工况', changes:[{at:'2026-03-01',action:'纳入园区公共设施台账',actor:'园区管理员'}] },
  ]
}

// These are facility-specific business records. Rated capacities remain in the archive above.
export const facilityOperationRecords = [
  { id:'op-qj-pv-001-2026-09', facilityId:'qj-pv-001', period:'2026-09', source:'并网计量系统', meter:'PV-M001', metrics:[rated('发电量',112.6,'万kWh'),rated('站用电量',0.6,'万kWh')], load:'—' },
  { id:'op-qj-pv-001-2026-08', facilityId:'qj-pv-001', period:'2026-08', source:'并网计量系统', meter:'PV-M001', metrics:[rated('发电量',108.3,'万kWh'),rated('站用电量',0.5,'万kWh')], load:'—' },
  { id:'op-qj-storage-001-2026-09', facilityId:'qj-storage-001', period:'2026-09', source:'储能站计量月报', meter:'ES-M001', metrics:[rated('充电量',48.2,'万kWh'),rated('放电量',43.5,'万kWh'),rated('最大运行功率',4.3,'MW')], load:'4.3 MW 最大运行功率' },
  { id:'op-qj-heat-001-2026-09', facilityId:'qj-heat-001', period:'2026-09', source:'供热站运行月报', meter:'HT-M001', metrics:[rated('天然气投入',52.1,'万Nm³'),rated('蒸汽产出',12.4,'万t'),rated('峰值供热负荷',31.6,'t/h')], load:'31.6 t/h 峰值供热负荷' },
  { id:'op-qj-transformer-001-2026-09', facilityId:'qj-transformer-001', period:'2026-09', source:'变电站计量月报', meter:'TR-M001', metrics:[rated('输入电量',340.2,'万kWh'),rated('输出电量',331.6,'万kWh'),rated('峰值负荷',12.8,'MVA')], load:'12.8 MVA 峰值负荷' },
  { id:'op-qj-recovery-001-2026-09', facilityId:'qj-recovery-001', period:'2026-09', source:'余热回收运行月报', meter:'RH-M001', metrics:[rated('回收蒸汽量',1.8,'万t'),rated('峰值回收负荷',6.2,'t/h')], load:'6.2 t/h 峰值回收负荷' },
  { id:'op-qj-steam-001-2026-09', facilityId:'qj-steam-001', period:'2026-09', source:'蒸汽外供结算月报', meter:'ST-M001', metrics:[rated('外供蒸汽量',6.4,'万t'),rated('峰值外供负荷',24.1,'t/h')], load:'24.1 t/h 峰值外供负荷' },
]

export const publicFacilityRelations = [
  { id:'relation-qj-pv-storage', facilityId:'qj-pv-001', target:'园区公共储能站', energyType:'电力', mode:'光伏就近消纳', status:'有效' },
  { id:'relation-qj-heat-park', facilityId:'qj-heat-001', target:'园区公共供热管网', energyType:'蒸汽', mode:'集中供热', status:'有效' },
  { id:'relation-qj-steam-external', facilityId:'qj-steam-001', target:'园区外部用汽单位', energyType:'蒸汽', mode:'蒸汽外供', status:'有效' },
]

export const capacityText = facility => facility.capacities.map(item => `${item.value} ${item.unit}`).join(' / ') || '—'

export function sharedEnterpriseFacilities(nodes, enterpriseRows) {
  return nodes.filter(node => node.nodeRole === 'FACILITY' && node.enterpriseId && node.shareToPark === true).map(node => {
    const enterprise = enterpriseRows.find(item => item.enterpriseId === node.enterpriseId)
    const [value, unit] = String(node.capacity || '').split(/\s+/)
    const isStorage = node.nodeType === '储能'
    return { id:node.nodeId, code:node.nodeId.toUpperCase(), name:node.name, type:isStorage ? '储能' : '新能源发电', subject:enterprise?.name || node.enterpriseId, operator:enterprise?.name || node.enterpriseId, enterpriseId:node.enterpriseId, location:node.location, commissionedAt:node.effectiveFrom, status:node.status === '启用' ? '运行中' : node.status, management:'企业共享', capacities:isStorage ? [rated('额定功率',node.ratedPower,'MW'),rated('额定能量',value,unit)] : [rated('装机容量',value,unit)], condition:isStorage ? '企业设施档案额定工况' : '企业光伏设施档案装机口径', changes:[{at:node.effectiveFrom,action:'企业设施按约定范围共享',actor:enterprise?.name || '企业'}] }
  })
}

export function validatePublicFacility(facility, existing = []) {
  if (!facility.code?.trim() || !facility.name?.trim() || !facility.location?.trim() || !facility.commissionedAt || !facility.operator?.trim()) throw new Error('请填写设施编码、名称、运营主体、位置和投运时间')
  if (existing.some(item => item.code === facility.code && item.id !== facility.id)) throw new Error('设施编码不能重复')
  if (!facilityTypes.includes(facility.type) || !operatingStates.includes(facility.status)) throw new Error('请选择有效的设施类型和运行状态')
  if (facility.capacities.some(item => !Number.isFinite(Number(item.value)) || Number(item.value) <= 0)) throw new Error('额定能力须为大于 0 的数值')
  if (!facility.capacities.length) throw new Error('请填写额定能力')
  return facility
}
