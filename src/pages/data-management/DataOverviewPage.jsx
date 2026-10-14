import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { enterprises } from '../../mock/masterData.js'
import { categories, sourceNames, taskStates, overdue, useCollaboration, enterpriseName } from '../../mock/collaborationStore.js'
import { TaskList, TaskCreate, Cell, recordPath } from '../../components/CollaborationTasks.jsx'
import '../../data-overview.css'

function SourceChart({ rows }) {
  const max = Math.max(1, ...rows.map(row => row.expected))
  return <div className="pdo-source-chart" role="img" aria-label={rows.map(row => `${row.name}应提供${row.expected}项，已取得${row.acquired}项`).join('；')}>
    <div className="pdo-axis"><span>0</span><span>{Math.round(max / 4)}</span><span>{Math.round(max / 2)}</span><span>{Math.round(max * 3 / 4)}</span><span>{max}</span></div>
    {rows.map(row => <div className="pdo-source-row" key={row.name}><span className="pdo-source-name">{row.name}</span><div className="pdo-bars"><div className="pdo-bar-line"><div className="pdo-bar expected" style={{ width: `${row.expected / max * 100}%` }}/><span>{row.expected}</span></div><div className="pdo-bar-line"><div className="pdo-bar acquired" style={{ width: `${row.acquired / max * 100}%` }}/><span>{row.acquired}</span></div></div></div>)}
    <div className="pdo-xlabel">数据项数</div>
  </div>
}

function TaskChart({ tasks, onView }) {
  const colors = ['#079f95', '#36cdb3', '#ffad37', '#ef6c78']
  const counts = taskStates.map(s => tasks.filter(t => t.status === s).length)
  let cursor = 0
  const gradient = counts.map((count, i) => { const start = cursor; cursor += tasks.length ? count / tasks.length * 100 : 0; return `${colors[i]} ${start}% ${cursor}%` }).join(',')
  return <><div className="pdo-task-chart"><div className="pdo-donut" role="img" aria-label={taskStates.map((s,i) => `${s}${counts[i]}项`).join('，')} style={{background:tasks.length ? `conic-gradient(${gradient})` : '#e8f1f0'}}><div className="pdo-donut-center"><b>{tasks.length}<small>项</small></b><span>协同任务</span></div></div><div className="pdo-task-legend">{taskStates.map((s,i) => <div key={s}><i style={{background:colors[i]}}/><span>{s}</span><b style={{color:colors[i]}}>{counts[i]}<small>项</small></b></div>)}</div></div><div className="pdo-overdue"><span>● 逾期未完成 <b>{tasks.filter(t => overdue(t)).length} 项</b></span><button onClick={onView}>查看任务 →</button></div></>
}

