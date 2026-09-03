import { enterprises } from './masterData.js'

export const park = { parkId:'park-qujing', name:'曲靖国家级零碳园区' }
export const subParks = [
  { subParkId:'subpark-01', parkId:park.parkId, name:'光伏产业园', status:'启用' },
  { subParkId:'subpark-02', parkId:park.parkId, name:'新能源电池园', status:'启用' },
  { subParkId:'subpark-03', parkId:park.parkId, name:'循环经济园', status:'启用' },
]

export const zeroCarbonSupportConfig = {
  iocViews:['零碳园区总览','能源流向态势','碳排放与降碳态势'],
  indicatorCount:12,
}

const energySeed = [
  { id:'ec-001', enterpriseId:'ent-001', energy:16.8, electricity:1280, gas:110, heat:100 },
  { id:'ec-002', enterpriseId:'ent-002', energy:18.6, electricity:1360, gas:110, heat:0 },
  { id:'ec-003', enterpriseId:'ent-003', energy:14.2, electricity:1105, gas:95, heat:90 },
  { id:'ec-004', enterpriseId:'ent-004', energy:22.4, electricity:1680, gas:130, heat:0 },
  { id:'ec-005', enterpriseId:'ent-005', energy:12.7, electricity:940, gas:72, heat:0 },
  { id:'ec-006', enterpriseId:'ent-006', energy:26.1, electricity:1860, gas:130, heat:0 },
]
const months = Array.from({length:8}, (_,index)=>`2026-${String(index+1).padStart(2,'0')}`)
const operationSeed = enterprises.map((enterprise,index)=>({ operationDataId:`operation-${enterprise.enterpriseId}`, enterpriseId:enterprise.enterpriseId, value:[52000,42000,38000,46000,26000,61000][index], unit:'万元', source:index===1?'企业填报':'运营台账' }))
const productOutputSeed = [
  { enterpriseId:'ent-001', productId:'product-ent-001-rod', productName:'单晶硅棒', value:3.5, unit:'万吨' },
  { enterpriseId:'ent-001', productId:'product-ent-001-wafer', productName:'单晶硅片', value:1200, unit:'万片' },
  { enterpriseId:'ent-002', productId:'product-ent-002-wafer', productName:'单晶硅片', value:980, unit:'万片' },
  { enterpriseId:'ent-003', productId:'product-ent-003-cell', productName:'光伏电池', value:2.8, unit:'GWh' },
  { enterpriseId:'ent-004', productId:'product-ent-004-battery', productName:'储能电池', value:1.6, unit:'GWh' },
]
const specialSeed = [
  { specialDataId:'special-roof-ent-001', dataItemCode:'SPECIAL_ROOF_AVAILABLE_AREA', enterpriseId:'ent-001', period:'2026', value:82000, unit:'m²', voucher:'企业厂区建筑台账' },
  { specialDataId:'special-pv-roof-ent-001', dataItemCode:'SPECIAL_ROOF_PV_AREA', enterpriseId:'ent-001', period:'2026', value:31000, unit:'m²', voucher:'光伏竣工资料' },
  { specialDataId:'special-roof-ent-002', dataItemCode:'SPECIAL_ROOF_AVAILABLE_AREA', enterpriseId:'ent-002', period:'2026', value:76000, unit:'m²', voucher:'企业厂区建筑台账' },
  { specialDataId:'special-pv-roof-ent-002', dataItemCode:'SPECIAL_ROOF_PV_AREA', enterpriseId:'ent-002', period:'2026', value:28000, unit:'m²', voucher:'光伏竣工资料' },
  { specialDataId:'special-green-building-ent-002', dataItemCode:'SPECIAL_GREEN_BUILDING_AREA', enterpriseId:'ent-002', period:'2026', value:19000, unit:'m²', voucher:'绿色建筑认定材料' },
  { specialDataId:'special-diagnosis-ent-002', dataItemCode:'SPECIAL_ENERGY_DIAGNOSIS_COMPLETED', enterpriseId:'ent-002', period:'2026', value:1, unit:'家', voucher:'能效诊断报告' },
  { specialDataId:'special-vehicles-ent-003', dataItemCode:'SPECIAL_NEW_ENERGY_VEHICLES', enterpriseId:'ent-003', period:'2026', value:18, unit:'辆', voucher:'车辆台账' },
  { specialDataId:'special-vehicles-total-ent-003', dataItemCode:'SPECIAL_TOTAL_VEHICLES', enterpriseId:'ent-003', period:'2026', value:32, unit:'辆', voucher:'车辆台账' },
]
const facilitySeed = [
  { facilityId:'facility-pv-001', enterpriseId:'ent-001', facilityType:'分布式光伏', capacity:32, unit:'MW', location:'晶澳科技厂区屋顶', commissionedAt:'2026-03-18', status:'运行中' },
  { facilityId:'facility-pv-002', enterpriseId:'ent-002', facilityType:'分布式光伏', capacity:28, unit:'MW', location:'曲靖隆基厂区屋顶', commissionedAt:'2026-05-06', status:'运行中' },
  { facilityId:'facility-storage-001', enterpriseId:'ent-004', facilityType:'储能', capacity:12, unit:'MWh', location:'亿纬锂能能源站', commissionedAt:'2026-07-12', status:'试运行' },
]

