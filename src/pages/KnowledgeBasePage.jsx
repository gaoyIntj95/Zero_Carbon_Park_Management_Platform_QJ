import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { PageHeader } from '../components/PageHeader.jsx'
import { Modal } from '../components/Modal.jsx'
import { StatusTag } from '../components/StatusTag.jsx'
import { useSharedData } from '../mock/sharedStore.js'

const knowledgeStorageKey = 'qujing-zero-carbon-knowledge-v2'
const typeMeta = {
  all: { label:'全部文件', icon:'▦' },
  policy: { label:'政策法规', icon:'▣' },
  standard: { label:'标准规范', icon:'⌘' },
  case: { label:'实践案例', icon:'◆' },
}
const routeTab = { '/knowledge-policies':'policy', '/knowledge-standards':'standard', '/knowledge-cases':'case' }
const typeLabel = value => typeMeta[value]?.label || value
const statusTone = value => value === '现行' ? 'ok' : value === '待核实' ? 'warn' : 'gray'
const isCase = item => item.typeKey === 'case'
const emptyForm = { title:'', typeKey:'policy', level:'国家', topic:'园区建设与验收', source:'', fileNo:'', published:'', effective:'', status:'待核实', scope:'', summary:'', sourceUrl:'', associations:'', changeNote:'' }

const sharedSeed = [
  { id:'know-policy-001', title:'云南省绿色低碳相关政策汇编', typeKey:'policy', level:'云南省', topic:'能源与碳排放', source:'云南省相关部门', fileNo:'原型示例编号 YN-LC-001', published:'2026-06-18', effective:'2026-07-01', status:'现行', scope:'适用于云南省绿色低碳发展及园区能源转型相关工作。', summary:'汇总云南省绿色低碳发展、能源转型与碳排放管理相关政策。', updatedAt:'2026-10-09 14:20', associations:[['清洁能源消费比例','评价指标','目标要求','能源消费相关条款'],['园区绿电直接供应','验收材料要求','材料要求','绿电来源与凭证章节']] },
  { id:'know-policy-002', title:'零碳园区建设相关政策解读', typeKey:'policy', level:'园区', topic:'园区建设与验收', source:'园区管理机构', fileNo:'原型示例编号 PARK-ZC-002', published:'2026-07-02', effective:'2026-07-02', status:'待核实', scope:'面向本园区零碳建设路径、指标评价和验收准备的辅助解读。', summary:'结合园区建设场景解读零碳园区政策要求和常见实施路径。', updatedAt:'2026-10-08 11:10', associations:[['零碳建设总览','评价指标','目标要求','建设要求与评价章节'],['零碳验收支撑','验收材料要求','材料要求','验收准备附表']] },
  { id:'know-standard-001', title:'工业企业温室气体排放核算相关标准', typeKey:'standard', level:'国家', topic:'核算与因子', source:'国家标准', fileNo:'原型示例编号 STD-GHG-001', published:'2025-12-01', effective:'2026-01-01', status:'现行', scope:'适用于工业企业温室气体排放核算、报告和数据质量管理参考。', summary:'工业企业温室气体排放核算、报告与数据质量管理的标准参考。', updatedAt:'2026-10-07 16:45', associations:[['碳排放总量','核算规则','计算方法','排放核算边界与计算章节'],['能碳数据维护','验收材料要求','材料要求','数据质量与凭证附表']] },
  { id:'know-standard-002', title:'产品碳足迹核算通则', typeKey:'standard', level:'行业参考', topic:'核算与因子', source:'行业组织', fileNo:'原型示例编号 PCF-001', published:'2026-02-16', effective:'2026-03-01', status:'待核实', scope:'适用于产品碳足迹核算边界、数据采集和结果表达的参考。', summary:'产品碳足迹核算边界、数据采集和结果表达的通用参考。', updatedAt:'2026-10-06 10:25', associations:[['企业碳足迹服务','核算规则','计算方法','生命周期边界章节']] },
  { id:'know-case-001', title:'重点企业屋顶光伏建设实践', typeKey:'case', level:'—', topic:'光伏建设', source:'曲靖经开区', fileNo:'原型示例编号 CASE-PV-001', published:'2026-08-04', effective:'', status:'', scope:'应用参考：重点企业屋顶光伏建设方案、实施过程和验收材料组织。', summary:'重点企业屋顶光伏项目的建设方案、实施过程与验收材料组织方式。', updatedAt:'2026-10-05 09:40', associations:[['零碳路径推演 · 新增光伏容量','业务参考','应用参考','建设方案第2章；不作为政策依据'],['零碳验收支撑 · 光伏建设及投运证明','验收材料要求','材料要求','项目验收材料目录']] },
]

