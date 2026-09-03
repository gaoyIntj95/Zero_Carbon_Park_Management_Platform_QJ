import { useMemo, useState } from 'react'
import { PageHeader } from '../../components/PageHeader.jsx'
import { DataPanel } from '../../components/DataPanel.jsx'
import { Tabs } from '../../components/Tabs.jsx'
import { Modal } from '../../components/Modal.jsx'
import { StatusTag } from '../../components/StatusTag.jsx'
import { Table } from './shared.jsx'

const categories = [
  { value: 'efficiency', label: '能效与诊断' }, { value: 'resource', label: '资源利用' }, { value: 'building', label: '建筑与光伏' }, { value: 'transport', label: '新能源交通' }, { value: 'certification', label: '碳足迹认证' },
]
const percent = (n, d) => d ? `${(n / d * 100).toFixed(2)}%` : '暂无数据'
const achievement = (n, d, target) => d ? n / d * 100 >= target ? '达标' : '未达标' : '暂无数据'
const statusTone = status => ['达标', '全部达标', '已完成', '已认证'].includes(status) ? 'ok' : ['未达标', '未完成', '未认证'].includes(status) ? 'danger' : status === '部分达标' ? 'warn' : 'gray'

const specialData = {
  efficiency: [
    { enterprise: '曲靖隆基', year: '2026', diagnosis: '已完成', source: '能效诊断报告、企业产品能耗台账', products: [{ name: '单晶硅片', energy: 8.8, limit: 9.2, unit: 'kgce/单位产品' }, { name: '单晶硅棒', energy: 10.6, limit: 11, unit: 'kgce/单位产品' }] },
    { enterprise: '晶澳科技', year: '2026', diagnosis: '已完成', source: '能效诊断报告、企业产品能耗台账', products: [{ name: '高效光伏组件', energy: 14.1, limit: 13.8, unit: 'kgce/单位产品' }, { name: '单晶硅片', energy: 8.7, limit: 9.2, unit: 'kgce/单位产品' }, { name: '光伏电池', energy: 12.5, limit: 12.8, unit: 'kgce/单位产品' }] },
    { enterprise: '阳光新能源', year: '2026', diagnosis: '未完成', source: '企业产品能耗台账', products: [{ name: '光伏逆变器', energy: 6.4, limit: 6, unit: 'kgce/单位产品' }] },
  ],
  resource: [
    { enterprise: '曲靖隆基', year: '2026', source: '固废处置台账、余热利用台账、用水台账', solidWaste: [86000, 100000], wasteHeat: [28000, 50000], water: [82000, 100000] },
    { enterprise: '晶澳科技', year: '2026', source: '固废处置台账、余热利用台账、用水台账', solidWaste: [72000, 90000], wasteHeat: [18000, 40000], water: [61000, 80000] },
    { enterprise: '阳光新能源', year: '2026', source: '企业专项填报待补充', solidWaste: null, wasteHeat: null, water: null },
  ],
  building: [
    { enterprise: '曲靖隆基', year: '2026', source: '厂区建筑台账、光伏竣工资料、绿色建筑认定材料', pvBuilt: 46000, pvAvailable: 82000, greenBuildings: 4, newBuildings: 10 },
    { enterprise: '晶澳科技', year: '2026', source: '厂区建筑台账、光伏竣工资料、绿色建筑认定材料', pvBuilt: 28000, pvAvailable: 76000, greenBuildings: 2, newBuildings: 8 },
    { enterprise: '阳光新能源', year: '2026', source: '企业新建建筑台账待补充', pvBuilt: null, pvAvailable: null, greenBuildings: null, newBuildings: null },
  ],
  transport: [
    { enterprise: '曲靖隆基', year: '2026', source: '企业交通运输工具台账', newEnergy: 22, total: 30 }, { enterprise: '晶澳科技', year: '2026', source: '企业交通运输工具台账', newEnergy: 18, total: 32 }, { enterprise: '阳光新能源', year: '2026', source: '企业交通运输工具台账', newEnergy: 8, total: 20 },
  ],
  certification: [
    { enterprise: '曲靖隆基', year: '2026', source: '产品碳足迹认证证书', products: [{ name: '单晶硅片', organization: '中国质量认证中心', certificate: 'CQC-PCF-2026-001', date: '2026-03-12' }, { name: '单晶硅棒', organization: '中国质量认证中心', certificate: 'CQC-PCF-2026-002', date: '2026-04-20' }, { name: 'N型硅片', organization: '中国质量认证中心', certificate: 'CQC-PCF-2026-003', date: '2026-05-18' }, { name: '高效硅片', organization: '中国质量认证中心', certificate: 'CQC-PCF-2026-004', date: '2026-06-08' }] },
    { enterprise: '晶澳科技', year: '2026', source: '产品碳足迹认证证书', products: [{ name: '高效光伏组件', organization: '第三方认证机构', certificate: 'PCF-2026-021', date: '2026-02-16' }, { name: '单晶硅片', organization: '第三方认证机构', certificate: 'PCF-2026-022', date: '2026-04-11' }, { name: '光伏电池', organization: '第三方认证机构', certificate: 'PCF-2026-023', date: '2026-07-05' }] },
    { enterprise: '阳光新能源', year: '2026', source: '企业认证资料待补充', products: [] },
  ],
}

