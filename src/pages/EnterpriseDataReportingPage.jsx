import { useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { PageHeader } from '../components/PageHeader.jsx'
import { MetricStrip } from '../components/MetricStrip.jsx'
import { DataPanel } from '../components/DataPanel.jsx'
import { StatusTag } from '../components/StatusTag.jsx'
import { Modal } from '../components/Modal.jsx'
import { enterprises, useSharedData } from '../mock/sharedStore.js'

const categoryOrder=['企业基础信息','能源与碳排','零碳专项建设']
const categoryByPath={
  '/enterprise-basic-info':'企业基础信息',
  '/enterprise-energy-carbon':'能源与碳排',
  '/enterprise-zero-carbon':'零碳专项建设',
}
const pathByCategory=Object.fromEntries(Object.entries(categoryByPath).map(([path,category])=>[category,path]))
const moduleMeta={
  '企业基础信息':{desc:'企业档案与生产边界信息，系统已带入的内容无需重复填写。'},
  '能源与碳排':{desc:'汇集能源消费、生产经营和范围一、范围二排放数据。'},
  '零碳专项建设':{desc:'归集固废、水、余热余压利用、绿色制造认证，以及光伏、绿建、新能源交通、碳足迹等专项成果。'},
}
const displayValue = item => item.value ? `${item.value}${item.unit ? ` ${item.unit}` : ''}` : '暂无数据'
export function EnterpriseDataReportingPage() {
  const navigate = useNavigate(), location = useLocation()
  const { items, currentTask, currentEnterpriseId, updateItem, uploadVoucher, submitTask } = useSharedData()
  const category = categoryByPath[location.pathname]
  const [detail, setDetail] = useState(null), [message, setMessage] = useState('')
  const categories = useMemo(() => categoryOrder.filter(value => items.some(item => item.category === value)), [items])
  const topicView=Boolean(category)
  const current = topicView ? items.filter(item => item.category === category) : []
  const pending = items.filter(item => item.source !== '系统已有' && !item.value).length, vouchers = items.filter(item => item.source !== '系统已有' && item.voucher && !item.voucherUploaded).length, taskCount = items.length, doneCount = items.filter(item => item.value && (!item.voucher || item.voucherUploaded)).length
  const enterprise = enterprises.find(item => item.id === currentEnterpriseId), returned = currentTask?.status === '已退回', locked = ['已提交', '已入库', '已关闭'].includes(currentTask?.status)
  const itemStatus = item => {
    if (item.source === '系统已有') return '系统已带入'
    if (returned) return '待修改'
    if (currentTask?.status === '已入库') return '已入库'
    if (currentTask?.status === '已提交') return '审核中'
    if (!item.value) return '待填写'
    if (item.voucher && !item.voucherUploaded) return '待上传材料'
    return '已完成'
  }
  const statusTone = status => ['已入库','审核通过','已完成','系统已带入'].includes(status) ? 'ok' : ['待填写','待修改','待上传材料','审核中','已提交'].includes(status) ? 'warn' : 'gray'
  const isActionable = item => item.source !== '系统已有' && (returned || !item.value || (item.voucher && !item.voucherUploaded))
  const pendingRows = current.filter(isActionable)
  const priorityItems = useMemo(() => items.filter(isActionable).sort((a, b) => {
    const rank = item => !item.value ? 0 : item.voucher && !item.voucherUploaded ? 1 : 2
    return rank(a) - rank(b)
  }).slice(0, 8), [items, returned])
  const submit = () => { const result = submitTask(currentTask?.taskId); setMessage(result.ok ? '提交成功，已进入园区审核。' : result.reason) }
  const saveDraft = () => setMessage('草稿已保存。')
  const saveItem = event => { event.preventDefault(); const form = new FormData(event.currentTarget); updateItem(detail.id, form.get('value')); setDetail(null); setMessage(`${detail.name}已保存到本次任务，提交审核后将回写企业数据管理。`) }
  const renderAction = item => { const needsVoucher = item.source !== '系统已有' && item.value && item.voucher && !item.voucherUploaded; return item.source === '系统已有' ? <button className="op-btn" onClick={() => navigate('/data-issues')}>反馈问题</button> : needsVoucher ? <button className="op-btn" disabled={locked} onClick={() => uploadVoucher(item.id)}>上传材料</button> : <button className="op-btn" disabled={locked} onClick={() => setDetail(item)}>{item.value ? '查看 / 修改' : '填写'}</button> }
  const renderTable = rows => <div className="table-wrap"><table className="report-action-table"><thead><tr><th>数据项</th><th>填报说明</th><th>当前情况</th><th>影响指标</th><th>状态</th><th>操作</th></tr></thead><tbody>{rows.length ? rows.map(item => { const status = itemStatus(item); return <tr key={item.id}><td className="item-name">{item.name}<small className="table-subnote">{item.source === '系统已有' ? '系统自动获取，无需重复填写' : item.voucher ? '需填写数据并上传证明材料' : '需填写年度数据'}</small></td><td>{item.purpose}</td><td>{displayValue(item)}</td><td>{item.businessLinks?.join('、') || '相关指标计算'}</td><td><StatusTag tone={statusTone(status)}>{status}</StatusTag></td><td>{renderAction(item)}</td></tr> }) : <tr><td colSpan="6" className="empty-cell">当前分类暂无数据项</td></tr>}</tbody></table></div>
  return <div className="content enterprise-content"><PageHeader title={topicView?category:'填报任务'} subtitle={topicView?`${enterprise?.name || '当前企业'} · 按分类维护填报数据和证明材料。`:'查看园区下发任务、填报进度和待补充事项，完成后统一提交。'} actions={topicView?<button className="btn" onClick={()=>navigate('/enterprise-data-reporting')}>返回填报任务</button>:<div className="reporting-head-actions"><button className="btn" onClick={saveDraft}>保存草稿</button><button className="btn primary" disabled={!currentTask || locked} onClick={submit}>{locked ? '已提交' : '提交填报'}</button></div>} />
    {message && <div className={`notice ${message.includes('成功') || message.includes('保存') ? 'success' : 'warning'}`}>{message}</div>}{!topicView&&<><div className="report-task-summary"><div><span>任务名称</span><b>企业年度数据协同填报</b></div><div><span>统计年度</span><b>{currentTask?.period?.replace('年度','') || '2026'}</b></div><div><span>截止日期</span><b>{currentTask?.deadline || '—'}</b></div><div><span>当前状态</span><StatusTag tone={returned ? 'warn' : currentTask?.status === '已入库' ? 'ok' : 'gray'}>{returned ? '需修改' : currentTask?.status || '—'}</StatusTag></div></div>
    {returned && <div className="notice warning">本次填报有数据需要修改：{currentTask.reviewNote || '请核对填报数据和凭证。'}</div>}
    <MetricStrip metrics={[{label:'填报进度',value:`${doneCount}/${taskCount}`,note:`系统已带入 ${items.filter(item => item.source === '系统已有').length} 项`},{label:'待填写',value:`${pending}项`,note:'需要企业补充的数据'},{label:'待上传材料',value:`${vouchers}项`,note:'数据已填，待补证明材料'},{label:'截止日期',value:currentTask?.deadline || '—',note:returned ? '本次任务需修改' : '请在截止日期前提交'}]} />
    <details className="report-instruction"><summary>填报说明与协同流程</summary><p>系统自动获取的数据已带入；企业补充数据和材料提交后由园区审核，审核通过后进入正式数据管理，并用于零碳指标计算和 IOC 展示。</p><p>企业填写 → 提交 → 园区审核 → 审核通过 → 正式入库 → 指标计算与 IOC 展示 <button className="op-btn" onClick={() => navigate('/data-issues')}>反馈数据问题 →</button></p></details></>}
    {topicView ? <DataPanel title={category} description={`${enterprise?.name || '当前企业'} · ${moduleMeta[category]?.desc || '按模块维护所需的数据和材料。'}`}><div className="report-current-summary"><b>当前待处理 {pendingRows.length} 项</b><span>优先填写缺失数据，再补充对应的证明材料。</span></div>{renderTable(current)}</DataPanel> : <><DataPanel title="填报分类" description="点击分类进入对应的数据维护明细页；完成补充后返回协同任务统一提交。"><div className="report-module-switcher" aria-label="填报分类">{categories.map(module => { const rows = items.filter(item => item.category === module), openCount = rows.filter(isActionable).length, completeCount = rows.length - openCount; return <button key={module} onClick={() => navigate(pathByCategory[module])}><b>{module}</b><span>待处理 {openCount} 项</span><small>已完成 {completeCount} / 共 {rows.length} 项</small></button> })}</div></DataPanel><DataPanel title="本次协同待办" description="按填写和材料缺失优先排序；可直接在此处理，不必先进入分类页面。"><div className="report-todo-summary"><span>待填写 <b>{pending} 项</b></span><span>待上传材料 <b>{vouchers} 项</b></span><span>完成后可统一提交园区审核</span></div><div className="table-wrap"><table className="report-todo-table"><thead><tr><th>优先处理项</th><th>所属分类</th><th>数据来源</th><th>当前情况</th><th>影响指标</th><th>状态</th><th>操作</th></tr></thead><tbody>{priorityItems.length ? priorityItems.map(item => <tr key={item.id}><td className="item-name">{item.name}<small className="table-subnote">{item.purpose}</small></td><td>{item.category}</td><td>{item.source}</td><td>{displayValue(item)}</td><td>{item.businessLinks?.join('、') || '相关指标计算'}</td><td><StatusTag tone={statusTone(itemStatus(item))}>{itemStatus(item)}</StatusTag></td><td>{renderAction(item)}</td></tr>) : <tr><td colSpan="7" className="empty-cell">当前没有待处理项，可以提交园区审核。</td></tr>}</tbody></table></div></DataPanel></>}
    <Modal open={!!detail} title={detail?.name || '填报数据'} onClose={() => setDetail(null)} className="small">{detail && <form onSubmit={saveItem}><div className="modal-body"><div className="kv"><div className="kv-item"><label>填报说明</label>{detail.purpose}</div><div className="kv-item"><label>影响指标</label>{detail.businessLinks?.join('、') || '相关指标计算'}</div><div className="field"><label>填报数值{detail.unit ? `（${detail.unit}）` : ''}</label><input name="value" type={detail.inputType || 'number'} step={detail.inputType === 'text' ? undefined : 'any'} defaultValue={detail.value} required disabled={locked}/></div><div className="kv-item"><label>证明材料</label>{detail.voucher ? '保存后请在列表上传对应材料。' : '本项无需上传材料。'}</div></div></div><div className="modal-foot"><button type="button" className="btn" onClick={() => setDetail(null)}>取消</button><button className="btn primary" disabled={locked}>保存</button></div></form>}</Modal>
  </div>
}
