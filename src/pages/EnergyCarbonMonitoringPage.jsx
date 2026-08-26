import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageHeader } from '../components/PageHeader.jsx'
import { Tabs } from '../components/Tabs.jsx'
import { MetricStrip } from '../components/MetricStrip.jsx'
import { DataPanel } from '../components/DataPanel.jsx'
import { StatusTag } from '../components/StatusTag.jsx'
import { Modal } from '../components/Modal.jsx'
import { getEnergyCarbonRecords, useSharedData } from '../mock/sharedStore.js'

const htmlCompanies = [
  { id: 'ent-001', name: '晶澳科技', industry: '光伏制造', energy: 18.6, electricity: 14.2, heat: 2.6, gas: 1.8, emissions: 3.46, scope1: .92, scope2: 2.54, state: '正常' },
  { id: 'ent-002', name: '曲靖隆基', industry: '光伏制造', energy: null, electricity: 13.6, heat: null, gas: 1.1, emissions: null, scope1: .75, scope2: null, state: '数据缺失' },
  { id: 'ent-003', name: '阳光新能源', industry: '光伏制造', energy: 10.8, electricity: 9.7, heat: .6, gas: .5, emissions: 1.90, scope1: .38, scope2: 1.52, state: '正常' },
  { id: 'ent-004', name: '亿纬锂能', industry: '新能源电池', energy: 13.2, electricity: 11.4, heat: 1.1, gas: .7, emissions: 2.62, scope1: .71, scope2: 1.91, state: '正常' },
  { id: 'ent-005', name: '德方纳米', industry: '新能源电池', energy: 9.7, electricity: 8.6, heat: .7, gas: .4, emissions: 1.83, scope1: .48, scope2: 1.35, state: '正常' },
  { id: 'ent-006', name: '驰宏锌锗', industry: '有色金属', energy: null, electricity: null, heat: 1.1, gas: 1.1, emissions: null, scope1: 1.96, scope2: null, state: '数据缺失' }
]
const fmt = (value, digits = 1) => value == null ? '—' : Number(value).toFixed(digits)
const toHtmlRow = row => ({ ...row, id: row.enterpriseId || row.id, electricity: row.electricity ?? row.electric, emissions: row.emissions ?? row.carbon, state: row.state || '正常' })

function TrendChart({ carbon = false }) {
  const points = carbon ? '0,146 100,132 200,117 300,124 400,95 500,83 600,76' : '0,158 100,146 200,130 300,112 400,89 500,72 600,54'
  const previous = carbon ? '0,138 100,127 200,108 300,116 400,91 500,79 600,71' : '0,164 100,151 200,139 300,124 400,102 500,88 600,69'
  return <div className="html-trend-chart"><div className="chart-y-axis">{(carbon ? ['3.0', '2.0', '1.0', '0'] : ['15', '10', '5', '0']).map(item => <span key={item}>{item}</span>)}</div><svg viewBox="0 0 600 210" preserveAspectRatio="none" aria-label={`${carbon ? '碳排放' : '综合能耗'}趋势`}><line x1="0" y1="70" x2="600" y2="70" /><line x1="0" y1="140" x2="600" y2="140" /><polyline points={previous} className="previous-line" /><polyline points={points} className="current-line" /></svg><div className="chart-months">{['1月', '2月', '3月', '4月', '5月', '6月', '7月'].map(item => <span key={item}>{item}</span>)}</div></div>
}
function StructureBars({ carbon = false }) {
  const rows = carbon ? [['范围1·燃料燃烧', 19.8, '19.8%'], ['范围1·工业过程', 11.4, '11.4%'], ['范围2·净购入电力', 64.1, '64.1%'], ['范围2·净购入热力', 4.7, '4.7%']] : [['电力', 97.9, '97.9%'], ['热力', 1.2, '1.2%'], ['天然气', .9, '0.9%']]
  return <div className="html-structure">{rows.map(([label, width, value]) => <div className="html-structure-row" key={label}><span>{label}</span><i><b style={{ width: `${width}%` }} /></i><strong>{value}</strong></div>)}</div>
}

