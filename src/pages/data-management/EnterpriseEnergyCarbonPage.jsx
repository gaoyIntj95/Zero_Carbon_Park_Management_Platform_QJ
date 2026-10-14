import { useEffect, useState } from 'react'
import { PageHeader } from '../../components/PageHeader.jsx'
import { Tabs } from '../../components/Tabs.jsx'
import { Modal } from '../../components/Modal.jsx'
import { StatusTag } from '../../components/StatusTag.jsx'
import { useCollaboration } from '../../mock/collaborationStore.js'
import '../../enterprise-energy-carbon-data.css'

const currentPeriod = '2026-09'
const tabs = ['能源数据', '生产经营数据', '碳排放数据'].map(value => ({ value, label:value }))
const stageLabels = { 能源数据:'数据环节', 生产经营数据:'经营环节', 碳排放数据:'核算环节' }
const emptyFilters = { period:currentPeriod, boundary:'', stage:'', report:'' }
const sourceRecord = (name, value, evidence) => ({ name, value, evidence })
export const enterpriseEnergyCarbonStorageKey = enterpriseId => `qujing-enterprise-energy-carbon-v3-${enterpriseId}`
export const enterpriseEnergyCarbonSeed = [
  { id:'elec-input', category:'能源数据', item:'外购电力', stage:'输入', period:currentPeriod, boundary:'企业边界', value:1258600, unit:'kWh', source:'系统接口', quality:'来源差异', report:'待企业核实', sources:[sourceRecord('电表接口',1258600,'电表采集记录.pdf'),sourceRecord('结算账单',1246800,'9月电费结算单.pdf')], taskKeyword:'电力消费差异' },
  { id:'gas-consume', category:'能源数据', item:'天然气', stage:'消费', period:currentPeriod, boundary:'企业边界', value:186200, unit:'Nm³', source:'企业能碳模块', quality:'正常', report:'园区已确认', sources:[sourceRecord('企业能碳模块',186200,'天然气结算凭证.pdf')] },
  { id:'diesel-consume', category:'能源数据', item:'柴油', stage:'消费', period:currentPeriod, boundary:'企业边界', value:null, unit:'t', source:'人工填报', quality:'待补充', report:'未提交', sources:[] },
  { id:'steam-input', category:'能源数据', item:'蒸汽', stage:'输入', period:currentPeriod, boundary:'企业边界', value:680, unit:'t', source:'系统接口', quality:'正常', report:'待企业确认', sources:[sourceRecord('蒸汽计量接口',680,'蒸汽计量记录.pdf')] },
  { id:'heat-recover', category:'能源数据', item:'余热', stage:'回收', period:currentPeriod, boundary:'企业边界', value:240, unit:'GJ', source:'企业能碳模块', quality:'正常', report:'已提交', sources:[sourceRecord('企业能碳模块',240,'余热回收台账.xlsx')] },
  { id:'elec-supply', category:'能源数据', item:'电力', stage:'外供', period:currentPeriod, boundary:'企业边界', value:32400, unit:'kWh', source:'自动采集', quality:'正常', report:'园区已确认', sources:[sourceRecord('自动采集',32400,'外供电量采集记录.pdf')] },
  { id:'coal-consume', category:'能源数据', item:'煤', stage:'消费', period:currentPeriod, boundary:'企业边界', value:126, unit:'t', source:'人工填报', quality:'待核实', report:'已退回', feedback:'煤耗统计期间与结算凭证不一致，请核实后重报。', sources:[sourceRecord('人工填报',126,'煤耗台账.xlsx')] },
  { id:'fuel-consume', category:'能源数据', item:'其他燃料', stage:'消费', period:currentPeriod, boundary:'企业边界', value:5620, unit:'GJ', source:'企业能碳模块', quality:'正常', report:'待企业确认', sources:[sourceRecord('企业能碳模块',5620,'燃料消费汇总表.xlsx')] },
  { id:'heat-input', category:'能源数据', item:'热力', stage:'输入', period:currentPeriod, boundary:'企业边界', value:1860, unit:'GJ', source:'系统接口', quality:'正常', report:'园区已确认', sources:[sourceRecord('热力计量接口',1860,'热力计量记录.pdf')] },
  { id:'elec-aug', category:'能源数据', item:'外购电力', stage:'输入', period:'2026-08', boundary:'企业边界', value:1196000, unit:'kWh', source:'系统接口', quality:'正常', report:'园区已确认', sources:[sourceRecord('电表接口',1196000,'8月电量记录.pdf')] },
  { id:'output-sep', category:'生产经营数据', item:'光伏电池片产量', stage:'生产', period:currentPeriod, boundary:'企业边界', value:3280, unit:'万片', source:'企业能碳模块', quality:'正常', report:'待企业确认', sources:[sourceRecord('企业能碳模块',3280,'9月产量台账.xlsx')] },
  { id:'output-missing', category:'生产经营数据', item:'次品产量', stage:'生产', period:currentPeriod, boundary:'产线边界', value:null, unit:'万片', source:'人工填报', quality:'待补充', report:'未提交', sources:[] },
  { id:'industrial-value', category:'生产经营数据', item:'工业增加值', stage:'经营', period:currentPeriod, boundary:'企业边界', value:18620, unit:'万元', source:'人工填报', quality:'正常', report:'已提交', sources:[sourceRecord('企业财务报表',18620,'9月财务报表.pdf')] },
  { id:'output-aug', category:'生产经营数据', item:'光伏电池片产量', stage:'生产', period:'2026-08', boundary:'企业边界', value:3090, unit:'万片', source:'企业能碳模块', quality:'正常', report:'园区已确认', sources:[sourceRecord('企业能碳模块',3090,'8月产量台账.xlsx')] },
  { id:'carbon-scope1', category:'碳排放数据', item:'范围一排放', stage:'核算', period:currentPeriod, boundary:'企业边界', value:10426, unit:'tCO₂e', source:'企业能碳模块', quality:'正常', report:'园区已确认', sources:[sourceRecord('组织碳核算结果',10426,'范围一核算底稿.pdf')], lockedVersion:'碳排放报告 v1' },
  { id:'carbon-scope2', category:'碳排放数据', item:'范围二排放', stage:'核算', period:currentPeriod, boundary:'企业边界', value:8420, unit:'tCO₂e', source:'企业能碳模块', quality:'来源差异', report:'待企业核实', sources:[sourceRecord('购电量核算',8420,'购电量核算底稿.pdf'),sourceRecord('结算量核算',8350,'结算量核算底稿.pdf')], lockedVersion:'碳排放报告 v1' },
  { id:'carbon-total', category:'碳排放数据', item:'碳排放总量', stage:'汇总', period:currentPeriod, boundary:'企业边界', value:18846, unit:'tCO₂e', source:'企业能碳模块', quality:'正常', report:'已提交', sources:[sourceRecord('组织碳核算汇总',18846,'排放汇总表.xlsx')] },
  { id:'carbon-aug', category:'碳排放数据', item:'范围二排放', stage:'核算', period:'2026-08', boundary:'企业边界', value:8016, unit:'tCO₂e', source:'企业能碳模块', quality:'正常', report:'园区已确认', sources:[sourceRecord('组织碳核算结果',8016,'8月核算底稿.pdf')] },
].map(row => ({ ...row, history:row.report === '已退回' ? [{time:'2026-10-12 10:20',action:'园区退回',note:row.feedback}] : [] }))