function energyStatus(products) { const passed = products.filter(item => item.energy <= item.limit).length; return passed === products.length ? '全部达标' : passed ? '部分达标' : '未达标' }
function Rate({ numerator, denominator, target }) { const status = achievement(numerator, denominator, target); return <span>{percent(numerator, denominator)} {denominator && <StatusTag tone={statusTone(status)}>{status}</StatusTag>}</span> }
function DetailGrid({ children }) { return <div className="dm-detail-grid">{children}</div> }
function DetailItem({ label, children, wide = false }) { return <div className={wide ? 'wide' : ''}><label>{label}</label><b>{children}</b></div> }

export function ZeroCarbonSpecialDataPage() {
  const [category, setCategory] = useState('efficiency')
  const [detail, setDetail] = useState(null)
  const active = categories.find(item => item.value === category) || categories[0]
  const rows = useMemo(() => specialData[category], [category])
  const view = category === 'efficiency' ? <Table headers={['企业', '适用产品数', '达标产品数', '产品能效状态', '能效诊断状态', '年度', '操作']} rows={rows.map(item => { const passed = item.products.filter(product => product.energy <= product.limit).length, status = energyStatus(item.products); return { key: item.enterprise, cells: [item.enterprise, item.products.length, passed, <StatusTag tone={statusTone(status)}>{status}</StatusTag>, <StatusTag tone={statusTone(item.diagnosis)}>{item.diagnosis}</StatusTag>, item.year, <button className="op-btn" onClick={() => setDetail(item)}>查看</button>] } })} />
    : category === 'resource' ? <Table headers={['企业', '工业固废利用率', '余热/余压利用率', '工业用水利用率', '年度', '操作']} rows={rows.map(item => ({ key: item.enterprise, cells: [item.enterprise, <Rate numerator={item.solidWaste?.[0]} denominator={item.solidWaste?.[1]} target={80} />, <Rate numerator={item.wasteHeat?.[0]} denominator={item.wasteHeat?.[1]} target={50} />, <Rate numerator={item.water?.[0]} denominator={item.water?.[1]} target={80} />, item.year, <button className="op-btn" onClick={() => setDetail(item)}>查看</button>] }))} />
    : category === 'building' ? <Table headers={['企业/数据主体', '已建设屋顶光伏面积', '可利用建筑屋顶面积', '屋顶光伏覆盖率', '绿色/超低能耗建筑数量', '新建建筑数量', '绿色建筑占比', '年度', '操作']} rows={rows.map(item => ({ key: item.enterprise, cells: [item.enterprise, item.pvBuilt == null ? '暂无数据' : `${item.pvBuilt.toLocaleString()} m²`, item.pvAvailable == null ? '暂无数据' : `${item.pvAvailable.toLocaleString()} m²`, <Rate numerator={item.pvBuilt} denominator={item.pvAvailable} target={50} />, item.greenBuildings == null ? '暂无数据' : `${item.greenBuildings} 栋`, item.newBuildings == null ? '暂无数据' : `${item.newBuildings} 栋`, <Rate numerator={item.greenBuildings} denominator={item.newBuildings} target={30} />, item.year, <button className="op-btn" onClick={() => setDetail(item)}>查看</button>] }))} />
    : category === 'transport' ? <Table headers={['企业/数据主体', '新能源交通运输工具数量', '纳入统计交通运输工具总数量', '新能源交通运输工具比例', '年度', '操作']} rows={rows.map(item => ({ key: item.enterprise, cells: [item.enterprise, `${item.newEnergy} 辆`, `${item.total} 辆`, <Rate numerator={item.newEnergy} denominator={item.total} target={60} />, item.year, <button className="op-btn" onClick={() => setDetail(item)}>查看</button>] }))} />
    : <Table headers={['企业', '碳足迹认证产品数量', '年度', '操作']} rows={rows.map(item => ({ key: item.enterprise, cells: [item.enterprise, `${item.products.length} 个`, item.year, <button className="op-btn" onClick={() => setDetail(item)}>查看</button>] }))} />
  return <div className="content dm-page"><PageHeader title="零碳专项数据" subtitle="维护零碳园区指标计算、建设跟踪和验收支撑所需的专项基础数据。" /><Tabs tabs={categories} active={category} onChange={setCategory} /><DataPanel title={active.label} description="人工维护数量、面积和状态等原始数据；比例、覆盖率及达标状态由系统计算。">{view}</DataPanel><SpecialDataDetail category={category} item={detail} onClose={() => setDetail(null)} /></div>
}