export function EnergyCarbonMonitoringPage({ initialTab = 'energy', embedded = false, enterpriseMode = false }) {
  const [tab, setTab] = useState(initialTab)
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState(null)
  const navigate = useNavigate()
  const { tasks, currentEnterpriseId } = useSharedData()
  const rows = useMemo(() => !enterpriseMode ? htmlCompanies : getEnergyCarbonRecords(tasks).map(toHtmlRow).filter(row => row.id === currentEnterpriseId || row.enterpriseId === currentEnterpriseId), [enterpriseMode, tasks, currentEnterpriseId])
  const filtered = rows.filter(row => row.name.includes(search))
  const detail = selected && <Modal open title={`${selected.name}｜企业能碳详情`} onClose={() => setSelected(null)} className="detail-modal"><div className="modal-body"><div className="detail-summary"><div className="detail-kpi"><label>综合能耗</label><b>{fmt(selected.energy)} 万tce</b></div><div className="detail-kpi"><label>碳排放量</label><b>{fmt(selected.emissions, 2)} 万tCO₂e</b></div><div className="detail-kpi"><label>数据状态</label><StatusTag tone={selected.state === '正常' ? 'ok' : 'warn'}>{selected.state}</StatusTag></div><div className="detail-kpi"><label>数据期间</label><b>2026-07</b></div></div><div className="section"><h3>能源数据</h3><div className="table-wrap"><table><thead><tr><th>数据项</th><th>本期值</th><th>来源方式</th><th>状态</th></tr></thead><tbody>{[['电力', selected.electricity, '亿kWh'], ['热力', selected.heat, '万GJ'], ['天然气', selected.gas, '百万Nm³']].map(([label, value, unit]) => <tr key={label}><td>{label}</td><td>{fmt(value)} {unit}</td><td>计量接口 / 企业填报</td><td><StatusTag tone={value == null ? 'warn' : 'ok'}>{value == null ? '数据缺失' : '正常'}</StatusTag></td></tr>)}</tbody></table></div></div><div className="section"><h3>碳排放结果</h3><div className="table-wrap"><table><thead><tr><th>指标</th><th>结果</th><th>说明</th></tr></thead><tbody><tr><td>范围1</td><td>{fmt(selected.scope1, 2)} 万tCO₂e</td><td>燃料燃烧及工业过程排放</td></tr><tr><td>范围2</td><td>{fmt(selected.scope2, 2)} 万tCO₂e</td><td>净购入电力、热力排放</td></tr></tbody></table></div></div>{!enterpriseMode && <div className="modal-foot"><button className="btn primary" onClick={() => { setSelected(null); navigate(`/enterprise-profile?enterpriseId=${selected.id}`) }}>查看企业画像</button></div>}</div></Modal>
  const metrics = tab === 'energy' ? (enterpriseMode ? [{ label: '本企业综合能耗', value: `${fmt(rows[0]?.energy)} 万tce` }, { label: '电力消费量', value: `${fmt(rows[0]?.electricity)} 亿kWh` }, { label: '外购热力', value: `${fmt(rows[0]?.heat)} 万GJ` }, { label: '天然气消费量', value: `${fmt(rows[0]?.gas)} 百万Nm³` }] : [{ label: '园区综合能耗', value: '89.8 万tce', note: '本期累计' }, { label: '电力消费量', value: '71.5 亿kWh', note: '本期累计' }, { label: '外购热力', value: '18.4 万GJ', note: '本期累计' }, { label: '天然气消费量', value: '2,860 万Nm³', note: '本期累计' }, { label: '清洁能源消费占比', value: '87.4%', note: '查看指标 ›' }]) : (enterpriseMode ? [{ label: '本企业碳排放', value: `${fmt(rows[0]?.emissions, 2)} 万tCO₂e` }, { label: '范围1', value: `${fmt(rows[0]?.scope1, 2)} 万tCO₂e` }, { label: '范围2', value: `${fmt(rows[0]?.scope2, 2)} 万tCO₂e` }, { label: '数据期间', value: '2026年1-7月' }] : [{ label: '园区碳排放量', value: '16.7 万tCO₂e', note: '本期累计' }, { label: '范围1排放', value: '5.2 万tCO₂e', note: '直接排放' }, { label: '范围2排放', value: '11.5 万tCO₂e', note: '购入能源间接排放' }, { label: '单位能耗碳排放', value: '0.186 tCO₂/tce', note: '查看指标 ›' }])
  return <div className={embedded ? 'html-monitor embedded-monitor' : 'content html-monitor'}>{!embedded && <PageHeader title={enterpriseMode ? '我的能碳数据' : '园区能碳监测'} subtitle={enterpriseMode ? '仅展示当前企业的能源消费、碳排放和数据明细。' : '园区用了多少能源、排了多少碳、趋势如何、主要企业是谁。'} />}<div className="filters html-filter"><span className="label">统计期间</span><select defaultValue="2026-01/2026-07"><option value="2026-01/2026-07">2026年1-7月</option></select>{!enterpriseMode && <span className="period-note">企业筛选只影响下方明细表</span>}</div>{!embedded && <Tabs tabs={[{ value: 'energy', label: '能源监测' }, { value: 'carbon', label: '碳排放监测' }]} active={tab} onChange={setTab} />}<MetricStrip metrics={metrics} /><div className="html-analysis-grid"><DataPanel title={tab === 'energy' ? '园区综合能耗趋势' : '园区碳排放趋势'} description={tab === 'energy' ? '实线：2026年累计趋势；虚线：上年同期（演示）' : '用于查看园区碳排放变化，正式结果以统一核算口径为准'}><TrendChart carbon={tab === 'carbon'} /><div className="small-tip">单位：{tab === 'energy' ? '万tce' : '万tCO₂e'}</div></DataPanel><DataPanel title={tab === 'energy' ? '园区用能结构' : '碳排放结构'} description={tab === 'energy' ? '按折标量统计' : '园区汇总'}><StructureBars carbon={tab === 'carbon'} /></DataPanel></div><DataPanel title={enterpriseMode ? '我的数据明细' : tab === 'energy' ? '企业能源消费明细' : '企业碳排放明细'} actions={!enterpriseMode && <input className="search-input" placeholder="搜索企业" value={search} onChange={event => setSearch(event.target.value)} />}><MonitorTable mode={tab} rows={filtered} enterpriseMode={enterpriseMode} onSelect={setSelected} onProfile={id => navigate(`/enterprise-profile?enterpriseId=${id}`)} /></DataPanel>{detail}</div>
}