export const dataItemDefinitions = [
  { dataItemCode:'ENERGY_ELECTRICITY', dataDomain:'energy', name:'购入电力', unit:'万kWh', frequency:'MONTHLY' },
  { dataItemCode:'ENERGY_TOTAL', dataDomain:'energy', name:'综合能源消费', unit:'万tce', frequency:'MONTHLY' },
  { dataItemCode:'ENERGY_NATURAL_GAS', dataDomain:'energy', name:'天然气消费', unit:'万Nm³', frequency:'MONTHLY' },
  { dataItemCode:'ENERGY_HEAT', dataDomain:'energy', name:'外购热力', unit:'万GJ', frequency:'MONTHLY' },
  { dataItemCode:'OP_INDUSTRIAL_VALUE', dataDomain:'operation', name:'工业增加值', unit:'万元', frequency:'MONTHLY' },
  { dataItemCode:'OP_PRODUCT_OUTPUT', dataDomain:'operation', name:'产品产量', unit:'按产品记录', frequency:'MONTHLY' },
  { dataItemCode:'CARBON_SCOPE1', dataDomain:'carbon', name:'范围一碳排放', unit:'万tCO₂e', frequency:'MONTHLY' },
  { dataItemCode:'CARBON_SCOPE2', dataDomain:'carbon', name:'范围二碳排放', unit:'万tCO₂e', frequency:'MONTHLY' },
  { dataItemCode:'SPECIAL_ROOF_AVAILABLE_AREA', dataDomain:'special', name:'可利用屋顶面积', unit:'m²', frequency:'ANNUAL' },
  { dataItemCode:'SPECIAL_ROOF_PV_AREA', dataDomain:'special', name:'光伏覆盖面积', unit:'m²', frequency:'ANNUAL' },
  { dataItemCode:'SPECIAL_GREEN_BUILDING_AREA', dataDomain:'special', name:'星级绿色建筑面积', unit:'m²', frequency:'ANNUAL' },
  { dataItemCode:'SPECIAL_ULTRA_LOW_BUILDING_AREA', dataDomain:'special', name:'超低能耗建筑面积', unit:'m²', frequency:'ANNUAL' },
  { dataItemCode:'SPECIAL_NEW_ENERGY_VEHICLES', dataDomain:'special', name:'新能源交通工具数量', unit:'辆', frequency:'ANNUAL' },
  { dataItemCode:'SPECIAL_TOTAL_VEHICLES', dataDomain:'special', name:'交通工具总数量', unit:'辆', frequency:'ANNUAL' },
  { dataItemCode:'SPECIAL_PCF_CERTIFIED_PRODUCTS', dataDomain:'special', name:'碳足迹认证产品数量', unit:'个', frequency:'ANNUAL' },
  { dataItemCode:'SPECIAL_ENERGY_DIAGNOSIS_COMPLETED', dataDomain:'special', name:'能效诊断完成企业数', unit:'家', frequency:'ANNUAL' },
]

