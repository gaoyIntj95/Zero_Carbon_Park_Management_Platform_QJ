import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { ReportingTaskMonitoringPage } from '../ReportingTaskMonitoringPage.jsx'
import { useSharedData } from '../../mock/sharedStore.js'
import { Tabs } from '../../components/Tabs.jsx'
import { Modal } from '../../components/Modal.jsx'
import { Table } from './shared.jsx'
import '../../data-overview.css'

const sources = [
  { name: '自动采集', expected: 80, acquired: 78 },
  { name: '系统接口', expected: 60, acquired: 56 },
  { name: '园区维护', expected: 40, acquired: 32 },
  { name: '企业填报', expected: 60, acquired: 46 },
]
const categories = ['能源数据', '运营数据', '专项数据']
const issueTypes = ['缺失', '更新滞后', '异常', '重复', '待确认']
const taskStates = ['已完成', '处理中', '待反馈']
const taskColors = ['#079f95', '#36cdb3', '#ffad37']
const issueSamples = [
  ['缺失', '天然气消费量', '缺少本期数据', '企业填报员', 'ENERGY_NATURAL_GAS'],
  ['更新滞后', '电力消费量', '超过约定更新时间', '企业填报员', 'ENERGY_ELECTRICITY'],
  ['异常', '产品产量', '较上期变化较大，待核实', '企业填报员', 'OP_PRODUCT_OUTPUT'],
  ['重复', '外购热力', '接口与填报记录重复', '园区数据管理员', 'ENERGY_HEAT'],
  ['待确认', '热力产出量', '已提交，待确认', '园区数据管理员', 'ENERGY_HEAT'],
  ['缺失', '绿色建筑面积', '缺少本期数据', '企业填报员', 'SPECIAL_GREEN_BUILDING_AREA'],
]
const categoryFor = code => code.startsWith('OP_') ? '运营数据' : code.startsWith('SPECIAL_') ? '专项数据' : '能源数据'
const monthText = period => `${period.slice(0, 4)}年${Number(period.slice(5))}月`

function makeMockData(period, enterprises) {
  const month = Number(period.slice(5))
  const gap = month === 9 ? 0 : month === 8 ? 2 : 5
  const obligations = sources.flatMap((source, sourceIndex) => Array.from({ length: source.expected }, (_, index) => {
    const missing = source.expected - Math.max(0, source.acquired - gap)
    const enterpriseIndex = index < missing ? 22 + index % 2 : (index - missing) % 22
    const acquired = index >= missing
    return { id: `${period}-${sourceIndex}-${index}`, source: source.name, enterpriseIndex, category: categories[(index + sourceIndex) % 3], acquired }
  }))
  const count = month === 9 ? 28 : month === 8 ? 24 : 19
  const issues = Array.from({ length: count }, (_, index) => {
    const type = index === 4 || index >= count - 7 ? '待确认' : index === 5 ? '缺失' : issueTypes[index % 4]
    const sample = index === 5 ? issueSamples[5] : issueSamples.find(item => item[0] === type)
    const enterpriseIndex = index % Math.min(enterprises.length, 6)
    const code = sample[4]
    return { id: `${period}-issue-${index}`, type, enterpriseIndex, category: categoryFor(code), item: sample[1], code, description: sample[2], owner: sample[3], taskIndex: index === 1 ? 1 : null }
  })
  const done = month === 9 ? 12 : month === 8 ? 9 : 7
  const processing = month === 9 ? 4 : month === 8 ? 4 : 3
  const tasks = Array.from({ length: month === 9 ? 18 : month === 8 ? 15 : 12 }, (_, index) => ({
    id: `${period}-task-${index}`, enterpriseIndex: index % Math.min(enterprises.length, 6), category: categories[index % 3],
    state: index < done ? '已完成' : index < done + processing ? '处理中' : '待反馈',
    overdue: index === done || index === done + processing,
  }))
  return { obligations, issues, tasks }
}

function SourceChart({ rows }) {
  const max = Math.max(1, ...rows.map(row => row.expected))
  return <div className="pdo-source-chart" role="img" aria-label={rows.map(row => `${row.name}应提供${row.expected}项，已取得${row.acquired}项`).join('；')}>
    <div className="pdo-axis"><span>0</span><span>{Math.round(max / 4)}</span><span>{Math.round(max / 2)}</span><span>{Math.round(max * 3 / 4)}</span><span>{max}</span></div>
    {rows.map(row => <div className="pdo-source-row" key={row.name}><span className="pdo-source-name">{row.name}</span><div className="pdo-bars"><div className="pdo-bar-line"><div className="pdo-bar expected" style={{ width: `${row.expected / max * 100}%` }}/><span>{row.expected}</span></div><div className="pdo-bar-line"><div className="pdo-bar acquired" style={{ width: `${row.acquired / max * 100}%` }}/><span>{row.acquired}</span></div></div></div>)}
    <div className="pdo-xlabel">数据项数</div>
  </div>
}