function SpecialDataDetail({ category, item, onClose }) {
  if (!item) return null
  const rawData = category === 'efficiency' ? <Table headers={['产品名称', '单位产品能耗', '二级限额值', '单位', '达标状态']} rows={item.products.map(product => ({ key: product.name, cells: [product.name, product.energy, product.limit, product.unit, <StatusTag tone={statusTone(product.energy <= product.limit ? '达标' : '未达标')}>{product.energy <= product.limit ? '达标' : '未达标'}</StatusTag>] }))} />
    : category === 'certification' ? <Table headers={['产品名称', '认证状态', '认证机构/证书信息', '认证时间']} rows={item.products.map(product => ({ key: product.name, cells: [product.name, <StatusTag tone="ok">已认证</StatusTag>, `${product.organization} / ${product.certificate}`, product.date] }))} empty="暂无碳足迹认证产品数据" />
    : <DetailGrid>{category === 'resource' && <><DetailItem label="工业固废产生量">{item.solidWaste ? `${item.solidWaste[1].toLocaleString()} 吨` : '暂无数据'}</DetailItem><DetailItem label="工业固废利用量">{item.solidWaste ? `${item.solidWaste[0].toLocaleString()} 吨` : '暂无数据'}</DetailItem><DetailItem label="余热/余压可利用量">{item.wasteHeat ? `${item.wasteHeat[1].toLocaleString()} GJ` : '暂无数据'}</DetailItem><DetailItem label="余热/余压实际利用量">{item.wasteHeat ? `${item.wasteHeat[0].toLocaleString()} GJ` : '暂无数据'}</DetailItem><DetailItem label="工业用水指标计算分母">{item.water ? `${item.water[1].toLocaleString()} m³` : '暂无数据'}</DetailItem><DetailItem label="工业用水指标计算分子">{item.water ? `${item.water[0].toLocaleString()} m³` : '暂无数据'}</DetailItem></>}{category === 'building' && <><DetailItem label="已建设屋顶光伏面积">{item.pvBuilt == null ? '暂无数据' : `${item.pvBuilt.toLocaleString()} m²`}</DetailItem><DetailItem label="可利用建筑屋顶面积">{item.pvAvailable == null ? '暂无数据' : `${item.pvAvailable.toLocaleString()} m²`}</DetailItem><DetailItem label="星级绿色建筑/超低能耗建筑数量">{item.greenBuildings == null ? '暂无数据' : `${item.greenBuildings} 栋`}</DetailItem><DetailItem label="新建建筑数量">{item.newBuildings == null ? '暂无数据' : `${item.newBuildings} 栋`}</DetailItem></>}{category === 'transport' && <><DetailItem label="新能源交通运输工具数量">{item.newEnergy} 辆</DetailItem><DetailItem label="纳入统计交通运输工具总数量">{item.total} 辆</DetailItem></>}</DetailGrid>
  const result = category === 'efficiency' ? <DetailGrid><DetailItem label="产品能效状态"><StatusTag tone={statusTone(energyStatus(item.products))}>{energyStatus(item.products)}</StatusTag></DetailItem><DetailItem label="能效诊断状态"><StatusTag tone={statusTone(item.diagnosis)}>{item.diagnosis}</StatusTag></DetailItem></DetailGrid>
    : category === 'resource' ? <DetailGrid><DetailItem label="工业固废利用率"><Rate numerator={item.solidWaste?.[0]} denominator={item.solidWaste?.[1]} target={80} /></DetailItem><DetailItem label="余热/余压利用率"><Rate numerator={item.wasteHeat?.[0]} denominator={item.wasteHeat?.[1]} target={50} /></DetailItem><DetailItem label="工业用水利用率"><Rate numerator={item.water?.[0]} denominator={item.water?.[1]} target={80} /></DetailItem></DetailGrid>
    : category === 'building' ? <DetailGrid><DetailItem label="屋顶光伏覆盖率"><Rate numerator={item.pvBuilt} denominator={item.pvAvailable} target={50} /></DetailItem><DetailItem label="绿色建筑占比"><Rate numerator={item.greenBuildings} denominator={item.newBuildings} target={30} /></DetailItem></DetailGrid>
    : category === 'transport' ? <DetailGrid><DetailItem label="新能源交通运输工具比例"><Rate numerator={item.newEnergy} denominator={item.total} target={60} /></DetailItem></DetailGrid>
    : <DetailGrid><DetailItem label="碳足迹认证产品数量">{item.products.length} 个</DetailItem></DetailGrid>
  const formula = category === 'efficiency' ? '产品能效状态根据各产品单位能耗与二级限额值自动判断；能效诊断状态由企业诊断报告记录。' : category === 'resource' ? '工业固废利用率 = 利用量 ÷ 产生量；余热/余压利用率 = 实际利用量 ÷ 可利用量；工业用水利用率暂按维护的指标计算分子 ÷ 分母计算，正式口径待确认后可配置。' : category === 'building' ? '屋顶光伏覆盖率 = 已建设屋顶光伏面积 ÷ 可利用建筑屋顶面积 × 100%；绿色建筑占比 = 星级绿色建筑/超低能耗建筑数量 ÷ 新建建筑数量 × 100%。' : category === 'transport' ? '新能源交通运输工具比例 = 新能源交通运输工具数量 ÷ 纳入统计交通运输工具总数量 × 100%。' : '按企业已取得有效碳足迹认证的产品明细自动汇总。'
  return <Modal open title={`${item.enterprise} · ${categories.find(tab => tab.value === category)?.label}详情`} onClose={onClose} className="detail-modal"><div className="modal-body"><section className="section"><h3>基础信息</h3><DetailGrid><DetailItem label="企业/数据主体">{item.enterprise}</DetailItem><DetailItem label="年度">{item.year}</DetailItem><DetailItem label="专项指标" wide>{categories.find(tab => tab.value === category)?.label}</DetailItem></DetailGrid></section><section className="section"><h3>原始数据</h3>{rawData}</section><section className="section"><h3>计算结果</h3>{result}<div className="info-callout">计算关系：{formula}</div></section><section className="section"><h3>数据来源</h3><p>{item.source}</p></section></div><div className="modal-foot"><button className="btn" onClick={onClose}>关闭</button></div></Modal>
}