export const dataRequirementRules = dataItemDefinitions.map(item => ({
  ruleId:`rule-template-${item.dataItemCode}`,
  dataItemCode:item.dataItemCode,
  year:'2026',
  frequency:item.frequency,
  required:true,
  appliesToAllManaged:true,
  applicableObjectType:'ENTERPRISE',
}))

export function getApplicableDataRequirements(enterpriseRows=enterprises, year='2026', month='08') {
  const managed=enterpriseRows.filter(item=>item.managedStatus==='已纳管')
  return managed.flatMap(enterprise=>dataRequirementRules.filter(rule=>rule.year===String(year)).flatMap(rule=>{
    if(rule.frequency==='MONTHLY') return Array.from({length:Number(month)},(_,index)=>({...rule,ruleId:`${rule.ruleId}-${enterprise.enterpriseId}-${index+1}`,enterpriseId:enterprise.enterpriseId,period:`${year}-${String(index+1).padStart(2,'0')}`}))
    return [{...rule,ruleId:`${rule.ruleId}-${enterprise.enterpriseId}`,enterpriseId:enterprise.enterpriseId,period:String(year)}]
  }))
}

const commonRecord = ({ recordId, enterpriseId, dataDomain, dataItemCode, period, value, unit, sourceType, sourceRecordId, sourceRecordIds, productId, productName, dataStatus='正式', qualityStatus='正常', evidence='—', updatedAt='2026-08-25 10:30', version=1, objectType='ENTERPRISE', indicatorId }) => ({
  recordId, objectType, objectId:enterpriseId, enterpriseId, productId, productName, dataDomain, dataItemCode, period, value, unit, sourceType, sourceRecordId, sourceRecordIds:sourceRecordIds||[], evidence, dataStatus, qualityStatus, createdAt:'2026-08-20 09:00', updatedAt, version, indicatorId,
  history:version > 1 ? [{ version:version-1, value:typeof value === 'number' ? Number((value * 0.97).toFixed(2)) : value, dataStatus:'正式', updatedAt:'2026-07-31 16:20', reason:'月度数据复核前版本' }] : [],
})

