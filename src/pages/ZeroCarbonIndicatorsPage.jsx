import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageHeader } from '../components/PageHeader.jsx'
import { FilterBar } from '../components/FilterBar.jsx'
import { SummaryCard } from '../components/SummaryCard.jsx'
import { StatusTag } from '../components/StatusTag.jsx'
import { Modal } from '../components/Modal.jsx'
import { indicators as indicatorDefinitions } from '../mock/data/zeroCarbonIndicators.js'
import { acceptanceMaterials, enterpriseIndicatorResult, useSharedData } from '../mock/sharedStore.js'

const parkCategories = ['核心指标', '引导指标', '特色指标', '专项建设要求']
const categoryLabel = category => category === '特色指标' ? '云南特色指标' : category
const statusTone = status => status === '已达标' ? 'ok' : status === '待提升' ? 'warn' : 'gray'
const valueNumber = value => { const parsed = Number.parseFloat(String(value ?? '').replace(/[^\d.-]/g, '')); return Number.isFinite(parsed) ? parsed : null }
const formatNumber = (value, digits = 1) => Number(value).toFixed(digits).replace(/\.0+$/, '')
const indicatorUnit = item => item.unit || item.gapUnit || (String(item.target || '').includes('%') ? '%' : '')
const formatValue = (item, value = item.value) => {
  if (value === '—' || value == null) return '—'
  const unit = indicatorUnit(item)
  if (unit === '%' && String(value).includes('%')) return String(value)
  return `${value}${unit ? ` ${unit}` : ''}`
}
const acceptanceIdByIndicator = { 'ind-unit-energy':'accept-unit-energy', 'ind-clean-energy':'accept-clean', 'ind-product-energy':'accept-product-energy', 'ind-waste':'accept-waste', 'ind-heat':'accept-heat', 'ind-water':'accept-water', 'ind-roof':'accept-roof', 'ind-green-building':'accept-building', 'ind-new-energy-transport':'accept-transport', 'ind-pcf-products':'accept-pcf', 'ind-diagnosis':'accept-diagnosis', 'ind-green-direct':'accept-green' }
const periodFor = (_item, year) => year === '2025' ? '2025年度' : '2026年1—7月'

function differenceText(item, actual) {
  if (actual == null) return '数据不足，暂无法比较'
  const target = valueNumber(item.target)
  if (target == null) return '数据不足，暂无法比较'
  const delta = Math.abs(actual - target)
  if (delta < 1e-9) return '已达到目标'
  const unit = indicatorUnit(item) === '%' ? '个百分点' : indicatorUnit(item) === '个' ? '个' : indicatorUnit(item)
  const lowerLimit = item.target.includes('≥') || item.target.includes('原则上') || item.target.includes('100%')
  const amount = formatNumber(delta, item.indicatorId === 'ind-unit-energy' ? 4 : unit === '个' ? 0 : 1)
  if (lowerLimit) return actual >= target ? `优于目标 ${amount} ${unit}` : `尚差 ${amount} ${unit}`
  return actual <= target ? `优于目标 ${amount} ${unit}` : `超出目标 ${amount} ${unit}`
}

function calculatedStatus(item, actual, dataStatus) {
  if (dataStatus !== '正常' || actual == null) return '待判定'
  const target = valueNumber(item.target)
  if (target == null) return '待判定'
  const lowerLimit = item.target.includes('≥') || item.target.includes('原则上') || item.target.includes('100%')
  return lowerLimit ? actual >= target ? '已达标' : '待提升' : actual <= target ? '已达标' : '待提升'
}

function materialState(indicatorId) {
  const acceptanceId = acceptanceIdByIndicator[indicatorId]
  const materials = acceptanceMaterials.filter(item => item.acceptanceItemIds.includes(acceptanceId))
  return !materials.length || materials.some(item => ['待补充','待确认','部分归集'].includes(item.status)) ? '材料待补充' : '材料齐全'
}

