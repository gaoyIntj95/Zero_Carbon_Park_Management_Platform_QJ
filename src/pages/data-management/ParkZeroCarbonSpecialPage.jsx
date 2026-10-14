import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Modal } from '../../components/Modal.jsx'
import { PageHeader } from '../../components/PageHeader.jsx'
import { StatusTag } from '../../components/StatusTag.jsx'
import { TaskDrawer } from '../../components/CollaborationTasks.jsx'
import { createTask, enterpriseName, registerSpecialRecord, useCollaboration } from '../../mock/collaborationStore.js'
import { enterprises } from '../../mock/masterData.js'
import '../../park-zero-carbon-special.css'

const themes = [
  { id:'resource', name:'资源循环利用', icon:'♻', description:'工业固废、再生水及循环利用资料', requirements:['工业固废产生量与利用量','再生水使用量及依据','循环利用相关成果'], scope:'按园区纳入统计的主体、设施及期间核对产生量与实际利用量。', indicators:['工业固废利用率','余热/余冷/余压综合利用率'] },
  { id:'building', name:'绿色建筑', icon:'▥', description:'建筑范围、面积及认证依据', requirements:['建筑范围与面积','绿色建筑证明材料','建设改造阶段成果'], scope:'以适用建筑清单、建筑面积及有效证明材料为依据。', indicators:['绿色低碳建筑占新建建筑比例','可利用建筑屋顶光伏覆盖率'] },
  { id:'transport', name:'绿色交通', icon:'▰', description:'车辆、设施及运营资料', requirements:['新能源车辆资料','充换电设施及依据','交通建设阶段成果'], scope:'按纳入园区统计范围的车辆及配套设施归集。', indicators:['新能源交通运输工具比例'] },
  { id:'other', name:'其他适用专项', icon:'▣', description:'按园区适用要求补充', requirements:['余热余压利用补充资料','专项要求与统计口径','其他建设及成果材料'], scope:'以园区实际适用要求为准，复用设施与能碳数据已有记录。', indicators:['余热/余冷/余压综合利用率'] },
]

const initialMaterials = [
  { id:'solid-waste', theme:'resource', name:'工业固废综合利用资料', enterpriseId:'ent-003', period:'2026年度', scope:'企业边界，按产生量与利用量分别统计', value:'86,000', unit:'t', source:'企业报送台账', evidence:'工业固废利用台账.xlsx', status:'待确认', issue:'已提交本期数据及依据', history:[{ action:'企业提交', note:'提交工业固废利用台账及汇总数据。', time:'2026-10-12 09:30' }] },
  { id:'recycled-water', theme:'resource', name:'再生水使用量及依据', enterpriseId:'ent-002', period:'2026年度', scope:'园区再生水利用设施边界', value:'', unit:'m³', source:'待企业补充', evidence:'', status:'待补充', issue:'缺少再生水使用量及计量依据', history:[] },
  { id:'building-certificate', theme:'building', name:'绿色建筑证明材料', enterpriseId:'ent-001', period:'2026年度', scope:'园区新建建筑适用范围', value:'', unit:'栋', source:'待企业补充', evidence:'', status:'待补充', issue:'缺少适用范围与证书附件', history:[] },
  { id:'building-area', theme:'building', name:'新建建筑面积台账', enterpriseId:'ent-001', period:'2026年度', scope:'园区新建建筑范围', value:'18,600', unit:'m²', source:'园区建筑台账', evidence:'建筑面积台账.xlsx', status:'待确认', issue:'建筑范围及面积待核对', history:[] },
  { id:'vehicle-list', theme:'transport', name:'新能源车辆资料', enterpriseId:'ent-004', period:'2026年度', scope:'园区纳入统计的交通车辆', value:'22', unit:'辆', source:'企业报送台账', evidence:'车辆清单.pdf', status:'待确认', issue:'车辆清单及凭证已提交', history:[] },
  { id:'charging-proof', theme:'transport', name:'充换电设施建设依据', enterpriseId:'ent-004', period:'2026年度', scope:'园区运营充换电设施', value:'', unit:'处', source:'待企业补充', evidence:'', status:'待补充', issue:'缺少设施验收材料', history:[] },
  { id:'waste-heat', theme:'other', name:'余热余压利用资料', enterpriseId:'ent-003', period:'2026年度', scope:'能源站边界，核对实际回收利用量', value:'1,560', unit:'GJ', source:'园区能碳数据 · 余热回收', evidence:'余热回收计量记录.pdf', status:'待确认', issue:'已引用能碳数据，需补充口径说明', history:[] },
  { id:'other-result', theme:'other', name:'专项建设阶段成果', enterpriseId:'ent-006', period:'2026年度', scope:'园区适用专项建设范围', value:'1', unit:'项', source:'园区建设台账', evidence:'阶段验收纪要.pdf', status:'待确认', issue:'阶段成果与依据待核对', history:[] },
]