function MonitorTable({ mode, rows, enterpriseMode, onSelect, onProfile }) {
  return <div className="table-wrap html-monitor-table"><table><thead><tr>{mode === 'energy' ? <><th>企业</th><th>行业</th><th>综合能耗</th><th>电力</th><th>热力</th><th>天然气</th><th>数据状态</th><th>操作</th></> : <><th>企业</th><th>行业</th><th>碳排放量</th><th>范围1</th><th>范围2</th><th>数据状态</th><th>操作</th></>}</tr></thead><tbody>{rows.map(row => <tr key={row.id}><td className="item-name">{row.name}</td><td>{row.industry}</td>{mode === 'energy' ? <><td>{fmt(row.energy)} 万tce</td><td>{fmt(row.electricity)} 亿kWh</td><td>{fmt(row.heat)} 万GJ</td><td>{fmt(row.gas)} 百万Nm³</td></> : <><td>{fmt(row.emissions, 2)} 万tCO₂e</td><td>{fmt(row.scope1, 2)} 万tCO₂e</td><td>{fmt(row.scope2, 2)} 万tCO₂e</td></>}<td><StatusTag tone={row.state === '正常' ? 'ok' : 'warn'}>{row.state}</StatusTag></td><td><button className="op-btn" onClick={() => onSelect(row)}>查看</button>{!enterpriseMode && <button className="op-btn" onClick={() => onProfile(row.id)}>企业画像</button>}</td></tr>)}</tbody></table><div className="data-note">“正常”表示当前展示所需数据已获取；“数据缺失”表示应有数据尚未获取。企业填报缺口由填报任务处理，接口缺失由数据接入侧处理。</div></div>
}