const format = value => value == null ? '—' : Number(value).toLocaleString('zh-CN')
const statusTone = value => ['正常','园区已确认'].includes(value) ? 'ok' : ['来源差异','待企业核实','待企业确认'].includes(value) ? 'warn' : ['待补充','已退回'].includes(value) ? 'danger' : 'gray'
const eligible = row => row.value != null && row.quality === '正常' && row.report === '待企业确认'
const actionLabel = row => row.value == null ? '补充填报' : row.report === '已退回' ? '修正重报' : row.quality === '来源差异' || row.report === '待企业核实' ? '核实修正' : eligible(row) ? '确认' : '查看'
const now = () => new Date().toLocaleString('sv-SE').replace('T',' ')

function EvidenceModal({ evidence, onClose }) {
  return <Modal open={!!evidence} title="凭证查看" onClose={onClose} className="small"><div className="modal-body"><b>{evidence?.name}</b><div className="eec-evidence">演示凭证<br/>{evidence?.content}<small>来源数值：{format(evidence?.value)} {evidence?.unit}</small></div></div><div className="modal-foot"><button className="btn primary" onClick={onClose}>关闭</button></div></Modal>
}

function SourceDetails({ row, onEvidence }) {
  return <><div className="eec-record-grid"><span>数据项 / 环节</span><b>{row.item} · {row.stage}</b><span>期间</span><b>{row.period}</b><span>统计边界</span><b>{row.boundary}</b><span>原始记录</span><b>{format(row.value)} {row.value == null ? '' : row.unit}</b><span>数据来源</span><b>{row.source}</b></div><h3>关联来源与凭证</h3><div className="eec-source-list">{row.sources.length ? row.sources.map((source,index) => <div key={`${source.name}-${index}`}><span>{source.name}</span><b>{format(source.value)} {row.unit}</b><button type="button" className="op-btn" onClick={() => onEvidence({name:source.evidence,content:source.name,value:source.value,unit:row.unit})}>查看凭证</button></div>) : <p>暂无已关联来源记录，请补充数据及必要凭证。</p>}</div>{row.feedback && <div className="eec-feedback"><b>园区反馈</b><p>{row.feedback}</p></div>}{row.proposedValue != null && <div className="eec-proposal">建议修正值：{format(row.proposedValue)} {row.unit}；原因：{row.correctionReason}</div>}{row.lockedVersion && <div className="eec-version">{row.lockedVersion} 已保留。企业提交的修正建议需由业务模块按规则更新，不能直接覆盖核算结果或已确认版本。</div>}<details className="eec-history"><summary>处理记录（{row.history.length}）</summary>{row.history.length ? row.history.map((entry,index) => <p key={index}><b>{entry.action}</b> · {entry.time}<br/>{entry.note}</p>) : <p>暂无处理记录</p>}</details></>
}