const projects = [
  { id:'building-renovation', theme:'building', name:'公共建筑节能改造', owner:'园区建设单位', deadline:'2026-11-10', status:'施工中', result:'施工进度资料', image:null },
  { id:'water-reuse', theme:'resource', name:'再生水回用设施建设', owner:'园区公用事业单位', deadline:'2026-10-31', status:'待验收', result:'试运行记录', image:null },
  { id:'green-transport', theme:'transport', name:'绿色交通设施建设', owner:'园区运营单位', deadline:'2026-12-20', status:'建设中', result:'设备到货资料', image:null },
]

const professionalResults = [
  { id:'building-evaluation', theme:'building', title:'绿色建筑评价结论', conclusion:'建筑评价结果以出具机构文件为准', issuer:'专业评价机构', scope:'已评价建筑单体', validUntil:'2027-12-31', basis:'绿色建筑评价报告及证书', record:'building-certificate' },
]

const timestamp = () => new Date().toLocaleString('sv-SE').replace('T', ' ')
const themeFor = id => themes.find(theme => theme.id === id)
const tone = status => status === '已确认' ? 'ok' : status === '待补充' || status === '已退回' ? 'danger' : 'warn'
const isPending = row => ['待确认', '待补充', '已退回'].includes(row.status)
const dueSoon = project => project.status !== '已完成' && (new Date(`${project.deadline}T23:59:59`).getTime() - Date.now()) / 86400000 <= 30 && new Date(`${project.deadline}T23:59:59`).getTime() >= Date.now()

function MaterialDetails({ row, onClose, onConfirm, onReturn, onEvidence }) {
  const [feedback, setFeedback] = useState('')
  const [returning, setReturning] = useState(false)
  return <Modal open title="资料详情与办理" onClose={onClose} className="pzs-detail-modal">
    <div className="modal-body">
      <h3>{row.name}</h3>
      <div className="pzs-detail-grid">
        <span>涉及主体</span><b>{enterpriseName(row.enterpriseId)}</b><span>所属专项</span><b>{themeFor(row.theme)?.name}</b>
        <span>期间</span><b>{row.period}</b><span>统计口径</span><b>{row.scope}</b>
        <span>数值及单位</span><b>{row.value ? `${row.value} ${row.unit}` : '待补充'}</b><span>来源</span><b>{row.source}</b>
        <span>凭证</span><b>{row.evidence ? <button className="op-btn" onClick={() => onEvidence(row.evidence)}>{row.evidence} · 查看</button> : '待补充'}</b>
        <span>确认状态</span><b><StatusTag tone={tone(row.status)}>{row.status}</StatusTag></b>
      </div>
      <p className="pzs-issue">待处理内容：{row.issue || '当前无待处理问题。'}</p>
      <details className="pzs-history"><summary>变更记录（{row.history.length}）</summary>{row.history.length ? row.history.map((entry,index) => <p key={index}><b>{entry.action}</b> · {entry.time}<br/>{entry.note}</p>) : <p>暂无变更记录</p>}</details>
      {returning && <label className="pzs-feedback">反馈意见<textarea autoFocus value={feedback} onChange={event => setFeedback(event.target.value)} placeholder="请说明需要补充的口径或材料"/></label>}
    </div>
    <div className="modal-foot"><button className="btn" onClick={onClose}>关闭</button>{row.status === '待确认' && <><button className="btn" onClick={() => returning ? feedback.trim() && onReturn(row,feedback.trim()) : setReturning(true)}>{returning ? '提交退回意见' : '退回补充'}</button><button className="btn primary" onClick={() => onConfirm(row)}>确认资料</button></>}</div>
  </Modal>
}

