import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSearchParams } from 'react-router-dom'
import { PageHeader } from '../components/PageHeader.jsx'
import { MetricStrip } from '../components/MetricStrip.jsx'
import { DataPanel } from '../components/DataPanel.jsx'
import { StatusTag } from '../components/StatusTag.jsx'
import { Modal } from '../components/Modal.jsx'
import { enterprises, reportingItemTemplates, useSharedData } from '../mock/sharedStore.js'
import { useDataManagement } from '../mock/DataManagementContext.jsx'
import { dataItemDefinitions } from '../mock/dataManagementStore.js'

const scopeDomains = { '企业档案':['archive'], '能源与设施':['energy'], '能碳与运营数据':['operation'], '零碳专项数据':['special'] }
function ScopeTaskCell({ task, scope, taskItems, campaign }) {
  if (!campaign?.dataScopes?.includes(scope)) return <StatusTag tone="gray">未纳入</StatusTag>
  const items = taskItems.filter(item => item.taskId === task.taskId).map(item => ({ ...item, template:reportingItemTemplates.find(template => template.templateId === item.templateId) })).filter(item => scopeDomains[scope].includes(item.template?.dataDomain))
  if (!items.length) return <StatusTag tone="gray">无数据项</StatusTag>
  const pending = items.some(item => !item.value || (item.template.voucherRequired && !item.voucherUploaded))
  return <StatusTag tone={pending ? 'warn' : 'ok'}>{pending ? '待填' : '已填'}</StatusTag>
}
function scopeTaskEntry(entries, scope) { return entries.filter(({ campaign }) => campaign.dataScopes?.includes(scope)).sort((a, b) => Number(b.campaign.status === '已发布') - Number(a.campaign.status === '已发布'))[0] }
const dataScopes = ['企业档案', '能源与设施', '能碳与运营数据', '零碳专项数据']
const enterpriseName = id => enterprises.find(item => item.id === id)?.name || '—'
const yearOf = period => String(period || '').match(/\d{4}/)?.[0] || '2026'
const tone = status => ['已提交', '已入库', '已发布'].includes(status) ? 'ok' : ['未开始', '草稿', '已关闭'].includes(status) ? 'gray' : 'warn'
const taskStatus = status => status === '已退回' ? '需修改' : status === '已入库' ? '已完成' : status