function buildCalculationRows(item, period, runtimeResults) {
  const yearFactor = period === '2025年度' ? 0.96 : 1
  if (item.indicatorId === 'ind-unit-energy') {
    const energy = runtimeResults.enterpriseEnergyResults.reduce((sum, row) => sum + Number(row.totalStandardCoal || 0), 0) * yearFactor
    const carbon = runtimeResults.enterpriseCarbonResults.reduce((sum, row) => sum + Number(row.totalEmission || 0), 0) * yearFactor
    return [{ name:'碳排放总量（分子）', value:carbon ? `${carbon.toFixed(2)} 万tCO₂e` : '—', source:'能碳核算引擎', period, status:carbon ? '已确认' : '待补充' }, { name:'综合能源消费量（分母）', value:energy ? `${energy.toFixed(2)} 万tce` : '—', source:'园区能碳监测', period, status:energy ? '已确认' : '待补充' }]
  }
  if (item.indicatorId === 'ind-clean-energy') {
    const energy = runtimeResults.enterpriseEnergyResults.reduce((sum, row) => sum + Number(row.totalStandardCoal || 0), 0) * yearFactor
    const clean = runtimeResults.enterpriseEnergyResults.reduce((sum, row) => sum + Number(row.cleanEnergyAmount || 0), 0) * yearFactor * (period === '2025年度' ? 0.98 : 1)
    return [{ name:'清洁能源消费量（分子）', value:clean ? `${clean.toFixed(2)} 万tce` : '—', source:'能源数据接口', period, status:clean ? '已确认' : '待补充' }, { name:'能源消费总量（分母）', value:energy ? `${energy.toFixed(2)} 万tce` : '—', source:'园区能碳监测', period, status:energy ? '已确认' : '待补充' }]
  }
  if (item.dataStatus !== '正常') return [{ name:'专项成果记录', value:'—', source:'原产品碳足迹平台', period, status:'待补充' }]
  return (item.sources || []).map(([name, source, mode, status]) => ({ name, value:'已归集', source:`${source} · ${mode}`, period, status:status === '正常' ? '已确认' : status }))
}

export function buildParkIndicators(year, runtimeResults) {
  const energyResults = runtimeResults.enterpriseEnergyResults || []
  const carbonResults = runtimeResults.enterpriseCarbonResults || []
  const officialBenchmark = (runtimeResults.enterpriseEfficiencyBenchmarkResults || []).filter(item => item.dataStatus === 'official')
  const energyTotal = energyResults.reduce((sum, item) => sum + Number(item.totalStandardCoal || 0), 0)
  const carbonTotal = carbonResults.reduce((sum, item) => sum + Number(item.totalEmission || 0), 0)
  const cleanTotal = energyResults.reduce((sum, item) => sum + Number(item.cleanEnergyAmount || 0), 0)
  const unitCarbon = energyTotal > 0 && carbonResults.length ? carbonTotal / energyTotal : null
  const cleanRate = energyTotal ? cleanTotal / energyTotal * 100 * (year === '2025' ? 0.98 : 1) : null
  const benchmarkRate = officialBenchmark.length ? officialBenchmark.filter(item => item.result !== 'not_compliant').length / officialBenchmark.length * 100 * (year === '2025' ? 0.97 : 1) : null
  return indicatorDefinitions.map(item => {
    let actual = valueNumber(item.value)
    let dataStatus = item.data || '正常'
    if (item.indicatorId === 'ind-unit-energy') actual = unitCarbon
    if (item.indicatorId === 'ind-clean-energy') actual = cleanRate
    if (item.indicatorId === 'ind-product-energy') { actual = benchmarkRate; if (actual == null) dataStatus = '待补充' }
    if (item.indicatorId === 'ind-pcf-products') { actual = null; dataStatus = '待补充' }
    if (item.indicatorId === 'ind-new-energy-transport') { actual = null; dataStatus = '待补充' }
    if (!['ind-unit-energy','ind-clean-energy','ind-product-energy','ind-pcf-products'].includes(item.indicatorId) && year === '2025') actual = actual == null ? null : actual * (item.unit === '个' ? 0.9 : 0.96)
    const unit = indicatorUnit(item)
    const formattedValue = actual == null ? '—' : unit === '%' ? `${actual.toFixed(1)}%` : unit === '个' ? `${Math.round(actual)}` : actual.toFixed(item.indicatorId === 'ind-unit-energy' ? 4 : 3)
    const judgmentStatus = calculatedStatus(item, actual, dataStatus)
    const period = periodFor(item, year)
    const result = { ...item, value:formattedValue, period, dataStatus, materialStatus:materialState(item.indicatorId), judgmentStatus, differenceText:differenceText(item, dataStatus === '正常' ? actual : null), calculationRows:buildCalculationRows({ ...item, dataStatus }, period, runtimeResults), acceptanceItemId:acceptanceIdByIndicator[item.indicatorId] }
    result.attentionReason = [judgmentStatus === '待提升' ? result.differenceText : '', judgmentStatus === '待判定' ? '数据不足，暂无法判定' : '', dataStatus !== '正常' ? '数据待补充' : '', result.materialStatus !== '材料齐全' ? '材料待补充' : ''].filter(Boolean).join('；')
    return result
  })
}