const extraSeed = [
  { id:'know-policy-003', title:'国家级零碳园区建设指引（试行）', typeKey:'policy', level:'国家', topic:'园区建设与验收', source:'国家发展改革委', fileNo:'原型示例编号 NDRC-ZC-001', published:'2025-06-18', effective:'2025-07-01', status:'待核实', scope:'适用于国家级零碳园区建设目标、重点任务、评价和验收准备参考。', summary:'明确国家级零碳园区建设目标、重点任务、评价要求和验收支撑方向。', updatedAt:'2026-10-03 15:00', associations:[['零碳指标体系 · 清洁能源消费比例','评价指标','目标要求','评价要求第3章'],['零碳验收支撑 · 建设方案及批复材料','验收材料要求','材料要求','验收准备附表']] },
  { id:'know-standard-003', title:'零碳园区评价技术规范', typeKey:'standard', level:'行业参考', topic:'评价与核算', source:'行业标准参考', fileNo:'原型示例编号 ZC-EVAL-001', published:'2026-03-12', effective:'', status:'待核实', scope:'提供零碳园区评价指标体系、数据边界与评价方法的参考规范。', summary:'提供零碳园区评价指标体系、数据边界与评价方法的参考规范。', updatedAt:'2026-10-02 13:30', associations:[['零碳指标体系','评价指标','目标要求','指标体系与评价方法章节'],['零碳指标影响分析','核算规则','计算方法','数据边界附表']] },
  { id:'know-case-002', title:'某国家级园区零碳建设实践', typeKey:'case', level:'—', topic:'园区建设与验收', source:'园区管理机构', fileNo:'原型示例编号 CASE-PARK-002', published:'2026-08-04', effective:'', status:'', scope:'应用参考：清洁能源、能效提升、碳排放管理和企业协同建设经验。', summary:'从清洁能源、能效提升、碳排放管理和企业协同等方面总结建设经验。', updatedAt:'2026-10-01 09:15', associations:[['零碳路径推演','业务参考','应用参考','案例第1—3章；不作为政策认定依据']] },
  { id:'know-case-003', title:'企业能效诊断服务案例', typeKey:'case', level:'—', topic:'企业服务', source:'园区管理机构', fileNo:'原型示例编号 CASE-EE-003', published:'2026-07-28', effective:'', status:'', scope:'应用参考：重点用能企业开展能效诊断、形成报告并推动节能改造。', summary:'重点用能企业开展能效诊断、形成诊断报告并推动节能改造的案例。', updatedAt:'2026-09-28 17:20', associations:[['零碳验收支撑 · 能效诊断报告','验收材料要求','材料要求','案例材料清单；不作为标准依据']] },
]