function FillDialog({ row, category, task, onClose, onSubmit }) {
  const [item, setItem] = useState(row?.item || '')
  const [stage, setStage] = useState(row?.stage || (category === '能源数据' ? '消费' : category === '生产经营数据' ? '生产' : '核算'))
  const [period, setPeriod] = useState(row?.period || currentPeriod)
  const [boundary, setBoundary] = useState(row?.boundary || '企业边界')
  const [value, setValue] = useState(row?.draft?.value ?? '')
  const [unit, setUnit] = useState(row?.unit || '')
  const [evidence, setEvidence] = useState(row?.draft?.evidence || '')
  const submit = event => { event.preventDefault(); onSubmit({row,item:item.trim(),stage,period,boundary,value:Number(value),unit:unit.trim(),evidence:evidence.trim(),category}) }
  return <Modal open title="补充填报" onClose={onClose}><form onSubmit={submit}><div className="modal-body">{task && <div className="eec-task"><b>关联协同任务：{task.name}</b><p>填报口径：{task.scope}</p><p>材料要求：{task.requirement}</p></div>}<div className="eec-form"><label>数据项<input required value={item} onChange={event => setItem(event.target.value)}/></label><label>数据环节<select value={stage} onChange={event => setStage(event.target.value)}>{(category === '能源数据' ? ['输入','消费','产出','回收','外供'] : category === '生产经营数据' ? ['生产','经营'] : ['核算','汇总']).map(option => <option key={option}>{option}</option>)}</select></label><label>期间<input type="month" required value={period} onChange={event => setPeriod(event.target.value)}/></label><label>统计边界<select value={boundary} onChange={event => setBoundary(event.target.value)}><option>企业边界</option><option>产线边界</option><option>能源站边界</option></select></label><label>数值<input type="number" min="0" step="any" required value={value} onChange={event => setValue(event.target.value)}/></label><label>单位<input required value={unit} onChange={event => setUnit(event.target.value)}/></label><label className="wide">必要凭证<input required value={evidence} onChange={event => setEvidence(event.target.value)} placeholder="填写凭证名称或编号"/></label></div><p className="eec-form-hint">已有来源数据无需重复填报；提交后等待园区确认。</p></div><div className="modal-foot"><button type="button" className="btn" onClick={onClose}>取消</button><button className="btn primary">提交</button></div></form></Modal>
}