function ScopeList({ scopes = [] }) { return <span className="table-subnote">{scopes.length ? scopes.join('、') : '—'}</span> }
function groupedCompletion(entries, taskItems) {
  const unique = new Map()
  entries.forEach(({ task }) => task && taskItems.filter(item => item.taskId === task.taskId).forEach(item => { const template = reportingItemTemplates.find(entry => entry.templateId === item.templateId); const isComplete = item.value && (!template?.voucherRequired || item.voucherUploaded); const previous = unique.get(item.templateId); const wasComplete = previous?.value && (!reportingItemTemplates.find(entry => entry.templateId === previous.templateId)?.voucherRequired || previous.voucherUploaded); if (!previous || (isComplete && !wasComplete)) unique.set(item.templateId, item) }))
  const own = [...unique.values()]
  return { done:own.filter(item => item.value && (!reportingItemTemplates.find(template => template.templateId === item.templateId)?.voucherRequired || item.voucherUploaded)).length, total:own.length }
}
function statusPriority(status) { return ({ '已提交':0, '已退回':1, '填报中':2, '未开始':3, '已入库':4 })[status] ?? 5 }
function enterpriseTaskEntries(campaigns, tasks) {
  const groups = new Map()
  campaigns.forEach(campaign => campaign.enterpriseIds.forEach(enterpriseId => {
    if (!groups.has(enterpriseId)) groups.set(enterpriseId, [])
    groups.get(enterpriseId).push({ campaign, task:tasks.find(item => item.campaignId === campaign.campaignId && item.enterpriseId === enterpriseId) })
  }))
  return [...groups].map(([enterpriseId, entries]) => ({ enterpriseId, entries:entries.sort((a, b) => Number(b.campaign.status === '已发布') - Number(a.campaign.status === '已发布') || statusPriority(a.task?.status) - statusPriority(b.task?.status)) }))
}
const scopeByDomain = { archive:'企业档案', energy:'能源与设施', operation:'能碳与运营数据', carbon:'能碳与运营数据', special:'零碳专项数据' }
const templateCodeMap = { 'tpl-electricity':'ENERGY_ELECTRICITY', 'tpl-green-power':'ENERGY_GREEN_POWER', 'tpl-gas':'ENERGY_NATURAL_GAS', 'tpl-heat':'ENERGY_HEAT', 'tpl-total-energy':'ENERGY_TOTAL', 'tpl-output':'OP_PRODUCT_OUTPUT', 'tpl-industrial-value':'OP_INDUSTRIAL_VALUE', 'tpl-scope1':'CARBON_SCOPE1', 'tpl-scope2':'CARBON_SCOPE2', 'tpl-product-footprint':'SPECIAL_PCF_CERTIFIED_PRODUCTS', 'tpl-energy-diagnosis':'SPECIAL_ENERGY_DIAGNOSIS_COMPLETED' }
function taskDetailItems(task, campaign, taskItems, records) {
  const own = taskItems.filter(item => item.taskId === task.taskId).map(item => ({ ...item, template:reportingItemTemplates.find(template => template.templateId === item.templateId) }))
  const scopes = new Set((campaign?.dataScopes || []).filter(scope => dataScopes.includes(scope)))
  if (!scopes.size) own.forEach(item => { if (item.template) scopes.add(scopeByDomain[item.template.dataDomain]) })
  const latestRecord = code => records.filter(record => record.enterpriseId === task.enterpriseId && record.dataItemCode === code && String(record.period || '').startsWith(yearOf(task.period || campaign?.period))).sort((a, b) => String(a.period).localeCompare(String(b.period))).at(-1)
  const archiveItems = reportingItemTemplates.filter(template => template.dataDomain === 'archive' && scopes.has('企业档案')).map(template => {
    const item = own.find(entry => entry.templateId === template.templateId)
    return { key:template.templateId, name:template.name, value:item?.value || '—', unit:template.unit || '—', voucher:'不要求', status:item?.value ? '已完成' : '待补充' }
  })
  const managedItems = dataItemDefinitions.filter(definition => scopes.has(scopeByDomain[definition.dataDomain])).map(definition => {
    const item = own.find(entry => templateCodeMap[entry.templateId] === definition.dataItemCode)
    const record = latestRecord(definition.dataItemCode)
    const value = item?.value || record?.value || '—'
    const voucherReady = item ? (!item.template?.voucherRequired || item.voucherUploaded) : Boolean(record?.evidence && record.evidence !== '—')
    return { key:definition.dataItemCode, name:definition.name, value, unit:definition.unit || '—', voucher:item?.template?.voucherRequired ? (item.voucherUploaded ? '已上传' : '待上传') : record?.evidence && record.evidence !== '—' ? '已归集' : '不要求', status:value !== '—' && voucherReady ? '已完成' : '待补充' }
  })
  return [...archiveItems, ...managedItems]
}