const seedRecords = [...sharedSeed, ...extraSeed].map(item => ({ ...item, sample:true, sourceUrl:'', version:'V1', versions:[{ version:'V1', date:item.updatedAt.slice(0,10), note:'原型示例纳管' }] }))
const faqPresets = ['国家级零碳园区评价指标有哪些？', '零碳园区验收需要准备哪些材料？', '清洁能源消费比例如何计算？', '案例内容能否直接作为政策依据？']
const answerPresets = {
  '国家级零碳园区评价指标有哪些？': { intro:'当前页面示例资料显示，零碳园区评价通常需要结合能源结构、碳排放、资源循环、绿色建筑和建设成果等方向进行核对。', sources:[['国家级零碳园区建设指引（试行）','评价要求第3章','know-policy-003'],['零碳园区评价技术规范','指标体系与评价方法章节','know-standard-003']] },
  '零碳园区验收需要准备哪些材料？': { intro:'当前页面示例资料将验收准备材料归纳为建设方案及批复、指标完成情况、能源与碳排放数据、项目证明和相关报告凭证。', sources:[['零碳园区建设相关政策解读','验收准备附表','know-policy-002'],['重点企业屋顶光伏建设实践','项目验收材料目录','know-case-001']] },
  '清洁能源消费比例如何计算？': { intro:'平台原型按园区电力消费量作为分母，先核对绿电、绿证及可再生能源来源，再结合适用期间汇总计算；具体口径仍需以正式规则原文为准。', sources:[['云南省绿色低碳相关政策汇编','能源消费相关条款','know-policy-001'],['零碳园区评价技术规范','数据边界附表','know-standard-003']] },
  '案例内容能否直接作为政策依据？': { intro:'不能。实践案例只作为应用参考，用于了解建设路径、材料组织和实施经验，不能替代政策法规、标准规范或正式核算规则。', sources:[['重点企业屋顶光伏建设实践','建设方案第2章','know-case-001'],['国家级零碳园区建设指引（试行）','评价要求第3章','know-policy-003']] },
}

function readRecords() {
  try {
    const saved = JSON.parse(window.localStorage.getItem(knowledgeStorageKey) || 'null')
    if (Array.isArray(saved) && saved.length) return saved
  } catch {}
  return seedRecords
}

function recordTypeTag(item) { return isCase(item) ? '应用参考' : typeLabel(item.typeKey) }
function sourceStatus(item) { return isCase(item) ? '应用参考' : (item.status || '待核实') }
function trimText(value, length=52) { const text=String(value||''); return text.length>length ? `${text.slice(0,length)}…` : text }
function associationText(value) { return String(value||'').split('\n').map(item=>item.trim()).filter(Boolean) }