const energyRecords = energySeed.flatMap((item,index)=>months.flatMap(period=>[
  commonRecord({recordId:`bdr-energy-total-${item.enterpriseId}-${period}`,enterpriseId:item.enterpriseId,dataDomain:'energy',dataItemCode:'ENERGY_TOTAL',period,value:item.energy,unit:'万tce',sourceType:'系统自动获取',sourceRecordId:item.id,evidence:'园区既有能碳数据',qualityStatus:index===4&&period==='2026-07'?'待确认':'正常'}),
  commonRecord({recordId:`bdr-electricity-${item.enterpriseId}-${period}`,enterpriseId:item.enterpriseId,dataDomain:'energy',dataItemCode:'ENERGY_ELECTRICITY',period,value:item.electricity,unit:'万kWh',sourceType:'系统自动获取',sourceRecordId:item.id,evidence:'购电结算数据',qualityStatus:index===3&&period==='2026-07'?'待确认':'正常',version:index===1&&period==='2026-07'?2:1}),
  commonRecord({recordId:`bdr-gas-${item.enterpriseId}-${period}`,enterpriseId:item.enterpriseId,dataDomain:'energy',dataItemCode:'ENERGY_NATURAL_GAS',period,value:item.gas,unit:'万Nm³',sourceType:'企业常规填报',sourceRecordId:`${item.id}-gas`,evidence:'天然气结算台账'}),
  ...(item.heat? [commonRecord({recordId:`bdr-heat-${item.enterpriseId}-${period}`,enterpriseId:item.enterpriseId,dataDomain:'energy',dataItemCode:'ENERGY_HEAT',period,value:item.heat,unit:'万GJ',sourceType:'企业常规填报',sourceRecordId:`${item.id}-heat`,evidence:'外购热力结算台账'})] : []),
]))
const operationRecords = operationSeed.flatMap((item,index)=>months.map(period=>commonRecord({recordId:`bdr-operation-${item.enterpriseId}-${period}`,enterpriseId:item.enterpriseId,dataDomain:'operation',dataItemCode:'OP_INDUSTRIAL_VALUE',period,value:item.value,unit:item.unit,sourceType:item.source==='企业填报'?'企业常规填报':'园区维护',sourceRecordId:item.operationDataId,evidence:'企业经营台账',dataStatus:index===5&&period==='2026-07'?'待审核':'正式',qualityStatus:index===5&&period==='2026-07'?'来源冲突':'正常'})))
const productOutputRecords = productOutputSeed.flatMap(item => months.map(period => commonRecord({recordId:`bdr-product-output-${item.productId}-${period}`,enterpriseId:item.enterpriseId,productId:item.productId,productName:item.productName,dataDomain:'operation',dataItemCode:'OP_PRODUCT_OUTPUT',period,value:item.value,unit:item.unit,sourceType:'企业常规填报',sourceRecordId:item.productId,evidence:'产品产量台账',objectType:'ENTERPRISE'})))
const carbonRecords = energySeed.flatMap((item,index)=>months.flatMap(period=>[
  commonRecord({recordId:`bdr-carbon-scope1-${item.enterpriseId}-${period}`,enterpriseId:item.enterpriseId,dataDomain:'carbon',dataItemCode:'CARBON_SCOPE1',period,value:Number((item.gas*0.025).toFixed(2)),unit:'万tCO₂e',sourceType:'系统计算',sourceRecordIds:[`bdr-gas-${item.enterpriseId}-${period}`],sourceRecordId:`bdr-gas-${item.enterpriseId}-${period}`,evidence:'天然气活动数据；排放因子版本 EF-2026-01',qualityStatus:index===5&&period==='2026-07'?'待确认':'正常'}),
  commonRecord({recordId:`bdr-carbon-scope2-${item.enterpriseId}-${period}`,enterpriseId:item.enterpriseId,dataDomain:'carbon',dataItemCode:'CARBON_SCOPE2',period,value:Number((item.electricity*0.0024+(item.heat||0)*0.018).toFixed(2)),unit:'万tCO₂e',sourceType:'系统计算',sourceRecordIds:[`bdr-electricity-${item.enterpriseId}-${period}`,...(item.heat?[`bdr-heat-${item.enterpriseId}-${period}`]:[])],sourceRecordId:`bdr-electricity-${item.enterpriseId}-${period}`,evidence:'购入电力/热力活动数据；排放因子版本 EF-2026-01',qualityStatus:index===3&&period==='2026-07'?'待确认':'正常'}),
]))
const specialRecords = specialSeed.map((item,index)=>commonRecord({recordId:`bdr-special-${item.enterpriseId}-${item.dataItemCode}`,enterpriseId:item.enterpriseId,dataDomain:'special',dataItemCode:item.dataItemCode,period:item.period,value:item.value,unit:item.unit,sourceType:'企业专项填报',sourceRecordId:item.specialDataId,evidence:item.voucher,dataStatus:'正式',qualityStatus:index===5?'待确认':'正常'}))
const rawBusinessDataRecords=[...energyRecords,...operationRecords,...productOutputRecords,...carbonRecords,...specialRecords]

