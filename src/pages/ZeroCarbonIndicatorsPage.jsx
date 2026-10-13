import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageHeader } from '../components/PageHeader.jsx'
import { FilterBar } from '../components/FilterBar.jsx'
import { SummaryCard } from '../components/SummaryCard.jsx'
import { StatusTag } from '../components/StatusTag.jsx'
import { SectionCard } from '../components/SectionCard.jsx'
import { Modal } from '../components/Modal.jsx'
import { indicatorGroups, indicators as indicatorDefinitions } from '../mock/data/zeroCarbonIndicators.js'
import { acceptanceMaterials, enterpriseIndicatorResult, useSharedData } from '../mock/sharedStore.js'

const parkCategories = ['核心指标', '引导指标', '特色指标', '专项建设要求']
const categoryLabel = category => category === '特色指标' ? '云南特色指标' : category
const statusTone = status => status === '已达标' ? 'ok' : status === '待提升' ? 'warn' : 'gray'
const valueNumber = value => { const parsed = Number.parseFloat(String(value ?? '').replace(/[^\d.-]/g, '')); return Number.isFinite(parsed) ? parsed : null }
const formatNumber = value => Number.isInteger(value) ? String(value) : Number(value).toFixed(1).replace(/\.0$/, '')
const indicatorUnit = item => item.unit || item.gapUnit || (String(item.target || '').includes('%') ? '%' : '')
const formatValue = (item, value = item.value) => {
  if (value === '—' || value == null) return '—'
  const unit = indicatorUnit(item)
  if (unit === '%' && String(value).includes('%')) return String(value)
  return `${value}${unit ? ` ${unit}` : ''}`
}
const acceptanceIdByIndicator = { 'ind-unit-energy':'accept-unit-energy', 'ind-clean-energy':'accept-clean', 'ind-product-energy':'accept-product-energy', 'ind-waste':'accept-waste', 'ind-heat':'accept-heat', 'ind-water':'accept-water', 'ind-roof':'accept-roof', 'ind-green-building':'accept-building', 'ind-new-energy-transport':'accept-transport', 'ind-pcf-products':'accept-pcf', 'ind-diagnosis':'accept-diagnosis', 'ind-green-direct':'accept-green' }
const periodFor = (item, year) => { if (year === '2025') return '2025年度'; if (['ind-unit-energy','ind-clean-energy','ind-waste','ind-water'].includes(item.indicatorId)) return '2026年1—7月'; if (item.indicatorId === 'ind-product-energy') return '2026年度（截至7月）'; return '2026年度' }

function differenceText(item, actual) {
  if (actual == null) return '数据不足，暂无法比较'
  const target = valueNumber(item.target)
  if (target == null) return '数据不足，暂无法比较'
  const delta = Math.abs(actual - target)
  if (delta < 0.05) return '已达到目标'
  const unit = indicatorUnit(item) === '%' ? '个百分点' : indicatorUnit(item) === '个' ? '个' : indicatorUnit(item)
  const lowerLimit = item.target.includes('≥') || item.target.includes('原则上')
  if (lowerLimit) return actual >= target ? `优于目标${formatNumber(delta)}${unit}` : `尚差${formatNumber(delta)}${unit}`
  return actual <= target ? `优于目标${formatNumber(delta)}${unit}` : `超出目标${formatNumber(delta)}${unit}`
}

function calculatedStatus(item, actual, dataStatus) {
  if (dataStatus !== '正常' || actual == null) return '待判定'
  const target = valueNumber(item.target)
  if (target == null) return '待判定'
  const lowerLimit = item.target.includes('≥') || item.target.includes('原则上')
  return lowerLimit ? actual >= target ? '已达标' : '待提升' : actual <= target ? '已达标' : '待提升'
}

function materialState(indicatorId) {
  const acceptanceId = acceptanceIdByIndicator[indicatorId]
  const materials = acceptanceMaterials.filter(item => item.acceptanceItemIds.includes(acceptanceId))
  return !materials.length || materials.some(item => ['待补充','待确认','部分归集'].includes(item.status)) ? '材料待补充' : '材料齐全'
}