export function KnowledgeBasePage() {
  const { role } = useSharedData()
  const location = useLocation()
  const navigate = useNavigate()
  const [records, setRecords] = useState(readRecords)
  const [tab, setTab] = useState(routeTab[location.pathname] || 'all')
  const [query, setQuery] = useState('')
  const [appliedQuery, setAppliedQuery] = useState('')
  const [level, setLevel] = useState('')
  const [topic, setTopic] = useState('')
  const [status, setStatus] = useState('')
  const [detail, setDetail] = useState(null)
  const [assistantOpen, setAssistantOpen] = useState(location.pathname === '/knowledge-assistant')
  const [assistantQuestion, setAssistantQuestion] = useState('')
  const [answer, setAnswer] = useState(null)
  const [maintenance, setMaintenance] = useState(null)
  const [notice, setNotice] = useState('')
  const canMaintain = role === 'admin'

  const levels = useMemo(() => [...new Set(records.filter(item=>!isCase(item)).map(item=>item.level).filter(Boolean))], [records])
  const topics = useMemo(() => [...new Set(records.map(item=>item.topic).filter(Boolean))], [records])
  const counts = useMemo(() => Object.keys(typeMeta).reduce((result,key) => ({ ...result, [key]: key==='all' ? records.length : records.filter(item=>item.typeKey===key).length }), {}), [records])
  const visible = useMemo(() => records.filter(item => {
    const keyword = appliedQuery.trim().toLowerCase()
    const matchesQuery = !keyword || `${item.title}${item.source}${item.summary}${item.topic}`.toLowerCase().includes(keyword)
    const matchesType = tab === 'all' || item.typeKey === tab
    const matchesLevel = !level || isCase(item) || item.level === level
    const matchesTopic = !topic || item.topic === topic
    const matchesStatus = !status || isCase(item) || item.status === status
    return matchesQuery && matchesType && matchesLevel && matchesTopic && matchesStatus
  }), [records, appliedQuery, tab, level, topic, status])
  const recent = useMemo(() => [...records].sort((a,b)=>String(b.updatedAt).localeCompare(String(a.updatedAt))).slice(0,3), [records])

  const saveRecords = next => {
    setRecords(next)
    try { window.localStorage.setItem(knowledgeStorageKey, JSON.stringify(next)); setNotice('知识条目已保存，关联业务对象未自动改变，请业务人员检查。') }
    catch { setNotice('浏览器存储失败，变更仅保留在当前页面，未确认跨刷新保存成功。') }
  }
  const applySearch = () => setAppliedQuery(query)
  const resetFilters = () => { setQuery(''); setAppliedQuery(''); setLevel(''); setTopic(''); setStatus(''); setTab('all') }
  const openAssistant = question => { setAssistantQuestion(question || query); setAnswer(null); setAssistantOpen(true) }
  const ask = value => {
    const text = (value ?? assistantQuestion).trim()
    if (!text) { setNotice('请输入要查询的问题。'); return }
    setAssistantQuestion(text)
    const preset = answerPresets[text]
    if (preset) setAnswer({ ...preset, example:true })
    else setAnswer({ intro:'当前知识库未找到足够依据，请尝试其他关键词或查看相关原文。', sources:[], insufficient:true, example:true })
  }
  const openSource = item => {
    if (item?.sourceUrl) window.open(item.sourceUrl, '_blank', 'noopener,noreferrer')
    else setNotice('该条目尚未录入真实原文链接；当前仅展示原型示例，不能作为正式来源。')
  }
  const openAssociation = association => {
    const path = association[0].includes('验收') ? '/zero-carbon-results' : association[0].includes('路径') ? '/zero-carbon-path-simulation' : association[0].includes('指标') ? '/zero-carbon-indicators' : ''
    if (path) navigate(path)
    else setNotice('该业务对象尚未接通跳转，仅展示关联说明。')
  }
  const startEdit = item => {
    if (!canMaintain) { setNotice('当前角色以查询为主；知识维护入口仅对平台管理员 Mock 角色展示。'); return }
    setMaintenance({ mode:item?'edit':'create', item, form:item ? { title:item.title, typeKey:item.typeKey, level:item.level, topic:item.topic, source:item.source, fileNo:item.fileNo, published:item.published, effective:item.effective, status:item.status || '待核实', scope:item.scope, summary:item.summary, sourceUrl:item.sourceUrl, associations:(item.associations||[]).map(row=>[row[0],row[2],row[3]].join('｜')).join('\n'), changeNote:'' } : { ...emptyForm } })
  }
  const saveMaintenance = form => {
    if (!form.title.trim() || !form.source.trim() || !form.summary.trim()) { setNotice('请至少填写名称、发布机构和摘要。'); return }
    const stamp = new Date().toLocaleString('zh-CN',{hour12:false})
    if (form.sourceUrl.trim()) { try { const url=new URL(form.sourceUrl.trim()); if (!['http:','https:'].includes(url.protocol)) throw new Error('protocol'); } catch { setNotice('原文链接格式无效，请填写完整的 http 或 https 地址。'); return } }
    const associations = associationText(form.associations).map(row=>{const parts=row.split('｜');return [parts[0]||'待补充业务对象','业务关联',parts[1]||'待补充用途',parts[2]||'待补充依据位置']})
    if (maintenance.mode === 'edit') {
      const old = maintenance.item
      const versionNumber = Number(String(old.version||'V1').replace('V','')) + 1
      const versions = [{version:`V${versionNumber}`,date:stamp.slice(0,10),note:form.changeNote.trim()||'条目更新'},...(old.versions||[{version:old.version||'V1',date:old.updatedAt?.slice(0,10)||'',note:'历史版本内容保留'}])]
      const next = records.map(item => item.id===old.id ? { ...item, ...form, associations:associations.length?associations:item.associations, version:`V${versionNumber}`, versions, updatedAt:stamp, sample:true } : item)
      saveRecords(next)
    } else {
      const item = { ...form, id:`know-custom-${Date.now()}`, typeKey:form.typeKey, associations, version:'V1', versions:[{version:'V1',date:stamp.slice(0,10),note:form.changeNote||'新增原型示例'}], updatedAt:stamp, sample:true, sourceUrl:form.sourceUrl.trim() }
      saveRecords([item,...records])
    }
    setMaintenance(null)
  }

  const selectTab = key => { setTab(key); if (key==='policy') navigate('/knowledge-policies'); else if (key==='standard') navigate('/knowledge-standards'); else if (key==='case') navigate('/knowledge-cases'); else if (location.pathname!=='/knowledge') navigate('/knowledge') }
  return <div className="content knowledge-page-v2">
    <PageHeader title="零碳政策与知识" subtitle="查询政策、标准与案例，核对园区零碳建设依据。" actions={<button className="btn knowledge-maintain" onClick={()=>startEdit(null)}>⚙ 知识维护</button>} />
    {notice && <div className="notice success knowledge-notice">{notice}<button className="link-btn" onClick={()=>setNotice('')}>关闭</button></div>}
    <section className="knowledge-query-panel knowledge-search-hero"><div className="knowledge-search-kicker">知识搜索</div><h2>查政策、找标准、看案例</h2>
      <div className="knowledge-query-line"><span className="knowledge-search-icon">⌕</span><input value={query} onChange={event=>setQuery(event.target.value)} onKeyDown={event=>event.key==='Enter'&&applySearch()} placeholder="搜索文件名称、关键词或发布机构"/><button className="btn primary" onClick={applySearch}>查询</button><button className="btn knowledge-assistant-btn" onClick={()=>openAssistant(query)}>询问知识助手</button></div>
      <div className="knowledge-filter-line"><select value={level} onChange={event=>setLevel(event.target.value)}><option value="">政策层级</option>{levels.map(item=><option key={item}>{item}</option>)}</select><select value={topic} onChange={event=>setTopic(event.target.value)}><option value="">业务主题</option>{topics.map(item=><option key={item}>{item}</option>)}</select><select value={status} onChange={event=>setStatus(event.target.value)}><option value="">有效状态</option><option value="现行">现行</option><option value="已替代">已替代</option><option value="待核实">待核实</option></select><button className="btn" onClick={resetFilters}>重置</button></div><p className="knowledge-search-tip">支持关键词检索，也可通过知识助手查找相关资料。</p>
    </section>
    <section className="knowledge-category-cards">{[['policy','▧','政策法规','建设政策与评价要求'],['standard','▱','标准规范','核算方法与技术规范'],['case','◇','实践案例','建设经验与应用参考']].map(([key,icon,title,description])=><button key={key} onClick={()=>selectTab(key)}><span className="knowledge-category-icon">{icon}</span><span><b>{title}</b><small>{description}</small></span><em>浏览资料　→</em></button>)}</section>
    <section className="knowledge-faq-section"><div className="knowledge-section-title"><h2>常见问题</h2><p>从零碳园区评价、验收、核算和企业服务等方面，快速获取解答。</p></div><div className="knowledge-faq-cards">{faqPresets.slice(0,3).map(item=><button key={item} onClick={()=>openAssistant(item)}>{item}<b>→</b></button>)}</div></section>
    <section className="knowledge-recommend-section"><div className="knowledge-recommend-head"><div className="knowledge-section-title"><h2>推荐资料 <small>按业务主题快速浏览</small></h2></div><div className="knowledge-card-tabs">{[['all','全部'],['policy','政策'],['standard','标准'],['case','案例']].map(([key,label])=><button key={key} className={tab===key?'active':''} onClick={()=>selectTab(key)}>{label}</button>)}<button className="knowledge-all-link" onClick={()=>selectTab('all')}>查看全部　→</button></div></div><div className="knowledge-card-grid">{visible.slice(0,6).map(item=><article key={item.id} className={`knowledge-doc-card ${item.typeKey}`}><div className="knowledge-doc-top"><span>{recordTypeTag(item)}</span><em>{isCase(item)?'应用参考':'示例资料'}</em></div><h3>{item.title}</h3><p className="knowledge-doc-source">{item.sourceUrl?'已录入原文来源':'来源信息待录入'}</p><p>{trimText(item.summary,48)}</p><footer><span>主题：{item.topic}</span><div><button onClick={()=>setDetail(item)}>▱ 查看详情</button><i/> <button onClick={()=>openSource(item)}>⌕ {isCase(item)?'查看资料':'查看原文'}</button></div></footer></article>)}</div>{!visible.length&&<div className="knowledge-empty">未找到匹配资料，请调整关键词或筛选条件。</div>}<div className="knowledge-prototype-tip">ⓘ　示例内容仅用于原型展示；正式文件以原文及维护信息为准。</div></section>
    <Modal open={!!detail} title="文件详情" onClose={()=>setDetail(null)} className="knowledge-detail-v2"><div className="modal-body">{detail&&<><div className="knowledge-detail-title"><h2>{detail.title}</h2>{detail.sample&&<span>原型示例</span>}{isCase(detail)&&<StatusTag tone="gray">应用参考</StatusTag>}</div><div className="knowledge-detail-grid"><div><label>内容类型</label><b>{typeLabel(detail.typeKey)}</b></div><div><label>发布机构</label><b>{detail.source}</b></div><div><label>文件编号</label><b>{detail.fileNo||'未录入'}</b></div><div><label>发布日期</label><b>{detail.published||'—'}</b></div><div><label>实施日期</label><b>{isCase(detail)?'不适用':detail.effective||'未录入'}</b></div><div><label>有效状态</label><b>{isCase(detail)?'不适用：应用参考':detail.status||'待核实'}</b></div></div><div className="knowledge-detail-block"><label>适用范围</label><p>{detail.scope}</p></div><div className="knowledge-detail-block"><label>内容摘要</label><p>{detail.summary}</p></div><div className="knowledge-detail-source"><span>原文来源</span><b>{detail.sourceUrl||'未录入真实原文链接，当前为原型示例'}</b><button className="op-btn" onClick={()=>openSource(detail)}>查看原文</button></div><details className="knowledge-detail-fold"><summary>关联业务</summary><div className="knowledge-association-list">{(detail.associations||[]).length ? detail.associations.map((row,index)=><div key={`${row[0]}-${index}`}><div><b>{row[0]}</b><small>{row[1]} · 用途：{row[2]} · 依据位置：{row[3]}</small></div><button className="op-btn" onClick={()=>openAssociation(row)}>查看业务</button></div>) : <span>暂无明确业务关联。</span>}</div></details><details className="knowledge-detail-fold"><summary>版本与变更</summary><div className="knowledge-version-list">{(detail.versions||[]).map(item=><div key={`${item.version}-${item.date}`}><b>{item.version}</b><span>{item.date} · {item.note}</span></div>)}<p>平台更新时间：{detail.updatedAt}。文件更新仅提示业务人员检查关联，不自动修改指标目标、核算公式、验收材料要求或历史结果。</p></div></details></>}</div><div className="modal-foot"><button className="btn" onClick={()=>setDetail(null)}>关闭</button>{canMaintain&&detail&&<button className="btn primary" onClick={()=>{setDetail(null);startEdit(detail)}}>编辑条目</button>}</div></Modal>
    <Modal open={assistantOpen} title="知识助手" onClose={()=>setAssistantOpen(false)} className="knowledge-assistant-v2"><div className="modal-body"><div className="assistant-demo-note">原型示例回答：仅基于当前页面纳管的示例条目整理，不自动认定政策适用性，也不修改指标或核算配置。</div><div className="assistant-question-line"><input value={assistantQuestion} onChange={event=>setAssistantQuestion(event.target.value)} onKeyDown={event=>event.key==='Enter'&&ask()} placeholder="请输入政策、标准、指标或验收准备问题"/><button className="btn primary" onClick={()=>ask()}>查询回答</button></div><div className="assistant-faq-row">{faqPresets.slice(0,3).map(item=><button key={item} onClick={()=>{setAssistantQuestion(item);ask(item)}}>{item}</button>)}</div>{answer&&<div className="assistant-answer-v2"><div className="assistant-answer-label">回答内容</div><p>{answer.intro}</p>{answer.insufficient&&<div className="assistant-insufficient">当前知识库未找到足够依据，请尝试其他关键词或查看相关原文。</div>}<div className="assistant-source-title">来源文件与依据位置</div>{answer.sources.length ? answer.sources.map(([name,position,id])=>{const sourceRecord=records.find(record=>record.id===id);return <div className="assistant-source-row" key={`${name}-${position}`}><div><b>{name}</b><span>{isCase(sourceRecord||{})?'实践案例参考':`${typeLabel(sourceRecord?.typeKey)||'文件'}依据`} · 依据位置：{position}{id&&' · 来源条目为原型示例'}</span></div><button className="op-btn" onClick={()=>{const item=records.find(record=>record.id===id);if(item){setAssistantOpen(false);setDetail(item)}}}>查看详情</button></div>}) : <div className="knowledge-empty compact">暂无可引用来源，请查看文件列表中的原文状态。</div>}</div>}</div><div className="modal-foot"><button className="btn" onClick={()=>setAssistantOpen(false)}>关闭</button></div></Modal>
    <MaintenanceModal state={maintenance} onClose={()=>setMaintenance(null)} onSave={saveMaintenance}/>
  </div>
}