export function ReportingTaskMonitoringPage({ embedded = false }) {
  const navigate = useNavigate()
  const { role, currentEnterpriseId, campaigns, tasks, taskItems, createCampaign, createIssueTask, publishCampaign, closeCampaign, reviewTask, remindTask } = useSharedData()
  const { issues, records } = useDataManagement()
  const [searchParams] = useSearchParams()
  const [year, setYear] = useState('2026'), [detail, setDetail] = useState(null), [createOpen, setCreateOpen] = useState(false), [message, setMessage] = useState('')
  const issue = issues.find(item => item.issueId === searchParams.get('issueId'))
  useEffect(() => { if (issue) setCreateOpen(true) }, [issue])
  const campaignById = useMemo(() => Object.fromEntries(campaigns.map(item => [item.campaignId, item])), [campaigns])
  useEffect(() => { const taskId=searchParams.get('taskId'), task=tasks.find(item=>item.taskId===taskId); if(task)setDetail({type:'task',campaign:campaignById[task.campaignId],...task}) }, [searchParams,tasks,campaignById])
  const visibleCampaigns = campaigns.filter(item => yearOf(item.period) === year)
  const visibleTasks = tasks.filter(task => yearOf(campaignById[task.campaignId]?.period || task.period) === year && (role !== 'enterprise' || task.enterpriseId === currentEnterpriseId))
  const activeTasks = visibleTasks.filter(task => task.status !== '已关闭')
  const gaps = useMemo(() => reportingItemTemplates.map(template => ({ ...template, companies:activeTasks.filter(task => taskItems.some(item => item.taskId === task.taskId && item.templateId === template.templateId && (!item.value || (template.voucherRequired && !item.voucherUploaded)))).map(task => enterpriseName(task.enterpriseId)) })).filter(item => item.companies.length), [activeTasks, taskItems])
  if (role === 'enterprise') return <EnterpriseTaskRedirect navigate={navigate} />
  const create = event => { event.preventDefault(); const form = new FormData(event.currentTarget); if (issue) { createIssueTask(issue, { deadline:form.get('deadline'), description:form.get('description') }); setCreateOpen(false); setMessage('已创建问题关联填报任务，数据总览中的操作已切换为查看任务。'); return } createCampaign({ name:form.get('name'), type:form.get('type'), purpose:form.get('description') || '定期填报', period:`${form.get('year')}年度`, deadline:form.get('deadline'), enterpriseIds:form.getAll('enterpriseIds'), dataScopes:form.getAll('dataScopes') }); setCreateOpen(false); setMessage('填报任务批次草稿已创建，可在任务台账中查看并发布。') }
  const publish = campaignId => { publishCampaign(campaignId); setDetail(null); setMessage('任务已发布，适用企业的待填内容已生成。') }
  const close = campaignId => { closeCampaign(campaignId); setDetail(null); setMessage('任务已关闭。') }
  const remind = task => { remindTask(task.taskId); setMessage(`已记录对${enterpriseName(task.enterpriseId)}的提醒。`) }
  const review = (task, action) => { reviewTask(task.taskId, action, action === 'return' ? '请补充或核对本次填报数据及凭证。' : '审核通过，数据已确认入库。'); setDetail(null); setMessage(action === 'return' ? '已退回企业修改。' : '已确认通过并入库。') }
  return <div className={embedded ? 'reporting-task-embedded' : 'content'}>{!embedded && <PageHeader title="零碳数据填报管理" subtitle="在同一任务台账中完成任务创建、企业填报跟踪和提交审核；审核通过后更新正式数据。" actions={<button className="btn primary" onClick={() => setCreateOpen(true)}>新建填报任务</button>} />}{message && <div className="notice success">{message}</div>}<div className="filters"><span className="label">年度</span><select value={year} onChange={event => setYear(event.target.value)}><option value="2026">2026</option><option value="2025">2025</option></select><span className="filter-spacer"/><button className="btn" onClick={() => setDetail({ type:'gaps', gaps })}>查看数据缺口</button>{embedded && <button className="btn primary" onClick={() => setCreateOpen(true)}>新建填报任务</button>}</div>
    <UnifiedTaskLedger campaigns={visibleCampaigns} tasks={activeTasks} taskItems={taskItems} setDetail={setDetail} />
    <CreateTaskModal open={createOpen} issue={issue} onClose={() => setCreateOpen(false)} onSubmit={create} /><TaskDetail detail={detail} taskItems={taskItems} records={records} onClose={() => setDetail(null)} onReview={review} onRemind={remind} onPublish={publish} onCloseCampaign={close} onOpenTask={setDetail} />
  </div>
}

function UnifiedTaskLedger({ campaigns, tasks, taskItems, setDetail }) {
  const rows = enterpriseTaskEntries(campaigns, tasks)
  const pending = rows.filter(({ entries }) => entries.some(({ task, campaign }) => ['填报中', '未开始', '已退回'].includes(task?.status) || (!task && campaign.status === '已发布'))).length
  const submitted = rows.filter(({ entries }) => entries.some(({ task }) => task?.status === '已提交')).length
  const completed = rows.filter(({ entries }) => entries.some(({ task }) => task?.status === '已入库') && !entries.some(({ task }) => ['已提交', '已退回'].includes(task?.status))).length
  return <><MetricStrip metrics={[{ label:'年度填报企业', value:`${rows.length}家` }, { label:'待填报 / 需修改', value:`${pending}家` }, { label:'待审核', value:`${submitted}家` }, { label:'已审核入库', value:`${completed}家` }]} /><DataPanel title="企业填报任务台账" description="每家企业汇总展示年度填报范围、完成进度和审核结果；点击查看任务可处理该企业关联的各项任务。"><div className="table-wrap"><table className="enterprise-task-table task-ledger-table"><thead><tr><th>企业</th><th>任务类型</th>{dataScopes.map(scope => <th key={scope}>{scope}</th>)}<th>填报状态</th><th>完成情况</th><th>审核状态</th><th>最近更新</th><th>操作</th></tr></thead><tbody>{rows.map(({ enterpriseId, entries }) => { const primary = entries.find(entry => entry.task) || entries[0]; const { campaign, task } = primary; const statuses = entries.map(entry => entry.task?.status).filter(Boolean); const status = statuses.sort((a, b) => statusPriority(a) - statusPriority(b))[0] || campaign.status; const progress = groupedCompletion(entries, taskItems); const reviewLabel = statuses.includes('已提交') ? '待审核' : statuses.includes('已退回') ? '已退回' : statuses.includes('已入库') ? '已通过' : '—'; const taskLabels = [...new Set(entries.map(({ campaign: item }) => item.name.includes('零碳专项') ? '零碳专项' : item.name.includes('企业数据补充') ? '常规填报' : item.taskType || item.name))]; const updated = entries.map(entry => entry.task?.updated || entry.task?.reviewedAt).find(Boolean) || '—'; return <tr key={enterpriseId}><td className="item-name task-ledger-enterprise" title={enterpriseName(enterpriseId)}>{enterpriseName(enterpriseId)}</td><td className="task-ledger-kind" title={taskLabels.join('、')}>{taskLabels.join('、')}</td>{dataScopes.map(scope => { const entry = scopeTaskEntry(entries, scope); return <td key={scope}>{entry ? entry.task ? <ScopeTaskCell task={entry.task} scope={scope} taskItems={taskItems} campaign={entry.campaign}/> : <StatusTag tone="gray">待发布</StatusTag> : <StatusTag tone="gray">未纳入</StatusTag>}</td> })}<td><StatusTag tone={tone(status)}>{status === '已发布' ? '进行中' : taskStatus(status)}</StatusTag></td><td>{progress.total ? `已完成${progress.done}/${progress.total}项` : '—'}</td><td>{reviewLabel === '—' ? '—' : <StatusTag tone={tone(reviewLabel === '待审核' ? '已提交' : reviewLabel === '已通过' ? '已入库' : '已退回')}>{reviewLabel}</StatusTag>}</td><td>{updated}</td><td><div className="task-ledger-actions"><button className="op-btn" onClick={() => setDetail({ type:'enterpriseGroup', enterpriseId, entries })}>查看任务</button></div></td></tr> })}{!rows.length && <tr><td colSpan="11" className="empty-cell">当前年度暂无企业填报任务</td></tr>}</tbody></table></div></DataPanel></>
}