function TaskForm({ row, onClose, onCreated }) {
  const [scope, setScope] = useState(row.scope)
  const [requirement, setRequirement] = useState(row.issue)
  const [deadline, setDeadline] = useState('2026-10-31T18:00')
  const [error, setError] = useState('')
  const submit = event => {
    event.preventDefault()
    try {
      const record = registerSpecialRecord(row)
      const id = createTask({ name:`补充${row.name}`, enterpriseId:row.enterpriseId, type:'资料补充', recordId:record.id, period:record.period, scope, requirement, deadline, specialMaterialId:row.id })
      onCreated(id)
    } catch (problem) { setError(problem.message) }
  }
  return <Modal open title="发起补充任务" onClose={onClose}><form onSubmit={submit}><div className="modal-body pzs-task-form">{error && <p role="alert">{error}</p>}<div className="pzs-task-linked">关联资料：{row.name} · {enterpriseName(row.enterpriseId)} · {row.period}</div><label>填报口径<textarea required value={scope} onChange={event => setScope(event.target.value)}/></label><label>材料要求<textarea required value={requirement} onChange={event => setRequirement(event.target.value)}/></label><label>截止时间<input type="datetime-local" required value={deadline} onChange={event => setDeadline(event.target.value)}/></label></div><div className="modal-foot"><button type="button" className="btn" onClick={onClose}>取消</button><button className="btn primary">发起任务</button></div></form></Modal>
}

function ParkEntryForm({ onClose, onSave }) {
  const [form, setForm] = useState({ theme:'resource', name:'', enterpriseId:enterprises[0].id, period:'2026年度', scope:'', value:'', unit:'', evidence:'' })
  const change = (key, value) => setForm(previous => ({...previous,[key]:value}))
  return <Modal open title="园区录入专项资料" onClose={onClose}><form onSubmit={event => { event.preventDefault(); onSave(form) }}><div className="modal-body pzs-entry-form"><label>所属专项<select value={form.theme} onChange={event => change('theme',event.target.value)}>{themes.map(theme => <option value={theme.id} key={theme.id}>{theme.name}</option>)}</select></label><label>资料名称<input required value={form.name} onChange={event => change('name',event.target.value)}/></label><label>涉及主体<select value={form.enterpriseId} onChange={event => change('enterpriseId',event.target.value)}>{enterprises.map(enterprise => <option value={enterprise.id} key={enterprise.id}>{enterprise.name}</option>)}</select></label><label>期间<input required value={form.period} onChange={event => change('period',event.target.value)}/></label><label className="wide">统计口径<input required value={form.scope} onChange={event => change('scope',event.target.value)}/></label><label>数值<input type="number" min="0" step="any" required value={form.value} onChange={event => change('value',event.target.value)}/></label><label>单位<input required value={form.unit} onChange={event => change('unit',event.target.value)}/></label><label className="wide">凭证名称<input required value={form.evidence} onChange={event => change('evidence',event.target.value)}/></label></div><div className="modal-foot"><button type="button" className="btn" onClick={onClose}>取消</button><button className="btn primary">保存资料</button></div></form></Modal>
}