function CorrectionDialog({ row, task, onClose, onEvidence, onSave }) {
  const [value, setValue] = useState(row.draft?.value ?? row.proposedValue ?? row.value ?? '')
  const [reason, setReason] = useState(row.draft?.reason ?? row.correctionReason ?? '')
  const [evidence, setEvidence] = useState(row.draft?.evidence ?? '')
  const save = (submit) => { if (value === '' || !Number.isFinite(Number(value)) || Number(value) < 0 || (submit && !reason.trim())) return; onSave(row.id,{value:Number(value),reason:reason.trim(),evidence:evidence.trim()},submit) }
  return <Modal open title={row.report === '已退回' ? '修正重报' : '核实修正'} onClose={onClose} className="detail-modal"><div className="modal-body"><SourceDetails row={row} onEvidence={onEvidence}/>{task && <div className="eec-task"><b>关联协同任务：{task.name}</b><p>核实要求：{task.requirement}</p></div>}<div className="eec-form correction"><label>建议修正值<input type="number" min="0" step="any" required value={value} onChange={event => setValue(event.target.value)}/></label><label>计量单位<input value={row.unit} readOnly/></label><label className="wide">修正原因<textarea required value={reason} onChange={event => setReason(event.target.value)} placeholder="说明差异原因及修正依据"/></label><label className="wide">补充凭证<input value={evidence} onChange={event => setEvidence(event.target.value)} placeholder="可填写新凭证名称或编号"/></label></div><p className="eec-form-hint">提交的是修正建议。原始记录与核算结果保持不变，园区确认后再按规则更新。</p></div><div className="modal-foot"><button className="btn" onClick={onClose}>取消</button><button className="btn" onClick={() => save(false)}>暂存</button><button className="btn primary" disabled={value === '' || !reason.trim()} onClick={() => save(true)}>提交</button></div></Modal>
}