function EnterpriseTaskRedirect({ navigate }) { return <div className="content enterprise-content"><PageHeader title="填报任务" subtitle="企业围绕园区任务补充缺失数据和凭证。" actions={<button className="btn primary" onClick={() => navigate('/enterprise-data-reporting')}>进入填报任务</button>} /><div className="info-callout">当前企业请进入填报任务工作台，只补充系统暂未获取的数据和凭证。</div></div> }
function CreateTaskModal({ open, onClose, onSubmit, issue }) { return <Modal open={open} title={issue ? '发起数据补充任务' : '新建填报任务'} onClose={onClose} className="detail-modal"><form onSubmit={onSubmit}><div className="modal-body"><div className="kv"><div className="field"><label>任务名称</label><input name="name" defaultValue={issue ? `${enterpriseName(issue.enterpriseId)}${issue.period || ''}数据补充任务` : '企业数据填报任务'} readOnly={!!issue} required /></div><div className="field"><label>任务类型</label>{issue ? <input value="数据补充" readOnly /> : <select name="type" defaultValue="定期填报"><option>定期填报</option><option>数据补充</option><option>数据修正</option><option>专项填报</option></select>}</div><div className="field"><label>截止日期</label><input name="deadline" type="date" defaultValue={issue ? '2026-09-15' : '2026-12-31'} required /></div><div className="field"><label>任务说明</label><input name="description" placeholder="补充任务说明" /></div></div>{issue ? <div className="info-callout">企业：{enterpriseName(issue.enterpriseId)}；期间：{issue.period}；数据项：{issue.dataItemCode}；来源问题：{issue.issueId}；影响指标：{(issue.relatedIndicator || []).join('、') || '—'}</div> : <><div className="section"><h3>填报企业</h3><div className="check-grid">{enterprises.map(item => <label key={item.id}><input name="enterpriseIds" type="checkbox" value={item.id} defaultChecked /> {item.name}</label>)}</div></div><div className="section"><h3>填报数据范围</h3><div className="check-grid">{dataScopes.map(scope => <label key={scope}><input name="dataScopes" type="checkbox" value={scope} defaultChecked /> {scope}</label>)}</div></div></>}<div className="info-callout">创建后可在任务台账中统一查看填报进度和审核状态。</div></div><div className="modal-foot"><button type="button" className="btn" onClick={onClose}>取消</button><button className="btn primary">创建任务</button></div></form></Modal> }
function TaskDetail({ detail, taskItems, records, onClose, onReview, onRemind, onPublish, onCloseCampaign, onOpenTask }) {
  if (!detail) return <Modal open={false} onClose={onClose} />
  if (detail.type === 'gaps') return <Modal open title="数据缺口" onClose={onClose} className="small"><div className="modal-body"><div className="table-wrap"><table><thead><tr><th>数据项</th><th>待处理企业</th></tr></thead><tbody>{detail.gaps.map(item => <tr key={item.templateId}><td className="item-name">{item.name}</td><td>{item.companies.join('、')}</td></tr>)}</tbody></table></div></div></Modal>
  if (detail.type === 'enterpriseGroup') return <Modal open title={`${enterpriseName(detail.enterpriseId)}｜年度填报任务`} onClose={onClose} className="detail-modal"><div className="modal-body"><div className="table-wrap"><table><thead><tr><th>任务名称</th><th>任务状态</th><th>填报范围</th><th>截止日期</th><th>操作</th></tr></thead><tbody>{detail.entries.map(({ campaign, task }) => <tr key={campaign.campaignId}><td>{campaign.name}</td><td>{task ? taskStatus(task.status) : campaign.status === '已发布' ? '进行中' : campaign.status}</td><td><ScopeList scopes={campaign.dataScopes}/></td><td>{campaign.deadline || task?.deadline || '—'}</td><td><button className="op-btn" onClick={() => onOpenTask(task ? { type:'review', campaign, ...task } : { type:'campaign', ...campaign })}>{task?.status === '已提交' ? '审核' : '查看'}</button></td></tr>)}</tbody></table></div></div><div className="modal-foot"><button className="btn" onClick={onClose}>关闭</button></div></Modal>
  const isCampaign = detail.type === 'campaign'
  const isReviewing = !isCampaign && detail.status === '已提交'
  const canRemind = !isCampaign && !['已提交', '已入库', '已关闭'].includes(detail.status)
  const detailItems = isCampaign ? [] : taskDetailItems(detail, detail.campaign, taskItems, records)
  return <Modal open title={isCampaign ? detail.name : `${enterpriseName(detail.enterpriseId)}｜填报审核`} onClose={onClose} className="detail-modal"><div className="modal-body">{isCampaign ? <><div className="kv"><div className="kv-item"><label>年度</label>{yearOf(detail.period)}</div><div className="kv-item"><label>任务类型</label>{detail.taskType || detail.type || '常规填报'}</div><div className="kv-item"><label>任务状态</label>{detail.status === '已发布' ? '进行中' : detail.status}</div><div className="kv-item"><label>填报企业</label>{detail.enterpriseIds?.map(enterpriseName).join('、')}</div><div className="kv-item"><label>截止日期</label>{detail.deadline}</div></div><div className="section"><h3>填报数据范围</h3><ScopeList scopes={detail.dataScopes}/></div></> : <><div className="kv"><div className="kv-item"><label>年度任务</label>{yearOf(detail.campaign?.period || detail.period)} · {detail.campaign?.name || '—'}</div><div className="kv-item"><label>任务类型</label>{detail.taskType || '常规填报'}</div><div className="kv-item"><label>当前状态</label>{taskStatus(detail.status)}</div><div className="kv-item"><label>数据对象 / 补录范围</label>{detail.dataObject || '全部适用数据项'}{detail.supplementRange ? ` · ${detail.supplementRange}` : ''}</div><div className="kv-item"><label>提交时间</label>{detail.submittedAt || '—'}</div><div className="kv-item"><label>审核时间 / 意见</label>{detail.reviewedAt || '—'} {detail.reviewNote ? `· ${detail.reviewNote}` : ''}</div></div><div className="section"><h3>本次填报数据项</h3><div className="table-wrap"><table><thead><tr><th>数据项</th><th>填报值</th><th>单位</th><th>凭证</th><th>完成状态</th></tr></thead><tbody>{detailItems.map(item => <tr key={item.key}><td>{item.name}</td><td>{item.value}</td><td>{item.unit}</td><td>{item.voucher}</td><td>{item.status}</td></tr>)}</tbody></table></div></div>{isReviewing && <div className="review-action-hint"><b>审核动作</b><span>请核对全部适用数据项和凭证；如有缺失或异常，可退回企业补充。</span></div>}</>}</div><div className={`modal-foot${isReviewing ? ' review-modal-foot' : ''}`}><button className="btn" onClick={onClose}>关闭</button>{isCampaign && detail.status === '草稿' && <button className="btn primary" onClick={() => onPublish(detail.campaignId)}>发布任务</button>}{isCampaign && detail.status === '已发布' && <button className="btn review-return" onClick={() => onCloseCampaign(detail.campaignId)}>关闭任务</button>}{canRemind && <button className="btn" onClick={() => onRemind(detail)}>提醒企业</button>}{isReviewing && <><button className="btn review-return" onClick={() => onReview(detail, 'return')}>退回补充</button><button className="btn primary" onClick={() => onReview(detail, 'confirm')}>审核通过入库</button></>}</div></Modal>
}