export function DataOverviewPage({ navigate }) {
  const { tasks, records, updatedAt } = useCollaboration()
  const [params] = useSearchParams(), tab = params.get('tab') === 'reporting' ? 'reporting' : 'overview'
  const [draft, setDraft] = useState({period:'2026-09',enterprise:'',category:''}), [filters,setFilters] = useState(draft)
  const [issueType,setIssueType] = useState(''), [showAll,setShowAll] = useState(false), [creating,setCreating] = useState(false)
  const match = r => r.period === filters.period && (!filters.enterprise || r.enterpriseId === filters.enterprise) && (!filters.category || r.category === filters.category)
  const scoped = records.filter(match), acquired = scoped.filter(r => r.value !== ''), confirmed = acquired.filter(r => r.confirmed).length
  const coverage = new Set(acquired.map(r => r.enterpriseId)).size
  const issueOrder = ['缺失', '更新滞后', '异常', '重复', '待确认', '资料缺失', '变更待确认']
  const issueGroups = issueOrder.map(type => scoped.filter(r => r.issue === type))
  const issues = Array.from({length: Math.max(0, ...issueGroups.map(g => g.length))}, (_, i) => issueGroups.map(g => g[i]).filter(Boolean)).flat(), problemCount = issues.filter(r => r.issue !== '待确认').length
  const filteredIssues = issues.filter(r => !issueType || r.issue === issueType), visible = showAll ? filteredIssues : filteredIssues.slice(0,5)
  const scopedTasks = tasks.filter(t => { const r = records.find(r => r.id === t.recordId); return r && match(r) })
  const sources = sourceNames.map(name => ({name,expected:scoped.filter(r => r.source === name).length,acquired:acquired.filter(r => r.source === name).length}))
  const taskFor = r => tasks.find(t => t.recordId === r.id && t.status !== '已完成') || tasks.find(t => t.recordId === r.id)
  const goTasks = (late=false) => navigate(`/data-overview?tab=reporting${late ? '&overdue=1' : ''}`)
  return <div className="content dm-page pdo-page"><div className="pdo-heading"><h1>园区数据总览 <span>示例数据</span></h1></div><div className="ct-overview-tabs"><nav className="ct-tabs"><button className={tab==='overview'?'active':''} onClick={()=>navigate('/data-overview')}>数据保障概览</button><button className={tab==='reporting'?'active':''} onClick={()=>goTasks()}>协同任务 <small>{tasks.length}</small></button></nav><button className="btn primary" onClick={()=>setCreating(true)}>＋ 发起任务</button></div>
  {tab==='reporting'?<TaskList park/>:<><form className="pdo-filters" onSubmit={e=>{e.preventDefault();setFilters(draft);setShowAll(false)}}><label>统计期间<select value={draft.period} onChange={e=>setDraft({...draft,period:e.target.value})}>{['2026-09','2026-08','2026-07'].map(p=><option key={p}>{p}</option>)}</select></label><label>企业<select value={draft.enterprise} onChange={e=>setDraft({...draft,enterprise:e.target.value})}><option value="">全部</option>{enterprises.map(e=><option value={e.id} key={e.id}>{e.name}</option>)}</select></label><label>数据类别<select value={draft.category} onChange={e=>setDraft({...draft,category:e.target.value})}><option value="">全部</option>{categories.map(c=><option key={c}>{c}</option>)}</select></label><button className="pdo-search">查询</button><span className="pdo-updated">更新时间：{updatedAt}</span></form>
  <div className="pdo-stats"><div className="pdo-stat"><div className="pdo-stat-icon">▥</div><div><h2>企业数据覆盖</h2><strong>{coverage} <em>/ {filters.enterprise?1:enterprises.length}</em><small> 家</small></strong><p>已提供本期数据 / 本期纳入管理企业</p></div></div><div className="pdo-stat"><div className="pdo-stat-icon">▤</div><div><h2>数据取得情况</h2><strong>{acquired.length} <em>/ {scoped.length}</em><small> 项</small></strong><p>完整率 <b>{scoped.length?(acquired.length/scoped.length*100).toFixed(1):'0.0'}%</b></p><p>已确认 {confirmed} 项 · 待确认 {acquired.length-confirmed} 项</p></div></div><div className="pdo-stat warn"><div className="pdo-stat-icon">▦</div><div><h2>待处理事项</h2><strong>{issues.length}<small> 项</small></strong><p>数据问题 {problemCount} 项 · 待确认事项 {issues.length-problemCount} 项</p></div></div></div>
  <div className="pdo-charts"><section className="pdo-panel"><div className="pdo-panel-head"><h2>数据来源覆盖情况</h2><div className="pdo-legend"><span><i className="expected"/>应提供</span><span><i className="acquired"/>已取得</span></div></div><SourceChart rows={sources}/></section><section className="pdo-panel"><div className="pdo-panel-head"><h2>协同任务进展</h2><button onClick={()=>goTasks()}>管理任务 →</button></div><TaskChart tasks={scopedTasks} onView={()=>goTasks(true)}/></section></div>
  <section className="pdo-panel pdo-issues"><div className="pdo-panel-head"><h2>待处理清单</h2><div className="pdo-list-actions"><label>问题类型<select value={issueType} onChange={e=>{setIssueType(e.target.value);setShowAll(false)}}><option value="">全部</option>{[...new Set(records.map(r=>r.issue).filter(Boolean))].map(t=><option key={t}>{t}</option>)}</select></label><button onClick={()=>setShowAll(v=>!v)}>{showAll?'收起清单':`查看全部 ${filteredIssues.length} 项`} →</button></div></div><div className="table-wrap"><table className="pdo-table dm-table"><thead><tr>{['问题类型','数据主体','数据项','统计期间','问题说明','责任方','操作'].map(h=><th key={h}>{h}</th>)}</tr></thead><tbody>{visible.map(r=>{const task=taskFor(r);return <tr key={r.id}><Cell>{r.issue}</Cell><Cell>{enterpriseName(r.enterpriseId)}</Cell><Cell>{r.name}</Cell><Cell>{r.period}</Cell><Cell>{r.description}</Cell><Cell>{['待确认','重复'].includes(r.issue)?'园区管理员':'企业填报员'}</Cell><td><button className="op-btn" onClick={()=>task?navigate(`/data-overview?tab=reporting&taskId=${task.id}`):['缺失','资料缺失'].includes(r.issue)?setCreating(r):navigate(recordPath(r,true))}>{task?'查看任务':['缺失','资料缺失'].includes(r.issue)?'发起任务':'查看记录'}</button></td></tr>})}</tbody></table>{!visible.length&&<div className="ct-empty">暂无待处理事项</div>}</div><div className="pdo-foot"><span>ⓘ 完整率按本期应提供数据计算；已取得不代表已核实有效。</span><span>共 {filteredIssues.length} 项 · 当前展示 {visible.length} 项</span></div></section></>}
  {creating&&<TaskCreate initial={creating===true?null:creating} onClose={()=>setCreating(false)} onCreated={id=>{setCreating(false);navigate(`/data-overview?tab=reporting&taskId=${id}`)}}/>}</div>
}