function buildCalculationRows(item, period, runtimeResults) {
  if (item.indicatorId === 'ind-unit-energy') {
    const energy = runtimeResults.enterpriseEnergyResults.reduce((sum, row) => sum + Number(row.totalStandardCoal || 0), 0)
    const carbon = runtimeResults.enterpriseCarbonResults.reduce((sum, row) => sum + Number(row.totalEmission || 0), 0)
    return [{ name:'碳排放总量（分子）', value:carbon ? `${carbon.toFixed(2)} 万tCO₂e` : '—', source:'能碳核算引擎', period, status:carbon ? '已确认' : '待补充' }, { name:'综合能源消费量（分母）', value:energy ? `${energy.toFixed(2)} 万tce` : '—', source:'园区能碳监测', period, status:energy ? '已确认' : '待补充' }]
  }
  if (item.indicatorId === 'ind-clean-energy') {
    const energy = runtimeResults.enterpriseEnergyResults.reduce((sum, row) => sum + Number(row.totalStandardCoal || 0), 0)
    const clean = runtimeResults.enterpriseEnergyResults.reduce((sum, row) => sum + Number(row.cleanEnergyAmount || 0), 0)
    return [{ name:'清洁能源消费量（分子）', value:clean ? `${clean.toFixed(2)} 万tce` : '—', source:'能源数据接口', period, status:clean ? '已确认' : '待补充' }, { name:'能源消费总量（分母）', value:energy ? `${energy.toFixed(2)} 万tce` : '—', source:'园区能碳监测', period, status:energy ? '已确认' : '待补充' }]
  }
  if (item.dataStatus !== '正常') return [{ name:'专项成果记录', value:'—', source:'原产品碳足迹平台', period, status:'待补充' }]
  return (item.sources || []).map(([name, source, mode, status]) => ({ name, value:'已归集', source:`${source} · ${mode}`, period, status:status === '正常' ? '已确认' : status }))
}