export const dataIssues = [
  { issueId:'issue-001', objectType:'BUSINESS_DATA', objectId:'bdr-electricity-ent-004-2026-07', enterpriseId:'ent-004', dataItemCode:'ENERGY_ELECTRICITY', period:'2026-07', issueType:'待确认', currentValue:'1680 万kWh', sourceRecordId:'ec-004', reason:'购电结算值与企业提交凭证存在差异，需企业核实。', responsibleParty:'ENTERPRISE', relatedIOC:['能源流向态势','碳排放与降碳态势'], relatedIndicator:['单位能耗碳排放'], status:'待处理', createdAt:'2026-08-25 09:20', resolvedAt:'', note:'仅企业责任问题允许进入企业补充任务。' },
  { issueId:'issue-002', objectType:'BUSINESS_DATA', objectId:'bdr-operation-ent-006-2026-07', enterpriseId:'ent-006', dataItemCode:'OP_INDUSTRIAL_VALUE', period:'2026-07', issueType:'来源冲突', currentValue:'61000 万元', sourceRecordId:'operation-ent-006', reason:'园区台账与企业报送值不一致。', responsibleParty:'PARK', relatedIOC:[], relatedIndicator:['单位工业增加值碳排放'], status:'处理中', createdAt:'2026-08-24 15:40', resolvedAt:'', note:'由园区核对台账，不转企业补充任务。' },
  { issueId:'issue-003', objectType:'ENERGY_FLOW', objectId:'flow-grid-ent-006', enterpriseId:'ent-006', dataItemCode:'ENERGY_FLOW_RELATION', period:'长期有效', issueType:'关系不完整', currentValue:'电网接入关系', sourceRecordId:'flow-grid-ent-006', reason:'能源流向关系缺少末端计量点映射。', responsibleParty:'PARK', relatedIOC:['能源流向态势'], relatedIndicator:[], status:'待处理', createdAt:'2026-08-23 11:10', resolvedAt:'', note:'应进入能源与设施维护，不转企业补充任务。' },
  { issueId:'issue-004', objectType:'BUSINESS_DATA', objectId:'bdr-special-ent-002-SPECIAL_GREEN_BUILDING_AREA', enterpriseId:'ent-002', dataItemCode:'SPECIAL_GREEN_BUILDING_AREA', period:'2026', issueType:'待确认', currentValue:'19000 m²', sourceRecordId:'special-green-building-ent-002', reason:'绿色建筑认定材料尚未完成确认。', responsibleParty:'ENTERPRISE', relatedIOC:['零碳园区总览'], relatedIndicator:['绿色低碳建筑占比'], status:'待处理', createdAt:'2026-08-22 10:00', resolvedAt:'', note:'确认企业责任后可进入企业补充任务。' },
  { issueId:'issue-005', objectType:'SYSTEM_SOURCE', objectId:'interface-power-01', enterpriseId:'ent-005', dataItemCode:'ENERGY_TOTAL', period:'2026-07', issueType:'超期未更新', currentValue:'—', sourceRecordId:'interface-power-01', reason:'外部系统最近同步时间超过约定周期。', responsibleParty:'SYSTEM', relatedIOC:['零碳园区总览'], relatedIndicator:['单位能耗碳排放'], status:'待处理', createdAt:'2026-08-26 08:30', resolvedAt:'', note:'系统责任问题不得创建企业补充任务。' },
]
const qualityByIssueType={待确认:'待确认',来源冲突:'来源冲突',关系不完整:'缺失关联',超期未更新:'待确认'}
export const qualityStatusForIssue=issue=>qualityByIssueType[issue?.issueType]||'待确认'
export const businessDataRecords = rawBusinessDataRecords.map(record=>{const issue=dataIssues.find(item=>item.objectId===record.recordId&&item.status!=='已解决');return issue?{...record,qualityStatus:qualityByIssueType[issue.issueType]||record.qualityStatus}:record})