export function EnterpriseEnergyCarbonPage({ currentEnterpriseId }) {
  const { tasks } = useCollaboration()
  const storageKey = enterpriseEnergyCarbonStorageKey(currentEnterpriseId)
  const [rows, setRows] = useState(() => { try { const saved = JSON.parse(localStorage.getItem(storageKey)); return Array.isArray(saved) ? saved : enterpriseEnergyCarbonSeed } catch { return enterpriseEnergyCarbonSeed } })
  useEffect(() => { try { localStorage.setItem(storageKey,JSON.stringify(rows)) } catch { /* In-memory Mock remains usable. */ } }, [rows,storageKey])
  const [tab, setTab] = useState('能源数据')
  const [draft, setDraft] = useState(emptyFilters)
  const [filters, setFilters] = useState(emptyFilters)
  const [selected, setSelected] = useState(new Set())
  const [dialog, setDialog] = useState(null)
  const [evidence, setEvidence] = useState(null)
  const [notice, setNotice] = useState('')
  const scoped = rows.filter(row => row.category === tab)
  const visible = scoped.filter(row => (!filters.period || row.period === filters.period) && (!filters.boundary || row.boundary === filters.boundary) && (!filters.stage || row.stage === filters.stage) && (!filters.report || row.report === filters.report))
  const confirmable = visible.filter(eligible)
  const counts = { linked:scoped.filter(row => row.value != null).length, review:scoped.filter(row => ['待企业核实','待企业确认','已退回'].includes(row.report)).length, missing:scoped.filter(row => row.value == null).length, confirmed:scoped.filter(row => row.report === '园区已确认').length }
  const taskFor = row => row?.taskKeyword && tasks.find(task => task.enterpriseId === currentEnterpriseId && task.period === row.period && task.name.includes(row.taskKeyword))
  const update = (id, change) => setRows(previous => previous.map(row => row.id === id ? { ...row, ...change } : row))
  const confirm = ids => { setRows(previous => previous.map(row => ids.includes(row.id) && eligible(row) ? { ...row, report:'已提交', history:[...row.history,{time:now(),action:'企业确认提交',note:'已核实来源记录，无需修正；等待园区确认。'}] } : row)); setSelected(new Set()); setNotice(`已提交 ${ids.length} 条可直接确认的数据，等待园区确认。`) }
  const saveFill = values => { const {row,item,stage,period,boundary,value,unit,evidence:proof,category} = values; const duplicate = rows.find(candidate => candidate.id !== row?.id && candidate.category === category && candidate.item === item && candidate.stage === stage && candidate.period === period && candidate.boundary === boundary); if (duplicate) { setNotice('该数据项、环节、期间和边界已有记录，请复用已有记录。'); setDialog(null); return } const record = { ...(row || {id:`manual-${crypto.randomUUID()}`,category,history:[],sources:[]}), item,stage,period,boundary,value,unit,source:'人工填报',quality:'待核实',report:'已提交',sources:[...(row?.sources || []),sourceRecord('人工填报',value,proof)],history:[...(row?.history || []),{time:now(),action:'企业补充提交',note:`填报 ${format(value)} ${unit}；凭证：${proof}。`}] }; setRows(previous => row ? previous.map(item => item.id === row.id ? record : item) : [record,...previous]); setDialog(null); setNotice('补充数据已提交，等待园区确认。') }
  const saveCorrection = (id, change, submit) => { setRows(previous => previous.map(row => row.id !== id ? row : submit ? { ...row, proposedValue:change.value, correctionReason:change.reason, correctionEvidence:change.evidence, draft:null, report:'已提交', history:[...row.history,{time:now(),action:'企业提交修正建议',note:`原值 ${format(row.value)} ${row.unit}，建议修正值 ${format(change.value)} ${row.unit}；原因：${change.reason}${change.evidence ? `；凭证：${change.evidence}` : ''}。${row.lockedVersion ? `已保留${row.lockedVersion}。` : ''}`}] } : { ...row, draft:change, history:[...row.history,{time:now(),action:'暂存修正草稿',note:'未提交园区确认。'}] })); setDialog(null); setNotice(submit ? '修正建议已提交；原始值保留，等待园区确认。' : '修正内容已暂存。') }
  const chooseAction = row => { const action = actionLabel(row); if (action === '确认') confirm([row.id]); else setDialog({type:action === '补充填报' ? 'fill' : action === '查看' ? 'view' : 'correct',row}) }
  const changeTab = value => { setTab(value); setDraft(emptyFilters); setFilters(emptyFilters); setSelected(new Set()); setNotice('') }
  const exportRows = () => { const data = [['数据项','环节','期间','统计边界','数值','单位','数据来源','质量状态','报送状态'],...visible.map(row => [row.item,row.stage,row.period,row.boundary,row.value ?? '',row.unit,row.source,row.quality,row.report])]; const csv = '\ufeff' + data.map(line => line.map(value => `"${String(value).replaceAll('"','""')}"`).join(',')).join('\r\n'); const link = document.createElement('a'); link.href = URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'})); link.download = `${tab}-${filters.period || '全部期间'}.csv`; link.click(); URL.revokeObjectURL(link.href) }
  const activeRow = dialog?.row && rows.find(row => row.id === dialog.row.id)
  return <div className="content eec-page">
    <PageHeader title="能碳数据" subtitle="复用已有数据，核实差异并补充约定报送内容。"/>
    {notice && <div className="notice success">{notice}</div>}
    <div className="eec-stats">{[['已关联数据',counts.linked,'▤'],['待企业核实',counts.review,'!'],['待补充',counts.missing,'▣'],['园区已确认',counts.confirmed,'✓']].map(([label,value,icon],index) => <section key={label} className={`eec-stat s${index}`}><span className="eec-stat-icon">{icon}</span><div><span>{label}</span><strong>{format(value)}<small>条</small></strong></div></section>)}</div>
    <div className="eec-tip">ⓘ　已有能源数据与核算结果优先关联，仅补充缺失项及必要凭证。</div>
    <section className="eec-filter-card"><Tabs tabs={tabs} active={tab} onChange={changeTab}/><form className="eec-filters" onSubmit={event => { event.preventDefault(); setFilters(draft); setSelected(new Set()) }}><label>期间<select value={draft.period} onChange={event => setDraft({...draft,period:event.target.value})}><option value="">全部期间</option>{['2026-09','2026-08'].map(value => <option key={value} value={value}>{value.slice(0,4)}年{value.slice(5)}月</option>)}</select></label><label>统计边界<select value={draft.boundary} onChange={event => setDraft({...draft,boundary:event.target.value})}><option value="">全部</option>{[...new Set(scoped.map(row => row.boundary))].map(value => <option key={value}>{value}</option>)}</select></label><label>{stageLabels[tab]}<select value={draft.stage} onChange={event => setDraft({...draft,stage:event.target.value})}><option value="">全部</option>{[...new Set(scoped.map(row => row.stage))].map(value => <option key={value}>{value}</option>)}</select></label><label>报送状态<select value={draft.report} onChange={event => setDraft({...draft,report:event.target.value})}><option value="">全部</option>{[...new Set(scoped.map(row => row.report))].map(value => <option key={value}>{value}</option>)}</select></label><button className="btn primary">查询</button><button type="button" className="btn" onClick={() => { setDraft(emptyFilters); setFilters(emptyFilters); setSelected(new Set()) }}>重置</button></form></section>
    <section className="eec-list"><header><h2>数据明细 <small>约定报送范围内的数据</small></h2><div><button className="btn eec-bulk" disabled={!selected.size} onClick={() => confirm([...selected])}>☑　批量确认</button><button className="btn primary" onClick={() => setDialog({type:'fill',row:null})}>＋　补充填报</button><button className="btn" onClick={exportRows}>⇩　导出</button></div></header><div className="eec-table-wrap"><table><thead><tr><th><input aria-label="全选可确认数据" type="checkbox" disabled={!confirmable.length} checked={!!confirmable.length && confirmable.every(row => selected.has(row.id))} onChange={event => setSelected(event.target.checked ? new Set(confirmable.map(row => row.id)) : new Set())}/></th>{['数据项 / 环节','期间','统计边界','数值 / 单位','数据来源','质量状态','报送状态','凭证','操作'].map(value => <th key={value}>{value}</th>)}</tr></thead><tbody>{visible.map(row => <tr key={row.id}><td><input aria-label={`选择${row.item} ${row.period}`} type="checkbox" disabled={!eligible(row)} checked={selected.has(row.id)} onChange={event => setSelected(previous => { const next = new Set(previous); if (event.target.checked) next.add(row.id); else next.delete(row.id); return next })}/></td><td><b>{row.item} · {row.stage}</b>{row.proposedValue != null && <small>建议修正 {format(row.proposedValue)} {row.unit}</small>}</td><td>{row.period}</td><td>{row.boundary}</td><td className="eec-number">{format(row.value)} {row.value == null ? '' : row.unit}</td><td>{row.source}</td><td><StatusTag tone={statusTone(row.quality)}>{row.quality}</StatusTag></td><td><StatusTag tone={statusTone(row.report)}>{row.report}</StatusTag></td><td>{row.sources.length ? <button className="op-btn" onClick={() => setEvidence({name:row.sources[0].evidence,content:row.sources[0].name,value:row.sources[0].value,unit:row.unit})}>查看凭证</button> : '—'}</td><td><button className="op-btn" onClick={() => chooseAction(row)}>{actionLabel(row)}</button></td></tr>)}</tbody></table>{!visible.length && <p className="eec-empty">暂无符合条件的数据</p>}</div><footer><p>ⓘ 数据修正保留原始值、修正值及原因；需园区确认的内容经确认后再用于园区统计。<br/>已确认报告或验收版本保留原版本及更新记录。</p><span>共 {visible.length} 条</span></footer></section>
    {dialog?.type === 'fill' && <FillDialog key={activeRow?.id || `new-${tab}`} row={activeRow} category={tab} task={taskFor(activeRow)} onClose={() => setDialog(null)} onSubmit={saveFill}/>}
    {dialog?.type === 'correct' && activeRow && <CorrectionDialog key={activeRow.id} row={activeRow} task={taskFor(activeRow)} onClose={() => setDialog(null)} onEvidence={setEvidence} onSave={saveCorrection}/>}
    {dialog?.type === 'view' && activeRow && <Modal open title="数据详情" onClose={() => setDialog(null)} className="detail-modal"><div className="modal-body"><SourceDetails row={activeRow} onEvidence={setEvidence}/></div><div className="modal-foot"><button className="btn primary" onClick={() => setDialog(null)}>关闭</button></div></Modal>}
    <EvidenceModal evidence={evidence} onClose={() => setEvidence(null)}/>
  </div>
}