function MaintenanceModal({ state, onClose, onSave }) {
  const [form, setForm] = useState(state?.form || emptyForm)
  useEffect(() => { setForm(state?.form || emptyForm) }, [state])
  if (!state) return null
  const update = (key,value) => setForm(current=>({ ...current, [key]:value }))
  const isCaseType = form.typeKey === 'case'
  return <Modal open title={state.mode==='edit'?'编辑知识条目':'新增知识条目'} onClose={onClose} className="knowledge-maintenance-v2"><div className="modal-body"><div className="maintenance-demo-note">当前为平台管理员 Mock 维护入口；保存后只更新知识目录和版本记录，不改变指标、核算、验收或历史结果。</div><div className="maintenance-grid"><label>文件名称<input value={form.title} onChange={event=>update('title',event.target.value)} /></label><label>内容类型<select value={form.typeKey} onChange={event=>update('typeKey',event.target.value)}><option value="policy">政策法规</option><option value="standard">标准规范</option><option value="case">实践案例</option></select></label><label>发布机构<input value={form.source} onChange={event=>update('source',event.target.value)} /></label><label>政策层级<select value={form.level} onChange={event=>update('level',event.target.value)} disabled={isCaseType}><option>国家</option><option>云南省</option><option>园区</option><option>行业参考</option><option>—</option></select></label><label>业务主题<input value={form.topic} onChange={event=>update('topic',event.target.value)} /></label><label>文件编号<input value={form.fileNo} onChange={event=>update('fileNo',event.target.value)} /></label><label>发布日期<input type="date" value={form.published} onChange={event=>update('published',event.target.value)} /></label><label>实施日期<input type="date" value={isCaseType?'':form.effective} disabled={isCaseType} onChange={event=>update('effective',event.target.value)} /></label><label>有效状态<select value={isCaseType?'':form.status} disabled={isCaseType} onChange={event=>update('status',event.target.value)}><option value="现行">现行</option><option value="已替代">已替代</option><option value="待核实">待核实</option></select></label></div><label className="maintenance-full">适用范围<textarea value={form.scope} onChange={event=>update('scope',event.target.value)} /></label><label className="maintenance-full">摘要<textarea value={form.summary} onChange={event=>update('summary',event.target.value)} /></label><label className="maintenance-full">原文链接（可留空）<input value={form.sourceUrl} onChange={event=>update('sourceUrl',event.target.value)} placeholder="https://..." /></label><label className="maintenance-full">业务关联（每行：对象｜用途｜依据位置）<textarea value={form.associations} onChange={event=>update('associations',event.target.value)} placeholder="零碳指标体系｜目标要求｜第3章" /></label><label className="maintenance-full">变更说明<textarea value={form.changeNote} onChange={event=>update('changeNote',event.target.value)} placeholder="说明新增、修订、替代或废止关系" /></label></div><div className="modal-foot"><button className="btn" onClick={onClose}>取消</button><button className="btn primary" onClick={()=>onSave(form)}>保存条目</button></div></Modal>
}