export function ZeroCarbonIndicatorsPage() {
  const { role, currentEnterpriseId } = useSharedData()
  if (role === 'committee') return <CommitteeIndicatorsPage />
  const ownIds = enterpriseIndicatorResult.filter(item => item.enterpriseId === currentEnterpriseId).map(item => item.indicatorId)
  const viewIndicators = role === 'enterprise' ? indicatorDefinitions.filter(item => ownIds.includes(item.indicatorId)) : indicatorDefinitions
  const [category, setCategory] = useState('全部'), [status, setStatus] = useState('全部'), [dataStatus, setDataStatus] = useState('全部'), [detail, setDetail] = useState(null)
  const shown = useMemo(() => viewIndicators.filter(item => (category === '全部' || item.cat === category) && (status === '全部' || item.status === status) && (dataStatus === '全部' || item.data === dataStatus)), [viewIndicators, category, status, dataStatus])
  return <div className="content"><PageHeader title="我的指标要求" subtitle="仅展示当前企业需要提供的数据、完成状态和异常提醒。" /><FilterBar><span className="label">统计年度</span><select defaultValue="2026"><option>2026</option><option>2025</option></select><span className="label">达标状态</span><select value={status} onChange={event => setStatus(event.target.value)}><option>全部</option><option>已达标</option><option>待提升</option></select><span className="label">数据状态</span><select value={dataStatus} onChange={event => setDataStatus(event.target.value)}><option>全部</option><option>正常</option><option>待补充</option></select></FilterBar><div className="workspace"><div className="result-hint">当前显示 {shown.length} 项</div><div className="sections">{shown.map(item => <div className="detail-card" key={item.indicatorId}><b>{item.name}</b><div>{item.value} / {item.target}</div><button className="op-btn" onClick={() => setDetail(item)}>查看详情</button></div>)}</div><Modal open={!!detail} title={detail?.name || '指标详情'} onClose={() => setDetail(null)} className="detail-modal"><div className="modal-body">{detail && <><div className="detail-card"><label>指标定义</label><div>{detail.definition}</div></div><div className="detail-card"><label>统计期间</label><div>{detail.period}</div></div></>}</div></Modal></div></div>
}

const judgmentKeys = [{ label:'已达标', className:'ok', color:'#1ca394' }, { label:'待提升', className:'warn', color:'#dda33a' }, { label:'待判定', className:'unknown', color:'#a9bac0' }]
function StatusDonut({ indicators, onStatus }) {
  const total = indicators.length, circumference = 2 * Math.PI * 76
  let offset = 0
  return <div className="overview-donut-wrap"><svg viewBox="0 0 200 200" role="img" aria-label="全部指标达标状态分布"><circle cx="100" cy="100" r="76" fill="none" stroke="#edf2f2" strokeWidth="27"/>{judgmentKeys.map(key => { const count = indicators.filter(item => item.judgmentStatus === key.label).length, length = total ? count / total * circumference : 0, segment = <circle key={key.label} cx="100" cy="100" r="76" fill="none" stroke={key.color} strokeWidth="27" strokeDasharray={`${length} ${circumference - length}`} strokeDashoffset={-offset} transform="rotate(-90 100 100)" className="overview-donut-segment" onClick={() => onStatus(key.label)}><title>{key.label} {count} 项；点击筛选明细</title></circle>; offset += length; return segment })}</svg><div className="overview-donut-center"><b>{total}</b><span>评价项总数</span></div></div>
}
function attentionInfo(item) {
  const reasons = []
  if (item.judgmentStatus === '待提升') reasons.push(`目标差距：${item.differenceText}`)
  if (item.judgmentStatus === '待判定' || item.dataStatus !== '正常') reasons.push(`数据缺口：${item.dataStatus === '正常' ? '缺少可判定数据' : '数据待补充'}`)
  if (item.materialStatus !== '材料齐全') reasons.push('材料缺口：材料待补充')
  return { kind:item.judgmentStatus === '待提升' ? '目标差距' : item.judgmentStatus === '待判定' || item.dataStatus !== '正常' ? '数据缺口' : '材料缺口', text:reasons.join('；'), tone:item.judgmentStatus === '待提升' ? 'warn' : 'gray' }
}