export const energyNodes = [
  { nodeId:'node-grid', nodeType:'能源来源', nodeRole:'SOURCE', name:'曲靖电网接入点', enterpriseId:null, subParkId:'subpark-01', energyType:'电力', energyAttribute:'常规电力', capacity:'220kV', location:'园区北侧变电站', sourceType:'园区维护', status:'启用', effectiveFrom:'2025-01-01' },
  { nodeId:'node-green-power', nodeType:'能源来源', nodeRole:'SOURCE', name:'园区绿电交易来源', enterpriseId:null, subParkId:'subpark-01', energyType:'电力', energyAttribute:'绿色电力', greenSourceType:'中长期绿电交易', capacity:'年度交易协议', location:'外部电源', sourceType:'园区维护', status:'启用', effectiveFrom:'2026-01-01' },
  ...facilitySeed.map(item=>({nodeId:`node-${item.facilityId}`,nodeType:item.facilityType,nodeRole:'FACILITY',name:item.location,enterpriseId:item.enterpriseId,subParkId:enterprises.find(x=>x.enterpriseId===item.enterpriseId)?.subParkId,energyType:'电力',energyAttribute:item.facilityType==='分布式光伏'?'绿色电力':'常规电力',greenSourceType:item.facilityType==='分布式光伏'?'直连绿电':'',capacity:`${item.capacity} ${item.unit}`,location:item.location,sourceType:'园区维护',status:item.status==='运行中'?'启用':'试运行',effectiveFrom:item.commissionedAt})),
  ...enterprises.map(item=>({nodeId:`node-consumer-${item.enterpriseId}`,nodeType:'企业用能节点',nodeRole:'CONSUMER',name:`${item.name}用能节点`,enterpriseId:item.enterpriseId,subParkId:item.subParkId,energyType:'电力',energyAttribute:'混合电力',capacity:'按企业接入容量',location:item.address,sourceType:'企业档案映射',status:item.managedStatus==='已退出'?'停用':'启用',effectiveFrom:'2025-01-01'})),
]
export const energyFlowRelations = [
  ...enterprises.map((item,index)=>({flowId:`flow-grid-${item.enterpriseId}`,sourceNodeId:'node-grid',targetNodeId:`node-consumer-${item.enterpriseId}`,energyType:'电力',energyAttribute:'常规电力',greenSourceType:'',effectiveFrom:'2025-01-01',effectiveTo:'',sourceType:'园区维护',status:index===5?'待确认':'有效'})),
  {flowId:'flow-green-ent-002',sourceNodeId:'node-green-power',targetNodeId:'node-consumer-ent-002',energyType:'电力',energyAttribute:'绿色电力',greenSourceType:'中长期绿电交易',effectiveFrom:'2026-01-01',effectiveTo:'2026-12-31',sourceType:'绿电协议',status:'有效'},
  {flowId:'flow-pv-ent-001',sourceNodeId:'node-facility-pv-001',targetNodeId:'node-consumer-ent-001',energyType:'电力',energyAttribute:'绿色电力',greenSourceType:'直连绿电',effectiveFrom:'2026-03-18',effectiveTo:'',sourceType:'设施投运资料',status:'有效'},
]

export const sourceTypeOptions=['系统自动获取','园区维护','企业常规填报','企业专项填报','专业服务回流','系统计算']
export const dataStatusOptions=['草稿','待审核','正式','已退回','已作废']
export const qualityStatusOptions=['正常','待确认','异常','缺失关联','来源冲突']
export const domainLabels={energy:'能源数据',operation:'运营数据',carbon:'碳排放数据',special:'零碳专项数据'}
export const sourceNodeName=nodeId=>energyNodes.find(item=>item.nodeId===nodeId)?.name||'—'
export const enterpriseName=enterpriseId=>enterprises.find(item=>item.enterpriseId===enterpriseId)?.name||'—'
export const dataItemName=code=>code==='ENERGY_FLOW_RELATION'?'能源流向关系':dataItemDefinitions.find(item=>item.dataItemCode===code)?.name||code

export function getPeriodParts(period){const match=String(period||'').match(/^(\d{4})(?:-(\d{2}))?/);return match?{year:match[1],month:match[2]?Number(match[2]):null}:{} }
export function recordMatchesPeriod(record,year='2026',month='08'){const parts=getPeriodParts(record.period);if(parts.year!==String(year))return false;const definition=dataItemDefinitions.find(item=>item.dataItemCode===record.dataItemCode);return definition?.frequency==='ANNUAL'||(parts.month!==null&&parts.month<=Number(month))}
export function issueMatchesPeriod(issue,year='2026',month='08'){if(issue.period==='长期有效')return true;const parts=getPeriodParts(issue.period);return parts.year===String(year)&&(!parts.month||parts.month<=Number(month))}