export function ParkZeroCarbonSpecialPage() {
  const navigate = useNavigate()
  const { tasks } = useCollaboration()
  const [materials, setMaterials] = useState(() => { try { return JSON.parse(localStorage.getItem('qujing-park-zero-carbon-special-v2')) || initialMaterials } catch { return initialMaterials } })
  const [theme, setTheme] = useState(null)
  const [specialFilter, setSpecialFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [showAll, setShowAll] = useState(false)
  const [allRecordsOpen, setAllRecordsOpen] = useState(false)
  const [detail, setDetail] = useState(null)
  const [taskRow, setTaskRow] = useState(null)
  const [taskId, setTaskId] = useState(null)
  const [entryOpen, setEntryOpen] = useState(false)
  const [evidence, setEvidence] = useState('')
  const [notice, setNotice] = useState('')
  const activeTask = tasks.find(task => task.id === taskId)
  const taskFor = row => tasks.find(task => task.specialMaterialId === row.id)
  const pending = materials.filter(isPending)
  const confirmCount = materials.filter(row => row.status === '待确认').length
  const missingCount = materials.filter(row => row.status === '待补充' || row.status === '已退回').length
  const soon = projects.filter(dueSoon)
  const filtered = (allRecordsOpen ? materials : pending).filter(row => (!specialFilter || row.theme === specialFilter) && (!statusFilter || (statusFilter === '待补充' ? ['待补充','已退回'].includes(row.status) : row.status === statusFilter)))
  const shown = showAll || specialFilter || statusFilter ? filtered : filtered.slice(0,4)
  const saveMaterials = next => { setMaterials(next); try { localStorage.setItem('qujing-park-zero-carbon-special-v2',JSON.stringify(next)) } catch { /* Mock remains usable in memory. */ } }
  const changeRow = (row, status, note) => {
    saveMaterials(materials.map(item => item.id === row.id ? { ...item, status, issue:status === '已确认' ? '' : note, history:[...item.history,{ action:status === '已确认' ? '园区确认资料' : '园区退回补充', note, time:timestamp() }] } : item))
    setDetail(null); setNotice(status === '已确认' ? '资料已确认，首页待办和专项数量已更新。' : '已退回补充，反馈和处理记录已保留。')
  }
  const openPending = status => { setTheme(null); setAllRecordsOpen(false); setStatusFilter(status); setSpecialFilter(''); setShowAll(true); requestAnimationFrame(() => document.getElementById('pzs-pending')?.scrollIntoView({behavior:'smooth',block:'start'})) }
  const openTask = row => { const existing = taskFor(row); if (existing) setTaskId(existing.id); else setTaskRow(row) }
  const addEntry = form => { const row = { ...form, id:`park-entry-${crypto.randomUUID()}`, value:String(form.value), source:'园区录入', status:'待确认', issue:'园区录入资料待核对', history:[{action:'园区录入',note:'录入专项资料及凭证名称。',time:timestamp()}] }; saveMaterials([row,...materials]); setEntryOpen(false); setShowAll(true); setNotice('专项资料已录入，等待核对确认。') }
  const detailRow = detail && materials.find(row => row.id === detail.id)
  const themeMaterials = materials.filter(row => row.theme === theme)
  const themeProjects = projects.filter(project => project.theme === theme)
  const themeResults = professionalResults.filter(result => result.theme === theme)
  return <div className="content pzs-page">
    <PageHeader title="园区零碳专项" subtitle="按专项归集资料与建设成果，补齐零碳评价所需依据。" actions={<button className="btn pzs-all-link" onClick={() => { setTheme(null); setAllRecordsOpen(true); setStatusFilter(''); setSpecialFilter(''); setShowAll(true); requestAnimationFrame(() => document.getElementById('pzs-pending')?.scrollIntoView({behavior:'smooth'})) }}>查看全部记录</button>}/>
    {notice && <div className="notice success">{notice}</div>}
    {theme ? <div className="pzs-theme-detail"><button className="op-btn" onClick={() => setTheme(null)}>← 返回专项首页</button><div className="pzs-theme-head"><span className="pzs-theme-icon">{themeFor(theme)?.icon}</span><div><h2>{themeFor(theme)?.name}</h2><p>{themeFor(theme)?.description}</p></div></div><div className="pzs-detail-columns"><section><h3>适用要求</h3><p>按园区实际适用范围及生效要求确定资料清单，以下为本页演示资料。</p><ul>{themeFor(theme)?.requirements.map(value => <li key={value}>{value}</li>)}</ul></section><section><h3>统计口径</h3><p>{themeFor(theme)?.scope}</p><h3>关联指标</h3><p>{themeFor(theme)?.indicators.join('、')}</p></section></div>{theme === 'other' && <div className="pzs-reference"><b>余热余压利用 · 已有关联</b><span>园区余热回收中心设施台账；园区能碳数据中余热回收 1,560 GJ。仅需补充专项统计口径及必要材料。</span><button className="op-btn" onClick={() => navigate('/energy-facilities')}>查看设施</button><button className="op-btn" onClick={() => navigate('/business-data')}>查看能碳数据</button></div>}<div className="pzs-detail-columns"><section><h3>数据资料</h3>{themeMaterials.map(row => <div className="pzs-detail-list" key={row.id}><span>{row.name}<small>{enterpriseName(row.enterpriseId)}</small></span><StatusTag tone={tone(row.status)}>{row.status}</StatusTag><button className="op-btn" onClick={() => setDetail(row)}>查看</button></div>)}</section><section><h3>建设事项</h3>{themeProjects.length ? themeProjects.map(project => <div className="pzs-detail-list" key={project.id}><span>{project.name}<small>最近阶段成果：{project.result}</small></span><StatusTag tone="warn">{project.status}</StatusTag></div>) : <p>当前暂无关联建设事项。</p>}<h3>引用成果</h3>{themeResults.length ? themeResults.map(result => <div className="pzs-professional" key={result.id}><b>{result.title}</b><p>专业结论：{result.conclusion}</p><p>出具主体：{result.issuer} · 适用范围：{result.scope}</p><p>有效期：{result.validUntil} · 依据材料：{result.basis}</p><small>资料确认与专业评价结论分别记录。</small></div>) : <p>当前暂无专业成果，已有业务记录优先引用。</p>}</section></div></div> : <>
      <div className="pzs-overview">{[[confirmCount,'资料待确认','企业已提交资料，需进行确认','▤','待确认'],[missingCount,'资料待补充','存在资料缺口，需发起补充','!','待补充'],[soon.length,'建设事项临近计划完成时间','请关注进展并及时推进','▦','project']].map(([count,label,desc,icon,target],index) => <button className={`pzs-overview-item pzs-overview-${index}`} key={label} onClick={() => target === 'project' ? document.getElementById('pzs-projects')?.scrollIntoView({behavior:'smooth',block:'start'}) : openPending(target)}><span className="pzs-overview-icon">{icon}</span><span className="pzs-overview-text"><b>{count}</b><strong>{label}</strong><small>{desc}</small></span><span className="pzs-chevron">›</span></button>)}</div>
      <div className="pzs-section-title"><h2>专项主题</h2><span>先查看专项要求，再归集数据、事项与成果</span></div><div className="pzs-theme-grid">{themes.map(item => { const related = materials.filter(row => row.theme === item.id); return <article className="pzs-theme-card" key={item.id}><div className="pzs-theme-main"><span className="pzs-theme-icon">{item.icon}</span><div><h3>{item.name}</h3><p>{item.description}</p></div></div><div className="pzs-theme-count"><span>{related.filter(row => row.status === '待确认').length} 份资料待确认</span><i/> <span>{related.filter(row => row.status === '待补充' || row.status === '已退回').length} 项待补充</span></div><ul>{item.requirements.map(value => <li key={value}><span aria-hidden="true">▤</span>{value}</li>)}</ul><button className="op-btn" onClick={() => setTheme(item.id)}>查看专项　→</button></article> })}</div>
      <div className="pzs-bottom-grid"><section className="pzs-panel" id="pzs-pending"><header><h2><span>▤</span> {allRecordsOpen ? '全部资料记录' : '待处理资料'}</h2><div><select aria-label="专项筛选" value={specialFilter} onChange={event => { setSpecialFilter(event.target.value); setShowAll(true) }}><option value="">全部专项</option>{themes.map(item => <option value={item.id} key={item.id}>{item.name}</option>)}</select><button className="btn primary" onClick={() => { const first = filtered.find(row => row.status === '待补充' || row.status === '已退回'); if (first) openTask(first); else setNotice('当前筛选范围内没有待补充资料。') }}>发起补充任务</button><button className="btn" onClick={() => setEntryOpen(true)}>园区录入</button></div></header>{statusFilter && <div className="pzs-filter-note">当前筛选：{statusFilter === '待补充' ? '待补充及已退回' : statusFilter}<button onClick={() => setStatusFilter('')}>清除</button></div>}<div className="pzs-table-wrap"><table><thead><tr>{['状态','资料名称','涉及主体','所属专项','待处理内容','操作'].map(value => <th key={value}>{value}</th>)}</tr></thead><tbody>{shown.map(row => <tr key={row.id}><td><StatusTag tone={tone(row.status)}>{row.status}</StatusTag></td><td>{row.name}</td><td>{enterpriseName(row.enterpriseId)}</td><td>{themeFor(row.theme)?.name}</td><td>{row.issue}</td><td>{row.status === '已确认' ? <button className="op-btn" onClick={() => setDetail(row)}>查看</button> : row.status === '待确认' ? <button className="op-btn" onClick={() => setDetail(row)}>查看并确认</button> : <button className="op-btn" onClick={() => openTask(row)}>{taskFor(row) ? '查看补充任务' : '发起补充'}</button>}</td></tr>)}</tbody></table>{!shown.length && <p className="pzs-empty">当前筛选下暂无待处理资料。</p>}</div>{!showAll && filtered.length > shown.length && <button className="pzs-more" onClick={() => setShowAll(true)}>查看全部 {filtered.length} 条待处理记录 →</button>}</section><section className="pzs-panel" id="pzs-projects"><header><h2><span>▣</span> 重点建设事项</h2><small>共 {projects.length} 项</small></header><div className="pzs-project-list">{projects.map(project => <div className={`pzs-project ${soon.some(item => item.id === project.id) ? 'due' : ''}`} key={project.id}>{project.image ? <img src={project.image} alt=""/> : <span className="pzs-project-icon">▤</span>}<div className="pzs-project-info"><b>{project.name}</b><small>{project.owner}</small><small>最近阶段成果：{project.result}</small></div><div className="pzs-project-end"><small>计划完成 {project.deadline}</small><StatusTag tone="warn">{project.status}</StatusTag></div></div>)}</div></section></div><p className="pzs-footnote">ⓘ 已有业务记录优先引用；园区资料确认与专业核查、认证结论分别记录。具体指标要求按园区实际适用情况确定。</p>
    </>}
    {detailRow && <MaterialDetails key={detailRow.id} row={detailRow} onClose={() => setDetail(null)} onConfirm={row => changeRow(row,'已确认','已核对资料口径、来源及凭证。')} onReturn={(row,feedback) => changeRow(row,'已退回',feedback)} onEvidence={setEvidence}/>}
    {taskRow && <TaskForm row={taskRow} onClose={() => setTaskRow(null)} onCreated={id => { setTaskRow(null); setTaskId(id); setNotice('补充任务已关联当前资料记录。') }} />}
    {activeTask && <TaskDrawer key={activeTask.id} task={activeTask} park onClose={() => setTaskId(null)}/>}
    {entryOpen && <ParkEntryForm onClose={() => setEntryOpen(false)} onSave={addEntry}/>}
    {evidence && <Modal open title="凭证查看" onClose={() => setEvidence('')} className="small"><div className="modal-body"><div className="pzs-evidence"><b>{evidence}</b><p>演示凭证：原始文件由对应业务记录管理。</p></div></div><div className="modal-foot"><button className="btn primary" onClick={() => setEvidence('')}>关闭</button></div></Modal>}
  </div>
}