function CommitteeIndicatorsPage() {
  const navigate = useNavigate()
  const { runtimeResults, constructionTasks } = useSharedData()
  const [year, setYear] = useState('2026'), [category, setCategory] = useState('全部'), [achievement, setAchievement] = useState('全部'), [dataStatus, setDataStatus] = useState('全部')
  const [detail, setDetail] = useState(null), [config, setConfig] = useState(null), [basis, setBasis] = useState(false), [alert, setAlert] = useState(null), [notice, setNotice] = useState('')
  let indicators
  try { indicators = buildParkIndicators(year, runtimeResults) } catch (error) { return <div className="content"><PageHeader title="零碳建设总览" subtitle="页面数据计算失败" /><div className="notice warning">{error?.message || '未知计算错误'}</div></div> }
  const shown = indicators.filter(item => (category === '全部' || item.cat === category) && (achievement === '全部' || item.judgmentStatus === achievement) && (dataStatus === '全部' || item.dataStatus === dataStatus))
  const attention = indicators.filter(item => item.judgmentStatus !== '已达标' || item.dataStatus !== '正常' || item.materialStatus !== '材料齐全')
  const energyRows = runtimeResults.enterpriseEnergyResults || [], carbonRows = runtimeResults.enterpriseCarbonResults || []
  const totalEnergy = energyRows.length ? energyRows.reduce((sum, item) => sum + Number(item.totalStandardCoal || 0), 0) * (year === '2025' ? 0.96 : 1) : null
  const totalCarbon = carbonRows.length ? carbonRows.reduce((sum, item) => sum + Number(item.totalEmission || 0), 0) * (year === '2025' ? 0.96 : 1) : null
  const core = indicators.find(item => item.indicatorId === 'ind-unit-energy'), clean = indicators.find(item => item.indicatorId === 'ind-clean-energy')
  const intensity = core?.judgmentStatus === '待判定' ? null : valueNumber(core?.value)
  const cleanRate = clean?.judgmentStatus === '待判定' ? null : valueNumber(clean?.value)
  const intensityTarget = valueNumber(core?.target), scaleMax = Math.max(0.4, Math.ceil(Math.max(intensity || 0, intensityTarget || 0) * 10) / 10)
  const period = year === '2026' ? '2026年1—7月' : '2025年度'
  const cumulativeNote = year === '2026' ? '年度累计 · 阶段判断' : '完整年度'
  const associatedMaterials = item => acceptanceMaterials.filter(material => material.acceptanceItemIds.includes(item.acceptanceItemId))
  const associatedTasks = item => constructionTasks.filter(task => task.indicatorIds?.includes(item.indicatorId))
  const openDetail = item => setDetail({ ...item, materials:associatedMaterials(item), tasks:associatedTasks(item) })
  const filterByStatus = value => { setCategory('全部'); setAchievement(value); setDataStatus('全部') }
  const filterByCategory = value => { setCategory(value); setAchievement('全部'); setDataStatus('全部') }
  return <div className="content zero-carbon-overview-page">
    <PageHeader title="零碳建设总览" subtitle="查看园区指标现状、目标差距与需关注事项。" actions={<button className="btn" onClick={() => setConfig('open')}>指标设置</button>} />
    {notice && <div className="notice success">{notice}</div>}
    <FilterBar action={<div className="overview-filter-actions"><span>示例数据</span><button className="basis-link" onClick={() => setBasis(true)}>查看指标依据 →</button></div>}>
      <span className="label">统计年度</span>
      <select value={year} onChange={event => setYear(event.target.value)}><option value="2026">2026</option><option value="2025">2025</option></select>
      <span className="overview-period">{period} · {cumulativeNote}</span>
    </FilterBar>
    <div className="zero-carbon-summary">
      <button className="overview-core-card" onClick={() => openDetail(core)}><span>核心指标 · 单位能耗碳排放</span><div className="overview-core-value"><b>{intensity == null ? '—' : intensity.toFixed(4)} <em>tCO₂e/tce</em></b><StatusTag tone={statusTone(core.judgmentStatus)}>{core.judgmentStatus}</StatusTag></div><div className="overview-core-gap"><span>目标要求 {core.target} tCO₂e/tce</span><strong>{core.differenceText}</strong></div><div className="overview-scale"><div className="overview-scale-track">{intensity != null && <><i className="overview-scale-fill" style={{width:`${Math.min(100,intensity / scaleMax * 100)}%`}}/><i className="overview-scale-current" style={{left:`${Math.min(100,intensity / scaleMax * 100)}%`}}/></>}<i className="overview-scale-target" style={{left:`${Math.min(100,(intensityTarget || 0) / scaleMax * 100)}%`}}/></div><div className="overview-scale-ticks">{Array.from({length:5},(_,index)=><span key={index}>{(scaleMax * index / 4).toFixed(4)}</span>)}</div></div></button>
      <button onClick={() => navigate('/energy-carbon-monitoring/overview')}><span>综合能耗</span><b>{totalEnergy == null ? '—' : totalEnergy.toFixed(2)} <em>万tce</em></b><small>{period} · {cumulativeNote}</small></button>
      <button onClick={() => navigate('/energy-carbon-monitoring/overview')}><span>碳排放总量</span><b>{totalCarbon == null ? '—' : totalCarbon.toFixed(2)} <em>万tCO₂e</em></b><small>{period} · {cumulativeNote}</small></button>
      <button onClick={() => openDetail(clean)}><span>清洁能源消费占比</span><b className={clean.judgmentStatus === '待提升' ? 'overview-warn-value' : ''}>{cleanRate == null ? '—' : `${cleanRate.toFixed(1)}%`}</b><small>目标 {clean.target} · {clean.differenceText}</small></button>
    </div>
    <div className="overview">
      <SummaryCard className="overview-main">
        <div className="overview-card-head"><h2>指标达标情况</h2><span>全部 {indicators.length} 项，不随明细筛选变化</span></div>
        <div className="overview-chart-body"><div className="overview-donut-column"><StatusDonut indicators={indicators} onStatus={filterByStatus}/><div className="overview-donut-legend">{judgmentKeys.map(key => { const count = indicators.filter(item => item.judgmentStatus === key.label).length; return <button key={key.label} onClick={() => filterByStatus(key.label)} title={`筛选 ${key.label} ${count} 项`}><i className={key.className}/><span>{key.label}</span><b>{count} 项</b></button> })}</div></div><div className="overview-category-column"><h3>各类指标达标分布</h3>{parkCategories.map(group => { const rows = indicators.filter(item => item.cat === group), counts = judgmentKeys.map(key => rows.filter(item => item.judgmentStatus === key.label).length), achieved = counts[0]; return <div className="overview-category-row" key={group}><button className="overview-category-name" onClick={() => filterByCategory(group)}>{categoryLabel(group)}</button><b>{achieved} / {rows.length}</b><div className="overview-stacked-bar">{judgmentKeys.map((key,index) => counts[index] ? <button key={key.label} className={key.className} style={{width:`${counts[index]/rows.length*100}%`}} onClick={() => { setCategory(group); setAchievement(key.label); setDataStatus('全部') }} title={`${categoryLabel(group)} · ${key.label} ${counts[index]} 项；点击筛选明细`}/> : null)}</div><span>{judgmentKeys.filter((_,index) => counts[index]).map((key,index) => `${key.label} ${counts[judgmentKeys.indexOf(key)]} 项`).join(' · ')}</span></div> })}</div></div>
        <div className="overview-chart-note">指标达标统计，不代表项目建设进度；材料状态不改变指标判定。</div>
      </SummaryCard>
      <SummaryCard className="overview-side"><div className="attention-head"><div className="attention-title">当前需要关注</div><div className="attention-count">{attention.length} 项</div></div><div className="attention-list">{attention.length ? attention.map(item => { const info = attentionInfo(item); return <button className="attention-row" key={item.indicatorId} onClick={() => openDetail(item)}><div><div className="attention-name">{item.name}</div><div className="attention-desc" title={info.text}>{info.text}</div></div><StatusTag tone={info.tone}>{info.kind}</StatusTag></button> }) : <div className="empty">当前没有待关注指标</div>}</div></SummaryCard>
    </div>
    <div className="workspace overview-detail-workspace">
      <div className="overview-detail-head"><h2>指标明细</h2><div className="tabsbar"><button className={`tab ${category === '全部' ? 'active' : ''}`} onClick={() => filterByCategory('全部')}>全部</button>{parkCategories.map(item => <button key={item} className={`tab ${category === item ? 'active' : ''}`} onClick={() => filterByCategory(item)}>{categoryLabel(item)}</button>)}</div></div>
      <div className="tools"><div className="filter-row"><div className="filter-item"><span>达标状态</span><select value={achievement} onChange={event => setAchievement(event.target.value)}><option>全部</option><option>已达标</option><option>待提升</option><option>待判定</option></select></div><div className="filter-item"><span>数据状态</span><select value={dataStatus} onChange={event => setDataStatus(event.target.value)}><option>全部</option><option>正常</option><option>待补充</option></select></div></div><div className="result-hint">当前显示 {shown.length} 项 / 共 {indicators.length} 项</div></div>
      <div className="table-wrap"><table className="overview-indicator-table"><thead><tr><th>指标名称</th><th>当前值</th><th>目标要求</th><th>距目标情况</th><th>达标状态</th><th>数据 / 材料</th><th>操作</th></tr></thead><tbody>{shown.map(item => <tr key={item.indicatorId}><td className="item-name">{item.name}</td><td>{formatValue(item)}</td><td>{item.target} {item.indicatorId === 'ind-unit-energy' ? 'tCO₂e/tce' : ''}</td><td className={`gap ${statusTone(item.judgmentStatus)}`}>{item.differenceText}</td><td><StatusTag tone={statusTone(item.judgmentStatus)}>{item.judgmentStatus}</StatusTag></td><td><span className={item.dataStatus === '正常' ? 'data-ok' : 'data-warn'}>{item.dataStatus === '正常' ? '数据正常' : '数据待补充'}</span><span className={item.materialStatus === '材料齐全' ? 'data-ok' : 'data-warn'}> · {item.materialStatus}</span></td><td className="op-actions"><button className="op-btn" onClick={() => openDetail(item)}>查看详情</button><button className="op-btn" onClick={() => setConfig(item)}>指标设置</button></td></tr>)}</tbody></table>{!shown.length && <div className="empty">当前筛选条件下没有需要显示的指标</div>}</div>
      <div className="footnote">“距目标情况”按指标上限或下限计算；缺失数据不按零计算。{year === '2026' ? '2026年为年度累计，达标状态为阶段判断。' : ''}</div>
    </div>
    <IndicatorDetail item={detail} onClose={() => setDetail(null)} onNavigate={navigate} onAlert={() => setAlert(detail)} />
    <ParkConfig open={!!config} item={config === 'open' ? null : config} onClose={() => setConfig(null)} onSaved={() => { setConfig(null); setNotice('指标设置已保存，计算结果仍以正式数据和现有口径为准。') }} />
    <BasisModal open={basis} onClose={() => setBasis(false)} />
    <AlertModal item={alert} onClose={() => setAlert(null)} onConfirm={() => setNotice(`已记录“${alert?.name || '当前指标'}”的预警处置。`)} />
  </div>
}