export function buildDataOverview(records=businessDataRecords,issues=dataIssues,enterpriseRows=enterprises,year='2026',month='08',scope='all'){
  const scopedEnterprises=enterpriseRows.filter(item=>item.managedStatus==='已纳管'&&(!scope||scope==='all'||(scope==='key'&&item.isKeyEnterprise)))
  const scopedRecords=records.filter(item=>item.dataStatus!=='已作废'&&recordMatchesPeriod(item,year,month)&&scopedEnterprises.some(enterprise=>enterprise.enterpriseId===item.enterpriseId))
  const applicableRules=getApplicableDataRequirements(scopedEnterprises,year,month)
  const acquiredKeys=new Set(scopedRecords.map(item=>`${item.enterpriseId}:${item.dataItemCode}:${item.period}`))
  const acquired=applicableRules.filter(rule=>acquiredKeys.has(`${rule.enterpriseId}:${rule.dataItemCode}:${rule.period}`)).length
  const activeIssues=issues.filter(item=>item.status!=='已解决'&&issueMatchesPeriod(item,year,month)&&(!item.enterpriseId||scopedEnterprises.some(enterprise=>enterprise.enterpriseId===item.enterpriseId)))
  const affectedIOC=new Set(activeIssues.flatMap(item=>item.relatedIOC||[])),affectedIndicators=new Set(activeIssues.flatMap(item=>item.relatedIndicator||[]))
  const activeRecords=scopedRecords,formalRecords=activeRecords.filter(item=>item.dataStatus==='正式')
  return {managedCount:scopedEnterprises.length,expectedCount:enterpriseRows.filter(item=>item.managedStatus!=='已退出').length,coverageRate:applicableRules.length?Math.round(acquired/applicableRules.length*100):0,formalRate:activeRecords.length?Math.round(formalRecords.length/activeRecords.length*100):0,issueCount:activeIssues.length,affectedIOCCount:affectedIOC.size,affectedIndicatorCount:affectedIndicators.size,scopedRecords,activeIssues,applicableRules}
}