function buildParkIndicators(year, runtimeResults) {
  const energyResults = runtimeResults.enterpriseEnergyResults || []
  const carbonResults = runtimeResults.enterpriseCarbonResults || []
  const officialBenchmark = (runtimeResults.enterpriseEfficiencyBenchmarkResults || []).filter(item => item.dataStatus === 'official')
  const energyTotal = energyResults.reduce((sum, item) => sum + Number(item.totalStandardCoal || 0), 0)
  const carbonTotal = carbonResults.reduce((sum, item) => sum + Number(item.totalEmission || 0), 0)
  const cleanTotal = energyResults.reduce((sum, item) => sum + Number(item.cleanEnergyAmount || 0), 0)
  const unitCarbon = energyTotal && carbonTotal ? carbonTotal / energyTotal * (year === '2025' ? 0.96 : 1) : null
  const cleanRate = energyTotal ? cleanTotal / energyTotal * 100 * (year === '2025' ? 0.98 : 1) : null
  const benchmarkRate = officialBenchmark.length ? officialBenchmark.filter(item => item.result !== 'not_compliant').length / officialBenchmark.length * 100 * (year === '2025' ? 0.97 : 1) : null
  return indicatorDefinitions.map(item => {
    let actual = valueNumber(item.value)
    let dataStatus = item.data || '正常'
    if (item.indicatorId === 'ind-unit-energy') actual = unitCarbon
    if (item.indicatorId === 'ind-clean-energy') actual = cleanRate
    if (item.indicatorId === 'ind-product-energy') actual = benchmarkRate
    if (item.indicatorId === 'ind-pcf-products') { actual = null; dataStatus = '待补充' }
    if (item.indicatorId === 'ind-new-energy-transport') dataStatus = '待补充'
    if (!['ind-unit-energy','ind-clean-energy','ind-product-energy','ind-pcf-products'].includes(item.indicatorId) && year === '2025') actual = actual == null ? null : actual * (item.unit === '个' ? 0.9 : 0.96)
    const unit = indicatorUnit(item)
    const formattedValue = actual == null ? '—' : unit === '%' ? `${actual.toFixed(1)}%` : unit === '个' ? `${Math.round(actual)}` : actual.toFixed(3)
    const judgmentStatus = calculatedStatus(item, actual, dataStatus)
    const period = periodFor(item, year)
    const result = { ...item, value:formattedValue, period, dataStatus, materialStatus:materialState(item.indicatorId), judgmentStatus, differenceText:differenceText(item, actual), calculationRows:buildCalculationRows({ ...item, dataStatus }, period, runtimeResults), acceptanceItemId:acceptanceIdByIndicator[item.indicatorId] }
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

function CommitteeIndicatorsPage() {
  const navigate = useNavigate()
  const { runtimeResults, constructionTasks } = useSharedData()
  const [year, setYear] = useState('2026'), [category, setCategory] = useState('全部'), [achievement, setAchievement] = useState('全部'), [dataStatus, setDataStatus] = useState('全部')
  const [detail, setDetail] = useState(null), [config, setConfig] = useState(null), [basis, setBasis] = useState(false), [alert, setAlert] = useState(null), [notice, setNotice] = useState('')
  let indicators
  try { indicators = buildParkIndicators(year, runtimeResults) } catch (error) { return <div className="content"><PageHeader title="零碳建设总览" subtitle="页面数据计算失败" /><div className="notice warning">{error?.message || '未知计算错误'}</div></div> }
  const shown = indicators.filter(item => (category === '全部' || item.cat === category) && (achievement === '全部' || item.judgmentStatus === achievement) && (dataStatus === '全部' || item.dataStatus === dataStatus))
  const statusSummary = { achieved:indicators.filter(item => item.judgmentStatus === '已达标').length, pending:indicators.filter(item => item.judgmentStatus === '待提升').length, undetermined:indicators.filter(item => item.judgmentStatus === '待判定').length }
  const attention = indicators.filter(item => item.judgmentStatus !== '已达标' || item.dataStatus !== '正常' || item.materialStatus !== '材料齐全')
  const totalEnergy = (runtimeResults.enterpriseEnergyResults || []).reduce((sum, item) => sum + Number(item.totalStandardCoal || 0), 0) * (year === '2025' ? 0.96 : 1)
  const totalCarbon = (runtimeResults.enterpriseCarbonResults || []).reduce((sum, item) => sum + Number(item.totalEmission || 0), 0) * (year === '2025' ? 0.96 : 1)
  const intensity = totalEnergy ? totalCarbon / totalEnergy : null
  const cleanRate = valueNumber(indicators.find(item => item.indicatorId === 'ind-clean-energy')?.value)
  const period = year === '2026' ? '2026年1—7月' : '2025年度'
  const cumulativeNote = year === '2026' ? '年度累计，达标状态为阶段判断' : '年度数据'
  const associatedMaterials = item => acceptanceMaterials.filter(material => material.acceptanceItemIds.includes(item.acceptanceItemId))
  const associatedTasks = item => constructionTasks.filter(task => task.indicatorIds?.includes(item.indicatorId))
  const openDetail = item => setDetail({ ...item, materials:associatedMaterials(item), tasks:associatedTasks(item) })
  const summaryPercent = key => `${statusSummary[key] / Math.max(indicators.length, 1) * 100}%`
  return <div className="content">
    <PageHeader title="零碳建设总览" subtitle="园区零碳建设指标、阶段结果、材料完整性与关联建设事项统一查看。" actions={<button className="btn" onClick={() => setConfig('open')}>指标设置</button>} />
    {notice && <div className="notice success">{notice}</div>}
    <FilterBar action={<button className="basis-link" onClick={() => setBasis(true)}>查看指标依据 ›</button>}>
      <span className="label">统计年度</span>
      <select value={year} onChange={event => setYear(event.target.value)}><option value="2026">2026</option><option value="2025">2025</option></select>
      <span className="small-tip">当前展示：{period} · {cumulativeNote}</span>
    </FilterBar>
    <div className="zero-carbon-summary">
      <button onClick={() => navigate('/energy-carbon-monitoring/overview')}><span>综合能耗</span><b>{totalEnergy.toFixed(2)} 万tce</b><small>{period} · 进入能碳分析 →</small></button>
      <button onClick={() => navigate('/energy-carbon-monitoring/overview')}><span>单位能耗碳排放</span><b>{intensity == null ? '—' : intensity.toFixed(4)} tCO₂e/tce</b><small>碳排放总量 ÷ 综合能耗 · {period}</small></button>
      <button onClick={() => navigate('/energy-carbon-monitoring/overview')}><span>清洁能源消费占比</span><b>{cleanRate == null ? '—' : `${cleanRate.toFixed(1)}%`}</b><small>{period} · 进入能碳分析 →</small></button>
      <button onClick={() => navigate('/energy-carbon-monitoring/overview')}><span>碳排放总量</span><b>{totalCarbon.toFixed(2)} 万tCO₂e</b><small>{period} · 进入能碳分析 →</small></button>
    </div>
    <div className="overview">
      <SummaryCard className="overview-main">
        <div className="overview-top"><div><div className="overview-title">零碳评价指标</div><div className="overview-number">{indicators.length}<small>项</small></div></div><div className="overview-status"><Stat label="已达标" value={statusSummary.achieved} className="ok"/><Stat label="待提升" value={statusSummary.pending} className="warn"/><Stat label="待判定" value={statusSummary.undetermined} className="gray"/></div></div>
        <div className="distribution"><span className="ok" style={{ width:summaryPercent('achieved') }}/><span className="warn" style={{ width:summaryPercent('pending') }}/><span className="unknown" style={{ width:summaryPercent('undetermined') }}/></div>
        <div className="distribution-legend"><span><i className="ok"/>已达标 {statusSummary.achieved}项</span><span><i className="warn"/>待提升 {statusSummary.pending}项</span><span><i className="unknown"/>待判定 {statusSummary.undetermined}项</span></div>
        <div className="levels">{parkCategories.map(group => { const rows = indicators.filter(item => item.cat === group); const achieved = rows.filter(item => item.judgmentStatus === '已达标').length; const pending = rows.filter(item => item.judgmentStatus === '待提升').length; const undetermined = rows.filter(item => item.judgmentStatus === '待判定').length; return <div className="level" key={group}><div className="level-head"><b>{categoryLabel(group)}</b><strong>{achieved} / {rows.length}</strong></div><div className="level-track"><i className="ok" style={{ width:`${achieved / rows.length * 100}%` }}/><i className="warn" style={{ width:`${pending / rows.length * 100}%` }}/><i className="unknown" style={{ width:`${undetermined / rows.length * 100}%` }}/></div><span>指标达标情况 · 已达标数／总数 {achieved}／{rows.length}{pending ? ` · ${pending}项待提升` : ''}{undetermined ? ` · ${undetermined}项待判定` : ''}</span></div> })}</div>
      </SummaryCard>
      <SummaryCard className="overview-side"><div className="attention-head"><div className="attention-title">当前需要关注</div><div className="attention-count">{attention.length}项</div></div><div className="attention-list">{attention.length ? attention.map(item => <button className="attention-row" key={item.indicatorId} onClick={() => openDetail(item)}><div><div className="attention-name">{item.name}</div><div className="attention-desc">{item.attentionReason}</div></div><StatusTag tone={statusTone(item.judgmentStatus)}>{item.judgmentStatus}</StatusTag></button>) : <div className="empty">当前没有待关注指标</div>}</div></SummaryCard>
    </div>
    <div className="workspace">
      <div className="tabsbar"><button className={`tab ${category === '全部' ? 'active' : ''}`} onClick={() => setCategory('全部')}>全部</button>{parkCategories.map(item => <button key={item} className={`tab ${category === item ? 'active' : ''}`} onClick={() => setCategory(item)}>{categoryLabel(item)}</button>)}</div>
      <div className="tools"><div className="filter-row"><div className="filter-item"><span>达标状态</span><select value={achievement} onChange={event => setAchievement(event.target.value)}><option>全部</option><option>已达标</option><option>待提升</option><option>待判定</option></select></div><div className="filter-item"><span>数据状态</span><select value={dataStatus} onChange={event => setDataStatus(event.target.value)}><option>全部</option><option>正常</option><option>待补充</option></select></div></div><div className="result-hint">当前显示 {shown.length} 项 · 数据与材料状态独立展示</div></div>
      <div className="sections">{parkCategories.map(group => { const rows = shown.filter(item => item.cat === group); if (!rows.length) return null; return <SectionCard key={group} title={indicatorGroups[group].title} count={rows.length} desc={indicatorGroups[group].desc}><div className="table-wrap"><table><thead><tr><th>指标名称</th><th>当前值</th><th>目标值</th><th>距目标情况</th><th>达标状态</th><th>数据 / 材料</th><th>统计期间</th><th>操作</th></tr></thead><tbody>{rows.map(item => <tr key={item.indicatorId}><td className="item-name">{item.name}</td><td>{formatValue(item)}</td><td>{item.target}</td><td className={`gap ${statusTone(item.judgmentStatus)}`}>{item.differenceText}</td><td><StatusTag tone={statusTone(item.judgmentStatus)}>{item.judgmentStatus}</StatusTag></td><td><div className={item.dataStatus === '正常' ? 'data-ok' : 'data-warn'}>{item.dataStatus === '正常' ? '数据正常' : '数据待补充'}</div><div className={item.materialStatus === '材料齐全' ? 'small-tip' : 'data-warn'}>{item.materialStatus}</div></td><td>{item.period}</td><td className="op-actions"><button className="op-btn" onClick={() => openDetail(item)}>查看详情</button><button className="op-btn" onClick={() => setConfig(item)}>指标设置</button></td></tr>)}</tbody></table></div></SectionCard> })}{!shown.length && <div className="empty">当前筛选条件下没有需要显示的指标</div>}</div>
      <div className="footnote">“距目标情况”按指标上限或下限计算；缺失数据不按零计算。{year === '2026' ? '2026年为年度累计，达标状态为阶段判断。' : ''}</div>
    </div>
    <IndicatorDetail item={detail} onClose={() => setDetail(null)} onNavigate={navigate} onAlert={() => setAlert(detail)} />
    <ParkConfig open={!!config} item={config === 'open' ? null : config} onClose={() => setConfig(null)} onSaved={() => { setConfig(null); setNotice('指标设置已保存，计算结果仍以正式数据和现有口径为准。') }} />
    <BasisModal open={basis} onClose={() => setBasis(false)} />
    <AlertModal item={alert} onClose={() => setAlert(null)} onConfirm={() => setNotice(`已记录“${alert?.name || '当前指标'}”的预警处置。`)} />
  </div>
}

function Stat({ label, value, className }) { return <div className={`status-stat ${className}`}><div className="n">{value}</div><div className="t">{label}</div></div> }
function IndicatorDetail({ item, onClose, onNavigate, onAlert }) { if (!item) return <Modal open={false} title="指标详情" onClose={onClose} />; return <Modal open title={item.name} onClose={onClose} className="detail-modal"><div className="result-strip"><div className="result-item"><label>当前值</label><b>{formatValue(item)}</b></div><div className="result-item"><label>目标值</label><b>{item.target}</b></div><div className="result-item"><label>距目标情况</label><b>{item.differenceText}</b></div><div className="result-item"><label>达标状态</label><StatusTag tone={statusTone(item.judgmentStatus)}>{item.judgmentStatus}</StatusTag></div></div><div className="result-content"><div className="small-tip">统计期间：{item.period} · {item.period.includes('1—7月') ? '年度累计，达标状态为阶段判断' : '按该指标适用期间展示'}</div><div className="detail-grid"><div className="detail-card"><label>指标分组</label><div>{categoryLabel(item.cat)}</div></div><div className="detail-card"><label>数据与材料状态</label><div>{item.dataStatus === '正常' ? '数据正常' : '数据待补充'} · {item.materialStatus}</div></div><div className="detail-card full"><label>指标口径</label><div>{item.definition}</div><div className="small-tip">判定条件：{item.formula}</div><div className="small-tip">统计边界：园区纳管企业及公共能源设施；依据：{item.basis}</div></div><div className="detail-card full"><label>计算数据</label><div className="source-detail-table"><table><thead><tr><th>数据项</th><th>值</th><th>来源</th><th>期间</th><th>确认状态</th></tr></thead><tbody>{item.calculationRows.map(row => <tr key={`${row.name}-${row.source}`}><td>{row.name}</td><td>{row.value}</td><td>{row.source}</td><td>{row.period}</td><td>{row.status}</td></tr>)}</tbody></table></div></div><div className="detail-card"><label>证明材料</label>{item.materials.length ? item.materials.map(material => <div key={material.materialId} className="small-tip">{material.name} · {material.status}</div>) : <div className="small-tip">暂无关联材料，材料待补充</div>}<button className="op-btn" onClick={() => onNavigate('/zero-carbon-results')}>查看材料支撑 →</button></div><div className="detail-card"><label>关联建设事项</label>{item.tasks.length ? item.tasks.map(task => <div key={task.id} className="small-tip"><b>{task.name}</b><br/>建设主体：{task.owner} · 计划：{task.plan} · 建设状态：{task.status}</div>) : <div className="small-tip">暂无关联建设事项</div>}{item.tasks.length > 0 && <button className="op-btn" onClick={() => onNavigate('/construction-tasks')}>查看事项记录 →</button>}</div>{item.attentionReason && <div className="detail-alert"><div><b>当前关注原因</b><div className="small-tip">{item.attentionReason}</div></div>{item.judgmentStatus === '待提升' && <button className="btn small" onClick={onAlert}>记录处置</button>}</div>}</div></div><div className="modal-foot"><button className="btn" onClick={onClose}>关闭</button><button className="btn" onClick={() => onNavigate('/data-management')}>进入数据维护</button><button className="btn primary" onClick={() => onNavigate('/zero-carbon-results')}>查看成果材料</button></div></Modal> }
function ParkConfig({ open, item, onClose, onSaved }) { return <Modal open={open} title={item ? '指标设置' : '指标体系设置'} onClose={onClose} className="indicator-config-modal">{item ? <div className="modal-body"><div className="kv"><div className="kv-item"><label>指标</label>{item.name}</div><div className="kv-item"><label>目标值</label>{item.target}</div><div className="kv-item"><label>判定规则</label>{item.formula}</div></div><div className="small-tip">目标值与指标口径通过现有指标设置维护；计算结果请进入数据维护修正。</div><div className="modal-foot"><button className="btn" onClick={onClose}>关闭</button><button className="btn primary" onClick={onSaved}>保存设置</button></div></div> : <><div className="config-summary"><b>指标体系共 12 项</b><span>1 项核心指标 · 5 项引导指标 · 5 项云南特色指标 · 1 项专项建设要求</span></div><div className="modal-foot"><button className="btn" onClick={onClose}>取消</button><button className="btn primary" onClick={onSaved}>保存配置</button></div></>}</Modal> }
function BasisModal({ open, onClose }) { return <Modal open={open} title="指标依据" onClose={onClose} className="small"><div className="modal-body"><div className="basis-item"><b>国家指标：1项核心指标 + 5项引导指标</b><p>依据零碳园区建设指标体系设置。</p></div><div className="basis-item"><b>云南特色指标：5项</b><p>依据云南省零碳园区建设方案设置。</p></div><div className="basis-item"><b>绿色电力直接供应：专项要求 1项</b><p>单独跟踪绿色电力直接供应比例。</p></div></div><div className="modal-foot"><button className="btn" onClick={onClose}>知道了</button></div></Modal> }
function AlertModal({ item, onClose, onConfirm }) { return <Modal open={!!item} title="预警处置" onClose={onClose} className="small">{item && <><div className="modal-body"><div className="alertbox"><b>{item.name}</b><div className="small-tip">当前值：{formatValue(item)}；目标值：{item.target}；距目标：{item.differenceText}</div></div><textarea placeholder="填写处置说明" /></div><div className="modal-foot"><button className="btn" onClick={onClose}>取消</button><button className="btn primary" onClick={() => { onConfirm(); onClose() }}>确认</button></div></>}</Modal> }