function TaskChart({ tasks, onView }) {
  const counts = taskStates.map(state => tasks.filter(task => task.state === state).length)
  const total = tasks.length
  const first = total ? counts[0] / total * 100 : 0
  const second = total ? (counts[0] + counts[1]) / total * 100 : 0
  const overdue = tasks.filter(task => task.overdue && task.state !== '已完成').length
  return <><div className="pdo-task-chart"><div className="pdo-donut" style={{ background: total ? `conic-gradient(${taskColors[0]} 0 ${first}%, ${taskColors[1]} ${first}% ${second}%, ${taskColors[2]} ${second}% 100%)` : '#e8f1f0' }} role="img" aria-label={taskStates.map((state, index) => `${state}${counts[index]}项`).join('，')}><div className="pdo-donut-center"><b>{total}<small>项</small></b><span>本期任务</span></div></div><div className="pdo-task-legend">{taskStates.map((state, index) => <div key={state}><i style={{ background: taskColors[index] }}/><span>{state}</span><b>{counts[index]}<small>项</small></b></div>)}</div></div><div className="pdo-overdue"><span>● &nbsp;逾期任务 <b>{overdue} 项</b></span><button onClick={onView}>查看任务 →</button></div></>
}

export function DataOverviewPage({ enterpriseRows, navigate }) {
  const { tasks: linkedTasks } = useSharedData()
  const [searchParams] = useSearchParams()
  const overviewTab = searchParams.get('tab') === 'reporting' ? 'reporting' : 'overview'
  const [draft, setDraft] = useState({ period: '2026-09', enterprise: '', category: '' })
  const [filters, setFilters] = useState(draft)
  const [issueType, setIssueType] = useState('')
  const [showAll, setShowAll] = useState(false)
  const [selectedRecord, setSelectedRecord] = useState(null)
  const enterprises = useMemo(() => Array.from({ length: 24 }, (_, index) => enterpriseRows[index] || { enterpriseId: `example-${index + 1}`, name: `示例企业${index + 1}` }), [enterpriseRows])
  const data = useMemo(() => makeMockData(filters.period, enterprises), [filters.period, enterprises])
  const enterpriseIndex = filters.enterprise === '' ? null : Number(filters.enterprise)
  const match = item => (enterpriseIndex === null || item.enterpriseIndex === enterpriseIndex) && (!filters.category || item.category === filters.category)
  const obligations = data.obligations.filter(match)
  const issues = data.issues.filter(match)
  const tasks = data.tasks.filter(match)
  const sourceRows = sources.map(source => ({ name: source.name, expected: obligations.filter(item => item.source === source.name).length, acquired: obligations.filter(item => item.source === source.name && item.acquired).length }))
  const expected = sourceRows.reduce((sum, row) => sum + row.expected, 0)
  const acquired = sourceRows.reduce((sum, row) => sum + row.acquired, 0)
  const covered = new Set(obligations.filter(item => item.acquired).map(item => item.enterpriseIndex)).size
  const managed = enterpriseIndex === null ? enterprises.length : 1
  const problemCount = issues.filter(item => item.type !== '待确认').length
  const confirmCount = issues.length - problemCount
  const visibleIssues = issues.filter(item => !issueType || item.type === issueType)
  const displayIssues = showAll ? visibleIssues : visibleIssues.slice(0, 5)
  const taskLink = issue => {
    const enterpriseId = issue && enterprises[issue.enterpriseIndex]?.enterpriseId
    const actual = linkedTasks.find(task => task.enterpriseId === enterpriseId)
    navigate(`/data-overview?tab=reporting${actual ? `&taskId=${encodeURIComponent(actual.taskId)}` : ''}`)
  }
  return <div className="content dm-page pdo-page">
    <div className="pdo-heading"><h1>园区数据总览 <span>示例数据</span></h1><p>掌握数据覆盖、更新与协同进展，为能碳分析提供数据保障。</p></div>
    <Tabs className="dm-data-overview-tabs" tabs={[{ value: 'overview', label: '数据保障概览' }, { value: 'reporting', label: '企业填报任务' }]} active={overviewTab} onChange={tab => navigate(`/data-overview?tab=${tab}`)} />
    {overviewTab === 'reporting' ? <ReportingTaskMonitoringPage embedded /> : <>
      <form className="pdo-filters" onSubmit={event => { event.preventDefault(); setFilters(draft); setShowAll(false); setIssueType('') }}>
        <label>统计期间：<select value={draft.period} onChange={event => setDraft({ ...draft, period: event.target.value })}>{['2026-09', '2026-08', '2026-07'].map(period => <option value={period} key={period}>{monthText(period)}</option>)}</select></label>
        <label>企业：<select value={draft.enterprise} onChange={event => setDraft({ ...draft, enterprise: event.target.value })}><option value="">全部</option>{enterprises.map((enterprise, index) => <option key={enterprise.enterpriseId} value={index}>{enterprise.name}</option>)}</select></label>
        <label>数据类别：<select value={draft.category} onChange={event => setDraft({ ...draft, category: event.target.value })}><option value="">全部</option>{categories.map(category => <option key={category}>{category}</option>)}</select></label>
        <button className="pdo-search" type="submit">⌕ &nbsp;查询</button><span className="pdo-updated">更新时间：2026-10-13 16:30</span>
      </form>
      <div className="pdo-stats"><div className="pdo-stat"><div className="pdo-stat-icon">▥</div><div><h2>企业数据覆盖</h2><strong>{covered} <em>/ {managed}</em><small> 家</small></strong><p>已提供本期数据 / 纳入管理企业</p></div></div><div className="pdo-stat"><div className="pdo-stat-icon">▤</div><div><h2>数据取得情况</h2><strong>{acquired} <em>/ {expected}</em><small> 项</small></strong><p>已取得 / 应提供 · 完整率 <b>{expected ? (acquired / expected * 100).toFixed(1) : '0.0'}%</b></p></div></div><div className="pdo-stat warn"><div className="pdo-stat-icon">▦</div><div><h2>待处理事项</h2><strong>{issues.length}<small> 项</small></strong><p>数据问题 {problemCount} 项 · 待确认 {confirmCount} 项</p></div></div></div>
      <div className="pdo-charts"><section className="pdo-panel"><div className="pdo-panel-head"><h2>数据来源覆盖情况</h2><div className="pdo-legend"><span><i className="expected"/>应提供</span><span><i className="acquired"/>已取得</span></div></div><SourceChart rows={sourceRows}/></section><section className="pdo-panel"><div className="pdo-panel-head"><h2>协同任务进展</h2><button onClick={() => navigate('/data-overview?tab=reporting')}>查看全部任务 →</button></div><TaskChart tasks={tasks} onView={() => navigate('/data-overview?tab=reporting')}/></section></div>
      <section className="pdo-panel pdo-issues"><div className="pdo-panel-head"><h2>待处理清单</h2><div className="pdo-list-actions"><label>问题类型：<select value={issueType} onChange={event => { setIssueType(event.target.value); setShowAll(false) }}><option value="">全部</option>{issueTypes.map(type => <option key={type}>{type}</option>)}</select></label><button onClick={() => setShowAll(value => !value)}>{showAll ? '收起清单' : `查看全部 ${visibleIssues.length} 项`} →</button></div></div><Table className="pdo-table" headers={['问题类型', '数据主体', '数据项', '统计期间', '问题说明', '责任方', '操作']} rows={displayIssues.map(issue => ({ key: issue.id, cells: [<span className={`pdo-issue-tag ${issue.type === '待确认' ? 'confirm' : issue.type === '异常' ? 'abnormal' : ''}`}>{issue.type}</span>, enterprises[issue.enterpriseIndex].name, issue.item, filters.period, issue.description, issue.owner, <button className="op-btn" onClick={() => issue.taskIndex === null ? setSelectedRecord(issue) : taskLink(issue)}>{issue.taskIndex === null ? '查看记录' : '查看任务'}</button>] }))}/><div className="pdo-foot"><span>ⓘ &nbsp;完整率按本期应提供数据计算；已取得不代表已核实有效。</span><span>共 {visibleIssues.length} 项 · 当前展示 {displayIssues.length} 项</span></div></section>
      <Modal open={!!selectedRecord} title="数据记录详情 · 示例数据" onClose={() => setSelectedRecord(null)} className="small"><div className="modal-body"><div className="dm-detail-grid"><div><label>数据主体</label><b>{selectedRecord && enterprises[selectedRecord.enterpriseIndex].name}</b></div><div><label>统计期间</label><b>{filters.period}</b></div><div><label>数据项</label><b>{selectedRecord?.item}</b></div><div><label>数据项编码</label><b>{selectedRecord?.code}</b></div><div><label>问题类型</label><b>{selectedRecord?.type}</b></div><div><label>责任方</label><b>{selectedRecord?.owner}</b></div><div className="wide"><label>问题说明</label><p>{selectedRecord?.description}</p></div></div></div><div className="modal-foot"><button className="btn" onClick={() => setSelectedRecord(null)}>关闭</button></div></Modal>
    </>}
  </div>
}