export const reportingItemTemplates=[{templateId:'tpl-electricity',name:'企业用电量',category:'能源与绿色能源',unit:'万kWh',previous:'1280',required:true,voucherRequired:false,source:'系统已有',businessLinks:['综合能耗','碳排放核算']},{templateId:'tpl-heat',name:'外购热力',category:'能源与绿色能源',unit:'万GJ',previous:'120',required:true,voucherRequired:true,source:'企业填写',businessLinks:['碳排放核算']},{templateId:'tpl-gas',name:'天然气消费量',category:'能源与绿色能源',unit:'万Nm³',previous:'104',required:true,voucherRequired:false,source:'企业填写',businessLinks:['范围一碳排放']},{templateId:'tpl-green-power',name:'绿证对应电量',category:'能源与绿色能源',unit:'万kWh',previous:'80',required:true,voucherRequired:true,source:'企业填写',businessLinks:['清洁能源消费占比']},{templateId:'tpl-output',name:'工业增加值',category:'生产经营',unit:'万元',previous:'42000',required:true,voucherRequired:false,source:'企业填写',businessLinks:['相关强度指标']},{templateId:'tpl-solid-waste',name:'工业固废综合利用量',category:'资源循环',unit:'万吨',previous:'2.4',required:true,voucherRequired:true,source:'企业填写',businessLinks:['资源循环指标']}]
const enterpriseSeedValues={'ent-001':{electricity:'1360',heat:'100',gas:'110',greenPower:'80',output:'42000',solidWaste:'2.4'},'ent-002':{electricity:'1360',gas:'110'},'ent-003':{electricity:'1105',heat:'90',gas:'95',greenPower:'70',output:'38000',solidWaste:'2.1'},'ent-004':{electricity:'1680',gas:'130'},'ent-005':{electricity:'940',gas:'72',output:'26000'},'ent-006':{electricity:'1860'}}
const valueKey=template=>template.templateId.replace('tpl-','')
export const reportingCampaigns=[{campaignId:'campaign-2026',name:'2026年度企业数据补充任务',purpose:'年度企业数据补充',period:'2026年度',deadline:'2027-01-31',enterpriseIds:enterprises.map(x=>x.id),templateIds:reportingItemTemplates.filter(x=>x.source==='企业填写').map(x=>x.templateId),status:'已发布'}]
export const reportingTasks=enterprises.map((enterprise,index)=>({taskId:'report-task-'+enterprise.id,campaignId:'campaign-2026',enterpriseId:enterprise.id,period:'2026年度',deadline:'2027-01-31',status:[0,2].includes(index)?'已提交':'填报中',submittedAt:[0,2].includes(index)?'2026-08-25 09:30':'',updated:'2026-08-25'}))
export const reportingTaskItems=reportingTasks.flatMap(task=>reportingItemTemplates.map(template=>({id:task.taskId+'-'+template.templateId,taskId:task.taskId,templateId:template.templateId,enterpriseId:task.enterpriseId,value:enterpriseSeedValues[task.enterpriseId]?.[valueKey(template)]||'',voucherUploaded:Boolean(enterpriseSeedValues[task.enterpriseId]?.[valueKey(template)])})))
export const constructionTasks=[{id:'task-1',name:'重点企业屋顶分布式光伏建设',type:'新能源建设',owner:'园区及企业',plan:'2026-03 ~ 2026-12',status:'进行中',update:'08-22',indicatorIds:['ind-roof'],acceptanceItemIds:['accept-roof','accept-green'],achievementIds:['archive-roof']},{id:'task-2',name:'园区绿电直接供应机制建设',type:'能源体系',owner:'园区',plan:'2026-04 ~ 2026-11',status:'待确认',update:'08-18',indicatorIds:['ind-clean-energy'],acceptanceItemIds:['accept-clean'],achievementIds:[]},{id:'task-3',name:'重点用能企业能效诊断',type:'节能改造',owner:'企业',plan:'2026-01 ~ 2026-09',status:'未开始',update:'—',indicatorIds:['ind-diagnosis'],acceptanceItemIds:['accept-diagnosis'],achievementIds:[]}]
export const scenarios=[{scenarioId:'scenario-001',name:'绿电提升+光伏扩容',params:{green:32,pv:85,saving:4.5,capacity:2},updated:'2026-08-25'}]
export const reportTemplates=[{templateId:'tpl-energy-monthly',name:'园区能碳运行月报',type:'运行分析',sourceModules:['园区能碳监测'],period:'2026年7月'},{templateId:'tpl-indicator-summary',name:'零碳指标评价汇总',type:'指标评价',sourceModules:['零碳指标管控'],period:'2026年上半年'},{templateId:'tpl-construction-yearly',name:'年度零碳建设报告',type:'建设总结',sourceModules:['建设任务','指标','成果'],period:'2026年度'},{templateId:'tpl-acceptance',name:'验收支撑汇总报告',type:'验收支撑',sourceModules:['零碳成果与验收支撑'],period:'2026年度'}]
export const knowledgeItems=[{knowledgeId:'know-policy-001',title:'云南省绿色低碳相关政策汇编',type:'policy',category:'省级政策',source:'云南省相关部门',date:'2026-06-18',status:'已发布',summary:'云南省绿色低碳相关政策资料汇编。'},{knowledgeId:'know-policy-002',title:'零碳园区建设相关政策解读',type:'policy',category:'专题政策',source:'园区管理机构',date:'2026-07-02',status:'已发布',summary:'零碳园区建设政策的辅助解读资料。'},{knowledgeId:'know-standard-001',title:'工业企业温室气体排放核算相关标准',type:'standard',category:'碳核算标准',source:'国家标准',date:'2025-12-01',status:'已发布',summary:'工业企业温室气体排放核算相关标准资料。'},{knowledgeId:'know-standard-002',title:'产品碳足迹核算通则',type:'standard',category:'碳足迹标准',source:'行业组织',date:'2026-02-16',status:'已发布',summary:'产品碳足迹核算通用参考资料。'}]