function IndicatorDetail({ item, onClose, onNavigate, onAlert }) { if (!item) return <Modal open={false} title="指标详情" onClose={onClose} />; return <Modal open title={item.name} onClose={onClose} className="detail-modal"><div className="result-strip"><div className="result-item"><label>当前值</label><b>{formatValue(item)}</b></div><div className="result-item"><label>目标值</label><b>{item.target}</b></div><div className="result-item"><label>距目标情况</label><b>{item.differenceText}</b></div><div className="result-item"><label>达标状态</label><StatusTag tone={statusTone(item.judgmentStatus)}>{item.judgmentStatus}</StatusTag></div></div><div className="result-content"><div className="small-tip">统计期间：{item.period} · {item.period.includes('1—7月') ? '年度累计，达标状态为阶段判断' : '按该指标适用期间展示'}</div><div className="detail-grid"><div className="detail-card"><label>指标分组</label><div>{categoryLabel(item.cat)}</div></div><div className="detail-card"><label>数据与材料状态</label><div>{item.dataStatus === '正常' ? '数据正常' : '数据待补充'} · {item.materialStatus}</div></div><div className="detail-card full"><label>指标口径</label><div>{item.definition}</div><div className="small-tip">判定条件：{item.formula}</div><div className="small-tip">统计边界：园区纳管企业及公共能源设施；依据：{item.basis}</div></div><div className="detail-card full"><label>计算数据</label><div className="source-detail-table"><table><thead><tr><th>数据项</th><th>值</th><th>来源</th><th>期间</th><th>确认状态</th></tr></thead><tbody>{item.calculationRows.map(row => <tr key={`${row.name}-${row.source}`}><td>{row.name}</td><td>{row.value}</td><td>{row.source}</td><td>{row.period}</td><td>{row.status}</td></tr>)}</tbody></table></div></div><div className="detail-card"><label>证明材料</label>{item.materials.length ? item.materials.map(material => <div key={material.materialId} className="small-tip">{material.name} · {material.status}</div>) : <div className="small-tip">暂无关联材料，材料待补充</div>}<button className="op-btn" onClick={() => onNavigate('/zero-carbon-results')}>查看材料支撑 →</button></div><div className="detail-card"><label>关联建设事项</label>{item.tasks.length ? item.tasks.map(task => <div key={task.id} className="small-tip"><b>{task.name}</b><br/>建设主体：{task.owner} · 计划：{task.plan} · 建设状态：{task.status}</div>) : <div className="small-tip">暂无关联建设事项</div>}{item.tasks.length > 0 && <button className="op-btn" onClick={() => onNavigate('/construction-tasks')}>查看事项记录 →</button>}</div>{item.attentionReason && <div className="detail-alert"><div><b>当前关注原因</b><div className="small-tip">{item.attentionReason}</div></div>{item.judgmentStatus === '待提升' && <button className="btn small" onClick={onAlert}>记录处置</button>}</div>}</div></div><div className="modal-foot"><button className="btn" onClick={onClose}>关闭</button><button className="btn" onClick={() => onNavigate('/data-management')}>进入数据维护</button><button className="btn primary" onClick={() => onNavigate('/zero-carbon-results')}>查看成果材料</button></div></Modal> }
function ParkConfig({ open, item, onClose, onSaved }) { return <Modal open={open} title={item ? '指标设置' : '指标体系设置'} onClose={onClose} className="indicator-config-modal">{item ? <div className="modal-body"><div className="kv"><div className="kv-item"><label>指标</label>{item.name}</div><div className="kv-item"><label>目标值</label>{item.target}</div><div className="kv-item"><label>判定规则</label>{item.formula}</div></div><div className="small-tip">目标值与指标口径通过现有指标设置维护；计算结果请进入数据维护修正。</div><div className="modal-foot"><button className="btn" onClick={onClose}>关闭</button><button className="btn primary" onClick={onSaved}>保存设置</button></div></div> : <><div className="config-summary"><b>指标体系共 12 项</b><span>1 项核心指标 · 5 项引导指标 · 5 项云南特色指标 · 1 项专项建设要求</span></div><div className="modal-foot"><button className="btn" onClick={onClose}>取消</button><button className="btn primary" onClick={onSaved}>保存配置</button></div></>}</Modal> }
function BasisModal({ open, onClose }) { return <Modal open={open} title="指标依据" onClose={onClose} className="small"><div className="modal-body"><div className="basis-item"><b>国家指标：1项核心指标 + 5项引导指标</b><p>依据零碳园区建设指标体系设置。</p></div><div className="basis-item"><b>云南特色指标：5项</b><p>依据云南省零碳园区建设方案设置。</p></div><div className="basis-item"><b>绿色电力直接供应：专项要求 1项</b><p>单独跟踪绿色电力直接供应比例。</p></div></div><div className="modal-foot"><button className="btn" onClick={onClose}>知道了</button></div></Modal> }
function AlertModal({ item, onClose, onConfirm }) { return <Modal open={!!item} title="预警处置" onClose={onClose} className="small">{item && <><div className="modal-body"><div className="alertbox"><b>{item.name}</b><div className="small-tip">当前值：{formatValue(item)}；目标值：{item.target}；距目标：{item.differenceText}</div></div><textarea placeholder="填写处置说明" /></div><div className="modal-foot"><button className="btn" onClick={onClose}>取消</button><button className="btn primary" onClick={() => { onConfirm(); onClose() }}>确认</button></div></>}</Modal> }
